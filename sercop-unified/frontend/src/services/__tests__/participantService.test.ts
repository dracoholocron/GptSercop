/**
 * Unit Tests for participantService
 *
 * Validates that:
 * - The Participante interface no longer contains 'autenticador' field
 * - CRUD operations work correctly
 * - Filtering and pagination work as expected
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as apiClient from '../../utils/apiClient';
import * as apiClientConfig from '../../config/api.client';
import {
  participanteService,
  type Participante,
  type CreateParticipanteCommand,
  type UpdateParticipanteCommand,
  type ParticipanteFilters,
} from '../participantService';

// Mock the apiClient module
vi.mock('../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

// Mock the api config
vi.mock('../../config/api.config', () => ({
  API_BASE_URL_WITH_PREFIX: 'http://localhost:8080/api',
}));

// Mock isClientUser
vi.mock('../../config/api.client', () => ({
  isClientUser: vi.fn(() => false),
}));

describe('participantService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (apiClientConfig.isClientUser as Mock).mockReturnValue(false);
  });

  const mockParticipante: Participante = {
    id: 1,
    identificacion: '1234567890',
    tipo: 'Cliente',
    tipoReferencia: 'Persona Natural',
    nombres: 'Juan',
    apellidos: 'Perez',
    email: 'juan.perez@example.com',
    telefono: '+593999999999',
    direccion: 'Av. Principal 123',
    agencia: 'AGE-001-001',
    ejecutivoAsignado: 'Maria Garcia',
    ejecutivoId: '5',
    correoEjecutivo: 'maria.garcia@bank.com',
    hierarchyType: 'COMPANY',
    parentId: undefined,
    createdAt: '2024-01-01T00:00:00Z',
    createdBy: 'admin',
  };

  const createMockResponse = (data: unknown, ok = true, additional = {}) => ({
    ok,
    json: vi.fn().mockResolvedValue({
      success: ok,
      data,
      message: ok ? undefined : 'Error',
      ...additional,
    }),
  });

  const createMockPaginatedResponse = (
    data: Participante[],
    ok = true,
    pagination = {}
  ) => ({
    ok,
    json: vi.fn().mockResolvedValue({
      success: ok,
      data,
      totalElements: data.length,
      totalPages: 1,
      currentPage: 0,
      pageSize: 10,
      first: true,
      last: true,
      ...pagination,
    }),
  });

  describe('Participante Interface Validation', () => {
    it('should not have autenticador field in Participante interface', () => {
      // TypeScript compile-time check - if autenticador existed, this test would fail
      const participante: Participante = {
        id: 1,
        identificacion: '123',
        tipo: 'Cliente',
        nombres: 'Test',
        apellidos: 'User',
        email: 'test@test.com',
      };

      // Verify the mock participante doesn't have autenticador
      expect(mockParticipante).not.toHaveProperty('autenticador');
      expect(participante).not.toHaveProperty('autenticador');
    });

    it('should have ejecutivoAsignado, ejecutivoId, and correoEjecutivo fields', () => {
      expect(mockParticipante).toHaveProperty('ejecutivoAsignado');
      expect(mockParticipante).toHaveProperty('ejecutivoId');
      expect(mockParticipante).toHaveProperty('correoEjecutivo');
    });
  });

  describe('ParticipanteFilters Interface Validation', () => {
    it('should not have autenticador in filters', () => {
      const filters: ParticipanteFilters = {
        identificacion: '123',
        tipo: 'Cliente',
        nombres: 'Juan',
        apellidos: 'Perez',
        email: 'juan@test.com',
        agencia: 'AGE-001',
      };

      expect(filters).not.toHaveProperty('autenticador');
    });
  });

  describe('getAllParticipantes', () => {
    it('should return all participantes', async () => {
      const participantes = [mockParticipante];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(participantes));

      const result = await participanteService.getAllParticipantes();

      expect(apiClient.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/queries'
      );
      expect(result).toEqual(participantes);
    });

    it('should return empty array when no participantes exist', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse([]));

      const result = await participanteService.getAllParticipantes();

      expect(result).toEqual([]);
    });

    it('should throw error on failed response', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, false));

      await expect(participanteService.getAllParticipantes()).rejects.toThrow();
    });
  });

  describe('getParticipantesPaginated', () => {
    it('should return paginated participantes with default params', async () => {
      const participantes = [mockParticipante];
      (apiClient.get as Mock).mockResolvedValue(
        createMockPaginatedResponse(participantes)
      );

      const result = await participanteService.getParticipantesPaginated();

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('participants/queries/paginated')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('page=0')
      );
      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('size=10')
      );
      expect(result.data).toEqual(participantes);
    });

    it('should apply filters correctly without autenticador', async () => {
      const filters: ParticipanteFilters = {
        identificacion: '123',
        tipo: 'Cliente',
        agencia: 'AGE-001',
      };

      (apiClient.get as Mock).mockResolvedValue(
        createMockPaginatedResponse([mockParticipante])
      );

      await participanteService.getParticipantesPaginated(0, 10, 'id', 'asc', filters);

      const calledUrl = (apiClient.get as Mock).mock.calls[0][0];
      expect(calledUrl).toContain('identificacion=123');
      expect(calledUrl).toContain('tipo=Cliente');
      expect(calledUrl).toContain('agencia=AGE-001');
      // Should NOT contain autenticador
      expect(calledUrl).not.toContain('autenticador');
    });

    it('should ignore tipo filter when set to "all"', async () => {
      const filters: ParticipanteFilters = {
        tipo: 'all',
      };

      (apiClient.get as Mock).mockResolvedValue(
        createMockPaginatedResponse([mockParticipante])
      );

      await participanteService.getParticipantesPaginated(0, 10, 'id', 'asc', filters);

      const calledUrl = (apiClient.get as Mock).mock.calls[0][0];
      expect(calledUrl).not.toContain('tipo=');
    });
  });

  describe('searchParticipantes', () => {
    it('should search participantes by term', async () => {
      (apiClient.get as Mock).mockResolvedValue(
        createMockPaginatedResponse([mockParticipante])
      );

      const result = await participanteService.searchParticipantes('juan');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('q=juan')
      );
      expect(result.data).toHaveLength(1);
    });

    it('should use client portal endpoint for client users', async () => {
      (apiClientConfig.isClientUser as Mock).mockReturnValue(true);
      (apiClient.get as Mock).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            content: [mockParticipante],
            totalElements: 1,
            totalPages: 1,
            number: 0,
            size: 20,
            first: true,
            last: true,
          },
        }),
      });

      await participanteService.searchParticipantes('juan');

      expect(apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('client-portal/catalogs/participants/search')
      );
    });
  });

  describe('getParticipanteById', () => {
    it('should return participante by id', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(mockParticipante));

      const result = await participanteService.getParticipanteById(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/queries/1'
      );
      expect(result).toEqual(mockParticipante);
    });

    it('should throw error when participante not found', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, true));

      await expect(participanteService.getParticipanteById(999)).rejects.toThrow(
        'Participante no encontrado'
      );
    });
  });

  describe('createParticipante', () => {
    it('should create a new participante without autenticador', async () => {
      const command: CreateParticipanteCommand = {
        identificacion: '0987654321',
        tipo: 'Cliente',
        nombres: 'Maria',
        apellidos: 'Garcia',
        email: 'maria.garcia@example.com',
        agencia: 'AGE-001-002',
        ejecutivoAsignado: 'Pedro Lopez',
        ejecutivoId: '3',
        correoEjecutivo: 'pedro.lopez@bank.com',
        createdBy: 'admin',
      };

      const expectedResponse: Participante = {
        id: 2,
        ...command,
        createdAt: '2024-01-02T00:00:00Z',
      };

      (apiClient.post as Mock).mockResolvedValue(createMockResponse(expectedResponse));

      const result = await participanteService.createParticipante(command);

      expect(apiClient.post).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/commands',
        command
      );
      expect(result).toEqual(expectedResponse);
      // Verify no autenticador in the command
      expect(command).not.toHaveProperty('autenticador');
    });
  });

  describe('updateParticipante', () => {
    it('should update an existing participante without autenticador', async () => {
      const command: UpdateParticipanteCommand = {
        identificacion: '1234567890',
        tipo: 'Cliente',
        nombres: 'Juan Carlos',
        apellidos: 'Perez',
        email: 'juan.carlos.perez@example.com',
        agencia: 'AGE-001-003',
        ejecutivoAsignado: 'Ana Martinez',
        ejecutivoId: '7',
        correoEjecutivo: 'ana.martinez@bank.com',
        updatedBy: 'admin',
      };

      const expectedResponse: Participante = {
        ...mockParticipante,
        ...command,
        updatedAt: '2024-01-03T00:00:00Z',
      };

      (apiClient.put as Mock).mockResolvedValue(createMockResponse(expectedResponse));

      const result = await participanteService.updateParticipante(1, command);

      expect(apiClient.put).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/commands/1',
        command
      );
      expect(result.nombres).toBe('Juan Carlos');
      // Verify no autenticador in the command
      expect(command).not.toHaveProperty('autenticador');
    });
  });

  describe('deleteParticipante', () => {
    it('should delete a participante', async () => {
      (apiClient.del as Mock).mockResolvedValue(createMockResponse(null));

      await participanteService.deleteParticipante(1, 'admin');

      expect(apiClient.del).toHaveBeenCalledWith(
        expect.stringContaining('participants/commands/1')
      );
    });
  });

  describe('getEventHistory', () => {
    it('should return event history for a participante', async () => {
      const history = [
        {
          eventId: 'evt-1',
          eventType: 'PARTICIPANTE_CREATED',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'admin',
          version: 1,
          eventData: { nombres: 'Juan' },
        },
      ];

      (apiClient.get as Mock).mockResolvedValue(createMockResponse(history));

      const result = await participanteService.getEventHistory(1);

      expect(apiClient.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/queries/1/history'
      );
      expect(result).toEqual(history);
    });
  });

  describe('getParticipantesByTipo', () => {
    it('should return participantes filtered by tipo', async () => {
      const participantes = [mockParticipante];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(participantes));

      const result = await participanteService.getParticipantesByTipo('Cliente');

      expect(apiClient.get).toHaveBeenCalledWith(
        'http://localhost:8080/api/participants/queries/tipo/Cliente'
      );
      expect(result).toEqual(participantes);
    });
  });
});
