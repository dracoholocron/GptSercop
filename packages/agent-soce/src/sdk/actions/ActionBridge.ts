import type { HostAdapter, GuidanceAction } from '../types/index.js';

export function executeAction(action: GuidanceAction, adapter?: HostAdapter): void {
  switch (action.action) {
    case 'navigate':
      if (action.route) {
        if (adapter) {
          adapter.navigate(action.route);
        } else {
          window.location.href = action.route;
        }
      }
      break;

    case 'highlight':
      if (action.fieldId) {
        if (adapter) {
          adapter.highlightField(action.fieldId);
        } else {
          highlightFieldDOM(action.fieldId);
        }
      }
      break;

    case 'focus':
      if (action.fieldId) {
        if (adapter) {
          adapter.focusField(action.fieldId);
        } else {
          const el = document.getElementById(action.fieldId);
          if (el instanceof HTMLElement) el.focus();
        }
      }
      break;

    case 'fill':
      if (action.fieldId && action.value !== undefined) {
        if (adapter) {
          adapter.fillField(action.fieldId, action.value);
        } else {
          fillFieldDOM(action.fieldId, action.value);
        }
      }
      break;

    case 'tooltip':
      if (action.fieldId && action.instructions) {
        if (adapter) {
          adapter.showTooltip(action.fieldId, action.instructions);
        } else {
          showTooltipDOM(action.fieldId, action.instructions);
        }
      }
      break;
  }
}

function highlightFieldDOM(fieldId: string): void {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.outline = '3px solid var(--agent-soce-primary, #0073E6)';
  el.style.outlineOffset = '2px';
  el.style.transition = 'outline 0.3s ease';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function removeHighlightDOM(fieldId: string): void {
  const el = document.getElementById(fieldId);
  if (!el) return;
  el.style.outline = '';
  el.style.outlineOffset = '';
}

function fillFieldDOM(fieldId: string, value: string): void {
  const el = document.getElementById(fieldId) as HTMLInputElement | null;
  if (!el) return;
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
  )?.set;
  nativeInputValueSetter?.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function showTooltipDOM(fieldId: string, text: string): void {
  const el = document.getElementById(fieldId);
  if (!el) return;

  let tooltip = document.getElementById(`agent-soce-tooltip-${fieldId}`);
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = `agent-soce-tooltip-${fieldId}`;
    tooltip.style.cssText = `
      position: absolute; background: var(--agent-soce-primary, #0073E6); color: white;
      padding: 8px 12px; border-radius: 6px; font-size: 13px; max-width: 280px;
      z-index: 100000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(tooltip);
  }

  tooltip.textContent = text;
  const rect = el.getBoundingClientRect();
  tooltip.style.top = `${rect.bottom + window.scrollY + 8}px`;
  tooltip.style.left = `${rect.left + window.scrollX}px`;
}

export function hideTooltipDOM(fieldId: string): void {
  document.getElementById(`agent-soce-tooltip-${fieldId}`)?.remove();
}
