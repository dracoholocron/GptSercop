/**
 * HTML Sanitization Utility
 * Uses DOMPurify for secure HTML sanitization to prevent XSS attacks.
 */
import DOMPurify from 'dompurify';

// Configuration for DOMPurify
const DOMPURIFY_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'b', 'i',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span', 'a', 'img',
    'blockquote', 'pre', 'code'
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'colspan', 'rowspan'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
};

/**
 * Sanitizes HTML content to prevent XSS attacks using DOMPurify.
 * Removes dangerous scripts, event handlers, and other potentially harmful content.
 *
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, DOMPURIFY_CONFIG);
}

