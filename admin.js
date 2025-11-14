// =========================================================
// Prompeii Admin – List Page Logic (FINAL VERSION)
// =========================================================

// --- Supabase credentials embedded directly ---
const SUPABASE_URL = "https://nbduzkycgklkptbefalu.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0";

// --- Supabase client ---
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- DOM elements ---
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const tableBody = document.getElementById("promptTableBody");
const rowCountEl = document.getElementById("rowCount");
const emptyStateEl = document.getElementById("emptyState");

const headerCells = document.querySelectorAll("th.sortable");

// --- State ---
const state = {
  rows: [],
  filtered: [],
  sortKey: "updated_at",
  sortDirection: "desc",
  search: "",
  status: "all",
};

// =========================================================
// Toast
// =========================================================
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("toast-visible");
  setTimeout(() => t.classList.remove("toast-visible"), 2000);
}

// =========================================================
// Load data
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
// Filtering + Sorting
// =========================================================
function applyFilters() {
  let rows = [...state.rows];

  // Status filter
  if (state.status !== "all") {
    rows = rows.filter(
      (r) => (r.status || "").toLowerCase() === state.status
    );
  }

  // Search filter
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

  // Sorting
  rows.sort((a, b) => {
    const key = state.sortKey;
    const dir = state.sortDirection === "asc" ? 1 : -1;

    if (key === "updated_at") {
      return (
        (new Date(a.updated_at).getTime() -
          new Date(b.updated_at).getTime()) * dir
      );
    }

    const va = (a[key] || "").toString().toLowerCase();
    const vb = (b[key] || "").toString().toLowerCase();

    if (va < vb) return -1 * dir;
    if (va > vb) return 1 * dir;
    return 0;
  });

  state.filtered = rows;
  renderTable();
}

// =========================================================
// Render table
// =========================================================
function renderTable() {
  tableBody.innerHTML = "";

  if (!state.filtered.length) {
    emptyStateEl.style.display = "block";
    rowCountEl.textContent = "0 prompts";
    return;
  }

  emptyStateEl.style.display = "none";
  rowCountEl.textContent = `${state.filtered.length} prompts`;

  state.filtered.forEach((row) => {
    const tr = document.createElement("tr");
    tr.addEventListener("click", () => {
      window.location.href = `admin-edit.html?id=${row.id}`;
    });

    tr.innerHTML = `
      <td>${row.smart_title || "Untitled"}</td>
      <td>${row.category || "—"}</td>
      <td>
        ${(row.tags || [])
          .map((t) => `<span class="tag-chip">${t}</span>`)
          .join("")}
      </td>
      <td>${row.model || "—"}</td>
      <td class="numeric">${row.clarity ?? "—"}</td>
      <td class="numeric">${row.creativity ?? "—"}</td>
      <td class="numeric">${row.usefulness ?? "—"}</td>
      <td class="numeric">${row.quality_score ?? "—"}</td>
      <td>${new Date(row.updated_at).toLocaleDateString()}</td>
      <td>
        <button class="btn-ghost-compact"
          onclick="event.stopPropagation(); window.location.href='admin-edit.html?id=${row.id}'">
          Edit
        </button>
      </td>
    `;

    tableBody.appendChild(tr);
  });
}

// =========================================================
// Event bindings
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
    const key = th.dataset.sortKey;

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
document.addEventListener("DOMContentLoaded", () => {
  console.log("Admin list page loaded.");
  loadRows();
});
