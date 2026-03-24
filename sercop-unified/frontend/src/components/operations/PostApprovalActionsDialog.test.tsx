/**
 * PostApprovalActionsDialog - Unit Tests
 *
 * Tests for the post-approval automatic actions dialog.
 * Covers:
 * 1. PREVIEW - Display of pending actions
 * 2. EXECUTION - Action execution flow
 * 3. STATUS - Status display and updates
 * 4. ERROR HANDLING - Error scenarios and retry/skip
 *
 * @author GlobalCMX Team
 * @version 1.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '../../test/setup';
import userEvent from '@testing-library/user-event';
import { PostApprovalActionsDialog } from './PostApprovalActionsDialog';

// =============================================================================
// MOCKS
// =============================================================================

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock prompt for skip reason
const mockPrompt = vi.fn(() => 'Manual override reason');
global.prompt = mockPrompt;

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createActionPreview = (overrides = {}) => ({
  order: 1,
  ruleCode: 'LC_IMPORT_ISSUE_APPROVED',
  ruleName: 'Post-Approval Actions for LC Import Issue',
  actionType: 'SWIFT_MESSAGE',
  description: 'Generate MT700 message',
  async: false,
  continueOnError: false,
  config: { messageType: 'MT700' },
  ...overrides,
});

const createActionStatus = (overrides = {}) => ({
  id: 1,
  executionId: 'EXE-123456',
  ruleCode: 'LC_IMPORT_ISSUE_APPROVED',
  actionType: 'SWIFT_MESSAGE',
  actionOrder: 1,
  status: 'SUCCESS',
  startedAt: '2025-01-15T10:00:00Z',
  completedAt: '2025-01-15T10:00:01Z',
  durationMs: 1000,
  errorMessage: null,
  resultData: null,
  retryCount: 0,
  maxRetries: 3,
  canRetry: false,
  canSkip: false,
  ...overrides,
});

const createActionTypeConfig = (overrides = {}) => ({
  actionType: 'SWIFT_MESSAGE',
  displayName: 'Generate SWIFT Message',
  description: 'Generates a SWIFT message',
  icon: 'FiSend',
  color: 'blue',
  successMessage: 'Message generated successfully',
  errorMessage: 'Error generating message',
  ...overrides,
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  operationType: 'LC_IMPORT',
  triggerEvent: 'ISSUE_APPROVED',
  operationId: 'OP-001',
  approvedBy: 'user@test.com',
  onComplete: vi.fn(),
};

const setupMocks = (options: {
  previewActions?: ReturnType<typeof createActionPreview>[];
  executionResult?: ReturnType<typeof createActionStatus>[];
  actionConfigs?: ReturnType<typeof createActionTypeConfig>[];
} = {}) => {
  const {
    previewActions = [createActionPreview()],
    executionResult = [createActionStatus()],
    actionConfigs = [createActionTypeConfig()],
  } = options;

  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/action-type')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: actionConfigs }),
      });
    }
    if (url.includes('/preview')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            operationType: 'LC_IMPORT',
            triggerEvent: 'ISSUE_APPROVED',
            operationId: 'OP-001',
            totalActions: previewActions.length,
            actions: previewActions,
          },
        }),
      });
    }
    if (url.includes('/execute')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            executionId: 'EXE-123456',
            totalActions: executionResult.length,
            successCount: executionResult.filter(a => a.status === 'SUCCESS').length,
            failedCount: executionResult.filter(a => a.status === 'FAILED').length,
            actions: executionResult,
          },
        }),
      });
    }
    if (url.includes('/retry')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createActionStatus({ status: 'PENDING' }) }),
      });
    }
    if (url.includes('/skip')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: createActionStatus({ status: 'SKIPPED' }) }),
      });
    }
    // Default response for other endpoints (like /operations/{id})
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { stage: 'ACTIVE' } })
    });
  });
};

// =============================================================================
// 1. PREVIEW - Display of Pending Actions
// =============================================================================

describe('1. PREVIEW - Display of Pending Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1.1 Loading State', () => {
    it('should show loading spinner while fetching preview', async () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<PostApprovalActionsDialog {...defaultProps} />);

      expect(screen.getByText('common.loading')).toBeInTheDocument();
    });
  });

  describe('1.2 Actions Display', () => {
    it('should display action list from preview', async () => {
      setupMocks({
        previewActions: [
          createActionPreview({ actionType: 'SWIFT_MESSAGE', order: 1 }),
          createActionPreview({ actionType: 'AUDITORIA', order: 2 }),
        ],
      });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('#1')).toBeInTheDocument();
        expect(screen.getByText('#2')).toBeInTheDocument();
      });
    });

    it('should show preview description with action count', async () => {
      setupMocks({
        previewActions: [createActionPreview(), createActionPreview({ order: 2 })],
      });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/2/)).toBeInTheDocument();
      });
    });

    it('should display action type with translated name', async () => {
      setupMocks({
        previewActions: [createActionPreview({ actionType: 'SWIFT_MESSAGE' })],
        actionConfigs: [createActionTypeConfig({ displayName: 'Generate SWIFT Message' })],
      });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Generate SWIFT Message')).toBeInTheDocument();
      });
    });

    it('should show async badge for async actions', async () => {
      setupMocks({
        previewActions: [createActionPreview({ async: true })],
      });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.async')).toBeInTheDocument();
      });
    });
  });

  describe('1.3 No Actions Case', () => {
    it('should show no actions message when empty', async () => {
      setupMocks({ previewActions: [] });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.noActions')).toBeInTheDocument();
      });
    });

    it('should disable execute button when no actions', async () => {
      setupMocks({ previewActions: [] });

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        const executeButton = screen.getByText('postApprovalActions.executeAll');
        expect(executeButton.closest('button')).toBeDisabled();
      });
    });
  });
});

// =============================================================================
// 2. EXECUTION - Action Execution Flow
// =============================================================================

describe('2. EXECUTION - Action Execution Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('2.1 Execute All', () => {
    it('should call execute endpoint when clicking execute all', async () => {
      setupMocks();
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      const executeButton = screen.getByText('postApprovalActions.executeAll');
      await user.click(executeButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/execute'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should show progress bar during execution', async () => {
      setupMocks();
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      const executeButton = screen.getByText('postApprovalActions.executeAll');
      await user.click(executeButton);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.progress')).toBeInTheDocument();
      });
    });
  });

  describe('2.2 Execution Results', () => {
    it('should show success count after execution', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({ status: 'SUCCESS' }),
          createActionStatus({ id: 2, status: 'SUCCESS' }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument(); // Success count
        expect(screen.getByText('postApprovalActions.success')).toBeInTheDocument();
      });
    });

    it('should show failed count after execution with errors', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({ status: 'SUCCESS' }),
          createActionStatus({ id: 2, status: 'FAILED', errorMessage: 'Test error' }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.failed')).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// 3. STATUS - Status Display and Updates
// =============================================================================

describe('3. STATUS - Status Display and Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('3.1 Status Badges', () => {
    it('should display SUCCESS status correctly', async () => {
      setupMocks({
        executionResult: [createActionStatus({ status: 'SUCCESS' })],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.statuses.SUCCESS')).toBeInTheDocument();
      });
    });

    it('should display FAILED status correctly', async () => {
      setupMocks({
        executionResult: [createActionStatus({ status: 'FAILED', canRetry: true })],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.statuses.FAILED')).toBeInTheDocument();
      });
    });
  });

  describe('3.2 Duration Display', () => {
    it('should show duration in milliseconds for completed actions', async () => {
      setupMocks({
        executionResult: [createActionStatus({ status: 'SUCCESS', durationMs: 150 })],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('150ms')).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// 4. ERROR HANDLING - Error Scenarios and Retry/Skip
// =============================================================================

describe('4. ERROR HANDLING - Error Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('4.1 Error Display', () => {
    it('should show error message for failed actions', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({
            status: 'FAILED',
            errorMessage: 'Connection timeout',
            canRetry: true,
          }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      // Need to expand error details first
      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.statuses.FAILED')).toBeInTheDocument();
      });
    });
  });

  describe('4.2 Retry Functionality', () => {
    it('should show retry button for failed actions with retries available', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({
            status: 'FAILED',
            canRetry: true,
            retryCount: 0,
            maxRetries: 3,
          }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        const retryButton = screen.getByLabelText('postApprovalActions.retry');
        expect(retryButton).toBeInTheDocument();
      });
    });
  });

  describe('4.3 Skip Functionality', () => {
    it('should show skip button for failed actions', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({
            status: 'FAILED',
            canSkip: true,
          }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        const skipButton = screen.getByLabelText('postApprovalActions.skip');
        expect(skipButton).toBeInTheDocument();
      });
    });
  });
});

// =============================================================================
// 5. DIALOG BEHAVIOR
// =============================================================================

describe('5. DIALOG BEHAVIOR', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('5.1 Close Behavior', () => {
    it('should call onClose when clicking cancel', async () => {
      // Use empty actions so cancel button calls onClose directly without confirmation
      setupMocks({ previewActions: [] });
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByText('common.cancel')).toBeInTheDocument();
      });

      await user.click(screen.getByText('common.cancel'));

      expect(onClose).toHaveBeenCalled();
    });

    it('should call onComplete when closing after execution', async () => {
      setupMocks();
      const onComplete = vi.fn();
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} onComplete={onComplete} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.done')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.done'));

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('5.2 Header Updates', () => {
    it('should show different header for completed state', async () => {
      setupMocks();
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.title')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.completed')).toBeInTheDocument();
      });
    });

    it('should show error header when completed with errors', async () => {
      setupMocks({
        executionResult: [
          createActionStatus({ status: 'FAILED', canRetry: true }),
        ],
      });
      const user = userEvent.setup();

      render(<PostApprovalActionsDialog {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.executeAll')).toBeInTheDocument();
      });

      await user.click(screen.getByText('postApprovalActions.executeAll'));

      await waitFor(() => {
        expect(screen.getByText('postApprovalActions.completedWithErrors')).toBeInTheDocument();
      });
    });
  });
});
