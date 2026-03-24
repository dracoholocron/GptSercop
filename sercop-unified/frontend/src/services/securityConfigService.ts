import { apiClient } from '../config/api.client';
import { SECURITY_CONFIG_ROUTES } from '../config/api.routes';

export interface SecurityConfiguration {
  id: number;
  configType: 'AUTHENTICATION' | 'AUTHORIZATION' | 'AUDIT' | 'RISK' | 'SESSION' | 'MFA';
  configKey: string;
  configValue: Record<string, any>;
  isActive: boolean;
  environment: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export interface SecurityPreset {
  id: number;
  code: string;
  nameKey: string;
  descriptionKey: string;
  icon: string;
  configJson: Record<string, any>;
  isSystem: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface FourEyesConfig {
  id: number;
  entityType: string;
  actionType: string;
  isEnabled: boolean;
  minApprovers: number;
  amountThreshold: number | null;
  requireDifferentDepartment: boolean;
  requireHigherRole: boolean;
  excludedRoles: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface UpdateSecurityConfigCommand {
  configType: string;
  configKey: string;
  configValue: Record<string, any>;
  environment?: string;
}

export interface ApplyPresetCommand {
  presetCode?: string;
  environment?: string;
  overrides?: Record<string, any>;
  backupCurrent?: boolean;
}

export interface UpdateFourEyesConfigCommand {
  id?: number;
  entityType: string;
  actionType: string;
  isEnabled?: boolean;
  minApprovers?: number;
  amountThreshold?: number | null;
  requireDifferentDepartment?: boolean;
  requireHigherRole?: boolean;
  excludedRoles?: string[];
}

export const securityConfigService = {
  // Configurations
  async getAllConfigurations(): Promise<SecurityConfiguration[]> {
    const response = await apiClient.get<SecurityConfiguration[]>(SECURITY_CONFIG_ROUTES.CONFIG);
    return response.data;
  },

  async getConfigurationsByType(type: string): Promise<SecurityConfiguration[]> {
    const response = await apiClient.get<SecurityConfiguration[]>(
      SECURITY_CONFIG_ROUTES.CONFIG_BY_TYPE(type)
    );
    return response.data;
  },

  async updateConfiguration(command: UpdateSecurityConfigCommand): Promise<SecurityConfiguration> {
    const response = await apiClient.post<SecurityConfiguration>(
      SECURITY_CONFIG_ROUTES.CONFIG,
      command
    );
    return response.data;
  },

  // Presets
  async getPresets(): Promise<SecurityPreset[]> {
    const response = await apiClient.get<SecurityPreset[]>(SECURITY_CONFIG_ROUTES.PRESETS);
    return response.data;
  },

  async getSystemPresets(): Promise<SecurityPreset[]> {
    const response = await apiClient.get<SecurityPreset[]>(SECURITY_CONFIG_ROUTES.SYSTEM_PRESETS);
    return response.data;
  },

  async applyPreset(presetCode: string, command?: ApplyPresetCommand): Promise<void> {
    await apiClient.post(SECURITY_CONFIG_ROUTES.APPLY_PRESET(presetCode), command || {});
  },

  // Four Eyes Configuration
  async getFourEyesConfigs(): Promise<FourEyesConfig[]> {
    const response = await apiClient.get<FourEyesConfig[]>(SECURITY_CONFIG_ROUTES.FOUR_EYES);
    return response.data;
  },

  async getFourEyesConfigsByEntity(entityType: string): Promise<FourEyesConfig[]> {
    const response = await apiClient.get<FourEyesConfig[]>(
      SECURITY_CONFIG_ROUTES.FOUR_EYES_BY_ENTITY(entityType)
    );
    return response.data;
  },

  async updateFourEyesConfig(command: UpdateFourEyesConfigCommand): Promise<FourEyesConfig> {
    const response = await apiClient.post<FourEyesConfig>(
      SECURITY_CONFIG_ROUTES.FOUR_EYES,
      command
    );
    return response.data;
  },

  // Audit Log
  async getAuditLog(page = 0, size = 20): Promise<{ content: any[]; totalElements: number }> {
    const response = await apiClient.get(SECURITY_CONFIG_ROUTES.AUDIT_LOG, {
      params: { page, size },
    });
    return response.data;
  },

  // Risk Rules
  async getRiskRules(): Promise<any[]> {
    const response = await apiClient.get(SECURITY_CONFIG_ROUTES.RISK_RULES);
    return response.data;
  },
};

export default securityConfigService;
