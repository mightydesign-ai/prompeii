import { createClient } from "@supabase/supabase-js";

/* ==========================================
   SUPABASE CLIENT SETUP
========================================== */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ==========================================
   GLOBAL STATE
========================================== */

// Sorting state for table
let currentSort = {
  column: "smart_title",
  ascending: true,
};

// Keep current prompts in memory so Edit can look them up
let currentPrompts = [];

/* ==========================================
   HELPER FUNCTIONS
========================================== */

/**
 * Clean tags: split on commas, trim, lowercase, dedupe.
 */
function cleanTags(raw) {
  if (!raw) return [];

  const parts = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);

  const unique = [...new Set(parts)];
  return unique;
}

/**
 * Generate a simple smart title from the first sentence of the prompt.
 */
function generateSmartTitle(promptText) {
  if (!promptText) return "";

  let firstSentence = promptText.split(".")[0];

  if (firstSentence.length > 80) {
    firstSentence = firstSentence.slice(0, 80) + "...";
  }

  return firstSentence.replace(/\n/g, " ").trim();
}

/**
 * Validate the core fields of a prompt; returns an array of warning strings.
 */
function validatePromptFields(fields) {
  const warnings = [];

  if (!fields.smart_title || fields.smart_title.trim().length < 3) {
    warnings.push("Smart title is missing or very short.");
  }

  if (!fields.prompt || fields.prompt.trim().length < 10) {
    warnings.push("Prompt content is too short.");
  }

  if (fields.prompt && fields.prompt.length > 800) {
    warnings.push("Prompt content is very long — consider tightening it up.");
  }

  if (!fields.category || fields.category.trim().length === 0) {
    warnings.push("Category is missing.");
  }

  return warnings;
}

/**
 * Auto-score a prompt based on length and keywords.
 * Very rough heuristic; you can refine this later or plug in AI.
 */
function autoScorePrompt(fields) {
  const promptText = fields.prompt || "";

  let clarity = promptText.length < 300 ? 9 : 7;
  let creativity = promptText.toLowerCase().includes("imagine") ? 9 : 7;
  let usefulness = promptText.toLowerCase().includes("steps") ? 9 : 7;

  const avg = (clarity + creativity + usefulness) / 3;
  const quality_score = Number(avg.toFixed(1));

  return {
    clarity,
    creativity,
    usefulness,
    quality_score,
  };
}

/* ==========================================
   LOAD AND RENDER PROMPTS
========================================== */

/**
 * Fetch prompts from Supabase using currentSort,
 * then pass them to the renderer.
 */
async function loadPrompts() {
  const { column, ascending } = currentSort;

  const { data, error } = await supabase
    .from("prompts")
    .select("*")
    .order(column, { ascending });

  if (error) {
    console.error("Error loading prompts:", error);
    return;
  }

  currentPrompts = data || [];
  renderPrompts(currentPrompts);
}

/**
 * Render all prompts into the table body.
 */
function renderPrompts(prompts) {
  const tableBody = document.getElementById("prompts-table-body");
  tableBody.innerHTML = "";

  prompts.forEach((prompt) => {
    const row = document.createElement("tr");
    row.classList.add("prompt-row");

    // Main editable row
    row.innerHTML = `
      <td>
        <input
          type="text"
          data-field="smart_title"
          data-id="${prompt.id}"
          value="${prompt.smart_title || ""}"
        />
      </td>
      <td>
        <textarea
          data-field="prompt"
          data-id="${prompt.id}"
          rows="3"
        >${prompt.prompt || ""}</textarea>
      </td>
      <td>
        <textarea
          data-field="intro"
          data-id="${prompt.id}"
          rows="2"
        >${prompt.intro || ""}</textarea>
      </td>
      <td>
        <input
          type="text"
          data-field="category"
          data-id="${prompt.id}"
          value="${prompt.category || ""}"
        />
      </td>
      <td>
        <input
          type="text"
          data-field="tags"
          data-id="${prompt.id}"
          value="${(prompt.tags || []).join(", ")}"
        />
      </td>
      <td>
        <input
          type="text"
          data-field="tone"
          data-id="${prompt.id}"
          value="${prompt.tone || ""}"
        />
      </td>
      <td>
        <input
          type="text"
          data-field="use_case"
          data-id="${prompt.id}"
          value="${prompt.use_case || ""}"
        />
      </td>
      <td>
        <input
          type="text"
          data-field="skill_level"
          data-id="${prompt.id}"
          value="${prompt.skill_level || ""}"
        />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          data-field="quality_score"
          data-id="${prompt.id}"
          value="${prompt.quality_score ?? 0}"
        />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          data-field="clarity"
          data-id="${prompt.id}"
          value="${prompt.clarity ?? 0}"
        />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          data-field="creativity"
          data-id="${prompt.id}"
          value="${prompt.creativity ?? 0}"
        />
      </td>
      <td>
        <input
          type="number"
          step="0.1"
          data-field="usefulness"
          data-id="${prompt.id}"
          value="${prompt.usefulness ?? 0}"
        />
      </td>
      <td>
        <button
          class="btn btn-secondary edit-btn"
          data-id="${prompt.id}"
          type="button"
        >
          Edit
        </button>

        <button
          class="btn btn-primary save-btn"
          data-id="${prompt.id}"
          type="button"
        >
          Save
        </button>

        <button
          class="btn btn-secondary delete-btn"
          data-id="${prompt.id}"
          type="button"
        >
          Delete
        </button>
      </td>
    `;

    // Warning row that sits under this prompt row
    const warningRow = document.createElement("tr");
    warningRow.classList.add("warning-row", "hidden");
    warningRow.innerHTML = `
      <td colspan="13" class="warning-cell"></td>
    `;

    tableBody.appendChild(row);
    tableBody.appendChild(warningRow);
  });

  attachRowEventHandlers();
  updateSortHeaderLabels();
}

/* ==========================================
   ROW EVENT HANDLERS
========================================== */

function attachRowEventHandlers() {
  const saveButtons = document.querySelectorAll(".save-btn");
  const deleteButtons = document.querySelectorAll(".delete-btn");
  const editButtons = document.querySelectorAll(".edit-btn");

  saveButtons.forEach((button) => {
    button.addEventListener("click", handleSaveClick);
  });

  deleteButtons.forEach((button) => {
    button.addEventListener("click", handleDeleteClick);
  });

  editButtons.forEach((button) => {
    button.addEventListener("click", handleEditClick);
  });
}

/**
 * Handle Save for a single row (inline save).
 */
async function handleSaveClick(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;

  const fieldElements = document.querySelectorAll(`[data-id="${id}"]`);
  const fields = {};

  fieldElements.forEach((el) => {
    const fieldName = el.dataset.field;

    if (fieldName === "tags") {
      fields[fieldName] = cleanTags(el.value);
    } else {
      fields[fieldName] = el.value;
    }
  });

  // Auto-generate smart_title if missing/short
  if (!fields.smart_title || fields.smart_title.trim().length < 3) {
    fields.smart_title = generateSmartTitle(fields.prompt);
  }

  // Validate fields
  const warnings = validatePromptFields(fields);

  // Find warning row
  const mainRow = button.closest("tr");
  const warningRow = mainRow.nextElementSibling;
  const warningCell = warningRow.querySelector(".warning-cell");

  if (warnings.length > 0) {
    warningRow.classList.remove("hidden");
    warningCell.innerHTML = warnings.join("<br>");
    return;
  } else {
    warningRow.classList.add("hidden");
    warningCell.innerHTML = "";
  }

  // Autoscore if no quality_score set
  if (!fields.quality_score || Number(fields.quality_score) <= 0) {
    const scores = autoScorePrompt(fields);
    Object.assign(fields, scores);
  }

  const { error } = await supabase
    .from("prompts")
    .update(fields)
    .eq("id", id);

  if (error) {
    console.error("Error saving prompt:", error);
    alert("Error saving prompt. See console for details.");
  } else {
    alert("Prompt saved.");
    // Reload so currentPrompts stays in sync
    await loadPrompts();
  }
}

/**
 * Handle Delete for a single row.
 */
async function handleDeleteClick(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;

  const confirmed = window.confirm(
    "Are you sure you want to delete this prompt?"
  );

  if (!confirmed) return;

  const { error } = await supabase
    .from("prompts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting prompt:", error);
    alert("Error deleting prompt. See console for details.");
  } else {
    await loadPrompts();
  }
}

/**
 * Handle Edit click: open modal pre-filled for that prompt.
 */
function handleEditClick(event) {
  const button = event.currentTarget;
  const id = button.dataset.id;

  const prompt = currentPrompts.find((p) => p.id === id);
  if (!prompt) {
    console.warn("Prompt not found for id:", id);
    return;
  }

  const modalBackdrop = document.getElementById("modal-backdrop");
  const modalTitle = document.getElementById("modal-title");
  const form = document.getElementById("new-prompt-form");
  const warningsBox = document.getElementById("modal-warnings");

  // Set title for edit mode
  modalTitle.textContent = "Edit Prompt";

  // Clear warnings
  warningsBox.classList.add("hidden");
  warningsBox.innerHTML = "";

  // Fill form fields
  form.elements["id"].value = prompt.id || "";
  form.elements["smart_title"].value = prompt.smart_title || "";
  form.elements["intro"].value = prompt.intro || "";
  form.elements["prompt"].value = prompt.prompt || "";
  form.elements["category"].value = prompt.category || "";
  form.elements["tags"].value = (prompt.tags || []).join(", ");
  form.elements["tone"].value = prompt.tone || "";
  form.elements["use_case"].value = prompt.use_case || "";
  form.elements["skill_level"].value = prompt.skill_level || "";
  form.elements["quality_score"].value = prompt.quality_score ?? 8;
  form.elements["clarity"].value = prompt.clarity ?? 8;
  form.elements["creativity"].value = prompt.creativity ?? 8;
  form.elements["usefulness"].value = prompt.usefulness ?? 8;
  form.elements["status"].value = prompt.status || "curated";

  // Open modal
  modalBackdrop.classList.remove("hidden");
}

/* ==========================================
   SORTING CONTROLS
========================================== */

/**
 * Attach click handlers to all sortable header cells.
 */
function setupSortingControls() {
  const sortableHeaders = document.querySelectorAll("th.sortable");

  sortableHeaders.forEach((header) => {
    header.addEventListener("click", () => {
      const column = header.dataset.column;

      if (!column) return;

      if (currentSort.column === column) {
        currentSort.ascending = !currentSort.ascending;
      } else {
        currentSort.column = column;
        currentSort.ascending = true;
      }

      loadPrompts();
    });
  });
}

/**
 * Update header labels with active ▲ / ▼ indicator.
 */
function updateSortHeaderLabels() {
  const sortableHeaders = document.querySelectorAll("th.sortable");

  sortableHeaders.forEach((header) => {
    const column = header.dataset.column;
    const baseLabel = header.textContent.replace(/▲|▼/g, "").trim();

    if (column === currentSort.column) {
      const arrow = currentSort.ascending ? "▲" : "▼";
      header.textContent = `${baseLabel} ${arrow}`;
    } else {
      header.textContent = `${baseLabel} ▲▼`;
    }
  });
}

/* ==========================================
   MODAL CONTROLS (NEW + EDIT)
========================================== */

function setupModalControls() {
  const modalBackdrop = document.getElementById("modal-backdrop");
  const openButton = document.getElementById("add-prompt-btn");
  const cancelButton = document.getElementById("cancel-modal");
  const form = document.getElementById("new-prompt-form");
  const warningsBox = document.getElementById("modal-warnings");
  const modalTitle = document.getElementById("modal-title");

  // Open modal for NEW prompt
  openButton.addEventListener("click", () => {
    // Reset form
    form.reset();
    form.elements["id"].value = "";
    // Default scores
    form.elements["quality_score"].value = 8;
    form.elements["clarity"].value = 8;
    form.elements["creativity"].value = 8;
    form.elements["usefulness"].value = 8;
    form.elements["status"].value = "curated";

    // Title + warnings
    modalTitle.textContent = "New Prompt";
    warningsBox.classList.add("hidden");
    warningsBox.innerHTML = "";

    modalBackdrop.classList.remove("hidden");
  });

  // Close modal
  cancelButton.addEventListener("click", () => {
    modalBackdrop.classList.add("hidden");
    warningsBox.classList.add("hidden");
    warningsBox.innerHTML = "";
    form.reset();
  });

  // Submit new or edited prompt
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);

    const id = (formData.get("id") || "").trim();

    const fields = {
      smart_title: (formData.get("smart_title") || "").trim(),
      intro: (formData.get("intro") || "").trim(),
      prompt: (formData.get("prompt") || "").trim(),
      category: (formData.get("category") || "").trim(),
      tags: cleanTags(formData.get("tags") || ""),
      tone: (formData.get("tone") || "").trim(),
      use_case: (formData.get("use_case") || "").trim(),
      skill_level: (formData.get("skill_level") || "").trim(),
      quality_score: Number(formData.get("quality_score") || 0),
      clarity: Number(formData.get("clarity") || 0),
      creativity: Number(formData.get("creativity") || 0),
      usefulness: Number(formData.get("usefulness") || 0),
      status: (formData.get("status") || "curated").trim(),
    };

    // Auto title if missing
    if (!fields.smart_title) {
      fields.smart_title = generateSmartTitle(fields.prompt);
    }

    // Validate
    const warnings = validatePromptFields(fields);

    if (warnings.length > 0) {
      warningsBox.classList.remove("hidden");
      warningsBox.innerHTML = warnings.join("<br>");
      return;
    } else {
      warningsBox.classList.add("hidden");
      warningsBox.innerHTML = "";
    }

    // Auto-score if needed
    if (!fields.quality_score || fields.quality_score <= 0) {
      const scores = autoScorePrompt(fields);
      Object.assign(fields, scores);
    }

    let error;

    if (id) {
      // EDIT mode → update
      const result = await supabase.from("prompts").update(fields).eq("id", id);
      error = result.error;
    } else {
      // NEW mode → insert
      const result = await supabase.from("prompts").insert(fields);
      error = result.error;
    }

    if (error) {
      console.error("Error saving prompt via modal:", error);
      alert("Error saving prompt. See console for details.");
      return;
    }

    form.reset();
    modalBackdrop.classList.add("hidden");

    // Reload prompts after add/edit
    await loadPrompts();
  });
}

/* ==========================================
   INITIALIZE ADMIN CONSOLE
========================================== */

setupSortingControls();
setupModalControls();
loadPrompts();
