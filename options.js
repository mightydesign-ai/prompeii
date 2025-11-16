// =======================================================
// Prompeii Admin — Option Lists (Static, Vite-safe)
// =======================================================
//
// No Supabase queries.
// Everything is controlled, stable, curated.
//
// Exported functions (ES Modules):
//   populateCategoryOptions
//   populateToneOptions
//   populateUseCaseOptions
//   populateSkillLevelOptions
//
// =======================================================

console.log("[Prompeii] options.js loaded");

// Clean curated options extracted from your CSV
const CATEGORY_OPTIONS = [
  "Business",
  "Marketing",
  "Development"
];

const TONE_OPTIONS = [
  "Professional",
  "Persuasive",
  "Analytical"
];

const USE_CASE_OPTIONS = [
  "Analysis",
  "Product Writing",
  "Code Review"
];

const SKILL_LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced"
];

// Utility to fill a <select>
function populate(selectEl, items) {
  selectEl.innerHTML = "";
  items.forEach(function (item) {
    const opt = document.createElement("option");
    opt.value = item;
    opt.textContent = item;
    selectEl.appendChild(opt);
  });
}

// =======================================================
// Exported helpers
// =======================================================

export async function populateCategoryOptions(selectEl) {
  populate(selectEl, CATEGORY_OPTIONS);
}

export async function populateToneOptions(selectEl) {
  populate(selectEl, TONE_OPTIONS);
}

export async function populateUseCaseOptions(selectEl) {
  populate(selectEl, USE_CASE_OPTIONS);
}

export async function populateSkillLevelOptions(selectEl) {
  populate(selectEl, SKILL_LEVEL_OPTIONS);
}

// =======================================================
// End
// =======================================================
