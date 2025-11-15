// =========================================================
// Prompeii Admin – Create Page (SAFE + GLOBAL SUPABASE)
// =========================================================

// ----- GLOBAL SUPABASE CLIENT -----
const supabase = window.supabaseClient;

// ----- REQUIRE AUTH -----
async function requireAuth() {
  try {
    const { data } = await supabase.auth.getSession();
    if (!data?.session) {
      window.location.href = "login.html";
      return false;
    }
    return true;
  } catch (err) {
    console.error("Auth error:", err);
    window.location.href = "login.html";
    return false;
  }
}

// ----- DOM HELP -----
function $(id) {
  return document.getElementById(id);
}

import {
  CATEGORY_OPTIONS,
  TONE_OPTIONS,
  USE_CASE_OPTIONS,
  SKILL_LEVEL_OPTIONS,
  fillSelect
} from "./options.js";

// ----- INPUTS -----
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

const createBtn = $("createBtn");
const aiTitleBtn = $("aiTitleBtn");
const aiIntroBtn = $("aiIntroBtn");
const aiPromptBtn = $("aiPromptBtn");

const toast = window.toast;

// ----- CREATE PROMPT -----
async function createPrompt() {
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("prompts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Create error:", error);
    toast("Failed to create prompt");
    return;
  }

  toast("Created!");
  window.location.href = `admin-edit.html?id=${data.id}`;
}

// ----- SELECT POPULATION -----
function wireSelects() {
  fillSelect(category, CATEGORY_OPTIONS);
  fillSelect(tone, TONE_OPTIONS);
  fillSelect(useCase, USE_CASE_OPTIONS);
  fillSelect(skillLevel, SKILL_LEVEL_OPTIONS);
}

// ----- IMPROVE MODAL -----
function wireImproveButtons() {
  if (!window.PrompeiiImproveModal) return;

  const { showImproveModal, modalContainer } = window.PrompeiiImproveModal;

  function useImprove(inputEl) {
    const original = inputEl.value || "";
    showImproveModal(original);

    function applyHandler(e) {
      const improved = e.detail?.improved || "";
      if (improved) inputEl.value = improved;
      modalContainer.removeEventListener("improve:apply", applyHandler);
    }

    modalContainer.addEventListener("improve:apply", applyHandler);
  }

  aiIntroBtn?.addEventListener("click", () => useImprove(intro));
  aiPromptBtn?.addEventListener("click", () => useImprove(promptTextarea));
  aiTitleBtn?.addEventListener("click", () => useImprove(smartTitle));
}

// ----- INIT -----
async function init() {

  const ok = await requireAuth();
  if (!ok) return;

  wireSelects();
  wireImproveButtons();

  createBtn?.addEventListener("click", createPrompt);
}

// ----- STARTUP -----
document.addEventListener("DOMContentLoaded", init);
