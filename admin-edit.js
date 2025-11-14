// --- Supabase configuration ---
// 1) Replace these with your actual values from the Supabase dashboard.
const SUPABASE_URL = "https://YOUR-PROJECT-id.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";

// 2) Create Supabase client (v2 via CDN)
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// --- DOM references ---
const form = document.getElementById("editPromptForm");
const btnSave = document.getElementById("btnSave");
const btnCancel = document.getElementById("btnCancel");
const btnDelete = document.getElementById("btnDelete");
const toastEl = document.getElementById("toast");
const statusBadge = document.getElementById("statusBadge");

const fieldPromptId = document.getElementById("fieldPromptId");
const fieldVersion = document.getElementById("fieldVersion");
const fieldCreated = document.getElementById("fieldCreated");
const fieldLastUpdated = document.getElementById("fieldLastUpdated");
const fieldChecksum = document.getElementById("fieldChecksum");

const detectedVariablesEl = document.getElementById("detectedVariables");
const estimatedTokensEl = document.getElementById("estimatedTokens");
const lengthLabelEl = document.getElementById("lengthLabel");
const hasVariablesEl = document.getElementById("hasVariables");

// Modal elements
const confirmModal = document.getElementById("confirmModal");
const modalCancel = document.getElementById("modalCancel");
const modalConfirm = document.getElementById("modalConfirm");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");

// Keeps original data snapshot for dirty detection
let initialData = null;
// Tracks what action the confirm modal is for: "cancel" | "delete" | null
let pendingAction = null;

/* ------------------- UTILITIES ------------------- */

function showToast(message, type = "default") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("toast-visible");

  setTimeout(() => {
    toastEl.classList.remove("toast-visible");
  }, 2600);
}

function setStatusBadge(status) {
  statusBadge.classList.remove("badge-published", "badge-draft", "badge-archived");

  if (!status) {
    statusBadge.textContent = "Status: —";
    return;
  }

  const mapped = status.toLowerCase();
  if (mapped === "published") {
    statusBadge.classList.add("badge-published");
    statusBadge.textContent = "Status: Published";
  } else if (mapped === "draft") {
    statusBadge.classList.add("badge-draft");
    statusBadge.textContent = "Status: Draft";
  } else if (mapped === "archived") {
    statusBadge.classList.add("badge-archived");
    statusBadge.textContent = "Status: Archived";
  } else {
    statusBadge.textContent = `Status: ${status}`;
  }
}

function formatDate(timestamp) {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

// Rough token estimate: count words / 0.75
function estimateTokensFromPrompt(text) {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  return Math.round(words / 0.75);
}

function detectVariables(text) {
  if (!text) return [];
  const matches = text.match(/{{\s*[^}]+\s*}}/g);
  if (!matches) return [];
  const unique = [...new Set(matches.map((m) => m.trim()))];
  return unique;
}

function lengthLabelFromTokens(tokens) {
  if (tokens <= 80) return "Short";
  if (tokens <= 260) return "Medium";
  return "Long";
}

/**
 * Calculate average quality score based on clarity, creativity, usefulness
 * Only counts fields that have numeric values.
 */
function calculateQualityScore(data) {
  const keys = ["clarity", "creativity", "usefulness"];

  const values = keys
    .map((k) => Number(data[k]))
    .filter((n) => !Number.isNaN(n) && n > 0);

  if (!values.length) return "";
  const sum = values.reduce((a, b) => a + b, 0);
  const avg = sum / values.length;
  return Number(avg.toFixed(1));
}

function cloneData(obj) {
  return JSON.parse(JSON.stringify(obj || {}));
}

function parseTagsInput(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

function joinTags(tagsArray) {
  if (!Array.isArray(tagsArray) || !tagsArray.length) return "";
  return tagsArray.join(", ");
}

function valueOrNull(v) {
  if (v === "" || v === null || typeof v === "undefined") return null;
  const asNumber = Number(v);
  if (!Number.isNaN(asNumber)) return asNumber;
  return v;
}

/* ------------------- PROMPT META (UI ONLY) ------------------- */

function updatePromptMetaUI(promptText) {
  const tokens = estimateTokensFromPrompt(promptText || "");
  const vars = detectVariables(promptText || "");
  const lenLabel = lengthLabelFromTokens(tokens);

  estimatedTokensEl.textContent = tokens || "—";
  lengthLabelEl.textContent = lenLabel || "—";
  detectedVariablesEl.textContent =
    vars.length > 0 ? vars.join(", ") : "—";

  hasVariablesEl.checked = vars.length > 0;
}

/* ------------------- LOAD + INITIALISE ------------------- */

function getPromptIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

async function loadPrompt(promptId) {
  if (!promptId) {
    showToast("Missing prompt id in URL.", "error");
    throw new Error("Missing prompt id");
  }

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .maybeSingle();

  if (error) {
    console.error("Supabase load error:", error);
    showToast("Error loading prompt. Check console.", "error");
    throw error;
  }
  if (!data) {
    showToast("Prompt not found.", "error");
    throw new Error("No prompt found");
  }

  return data;
}

function populateForm(data) {
  if (!data) return;

  // System / meta
  fieldPromptId.textContent = data.id || "—";
  fieldVersion.textContent = "—"; // no version column in schema; keep placeholder
  fieldCreated.textContent = formatDate(data.created_at);
  fieldLastUpdated.textContent = formatDate(data.updated_at);
  fieldChecksum.textContent = "—"; // no checksum column; placeholder
  setStatusBadge(data.status);

  // Basic metadata (note: smart_title in DB, mapped to "Smart Title" field)
  document.getElementById("smartTitleHuman").value = data.smart_title || "";
  document.getElementById("category").value = data.category || "";
  document.getElementById("status").value = data.status || "";
  document.getElementById("tags").value = joinTags(data.tags);

  document.getElementById("tone").value = data.tone || "";
  document.getElementById("useCase").value = data.use_case || "";
  document.getElementById("skillLevel").value = data.skill_level || "";

  const modelInput = document.getElementById("model");
  if (modelInput) {
    modelInput.value = data.model || "";
  }

  // Scores
  document.getElementById("clarity").value = data.clarity ?? "";
  document.getElementById("creativity").value = data.creativity ?? "";
  document.getElementById("usefulness").value = data.usefulness ?? "";

  const qualityScore =
    data.quality_score ??
    calculateQualityScore({
      clarity: data.clarity,
      creativity: data.creativity,
      usefulness: data.usefulness,
    });

  document.getElementById("qualityScore").value = qualityScore || "";

  // Content
  document.getElementById("intro").value = data.intro || "";
  document.getElementById("prompt").value = data.prompt || "";

  updatePromptMetaUI(data.prompt || "");
}

/**
 * Reads current form values into an object that matches your Supabase schema.
 * This is the ONLY shape we send to the DB.
 */
function getFormDataFromDom() {
  const tagsValue = document.getElementById("tags").value;

  const clarity = document.getElementById("clarity").value;
  const creativity = document.getElementById("creativity").value;
  const usefulness = document.getElementById("usefulness").value;

  const promptText = document.getElementById("prompt").value || "";

  const tmpQualityScore = calculateQualityScore({
    clarity,
    creativity,
    usefulness,
  });

  const modelInput = document.getElementById("model");

  return {
    id: fieldPromptId.textContent || null,
    smart_title: document.getElementById("smartTitleHuman").value || "",
    prompt: promptText,
    intro: document.getElementById("intro").value || "",
    category: document.getElementById("category").value || "",
    tags: parseTagsInput(tagsValue),
    tone: document.getElementById("tone").value || "",
    use_case: document.getElementById("useCase").value || "",
    skill_level: document.getElementById("skillLevel").value || "",
    model: modelInput ? modelInput.value || "" : null,
    clarity: valueOrNull(clarity),
    creativity: valueOrNull(creativity),
    usefulness: valueOrNull(usefulness),
    quality_score: tmpQualityScore ? Number(tmpQualityScore) : null,
    status: document.getElementById("status").value || "",
  };
}

function isDirty() {
  if (!initialData) return false;
  const current = getFormDataFromDom();

  const keys = Object.keys(current);
  for (const key of keys) {
    const initialVal = JSON.stringify(initialData[key] ?? null);
    const currentVal = JSON.stringify(current[key] ?? null);
    if (initialVal !== currentVal) {
      return true;
    }
  }
  return false;
}

function updateDirtyState() {
  const dirty = isDirty();
  btnSave.disabled = !dirty;
}

/* ------------------- VALIDATION ------------------- */

function clearErrors() {
  const errorEls = form.querySelectorAll(".field-error");
  errorEls.forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });

  const inputs = form.querySelectorAll(".input");
  inputs.forEach((input) => {
    input.classList.remove("input-error");
  });
}

function setFieldError(fieldId, message) {
  const errorEl = form.querySelector(
    `.field-error[data-error-for="${fieldId}"]`
  );
  const inputEl = document.getElementById(fieldId);

  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = "block";
  }
  if (inputEl) {
    inputEl.classList.add("input-error");
  }
}

function validateForm() {
  clearErrors();
  let isValid = true;

  const requiredFields = [
    { id: "smartTitleHuman", label: "Smart Title" },
    { id: "category", label: "Category" },
    { id: "status", label: "Status" },
    { id: "intro", label: "Intro" },
    { id: "prompt", label: "Prompt" },
  ];

  requiredFields.forEach((field) => {
    const el = document.getElementById(field.id);
    if (!el) return;
    if (!el.value || !el.value.trim()) {
      setFieldError(field.id, `${field.label} is required.`);
      if (isValid) {
        el.focus();
      }
      isValid = false;
    }
  });

  return isValid;
}

/* ------------------- SAVE / DELETE (Supabase) ------------------- */

async function savePrompt() {
  if (!validateForm()) {
    return;
  }

  const payload = getFormDataFromDom();
  const { id, ...updateData } = payload;
  if (!id) {
    showToast("Missing prompt ID.", "error");
    return;
  }

  // Always set updated_at on save
  updateData.updated_at = new Date().toISOString();

  console.log("Saving prompt payload:", updateData);

  btnSave.disabled = true;
  btnSave.textContent = "Saving…";

  try {
    const { data, error } = await supabase
      .from("prompts")
      .update(updateData)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase save error:", error);
      showToast("Error saving prompt. Check console.", "error");
      return;
    }

    // Refresh UI with returned row (in case DB changed anything)
    populateForm(data);
    initialData = cloneData(getFormDataFromDom());
    updateDirtyState();

    showToast("Changes saved.");
  } catch (err) {
    console.error("Error saving prompt:", err);
    showToast("Error saving prompt. Check console.", "error");
  } finally {
    btnSave.textContent = "Save Changes";
  }
}

async function deletePrompt() {
  const id = fieldPromptId.textContent || null;
  if (!id) {
    showToast("No prompt ID found.", "error");
    return;
  }

  console.log("Deleting prompt:", id);

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Supabase delete error:", error);
    showToast("Error deleting prompt. Check console.", "error");
    return;
  }

  showToast("Prompt deleted.");
  window.location.href = "admin.html";
}

/* ------------------- MODAL HELPERS ------------------- */

function openModal(title, message, actionKey) {
  pendingAction = actionKey;
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  confirmModal.classList.add("modal-open");
  confirmModal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  confirmModal.classList.remove("modal-open");
  confirmModal.setAttribute("aria-hidden", "true");
  pendingAction = null;
}

/* ------------------- EVENT BINDINGS ------------------- */

async function init() {
  try {
    const promptIdFromUrl = getPromptIdFromUrl();
    const promptData = await loadPrompt(promptIdFromUrl);
    populateForm(promptData);
    initialData = cloneData(getFormDataFromDom());
    updateDirtyState();
  } catch (e) {
    console.error("Init error:", e);
    // Form is basically unusable if we can't load; leave as-is.
  }
}

btnSave.addEventListener("click", () => {
  savePrompt();
});

btnCancel.addEventListener("click", () => {
  if (isDirty()) {
    openModal(
      "Discard changes?",
      "You have unsaved changes. Are you sure you want to leave without saving?",
      "cancel"
    );
  } else {
    window.location.href = "admin.html";
  }
});

btnDelete.addEventListener("click", () => {
  openModal(
    "Delete this prompt?",
    "This will permanently remove the prompt from Prompeii. This action cannot be undone.",
    "delete"
  );
});

modalCancel.addEventListener("click", () => {
  closeModal();
});

modalConfirm.addEventListener("click", () => {
  if (pendingAction === "cancel") {
    closeModal();
    window.location.href = "admin.html";
  } else if (pendingAction === "delete") {
    closeModal();
    deletePrompt();
  } else {
    closeModal();
  }
});

// Track dirty state + derived fields on input changes
form.addEventListener("input", (event) => {
  const target = event.target;
  if (!target) return;

  // Live-update quality score
  if (
    ["clarity", "creativity", "usefulness"].includes(target.id)
  ) {
    const data = getFormDataFromDom();
    const q = calculateQualityScore(data);
    document.getElementById("qualityScore").value = q || "";
  }

  // Recompute variables + tokens when prompt changes
  if (target.id === "prompt") {
    updatePromptMetaUI(target.value || "");
  }

  // Update status badge if status changed
  if (target.id === "status") {
    setStatusBadge(target.value);
  }

  updateDirtyState();
});

// Warn before closing tab if dirty
window.addEventListener("beforeunload", (event) => {
  if (!isDirty()) return;
  event.preventDefault();
  event.returnValue = "";
});

document.addEventListener("DOMContentLoaded", () => {
  init();
});
