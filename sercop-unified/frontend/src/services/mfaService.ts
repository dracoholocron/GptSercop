// Use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// MFA Method types
export type MfaMethod = 'totp' | 'sms' | 'email' | 'webauthn' | 'push';

export interface MfaStatusResponse {
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  gracePeriodUntil: string | null;
  lastMfaVerifiedAt: string | null;
  enrolledMethods: EnrolledMethod[];
  availableMethods: AvailableMethod[];
  recoveryCodesRemaining: number;
  trustedDevicesCount: number;
}

export interface EnrolledMethod {
  enrollmentId: number;
  method: MfaMethod;
  displayName: string;
  verified: boolean;
  isPrimary: boolean;
  syncedToIdp: boolean;
  maskedIdentifier: string | null;
  enrolledAt: string;
  lastUsedAt: string | null;
}

export interface AvailableMethod {
  method: MfaMethod;
  displayName: string;
  description: string;
  requiresIdpSync: boolean;
}

export interface MfaEnrollmentRequest {
  method: MfaMethod;
  phoneNumber?: string;
  backupEmail?: string;
  setPrimary?: boolean;
}

export interface MfaEnrollmentResponse {
  enrollmentId: number;
  method: MfaMethod;
  methodDisplayName: string;
  verificationRequired: boolean;
  qrCodeBase64?: string;
  manualEntryKey?: string;
  issuer?: string;
  accountName?: string;
  message: string;
  createdAt: string;
}

export interface MfaVerificationRequest {
  method: MfaMethod;
  code: string;
  trustDevice?: boolean;
  deviceFingerprint?: string;
  deviceName?: string;
}

export interface MfaVerificationResponse {
  success: boolean;
  message: string;
  enrollmentComplete?: boolean;
  deviceTrustedUntil?: string;
}

export interface MfaConfigResponse {
  providers: IdpProvider[];
  methods: MfaMethodInfo[];
  policies: MfaPolicy[];
}

export interface IdpProvider {
  provider: string;
  displayName: string;
  enabled: boolean;
  supportedMethods: string[];
}

export interface MfaMethodInfo {
  code: string;
  displayName: string;
  description: string;
  supportsIdpSync: boolean;
}

export interface MfaPolicy {
  code: string;
  displayName: string;
  description: string;
}

export interface MfaPolicySyncRequest {
  enabledMethods: MfaMethod[];
  policy: string;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Headers for API calls
const getHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Generate device fingerprint
export const generateDeviceFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
  ];

  const data = new TextEncoder().encode(components.join('|'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get MFA status
export const getMfaStatus = async (): Promise<MfaStatusResponse> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/status`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error al obtener estado de MFA');
  }

  return response.json();
};

// Start MFA enrollment
export const enrollMfa = async (request: MfaEnrollmentRequest): Promise<MfaEnrollmentResponse> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/enroll`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || 'Error al iniciar inscripción MFA');
  }

  return response.json();
};

// Verify MFA code
export const verifyMfa = async (request: MfaVerificationRequest): Promise<MfaVerificationResponse> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/verify`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || 'Error al verificar código MFA');
  }

  return response.json();
};

// Remove MFA enrollment
export const removeMfaEnrollment = async (method: MfaMethod): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/enroll/${method}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error al eliminar método MFA');
  }
};

// Revoke trusted device
export const revokeTrustedDevice = async (fingerprint: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/trusted-devices/${fingerprint}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error al revocar dispositivo de confianza');
  }
};

// Get step-up authentication URL
export const getStepUpAuthUrl = async (state?: string): Promise<{ type: string; url?: string; message?: string }> => {
  const params = state ? `?state=${encodeURIComponent(state)}` : '';
  const response = await fetch(`${API_BASE_URL}/v1/mfa/step-up${params}`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error al obtener URL de autenticación');
  }

  return response.json();
};

// Check if MFA is required
export const checkMfaRequired = async (
  deviceFingerprint?: string,
  riskScore?: number
): Promise<{ mfaRequired: boolean; reason: string }> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/check`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      deviceFingerprint,
      riskScore: riskScore || 0,
    }),
  });

  if (!response.ok) {
    throw new Error('Error al verificar requerimiento de MFA');
  }

  return response.json();
};

// Admin: Get MFA configuration
export const getMfaConfig = async (): Promise<MfaConfigResponse> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/admin/config`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Error al obtener configuración MFA');
  }

  return response.json();
};

// Admin: Sync MFA policy to IdPs
export const syncMfaPolicy = async (request: MfaPolicySyncRequest): Promise<{ success: boolean; results: Record<string, boolean | null> }> => {
  const response = await fetch(`${API_BASE_URL}/v1/mfa/admin/sync-policy`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Error al sincronizar política MFA');
  }

  return response.json();
};

export default {
  getMfaStatus,
  enrollMfa,
  verifyMfa,
  removeMfaEnrollment,
  revokeTrustedDevice,
  getStepUpAuthUrl,
  checkMfaRequired,
  getMfaConfig,
  syncMfaPolicy,
  generateDeviceFingerprint,
};
