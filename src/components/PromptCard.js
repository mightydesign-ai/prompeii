// src/components/PromptCard.js
import { saveFavorite, isFavorite } from '../utils/storage.js';

export function createPromptCard(prompt) {
  const card = document.createElement('div');
  card.className = 'prompt-card';

  const favActive = isFavorite(prompt.id) ? 'active' : '';

  card.innerHTML = `
    <h3>${prompt.smart_title}</h3>
    <p class="intro">${prompt.intro || ''}</p>
    <div class="card-actions">
      <button class="copy-btn" data-content="${prompt.prompt}">Copy</button>
      <button class="fav-btn ${favActive}" data-id="${prompt.id}">❤️</button>
    </div>
  `;

  // Copy button logic
  card.querySelector('.copy-btn').addEventListener('click', (e) => {
    const content = e.target.dataset.content;
    navigator.clipboard.writeText(content);
    showToast('Prompt copied!');
  });

  // Favorite button logic
  card.querySelector('.fav-btn').addEventListener('click', (e) => {
    const btn = e.target;
    const id = prompt.id;
    const isFav = saveFavorite(id);
    btn.classList.toggle('active', isFav);
    showToast(isFav ? 'Added to favorites' : 'Removed from favorites');
  });

  return card;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    toast.remove();
  }, 2000);
}
