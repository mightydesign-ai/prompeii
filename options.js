window.addEventListener("error", function (e) {
  console.error("🔥 Global Error Caught:", e.message, e);
  toast("Something went wrong — check console.");
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("🔥 Promise Error:", e.reason);
  toast("Unexpected error — check console.");
});

// options.js
export const CATEGORY_OPTIONS = [
  "Creative", "Business", "Marketing", "Code", "UX", "Writing", "Education", "Research", "Other"
];

export const TONE_OPTIONS = [
  "Professional", "Casual", "Friendly", "Direct", "Playful", "Technical", "Academic", "Persuasive", "Neutral"
];

export const USE_CASE_OPTIONS = [
  "Brainstorming", "Content", "Planning", "Analysis", "Debugging", "Ideation", "Summarization", "Scripting", "Interview"
];

export const SKILL_LEVEL_OPTIONS = [
  "Beginner", "Intermediate", "Advanced", "Expert"
];

export function fillSelect(selectEl, values, currentValue = "") {
  if (!selectEl) return;
  selectEl.innerHTML = `<option value=""></option>` + values
    .map(v => `<option value="${v}">${v}</option>`)
    .join("");
  if (currentValue) selectEl.value = currentValue;
}
