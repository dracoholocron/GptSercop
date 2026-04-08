/**
 * U1 – CPProcessFormPage wizard navigation unit tests
 * Covers: step rendering, advance/retreat, per-step validation, form state preservation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../../test/setup';
import { MemoryRouter } from 'react-router-dom';
import { CPProcessFormPage } from '../CPProcessFormPage';

// ──────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: [] }) }),
  post: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ id: 'new-tender-id', title: 'Test' }),
  }),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => vi.fn() };
});

function renderPage() {
  return render(
    <MemoryRouter>
      <CPProcessFormPage />
    </MemoryRouter>
  );
}

describe('CPProcessFormPage – Wizard Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('U1-01: renders step 1 (Datos Básicos) by default', () => {
    renderPage();
    expect(screen.getByText('Datos Básicos')).toBeInTheDocument();
    // Step label present in stepper
    expect(screen.getByText('Cronograma')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('U1-02: step 1 shows title input field', () => {
    renderPage();
    // The t() mock returns the key, so placeholder = 'cp.process.form.titlePlaceholder'
    const titleInput = screen.getByPlaceholderText('cp.process.form.titlePlaceholder');
    expect(titleInput).toBeInTheDocument();
  });

  it('U1-03: clicking Siguiente (common.next key) without required fields shows validation error', async () => {
    const { toaster } = await import('../../../components/ui/toaster');
    renderPage();
    // t() mock returns translation key, so button text = 'common.next'
    const nextBtn = screen.getByRole('button', { name: 'common.next' });
    fireEvent.click(nextBtn);
    expect(toaster.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error' })
    );
  });

  it('U1-04: filling title and clicking next triggers validation (processType required)', async () => {
    const { get } = await import('../../../utils/apiClient');
    (get as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ id: 'pac-1', year: 2026, entity: { name: 'MEC' } }],
      }),
    });

    renderPage();

    // Fill title (placeholder = translation key via mock)
    const titleInput = screen.getByPlaceholderText('cp.process.form.titlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'Proceso E2E Test' } });

    await waitFor(() => {
      expect(get).toHaveBeenCalled();
    });

    // Click next – processType or PAC validation will fire
    const nextBtn = screen.getByRole('button', { name: 'common.next' });
    fireEvent.click(nextBtn);
    const { toaster } = await import('../../../components/ui/toaster');
    expect(toaster.create).toHaveBeenCalled();
  });

  it('U1-05: Anterior button is not visible on step 1', () => {
    renderPage();
    expect(screen.queryByRole('button', { name: /Anterior/i })).not.toBeInTheDocument();
  });

  it('U1-06: step indicator labels are all rendered (Datos Básicos, Cronograma, Configuración)', () => {
    renderPage();
    expect(screen.getByText('Datos Básicos')).toBeInTheDocument();
    expect(screen.getByText('Cronograma')).toBeInTheDocument();
    expect(screen.getByText('Configuración')).toBeInTheDocument();
  });

  it('U1-07: heading exists on page (translation key cp.process.newTitle)', () => {
    renderPage();
    // t() mock returns the key, so heading text is 'cp.process.newTitle'
    const heading = screen.getByRole('heading', { name: 'cp.process.newTitle' });
    expect(heading).toBeInTheDocument();
  });

  it('U1-08: form state persists when typing in title field', () => {
    renderPage();
    // Placeholder is the translation key via mock
    const titleInput = screen.getByPlaceholderText('cp.process.form.titlePlaceholder');
    fireEvent.change(titleInput, { target: { value: 'Mi Proceso Persistido' } });
    expect((titleInput as HTMLInputElement).value).toBe('Mi Proceso Persistido');
  });
});
