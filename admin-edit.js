// =========================================================
// Prompeii Admin – Edit Page (SAFE GLOBAL SUPABASE VERSION)
// =========================================================

// --------------------------------------
// GLOBAL SUPABASE CLIENT
// --------------------------------------
const supabase = window.supabaseClient;   // <-- now reliable

// --------------------------------------
// Auth Guard (safe)
// --------------------------------------
async function requireAuth() {
  try {
    const { data } = await supabase.auth.getSession();

    if (!data?.session) {
      window.location.href = "login.html";
      return false;
    }

    return true;
  } catch (err) {
    console.error("Auth check failed:", err);
    window.location.href = "login.html";
    return false;
  }
}

// --------------------------------------
// SAFE DOM GETTER
// --------------------------------------
function $(id) {
  return document.getElementById(id);
}

// --------------------------------------
// IMPORT SELECT OPTIONS
// --------------------------------------
import {
  CATEGORY_OPTIONS,
  TONE_OPTIONS,
  USE_CASE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  fillSelect
} from "./options.js";

// --------------------------------------
// DOM ELEMENTS
// --------------------------------------
const metaId = $("promptId");
const metaCreated = $("createdAt");
const metaUpdated = $("updatedAt");

const smartTitle = $("smartTitle");
const category = $("category");
const statusEl = $("status");
const tags = $("tags");
const tone = $("tone");
const useCase = $("useCase");
const skillLevel = $("skillLevel");
const model = $("model");
const intro = $("intro");
const promptTextarea = $("promptText");

const saveBtn = $("saveBtn");
const deleteBtn = $("deleteBtn");
const duplicateBtn = $("duplicateBtn");

const aiTitleBtn = $("aiTitleBtn");
const aiIntroBtn = $("aiIntroBtn");
const aiPromptBtn = $("aiPromptBtn");

// --------------------------------------
// Toast (comes from global)
// --------------------------------------
const toast = window.toast;

// --------------------------------------
// Get ID from URL
// --------------------------------------
function getId() {
  return new URLSearchParams(window.location.search).get("id");
}

// --------------------------------------
// Load Prompt
// --------------------------------------
async function loadPrompt() {
  const id = getId();
  if (!id) return;

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Load error:", error);
    toast("Failed to load prompt");
    return;
  }

  // Meta
  metaId.textContent = data.id;
  metaCreated.textContent = new Date(data.created_at).toLocaleString();
  metaUpdated.textContent = new Date(data.updated_at).toLocaleString();

  // Fields
  smartTitle.value = data.smart_title || "";
  category.value = data.category || "";
  statusEl.value = data.status || "draft";
  tags.value = (data.tags || []).join(", ");
  tone.value = data.tone || "";
  useCase.value = data.use_case || "";
  skillLevel.value = data.skill_level || "";
  model.value = data.model || "";
  intro.value = data.intro || "";
  promptTextarea.value = data.prompt || "";
}

// --------------------------------------
// Save Prompt
// --------------------------------------
async function savePrompt() {
  const id = getId();
  if (!id) return;

  const payload = {
    smart_title: smartTitle.value.trim(),
    category: category.value.trim(),
    status: statusEl.value.trim(),
    tags: tags.value.split(",").map(t => t.trim()).filter(Boolean),
    tone: tone.value.trim(),
    use_case: useCase.value.trim(),
    skill_level: skillLevel.value.trim(),
    model: model.value.trim(),
    intro: intro.value,
    prompt: promptTextarea.value,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from("prompts")
    .update(payload)
    .eq("id", id);

  if (error) {
    console.error("Save error:", error);
    toast("Save failed");
  } else {
    toast("Saved!");
    loadPrompt();
  }
}

// --------------------------------------
// Duplicate
// --------------------------------------
async function duplicatePrompt() {
  const id = getId();
  if (!id) return;

  const { data } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", id)
    .single();

  const clone = {
    smart_title: (data.smart_title || "Untitled") + " (Copy)",
    intro: data.intro || "",
    prompt: data.prompt || "",
    category: data.category || "",
    status: "draft",
    tags: data.tags || [],
    tone: data.tone || "",
    use_case: data.use_case || "",
    skill_level: data.skill_level || "",
    model: data.model || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabase
    .from("prompts")
    .insert(clone)
    .select()
    .single();

  if (error) {
    console.error("Duplicate error:", error);
    toast("Duplicate failed");
    return;
  }

  window.location.href = `admin-edit.html?id=${inserted.id}`;
}

// --------------------------------------
// Delete
// --------------------------------------
async function deletePrompt() {
  const id = getId();
  if (!id) return;

  if (!confirm("Delete this prompt permanently?")) return;

  await supabase.from("prompts").delete().eq("id", id);

  window.location.href = "admin.html";
}

// --------------------------------------
// Populate Select Dropdowns
// --------------------------------------
function wireSelects() {
  fillSelect(category, CATEGORY_OPTIONS);
  fillSelect(tone, TONE_OPTIONS);
  fillSelect(useCase, USE_CASE_OPTIONS);
  fillSelect(skillLevel, SKILL_LEVEL_OPTIONS);
}

// --------------------------------------
// Improve Modal
// --------------------------------------
function wireImproveButtons() {
  if (!window.PrompeiiImproveModal) return;

  const { showImproveModal, modalContainer } = window.PrompeiiImproveModal;

  function useImprove(inputEl) {
    const original = inputEl.value || "";
    showImproveModal(original);

    const applyHandler = (e) => {
      const improved = e.detail?.improved || "";
      if (improved) inputEl.value = improved;
      modalContainer.removeEventListener("improve:apply", applyHandler);
    };

    modalContainer.addEventListener("improve:apply", applyHandler);
  }

  aiIntroBtn?.addEventListener("click", () => useImprove(intro));
  aiPromptBtn?.addEventListener("click", () => useImprove(promptTextarea));
}

// --------------------------------------
// Init
// --------------------------------------
async function init() {
  // Auth
  const ok = await requireAuth();
  if (!ok) return;

  // Buttons
  saveBtn?.addEventListener("click", savePrompt);
  duplicateBtn?.addEventListener("click", duplicatePrompt);
  deleteBtn?.addEventListener("click", deletePrompt);

  // Load
  await loadPrompt();

  // Populate selects
  wireSelects();

  // Improve buttons
  wireImproveButtons();
}

// --------------------------------------
// Startup
// --------------------------------------
document.addEventListener("DOMContentLoaded", init);
