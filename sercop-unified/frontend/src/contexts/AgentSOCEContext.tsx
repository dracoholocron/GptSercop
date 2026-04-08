import React, { createContext, useContext, useState, useCallback } from 'react';

interface AgentSOCEContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const AgentSOCEContext = createContext<AgentSOCEContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
});

export const AgentSOCEProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(v => !v), []);
  return <AgentSOCEContext.Provider value={{ isOpen, open, close, toggle }}>{children}</AgentSOCEContext.Provider>;
};

export function useAgentSOCEButton() {
  return useContext(AgentSOCEContext);
}
