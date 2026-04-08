import { classifyIntent } from './intent.js';
import type { FlowState, FlowDefinition } from './flow-engine.js';
import { initFlow, advanceFlow, getCurrentStep, isFlowComplete } from './flow-engine.js';
import type { ChatMessage, UIContext, SSEEvent, ToolDef } from '../types/index.js';
import type { LLMRouter } from '../llm/router.js';
import { searchRag } from '../rag/search.js';

type PrismaLike = {
  $queryRawUnsafe: <T>(query: string, ...values: unknown[]) => Promise<T>;
};

export interface OrchestratorDeps {
  llm: LLMRouter;
  prisma: PrismaLike;
  embed: (text: string) => Promise<number[]>;
  tools: ToolDef[];
  flows: Map<string, FlowDefinition>;
}

export interface OrchestratorInput {
  messages: ChatMessage[];
  context?: UIContext;
  sessionId: string;
  flowState?: FlowState | null;
}

export interface OrchestratorOutput {
  stream: AsyncGenerator<SSEEvent>;
  flowState?: FlowState | null;
}

export async function orchestrate(
  deps: OrchestratorDeps,
  input: OrchestratorInput,
): Promise<OrchestratorOutput> {
  const lastMsg = input.messages[input.messages.length - 1]?.content ?? '';
  const intent = classifyIntent(lastMsg, input.context, input.messages);

  if (intent.type === 'guided_flow' && !input.flowState) {
    const flowId = resolveFlowId(lastMsg, deps.flows);
    if (flowId) {
      const flow = deps.flows.get(flowId)!;
      const flowState = initFlow(flow);
      const step = getCurrentStep(flowState, flow)!;
      return {
        stream: guidanceStream(step, flow),
        flowState,
      };
    }
  }

  if (input.flowState) {
    const flow = deps.flows.get(input.flowState.flowId);
    if (flow && !isFlowComplete(input.flowState, flow)) {
      const nextState = advanceFlow(input.flowState, flow);
      const step = getCurrentStep(nextState, flow);
      if (step) {
        return {
          stream: guidanceStream(step, flow),
          flowState: nextState,
        };
      }
    }
  }

  let ragContext = '';
  if (intent.type === 'question' || intent.type === 'data_query') {
    try {
      const embedding = await deps.embed(lastMsg);
      const chunks = await searchRag(deps.prisma, lastMsg, embedding, 5);
      if (chunks.length > 0) {
        ragContext = '\n\nContexto relevante (documentos):\n' +
          chunks.map((c) => `[${c.source}] ${c.title}: ${c.snippet}`).join('\n');
      }
    } catch {
      // RAG failure is non-fatal
    }
  }

  const systemPrompt = buildSystemPrompt(input.context, ragContext, deps.tools);
  const enriched: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...input.messages,
  ];

  const llmStream = deps.llm.chat(enriched, { tools: deps.tools });

  async function* toSSE(): AsyncGenerator<SSEEvent> {
    try {
      for await (const chunk of llmStream) {
        yield { type: 'text', data: chunk };
      }
      yield { type: 'done', data: null };
    } catch (err) {
      yield { type: 'error', data: String(err) };
    }
  }

  return { stream: toSSE(), flowState: input.flowState };
}

function resolveFlowId(message: string, flows: Map<string, FlowDefinition>): string | null {
  const lower = message.toLowerCase();
  for (const [id, flow] of flows) {
    const name = flow.name.toLowerCase();
    if (lower.includes(name) || lower.includes(id)) return id;
  }
  if (lower.includes('proceso') || lower.includes('crear')) return flows.keys().next().value ?? null;
  return null;
}

function buildSystemPrompt(context?: UIContext, ragContext?: string, tools?: ToolDef[]): string {
  let prompt = `Eres Agent SOCE, asistente inteligente del Sistema Nacional de Contratación Pública del Ecuador (SERCOP). Ayudas a usuarios con procesos de contratación, normativa vigente, gestión de proveedores y entidades.

Responde en español, de forma clara y concisa. Cuando cites normativa, indica la fuente.`;

  if (context) {
    prompt += `\n\nContexto actual del usuario:\n- Ruta: ${context.route}`;
    if (context.screenId) prompt += `\n- Pantalla: ${context.screenId}`;
    if (context.visibleFields?.length) prompt += `\n- Campos visibles: ${context.visibleFields.join(', ')}`;
    if (context.errors?.length) prompt += `\n- Errores en pantalla: ${context.errors.join(', ')}`;
  }

  if (ragContext) prompt += ragContext;

  if (tools?.length) {
    prompt += `\n\nHerramientas disponibles:\n${tools.map((t) => `- ${t.name}: ${t.description}`).join('\n')}`;
  }

  return prompt;
}

async function* guidanceStream(
  step: { id: string; label: string; screenRoute?: string; fieldId?: string; instructions: string },
  flow: { name: string; steps: { id: string }[] },
): AsyncGenerator<SSEEvent> {
  yield {
    type: 'guidance',
    data: {
      action: 'highlight',
      stepId: step.id,
      label: step.label,
      route: step.screenRoute,
      fieldId: step.fieldId,
      instructions: step.instructions,
      totalSteps: flow.steps.length,
    },
  };
  yield { type: 'text', data: step.instructions };
  yield { type: 'done', data: null };
}
