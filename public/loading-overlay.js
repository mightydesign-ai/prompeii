// =============================================================
// Prompeii — Global Loading Overlay Controller
// =============================================================

(function () {
  const overlay = document.getElementById("loadingOverlay");

  if (!overlay) {
    console.error("[Prompeii] Loading overlay NOT found in DOM.");
    return;
  }

  // show overlay
  window.showLoading = function () {
    overlay.classList.add("show");
  };

  // hide overlay
  window.hideLoading = function () {
    overlay.classList.remove("show");
  };

  console.log("[Prompeii] Loading overlay ready.");
})();
