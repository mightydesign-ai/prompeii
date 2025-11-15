/* =========================================================
   Prompeii Admin – Edit Page (FINAL, HTML-SYNCED VERSION)
   ========================================================= */

const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

const supabaseEdit = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function $(id) {
  return document.getElementById(id);
}

/* -------------------------------------- */
/* DOM Elements (MATCH HTML EXACTLY) */
/* -------------------------------------- */

// Meta top section
const metaId = $("promptId");
const metaCreated = $("createdAt");
const metaUpdated = $("updatedAt");

// Inputs
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

// Sticky footer buttons
const saveBtn = $("saveBtn");
const deleteBtn = $("deleteBtn");
const duplicateBtn = $("duplicateBtn");

// AI helper buttons (names match your HTML)
const aiTitleBtn = $("aiTitleBtn");
const aiIntroBtn = $("aiIntroBtn");
const aiPromptBtn = $("aiPromptBtn");

/* -------------------------------------- */
/* Toast */
/* -------------------------------------- */

function toast(msg) {
  const t = $("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("toast-visible");
  setTimeout(() => t.classList.remove("toast-visible"), 1800);
}

/* -------------------------------------- */
/* Get ID from URL */
/* -------------------------------------- */
function getId() {
  return new URLSearchParams(window.location.search).get("id");
}

/* -------------------------------------- */
/* Load Prompt */
/* -------------------------------------- */
async function loadPrompt() {
  const id = getId();
  if (!id) return;

  const { data, error } = await supabaseEdit
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

/* -------------------------------------- */
/* Save Prompt */
/* -------------------------------------- */
async function savePrompt() {
  const id = getId();
  if (!id) return;

  const { error } = await supabaseEdit
    .from("prompts")
    .update({
      smart_title: smartTitle.value.trim(),
      category: category.value.trim(),
      status: statusEl.value.trim(),
      tags: tags.value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      tone: tone.value.trim(),
      use_case: useCase.value.trim(),
      skill_level: skillLevel.value.trim(),
      model: model.value.trim(),
      intro: intro.value,
      prompt: promptTextarea.value,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Save error:", error);
    toast("Save failed");
  } else {
    toast("Saved!");
    loadPrompt();
  }
}

/* -------------------------------------- */
/* Duplicate */
/* -------------------------------------- */
async function duplicatePrompt() {
  const id = getId();
  if (!id) return;

  const { data } = await supabaseEdit
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
    updated_at: new Date().toISOString(),
  };

  const { data: inserted, error } = await supabaseEdit
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

/* -------------------------------------- */
/* Delete */
/* -------------------------------------- */
async function deletePrompt() {
  const id = getId();
  if (!id) return;

  if (!confirm("Delete this prompt permanently?")) return;

  await supabaseEdit.from("prompts").delete().eq("id", id);

  window.location.href = "admin.html";
}

/* -------------------------------------- */
/* AI Helpers (placeholder) */
/* -------------------------------------- */
if (aiTitleBtn)
  aiTitleBtn.addEventListener("click", () => toast("AI Title helper not wired yet"));
if (aiIntroBtn)
  aiIntroBtn.addEventListener("click", () => toast("AI Intro helper not wired yet"));
if (aiPromptBtn)
  aiPromptBtn.addEventListener("click", () => toast("AI Prompt helper not wired yet"));

/* -------------------------------------- */
/* Init */
/* -------------------------------------- */
function init() {
  // Wire sticky footer buttons
  if (saveBtn) saveBtn.addEventListener("click", savePrompt);
  if (duplicateBtn) duplicateBtn.addEventListener("click", duplicatePrompt);
  if (deleteBtn) deleteBtn.addEventListener("click", deletePrompt);

  loadPrompt();
}

document.addEventListener("DOMContentLoaded", init);
