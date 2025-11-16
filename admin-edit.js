// =======================================================
// Prompeii Admin - Edit Prompt (Vite-safe, ASCII-only)
// =======================================================
// Global dependencies:
//   window.supabaseClient
//   window.showLoading()
//   window.hideLoading()
//   window.openAIModal()
// =======================================================

// Import ES modules
import {
  populateCategoryOptions,
  populateToneOptions,
  populateUseCaseOptions,
  populateSkillLevelOptions
} from "/options.js";

// Globals
const supabase = window.supabaseClient;
const showLoading = window.showLoading;
const hideLoading = window.hideLoading;
const openAIModal = window.openAIModal;

// UI Refs
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

const clarityEl = document.getElementById("clarity");
const creativityEl = document.getElementById("creativity");
const usefulnessEl = document.getElementById("usefulness");
const qualityScoreEl = document.getElementById("quality_score");

const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const duplicateBtn = document.getElementById("duplicateBtn");

const autosaveStatus = document.getElementById("autosaveStatus");
const toastEl = document.getElementById("toast");

// Parse ID from URL
const urlParams = new URLSearchParams(window.location.search);
const promptId = urlParams.get("id");

// =======================================================
// Load Prompt
// =======================================================
async function loadPrompt() {
  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", promptId)
    .single();

  if (error) {
    console.error(error);
    showToast("Failed to load prompt", true);
    return;
  }

  // Fill UI
  smartTitleEl.value = data.smart_title || "";
  categoryEl.value = data.category || "";
  statusEl.value = data.status || "";
  tagsEl.value = (data.tags || []).join(", ");
  toneEl.value = data.tone || "";
  useCaseEl.value = data.use_case || "";
  skillLevelEl.value = data.skill_level || "";
  modelEl.value = data.model_used || "";
  introEl.value = data.intro || "";
  promptTextEl.value = data.prompt || "";

  clarityEl.value = data.clarity || "";
  creativityEl.value = data.creativity || "";
  usefulnessEl.value = data.usefulness || "";
  qualityScoreEl.value = data.quality_score || "";
}

// =======================================================
// Save Prompt
// =======================================================
saveBtn.addEventListener("click", async function () {
  showLoading();

  const payload = {
    smart_title: smartTitleEl.value.trim(),
    category: categoryEl.value.trim(),
    status: statusEl.value.trim(),
    tags: tagsEl.value.split(",").map(t => t.trim()).filter(Boolean),
    tone: toneEl.value.trim(),
    use_case: useCaseEl.value.trim(),
    skill_level: skillLevelEl.value.trim(),
    model_used: modelEl.value.trim(),
    intro: introEl.value.trim(),
    prompt: promptTextEl.value.trim()
  };

  const { error } = await supabase
    .from("prompts")
    .update(payload)
    .eq("id", promptId);

  hideLoading();

  if (error) {
    console.error(error);
    showToast("Save failed", true);
    return;
  }

  showToast("Saved");
});

// =======================================================
// Delete
// =======================================================
deleteBtn.addEventListener("click", async function () {
  if (!confirm("Delete this prompt?")) return;

  showLoading();

  const { error } = await supabase.from("prompts").delete().eq("id", promptId);

  hideLoading();

  if (error) {
    console.error(error);
    showToast("Delete failed", true);
    return;
  }

  showToast("Deleted");
  window.location.href = "./admin.html";
});

// =======================================================
// Duplicate
// =======================================================
duplicateBtn.addEventListener("click", async function () {
  showLoading();

  const payload = {
    smart_title: smartTitleEl.value.trim() + " (Copy)",
    category: categoryEl.value.trim(),
    status: "draft",
    tags: tagsEl.value.split(",").map(t => t.trim()).filter(Boolean),
    tone: toneEl.value.trim(),
    use_case: useCaseEl.value.trim(),
    skill_level: skillLevelEl.value.trim(),
    model_used: modelEl.value.trim(),
    intro: introEl.value.trim(),
    prompt: promptTextEl.value.trim()
  };

  const { data, error } = await supabase
    .from("prompts")
    .insert(payload)
    .select()
    .single();

  hideLoading();

  if (error) {
    console.error(error);
    showToast("Duplicate failed", true);
    return;
  }

  showToast("Duplicated");
  window.location.href = "./admin-edit.html?id=" + data.id;
});

// =======================================================
// AI Improve
// =======================================================
document.getElementById("aiTitleBtn").addEventListener("click", function () {
  openAIModal("Improve Title", smartTitleEl);
});

document.getElementById("aiIntroBtn").addEventListener("click", function () {
  openAIModal("Improve Intro", introEl);
});

document.getElementById("aiPromptBtn").addEventListener("click", function () {
  openAIModal("Improve Prompt", promptTextEl);
});

// =======================================================
// Toast
// =======================================================
function showToast(message, isError) {
  toastEl.textContent = message;
  toastEl.classList.remove("hidden");
  toastEl.style.backgroundColor = isError ? "#dc2626" : "#111827";

  setTimeout(() => toastEl.classList.add("hidden"), 2000);
}

// =======================================================
// Init
// =======================================================
(async function init() {
  await populateCategoryOptions(categoryEl);
  await populateToneOptions(toneEl);
  await populateUseCaseOptions(useCaseEl);
  await populateSkillLevelOptions(skillLevelEl);

  await loadPrompt();
})();
