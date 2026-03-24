/**
 * Unit Tests for userService
 */
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as apiClient from '../../utils/apiClient';
import { userService, type User, type Role } from '../userService';

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

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRole: Role = {
    id: 1,
    name: 'ROLE_ADMIN',
    description: 'Administrator role',
  };

  const mockAccountExecutiveRole: Role = {
    id: 2,
    name: 'ROLE_ACCOUNT_EXECUTIVE',
    description: 'Account Executive role',
  };

  const mockInternalUser: User = {
    id: 1,
    username: 'john.doe',
    email: 'john.doe@example.com',
    enabled: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    roles: [mockRole],
    userType: 'INTERNAL',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockClientUser: User = {
    id: 2,
    username: 'client.user',
    email: 'client@example.com',
    enabled: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    roles: [],
    userType: 'CLIENT',
    createdAt: '2024-01-02T00:00:00Z',
  };

  const mockDisabledUser: User = {
    id: 3,
    username: 'disabled.user',
    email: 'disabled@example.com',
    enabled: false,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    roles: [mockRole],
    userType: 'INTERNAL',
    createdAt: '2024-01-03T00:00:00Z',
  };

  const mockAccountExecutive: User = {
    id: 4,
    username: 'exec.user',
    email: 'exec@example.com',
    enabled: true,
    accountNonExpired: true,
    accountNonLocked: true,
    credentialsNonExpired: true,
    roles: [mockAccountExecutiveRole],
    userType: 'INTERNAL',
    createdAt: '2024-01-04T00:00:00Z',
  };

  const createMockResponse = (data: unknown, ok = true) => ({
    ok,
    json: vi.fn().mockResolvedValue(data),
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const allUsers = [mockInternalUser, mockClientUser, mockDisabledUser];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getAllUsers();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/users');
      expect(result).toEqual(allUsers);
      expect(result).toHaveLength(3);
    });

    it('should throw error on failed response', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, false));

      await expect(userService.getAllUsers()).rejects.toThrow('Error al obtener usuarios');
    });

    it('should throw error on network failure', async () => {
      const error = new Error('Network error');
      (apiClient.get as Mock).mockRejectedValue(error);

      await expect(userService.getAllUsers()).rejects.toThrow('Network error');
    });
  });

  describe('getInternalUsers', () => {
    it('should return only internal enabled users', async () => {
      const allUsers = [mockInternalUser, mockClientUser, mockDisabledUser, mockAccountExecutive];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getInternalUsers();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/users');
      // Should only return enabled INTERNAL users (mockInternalUser and mockAccountExecutive)
      expect(result).toHaveLength(2);
      expect(result.every(user => user.userType === 'INTERNAL')).toBe(true);
      expect(result.every(user => user.enabled)).toBe(true);
    });

    it('should return empty array when no internal users exist', async () => {
      const allUsers = [mockClientUser];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getInternalUsers();

      expect(result).toEqual([]);
    });

    it('should filter out disabled internal users', async () => {
      const allUsers = [mockDisabledUser];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getInternalUsers();

      expect(result).toEqual([]);
    });

    it('should throw error on failed response', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, false));

      await expect(userService.getInternalUsers()).rejects.toThrow('Error al obtener usuarios');
    });
  });

  describe('getUsersByRole', () => {
    it('should return users with specified role', async () => {
      const allUsers = [mockInternalUser, mockClientUser, mockAccountExecutive];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getUsersByRole('account_executive');

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/users');
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('exec.user');
    });

    it('should handle role name with ROLE_ prefix', async () => {
      const allUsers = [mockInternalUser, mockAccountExecutive];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getUsersByRole('ROLE_ACCOUNT_EXECUTIVE');

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('exec.user');
    });

    it('should be case insensitive', async () => {
      const allUsers = [mockInternalUser, mockAccountExecutive];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getUsersByRole('ACCOUNT_EXECUTIVE');

      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('exec.user');
    });

    it('should filter out disabled users', async () => {
      const disabledExec: User = {
        ...mockAccountExecutive,
        id: 5,
        enabled: false,
      };
      const allUsers = [mockAccountExecutive, disabledExec];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getUsersByRole('account_executive');

      expect(result).toHaveLength(1);
      expect(result[0].enabled).toBe(true);
    });

    it('should return empty array when no users have the role', async () => {
      const allUsers = [mockInternalUser, mockClientUser];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(allUsers));

      const result = await userService.getUsersByRole('account_executive');

      expect(result).toEqual([]);
    });

    it('should throw error on failed response', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, false));

      await expect(userService.getUsersByRole('admin')).rejects.toThrow('Error al obtener usuarios');
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(mockInternalUser));

      const result = await userService.getUserById(1);

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/users/1');
      expect(result).toEqual(mockInternalUser);
    });

    it('should throw error on failed response', async () => {
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(null, false));

      await expect(userService.getUserById(999)).rejects.toThrow('Error al obtener usuario');
    });
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const command = {
        username: 'new.user',
        email: 'new@example.com',
        password: 'password123',
        userType: 'INTERNAL' as const,
      };

      const expectedResponse: User = {
        id: 10,
        username: 'new.user',
        email: 'new@example.com',
        enabled: true,
        accountNonExpired: true,
        accountNonLocked: true,
        credentialsNonExpired: true,
        roles: [],
        userType: 'INTERNAL',
      };

      (apiClient.post as Mock).mockResolvedValue(createMockResponse(expectedResponse));

      const result = await userService.createUser(command);

      expect(apiClient.post).toHaveBeenCalledWith('http://localhost:8080/api/users', command);
      expect(result).toEqual(expectedResponse);
    });

    it('should throw error with message on failed creation', async () => {
      const command = {
        username: 'existing.user',
        email: 'existing@example.com',
        password: 'password123',
      };

      (apiClient.post as Mock).mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: 'Usuario ya existe' }),
      });

      await expect(userService.createUser(command)).rejects.toThrow('Usuario ya existe');
    });
  });

  describe('updateUser', () => {
    it('should update an existing user', async () => {
      const command = {
        email: 'updated@example.com',
        enabled: false,
      };

      const expectedResponse: User = {
        ...mockInternalUser,
        email: 'updated@example.com',
        enabled: false,
      };

      (apiClient.put as Mock).mockResolvedValue(createMockResponse(expectedResponse));

      const result = await userService.updateUser(1, command);

      expect(apiClient.put).toHaveBeenCalledWith('http://localhost:8080/api/users/1', command);
      expect(result.email).toBe('updated@example.com');
      expect(result.enabled).toBe(false);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete a user by default', async () => {
      (apiClient.del as Mock).mockResolvedValue(createMockResponse(null));

      await userService.deleteUser(1);

      expect(apiClient.del).toHaveBeenCalledWith('http://localhost:8080/api/users/1?soft=true');
    });

    it('should hard delete when soft is false', async () => {
      (apiClient.del as Mock).mockResolvedValue(createMockResponse(null));

      await userService.deleteUser(1, false);

      expect(apiClient.del).toHaveBeenCalledWith('http://localhost:8080/api/users/1');
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const roles = [mockRole, mockAccountExecutiveRole];
      (apiClient.get as Mock).mockResolvedValue(createMockResponse(roles));

      const result = await userService.getAllRoles();

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/roles');
      expect(result).toEqual(roles);
    });
  });

  describe('getEventHistory', () => {
    it('should return event history for a user', async () => {
      const history = [
        {
          eventId: 'evt-1',
          eventType: 'USER_CREATED',
          timestamp: '2024-01-01T00:00:00Z',
          performedBy: 'system',
          version: 1,
          eventData: {},
        },
      ];

      (apiClient.get as Mock).mockResolvedValue(createMockResponse(history));

      const result = await userService.getEventHistory(1);

      expect(apiClient.get).toHaveBeenCalledWith('http://localhost:8080/api/users/1/history');
      expect(result).toEqual(history);
    });
  });
});
