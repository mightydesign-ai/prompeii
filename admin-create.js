// admin-create.js
import { createClient } from '@supabase/supabase-js';
import { CATEGORY_OPTIONS, TONE_OPTIONS, USE_CASE_OPTIONS, SKILL_LEVEL_OPTIONS, fillSelect } from './options.js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function $(sel) { return document.querySelector(sel); }
function toast(msg, type = "info") {
  const box = $("#toast");
  if (!box) return alert(msg);
  box.textContent = msg;
  box.className = `toast show ${type}`;
  setTimeout(() => box.classList.remove("show"), 2000);
}

window.addEventListener("DOMContentLoaded", () => {
  // Wire selects
  fillSelect($("#category"), CATEGORY_OPTIONS);
  fillSelect($("#tone"), TONE_OPTIONS);
  fillSelect($("#useCase"), USE_CASE_OPTIONS);
  fillSelect($("#skillLevel"), SKILL_LEVEL_OPTIONS);

  // Wire buttons
  $("#createBtn")?.addEventListener("click", onCreate);
  $("#cancelBtn")?.addEventListener("click", () => window.location.href = "/admin.html");

  // Optional: AI helpers (if present on page)
  $("#aiImproveIntro")?.addEventListener("click", () => toast("AI Improve Intro coming soon", "info"));
  $("#aiImprovePrompt")?.addEventListener("click", () => toast("AI Improve Prompt coming soon", "info"));
});

async function onCreate() {
  const smartTitle = $("#smartTitle")?.value.trim();
  const category = $("#category")?.value.trim();
  const status = $("#status")?.value.trim() || "draft";
  const intro = $("#intro")?.value.trim();
  const promptText = $("#promptText")?.value.trim();

  if (!smartTitle || !category || !intro || !promptText) {
    toast("Please fill Smart Title, Category, Intro, and Prompt.", "error");
    return;
  }

  const tagsRaw = $("#tags")?.value.trim() || "";
  const tags = tagsRaw
    ? tagsRaw.split(",").map(t => t.trim()).filter(Boolean)
    : [];

  const tone = $("#tone")?.value || null;
  const use_case = $("#useCase")?.value || null;
  const skill_level = $("#skillLevel")?.value || null;

  const model_used = $("#model")?.value?.trim() || null;

  const payload = {
    smart_title_human: smartTitle,
    category,
    status,
    intro,
    prompt: promptText,
    tags,               // text[]
    tone,
    use_case,
    skill_level,
    model_used,
    // optional numeric fields defaulting to null or 0 as needed
    quality_score: null,
    clarity: null,
    creativity: null,
    usefulness: null,
  };

  const { data, error } = await supabase.from("prompts").insert(payload).select("id").single();
  if (error) {
    console.error(error);
    toast(`Create failed: ${error.message}`, "error");
    return;
  }

  toast("Prompt created!", "success");
  // Redirect to editor for further edits
  window.location.href = `/admin-edit.html?id=${data.id}`;
}
