import { Marked } from 'marked';

const SAFE_URL = /^(https?:|mailto:|tel:|\/|#)/i;

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const marked = new Marked({
  breaks: true,
  gfm: true,
  renderer: {
    // El HTML crudo dentro del markdown se muestra como texto, nunca se ejecuta.
    html(html) {
      return escapeHtml(typeof html === 'string' ? html : html?.text ?? '');
    },
    link(href, title, text) {
      if (!href || !SAFE_URL.test(href.trim())) return text;
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<a href="${escapeHtml(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;
    },
    image(href, title, text) {
      if (!href || !SAFE_URL.test(href.trim())) return escapeHtml(text || '');
      const t = title ? ` title="${escapeHtml(title)}"` : '';
      return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text || '')}"${t} />`;
    },
  },
});

/** Renderiza markdown a HTML seguro para usar en dangerouslySetInnerHTML. */
export function renderSafeMarkdown(source) {
  return marked.parse(String(source ?? ''));
}
