/**
 * AdminService - User Approval Tests
 * Tests for pending user approval methods
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import adminService from './adminService';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AdminService - User Approval Methods', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPendingUsers', () => {
    it('should fetch pending users successfully', async () => {
      // Given
      const mockUsers = [
        { id: 1, username: 'pending1@test.com', approvalStatus: 'PENDING' },
        { id: 2, username: 'pending2@test.com', approvalStatus: 'PENDING' },
      ];
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      });

      // When
      const result = await adminService.getPendingUsers();

      // Then
      expect(result).toEqual(mockUsers);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/pending'),
        expect.any(Object)
      );
    });

    it('should throw error on failure', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Unauthorized' }),
      });

      // When/Then
      await expect(adminService.getPendingUsers()).rejects.toThrow('Unauthorized');
    });
  });

  describe('approveUser', () => {
    it('should approve user with roles', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User approved' }),
      });

      // When
      await adminService.approveUser(1, [2, 3]);

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1/approve'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ roleIds: [2, 3] }),
        })
      );
    });

    it('should throw error if user not found', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'User not found' }),
      });

      // When/Then
      await expect(adminService.approveUser(999, [1])).rejects.toThrow('User not found');
    });
  });

  describe('rejectUser', () => {
    it('should reject user with reason', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ message: 'User rejected' }),
      });

      // When
      await adminService.rejectUser(1, 'Invalid company email');

      // Then
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users/1/reject'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ reason: 'Invalid company email' }),
        })
      );
    });

    it('should throw error if user is not pending', async () => {
      // Given
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'User is not pending approval' }),
      });

      // When/Then
      await expect(adminService.rejectUser(1, 'reason')).rejects.toThrow('User is not pending approval');
    });
  });
});
