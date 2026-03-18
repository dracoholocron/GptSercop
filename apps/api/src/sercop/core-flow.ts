import type { PrismaClient } from '@prisma/client';

export type ProcessSearchItem = {
  id: string;
  title: string;
  status: string;
  publishedAt: Date | null;
};

export type ProcessDetail = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  procurementMethod: string | null;
  processType: string | null;
  regime: string | null;
  estimatedAmount: number | null;
  publishedAt: Date | null;
};

export type GptAnalysisRequest = {
  process: ProcessDetail;
  userPrompt?: string;
};

export type GptAnalysisResult =
  | {
      status: 'ready';
      provider: string;
      summary: string;
      raw?: unknown;
    }
  | {
      status: 'unavailable';
      provider: string;
      reason: string;
    };

export interface ProcessRepository {
  searchProcesses(query: string, limit: number): Promise<ProcessSearchItem[]>;
  getProcessDetail(processId: string): Promise<ProcessDetail | null>;
}

export interface GptAnalysisPipeline {
  analyze(request: GptAnalysisRequest): Promise<GptAnalysisResult>;
}

export type UnifiedCoreFlowInput = {
  query?: string;
  processId?: string;
  limit?: number;
  userPrompt?: string;
};

export type UnifiedCoreFlowOutput = {
  searchResults: ProcessSearchItem[];
  selectedProcess: ProcessDetail | null;
  analysis: GptAnalysisResult | null;
};

export class UnifiedSercopCoreFlowService {
  constructor(
    private readonly repository: ProcessRepository,
    private readonly analysisPipeline: GptAnalysisPipeline,
  ) {}

  async run(input: UnifiedCoreFlowInput): Promise<UnifiedCoreFlowOutput> {
    const normalizedLimit = Math.min(20, Math.max(1, input.limit ?? 10));
    const normalizedQuery = typeof input.query === 'string' ? input.query.trim() : '';

    const searchResults = normalizedQuery
      ? await this.repository.searchProcesses(normalizedQuery, normalizedLimit)
      : [];

    const selectedProcess = await this.resolveSelectedProcess(input.processId, searchResults);

    if (!selectedProcess) {
      return { searchResults, selectedProcess: null, analysis: null };
    }

    const analysis = await this.analysisPipeline.analyze({
      process: selectedProcess,
      userPrompt: input.userPrompt,
    });

    return { searchResults, selectedProcess, analysis };
  }

  private async resolveSelectedProcess(processId: string | undefined, searchResults: ProcessSearchItem[]) {
    if (typeof processId === 'string' && processId.trim()) {
      return this.repository.getProcessDetail(processId.trim());
    }

    if (searchResults.length === 0) return null;
    return this.repository.getProcessDetail(searchResults[0].id);
  }
}

export class PrismaProcessRepository implements ProcessRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async searchProcesses(query: string, limit: number): Promise<ProcessSearchItem[]> {
    const rows = await this.prisma.tender.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
      },
    });

    return rows;
  }

  async getProcessDetail(processId: string): Promise<ProcessDetail | null> {
    const row = await this.prisma.tender.findUnique({
      where: { id: processId },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        procurementMethod: true,
        processType: true,
        regime: true,
        estimatedAmount: true,
        publishedAt: true,
      },
    });

    return row
      ? {
          ...row,
          estimatedAmount: row.estimatedAmount == null ? null : Number(row.estimatedAmount),
        }
      : null;
  }
}

export class GptAnalysisAdapter implements GptAnalysisPipeline {
  async analyze(_request: GptAnalysisRequest): Promise<GptAnalysisResult> {
    const provider = 'openai';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        status: 'unavailable',
        provider,
        reason: 'OPENAI_API_KEY no configurada; pipeline GPT no ejecutado.',
      };
    }

    return {
      status: 'unavailable',
      provider,
      reason: 'Adapter GPT definido, pero la invocación al proveedor aún no está implementada.',
    };
  }
}
