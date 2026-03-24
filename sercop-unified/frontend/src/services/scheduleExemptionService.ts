import { get, post, put, del } from '../utils/apiClient';
import { SCHEDULE_ROUTES } from '../config/api.routes';

export interface ExemptUser {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  reason: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ExemptRole {
  id: number;
  role: {
    id: number;
    name: string;
  };
  reason: string;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  createdBy: string;
  createdAt: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface CreateExemptUserRequest {
  userId: number;
  reason: string;
  validFrom?: string;
  validUntil?: string;
}

export interface CreateExemptRoleRequest {
  roleId: number;
  reason: string;
  validFrom?: string;
  validUntil?: string;
}

export interface UpdateExemptRequest {
  reason?: string;
  validFrom?: string;
  validUntil?: string;
  isActive?: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

class ScheduleExemptionService {
  // === Exempt Users ===

  async getAllExemptUsers(): Promise<ExemptUser[]> {
    const response = await get(SCHEDULE_ROUTES.EXEMPTIONS.USERS.BASE);
    const result: ApiResponse<ExemptUser[]> = await response.json();
    return result.data || [];
  }

  async createExemptUser(data: CreateExemptUserRequest): Promise<ExemptUser> {
    const response = await post(SCHEDULE_ROUTES.EXEMPTIONS.USERS.BASE, data);
    const result: ApiResponse<ExemptUser> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al crear exención de usuario');
    }
    return result.data!;
  }

  async updateExemptUser(id: number, data: UpdateExemptRequest): Promise<ExemptUser> {
    const response = await put(SCHEDULE_ROUTES.EXEMPTIONS.USERS.BY_ID(id), data);
    const result: ApiResponse<ExemptUser> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al actualizar exención de usuario');
    }
    return result.data!;
  }

  async deleteExemptUser(id: number): Promise<void> {
    const response = await del(SCHEDULE_ROUTES.EXEMPTIONS.USERS.BY_ID(id));
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar exención de usuario');
    }
  }

  async toggleExemptUser(id: number): Promise<ExemptUser> {
    const response = await post(SCHEDULE_ROUTES.EXEMPTIONS.USERS.TOGGLE(id), {});
    const result: ApiResponse<ExemptUser> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al cambiar estado de exención');
    }
    return result.data!;
  }

  // === Exempt Roles ===

  async getAllExemptRoles(): Promise<ExemptRole[]> {
    const response = await get(SCHEDULE_ROUTES.EXEMPTIONS.ROLES.BASE);
    const result: ApiResponse<ExemptRole[]> = await response.json();
    return result.data || [];
  }

  async createExemptRole(data: CreateExemptRoleRequest): Promise<ExemptRole> {
    const response = await post(SCHEDULE_ROUTES.EXEMPTIONS.ROLES.BASE, data);
    const result: ApiResponse<ExemptRole> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al crear exención de rol');
    }
    return result.data!;
  }

  async updateExemptRole(id: number, data: UpdateExemptRequest): Promise<ExemptRole> {
    const response = await put(SCHEDULE_ROUTES.EXEMPTIONS.ROLES.BY_ID(id), data);
    const result: ApiResponse<ExemptRole> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al actualizar exención de rol');
    }
    return result.data!;
  }

  async deleteExemptRole(id: number): Promise<void> {
    const response = await del(SCHEDULE_ROUTES.EXEMPTIONS.ROLES.BY_ID(id));
    const result: ApiResponse<void> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al eliminar exención de rol');
    }
  }

  async toggleExemptRole(id: number): Promise<ExemptRole> {
    const response = await post(SCHEDULE_ROUTES.EXEMPTIONS.ROLES.TOGGLE(id), {});
    const result: ApiResponse<ExemptRole> = await response.json();
    if (!result.success) {
      throw new Error(result.message || 'Error al cambiar estado de exención');
    }
    return result.data!;
  }
}

export const scheduleExemptionService = new ScheduleExemptionService();
export default scheduleExemptionService;
