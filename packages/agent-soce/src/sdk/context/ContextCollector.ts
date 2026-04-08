import type { UIContext, HostAdapter } from '../types/index.js';

const PII_PATTERNS = [
  /\b\d{10,13}\b/g,        // cedula/RUC
  /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // phone
];

export function collectContext(adapter?: HostAdapter): UIContext {
  if (adapter) return adapter.getContext();

  return {
    route: typeof window !== 'undefined' ? window.location.pathname : '/',
    screenId: document?.title ?? undefined,
    visibleFields: collectVisibleFields(),
    errors: collectErrors(),
  };
}

function collectVisibleFields(): string[] {
  if (typeof document === 'undefined') return [];
  const fields: string[] = [];
  const inputs = document.querySelectorAll('input, select, textarea');
  inputs.forEach((el) => {
    const id = el.getAttribute('id') || el.getAttribute('name');
    if (id) fields.push(id);
  });
  return fields.slice(0, 50);
}

function collectErrors(): string[] {
  if (typeof document === 'undefined') return [];
  const errors: string[] = [];
  const errorEls = document.querySelectorAll('[role="alert"], .error, .field-error');
  errorEls.forEach((el) => {
    const text = el.textContent?.trim();
    if (text) errors.push(text);
  });
  return errors.slice(0, 10);
}

export function sanitizePII(text: string): string {
  let sanitized = text;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '***');
  }
  return sanitized;
}
