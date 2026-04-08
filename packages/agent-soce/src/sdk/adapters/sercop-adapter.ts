import type { HostAdapter, UIContext } from '../types/index.js';
import { highlightFieldDOM, removeHighlightDOM, hideTooltipDOM } from '../actions/ActionBridge.js';

// Maps SERCOP route patterns to human-readable screen IDs and relevant fields
const SCREEN_MAP: Record<string, { id: string; fields: string[] }> = {
  '/cp/processes/create': {
    id: 'crear_proceso',
    fields: ['object', 'processType', 'budget', 'budgetCode', 'startDate', 'description'],
  },
  '/cp/processes': {
    id: 'lista_procesos',
    fields: ['search', 'processType', 'status', 'dateFrom', 'dateTo'],
  },
  '/cp/processes/': {
    id: 'detalle_proceso',
    fields: ['status', 'timeline', 'offers', 'contract'],
  },
  '/cp/contracts': {
    id: 'contratos',
    fields: ['search', 'provider', 'amount', 'status'],
  },
  '/cp/providers': {
    id: 'proveedores',
    fields: ['search', 'ruc', 'status', 'category'],
  },
  '/cp/entities': {
    id: 'entidades',
    fields: ['search', 'type', 'province'],
  },
  '/cp/pac': {
    id: 'plan_anual_contratacion',
    fields: ['year', 'status', 'items'],
  },
  '/analytics': {
    id: 'analytics',
    fields: ['dateRange', 'entity', 'processType', 'chart'],
  },
  '/admin': {
    id: 'administracion',
    fields: ['section', 'search'],
  },
};

function resolveScreenId(path: string): string | undefined {
  for (const [prefix, info] of Object.entries(SCREEN_MAP)) {
    if (path.startsWith(prefix)) return info.id;
  }
  return undefined;
}

function resolveFields(path: string): string[] {
  for (const [prefix, info] of Object.entries(SCREEN_MAP)) {
    if (path.startsWith(prefix)) return info.fields;
  }
  return [];
}

// Returns the React Router navigate function if available
function getNavigateFn(): ((path: string) => void) | null {
  if (typeof window === 'undefined') return null;
  // Try to get from window-injected navigate (set by SERCOP App.tsx)
  const win = window as unknown as Record<string, unknown>;
  if (typeof win.__agentSOCENavigate === 'function') {
    return win.__agentSOCENavigate as (path: string) => void;
  }
  return null;
}

export const sercopAdapter: HostAdapter = {
  getContext(): UIContext {
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const errors: string[] = [];

    if (typeof document !== 'undefined') {
      document.querySelectorAll('[role="alert"], .chakra-form__error-message').forEach((el) => {
        const text = el.textContent?.trim();
        if (text) errors.push(text);
      });
    }

    return {
      route: path,
      screenId: resolveScreenId(path),
      visibleFields: resolveFields(path),
      errors: errors.slice(0, 5),
    };
  },

  navigate(route: string): void {
    const nav = getNavigateFn();
    if (nav) {
      nav(route);
    } else if (typeof window !== 'undefined') {
      window.location.href = route;
    }
  },

  highlightField(fieldId: string): void {
    // Try standard DOM first
    const el = document.getElementById(fieldId)
      ?? document.querySelector(`[name="${fieldId}"]`)
      ?? document.querySelector(`[data-field="${fieldId}"]`);

    if (el) {
      (el as HTMLElement).style.outline = '3px solid var(--agent-soce-primary, #0073E6)';
      (el as HTMLElement).style.outlineOffset = '2px';
      (el as HTMLElement).style.transition = 'outline 0.3s ease';
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Fallback to generic highlight
      highlightFieldDOM(fieldId);
    }
  },

  removeHighlight(fieldId: string): void {
    const el = document.getElementById(fieldId)
      ?? document.querySelector(`[name="${fieldId}"]`)
      ?? document.querySelector(`[data-field="${fieldId}"]`);

    if (el) {
      (el as HTMLElement).style.outline = '';
      (el as HTMLElement).style.outlineOffset = '';
    }
    removeHighlightDOM(fieldId);
  },

  focusField(fieldId: string): void {
    const el = document.getElementById(fieldId)
      ?? document.querySelector<HTMLElement>(`[name="${fieldId}"]`);
    if (el instanceof HTMLElement) {
      el.focus();
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },

  fillField(fieldId: string, value: string): void {
    const el = document.getElementById(fieldId) as HTMLInputElement | null
      ?? document.querySelector<HTMLInputElement>(`[name="${fieldId}"]`);
    if (!el) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  },

  showTooltip(fieldId: string, text: string): void {
    const el = document.getElementById(fieldId)
      ?? document.querySelector(`[name="${fieldId}"]`);
    if (!el) return;

    let tooltip = document.getElementById(`agent-soce-tooltip-${fieldId}`);
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = `agent-soce-tooltip-${fieldId}`;
      tooltip.style.cssText = `
        position: absolute; background: var(--agent-soce-primary, #0073E6); color: white;
        padding: 8px 12px; border-radius: 6px; font-size: 13px; max-width: 280px;
        z-index: 100000; box-shadow: 0 4px 12px rgba(0,0,0,0.15); pointer-events: none;
      `;
      document.body.appendChild(tooltip);
    }

    tooltip.textContent = text;
    const rect = el.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
    tooltip.style.left = `${rect.left + window.scrollX}px`;
  },

  hideTooltip(fieldId: string): void {
    hideTooltipDOM(fieldId);
    document.getElementById(`agent-soce-tooltip-${fieldId}`)?.remove();
  },
};
