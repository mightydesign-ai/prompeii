/* =========================================================
   Prompeii Admin – Edit Page
   ========================================================= */

const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

const supabaseEdit = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function $(id){ return document.getElementById(id); }

const saveBtn = $("saveBtn");
const deleteBtn = $("deleteBtn");
const duplicateBtn = $("duplicateBtn");
const improveBtn = $("aiImproveBtn");

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
const promptTextarea = $("prompt");

const clarity = $("clarity");
const creativity = $("creativity");
const usefulness = $("usefulness");
const qualityScore = $("qualityScore");

// Meta
const metaId = $("metaId");
const metaCreated = $("metaCreated");
const metaUpdated = $("metaUpdated");

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.classList.add("toast-visible");
  setTimeout(() => t.classList.remove("toast-visible"), 1800);
}

/* -------------------------------------- */
/* Get ID from URL */
/* -------------------------------------- */
function getId() {
  const p = new URLSearchParams(window.location.search);
  return p.get("id");
}

/* -------------------------------------- */
/* Load existing prompt */
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
    console.error(error);
    toast("Load failed");
    return;
  }

  metaId.textContent = data.id;
  metaCreated.textContent = new Date(data.created_at).toLocaleString();
  metaUpdated.textContent = new Date(data.updated_at).toLocaleString();

  smartTitle.value = data.smart_title || "";
  category.value = data.category || "";
  statusEl.value = data.status || "Draft";
  tags.value = (data.tags || []).join(", ");
  tone.value = data.tone || "";
  useCase.value = data.use_case || "";
  skillLevel.value = data.skill_level || "";
  model.value = data.model || "";
  intro.value = data.intro || "";
  promptTextarea.value = data.prompt || "";

  clarity.value = data.clarity ?? "";
  creativity.value = data.creativity ?? "";
  usefulness.value = data.usefulness ?? "";
  qualityScore.value = data.quality_score ?? "";
}

/* -------------------------------------- */
/* Save */
/* -------------------------------------- */
async function savePrompt() {
  const id = getId();
  if (!id) return;

  const { error } = await supabaseEdit
    .from("prompts")
    .update({
      smart_title: smartTitle.value.trim(),
      category: category.value,
      status: statusEl.value,
      tags: tags.value.split(",").map(t => t.trim()).filter(Boolean),
      tone: tone.value.trim(),
      use_case: useCase.value.trim(),
      skill_level: skillLevel.value.trim(),
      model: model.value.trim(),
      intro: intro.value,
      prompt: promptTextarea.value,
      clarity: clarity.value === "" ? null : Number(clarity.value),
      creativity: creativity.value === "" ? null : Number(creativity.value),
      usefulness: usefulness.value === "" ? null : Number(usefulness.value),
      quality_score: qualityScore.value === "" ? null : Number(qualityScore.value),
      updated_at: new Date().toISOString()
    })
    .eq("id", id);

  if (error) {
    toast("Save failed");
    console.error(error);
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
    ...data,
    id: undefined,
    smart_title: (data.smart_title || "Untitled") + " (Copy)",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: inserted, error } = await supabaseEdit
    .from("prompts")
    .insert(clone)
    .select()
    .single();

  if (error) {
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

  await supabaseEdit
    .from("prompts")
    .delete()
    .eq("id", id);

  window.location.href = "admin.html";
}

/* -------------------------------------- */
/* AI Improve Prompt */
/* -------------------------------------- */
function improvePromptHandler() {
  const original = promptTextarea.value.trim();

  if (!original) {
    toast("Write a prompt first.");
    return;
  }

  // temporary placeholder logic
  const improved = original + "\n\n# AI Polish\n- More clear\n- More concise\n- Better flow";

  openImproveModal(original, improved, promptTextarea);
}

/* -------------------------------------- */
/* Init */
/* -------------------------------------- */
function init() {
  loadPrompt();

  saveBtn.addEventListener("click", savePrompt);
  duplicateBtn.addEventListener("click", duplicatePrompt);
  deleteBtn.addEventListener("click", deletePrompt);
  improveBtn.addEventListener("click", improvePromptHandler);
}

document.addEventListener("DOMContentLoaded", init);
