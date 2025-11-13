import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

let allPrompts = [];
let sortField = null;
let sortDirection = "asc";
let currentSearch = "";
let currentCategory = "";

// ======================================
// LOAD PROMPTS
// ======================================
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

  allPrompts = data;

  populateCategoryFilter();
  renderTable();
}

// ======================================
// POPULATE CATEGORY DROPDOWN
// ======================================
function populateCategoryFilter() {
  const select = document.getElementById("category-filter");
  const categories = [...new Set(allPrompts.map((p) => p.category).filter(Boolean))];

  select.innerHTML = `<option value="">All Categories</option>`;
  categories.forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.textContent = c;
    select.appendChild(option);
  });
}

// ======================================
// RENDER TABLE (with sorting + filtering)
// ======================================
function renderTable() {
  let rows = [...allPrompts];

  // SEARCH FILTER
  if (currentSearch.trim() !== "") {
    const q = currentSearch.toLowerCase();
    rows = rows.filter(
      (p) =>
        p.smart_title?.toLowerCase().includes(q) ||
        p.intro?.toLowerCase().includes(q) ||
        p.prompt?.toLowerCase().includes(q)
    );
  }

  // CATEGORY FILTER
  if (currentCategory !== "") {
    rows = rows.filter((p) => p.category === currentCategory);
  }

  // SORTING
  if (sortField) {
    rows.sort((a, b) => {
      const va = a[sortField] ?? "";
      const vb = b[sortField] ?? "";

      if (va < vb) return sortDirection === "asc" ? -1 : 1;
      if (va > vb) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  const table = document.getElementById("prompts-table-body");
  table.innerHTML = "";

  rows.forEach((p) => {
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
  attachSortHandlers();
}

// ======================================
// SORT CLICK HANDLERS
// ======================================
function attachSortHandlers() {
  document.querySelectorAll("th[data-sort]").forEach((th) => {
    th.onclick = () => {
      const field = th.dataset.sort;

      if (sortField === field) {
        sortDirection = sortDirection === "asc" ? "desc" : "asc";
      } else {
        sortField = field;
        sortDirection = "asc";
      }

      renderTable();
    };
  });
}

// ======================================
// SAVE + DELETE HANDLERS (same as before)
// ======================================
function attachSaveHandlers() { /* same code as previous version */ }
function attachDeleteHandlers() { /* same code as previous version */ }

// ======================================
// SEARCH + FILTER EVENTS
// ======================================
document.getElementById("search-input").oninput = (e) => {
  currentSearch = e.target.value;
  renderTable();
};

document.getElementById("category-filter").onchange = (e) => {
  currentCategory = e.target.value;
  renderTable();
};

document.getElementById("clear-filters").onclick = () => {
  currentSearch = "";
  currentCategory = "";
  document.getElementById("search-input").value = "";
  document.getElementById("category-filter").value = "";
  renderTable();
};

// ======================================
// MODAL LOGIC (same as before)
// ======================================
// ... (unchanged modal + insert code from previous script)

loadPrompts();
