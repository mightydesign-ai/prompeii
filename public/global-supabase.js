// =============================================================
// Prompeii — Global Supabase Client (Stable + Diagnostic)
// =============================================================
//
// This script runs BEFORE all module scripts.
// It relies on the UMD build of supabase-js,
// which provides a global: `supabase`
//
// The created client is exposed as:
//   window.supabaseClient
//
// All admin pages reference:
//   const supabase = window.supabaseClient;
//
// =============================================================

(function () {
  console.log("[Prompeii] Initializing global Supabase client...");

  if (typeof supabase === "undefined") {
    console.error(
      "[Prompeii] ERROR: Supabase library missing.",
      "The UMD build was not loaded before this file."
    );
    return;
  }

  try {
    window.supabaseClient = supabase.createClient(
      "https://nbduzkycgklkptbefalu.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5iZHV6a3ljZ2tsa3B0YmVmYWx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4OTAxODMsImV4cCI6MjA3ODQ2NjE4M30.WR_Uah7Z8x_Tos6Nx8cjDo_q6e6c15xGDPOMGbb_RZ0"
    );

    if (!window.supabaseClient) {
      console.error("[Prompeii] ERROR: Supabase client failed to initialize.");
    } else {
      console.log("[Prompeii] Supabase client ready.");
    }
  } catch (err) {
    console.error("[Prompeii] ERROR during Supabase init:", err);
  }
})();
