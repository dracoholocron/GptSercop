/**
 * operationsApi - Unit Tests
 *
 * Tests for API service validating:
 * 1. Correct URL paths (all must use /api/v1 prefix)
 * 2. Authentication headers
 * 3. Response handling
 * 4. Error handling (401, 404, 500)
 *
 * @author GlobalCMX Team
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Restore real module (not mocked version from setup.tsx)
vi.unmock('./operationsApi');

// Import after unmock
import {
  operationsApi,
  operationCommands,
  swiftMessagesApi,
  swiftMessageCommands,
  eventConfigApi,
  eventLogApi,
  eventConfigCommands,
} from './operationsApi';
import { TOKEN_STORAGE_KEY } from '../config/api.config';

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.location
const locationMock = { href: '' };
Object.defineProperty(window, 'location', {
  value: locationMock,
  writable: true,
});

// Helper to create mock response
const createMockResponse = (data: unknown, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: vi.fn().mockResolvedValue(data),
});

// =============================================================================
// 1. URL PATH VALIDATION - All endpoints must use /api/v1
// =============================================================================

describe('1. URL PATH VALIDATION - All endpoints must use /api/v1', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  describe('1.1 Operations API URLs', () => {
    it('getByOperationId should call /api/v1/operations/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await operationsApi.getByOperationId('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001'),
        expect.any(Object)
      );
    });

    it('getOperations should call /api/v1/operations', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getOperations();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations'),
        expect.any(Object)
      );
    });

    it('getOperations with filters should include query params', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getOperations({ productType: 'LC_IMPORT', status: 'ACTIVE' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations'),
        expect.any(Object)
      );
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('productType=LC_IMPORT');
      expect(url).toContain('status=ACTIVE');
    });

    it('getByProductType should call /api/v1/operations/product/{type}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getByProductType('LC_IMPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/product/LC_IMPORT'),
        expect.any(Object)
      );
    });

    it('getAwaitingResponse should call /api/v1/operations/awaiting-response', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getAwaitingResponse();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/awaiting-response'),
        expect.any(Object)
      );
    });

    it('getAwaitingResponse with productType should include query param', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getAwaitingResponse('LC_EXPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/awaiting-response?productType=LC_EXPORT'),
        expect.any(Object)
      );
    });

    it('getWithAlerts should call /api/v1/operations/with-alerts', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getWithAlerts();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/with-alerts'),
        expect.any(Object)
      );
    });

    it('getOperationSummary should call /api/v1/operations/{id}/summary', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await operationsApi.getOperationSummary('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001/summary'),
        expect.any(Object)
      );
    });

    it('getOperationAlerts should call /api/v1/operations/{id}/alerts', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await operationsApi.getOperationAlerts('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001/alerts'),
        expect.any(Object)
      );
    });

    it('refreshOperationSummary should call /api/v1/operations/{id}/summary/refresh', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await operationsApi.refreshOperationSummary('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001/summary/refresh'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('1.2 Operation Commands URLs', () => {
    it('approveDraft should call /api/v1/operations/approve', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await operationCommands.approveDraft({
        draftId: 'draft-123',
        approvedBy: 'admin',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/approve'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('executeEvent should call /api/v1/operations/{id}/execute-event', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await operationCommands.executeEvent('LCI-2025-001', {
        eventCode: 'ADVISED',
        executedBy: 'admin',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001/execute-event'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('markResponseReceived should call /api/v1/operations/{id}/response-received', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));

      await operationCommands.markResponseReceived('LCI-2025-001', 'MT730');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/operations/LCI-2025-001/response-received?responseMessageType=MT730'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('1.3 SWIFT Messages API URLs', () => {
    it('getByMessageId should call /api/v1/swift-messages/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await swiftMessagesApi.getByMessageId('MSG-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/MSG-123'),
        expect.any(Object)
      );
    });

    it('getMessages should call /api/v1/swift-messages', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await swiftMessagesApi.getMessages();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages'),
        expect.any(Object)
      );
    });

    it('getByOperationId should call /api/v1/swift-messages/operation/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await swiftMessagesApi.getByOperationId('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/operation/LCI-2025-001'),
        expect.any(Object)
      );
    });

    it('getPendingResponses should call /api/v1/swift-messages/pending-responses', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await swiftMessagesApi.getPendingResponses();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/pending-responses'),
        expect.any(Object)
      );
    });

    it('getOverdueResponses should call /api/v1/swift-messages/overdue-responses', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await swiftMessagesApi.getOverdueResponses();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/overdue-responses'),
        expect.any(Object)
      );
    });

    it('getPendingAck should call /api/v1/swift-messages/pending-ack', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await swiftMessagesApi.getPendingAck();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/pending-ack'),
        expect.any(Object)
      );
    });
  });

  describe('1.4 SWIFT Message Commands URLs', () => {
    it('sendMessage should call /api/v1/swift-messages/send', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await swiftMessageCommands.sendMessage({
        messageType: 'MT700',
        operationId: 'LCI-2025-001',
        senderBic: 'TESTBIC1',
        receiverBic: 'TESTBIC2',
        swiftContent: 'content',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/send'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('receiveMessage should call /api/v1/swift-messages/receive', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await swiftMessageCommands.receiveMessage({
        messageType: 'MT730',
        operationId: 'LCI-2025-001',
        senderBic: 'TESTBIC1',
        receiverBic: 'TESTBIC2',
        swiftContent: 'content',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/receive'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('recordAck should call /api/v1/swift-messages/{id}/ack', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));

      await swiftMessageCommands.recordAck('MSG-123', 'ACK content');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/MSG-123/ack'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('markProcessed should call /api/v1/swift-messages/{id}/processed', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));

      await swiftMessageCommands.markProcessed('MSG-123', 'admin');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/swift-messages/MSG-123/processed?processedBy=admin'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });

  describe('1.5 Event Config API URLs', () => {
    it('getEventTypes should call /api/v1/event-config/types/{operationType}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getEventTypes('LC_IMPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/types/LC_IMPORT?language=en'),
        expect.any(Object)
      );
    });

    it('getEventType should call /api/v1/event-config/types/{operationType}/{eventCode}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventConfigApi.getEventType('LC_IMPORT', 'ADVISED');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/types/LC_IMPORT/ADVISED?language=en'),
        expect.any(Object)
      );
    });

    it('getAvailableEvents should call /api/v1/event-config/flows/{operationType}/available', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getAvailableEvents('LC_IMPORT', 'ISSUED');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/flows/LC_IMPORT/available'),
        expect.any(Object)
      );
    });

    it('getAvailableEventsForOperation should call /api/v1/event-config/flows/operation/{id}/available', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getAvailableEventsForOperation('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/flows/operation/LCI-2025-001/available'),
        expect.any(Object)
      );
    });

    it('getInitialEvents should call /api/v1/event-config/flows/{operationType}/initial', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getInitialEvents('LC_IMPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/flows/LC_IMPORT/initial?language=en'),
        expect.any(Object)
      );
    });

    it('getAllFlows should call /api/v1/event-config/flows/{operationType}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getAllFlows('LC_IMPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/flows/LC_IMPORT?language=en'),
        expect.any(Object)
      );
    });

    it('getResponseConfigs should call /api/v1/event-config/responses/{operationType}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getResponseConfigs('LC_IMPORT');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/responses/LC_IMPORT?language=en'),
        expect.any(Object)
      );
    });

    it('getOperationTypes should call /api/v1/event-config/operation-types', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventConfigApi.getOperationTypes();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/operation-types'),
        expect.any(Object)
      );
    });
  });

  describe('1.6 Event Log API URLs', () => {
    it('getEventHistory should call /api/v1/event-logs/operation/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventLogApi.getEventHistory('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/operation/LCI-2025-001?language=en'),
        expect.any(Object)
      );
    });

    it('getRecentEvents should call /api/v1/event-logs/operation/{id}/recent', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventLogApi.getRecentEvents('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/operation/LCI-2025-001/recent?language=en'),
        expect.any(Object)
      );
    });

    it('getLastEvent should call /api/v1/event-logs/operation/{id}/last', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventLogApi.getLastEvent('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/operation/LCI-2025-001/last?language=en'),
        expect.any(Object)
      );
    });

    it('getStateTransitions should call /api/v1/event-logs/operation/{id}/transitions', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventLogApi.getStateTransitions('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/operation/LCI-2025-001/transitions?language=en'),
        expect.any(Object)
      );
    });

    it('getEventsByMessage should call /api/v1/event-logs/message/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));

      await eventLogApi.getEventsByMessage('MSG-123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/message/MSG-123?language=en'),
        expect.any(Object)
      );
    });

    it('countByOperation should call /api/v1/event-logs/count/operation/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: 5 }));

      await eventLogApi.countByOperation('LCI-2025-001');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-logs/count/operation/LCI-2025-001'),
        expect.any(Object)
      );
    });
  });

  describe('1.7 Event Config Commands URLs', () => {
    it('createEventType should call /api/v1/event-config/types', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventConfigCommands.createEventType({
        operationType: 'LC_IMPORT',
        eventCode: 'NEW_EVENT',
        name: 'New Event',
        description: 'Description',
        language: 'en',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/types'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('updateEventType should call /api/v1/event-config/types/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventConfigCommands.updateEventType(1, {
        operationType: 'LC_IMPORT',
        eventCode: 'UPDATED_EVENT',
        name: 'Updated Event',
        description: 'Description',
        language: 'en',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/types/1'),
        expect.objectContaining({ method: 'PUT' })
      );
    });

    it('deleteEventType should call /api/v1/event-config/types/{id}', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));

      await eventConfigCommands.deleteEventType(1);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/types/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('createEventFlow should call /api/v1/event-config/flows', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventConfigCommands.createEventFlow({
        operationType: 'LC_IMPORT',
        fromStage: 'ISSUED',
        eventCode: 'ADVISED',
        toStage: 'ADVISED',
        language: 'en',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/flows'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('createResponseConfig should call /api/v1/event-config/responses', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));

      await eventConfigCommands.createResponseConfig({
        operationType: 'LC_IMPORT',
        sentMessageType: 'MT700',
        expectedResponseType: 'MT730',
        expectedResponseDays: 5,
        language: 'en',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/event-config/responses'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});

// =============================================================================
// 2. AUTHENTICATION HEADERS VALIDATION
// =============================================================================

describe('2. AUTHENTICATION HEADERS VALIDATION', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));
  });

  it('should include Authorization header when token exists', async () => {
    localStorageMock.getItem.mockReturnValue('my-auth-token');

    await operationsApi.getOperations();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer my-auth-token',
        }),
      })
    );
  });

  it('should include Content-Type header', async () => {
    localStorageMock.getItem.mockReturnValue('token');

    await operationsApi.getOperations();

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      })
    );
  });

  it('should NOT include Authorization header when no token', async () => {
    localStorageMock.getItem.mockReturnValue(null);

    await operationsApi.getOperations();

    const callHeaders = mockFetch.mock.calls[0][1].headers;
    expect(callHeaders['Authorization']).toBeUndefined();
  });

  it('should read token from correct localStorage key', async () => {
    localStorageMock.getItem.mockReturnValue('token');

    await operationsApi.getOperations();

    expect(localStorageMock.getItem).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });
});

// =============================================================================
// 3. RESPONSE HANDLING
// =============================================================================

describe('3. RESPONSE HANDLING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('token');
  });

  describe('3.1 Success Responses', () => {
    it('should return data from successful response', async () => {
      const mockData = [{ operationId: 'LCI-001' }, { operationId: 'LCI-002' }];
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: mockData }));

      const result = await operationsApi.getOperations();

      expect(result).toEqual(mockData);
    });

    it('should return empty array when data is undefined', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: true }));

      const result = await operationsApi.getOperations();

      expect(result).toEqual([]);
    });

    it('should return single entity for getByOperationId', async () => {
      const mockOperation = { operationId: 'LCI-001', reference: 'REF-001' };
      mockFetch.mockResolvedValue(createMockResponse({ success: true, data: mockOperation }));

      const result = await operationsApi.getByOperationId('LCI-001');

      expect(result).toEqual(mockOperation);
    });
  });

  describe('3.2 404 Handling', () => {
    it('should return null for 404 on getByOperationId', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: false }, 404));

      const result = await operationsApi.getByOperationId('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null for 404 on getByMessageId', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: false }, 404));

      const result = await swiftMessagesApi.getByMessageId('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null for 404 on getOperationSummary', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: false }, 404));

      const result = await operationsApi.getOperationSummary('NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null for 404 on getEventType', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: false }, 404));

      const result = await eventConfigApi.getEventType('LC_IMPORT', 'NONEXISTENT');

      expect(result).toBeNull();
    });

    it('should return null for 404 on getLastEvent', async () => {
      mockFetch.mockResolvedValue(createMockResponse({ success: false }, 404));

      const result = await eventLogApi.getLastEvent('NONEXISTENT');

      expect(result).toBeNull();
    });
  });

  describe('3.3 Error Responses for Commands', () => {
    it('should throw error when command fails', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ success: false, error: 'Validation error' })
      );

      await expect(
        operationCommands.approveDraft({ draftId: 'draft-123', approvedBy: 'admin' })
      ).rejects.toThrow('Validation error');
    });

    it('should throw error for failed sendMessage', async () => {
      mockFetch.mockResolvedValue(
        createMockResponse({ success: false, error: 'Invalid BIC' })
      );

      await expect(
        swiftMessageCommands.sendMessage({
          messageType: 'MT700',
          operationId: 'LCI-001',
          senderBic: 'INVALID',
          receiverBic: 'TESTBIC',
          swiftContent: 'content',
        })
      ).rejects.toThrow('Invalid BIC');
    });
  });
});

// =============================================================================
// 4. 401 UNAUTHORIZED HANDLING
// =============================================================================

describe('4. 401 UNAUTHORIZED HANDLING', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('expired-token');
    locationMock.href = '';
  });

  it('should remove token from localStorage on 401', async () => {
    mockFetch.mockResolvedValue(createMockResponse({}, 401));

    await operationsApi.getOperations();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
  });

  it('should redirect to /login on 401', async () => {
    mockFetch.mockResolvedValue(createMockResponse({}, 401));

    await operationsApi.getOperations();

    expect(locationMock.href).toBe('/login');
  });

  it('should handle 401 on any API call', async () => {
    mockFetch.mockResolvedValue(createMockResponse({}, 401));

    await swiftMessagesApi.getMessages();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(TOKEN_STORAGE_KEY);
    expect(locationMock.href).toBe('/login');
  });
});

// =============================================================================
// 5. REQUEST BODY VALIDATION
// =============================================================================

describe('5. REQUEST BODY VALIDATION', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('token');
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: {} }));
  });

  it('should send JSON body for POST requests', async () => {
    const command = {
      draftId: 'draft-123',
      approvedBy: 'admin',
    };

    await operationCommands.approveDraft(command);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(command),
      })
    );
  });

  it('should send JSON body for executeEvent', async () => {
    const eventData = {
      eventCode: 'ADVISED',
      executedBy: 'admin',
    };

    await operationCommands.executeEvent('LCI-001', eventData);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: JSON.stringify(eventData),
      })
    );
  });

  it('should send string body for recordAck', async () => {
    await swiftMessageCommands.recordAck('MSG-123', 'ACK content here');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: 'ACK content here',
      })
    );
  });

  it('should send empty string body for recordAck without content', async () => {
    await swiftMessageCommands.recordAck('MSG-123');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: '',
      })
    );
  });
});

// =============================================================================
// 6. REGRESSION TESTS - Ensure no /api without /v1
// =============================================================================

describe('6. REGRESSION - No /api without /v1 prefix', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue('token');
    mockFetch.mockResolvedValue(createMockResponse({ success: true, data: [] }));
  });

  const apiCalls = [
    { name: 'operationsApi.getOperations', call: () => operationsApi.getOperations() },
    { name: 'operationsApi.getByProductType', call: () => operationsApi.getByProductType('LC_IMPORT') },
    { name: 'operationsApi.getWithAlerts', call: () => operationsApi.getWithAlerts() },
    { name: 'swiftMessagesApi.getMessages', call: () => swiftMessagesApi.getMessages() },
    { name: 'swiftMessagesApi.getPendingResponses', call: () => swiftMessagesApi.getPendingResponses() },
    { name: 'eventConfigApi.getEventTypes', call: () => eventConfigApi.getEventTypes('LC_IMPORT') },
    { name: 'eventConfigApi.getOperationTypes', call: () => eventConfigApi.getOperationTypes() },
    { name: 'eventLogApi.getEventHistory', call: () => eventLogApi.getEventHistory('LCI-001') },
  ];

  it.each(apiCalls)('$name should use /api/v1 prefix', async ({ call }) => {
    await call();

    const url = mockFetch.mock.calls[0][0] as string;
    // Match /api/v1/ anywhere in the URL (handles full URLs like http://localhost:8000/api/v1/...)
    expect(url).toMatch(/\/api\/v1\//);
    // Ensure no /api/ without /v1 following it
    expect(url).not.toMatch(/\/api\/[^v]/);
  });
});
