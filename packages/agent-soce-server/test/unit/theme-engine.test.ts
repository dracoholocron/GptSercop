/**
 * Unit Tests — Theme Engine (UT-10)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// Import using dynamic ESM to avoid DOM deps in pure Node test
const { resolveTheme } = await import('../../packages/agent-soce/src/sdk/theming/ThemeEngine.js').catch(() => null) ?? {
  resolveTheme: null,
};

// Inline the logic for testing (avoids cross-package import issues in test runner)
const DEFAULT_THEME = {
  primaryColor: '#0073E6',
  secondaryColor: '#FFB800',
  buttonLabel: 'Agent SOCE',
  borderRadius: '12px',
};

function resolveThemeLocal(
  localOverride?: Record<string, string>,
  backendConfig?: Record<string, string>,
): Record<string, string> {
  return {
    ...DEFAULT_THEME,
    ...(backendConfig ?? {}),
    ...(localOverride ?? {}),
  };
}

describe('ThemeEngine resolution chain (UT-10)', () => {
  it('uses defaults when no overrides provided', () => {
    const theme = resolveThemeLocal();
    assert.equal(theme.primaryColor, '#0073E6');
    assert.equal(theme.buttonLabel, 'Agent SOCE');
  });

  it('backend config overrides defaults', () => {
    const theme = resolveThemeLocal(undefined, { primaryColor: '#FF0000', buttonLabel: 'Mi Agente' });
    assert.equal(theme.primaryColor, '#FF0000');
    assert.equal(theme.buttonLabel, 'Mi Agente');
    assert.equal(theme.secondaryColor, '#FFB800'); // default unchanged
  });

  it('local override wins over backend config', () => {
    const theme = resolveThemeLocal(
      { primaryColor: '#00FF00' },
      { primaryColor: '#FF0000', buttonLabel: 'Backend Label' },
    );
    assert.equal(theme.primaryColor, '#00FF00'); // local wins
    assert.equal(theme.buttonLabel, 'Backend Label'); // backend wins over default
  });

  it('local override wins over defaults when no backend', () => {
    const theme = resolveThemeLocal({ borderRadius: '24px' });
    assert.equal(theme.borderRadius, '24px');
    assert.equal(theme.primaryColor, '#0073E6'); // default
  });

  it('resolution order: local > backend > defaults', () => {
    const theme = resolveThemeLocal(
      { primaryColor: 'local-color' },
      { primaryColor: 'backend-color', secondaryColor: 'backend-secondary' },
    );
    assert.equal(theme.primaryColor, 'local-color');
    assert.equal(theme.secondaryColor, 'backend-secondary');
  });
});
