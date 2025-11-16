// =======================================================
// Prompeii Admin — Create Prompt
// =======================================================

import {
  populateCategoryOptions,
  populateToneOptions,
  populateUseCaseOptions,
  populateSkillLevelOptions
} from "./options.js";

import { openAIModal } from "./modal.js";

const supabase = window.supabaseClient;
const showLoading = window.showLoading;
const hideLoading = window.hideLoading;

document.addEventListener("DOMContentLoaded", () => {

  // Elements
  const smartTitleEl = document.getElementById("smartTitle");
  const categoryEl   = document.getElementById("category");
  const statusEl     = document.getElementById("status");
  const tagsEl       = document.getElementById("tags");
  const toneEl       = document.getElementById("tone");
  const useCaseEl    = document.getElementById("useCase");
  const skillLevelEl = document.getElementById("skillLevel");
  const modelEl      = document.getElementById("model");
  const introEl      = document.getElementById("intro");
  const promptTextEl = document.getElementById("promptText");

  const saveBtn = document.getElementById("saveBtn");
  const toastEl = document.getElementById("toast");

  const aiTitleBtn  = document.getElementById("aiTitleBtn");
  const aiIntroBtn  = document.getElementById("aiIntroBtn");
  const aiPromptBtn = document.getElementById("aiPromptBtn");

  // =======================================================
  // Validation
  // =======================================================
  function validatePromptFields(data) {
    const errors = {};
    if (!data.smart_title || data.smart_title.length < 3) errors.smartTitle = "Title too short";
    if (!data.prompt || data.prompt.length < 30)         errors.promptText = "Prompt must be 30+ characters";
    if (!data.category)                                   errors.category   = "Category required";
    if (!data.tags || data.tags.length === 0)             errors.tags       = "Tags required";
    return errors;
  }

  function applyFieldErrors(errors) {
    document.querySelectorAll("input, textarea, select")
      .forEach(el => el.classList.remove("input-error"));

    Object.keys(errors).forEach(key => {
      const el = document.getElementById(key);
      if (el) el.classList.add("input-error");
    });
  }

  // =======================================================
  // Payload
  // =======================================================
  function collectPayload() {
    return {
      smart_title: smartTitleEl.value.trim(),
      category: categoryEl.value.trim(),
      status: statusEl.value.trim(),
      tags: tagsEl.value.split(",").map(t => t.trim()).filter(Boolean),
      tone: toneEl.value.trim(),
      use_case: useCaseEl.value.trim(),
      skill_level: skillLevelEl.value.trim(),
      model: modelEl.value.trim(),
      intro: introEl.value.trim(),
      prompt: promptTextEl.value.trim()
    };
  }

  // =======================================================
  // Save
  // =======================================================
  saveBtn.addEventListener("click", async () => {
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
  // Improve Buttons
  // =======================================================
  aiTitleBtn?.addEventListener("click", () => openAIModal("Improve Title", smartTitleEl));
  aiIntroBtn?.addEventListener("click", () => openAIModal("Improve Intro", introEl));
  aiPromptBtn?.addEventListener("click", () => openAIModal("Improve Prompt", promptTextEl));

  // =======================================================
  // Toast
  // =======================================================
  function showToast(message, isError) {
    toastEl.textContent = message;
    toastEl.style.backgroundColor = isError ? "#dc2626" : "#111827";

    toastEl.classList.remove("opacity-0", "translate-y-4");

    requestAnimationFrame(() => {
      toastEl.classList.add("opacity-100", "translate-y-0");
    });

    setTimeout(() => {
      toastEl.classList.remove("opacity-100", "translate-y-0");
      toastEl.classList.add("opacity-0", "translate-y-4");
    }, 2000);
  }

  // =======================================================
  // Init Dropdowns
  // =======================================================
  (async function init() {
    await populateCategoryOptions(categoryEl);
    await populateToneOptions(toneEl);
    await populateUseCaseOptions(useCaseEl);
    await populateSkillLevelOptions(skillLevelEl);
  })();

  // =======================================================
  // PREVIEW PANEL
  // =======================================================
  const previewOutput = document.getElementById("previewOutput");
  const previewToggle = document.getElementById("previewToggle");
  let previewMode = "pretty";

  function renderMarkdown(text) {
    if (!text.trim()) return "Start typing to see preview…";

    const esc = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    let out = esc.replace(/`([^`]+)`/g, "<span class='preview-code'>$1</span>");
    out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    out = out.replace(/_([^_]+)_/g, "<em>$1</em>");
    out = out.replace(/{{([^}]+)}}/g, "<span class='preview-variable'>{{$1}}</span>");
    return out;
  }

  function buildPreviewText() {
    return [
      smartTitleEl.value.trim(),
      "",
      introEl.value.trim(),
      "",
      promptTextEl.value.trim()
    ].filter(Boolean).join("\n");
  }

  function updatePreview() {
    const text = buildPreviewText();
    if (previewMode === "raw") previewOutput.textContent = text || "Start typing…";
    else previewOutput.innerHTML = renderMarkdown(text);
  }

  ["input", "change"].forEach(evt => {
    smartTitleEl.addEventListener(evt, updatePreview);
    introEl.addEventListener(evt, updatePreview);
    promptTextEl.addEventListener(evt, updatePreview);
  });

  previewToggle.addEventListener("click", () => {
    previewMode = previewMode === "pretty" ? "raw" : "pretty";
    previewToggle.textContent = previewMode === "pretty" ? "Raw" : "Pretty";
    updatePreview();
  });

  updatePreview();

});
