import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { AgentSOCEConfig, AgentSOCETheme, HostAdapter } from '../types/index.js';
import { useAgentSOCE } from '../hooks/useAgentSOCE.js';
import { useGuidedFlow } from '../hooks/useGuidedFlow.js';
import { resolveTheme, applyThemeToDOM } from '../theming/ThemeEngine.js';
import { MessageList } from './MessageList.js';
import { ChatInput } from './ChatInput.js';
import { GuidedFlowBar } from './GuidedFlowBar.js';

export interface FloatingChatShellProps {
  config: AgentSOCEConfig;
  theme?: AgentSOCETheme;
  adapter?: HostAdapter;
  backendTheme?: AgentSOCETheme;
  defaultOpen?: boolean;
}

export const FloatingChatShell: React.FC<FloatingChatShellProps> = ({
  config,
  theme: localTheme,
  adapter,
  backendTheme,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [size, setSize] = useState({ width: 380, height: 560 });
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const resolved = resolveTheme(localTheme, backendTheme);

  const { flowState, handleGuidance, cancelFlow } = useGuidedFlow(adapter);
  const { messages, isLoading, error, sendMessage, clearMessages, sendFeedback } = useAgentSOCE({
    config,
    adapter,
    onGuidance: handleGuidance,
  });

  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: window.innerWidth - size.width - 24,
        y: window.innerHeight - size.height - 24,
      });
    }
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      applyThemeToDOM(resolved, containerRef.current);
    }
  }, [resolved]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, textarea, input')) return;
    dragging.current = true;
    dragOffset.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    e.preventDefault();
  }, [position]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.current.y)),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [size.width]);

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;

  if (!isOpen) {
    return createPortal(
      <button
        onClick={() => setIsOpen(true)}
        style={{
          ...styles.fab,
          background: `var(--agent-soce-primary, ${resolved.primaryColor})`,
          fontFamily: resolved.fontFamily,
        }}
        title={resolved.buttonLabel}
      >
        {resolved.iconUrl ? (
          <img src={resolved.iconUrl} alt="" style={{ width: 24, height: 24 }} />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        <span style={{ fontSize: '13px', fontWeight: 600 }}>{resolved.buttonLabel}</span>
      </button>,
      document.body,
    );
  }

  if (isMinimized) {
    return createPortal(
      <button
        onClick={() => setIsMinimized(false)}
        style={{
          ...styles.pill,
          background: `var(--agent-soce-primary, ${resolved.primaryColor})`,
          left: position.x,
          top: position.y,
        }}
      >
        💬 {resolved.buttonLabel}
        {messages.length > 0 && (
          <span style={styles.badge}>{messages.length}</span>
        )}
      </button>,
      document.body,
    );
  }

  const shellStyle: React.CSSProperties = isMobile
    ? { ...styles.shell, position: 'fixed', inset: 0, width: '100%', height: '100%', borderRadius: 0 }
    : {
        ...styles.shell,
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        borderRadius: resolved.borderRadius,
      };

  return createPortal(
    <div ref={containerRef} style={shellStyle}>
      {/* Header */}
      <div
        style={styles.header}
        onMouseDown={onDragStart}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {resolved.logoUrl && <img src={resolved.logoUrl} alt="" style={{ width: 24, height: 24 }} />}
          <span style={{ fontWeight: 600, fontSize: '14px' }}>{resolved.buttonLabel}</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button style={styles.headerBtn} onClick={clearMessages} title="Nueva conversación">🔄</button>
          <button style={styles.headerBtn} onClick={() => setIsMinimized(true)} title="Minimizar">➖</button>
          <button style={styles.headerBtn} onClick={() => setIsOpen(false)} title="Cerrar">✕</button>
        </div>
      </div>

      {/* Guided flow bar */}
      <GuidedFlowBar
        active={flowState.active}
        currentStep={flowState.currentStep}
        totalSteps={flowState.totalSteps}
        onCancel={cancelFlow}
      />

      {/* Messages */}
      <MessageList messages={messages} onFeedback={(id, rating) => sendFeedback(id, rating)} />

      {/* Error */}
      {error && (
        <div style={styles.error}>⚠️ {error}</div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>,
    document.body,
  );
};

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: 'fixed', bottom: 24, right: 24, zIndex: 99999,
    display: 'flex', alignItems: 'center', gap: '8px',
    border: 'none', color: '#fff', padding: '12px 20px',
    borderRadius: '50px', cursor: 'pointer',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  pill: {
    position: 'fixed', zIndex: 99999,
    border: 'none', color: '#fff', padding: '8px 16px',
    borderRadius: '20px', cursor: 'pointer', fontSize: '13px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', fontWeight: 500,
  },
  badge: {
    background: '#E53E3E', borderRadius: '10px', padding: '1px 6px',
    fontSize: '11px', fontWeight: 700, marginLeft: '4px',
  },
  shell: {
    position: 'fixed', zIndex: 99998,
    display: 'flex', flexDirection: 'column',
    background: 'var(--agent-soce-bg, #fff)',
    color: 'var(--agent-soce-text, #1A202C)',
    fontFamily: 'var(--agent-soce-font, Inter, system-ui, sans-serif)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.16)',
    border: '1px solid rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 16px',
    background: 'var(--agent-soce-primary, #0073E6)',
    color: '#fff', cursor: 'move', userSelect: 'none',
  },
  headerBtn: {
    background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff',
    borderRadius: '4px', width: '28px', height: '28px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '14px',
  },
  error: {
    padding: '8px 16px', background: '#FEF2F2', color: '#B91C1C',
    fontSize: '13px',
  },
};
