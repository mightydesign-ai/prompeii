// --- Supabase configuration ---
// Replace these with your actual values from the Supabase dashboard.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client (v2 via CDN)
const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// DOM elements
const toastEl = document.getElementById("toast");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const tableBody = document.getElementById("promptTableBody");
const rowCountEl = document.getElementById("rowCount");
const emptyStateEl = document.getElementById("emptyState");

const tableElement = document.querySelector(".prompt-table");
const headerCells = tableElement.querySelectorAll("th.sortable");

// State
const state = {
  rows: [],
  filteredRows: [],
  sortKey: "updated_at",
  sortDirection: "desc", // "asc" | "desc"
  searchQuery: "",
  statusFilter: "all",
};

/* ------------------- Utilities ------------------- */

function showToast(message, type = "default") {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("toast-visible");

  setTimeout(() => {
    toastEl.classList.remove("toast-visible");
  }, 2600);
}

function formatDateShort(timestamp) {
  if (!timestamp) return "—";
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value, decimals = 1) {
  if (value === null || typeof value === "undefined" || value === "") {
    return "—";
  }
  const n = Number(value);
  if (Number.isNaN(n)) return "—";
  return n.toFixed(decimals);
}

function normalizeStatus(status) {
  if (!status) return "";
  return String(status).toLowerCase();
}

function statusClass(status) {
  const s = normalizeStatus(status);
  if (s === "published") return "status-badge status-published";
  if (s === "draft") return "status-badge status-draft";
  if (s === "archived") return "status-badge status-archived";
  return "status-badge";
}

function joinTags(tagsArray) {
  if (!Array.isArray(tagsArray) || !tagsArray.length) return [];
  return tagsArray;
}

/* ------------------- Supabase Load ------------------- */

async function loadPrompts() {
  try {
    const { data, error } = await supabase
      .from("prompts")
      .select(
        "id, smart_title, category, tags, status, quality_score, updated_at, model, clarity, creativity, usefulness"
      )
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Supabase load error:", error);
      showToast("Error loading prompts. Check console.", "error");
      return;
    }

    state.rows = data || [];
    applyFiltersAndSort();
  } catch (err) {
    console.error("Load error:", err);
    showToast("Error loading prompts. Check console.", "error");
  }
}

/* ------------------- Filtering & Sorting ------------------- */

function applyFiltersAndSort() {
  const query = state.searchQuery.trim().toLowerCase();
  const statusFilterValue = state.statusFilter;

  let rows = state.rows.slice();

  // Filter by status
  if (statusFilterValue !== "all") {
    rows = rows.filter((row) => {
      return normalizeStatus(row.status) === statusFilterValue;
    });
  }

  // Filter by search
  if (query) {
    rows = rows.filter((row) => {
      const title = (row.smart_title || "").toLowerCase();
      const category = (row.category || "").toLowerCase();
      const status = normalizeStatus(row.status);
      const tags = joinTags(row.tags)
        .join(", ")
        .toLowerCase();

      return (
        title.includes(query) ||
        category.includes(query) ||
        status.includes(query) ||
        tags.includes(query)
      );
    });
  }

  // Sort
  const { sortKey, sortDirection } = state;
  rows.sort((a, b) => {
    const va = a[sortKey];
    const vb = b[sortKey];

    // Numeric-ish keys
    if (
      ["clarity", "creativity", "usefulness", "quality_score"].includes(
        sortKey
      )
    ) {
      const na = Number(va) || 0;
      const nb = Number(vb) || 0;
      return sortDirection === "asc" ? na - nb : nb - na;
    }

    // Date
    if (sortKey === "updated_at") {
      const da = va ? new Date(va).getTime() : 0;
      const db = vb ? new Date(vb).getTime() : 0;
      return sortDirection === "asc" ? da - db : db - da;
    }

    // String
    const sa = (va || "").toString().toLowerCase();
    const sb = (vb || "").toString().toLowerCase();
    if (sa < sb) return sortDirection === "asc" ? -1 : 1;
    if (sa > sb) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  state.filteredRows = rows;
  renderTable();
}

/* ------------------- Rendering ------------------- */

function renderTable() {
  const rows = state.filteredRows;
  tableBody.innerHTML = "";

  if (!rows.length) {
    emptyStateEl.hidden = false;
    rowCountEl.textContent = "0 prompts";
    return;
  }

  emptyStateEl.hidden = true;
  rowCountEl.textContent =
    rows.length === 1 ? "1 prompt" : `${rows.length} prompts`;

  const fragment = document.createDocumentFragment();

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.dataset.id = row.id;

    // Smart title
    const tdTitle = document.createElement("td");
    const titleSpan = document.createElement("span");
    titleSpan.className = "cell-title";
    titleSpan.textContent = row.smart_title || "Untitled prompt";

    const subtitleSpan = document.createElement("span");
    subtitleSpan.className = "cell-subtitle";
    const status = row.status || "—";
    const category = row.category || "—";
    subtitleSpan.textContent = `${status} · ${category}`;

    tdTitle.appendChild(titleSpan);
    tdTitle.appendChild(subtitleSpan);

    // Category
    const tdCategory = document.createElement("td");
    const cat = row.category || "—";
    const catSpan = document.createElement("span");
    catSpan.className = "category-pill";
    catSpan.textContent = cat;
    tdCategory.appendChild(catSpan);

    // Tags
    const tdTags = document.createElement("td");
    const tagListDiv = document.createElement("div");
    tagListDiv.className = "tag-list";
    const tags = joinTags(row.tags);
    if (tags.length) {
      tags.forEach((t) => {
        const chip = document.createElement("span");
        chip.className = "tag-chip";
        chip.textContent = t;
        tagListDiv.appendChild(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.className = "cell-subtitle";
      empty.textContent = "—";
      tagListDiv.appendChild(empty);
    }
    tdTags.appendChild(tagListDiv);

    // Model
    const tdModel = document.createElement("td");
    tdModel.textContent = row.model || "—";

    // Clarity
    const tdClarity = document.createElement("td");
    tdClarity.className = "numeric";
    tdClarity.textContent = formatNumber(row.clarity, 1);

    // Creativity
    const tdCreativity = document.createElement("td");
    tdCreativity.className = "numeric";
    tdCreativity.textContent = formatNumber(row.creativity, 1);

    // Usefulness
    const tdUsefulness = document.createElement("td");
    tdUsefulness.className = "numeric";
    tdUsefulness.textContent = formatNumber(row.usefulness, 1);

    // Quality
    const tdQuality = document.createElement("td");
    tdQuality.className = "numeric";
    tdQuality.textContent = formatNumber(row.quality_score, 1);

    // Updated At
    const tdUpdated = document.createElement("td");
    tdUpdated.className = "numeric";
    tdUpdated.textContent = formatDateShort(row.updated_at);

    // Actions
    const tdActions = document.createElement("td");
    tdActions.className = "actions-cell";

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "btn btn-ghost-compact";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      goToEdit(row.id);
    });

    const statusBadgeSpan = document.createElement("span");
    statusBadgeSpan.className = statusClass(row.status);
    statusBadgeSpan.style.marginLeft = "6px";
    statusBadgeSpan.textContent = (row.status || "unknown").toUpperCase();

    tdActions.appendChild(editBtn);
    tdActions.appendChild(statusBadgeSpan);

    // Compose row
    tr.appendChild(tdTitle);
    tr.appendChild(tdCategory);
    tr.appendChild(tdTags);
    tr.appendChild(tdModel);
    tr.appendChild(tdClarity);
    tr.appendChild(tdCreativity);
    tr.appendChild(tdUsefulness);
    tr.appendChild(tdQuality);
    tr.appendChild(tdUpdated);
    tr.appendChild(tdActions);

    // Row click → edit
    tr.addEventListener("click", () => {
      goToEdit(row.id);
    });

    fragment.appendChild(tr);
  });

  tableBody.appendChild(fragment);
}

/* ------------------- Navigation ------------------- */

function goToEdit(id) {
  if (!id) return;
  window.location.href = `admin-edit.html?id=${encodeURIComponent(id)}`;
}

/* ------------------- Event Wiring ------------------- */

function handleSearchInput(event) {
  state.searchQuery = event.target.value || "";
  applyFiltersAndSort();
}

function handleStatusFilter(event) {
  state.statusFilter = event.target.value || "all";
  applyFiltersAndSort();
}

function handleHeaderClick(event) {
  const th = event.currentTarget;
  const sortKey = th.dataset.sortKey;
  if (!sortKey) return;

  // Toggle direction if same column
  if (state.sortKey === sortKey) {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  } else {
    state.sortKey = sortKey;
    state.sortDirection = "asc";
  }

  // Update header sort classes
  headerCells.forEach((cell) => {
    cell.classList.remove("sort-asc", "sort-desc");
  });
  th.classList.add(
    state.sortDirection === "asc" ? "sort-asc" : "sort-desc"
  );

  applyFiltersAndSort();
}

/* ------------------- Init ------------------- */

function init() {
  // Event listeners
  searchInput.addEventListener("input", handleSearchInput);
  statusFilter.addEventListener("change", handleStatusFilter);

  headerCells.forEach((th) => {
    th.addEventListener("click", handleHeaderClick);
  });

  // Initial sort indicator on Updated
  headerCells.forEach((th) => {
    const key = th.dataset.sortKey;
    if (key === state.sortKey) {
      th.classList.add(
        state.sortDirection === "asc" ? "sort-asc" : "sort-desc"
      );
    }
  });

  loadPrompts();
}

document.addEventListener("DOMContentLoaded", init);
