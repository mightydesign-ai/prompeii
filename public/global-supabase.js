// =============================================================
// Prompeii — Global Supabase Client (Stable + Diagnostic)
// =============================================================
// - Works inside /public (no module imports)
// - Requires the UMD script BEFORE this file:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
//   <script src="/global-supabase.js"></script>
//
// - Admin pages should use:
//     const supabase = window.supabaseClient;
// =============================================================

(function () {
  // Optional: adjust log noise depending on environment
  const debug = true;

  if (debug) console.log("[Prompeii] Initializing global Supabase client…");

  // Ensure the UMD build is available
  if (typeof window.supabase === "undefined") {
    console.error(
      "[Prompeii] ERROR: Supabase UMD library not detected.",
      "Make sure the <script> tag for supabase-js@UMD is included BEFORE global-supabase.js."
    );
    return;
  }

  try {
    // Create client
    const client = window.supabase.createClient(
      "https://nbduzkycgklkptbefalu.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0"
    );

    if (!client) {
      console.error("[Prompeii] ERROR: Supabase.createClient() returned null.");
      return;
    }

    // Expose globally
    window.supabaseClient = client;

    if (debug) console.log("[Prompeii] Supabase client ready.");

  } catch (err) {
    console.error("[Prompeii] ERROR during Supabase init:", err);
  }
})();
