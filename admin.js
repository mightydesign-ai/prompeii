import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase Client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Load Prompts
async function loadPrompts() {
  const table = document.getElementById("prompts-table-body");
  table.innerHTML = `<tr><td colspan="99" style="padding:20px;text-align:center;">Loading...</td></tr>`;

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    table.innerHTML = "<tr><td colspan='99'>Error loading prompts.</td></tr>";
    return;
  }

  table.innerHTML = "";

  data.forEach((p) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input value="${p.smart_title || ""}" data-field="smart_title" data-id="${p.id}" /></td>
      <td><textarea data-field="prompt" data-id="${p.id}">${p.prompt || ""}</textarea></td>
      <td><textarea data-field="intro" data-id="${p.id}">${p.intro || ""}</textarea></td>
      <td><input value="${p.category || ""}" data-field="category" data-id="${p.id}" /></td>
      <td><input value="${(p.tags || []).join(", ")}" data-field="tags" data-id="${p.id}" /></td>
      <td><input value="${p.tone || ""}" data-field="tone" data-id="${p.id}" /></td>
      <td><input value="${p.use_case || ""}" data-field="use_case" data-id="${p.id}" /></td>
      <td><input value="${p.skill_level || ""}" data-field="skill_level" data-id="${p.id}" /></td>
      <td><input type="number" step="0.1" value="${p.quality_score || 0}" data-field="quality_score" data-id="${p.id}" /></td>
      <td><input type="number" step="0.1" value="${p.clarity || 0}" data-field="clarity" data-id="${p.id}" /></td>
      <td><input type="number" step="0.1" value="${p.creativity || 0}" data-field="creativity" data-id="${p.id}" /></td>
      <td><input type="number" step="0.1" value="${p.usefulness || 0}" data-field="usefulness" data-id="${p.id}" /></td>

      <td>
        <button class="save-btn" data-id="${p.id}">Save</button>
        <button class="delete-btn" data-id="${p.id}" style="margin-left:8px;background:#b30000">
          Delete
        </button>
      </td>
    `;

    table.appendChild(row);
  });

  attachSaveHandlers();
  attachDeleteHandlers();
}

// Save Handler
function attachSaveHandlers() {
  document.querySelectorAll(".save-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;

      const fields = [...document.querySelectorAll(`[data-id="${id}"]`)];
      const updates = {};

      fields.forEach((el) => {
        const field = el.dataset.field;
        let value = el.value;

        if (field === "tags") {
          value = value.split(",").map((t) => t.trim()).filter(Boolean);
        }

        updates[field] = value;
      });

      const { error } = await supabase.from("prompts").update(updates).eq("id", id);

      if (error) {
        alert("Error saving!");
        console.error(error);
      } else {
        alert("Saved!");
      }
    });
  });
}

// Delete Handler
function attachDeleteHandlers() {
  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const id = button.dataset.id;

      const confirmed = confirm("Delete this prompt forever?");
      if (!confirmed) return;

      const { error } = await supabase.from("prompts").delete().eq("id", id);

      if (error) {
        alert("Error deleting.");
        console.error(error);
      } else {
        alert("Deleted.");
        loadPrompts();
      }
    });
  });
}

// Modal Logic
document.getElementById("add-prompt-btn").onclick = () =>
  document.getElementById("modal-backdrop").classList.remove("hidden");

document.getElementById("cancel-modal").onclick = () =>
  document.getElementById("modal-backdrop").classList.add("hidden");

// Create New Prompt
document.getElementById("new-prompt-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = new FormData(e.target);

  const newPrompt = {
    smart_title: form.get("smart_title"),
    intro: form.get("intro"),
    prompt: form.get("prompt"),
    category: form.get("category"),
    tags: form.get("tags").split(",").map((t) => t.trim()).filter(Boolean),
    tone: form.get("tone"),
    use_case: form.get("use_case"),
    skill_level: form.get("skill_level"),
    quality_score: Number(form.get("quality_score")),
    clarity: Number(form.get("clarity")),
    creativity: Number(form.get("creativity")),
    usefulness: Number(form.get("usefulness")),
    status: form.get("status"),
  };

  const { error } = await supabase.from("prompts").insert([newPrompt]);

  if (error) {
    alert("Error creating prompt.");
    console.error(error);
  } else {
    alert("Prompt created!");
    document.getElementById("modal-backdrop").classList.add("hidden");
    loadPrompts();
  }
});

// Initial Load
loadPrompts();
