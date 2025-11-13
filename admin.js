import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Redirect to login if not authenticated
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    window.location.href = "/login.html";
  }
});

// Logout
document.getElementById("logout-btn").onclick = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login.html";
};

// Load all prompts
async function loadPrompts() {
  const { data, error } = await supabase.from("prompts").select("*");

  if (error) {
    console.error("Error fetching prompts:", error);
    return;
  }

  const table = document.getElementById("prompt-table");
  table.innerHTML = "";

  data.forEach((p) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><input class="edit-input" data-id="${p.id}" data-field="smart_title" value="${p.smart_title || ""}"></td>

      <td><textarea class="edit-textarea" data-id="${p.id}" data-field="prompt">${p.prompt || ""}</textarea></td>

      <td><textarea class="edit-textarea" data-id="${p.id}" data-field="intro">${p.intro || ""}</textarea></td>

      <td><input class="edit-input" data-id="${p.id}" data-field="category" value="${p.category || ""}"></td>

      <td><input class="edit-input" data-id="${p.id}" data-field="tags" value="${(p.tags || []).join(", ")}"></td>

      <td><input class="edit-input" data-id="${p.id}" data-field="tone" value="${p.tone || ""}"></td>

      <td><input class="edit-input" data-id="${p.id}" data-field="use_case" value="${p.use_case || ""}"></td>

      <td><input class="edit-input" data-id="${p.id}" data-field="skill_level" value="${p.skill_level || ""}"></td>

      <td>
        <input class="edit-number" type="number" data-id="${p.id}" data-field="quality_score" value="${p.quality_score || 0}">
      </td>

      <td>
        <input class="edit-number" type="number" data-id="${p.id}" data-field="clarity" value="${p.clarity || 0}">
      </td>

      <td>
        <input class="edit-number" type="number" data-id="${p.id}" data-field="creativity" value="${p.creativity || 0}">
      </td>

      <td>
        <input class="edit-number" type="number" data-id="${p.id}" data-field="usefulness" value="${p.usefulness || 0}">
      </td>

      <td>
        <button class="save-btn" data-id="${p.id}">Save</button>
      </td>
    `;

    table.appendChild(row);
  });

  attachSaveHandlers();
}

function attachSaveHandlers() {
  const buttons = document.querySelectorAll(".save-btn");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;

      // Collect all fields
      const fields = {};
      document.querySelectorAll(`[data-id="${id}"]`).forEach((input) => {
        const field = input.dataset.field;
        let value = input.value;

        // Convert tags → array
        if (field === "tags") {
          value = value.split(",").map((t) => t.trim()).filter(Boolean);
        }

        // Convert numeric fields
        if (["quality_score", "clarity", "creativity", "usefulness"].includes(field)) {
          value = Number(value);
        }

        fields[field] = value;
      });

      const { error } = await supabase
        .from("prompts")
        .update(fields)
        .eq("id", id);

      if (error) {
        alert("Save failed — check console");
        console.error(error);
      } else {
        alert("Saved!");
      }
    });
  });
}

loadPrompts();
