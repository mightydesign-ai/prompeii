// =======================================================
// Prompeii — Improve Modal (ES Module)
// =======================================================

console.log("[Prompeii] modal.js loaded");

const modal = document.getElementById("improveModal");
const modalTitle = document.getElementById("improveTitle");
const modalTextarea = document.getElementById("improveTextarea");
const modalSubmit = document.getElementById("improveSubmit");
const modalCancel = document.getElementById("improveCancel");

let targetInput = null;

// Exported API
export function openAIModal(title, inputElement) {
  if (!modal) {
    console.warn("[Prompeii] Improve Modal not found on this page.");
    return;
  }

  targetInput = inputElement || null;
  modalTitle.textContent = title || "Improve";
  modalTextarea.value = targetInput ? (targetInput.value || "") : "";

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

modalCancel?.addEventListener("click", closeModal);

modalSubmit?.addEventListener("click", () => {
  if (!targetInput) return;
  const improved = modalTextarea.value.trim();
  targetInput.value = improved;
  // notify listeners (preview, validation, etc.)
  targetInput.dispatchEvent(new Event("input"));
  closeModal();
});

// click backdrop to close
modal?.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

console.log("[Prompeii] Improve Modal ready.");
