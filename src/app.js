// ----------------------------
// Prompeii V4 - app.js
// Vanilla JS + Supabase + Custom Toast
// ----------------------------

// Import Supabase client
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ----------------------------
// Toast Notification (no React)
// ----------------------------
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // fade in
  setTimeout(() => toast.classList.add('visible'), 10);
  // fade out
  setTimeout(() => toast.classList.remove('visible'), 2000);
  // remove from DOM
  setTimeout(() => toast.remove(), 2500);
}

// ----------------------------
// Prompt Card Class
// ----------------------------
class PromptCard {
  constructor(prompt) {
    this.prompt = prompt;
  }

  createElement() {
    const div = document.createElement('div');
    div.classList.add('prompt-card');

    div.innerHTML = `
      <h3>${this.prompt.smart_title || this.prompt.title}</h3>
      <p>${this.prompt.intro || this.prompt.content}</p>
      <button class="copy-button">Copy Prompt</button>
    `;

    const button = div.querySelector('.copy-button');
    button.addEventListener('click', () => this.copyToClipboard());

    return div;
  }

  copyToClipboard() {
    const textToCopy = this.prompt.prompt || this.prompt.content;
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy)
      .then(() => showToast('🔥 Prompt copied!'))
      .catch(() => showToast('⚠️ Copy failed'));
  }
}

// ----------------------------
// Fetch + Render Prompts
// ----------------------------
async function loadPrompts() {
  const app = document.getElementById('app');
  app.innerHTML = '<p>Loading prompts...</p>';

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .limit(10);

  if (error) {
    console.error('Error fetching prompts:', error);
    app.innerHTML = '<p>Failed to load prompts.</p>';
    return;
  }

  app.innerHTML = '';
  prompts.forEach((prompt) => {
    const card = new PromptCard(prompt);
    app.appendChild(card.createElement());
  });
}

// ----------------------------
// Run the App
// ----------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadPrompts();
});

