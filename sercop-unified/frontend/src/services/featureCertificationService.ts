import { get, put } from '../utils/apiClient';
import { FEATURE_CERTIFICATION_ROUTES } from '../config/api.routes';

export type CertificationStatus = 'NOT_TESTED' | 'IN_PROGRESS' | 'CERTIFIED' | 'FAILED' | 'BLOCKED';

export interface FeatureCertification {
  id: number;
  featureCode: string;
  featureName: string;
  featureNameEn?: string;
  parentCode?: string;
  displayOrder: number;
  status: CertificationStatus;
  testedBy?: string;
  testedAt?: string;
  certifiedBy?: string;
  certifiedAt?: string;
  notes?: string;
  testEvidenceUrl?: string;
  blockerReason?: string;
  linkedAlertTag?: string;
  createdAt: string;
  updatedAt?: string;
  children?: FeatureCertification[];
}

export interface FeatureCertificationUpdateRequest {
  status: CertificationStatus;
  notes?: string;
  testEvidenceUrl?: string;
  blockerReason?: string;
}

export interface CertificationStats {
  total: number;
  notTested: number;
  inProgress: number;
  certified: number;
  failed: number;
  blocked: number;
  certifiedPercentage: number;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

class FeatureCertificationService {
  /**
   * Get all certifications in hierarchical structure
   */
  async getAllHierarchical(): Promise<FeatureCertification[]> {
    const response = await get(FEATURE_CERTIFICATION_ROUTES.BASE);
    // Backend returns array directly without wrapper
    return await response.json();
  }

  /**
   * Get all certifications as flat list
   */
  async getAllFlat(): Promise<FeatureCertification[]> {
    const response = await get(FEATURE_CERTIFICATION_ROUTES.FLAT);
    return await response.json();
  }

  /**
   * Get certification stats
   */
  async getStats(): Promise<CertificationStats> {
    const response = await get(FEATURE_CERTIFICATION_ROUTES.STATS);
    return await response.json();
  }

  /**
   * Get certification by feature code
   */
  async getByCode(featureCode: string): Promise<FeatureCertification> {
    const response = await get(FEATURE_CERTIFICATION_ROUTES.BY_CODE(featureCode));
    return await response.json();
  }

  /**
   * Get certifications by status
   */
  async getByStatus(status: CertificationStatus): Promise<FeatureCertification[]> {
    const response = await get(FEATURE_CERTIFICATION_ROUTES.BY_STATUS(status));
    return await response.json();
  }

  /**
   * Update certification status
   */
  async updateStatus(featureCode: string, request: FeatureCertificationUpdateRequest): Promise<FeatureCertification> {
    const response = await put(FEATURE_CERTIFICATION_ROUTES.BY_CODE(featureCode), request);
    return await response.json();
  }

  /**
   * Get certification by linked alert tag
   */
  async getByAlertTag(tag: string): Promise<FeatureCertification | null> {
    try {
      const response = await get(FEATURE_CERTIFICATION_ROUTES.BY_ALERT_TAG(tag));
      if (response.status === 404) {
        return null;
      }
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Get status color
   */
  getStatusColor(status: CertificationStatus): string {
    const colors: Record<CertificationStatus, string> = {
      NOT_TESTED: 'gray',
      IN_PROGRESS: 'blue',
      CERTIFIED: 'green',
      FAILED: 'red',
      BLOCKED: 'orange',
    };
    return colors[status] || 'gray';
  }

  /**
   * Get status label
   */
  getStatusLabel(status: CertificationStatus): string {
    const labels: Record<CertificationStatus, string> = {
      NOT_TESTED: 'Sin Probar',
      IN_PROGRESS: 'En Progreso',
      CERTIFIED: 'Certificado',
      FAILED: 'Fallido',
      BLOCKED: 'Bloqueado',
    };
    return labels[status] || status;
  }
}

export const featureCertificationService = new FeatureCertificationService();
export default featureCertificationService;
