/* =========================================================
   Prompeii Improve Prompt Modal (FINAL FIXED VERSION)
   ========================================================= */

let modalOverlay;
let modalContainer;
let modalOriginal;
let modalImproved;
let modalCloseBtn;
let modalCancelBtn;
let modalApplyBtn;

let improveTargetTextarea = null;
let modalInitialized = false;

/* ---------------------------------------------------------
   INIT (runs once)
--------------------------------------------------------- */
function initImproveModal() {
  if (modalInitialized) return;

  modalOverlay     = document.getElementById("improveModalOverlay");
  modalContainer   = document.getElementById("improveModalContainer");
  modalOriginal    = document.getElementById("improveOriginal");
  modalImproved    = document.getElementById("improveImproved");
  modalCloseBtn    = document.getElementById("improveCloseBtn");
  modalCancelBtn   = document.getElementById("improveCancelBtn");
  modalApplyBtn    = document.getElementById("improveApplyBtn");

  // Ensure modal is hidden on load no matter what
  if (modalOverlay)   modalOverlay.style.display = "none";
  if (modalContainer) modalContainer.style.display = "none";

  // If anything is missing, disable modal (no crashes)
  if (!modalOverlay || !modalContainer || !modalOriginal ||
      !modalImproved || !modalCloseBtn || !modalCancelBtn || !modalApplyBtn) {
    console.warn("[Prompeii Modal] Missing required modal elements. Modal disabled.");
    return;
  }

  /* EVENTS */

  // Close modal when clicking overlay
  modalOverlay.addEventListener("click", closeImproveModal);

  // Close (X)
  modalCloseBtn.addEventListener("click", closeImproveModal);

  // Cancel button
  modalCancelBtn.addEventListener("click", closeImproveModal);

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeImproveModal();
  });

  // Apply → write back to textarea → close
  modalApplyBtn.addEventListener("click", () => {
    if (improveTargetTextarea) {
      improveTargetTextarea.value = modalImproved.textContent;
      improveTargetTextarea.dispatchEvent(new Event("input", { bubbles: true }));
    }
    closeImproveModal();
  });

  modalInitialized = true;
}

/* ---------------------------------------------------------
   OPEN MODAL
--------------------------------------------------------- */
function openImproveModal(originalText, improvedText, textareaRef) {
  initImproveModal();

  if (!modalInitialized) return;

  improveTargetTextarea = textareaRef;

  modalOriginal.textContent = originalText || "";
  modalImproved.textContent = improvedText || "";

  modalOverlay.style.display = "block";
  modalContainer.style.display = "flex";
  document.body.style.overflow = "hidden";
}

/* ---------------------------------------------------------
   CLOSE MODAL
--------------------------------------------------------- */
function closeImproveModal() {
  if (!modalInitialized) return;

  modalOverlay.style.display = "none";
  modalContainer.style.display = "none";
  document.body.style.overflow = "";
}

/* ---------------------------------------------------------
   EXPORT FUNCTIONS
--------------------------------------------------------- */
window.openImproveModal = openImproveModal;
window.closeImproveModal = closeImproveModal;

/* ---------------------------------------------------------
   AUTO-INSTANTIATE WHEN DOM LOADED
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", initImproveModal);
