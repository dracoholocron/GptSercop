const TOKENS = {
  brand50: '#FFF9E6',
  brand100: '#FFECB8',
  brand500: '#FFB800',
  brand700: '#996E00',
  primary100: '#B3D9FF',
  primary500: '#0073E6',
  primary700: '#00458A',
  ink100: '#f8fafc',
  ink200: '#e2e8f0',
  ink400: '#94a3b8',
  ink700: '#334155',
  ink900: '#0f172a',
  success: '#16a34a',
  warning: '#f59e0b',
  violet: '#7c3aed',
  danger: '#dc2626'
};

function cssVars() {
  return `:root {
      --brand-50: ${TOKENS.brand50};
      --brand-100: ${TOKENS.brand100};
      --brand-500: ${TOKENS.brand500};
      --brand-700: ${TOKENS.brand700};
      --primary-100: ${TOKENS.primary100};
      --primary-500: ${TOKENS.primary500};
      --primary-700: ${TOKENS.primary700};
      --ink-100: ${TOKENS.ink100};
      --ink-200: ${TOKENS.ink200};
      --ink-400: ${TOKENS.ink400};
      --ink-700: ${TOKENS.ink700};
      --ink-900: ${TOKENS.ink900};
      --success: ${TOKENS.success};
      --warning: ${TOKENS.warning};
      --violet: ${TOKENS.violet};
      --danger: ${TOKENS.danger};
    }`;
}

module.exports = { TOKENS, cssVars };
