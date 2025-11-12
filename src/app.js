// ======================================================
// Prompeii V4 — Phase 2 MVP App
// Curated AI Prompt Browser
// ======================================================

// --- Imports ---
import { createClient } from '@supabase/supabase-js';
import { createPromptCard } from './components/PromptCard.js';
import { getFavorites } from './utils/storage.js';

// --- Supabase Setup ---
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// --- Load Prompts ---
async function loadPrompts() {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const app = document.getElementById('app');
    if (!app) {
      console.error('App container not found.');
      return;
    }

    app.innerHTML = '';
    data.forEach((prompt) => {
      const card = createPromptCard(prompt);
      app.appendChild(card);
    });

    console.log(`✅ Loaded ${data.length} prompts from Supabase`);
  } catch (err) {
    console.error('❌ Error loading prompts:', err.message);
  }
}

// --- Load Favorites ---
function loadFavorites() {
  const app = document.getElementById('app');
  if (!app) return;

  const favorites = getFavorites();
  if (!favorites.length) {
    app.innerHTML = `<p style="color:#aaa;text-align:center;">No favorites yet.</p>`;
    return;
  }

  app.innerHTML = `<h2 style="color:#fff;">Your Favorites</h2>`;
  favorites.forEach(async (id) => {
    const { data, error } = await supabase.from('prompts').select('*').eq('id', id).single();
    if (!error && data) {
      app.appendChild(createPromptCard(data));
    }
  });
}

// --- Navigation ---
function setupNavigation() {
  const discoverBtn = document.getElementById('nav-discover');
  const favoritesBtn = document.getElementById('nav-favorites');

  if (discoverBtn)
    discoverBtn.addEventListener('click', () => {
      setActiveNav(discoverBtn);
      loadPrompts();
    });

  if (favoritesBtn)
    favoritesBtn.addEventListener('click', () => {
      setActiveNav(favoritesBtn);
      loadFavorites();
    });
}

function setActiveNav(activeBtn) {
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadPrompts(); // Default view
});
