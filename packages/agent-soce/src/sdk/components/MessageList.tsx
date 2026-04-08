import React, { useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/index.js';

interface MessageListProps {
  messages: ChatMessage[];
  onFeedback?: (messageId: string, rating: number) => void;
}

export const MessageList: React.FC<MessageListProps> = ({ messages, onFeedback }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={styles.container}>
      {messages.length === 0 && (
        <div style={styles.empty}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🤖</div>
          <p style={{ fontWeight: 600 }}>¡Hola! Soy Agent SOCE</p>
          <p style={{ opacity: 0.7, fontSize: '13px' }}>
            Tu asistente inteligente para contratación pública. Pregúntame sobre normativa,
            procesos o déjame guiarte paso a paso.
          </p>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} style={{ ...styles.msgRow, justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
          <div
            style={{
              ...styles.bubble,
              backgroundColor: msg.role === 'user'
                ? 'var(--agent-soce-bubble-user, #0073E6)'
                : 'var(--agent-soce-bubble-agent, #F7FAFC)',
              color: msg.role === 'user' ? '#fff' : 'var(--agent-soce-text, #1A202C)',
              borderBottomRightRadius: msg.role === 'user' ? '4px' : undefined,
              borderBottomLeftRadius: msg.role !== 'user' ? '4px' : undefined,
            }}
          >
            <p style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {msg.content}
              {msg.isStreaming && <span style={styles.cursor}>▊</span>}
            </p>
            <span style={{ ...styles.time, color: msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)' }}>
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          {msg.role === 'assistant' && !msg.isStreaming && onFeedback && (
            <div style={styles.feedback}>
              <button style={styles.feedbackBtn} onClick={() => onFeedback(msg.id, 5)} title="Útil">👍</button>
              <button style={styles.feedbackBtn} onClick={() => onFeedback(msg.id, 1)} title="No útil">👎</button>
            </div>
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  empty: { textAlign: 'center', padding: '40px 20px', color: 'var(--agent-soce-text, #1A202C)', opacity: 0.8 },
  msgRow: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' },
  bubble: { maxWidth: '85%', padding: '10px 14px', borderRadius: 'var(--agent-soce-radius, 12px)', fontSize: '14px', lineHeight: '1.5' },
  time: { fontSize: '11px', marginTop: '4px', display: 'block' },
  cursor: { animation: 'blink 1s step-end infinite', opacity: 0.7 },
  feedback: { display: 'flex', gap: '4px', marginLeft: '8px' },
  feedbackBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', padding: '2px 4px', opacity: 0.6, borderRadius: '4px' },
};
