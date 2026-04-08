import type { AgentSOCETheme } from '../types/index.js';

const DEFAULT_THEME: Required<AgentSOCETheme> = {
  primaryColor: '#0073E6',
  secondaryColor: '#FFB800',
  accentColor: '#10B981',
  bgColor: '#FFFFFF',
  bgColorDark: '#0D111C',
  textColor: '#1A202C',
  textColorDark: '#E2E8F0',
  chatBubbleUser: '#0073E6',
  chatBubbleAgent: '#F7FAFC',
  fontFamily: 'Inter, system-ui, sans-serif',
  borderRadius: '12px',
  logoUrl: '',
  iconUrl: '',
  buttonLabel: 'Agent SOCE',
  customCss: '',
};

export function resolveTheme(
  localOverride?: AgentSOCETheme,
  backendConfig?: AgentSOCETheme,
): Required<AgentSOCETheme> {
  return {
    ...DEFAULT_THEME,
    ...stripUndefined(backendConfig ?? {}),
    ...stripUndefined(localOverride ?? {}),
  };
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined && v !== null) result[k] = v;
  }
  return result;
}

export function applyThemeToDOM(theme: Required<AgentSOCETheme>, container: HTMLElement): void {
  const vars: Record<string, string> = {
    '--agent-soce-primary': theme.primaryColor,
    '--agent-soce-secondary': theme.secondaryColor,
    '--agent-soce-accent': theme.accentColor,
    '--agent-soce-bg': theme.bgColor,
    '--agent-soce-bg-dark': theme.bgColorDark,
    '--agent-soce-text': theme.textColor,
    '--agent-soce-text-dark': theme.textColorDark,
    '--agent-soce-bubble-user': theme.chatBubbleUser,
    '--agent-soce-bubble-agent': theme.chatBubbleAgent,
    '--agent-soce-font': theme.fontFamily,
    '--agent-soce-radius': theme.borderRadius,
  };

  for (const [prop, val] of Object.entries(vars)) {
    container.style.setProperty(prop, val);
  }

  if (theme.customCss) {
    let styleEl = container.querySelector('#agent-soce-custom-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'agent-soce-custom-css';
      container.appendChild(styleEl);
    }
    styleEl.textContent = theme.customCss;
  }
}
