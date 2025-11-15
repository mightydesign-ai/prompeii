window.addEventListener("error", function (e) {
  console.error("🔥 Global Error Caught:", e.message, e);
  toast("Something went wrong — check console.");
});

window.addEventListener("unhandledrejection", function (e) {
  console.error("🔥 Promise Error:", e.reason);
  toast("Unexpected error — check console.");
});

// modal.js — resilient ID binding (supports both legacy and advanced editor IDs)

function pick(...ids) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) return el;
  }
  return null;
}

const modalContainer = pick("improveModalContainer", "improveModal"); // advanced likely uses "improveModal"
const originalEl     = pick("improveOriginal", "diffOriginal", "originalText");
const improvedEl     = pick("improveImproved", "diffImproved", "improvedText");
const closeBtn       = pick("improveCloseBtn", "btnCloseImproveModal", "closeImprove");
const cancelBtn      = pick("improveCancelBtn", "btnCancelImproved", "cancelImprove");
const applyBtn       = pick("improveApplyBtn", "btnAcceptImproved", "applyImprove");

if (!modalContainer || !originalEl || !improvedEl || !closeBtn || !cancelBtn || !applyBtn) {
  console.warn("Improve modal: Missing required elements. Modal disabled.");
} else {
  function showImproveModal(originalText, improvedText = "") {
    originalEl.value = originalText || "";
    improvedEl.value = improvedText || "";
    modalContainer.classList.add("open");
  }

  function hideImproveModal() {
    modalContainer.classList.remove("open");
  }

  closeBtn.addEventListener("click", hideImproveModal);
  cancelBtn.addEventListener("click", hideImproveModal);

  applyBtn.addEventListener("click", () => {
    // Caller should listen for a custom event to receive improved text
    const detail = { improved: improvedEl.value };
    modalContainer.dispatchEvent(new CustomEvent("improve:apply", { detail }));
    hideImproveModal();
  });

  // Expose for other modules
  window.PrompeiiImproveModal = { showImproveModal, hideImproveModal, modalContainer };
}
