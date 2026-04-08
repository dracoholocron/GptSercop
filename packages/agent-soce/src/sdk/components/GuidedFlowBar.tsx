import React from 'react';

interface GuidedFlowBarProps {
  active: boolean;
  currentStep: number;
  totalSteps: number;
  onCancel: () => void;
}

export const GuidedFlowBar: React.FC<GuidedFlowBarProps> = ({
  active,
  currentStep,
  totalSteps,
  onCancel,
}) => {
  if (!active) return null;

  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div style={styles.container}>
      <div style={styles.info}>
        <span style={{ fontSize: '14px' }}>📋 Flujo guiado</span>
        <span style={styles.steps}>
          Paso {currentStep} de {totalSteps}
        </span>
      </div>
      <div style={styles.progressBar}>
        <div style={{ ...styles.progressFill, width: `${progress}%` }} />
      </div>
      <button onClick={onCancel} style={styles.cancelBtn}>
        Cancelar
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '8px 12px', background: 'var(--agent-soce-accent, #10B981)',
    color: '#fff', fontSize: '12px',
  },
  info: { display: 'flex', gap: '8px', alignItems: 'center' },
  steps: { opacity: 0.85, fontWeight: 500 },
  progressBar: {
    flex: 1, height: '4px', background: 'rgba(255,255,255,0.3)',
    borderRadius: '2px', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', background: '#fff', borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  cancelBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
    borderRadius: '4px', padding: '4px 8px', cursor: 'pointer',
    fontSize: '12px',
  },
};
