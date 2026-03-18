import test from 'node:test';
import assert from 'node:assert/strict';
import {
  UnifiedSercopCoreFlowService,
  type ProcessRepository,
  type GptAnalysisPipeline,
  type ProcessDetail,
  type ProcessSearchItem,
} from '../../src/sercop/core-flow.js';

class RepoStub implements ProcessRepository {
  constructor(
    private readonly searchRows: ProcessSearchItem[],
    private readonly detailsById: Record<string, ProcessDetail>,
  ) {}

  async searchProcesses(): Promise<ProcessSearchItem[]> {
    return this.searchRows;
  }

  async getProcessDetail(processId: string): Promise<ProcessDetail | null> {
    return this.detailsById[processId] ?? null;
  }
}

class PipelineStub implements GptAnalysisPipeline {
  public calls = 0;

  async analyze() {
    this.calls += 1;
    return {
      status: 'unavailable' as const,
      provider: 'stub',
      reason: 'stubbed in test',
    };
  }
}

const detail: ProcessDetail = {
  id: 'p-1',
  title: 'Proceso 1',
  description: 'Detalle',
  status: 'published',
  procurementMethod: null,
  processType: null,
  regime: null,
  estimatedAmount: 10,
  publishedAt: null,
};

test('run() uses search first result as selected process when processId is absent', async () => {
  const repo = new RepoStub(
    [{ id: 'p-1', title: 'Proceso 1', status: 'published', publishedAt: null }],
    { 'p-1': detail },
  );
  const pipeline = new PipelineStub();
  const service = new UnifiedSercopCoreFlowService(repo, pipeline);

  const result = await service.run({ query: 'proceso' });

  assert.equal(result.searchResults.length, 1);
  assert.equal(result.selectedProcess?.id, 'p-1');
  assert.equal(result.analysis?.status, 'unavailable');
  assert.equal(pipeline.calls, 1);
});

test('run() prioritizes explicit processId over search results', async () => {
  const repo = new RepoStub(
    [{ id: 'p-1', title: 'Proceso 1', status: 'published', publishedAt: null }],
    {
      'p-1': detail,
      'p-2': { ...detail, id: 'p-2', title: 'Proceso 2' },
    },
  );
  const pipeline = new PipelineStub();
  const service = new UnifiedSercopCoreFlowService(repo, pipeline);

  const result = await service.run({ query: 'proceso', processId: 'p-2' });

  assert.equal(result.selectedProcess?.id, 'p-2');
  assert.equal(pipeline.calls, 1);
});

test('run() skips analysis when selected process cannot be resolved', async () => {
  const repo = new RepoStub([], {});
  const pipeline = new PipelineStub();
  const service = new UnifiedSercopCoreFlowService(repo, pipeline);

  const result = await service.run({ query: 'sin resultados' });

  assert.equal(result.selectedProcess, null);
  assert.equal(result.analysis, null);
  assert.equal(pipeline.calls, 0);
});
