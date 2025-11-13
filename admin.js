import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- Redirect if not authenticated ---
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    window.location.href = "/login.html";
  }
});

// --- Logout ---
document.getElementById("logout-btn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
};

// --- Modal behavior ---
const modal = document.getElementById("modal-backdrop");
const openBtn = document.getElementById("add-prompt-btn");
const cancelBtn = document.getElementById("cancel-modal");
const form = document.getElementById("new-prompt-form");

openBtn.onclick = () => modal.classList.remove("hidden");
cancelBtn.onclick = () => modal.classList.add("hidden");
modal.onclick = (e) => {
  if (e.target === modal) modal.classList.add("hidden");
};

// --- Create new prompt ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fd = new FormData(form);

  const payload = {
    smart_title: fd.get("smart_title")?.trim() || "",
    intro: fd.get("intro")?.trim() || "",
    prompt: fd.get("prompt")?.trim() || "",
    category: fd.get("category")?.trim() || "",
    tone: fd.get("tone")?.trim() || "",
    use_case: fd.get("use_case")?.trim() || "",
    skill_level: fd.get("skill_level")?.trim() || "",
    status: fd.get("status")?.trim() || "curated",
    quality_score: Number(fd.get("quality_score") || 0),
    clarity: Number(fd.get("clarity") || 0),
    creativity: Number(fd.get("creativity") || 0),
    usefulness: Number(fd.get("usefulness") || 0),

    tags: (fd.get("tags") || "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  };

  const { error } = await supabase.from("prompts").insert([payload]);

  if (error) {
    alert("Could not create prompt. Check console.");
    console.error(error);
    return;
  }

  modal.classList.add("hidden");
  form.reset();
  loadPrompts();
});

// --- Load & render prompts ---
async function loadPrompts() {
  const { data, error } = await supabase.from("prompts").select("*");

  if (error) {
    console.error("Fetch error:", error);
    return;
  }

  const table = document.getElementById("prompt-table");
  table.innerHTML = "";

  data.forEach((p) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input data-id="${p.id}" data-field="smart_title" class="edit-input" value="${p.smart_title || ""}"></td>
      <td><textarea data-id="${p.id}" data-field="prompt" class="edit-textarea">${p.prompt || ""}</textarea></td>
      <td><textarea data-id="${p.id}" data-field="intro" class="edit-textarea">${p.intro || ""}</textarea></td>
      <td><input data-id="${p.id}" data-field="category" class="edit-input" value="${p.category || ""}"></td>
      <td><input data-id="${p.id}" data-field="tags" class="edit-input" value="${(p.tags || []).join(", ")}"></td>
      <td><input data-id="${p.id}" data-field="tone" class="edit-input" value="${p.tone || ""}"></td>
      <td><input data-id="${p.id}" data-field="use_case" class="edit-input" value="${p.use_case || ""}"></td>
      <td><input data-id="${p.id}" data-field="skill_level" class="edit-input" value="${p.skill_level || ""}"></td>
      <td><input data-id="${p.id}" data-field="quality_score" type="number" class="edit-number" value="${p.quality_score || 0}"></td>
      <td><input data-id="${p.id}" data-field="clarity" type="number" class="edit-number" value="${p.clarity || 0}"></td>
      <td><input data-id="${p.id}" data-field="creativity" type="number" class="edit-number" value="${p.creativity || 0}"></td>
      <td><input data-id="${p.id}" data-field="usefulness" type="number" class="edit-number" value="${p.usefulness || 0}"></td>
      <td><button class="save-btn" data-id="${p.id}">Save</button></td>
    `;

    table.appendChild(row);
  });

  attachSaveHandlers();
}

// --- Save inline edits ---
function attachSaveHandlers() {
  document.querySelectorAll(".save-btn").forEach((btn) => {
    btn.onclick = async () => {
      const id = btn.dataset.id;
      const updates = {};

      document.querySelectorAll(`[data-id="${id}"]`).forEach((el) => {
        const field = el.dataset.field;
        let value = el.value;

        if (field === "tags") {
          value = value.split(",").map((t) => t.trim()).filter(Boolean);
        }

        if (["quality_score", "clarity", "creativity", "usefulness"].includes(field)) {
          value = Number(value);
        }

        updates[field] = value;
      });

      const { error } = await supabase.from("prompts").update(updates).eq("id", id);

      if (error) {
        alert("Failed to save changes.");
        console.error(error);
      } else {
        alert("Saved!");
      }
    };
  });
}

loadPrompts();
