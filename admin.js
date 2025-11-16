// =========================================================
// Prompeii Admin – List Page Logic (FINAL, AUTH-GUARDED)
// =========================================================

// =========================================================
// Use GLOBAL Supabase client (single instance only)
// =========================================================
const supabase = window.supabaseClient;

// =========================================================
// Global Error Boundaries (Prevents Silent Breaks)
// =========================================================
window.addEventListener("error", function (e) {
  console.error("🔥 Global Error Caught:", e.message, e);
  toast("Something went wrong — check console.");
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("🔥 Promise Error:", e.reason);
  toast("Unexpected error — check console.");
});

// =========================================================
// Auth Guard
// =========================================================
async function requireAuth() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

// =========================================================
// DOM Elements
// =========================================================
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const tableBody = document.getElementById("tableBody");
const emptyStateEl = document.getElementById("emptyState");
const rowCountEl = document.getElementById("rowCount");
const headerCells = document.querySelectorAll("th[data-sort]");

// =========================================================
// State
// =========================================================
const state = {
  rows: [],
  filtered: [],
  sortKey: "updated_at",
  sortDirection: "desc",
  search: "",
  status: "all",
};

// =========================================================
// Load rows from Supabase
// =========================================================
async function loadRows() {
  console.log("Loading rows from Supabase…");

  const { data, error } = await supabase
    .from("prompts")
    .select(
      "id, smart_title, category, tags, model, clarity, creativity, usefulness, quality_score, status, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    toast("Failed to load prompts");
    return;
  }

  state.rows = data || [];
  applyFilters();
}

// =========================================================
// Sorting Helper
// =========================================================
function sortByKey(items, key, dir = "asc") {
  const isNumeric = ["quality_score", "clarity", "creativity", "usefulness"].includes(key);
  const isDate = ["createddate", "lastupdated", "updated_at"].includes(key);
  const mul = dir === "asc" ? 1 : -1;

  return items.slice().sort((a, b) => {
    const va = a[key];
    const vb = b[key];

    if (isNumeric) return (Number(va ?? 0) - Number(vb ?? 0)) * mul;
    if (isDate)
      return (new Date(va || 0).getTime() - new Date(vb || 0).getTime()) * mul;

    return ((va ?? "").toString().toLowerCase())
      .localeCompare((vb ?? "").toString().toLowerCase()) * mul;
  });
}

// =========================================================
// Filtering + Sorting
// =========================================================
function applyFilters() {
  let rows = [...state.rows];

  if (state.status !== "all") {
    rows = rows.filter((r) => (r.status || "").toLowerCase() === state.status);
  }

  if (state.search) {
    const q = state.search.toLowerCase();
    rows = rows.filter((r) => {
      return (
        (r.smart_title || "").toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q) ||
        (r.tags || []).join(", ").toLowerCase().includes(q)
      );
    });
  }

  rows = sortByKey(rows, state.sortKey, state.sortDirection);

  state.filtered = rows;
  renderTable();
}

// =========================================================
// Render Table (Tailwind Version)
// =========================================================
function renderTable() {
  tableBody.innerHTML = "";

  if (!state.filtered.length) {
    emptyStateEl.classList.remove("hidden");
    rowCountEl.textContent = "0 prompts";
    return;
  }

  emptyStateEl.classList.add("hidden");
  rowCountEl.textContent = `${state.filtered.length} prompts`;

  state.filtered.forEach((row) => {
    if (!row.id) return;

    const tr = document.createElement("tr");
    tr.className =
      "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors";

    tr.addEventListener("click", () =>
      window.location.href = `admin-edit.html?id=${row.id}`
    );

    tr.innerHTML = `
      <td class="px-4 py-3">${row.smart_title || "Untitled"}</td>
      <td class="px-4 py-3">${row.category || "—"}</td>
      <td class="px-4 py-3 capitalize">${row.status}</td>
      <td class="px-4 py-3">${new Date(row.updated_at).toLocaleDateString()}</td>
      <td class="px-4 py-3">
        <button
          onclick="event.stopPropagation(); window.location.href='admin-edit.html?id=${row.id}'"
          class="inline-flex items-center rounded-md bg-gray-900 text-white text-xs font-medium px-3 py-1 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition"
        >
          Edit
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// =========================================================
// Event Bindings
// =========================================================
searchInput.addEventListener("input", (e) => {
  state.search = e.target.value;
  applyFilters();
});

statusFilter.addEventListener("change", (e) => {
  state.status = e.target.value;
  applyFilters();
});

headerCells.forEach((th) => {
  th.addEventListener("click", () => {
    const key = th.dataset.sort;

    if (state.sortKey === key) {
      state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDirection = "asc";
    }

    headerCells.forEach((cell) =>
      cell.classList.remove("sort-asc", "sort-desc")
    );

    th.classList.add(
      state.sortDirection === "asc" ? "sort-asc" : "sort-desc"
    );

    applyFilters();
  });
});

// =========================================================
// Init
// =========================================================
function init() {
  console.log("Admin list page initialized.");
  loadRows();
}

// =========================================================
// Auth-protected startup
// =========================================================
document.addEventListener("DOMContentLoaded", async () => {
  const ok = await requireAuth();
  if (!ok) return;
  init();
});
