import React, { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSend,
  disabled = false,
  placeholder = 'Escribe tu pregunta...',
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (inputRef.current) inputRef.current.style.height = '40px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = '40px';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div style={styles.container}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        style={styles.input}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !text.trim()}
        style={{
          ...styles.sendBtn,
          opacity: disabled || !text.trim() ? 0.4 : 1,
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13" /><path d="M22 2L15 22L11 13L2 9L22 2Z" />
        </svg>
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'flex-end', gap: '8px',
    padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.08)',
    background: 'var(--agent-soce-bg, #fff)',
  },
  input: {
    flex: 1, resize: 'none', border: '1px solid rgba(0,0,0,0.12)',
    borderRadius: '8px', padding: '10px 12px', fontSize: '14px',
    fontFamily: 'var(--agent-soce-font, inherit)', outline: 'none',
    height: '40px', maxHeight: '120px', lineHeight: '1.4',
    background: 'transparent', color: 'var(--agent-soce-text, #1A202C)',
  },
  sendBtn: {
    background: 'var(--agent-soce-primary, #0073E6)', color: '#fff',
    border: 'none', borderRadius: '8px', width: '40px', height: '40px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
  },
};
