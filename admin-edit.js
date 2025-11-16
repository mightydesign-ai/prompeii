// =======================================================
// Prompeii Admin — Edit Prompt
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

  // Element Refs
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

  const clarityEl      = document.getElementById("clarity");
  const creativityEl   = document.getElementById("creativity");
  const usefulnessEl   = document.getElementById("usefulness");
  const qualityScoreEl = document.getElementById("quality_score");

  const toastEl     = document.getElementById("toast");
  const saveBtn     = document.getElementById("saveBtn");
  const deleteBtn   = document.getElementById("deleteBtn");
  const duplicateBtn = document.getElementById("duplicateBtn");

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

    if (error || !data) {
      console.error(error);
      showToast("Error loading prompt", true);
      return;
    }

    smartTitleEl.value = data.smart_title || "";
    categoryEl.value   = data.category || "";
    statusEl.value     = data.status || "draft";
    tagsEl.value       = (data.tags || []).join(", ");
    toneEl.value       = data.tone || "";
    useCaseEl.value    = data.use_case || "";
    skillLevelEl.value = data.skill_level || "";
    modelEl.value      = data.model || "";
    introEl.value      = data.intro || "";
    promptTextEl.value = data.prompt || "";

    clarityEl.value      = data.clarity || "";
    creativityEl.value   = data.creativity || "";
    usefulnessEl.value   = data.usefulness || "";
    qualityScoreEl.value = data.quality_score || "";

    document.getElementById("promptId").textContent = data.id;
    document.getElementById("createdAt").textContent = data.created_at;
    document.getElementById("updatedAt").textContent = data.updated_at;

    updatePreview();
  }

  // =======================================================
  // Save
  // =======================================================
  saveBtn.addEventListener("click", async () => {
    showLoading();

    const updateData = {
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

    const { error } = await supabase
      .from("prompts")
      .update(updateData)
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
  deleteBtn?.addEventListener("click", async () => {
    if (!confirm("Delete this prompt?")) return;

    const { error } = await supabase
      .from("prompts")
      .delete()
      .eq("id", promptId);

    if (error) {
      console.error(error);
      showToast("Delete failed", true);
      return;
    }

    window.location.href = "./admin.html";
  });

 // =======================================================
// Duplicate
// =======================================================
duplicateBtn?.addEventListener("click", async () => {

  const payload = {
    smart_title: smartTitleEl.value.trim() + " (Copy)",
    category: categoryEl.value.trim(),
    status: "draft",
    tags: tagsEl.value.split(",").map(t => t.trim()).filter(Boolean),
    tone: toneEl.value.trim(),
    use_case: useCaseEl.value.trim(),
    skill_level: skillLevelEl.value.trim(),
    model: modelEl.value.trim(),
    intro: introEl.value.trim(),
    prompt: promptTextEl.value.trim()
  };

  const { data, error } = await supabase
    .from("prompts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    showToast("Duplicate failed", true);
    return;
  }

  // 🔥 NEW: Toast confirmation BEFORE redirect
  showToast("Prompt duplicated!", false);

  // Small delay so toast is visible
  setTimeout(() => {
    window.location.href = "./admin-edit.html?id=" + data.id;
  }, 650);
});


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
    await loadPrompt();
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
