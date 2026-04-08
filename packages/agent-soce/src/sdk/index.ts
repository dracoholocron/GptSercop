export { AgentSOCE } from './core/AgentSOCE.js';
export { FloatingChatShell } from './components/FloatingChatShell.js';
export { MessageList } from './components/MessageList.js';
export { ChatInput } from './components/ChatInput.js';
export { GuidedFlowBar } from './components/GuidedFlowBar.js';
export { useAgentSOCE } from './hooks/useAgentSOCE.js';
export { useGuidedFlow } from './hooks/useGuidedFlow.js';
export { usePageContext } from './hooks/usePageContext.js';
export { createSSEClient } from './transport/sse-client.js';
export { resolveTheme, applyThemeToDOM } from './theming/ThemeEngine.js';
export { collectContext, sanitizePII } from './context/ContextCollector.js';
export { executeAction } from './actions/ActionBridge.js';
export type {
  AgentSOCEConfig,
  AgentSOCETheme,
  ChatMessage,
  UIContext,
  GuidanceAction,
  SSEEvent,
  HostAdapter,
  ToolCallResult,
} from './types/index.js';
