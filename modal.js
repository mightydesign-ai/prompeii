// =============================================================
// Prompeii — Improve Modal System (GLOBAL SAFE VERSION)
// =============================================================
//
// This script must be loaded AFTER:
//   - global toast is defined
//   - global supabase client is defined (optional here)
//
// This file registers a global object:
//   window.PrompeiiImproveModal = { showImproveModal, modalContainer }
//
// The admin-edit.js and admin-create.js pages hook into this.
//
// =============================================================

console.log("[Prompeii] modal.js loaded");

function $(id) {
  return document.getElementById(id);
}

// ----- DOM ELEMENTS -----
const modalContainer = $("improveModal");
const diffOriginal = $("diffOriginal");
const diffImproved = $("diffImproved");

const btnApply = $("btnAcceptImproved");
const btnCancel = $("btnCancelImproved");
const btnCloseX = $("btnCloseImproveModal");

// Safety: if page does not include modal, bail out
if (!modalContainer) {
  console.warn("[Prompeii] Improve Modal not found on this page.");
} else {
  console.log("[Prompeii] Improve Modal initialized.");
}

// =============================================================
// OPEN MODAL
// =============================================================
function showImproveModal(originalText = "") {
  if (!modalContainer) return;

  diffOriginal.value = originalText || "";
  diffImproved.value = "";

  modalContainer.classList.add("open");
  document.body.classList.add("modal-open");
}

// =============================================================
// CLOSE MODAL
// =============================================================
function closeModal() {
  if (!modalContainer) return;

  modalContainer.classList.remove("open");
  document.body.classList.remove("modal-open");

  diffOriginal.value = "";
  diffImproved.value = "";
}

// =============================================================
// APPLY IMPROVEMENT
// =============================================================
//
// When user clicks Apply:
//   - Dispatch custom event "improve:apply"
//   - admin-edit.js or admin-create.js listens for this event
//
function applyImproved() {
  const improvedText = diffImproved.value;

  const event = new CustomEvent("improve:apply", {
    detail: { improved: improvedText }
  });

  modalContainer.dispatchEvent(event);
  closeModal();
}

// =============================================================
// EVENT WIRING (SAFE, NO DUPLICATES)
// =============================================================
function wireModalEvents() {
  if (!modalContainer) return;

  // Prevent double binding
  btnApply?.removeEventListener("click", applyImproved);
  btnCancel?.removeEventListener("click", closeModal);
  btnCloseX?.removeEventListener("click", closeModal);

  // Wire fresh
  btnApply?.addEventListener("click", applyImproved);
  btnCancel?.addEventListener("click", closeModal);
  btnCloseX?.addEventListener("click", closeModal);

  // Allow click on backdrop to close
  modalContainer.addEventListener("click", (e) => {
    if (e.target === modalContainer) closeModal();
  });
}

// =============================================================
// INIT (runs when DOM is fully available)
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  wireModalEvents();
  console.log("[Prompeii] Improve Modal ready.");
});

// =============================================================
// EXPOSE GLOBAL API
// =============================================================
window.PrompeiiImproveModal = {
  showImproveModal,
  modalContainer
};
