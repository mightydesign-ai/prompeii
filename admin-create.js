// --- Supabase config ---
const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// DOM
const form = document.getElementById("createPromptForm");
const btnCreate = document.getElementById("btnCreate");
const toastEl = document.getElementById("toast");

const detectedVariablesEl = document.getElementById("detectedVariables");
const estimatedTokensEl = document.getElementById("estimatedTokens");
const lengthLabelEl = document.getElementById("lengthLabel");

/* ------------------- Helpers ------------------- */

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("toast-visible");
  setTimeout(() => toastEl.classList.remove("toast-visible"), 2000);
}

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

function validateForm() {
  let valid = true;

  const required = [
    { id: "smartTitleHuman", label: "Smart Title" },
    { id: "category", label: "Category" },
    { id: "intro", label: "Intro" },
    { id: "prompt", label: "Prompt" },
  ];

  required.forEach(field => {
    const el = document.getElementById(field.id);
    const err = document.querySelector(`[data-error-for="${field.id}"]`);

    if (!el.value.trim()) {
      err.textContent = `${field.label} is required.`;
      err.style.display = "block";
      el.classList.add("input-error");
      valid = false;
    } else {
      err.textContent = "";
      err.style.display = "none";
      el.classList.remove("input-error");
    }
  });

  return valid;
}

/* ------------------- Create ------------------- */

async function createPrompt() {
  if (!validateForm()) return;

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

  const now = new Date().toISOString();

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
    created_at: now,
    updated_at: now,
  };

  btnCreate.disabled = true;
  btnCreate.textContent = "Creating…";

  const { data, error } = await supabase
    .from("prompts")
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    console.error(error);
    showToast("Error creating prompt.");
    btnCreate.disabled = false;
    btnCreate.textContent = "Create Prompt";
    return;
  }

  showToast("Prompt created!");

  // Redirect to edit page
  window.location.href = `admin-edit.html?id=${data.id}`;
}

/* ------------------- Events ------------------- */

btnCreate.addEventListener("click", createPrompt);

form.addEventListener("input", (e) => {
  const id = e.target.id;

  // Update meta values if prompt changed
  if (id === "prompt") {
    const p = e.target.value;
    const vars = detectVariables(p);
    const tokens = estimateTokens(p);

    detectedVariablesEl.textContent = vars.length ? vars.join(", ") : "—";
    estimatedTokensEl.textContent = tokens;
    lengthLabelEl.textContent = lengthLabel(tokens);
  }

  // Update quality score preview
  if (["clarity", "creativity", "usefulness"].includes(id)) {
    const q = avgQuality();
    document.getElementById("qualityScore").value = q ?? "";
  }
});
