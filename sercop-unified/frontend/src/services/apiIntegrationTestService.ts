import { apiClient as api } from '../config/api.client';

// ==========================================
// Types
// ==========================================

export interface CreditCheckRequest {
  clientId: string;
  clientName: string;
  amount: number;
  currency: string;
  productType: string;
}

export interface CreditCheckResult {
  approved: boolean;
  creditScore?: number;
  availableLimit?: number;
  riskLevel?: string;
  approvalCode?: string;
  message?: string;
}

export interface ComplianceScreeningRequest {
  entityName: string;
  country: string;
  taxId?: string;
}

export interface ComplianceScreeningResult {
  clear: boolean;
  matchCount?: number;
  riskScore?: number;
  screeningId?: string;
  alerts?: Array<{
    type: string;
    source: string;
    matchScore: number;
    details: string;
  }>;
  requiresManualReview: boolean;
  message?: string;
}

export interface SpecificScreeningRequest {
  entityName: string;
  identification?: string;
  countryCode?: string;
}

export interface SpecificScreeningResult {
  screeningCode: string;
  screeningName: string;
  status: 'CLEAR' | 'MATCH' | 'ERROR';
  matchFound: boolean;
  matchScore?: number;
  matchCount?: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNKNOWN';
  matchedRecords?: Array<{
    name: string;
    source: string;
    score: number;
    listDate?: string;
  }>;
  searchComplete: boolean;
  executedAt?: string;
  errorMessage?: string;
}

export interface BatchScreeningRequest {
  screeningCodes: string[];
  entityName: string;
  identification?: string;
  countryCode?: string;
}

export interface CountryRiskResult {
  countryCode: string;
  riskLevel: string;
  riskScore?: number;
  sanctioned: boolean;
  restrictions?: string[];
  message?: string;
}

export interface SwiftValidationResult {
  valid: boolean;
  swiftCode: string;
  bankName?: string;
  bankAddress?: string;
  city?: string;
  country?: string;
  errorMessage?: string;
}

export interface ExchangeRateResult {
  baseCurrency: string;
  targetCurrency: string;
  rate?: number;
  convertedAmount?: number;
  timestamp?: string;
  errorMessage?: string;
}

export interface PricingRequest {
  productType: string;
  subType?: string;
  amount: number;
  currency: string;
  tenorDays: number;
}

export interface PricingResult {
  issuanceFee?: number;
  commissionRate?: number;
  commissionAmount?: number;
  swiftFee?: number;
  totalFees?: number;
  effectiveRate?: number;
  errorMessage?: string;
}

export interface AccountValidationRequest {
  accountNumber: string;
  accountType: string;
  clientId: string;
}

export interface AccountValidationResult {
  valid: boolean;
  accountNumber: string;
  accountHolderName?: string;
  availableBalance?: number;
  currency?: string;
  transactionId?: string;
  errorMessage?: string;
}

export interface CreateHoldRequest {
  accountNumber: string;
  amount: number;
  currency: string;
  referenceNumber: string;
  expirationDate: string;
}

export interface HoldResult {
  success: boolean;
  holdId?: string;
  transactionId?: string;
  message?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  templateId: string;
  clientName?: string;
  requestNumber?: string;
  productType?: string;
  status?: string;
  amount?: string;
  actionUrl?: string;
}

export interface SendSmsRequest {
  phoneNumber: string;
  message: string;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  channel: string;
  recipient: string;
  errorMessage?: string;
}

export interface TestScenarios {
  [key: string]: {
    description: string;
    endpoints: Record<string, string>;
  };
}

// ==========================================
// Service
// ==========================================

const apiIntegrationTestService = {
  /**
   * Test credit check API
   */
  async testCreditCheck(request: CreditCheckRequest): Promise<CreditCheckResult> {
    const response = await api.post<CreditCheckResult>('/integration-test/credit-check', request);
    return response.data;
  },

  /**
   * Test compliance screening API (general)
   */
  async testComplianceScreening(request: ComplianceScreeningRequest): Promise<ComplianceScreeningResult> {
    const response = await api.post<ComplianceScreeningResult>('/integration-test/compliance-screening', request);
    return response.data;
  },

  /**
   * Execute specific screening (OFAC, UN, PEPs, etc.)
   */
  async executeSpecificScreening(screeningCode: string, request: SpecificScreeningRequest): Promise<SpecificScreeningResult> {
    const response = await api.post<SpecificScreeningResult>(`/integration-test/screening/${screeningCode}`, request);
    return response.data;
  },

  /**
   * Execute batch screening (multiple lists at once)
   */
  async executeBatchScreening(request: BatchScreeningRequest): Promise<SpecificScreeningResult[]> {
    const response = await api.post<SpecificScreeningResult[]>('/integration-test/screening/batch', request);
    return response.data;
  },

  /**
   * Test country risk assessment API
   */
  async testCountryRisk(countryCode: string): Promise<CountryRiskResult> {
    const response = await api.get<CountryRiskResult>(`/integration-test/country-risk/${countryCode}`);
    return response.data;
  },

  /**
   * Test SWIFT/BIC validation API
   */
  async testSwiftValidation(swiftCode: string): Promise<SwiftValidationResult> {
    const response = await api.get<SwiftValidationResult>(`/integration-test/swift-validate/${swiftCode}`);
    return response.data;
  },

  /**
   * Test exchange rate API
   */
  async testExchangeRate(base: string, target: string, amount: number = 1000): Promise<ExchangeRateResult> {
    const response = await api.get<ExchangeRateResult>('/integration-test/exchange-rate', {
      params: { base, target, amount }
    });
    return response.data;
  },

  /**
   * Test pricing calculation API
   */
  async testPricing(request: PricingRequest): Promise<PricingResult> {
    const response = await api.post<PricingResult>('/integration-test/pricing', request);
    return response.data;
  },

  /**
   * Test account validation API
   */
  async testAccountValidation(request: AccountValidationRequest): Promise<AccountValidationResult> {
    const response = await api.post<AccountValidationResult>('/integration-test/account-validate', request);
    return response.data;
  },

  /**
   * Test create balance hold API
   */
  async testCreateHold(request: CreateHoldRequest): Promise<HoldResult> {
    const response = await api.post<HoldResult>('/integration-test/create-hold', request);
    return response.data;
  },

  /**
   * Test send email API
   */
  async testSendEmail(request: SendEmailRequest): Promise<NotificationResult> {
    const response = await api.post<NotificationResult>('/integration-test/send-email', request);
    return response.data;
  },

  /**
   * Test send SMS API
   */
  async testSendSms(request: SendSmsRequest): Promise<NotificationResult> {
    const response = await api.post<NotificationResult>('/integration-test/send-sms', request);
    return response.data;
  },

  /**
   * Get available test scenarios
   */
  async getTestScenarios(): Promise<TestScenarios> {
    const response = await api.get<TestScenarios>('/integration-test/scenarios');
    return response.data;
  },

  // ==========================================
  // Helper functions for UI
  // ==========================================

  /**
   * Get status color for credit check result
   */
  getCreditStatusColor(result: CreditCheckResult): string {
    if (result.approved) return 'green';
    if (result.riskLevel === 'MEDIUM') return 'yellow';
    return 'red';
  },

  /**
   * Get status color for compliance screening result
   */
  getComplianceStatusColor(result: ComplianceScreeningResult): string {
    if (result.clear) return 'green';
    if (result.requiresManualReview) return 'yellow';
    return 'red';
  },

  /**
   * Get country risk color
   */
  getCountryRiskColor(riskLevel: string): string {
    const colors: Record<string, string> = {
      'LOW': 'green',
      'MEDIUM': 'yellow',
      'HIGH': 'orange',
      'PROHIBITED': 'red',
      'UNKNOWN': 'gray'
    };
    return colors[riskLevel] || 'gray';
  },

  /**
   * Format currency amount
   */
  formatAmount(amount?: number, currency?: string): string {
    if (amount === undefined || amount === null) return '-';
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
    return currency ? `${currency} ${formatted}` : formatted;
  },

  /**
   * Format percentage
   */
  formatPercentage(value?: number): string {
    if (value === undefined || value === null) return '-';
    return `${(value * 100).toFixed(4)}%`;
  },

  // ==========================================
  // Sample test data
  // ==========================================

  getSampleCreditCheckRequest(): CreditCheckRequest {
    return {
      clientId: 'CLI-001',
      clientName: 'ABC Exports S.A.',
      amount: 100000,
      currency: 'USD',
      productType: 'GUARANTEE_REQUEST'
    };
  },

  getSampleComplianceRequest(): ComplianceScreeningRequest {
    return {
      entityName: 'ABC Exports S.A.',
      country: 'EC',
      taxId: '1790012345001'
    };
  },

  getSamplePricingRequest(): PricingRequest {
    return {
      productType: 'GUARANTEE_REQUEST',
      subType: 'BID_BOND',
      amount: 100000,
      currency: 'USD',
      tenorDays: 90
    };
  },

  getSampleAccountValidationRequest(): AccountValidationRequest {
    return {
      accountNumber: '1234567890',
      accountType: 'CHECKING',
      clientId: 'CLI-001'
    };
  },

  getSampleEmailRequest(): SendEmailRequest {
    return {
      to: 'maria.garcia@abcexports.com',
      subject: 'Your request REQ-2024-000001 has been approved',
      templateId: 'REQUEST_APPROVED',
      clientName: 'ABC Exports S.A.',
      requestNumber: 'REQ-2024-000001',
      productType: 'Guarantee',
      status: 'Approved',
      amount: 'USD 50,000.00',
      actionUrl: 'https://portal.globalcmx.com/requests/REQ-2024-000001'
    };
  },

  getSampleSmsRequest(): SendSmsRequest {
    return {
      phoneNumber: '+593987654321',
      message: 'Your request REQ-2024-000001 has been approved. Check your email for details.'
    };
  }
};

export default apiIntegrationTestService;
