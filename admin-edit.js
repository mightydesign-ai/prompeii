/* -------------------------------------------------------------
   Supabase config
------------------------------------------------------------- */
const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

let currentPromptId = null;

/* -------------------------------------------------------------
   DOM elements
------------------------------------------------------------- */
const toastEl = document.getElementById("toast");

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("toast-visible");
  setTimeout(() => toastEl.classList.remove("toast-visible"), 2000);
}

/* -------------------------------------------------------------
   Helpers
------------------------------------------------------------- */

function parseTags(value) {
  if (!value) return [];
  return value.split(",").map(t => t.trim()).filter(Boolean);
}

function detectVariables(prompt) {
  if (!prompt) return [];
  const m = prompt.match(/{{\s*[^}]+\s*}}/g);
  return m ? [...new Set(m.map(x => x.trim()))] : [];
}

function estimateTokens(prompt) {
  if (!prompt) return 0;
  const words = prompt.trim().split(/\s+/).length;
  return Math.round(words / 0.75);
}

function lengthLabel(tokens) {
  if (tokens <= 80) return "Short";
  if (tokens <= 260) return "Medium";
  return "Long";
}

function avgQuality() {
  const clarity = Number(document.getElementById("clarity").value);
  const creativity = Number(document.getElementById("creativity").value);
  const usefulness = Number(document.getElementById("usefulness").value);

  const vals = [clarity, creativity, usefulness].filter(n => n > 0);
  if (!vals.length) return null;

  return Number((vals.reduce((a,b)=>a+b,0) / vals.length).toFixed(1));
}

/* -------------------------------------------------------------
   Load Prompt
------------------------------------------------------------- */

async function loadPrompt() {
  const params = new URLSearchParams(window.location.search);
  currentPromptId = params.get("id");

  if (!currentPromptId) {
    showToast("No prompt ID provided");
    return;
  }

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", currentPromptId)
    .single();

  if (error || !data) {
    console.error(error);
    showToast("Error loading prompt");
    return;
  }

  // Fill metadata UI
  document.getElementById("metaId").textContent = data.id;
  document.getElementById("metaCreated").textContent =
    data.created_at || "—";
  document.getElementById("metaUpdated").textContent =
    data.updated_at || "—";

  // Fill fields
  document.getElementById("smartTitleHuman").value = data.smart_title || "";
  document.getElementById("category").value = data.category || "";
  document.getElementById("status").value = data.status || "";
  document.getElementById("tags").value = (data.tags || []).join(", ");

  document.getElementById("tone").value = data.tone || "";
  document.getElementById("useCase").value = data.use_case || "";
  document.getElementById("skillLevel").value = data.skill_level || "";
  document.getElementById("model").value = data.model || "";

  document.getElementById("clarity").value = data.clarity ?? "";
  document.getElementById("creativity").value = data.creativity ?? "";
  document.getElementById("usefulness").value = data.usefulness ?? "";

  document.getElementById("intro").value = data.intro || "";
  document.getElementById("prompt").value = data.prompt || "";

  document.getElementById("qualityScore").value =
    data.quality_score ?? "";

  // Update meta
  const vars = detectVariables(data.prompt);
  const tokens = estimateTokens(data.prompt);

  document.getElementById("detectedVariables").textContent =
    vars.length ? vars.join(", ") : "—";

  document.getElementById("estimatedTokens").textContent = tokens;
  document.getElementById("lengthLabel").textContent = lengthLabel(tokens);
}

/* -------------------------------------------------------------
   Save Prompt
------------------------------------------------------------- */

async function savePrompt() {
  if (!currentPromptId) return;

  const smart_title = document.getElementById("smartTitleHuman").value;
  const category = document.getElementById("category").value;
  const status = document.getElementById("status").value;

  const tags = parseTags(document.getElementById("tags").value);

  const tone = document.getElementById("tone").value;
  const use_case = document.getElementById("useCase").value;
  const skill_level = document.getElementById("skillLevel").value;
  const model = document.getElementById("model").value;

  const clarity = Number(document.getElementById("clarity").value) || null;
  const creativity = Number(document.getElementById("creativity").value) || null;
  const usefulness = Number(document.getElementById("usefulness").value) || null;

  const intro = document.getElementById("intro").value;
  const prompt = document.getElementById("prompt").value;

  const quality_score = avgQuality();

  const payload = {
    smart_title,
    category,
    status,
    tags,
    tone,
    use_case,
    skill_level,
    model,
    clarity,
    creativity,
    usefulness,
    intro,
    prompt,
    quality_score,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("prompts")
    .update(payload)
    .eq("id", currentPromptId);

  if (error) {
    console.error(error);
    showToast("Error saving prompt");
    return;
  }

  showToast("Saved!");
  loadPrompt(); // refresh metadata
}

/* -------------------------------------------------------------
   Delete Prompt
------------------------------------------------------------- */

async function deletePrompt() {
  if (!confirm("Delete this prompt? This cannot be undone.")) return;

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", currentPromptId);

  if (error) {
    console.error(error);
    showToast("Delete failed");
    return;
  }

  showToast("Deleted");
  window.location.href = "admin.html";
}

/* -------------------------------------------------------------
   Duplicate Prompt  ← NEW
------------------------------------------------------------- */

async function duplicatePrompt() {
  if (!currentPromptId) {
    showToast("No prompt loaded.");
    return;
  }

  // Load full record
  const { data: original, error: loadErr } = await supabase
    .from("prompts")
    .select("*")
    .eq("id", currentPromptId)
    .single();

  if (loadErr || !original) {
    console.error(loadErr);
    showToast("Error loading original prompt.");
    return;
  }

  // Remove auto fields
  delete original.id;
  delete original.created_at;
  delete original.updated_at;

  // Modify for duplication
  original.smart_title = `Copy — ${original.smart_title}`;
  original.status = "draft";
  original.created_at = new Date().toISOString();
  original.updated_at = new Date().toISOString();

  // Insert clone
  const { data: inserted, error: insertErr } = await supabase
    .from("prompts")
    .insert([original])
    .select("id")
    .single();

  if (insertErr) {
    console.error(insertErr);
    showToast("Error duplicating prompt");
    return;
  }

  showToast("Duplicated!");

  // Redirect to Edit page for new prompt
  window.location.href = `admin-edit.html?id=${inserted.id}`;
}

/* -------------------------------------------------------------
   Event Listeners
------------------------------------------------------------- */

document.getElementById("btnSave").addEventListener("click", savePrompt);
document.getElementById("btnDelete").addEventListener("click", deletePrompt);
document.getElementById("btnDuplicate").addEventListener("click", duplicatePrompt);

document.getElementById("editPromptForm").addEventListener("input", e => {
  const id = e.target.id;

  if (id === "prompt") {
    const text = e.target.value;
    const vars = detectVariables(text);
    const tokens = estimateTokens(text);

    document.getElementById("detectedVariables").textContent =
      vars.length ? vars.join(", ") : "—";

    document.getElementById("estimatedTokens").textContent = tokens;
    document.getElementById("lengthLabel").textContent = lengthLabel(tokens);
  }

  // Update quality score preview
  if (["clarity", "creativity", "usefulness"].includes(id)) {
    document.getElementById("qualityScore").value = avgQuality() ?? "";
  }
});

/* -------------------------------------------------------------
   Init
------------------------------------------------------------- */
loadPrompt();
