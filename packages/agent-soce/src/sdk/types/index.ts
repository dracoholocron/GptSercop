export interface AgentSOCEConfig {
  apiBaseUrl: string;
  token?: string;
  sessionId?: string;
}

export interface AgentSOCETheme {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  bgColor?: string;
  bgColorDark?: string;
  textColor?: string;
  textColorDark?: string;
  chatBubbleUser?: string;
  chatBubbleAgent?: string;
  fontFamily?: string;
  borderRadius?: string;
  logoUrl?: string;
  iconUrl?: string;
  buttonLabel?: string;
  customCss?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallResult[];
  isStreaming?: boolean;
}

export interface ToolCallResult {
  name: string;
  params: Record<string, unknown>;
  result?: unknown;
}

export interface UIContext {
  route: string;
  screenId?: string;
  focusedField?: string;
  visibleFields?: string[];
  visibleActions?: string[];
  errors?: string[];
}

export interface GuidanceAction {
  action: 'highlight' | 'navigate' | 'fill' | 'focus' | 'tooltip';
  stepId?: string;
  label?: string;
  route?: string;
  fieldId?: string;
  instructions?: string;
  totalSteps?: number;
  value?: string;
}

export interface SSEEvent {
  type: 'text' | 'tool_call' | 'tool_result' | 'guidance' | 'error' | 'done' | 'connected';
  data: unknown;
}

export interface HostAdapter {
  getContext(): UIContext;
  navigate(route: string): void;
  highlightField(fieldId: string): void;
  removeHighlight(fieldId: string): void;
  focusField(fieldId: string): void;
  fillField(fieldId: string, value: string): void;
  showTooltip(fieldId: string, text: string): void;
  hideTooltip(fieldId: string): void;
}
