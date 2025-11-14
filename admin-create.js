/* =========================================================
   Prompeii Admin – Create Page
   ========================================================= */

const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

const supabaseCreate = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function q(id) { return document.getElementById(id); }

const createBtn = q("createBtn");
const cancelBtn = q("cancelBtn");

const smartTitle = q("smartTitle");
const category = q("category");
const statusEl = q("status");
const tags = q("tags");
const tone = q("tone");
const useCase = q("useCase");
const skillLevel = q("skillLevel");
const model = q("model");

const intro = q("intro");
const promptTextarea = q("prompt");

const clarity = q("clarity");
const creativity = q("creativity");
const usefulness = q("usefulness");
const qualityScore = q("qualityScore");

function toast(msg) {
  const t = q("toast");
  t.textContent = msg;
  t.classList.add("toast-visible");
  setTimeout(() => t.classList.remove("toast-visible"), 1800);
}

/* ------------------------------------------------------
   Create
------------------------------------------------------ */
async function createPrompt() {
  if (!smartTitle.value.trim()) {
    toast("Smart title required");
    return;
  }
  if (!category.value) {
    toast("Category required");
    return;
  }

  const payload = {
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
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseCreate
    .from("prompts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error(error);
    toast("Create failed");
    return;
  }

  toast("Created!");
  window.location.href = `admin-edit.html?id=${data.id}`;
}

/* ------------------------------------------------------
   AI Improve (placeholder)
------------------------------------------------------ */
function improvePromptHandler() {
  const original = promptTextarea.value.trim();

  if (!original) {
    toast("Write a prompt first.");
    return;
  }

  const improved = original + "\n\n# AI Polish\n- Cleaner\n- More clear\n- More direct";

  openImproveModal(original, improved, promptTextarea);
}

/* ------------------------------------------------------
   Cancel
------------------------------------------------------ */
function cancel() {
  window.location.href = "admin.html";
}

/* ------------------------------------------------------
   Init
------------------------------------------------------ */
function init() {
  createBtn.addEventListener("click", createPrompt);
  cancelBtn.addEventListener("click", cancel);

  q("aiImproveBtn").addEventListener("click", improvePromptHandler);
}

document.addEventListener("DOMContentLoaded", init);
