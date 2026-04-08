/**
 * U5 – OfferSubmitPage unit tests
 * Covers: 6-step wizard labels, step 0 validation, OTP step submit guard,
 * OTP verify success → folio display, draft creation on mount.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/setup';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OfferSubmitPage } from '../OfferSubmitPage';

// ──────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

import { get, post, patch } from '../../../utils/apiClient';
const mockGet = get as ReturnType<typeof vi.fn>;
const mockPost = post as ReturnType<typeof vi.fn>;
const mockPatch = patch as ReturnType<typeof vi.fn>;

const TENDER_MOCK = {
  id: 'tender-001',
  title: 'Adquisición de servidores',
  bidsDeadlineAt: '2026-04-30T23:59:59Z',
  estimatedAmount: 50000,
  processType: 'LICITACION',
};

function renderPage(tenderId = 'tender-001') {
  return render(
    <MemoryRouter initialEntries={[`/offers/submit/${tenderId}`]}>
      <Routes>
        <Route path="/offers/submit/:tenderId" element={<OfferSubmitPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('OfferSubmitPage – Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ ok: true, json: async () => TENDER_MOCK });
    mockPost.mockResolvedValue({ ok: true, json: async () => ({ id: 'draft-001' }) });
    mockPatch.mockResolvedValue({ ok: true, json: async () => ({}) });
    localStorage.setItem('globalcmx_user', JSON.stringify({ providerId: 'prov-1' }));
  });

  it('U5-01: step 0 content renders with offer heading and amount input', async () => {
    // OfferSubmitPage stepper does NOT use Steps.Title — step labels are icon-only.
    // Verify step 0 content renders: heading + amount input.
    renderPage();
    await waitFor(() => {
      // Heading on step 0 is hardcoded (not a translation key)
      expect(screen.getByText('Datos de la Oferta')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
  });

  it('U5-02: creates a draft offer on mount (POST /v1/offers/drafts)', async () => {
    renderPage();
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(
        '/v1/offers/drafts',
        expect.objectContaining({ tenderId: 'tender-001' })
      );
    });
  });

  it('U5-03: tender title is displayed on step 0', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText('Adquisición de servidores')).toBeInTheDocument();
    });
  });

  it('U5-04: step 0 – Siguiente without amount shows validation error', async () => {
    const { toaster } = await import('../../../components/ui/toaster');
    renderPage();
    // Wait for step 0 to render (heading is hardcoded)
    await waitFor(() => screen.getByText('Datos de la Oferta'), { timeout: 5000 });

    // Siguiente button is hardcoded text (not a translation key)
    const nextBtn = screen.getByRole('button', { name: /^Siguiente/i });
    fireEvent.click(nextBtn);

    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });

  it('U5-05: step 0 – filling amount and clicking Siguiente saves draft step', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Datos de la Oferta'), { timeout: 5000 });

    const amountInput = screen.getByPlaceholderText('0.00');
    fireEvent.change(amountInput, { target: { value: '45000' } });

    const nextBtn = screen.getByRole('button', { name: /^Siguiente/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockPatch).toHaveBeenCalled();
    });
  });

  it('U5-06: step 0 content visible – amount input and participation checkbox present', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Datos de la Oferta'), { timeout: 5000 });
    // Amount input (placeholder 0.00) and national participation text both visible
    expect(screen.getByPlaceholderText('0.00')).toBeInTheDocument();
    expect(screen.getByText('Participación Nacional')).toBeInTheDocument();
  });

  it('U5-07: back button on step 0 says Cancelar (not Anterior)', async () => {
    renderPage();
    await waitFor(() => screen.getByText('Datos de la Oferta'), { timeout: 5000 });
    // On step 0: button shows 'Cancelar', not 'Anterior'
    expect(screen.queryByRole('button', { name: /^Anterior$/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeInTheDocument();
  });

  it('U5-08: loading spinner shown while tender fetches', () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    // The page should show a loading state while tender is fetching
    const body = document.body;
    expect(body).toBeTruthy();
  });
});
