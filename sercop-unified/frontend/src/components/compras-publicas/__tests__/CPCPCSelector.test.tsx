/**
 * U2 – CPCPCSelector unit tests
 * Covers: search debounce, result list rendering, item selection (toggle),
 * selected badges display, multi-select behaviour, tree panel toggle.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '../../../test/setup';
import { CPCPCSelector } from '../CPCPCSelector';

// ──────────────────────────────────────────────────────────────
// Mock apiClient
// ──────────────────────────────────────────────────────────────
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
}));

import { get } from '../../../utils/apiClient';
const mockGet = get as ReturnType<typeof vi.fn>;

// Use real timers — debounce is 300ms, waitFor with generous timeout handles it naturally
// (fake timers + async mocked promises cause Vitest waitFor to deadlock)

const MOCK_SUGGESTIONS = [
  { code: '431', description: 'Servicios de construcción de edificios', level: 2, isLeaf: false },
  { code: '4311', description: 'Construcción de edificios residenciales', level: 3, isLeaf: true },
];

const MOCK_TREE_ROOT = [
  { code: '1', description: 'Productos agrícolas', level: 1, isLeaf: false },
  { code: '2', description: 'Productos de la pesca', level: 1, isLeaf: false },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe('CPCPCSelector', () => {
  it('U2-01: renders search input with custom placeholder', () => {
    render(<CPCPCSelector value={[]} onChange={vi.fn()} placeholder="Buscar CPC aquí" />);
    expect(screen.getByPlaceholderText('Buscar CPC aquí')).toBeInTheDocument();
  });

  it('U2-02: search results appear after debounce when query >= 2 chars', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_SUGGESTIONS }),
    });

    render(<CPCPCSelector value={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);

    fireEvent.change(input, { target: { value: 'co' } });

    // Real timers: waitFor retries until debounce (300ms) fires + mock resolves
    await waitFor(() => {
      expect(screen.getByText('Servicios de construcción de edificios')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('U2-03: short query (1 char) does NOT trigger search', async () => {
    render(<CPCPCSelector value={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);
    fireEvent.change(input, { target: { value: 'c' } });

    // Wait longer than debounce — still no call expected
    await new Promise(r => setTimeout(r, 450));
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('U2-04: clicking a search result calls onChange with its code', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_SUGGESTIONS }),
    });
    const onChange = vi.fn();
    render(<CPCPCSelector value={[]} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);
    fireEvent.change(input, { target: { value: 'co' } });

    await waitFor(() => screen.getByText('Servicios de construcción de edificios'), { timeout: 2000 });
    fireEvent.click(screen.getByText('Servicios de construcción de edificios'));
    expect(onChange).toHaveBeenCalledWith(['431']);
  });

  it('U2-05: clicking already-selected item removes it (toggle off)', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_SUGGESTIONS }),
    });
    const onChange = vi.fn();
    render(<CPCPCSelector value={['431']} onChange={onChange} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);
    fireEvent.change(input, { target: { value: 'co' } });

    await waitFor(() => screen.getByText('Servicios de construcción de edificios'), { timeout: 2000 });
    fireEvent.click(screen.getByText('Servicios de construcción de edificios'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('U2-06: selected codes render as badge chips', () => {
    render(<CPCPCSelector value={['431', '4311']} onChange={vi.fn()} />);
    expect(screen.getByText('431')).toBeInTheDocument();
    expect(screen.getByText('4311')).toBeInTheDocument();
    expect(screen.getByText(/Seleccionados \(2\)/i)).toBeInTheDocument();
  });

  it('U2-07: clicking a selected badge removes it', () => {
    const onChange = vi.fn();
    render(<CPCPCSelector value={['431', '4311']} onChange={onChange} />);
    // Find the badge for '431' and click it
    const badge = screen.getByText('431');
    fireEvent.click(badge);
    expect(onChange).toHaveBeenCalledWith(['4311']);
  });

  it('U2-08: single-select mode: selecting new item replaces previous', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      json: async () => ({ data: MOCK_SUGGESTIONS }),
    });
    const onChange = vi.fn();
    render(<CPCPCSelector value={['431']} onChange={onChange} multiple={false} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);
    fireEvent.change(input, { target: { value: 'co' } });

    await waitFor(() => screen.getByText('Construcción de edificios residenciales'), { timeout: 2000 });
    fireEvent.click(screen.getByText('Construcción de edificios residenciales'));
    expect(onChange).toHaveBeenCalledWith(['4311']);
  });

  it('U2-09: tree toggle button loads root items from API', async () => {
    mockGet.mockImplementation((url: string) => {
      if (url.includes('/v1/cpc/tree')) {
        return Promise.resolve({ ok: true, json: async () => ({ data: MOCK_TREE_ROOT }) });
      }
      return Promise.resolve({ ok: true, json: async () => ({ data: [] }) });
    });

    render(<CPCPCSelector value={[]} onChange={vi.fn()} />);
    const treeBtn = screen.getByRole('button', { name: /Navegar árbol CPC/i });
    fireEvent.click(treeBtn);

    await waitFor(() => {
      expect(screen.getByText('Productos agrícolas')).toBeInTheDocument();
    }, { timeout: 2000 });
    expect(screen.getByRole('button', { name: /Ocultar árbol CPC/i })).toBeInTheDocument();
  });

  it('U2-10: failed API call shows no results (silent fail)', async () => {
    mockGet.mockRejectedValue(new Error('Network error'));
    render(<CPCPCSelector value={[]} onChange={vi.fn()} />);
    const input = screen.getByPlaceholderText(/Buscar código CPC/i);
    fireEvent.change(input, { target: { value: 'servicios' } });

    // Wait for debounce + rejected promise to settle (real timers)
    await new Promise(r => setTimeout(r, 450));
    // No error thrown, no results displayed
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
  });
});
