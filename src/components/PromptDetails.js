// src/components/PromptDetail.js
export function createPromptDetail(prompt) {
  const detail = document.createElement('div');
  detail.className = 'prompt-detail';

  detail.innerHTML = `
    <div class="detail-header">
      <h2>${prompt.smart_title}</h2>
      <p class="meta">${prompt.category || 'Uncategorized'} • ${prompt.tone || 'Neutral'}</p>
    </div>
    <p class="intro">${prompt.intro || ''}</p>
    <pre class="prompt-block">${prompt.prompt}</pre>
    <button class="copy-detail">Copy Prompt</button>
    <button class="close-detail">Close</button>
  `;

  detail.querySelector('.copy-detail').addEventListener('click', () => {
    navigator.clipboard.writeText(prompt.prompt);
    alert('Prompt copied!');
  });

  detail.querySelector('.close-detail').addEventListener('click', () => {
    detail.remove();
  });

  return detail;
}
