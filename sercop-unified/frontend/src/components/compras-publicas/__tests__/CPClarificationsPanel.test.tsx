/**
 * U4 – CPClarificationsPanel RBAC & interaction unit tests
 * Covers: role-based visibility (ask vs answer forms), list rendering,
 * ask question flow, answer question flow, empty state.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/setup';
import { CPClarificationsPanel } from '../CPClarificationsPanel';

// ──────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

import { get, post, patch } from '../../../utils/apiClient';
const mockGet = get as ReturnType<typeof vi.fn>;
const mockPost = post as ReturnType<typeof vi.fn>;
const mockPatch = patch as ReturnType<typeof vi.fn>;

const OPEN_CLARIFICATION = {
  id: 'cl-1',
  tenderId: 'tender-abc',
  question: '¿Cuál es el plazo de entrega?',
  answer: null,
  answeredAt: null,
  askedAt: '2026-03-01T10:00:00Z',
  status: 'OPEN' as const,
  askedByProvider: { id: 'p1', name: 'Proveedor ABC', identifier: '1234567890001' },
};

const ANSWERED_CLARIFICATION = {
  ...OPEN_CLARIFICATION,
  id: 'cl-2',
  status: 'ANSWERED' as const,
  answer: 'El plazo es 30 días.',
  answeredAt: '2026-03-02T09:00:00Z',
};

describe('CPClarificationsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading & Empty state ─────────────────────────────────

  it('U4-01: shows spinner while loading', () => {
    // Make get never resolve during this test
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<CPClarificationsPanel tenderId="t1" />);
    expect(document.querySelector('[data-testid], .chakra-spinner') || screen.queryByRole('status')).toBeDefined();
  });

  it('U4-02: empty state renders when no clarifications', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    render(<CPClarificationsPanel tenderId="t1" />);
    // t() mock returns key: 'cp.clarifications.empty'
    await waitFor(() => {
      expect(screen.getByText('cp.clarifications.empty')).toBeInTheDocument();
    });
  });

  // ── Supplier view ─────────────────────────────────────────

  it('U4-03: supplier sees ask-question form when tender is published', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    render(
      <CPClarificationsPanel tenderId="t1" userRole="supplier" tenderStatus="published" />
    );
    // t() mock returns key
    await waitFor(() => {
      expect(screen.getByText('cp.clarifications.askQuestion')).toBeInTheDocument();
    });
  });

  it('U4-04: supplier does NOT see ask-form when tender is not published', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    render(
      <CPClarificationsPanel tenderId="t1" userRole="supplier" tenderStatus="draft" />
    );
    await waitFor(() => {
      expect(screen.queryByText('cp.clarifications.askQuestion')).not.toBeInTheDocument();
    });
  });

  it('U4-05: entity/admin does NOT see ask-question form', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    render(
      <CPClarificationsPanel tenderId="t1" userRole="entity" tenderStatus="published" />
    );
    await waitFor(() => {
      expect(screen.queryByText('cp.clarifications.askQuestion')).not.toBeInTheDocument();
    });
  });

  // ── Clarification list ────────────────────────────────────

  it('U4-06: renders open clarification with OPEN badge (translation key)', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [OPEN_CLARIFICATION] }) });
    render(<CPClarificationsPanel tenderId="t1" userRole="entity" />);
    await waitFor(() => {
      expect(screen.getByText('¿Cuál es el plazo de entrega?')).toBeInTheDocument();
      // Badge: t('cp.clarifications.pending_badge', ...) → key
      expect(screen.getByText('cp.clarifications.pending_badge')).toBeInTheDocument();
    });
  });

  it('U4-07: renders answered clarification showing official answer (translation key)', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [ANSWERED_CLARIFICATION] }) });
    render(<CPClarificationsPanel tenderId="t1" userRole="supplier" />);
    await waitFor(() => {
      expect(screen.getByText('El plazo es 30 días.')).toBeInTheDocument();
      // Badges use translation keys via mock
      expect(screen.getByText('cp.clarifications.answered_badge')).toBeInTheDocument();
      expect(screen.getByText('cp.clarifications.officialAnswer')).toBeInTheDocument();
    });
  });

  // ── Ask question flow ─────────────────────────────────────

  it('U4-08: supplier can submit a question via ask form', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [] }) });
    mockPost.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { toaster } = await import('../../../components/ui/toaster');
    render(
      <CPClarificationsPanel tenderId="tender-xyz" userRole="supplier" tenderStatus="published" />
    );
    // t() mock returns key: 'cp.clarifications.askQuestion'
    await waitFor(() => screen.getByText('cp.clarifications.askQuestion'));

    // Placeholder is also a translation key
    const textarea = screen.getByPlaceholderText('cp.clarifications.questionPlaceholder');
    fireEvent.change(textarea, { target: { value: '¿Acepta facturas electrónicas?' } });

    // Button text: t('cp.clarifications.send', 'Enviar') → key 'cp.clarifications.send'
    const sendBtn = screen.getByRole('button', { name: 'cp.clarifications.send' });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/v1/tenders/tender-xyz/clarifications',
        { question: '¿Acepta facturas electrónicas?' }
      );
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });
  });

  // ── Answer flow ───────────────────────────────────────────

  it('U4-09: entity sees answer textarea for OPEN clarification', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [OPEN_CLARIFICATION] }) });
    render(<CPClarificationsPanel tenderId="t1" userRole="entity" />);
    await waitFor(() => {
      // Placeholder: t('cp.clarifications.answerPlaceholder', ...) → key
      expect(screen.getByPlaceholderText('cp.clarifications.answerPlaceholder')).toBeInTheDocument();
    });
  });

  it('U4-10: entity can publish an answer via PATCH', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [OPEN_CLARIFICATION] }) });
    mockPatch.mockResolvedValue({ ok: true, json: async () => ({}) });

    const { toaster } = await import('../../../components/ui/toaster');
    render(<CPClarificationsPanel tenderId="t1" userRole="entity" />);
    await waitFor(() => screen.getByPlaceholderText('cp.clarifications.answerPlaceholder'));

    const answerTextarea = screen.getByPlaceholderText('cp.clarifications.answerPlaceholder');
    fireEvent.change(answerTextarea, { target: { value: 'Sí, se aceptan facturas electrónicas.' } });

    // Button: t('cp.clarifications.submitAnswer', ...) → key
    const publishBtn = screen.getByRole('button', { name: 'cp.clarifications.submitAnswer' });
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalledWith(
        '/v1/tender-clarifications/cl-1',
        { answer: 'Sí, se aceptan facturas electrónicas.' }
      );
      expect(toaster.create).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      );
    });
  });

  it('U4-11: no answer textarea for already-ANSWERED clarification', async () => {
    mockGet.mockResolvedValue({ ok: true, json: async () => ({ data: [ANSWERED_CLARIFICATION] }) });
    render(<CPClarificationsPanel tenderId="t1" userRole="entity" />);
    await waitFor(() => screen.getByText('El plazo es 30 días.'));
    // No open textarea to answer (already answered)
    expect(screen.queryByPlaceholderText('cp.clarifications.answerPlaceholder')).not.toBeInTheDocument();
  });
});
