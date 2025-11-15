// =============================================================
// Prompeii — Dropdown Option Utilities (SAFE GLOBAL VERSION)
// =============================================================
//
// This module exports ONLY:
//   - CATEGORY_OPTIONS
//   - TONE_OPTIONS
//   - USE_CASE_OPTIONS
//   - SKILL_LEVEL_OPTIONS
//   - fillSelect(selectEl, list)
// 
// It intentionally:
//   - DOES NOT use toast()
//   - DOES NOT attach global error handlers
//   - DOES NOT assume DOM elements exist
//   - DOES NOT assume early Supabase availability
//
// Fully compatible with Vite ES modules.
// =============================================================

console.log("[Prompeii] options.js loaded");

// -------------------------------------------------------------
// Master Option Sets
// -------------------------------------------------------------
export const CATEGORY_OPTIONS = [
  "Business",
  "Creative",
  "Coding",
  "Education",
  "Marketing",
  "Productivity",
  "UX / UI",
  "Writing",
  "Other"
];

export const TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Casual",
  "Confident",
  "Enthusiastic",
  "Neutral"
];

export const USE_CASE_OPTIONS = [
  "Analysis",
  "Brainstorming",
  "Content Creation",
  "Research",
  "Planning",
  "Design",
  "Development",
  "Writing"
];

export const SKILL_LEVEL_OPTIONS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert"
];

// -------------------------------------------------------------
// Safe Select Filler
// -------------------------------------------------------------
//
// Usage:
//    fillSelect(categorySelectEl, CATEGORY_OPTIONS)
//
// - If selectEl is missing → fails silently
// - If array is empty → clears select
// - Never throws errors
//
export function fillSelect(selectEl, list = []) {
  if (!selectEl) {
    console.warn("[Prompeii] fillSelect skipped (element missing).");
    return;
  }

  // Clear existing options
  selectEl.innerHTML = "";

  // Populate
  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    selectEl.appendChild(option);
  });
}

