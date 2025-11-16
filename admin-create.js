// =======================================================
// Prompeii Admin - Create Prompt (Vite-safe, ASCII-only)
// =======================================================
// Global dependencies:
//   window.supabaseClient
//   window.showLoading()
//   window.hideLoading()
//   window.openAIModal()
// =======================================================

// Import only ES Modules (not from public)
import {
  populateCategoryOptions,
  populateToneOptions,
  populateUseCaseOptions,
  populateSkillLevelOptions
} from "/options.js";

// Global references
const supabase = window.supabaseClient;
const showLoading = window.showLoading;
const hideLoading = window.hideLoading;
const openAIModal = window.openAIModal;

// Element refs
const smartTitleEl = document.getElementById("smartTitle");
const categoryEl = document.getElementById("category");
const statusEl = document.getElementById("status");
const tagsEl = document.getElementById("tags");
const toneEl = document.getElementById("tone");
const useCaseEl = document.getElementById("useCase");
const skillLevelEl = document.getElementById("skillLevel");
const modelEl = document.getElementById("model");
const introEl = document.getElementById("intro");
const promptTextEl = document.getElementById("promptText");

const saveBtn = document.getElementById("saveBtn");
const toastEl = document.getElementById("toast");

const aiTitleBtn = document.getElementById("aiTitleBtn");
const aiIntroBtn = document.getElementById("aiIntroBtn");
const aiPromptBtn = document.getElementById("aiPromptBtn");

// =======================================================
// Validation
// =======================================================
function validatePromptFields(data) {
  const errors = {};

  if (!data.smart_title || data.smart_title.length < 3) {
    errors.smartTitle = "Title too short";
  }

  if (!data.prompt || data.prompt.length < 30) {
    errors.promptText = "Prompt must be 30+ characters";
  }

  if (!data.category) {
    errors.category = "Category required";
  }

  if (!data.tags || data.tags.length === 0) {
    errors.tags = "Tags required";
  }

  return errors;
}

function applyFieldErrors(errors) {
  document.querySelectorAll("input, textarea, select").forEach(function (el) {
    el.classList.remove("input-error");
  });

  Object.keys(errors).forEach(function (key) {
    var el = document.getElementById(key);
    if (el) el.classList.add("input-error");
  });
}

// =======================================================
// Build payload
// =======================================================
function collectPayload() {
  return {
    smart_title: smartTitleEl.value.trim(),
    category: categoryEl.value.trim(),
    status: statusEl.value.trim(),
    tags: tagsEl.value
      .split(",")
      .map(function (t) { return t.trim(); })
      .filter(function (t) { return t.length > 0; }),
    tone: toneEl.value.trim(),
    use_case: useCaseEl.value.trim(),
    skill_level: skillLevelEl.value.trim(),
    model_used: modelEl.value.trim(),
    intro: introEl.value.trim(),
    prompt: promptTextEl.value.trim()
  };
}

// =======================================================
// Save
// =======================================================
saveBtn.addEventListener("click", async function () {
  showLoading();

  const data = collectPayload();
  const errors = validatePromptFields(data);

  applyFieldErrors(errors);

  if (Object.keys(errors).length > 0) {
    hideLoading();
    showToast("Fix validation errors", true);
    return;
  }

  const result = await supabase.from("prompts").insert(data).select().single();

  hideLoading();

  if (result.error || !result.data) {
    console.error(result.error);
    showToast("Save failed", true);
    return;
  }

  showToast("Created");

  window.location.href = "./admin-edit.html?id=" + result.data.id;
});

// =======================================================
// AI Buttons
// =======================================================
aiTitleBtn.addEventListener("click", function () {
  openAIModal("Improve Title", smartTitleEl);
});

aiIntroBtn.addEventListener("click", function () {
  openAIModal("Improve Intro", introEl);
});

aiPromptBtn.addEventListener("click", function () {
  openAIModal("Improve Prompt", promptTextEl);
});

// =======================================================
// Toast
// =======================================================
function showToast(message, isError) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  toastEl.style.backgroundColor = isError ? "#dc2626" : "#111827";

  setTimeout(function () {
    toastEl.classList.add("hidden");
  }, 2000);
}

// =======================================================
// Init
// =======================================================
(async function init() {
  await populateCategoryOptions(categoryEl);
  await populateToneOptions(toneEl);
  await populateUseCaseOptions(useCaseEl);
  await populateSkillLevelOptions(skillLevelEl);
})();
