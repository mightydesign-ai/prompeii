// =======================================================
// Prompeii — Improve Modal (Create + Edit pages)
// =======================================================
//
// Provides UI overlay where the user can request AI
// improvements to title, intro, or prompt text.
//
// Exports:
//   openAIModal(title, targetElement)
//
// This file is imported by:
//   admin-create.js
//   admin-edit.js
//
// =======================================================

console.log("[Prompeii] modal.js loaded");

// Grab modal elements
const modal           = document.getElementById("improveModal");
const modalTitle      = document.getElementById("improveTitle");
const modalTextarea   = document.getElementById("improveTextarea");
const modalCancel     = document.getElementById("improveCancel");
const modalSubmit     = document.getElementById("improveSubmit");

// We will store the active target input/textarea element here
let activeTarget = null;

// =======================================================
// Validate modal exists (avoid breaking on admin.html)
// =======================================================
if (!modal || !modalTextarea || !modalSubmit) {
  console.warn("[Prompeii] Improve Modal not found on this page.");
} else {
  console.log("[Prompeii] Improve Modal ready.");
}

// =======================================================
// Open Modal
// =======================================================
export function openAIModal(title, targetElement) {
  if (!modal) return; // modal not available on this page

  activeTarget = targetElement;

  modalTitle.textContent = title || "Improve";
  modalTextarea.value = targetElement.value || "";

  // Show modal
  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Autofocus
  setTimeout(() => {
    modalTextarea.focus();
    modalTextarea.selectionStart = modalTextarea.value.length;
  }, 20);
}

// =======================================================
// Close Modal
// =======================================================
function closeModal() {
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
  activeTarget = null;
}

// =======================================================
// Cancel Button
// =======================================================
modalCancel?.addEventListener("click", () => {
  closeModal();
});

// =======================================================
// ESC key closes modal
// =======================================================
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// =======================================================
// Submit Button — apply changes
// =======================================================
modalSubmit?.addEventListener("click", () => {
  if (activeTarget) {
    activeTarget.value = modalTextarea.value.trim();
    // trigger input event so preview updates
    activeTarget.dispatchEvent(new Event("input"));
  }
  closeModal();
});

// =======================================================
// Click outside the modal closes it
// =======================================================
modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});
