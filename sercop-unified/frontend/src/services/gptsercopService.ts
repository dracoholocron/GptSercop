import { get, post } from '../utils/apiClient';

export interface RagSearchItem {
  id: string;
  title: string;
  source: string;
  snippet: string | null;
}

export interface ProcurementAnalysis {
  contractVersion: string;
  mode: string;
  isFallback: boolean;
  fallbackReason?: string;
  summary: string;
  confidence: number;
  riskFlags: string[];
  recommendations: string[];
  citations: RagSearchItem[];
}

const ENABLE_CP_API = import.meta.env.VITE_ENABLE_CP_API !== 'false';

const EMPTY_ANALYSIS: ProcurementAnalysis = {
  contractVersion: 'gptsercop.analysis.v1',
  mode: 'deterministic',
  isFallback: true,
  fallbackReason: 'MODULE_DISABLED',
  summary: 'El modulo GPTsercop no esta disponible en este entorno.',
  confidence: 0,
  riskFlags: [],
  recommendations: ['Habilita la integracion GPT para obtener resultados de analisis.'],
  citations: [],
};

async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function searchNormativeContext(query: string): Promise<RagSearchItem[]> {
  if (!ENABLE_CP_API || !query.trim()) return [];
  const searchParams = new URLSearchParams({ q: query.trim() });
  const response = await get(`/v1/rag/search?${searchParams.toString()}`);
  if (!response.ok) return [];
  const payload = await safeJson(response);
  const results = payload?.results ?? payload?.data ?? [];
  return Array.isArray(results) ? results : [];
}

export async function askNormativeAssistant(question: string): Promise<{ answer: string; sources: RagSearchItem[] }> {
  if (!ENABLE_CP_API || !question.trim()) {
    return {
      answer: 'El asistente RAG no esta disponible en este entorno.',
      sources: [],
    };
  }
  const response = await post('/v1/rag/ask', { question });
  if (!response.ok) {
    return {
      answer: 'No fue posible obtener una respuesta del asistente en este momento.',
      sources: [],
    };
  }
  const payload = await safeJson(response);
  return {
    answer: String(payload?.answer ?? payload?.data?.answer ?? 'Sin respuesta disponible.'),
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
  };
}

export async function analyzeProcurementWithGpt(params: {
  tenderId?: string;
  question?: string;
}): Promise<ProcurementAnalysis> {
  if (!ENABLE_CP_API) return EMPTY_ANALYSIS;
  const response = await post('/v1/gptsercop/analyze-procurement', params);
  if (!response.ok) {
    return {
      ...EMPTY_ANALYSIS,
      fallbackReason: `HTTP_${response.status}`,
    };
  }
  const payload = (await safeJson(response)) as Partial<ProcurementAnalysis> | null;
  return {
    ...EMPTY_ANALYSIS,
    ...(payload || {}),
    riskFlags: Array.isArray(payload?.riskFlags) ? payload.riskFlags : [],
    recommendations: Array.isArray(payload?.recommendations) ? payload.recommendations : [],
    citations: Array.isArray(payload?.citations) ? payload.citations : [],
  };
}
