// =========================================================
// Prompeii Admin – Edit Prompt Page
// =========================================================

// --- Supabase config ---
const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM references (filled on init) ---
let elPromptId;
let elCreatedAt;
let elUpdatedAt;

let elSmartTitle;
let elCategory;
let elStatus;
let elTags;
let elTone;
let elUseCase;
let elSkillLevel;
let elModel;
let elIntro;
let elPromptText;

let btnSave;
let btnDelete;
let btnDuplicate;
let btnAiTitle;
let btnAiIntro;
let btnAiPrompt;

// current prompt id
let currentId = null;

// =========================================================
// Utilities
// =========================================================

function showToast(message) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = message;
  t.classList.add("toast-visible");
  setTimeout(() => t.classList.remove("toast-visible"), 2500);
}

function getQueryParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function parseTags(text) {
  if (!text) return [];
  return text
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function joinTags(arr) {
  if (!Array.isArray(arr)) return "";
  return arr.join(", ");
}

// Simple option sets – adjust as needed
const CATEGORY_OPTIONS = [
  "",
  "Marketing",
  "Writing",
  "Development",
  "Research",
  "Productivity",
];

const TONE_OPTIONS = ["", "Professional", "Casual", "Friendly", "Technical"];

const USE_CASE_OPTIONS = [
  "",
  "Blog",
  "Email",
  "Social",
  "Code",
  "Analysis",
  "Brainstorming",
];

const SKILL_LEVEL_OPTIONS = ["", "Beginner", "Intermediate", "Advanced"];

function fillSelectOptions(selectEl, options) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  options.forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt;
    o.textContent = opt || "—";
    selectEl.appendChild(o);
  });
}

// =========================================================
// Load prompt
// =========================================================

async function loadPrompt(id) {
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id, smart_title, intro, prompt, category, tags, status, tone, use_case, skill_level, model, created_at, updated_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading prompt:", error);
      showToast("Error loading prompt");
      return;
    }

    if (!data) {
      showToast("Prompt not found");
      return;
    }

    currentId = data.id;

    // meta
    elPromptId.textContent = data.id || "—";
    elCreatedAt.textContent = formatDateTime(data.created_at);
    elUpdatedAt.textContent = formatDateTime(data.updated_at);

    // fields
    elSmartTitle.value = data.smart_title || "";
    elIntro.value = data.intro || "";
    elPromptText.value = data.prompt || "";

    if (data.category && CATEGORY_OPTIONS.includes(data.category)) {
      elCategory.value = data.category;
    } else {
      // ensure it's present even if not in default list
      if (data.category) {
        if (!CATEGORY_OPTIONS.includes(data.category)) {
          const extraOpt = document.createElement("option");
          extraOpt.value = data.category;
          extraOpt.textContent = data.category;
          elCategory.appendChild(extraOpt);
        }
        elCategory.value = data.category;
      }
    }

    elStatus.value = (data.status || "draft").toLowerCase();
    elTags.value = joinTags(data.tags);

    if (data.tone && TONE_OPTIONS.includes(data.tone)) {
      elTone.value = data.tone;
    } else if (data.tone) {
      const extra = document.createElement("option");
      extra.value = data.tone;
      extra.textContent = data.tone;
      elTone.appendChild(extra);
      elTone.value = data.tone;
    }

    if (data.use_case && USE_CASE_OPTIONS.includes(data.use_case)) {
      elUseCase.value = data.use_case;
    } else if (data.use_case) {
      const extra = document.createElement("option");
      extra.value = data.use_case;
      extra.textContent = data.use_case;
      elUseCase.appendChild(extra);
      elUseCase.value = data.use_case;
    }

    if (data.skill_level && SKILL_LEVEL_OPTIONS.includes(data.skill_level)) {
      elSkillLevel.value = data.skill_level;
    } else if (data.skill_level) {
      const extra = document.createElement("option");
      extra.value = data.skill_level;
      extra.textContent = data.skill_level;
      elSkillLevel.appendChild(extra);
      elSkillLevel.value = data.skill_level;
    }

    elModel.value = data.model || "gpt-5";
  } catch (err) {
    console.error("Unexpected load error:", err);
    showToast("Error loading prompt");
  }
}

// =========================================================
// Save / Update
// =========================================================

async function handleSave() {
  if (!currentId) {
    showToast("No prompt loaded");
    return;
  }

  const tagsArr = parseTags(elTags.value);

  const updateData = {
    smart_title: elSmartTitle.value.trim() || null,
    intro: elIntro.value.trim() || null,
    prompt: elPromptText.value.trim() || null,
    category: elCategory.value || null,
    status: elStatus.value || "draft",
    tags: tagsArr.length ? tagsArr : null,
    tone: elTone.value || null,
    use_case: elUseCase.value || null,
    skill_level: elSkillLevel.value || null,
    model: elModel.value || null,
    updated_at: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabase
      .from("prompts")
      .update(updateData)
      .eq("id", currentId)
      .select()
      .single();

    if (error) {
      console.error("Save error:", error);
      showToast("Error saving prompt");
      return;
    }

    showToast("Changes saved");
    if (data) {
      elUpdatedAt.textContent = formatDateTime(data.updated_at);
    }
  } catch (err) {
    console.error("Unexpected save error:", err);
    showToast("Error saving prompt");
  }
}

// =========================================================
// Duplicate
// =========================================================

async function handleDuplicate() {
  if (!currentId) {
    showToast("No prompt loaded");
    return;
  }

  const tagsArr = parseTags(elTags.value);

  const newData = {
    smart_title: (elSmartTitle.value || "").trim() + " (Copy)",
    intro: elIntro.value.trim() || null,
    prompt: elPromptText.value.trim() || null,
    category: elCategory.value || null,
    status: "draft",
    tags: tagsArr.length ? tagsArr : null,
    tone: elTone.value || null,
    use_case: elUseCase.value || null,
    skill_level: elSkillLevel.value || null,
    model: elModel.value || null,
  };

  try {
    const { data, error } = await supabase
      .from("prompts")
      .insert(newData)
      .select()
      .single();

    if (error) {
      console.error("Duplicate error:", error);
      showToast("Error duplicating prompt");
      return;
    }

    showToast("Prompt duplicated");
    if (data && data.id) {
      window.location.href = `admin-edit.html?id=${encodeURIComponent(
        data.id
      )}`;
    }
  } catch (err) {
    console.error("Unexpected duplicate error:", err);
    showToast("Error duplicating prompt");
  }
}

// =========================================================
// Delete
// =========================================================

async function handleDelete() {
  if (!currentId) {
    showToast("No prompt loaded");
    return;
  }

  const ok = window.confirm(
    "Delete this prompt permanently? This cannot be undone."
  );
  if (!ok) return;

  try {
    const { error } = await supabase
      .from("prompts")
      .delete()
      .eq("id", currentId);

    if (error) {
      console.error("Delete error:", error);
      showToast("Error deleting prompt");
      return;
    }

    showToast("Prompt deleted");
    // redirect back to list after a short delay
    setTimeout(() => {
      window.location.href = "admin.html";
    }, 600);
  } catch (err) {
    console.error("Unexpected delete error:", err);
    showToast("Error deleting prompt");
  }
}

// =========================================================
// AI helper buttons (safe no-ops for now)
// =========================================================

function wireAiHelpers() {
  if (btnAiTitle) {
    btnAiTitle.addEventListener("click", () => {
      showToast("AI title helper not wired yet.");
    });
  }
  if (btnAiIntro) {
    btnAiIntro.addEventListener("click", () => {
      showToast("AI intro helper not wired yet.");
    });
  }
  if (btnAiPrompt) {
    btnAiPrompt.addEventListener("click", () => {
      showToast("AI prompt helper not wired yet.");
    });
  }
}

// =========================================================
// Init
// =========================================================

function init() {
  // refs
  elPromptId = document.getElementById("promptId");
  elCreatedAt = document.getElementById("createdAt");
  elUpdatedAt = document.getElementById("updatedAt");

  elSmartTitle = document.getElementById("smartTitle");
  elCategory = document.getElementById("category");
  elStatus = document.getElementById("status");
  elTags = document.getElementById("tags");
  elTone = document.getElementById("tone");
  elUseCase = document.getElementById("useCase");
  elSkillLevel = document.getElementById("skillLevel");
  elModel = document.getElementById("model");
  elIntro = document.getElementById("intro");
  elPromptText = document.getElementById("promptText");

  btnSave = document.getElementById("saveBtn");
  btnDelete = document.getElementById("deleteBtn");
  btnDuplicate = document.getElementById("duplicateBtn");
  btnAiTitle = document.getElementById("aiTitleBtn");
  btnAiIntro = document.getElementById("aiIntroBtn");
  btnAiPrompt = document.getElementById("aiPromptBtn");

  // fill select options
  fillSelectOptions(elCategory, CATEGORY_OPTIONS);
  fillSelectOptions(elTone, TONE_OPTIONS);
  fillSelectOptions(elUseCase, USE_CASE_OPTIONS);
  fillSelectOptions(elSkillLevel, SKILL_LEVEL_OPTIONS);

  // events
  if (btnSave) btnSave.addEventListener("click", handleSave);
  if (btnDelete) btnDelete.addEventListener("click", handleDelete);
  if (btnDuplicate) btnDuplicate.addEventListener("click", handleDuplicate);

  wireAiHelpers();

  // get id and load
  const id = getQueryParam("id");
  if (!id) {
    showToast("No prompt ID provided");
    return;
  }
  currentId = id;
  loadPrompt(id);
}

document.addEventListener("DOMContentLoaded", init);
