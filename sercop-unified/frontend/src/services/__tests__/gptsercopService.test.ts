import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
}));

import { get, post } from '../../utils/apiClient';
import {
  searchNormativeContext,
  askNormativeAssistant,
  analyzeProcurementWithGpt,
} from '../gptsercopService';

const asMock = <T extends (...args: any[]) => any>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

describe('gptsercopService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty search results when backend is not ok', async () => {
    asMock(get).mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({}),
    });

    const results = await searchNormativeContext('normativa sie');
    expect(results).toEqual([]);
  });

  it('returns safe answer when rag ask fails', async () => {
    asMock(post).mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const response = await askNormativeAssistant('que norma aplica');
    expect(response.answer).toMatch(/No fue posible|no disponible/i);
    expect(response.sources).toEqual([]);
  });

  it('returns fallback analysis when analyze endpoint fails', async () => {
    asMock(post).mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    const response = await analyzeProcurementWithGpt({ question: 'genera borrador' });
    expect(response.isFallback).toBe(true);
    expect(response.fallbackReason).toBe('HTTP_503');
  });
});
