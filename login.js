import { createClient } from '@supabase/supabase-js';

// Load Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Elements
const loginBtn = document.getElementById("login-btn");
const errorBox = document.getElementById("error");

loginBtn.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorBox.textContent = error.message;
    return;
  }

  // Redirect to admin dashboard
  window.location.href = "/admin.html";
});
