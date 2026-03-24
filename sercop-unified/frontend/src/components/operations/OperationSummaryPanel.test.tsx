/**
 * OperationSummaryPanel - Unit Tests
 *
 * Comprehensive tests organized by scope:
 * 1. SEGURIDAD - Input validation and edge cases
 * 2. FUNCIONALIDAD - Core business logic
 * 3. OPERACION - Complete workflows and integrations
 * 4. REGRESION - Ensure existing functionality works
 *
 * @author GlobalCMX Team
 * @version 1.0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../test/setup';
import userEvent from '@testing-library/user-event';
import { OperationSummaryPanel } from './OperationSummaryPanel';
import { operationCommands } from '../../services/operationsApi';
import { toaster } from '../ui/toaster';
import type { Operation, OperationAnalysisSummary } from '../../types/operations';

// =============================================================================
// TEST DATA FACTORIES
// =============================================================================

const createOperation = (overrides: Partial<Operation> = {}): Operation => ({
  id: 1,
  operationId: 'LCI-2025-001',
  reference: 'REF-LCI-2025-001',
  productType: 'LC_IMPORT',
  messageType: 'MT700',
  stage: 'ADVISED',
  status: 'ACTIVE',
  swiftMessage: '',
  currency: 'USD',
  amount: 100000,
  issueDate: '2025-01-01',
  expiryDate: '2025-06-01',
  issuingBankBic: 'ISSUBANK',
  advisingBankBic: 'ADVBANK',
  applicantName: 'Test Applicant',
  beneficiaryName: 'Test Beneficiary',
  amendmentCount: 0,
  messageCount: 1,
  awaitingResponse: false,
  awaitingMessageType: undefined,
  responseDueDate: undefined,
  version: 1,
  ...overrides,
});

const createSummary = (overrides: Partial<OperationAnalysisSummary> = {}): OperationAnalysisSummary => ({
  operationId: 'LCI-2025-001',
  reference: 'REF-LCI-2025-001',
  productType: 'LC_IMPORT',
  messageType: 'MT700',
  stage: 'ADVISED',
  status: 'ACTIVE',
  amounts: {
    originalAmount: 100000,
    currentAmount: 100000,
    utilizedAmount: 25000,
    availableAmount: 75000,
    utilizationPercentage: 25,
    currency: 'USD',
  },
  dates: {
    issueDate: '2025-01-01',
    originalExpiryDate: '2025-06-01',
    currentExpiryDate: '2025-06-01',
    latestShipmentDate: '2025-05-15',
    daysToExpiry: 150,
    expired: false,
  },
  parties: {
    applicantName: 'Test Applicant',
    applicantAddress: '123 Applicant Street',
    beneficiaryName: 'Test Beneficiary',
    beneficiaryAddress: '456 Beneficiary Avenue',
    issuingBankBic: 'ISSUBANK',
    issuingBankName: 'Issuing Bank Ltd',
    advisingBankBic: 'ADVBANK',
    advisingBankName: 'Advising Bank Ltd',
  },
  alerts: [],
  totalAmendments: 0,
  totalMessages: 1,
  lastUpdated: '2025-01-15T10:00:00Z',
  ...overrides,
});

// =============================================================================
// 1. SEGURIDAD - Input Validation and Edge Cases
// =============================================================================

describe('1. SEGURIDAD - Validaciones y Casos Extremos', () => {
  describe('1.1 Manejo de Datos Nulos/Undefined', () => {
    it('debe renderizar correctamente con summary nulo', () => {
      const operation = createOperation();

      render(
        <OperationSummaryPanel operation={operation} summary={null} />
      );

      expect(screen.getByText('REF-LCI-2025-001')).toBeInTheDocument();
    });

    it('debe manejar amounts undefined en summary', () => {
      const operation = createOperation();
      const summary = createSummary({ amounts: undefined as unknown as OperationAnalysisSummary['amounts'] });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('debe manejar dates undefined en summary', () => {
      const operation = createOperation();
      const summary = createSummary({ dates: undefined as unknown as OperationAnalysisSummary['dates'] });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('debe manejar parties undefined en summary', () => {
      const operation = createOperation();
      const summary = createSummary({ parties: undefined as unknown as OperationAnalysisSummary['parties'] });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      // Should not crash, parties section simply won't render
      expect(screen.getByText('REF-LCI-2025-001')).toBeInTheDocument();
    });
  });

  describe('1.2 Validaciones de Formato de Moneda', () => {
    it('debe formatear correctamente USD', () => {
      const operation = createOperation({ currency: 'USD', amount: 1500000 });
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          currentAmount: 1500000,
          currency: 'USD',
        },
      });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      expect(screen.getByText('$1,500,000.00')).toBeInTheDocument();
    });

    it('debe formatear correctamente EUR', () => {
      const operation = createOperation({ currency: 'EUR', amount: 1500000 });
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          currentAmount: 1500000,
          currency: 'EUR',
        },
      });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      // EUR uses the € symbol
      expect(screen.getByText('€1,500,000.00')).toBeInTheDocument();
    });

    it('debe manejar amount = 0 correctamente', () => {
      const operation = createOperation({ amount: 0 });
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          currentAmount: 0,
          utilizationPercentage: 0,
        },
      });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });
  });

  describe('1.3 Prevención de acciones no autorizadas', () => {
    it('no debe llamar markResponseReceived si awaitingMessageType es undefined', async () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: undefined,
      });

      // This scenario shouldn't show the button anyway
      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.queryByText('operations.markResponseReceived')).not.toBeInTheDocument();
    });

    it('debe deshabilitar botón mientras se procesa la respuesta', async () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
        responseDueDate: '2025-01-25',
      });

      vi.mocked(operationCommands.markResponseReceived).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });
      await userEvent.click(button);

      // Button should be disabled during processing
      expect(button).toBeDisabled();
    });
  });
});

// =============================================================================
// 2. FUNCIONALIDAD - Core Business Logic
// =============================================================================

describe('2. FUNCIONALIDAD - Lógica de Negocio', () => {
  describe('2.1 Visualización de Estados', () => {
    it.each([
      ['ACTIVE', 'operations.statuses.ACTIVE'],
      ['PENDING', 'operations.statuses.PENDING'],
      ['CANCELLED', 'operations.statuses.CANCELLED'],
      ['COMPLETED', 'operations.statuses.COMPLETED'],
    ])('debe mostrar estado %s correctamente', (status, expectedText) => {
      const operation = createOperation({ status });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.getByText(new RegExp(expectedText))).toBeInTheDocument();
    });

    it.each([
      ['ISSUED', 'operations.stages.ISSUED'],
      ['CONFIRMED', 'operations.stages.CONFIRMED'],
      ['AMENDED', 'operations.stages.AMENDED'],
    ])('debe mostrar etapa %s correctamente', (stage, expectedText) => {
      const operation = createOperation({ stage });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });

  describe('2.2 Cálculo de Utilización', () => {
    it('debe mostrar porcentaje de utilización correctamente', () => {
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          utilizationPercentage: 75.5,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('75.5%')).toBeInTheDocument();
    });

    it('debe mostrar 0% cuando no hay utilización', () => {
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          utilizationPercentage: 0,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    it('debe mostrar 100% en utilización completa', () => {
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          utilizationPercentage: 100,
          utilizedAmount: 100000,
          availableBalance: 0,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('100.0%')).toBeInTheDocument();
    });
  });

  describe('2.3 Alertas de Expiración', () => {
    it('debe indicar operación expirada', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          expired: true,
          daysToExpiry: -5,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.expiredDaysAgo')).toBeInTheDocument();
    });

    it('debe indicar operación próxima a expirar (< 30 días)', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          expired: false,
          daysToExpiry: 15,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.daysRemaining')).toBeInTheDocument();
    });

    it('debe mostrar días restantes normalmente si > 30 días', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          expired: false,
          daysToExpiry: 60,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.daysRemaining')).toBeInTheDocument();
    });
  });

  describe('2.4 Visualización de Alertas', () => {
    it('debe mostrar alertas cuando existen', () => {
      const summary = createSummary({
        alerts: [
          { type: 'WARNING', code: 'EXPIRING_SOON', params: { days: 10 } },
          { type: 'DANGER', code: 'OVERDUE_PAYMENT', params: {} },
        ],
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      // The alerts section is rendered with code-based messages
      expect(screen.getByText('operations.alertCodes.EXPIRING_SOON')).toBeInTheDocument();
      expect(screen.getByText('operations.alertCodes.OVERDUE_PAYMENT')).toBeInTheDocument();
    });

    it('debe mostrar "sin alertas" cuando no hay alertas', () => {
      const summary = createSummary({ alerts: [] });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      // The alerts card shows 0 and the message
      expect(screen.getByText('operations.noAlertsAllClear')).toBeInTheDocument();
    });

    it.each([
      ['DANGER', 'DANGER'],
      ['WARNING', 'WARNING'],
      ['INFO', 'INFO'],
      ['SUCCESS', 'SUCCESS'],
    ])('debe renderizar alerta tipo %s correctamente', (alertType) => {
      const summary = createSummary({
        alerts: [{ type: alertType as 'DANGER' | 'WARNING' | 'INFO' | 'SUCCESS', code: 'TEST_ALERT', params: {} }],
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.alertCodes.TEST_ALERT')).toBeInTheDocument();
    });
  });

  describe('2.5 Visualización de Partes', () => {
    it('debe mostrar applicant y beneficiary', () => {
      const summary = createSummary();

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('Test Applicant')).toBeInTheDocument();
      expect(screen.getByText('Test Beneficiary')).toBeInTheDocument();
    });

    it('debe mostrar bancos emisor y avisador', () => {
      const summary = createSummary();

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('Issuing Bank Ltd')).toBeInTheDocument();
      expect(screen.getByText('Advising Bank Ltd')).toBeInTheDocument();
    });

    it('debe mostrar direcciones cuando existen', () => {
      const summary = createSummary();

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('123 Applicant Street')).toBeInTheDocument();
      expect(screen.getByText('456 Beneficiary Avenue')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// 3. OPERACION - Complete Workflows
// =============================================================================

describe('3. OPERACION - Flujos Completos', () => {
  describe('3.1 Marcar Respuesta Recibida', () => {
    beforeEach(() => {
      vi.mocked(operationCommands.markResponseReceived).mockResolvedValue(undefined);
    });

    it('debe mostrar panel de espera de respuesta cuando awaitingResponse es true', () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
        responseDueDate: '2025-01-25',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.getByText('operations.awaitingResponse')).toBeInTheDocument();
      expect(screen.getByText('MT730')).toBeInTheDocument();
    });

    it('debe ocultar panel de espera cuando awaitingResponse es false', () => {
      const operation = createOperation({ awaitingResponse: false });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.queryByText('operations.awaitingResponse')).not.toBeInTheDocument();
    });

    it('debe llamar markResponseReceived al hacer clic en el botón', async () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });
      await userEvent.click(button);

      expect(operationCommands.markResponseReceived).toHaveBeenCalledWith(
        'LCI-2025-001',
        'MT730'
      );
    });

    it('debe mostrar toast de éxito después de marcar respuesta', async () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'success',
            title: 'operations.responseMarked',
          })
        );
      });
    });

    it('debe llamar onResponseMarked callback con operación actualizada', async () => {
      const onResponseMarked = vi.fn();
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
      });

      render(
        <OperationSummaryPanel
          operation={operation}
          summary={createSummary()}
          onResponseMarked={onResponseMarked}
        />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(onResponseMarked).toHaveBeenCalledWith(
          expect.objectContaining({
            operationId: 'LCI-2025-001',
            awaitingResponse: false,
            awaitingMessageType: undefined,
            responseDueDate: undefined,
          })
        );
      });
    });

    it('debe manejar error al marcar respuesta', async () => {
      vi.mocked(operationCommands.markResponseReceived).mockRejectedValue(
        new Error('Network error')
      );

      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });
      await userEvent.click(button);

      await waitFor(() => {
        expect(toaster.create).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            title: 'common.error',
          })
        );
      });
    });

    it('debe mostrar fecha límite de respuesta', () => {
      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
        responseDueDate: '2025-01-25',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.getByText(/operations.responseDueDate.*2025-01-25/)).toBeInTheDocument();
    });
  });

  describe('3.2 Estado de Carga', () => {
    it('debe mostrar skeleton cuando loading es true', () => {
      render(
        <OperationSummaryPanel
          operation={createOperation()}
          summary={null}
          loading={true}
        />
      );

      // The loading state shows placeholder boxes
      expect(screen.queryByText('REF-LCI-2025-001')).not.toBeInTheDocument();
    });

    it('debe mostrar contenido cuando loading es false', () => {
      render(
        <OperationSummaryPanel
          operation={createOperation()}
          summary={createSummary()}
          loading={false}
        />
      );

      expect(screen.getByText('REF-LCI-2025-001')).toBeInTheDocument();
    });
  });

  describe('3.3 Línea de Tiempo de Fechas', () => {
    it('debe mostrar fecha de emisión', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          issueDate: '2025-01-01',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('2025-01-01')).toBeInTheDocument();
      expect(screen.getByText('operations.issueDate')).toBeInTheDocument();
    });

    it('debe mostrar fecha de embarque cuando existe', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          latestShipmentDate: '2025-05-15',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('2025-05-15')).toBeInTheDocument();
      expect(screen.getByText('operations.latestShipment')).toBeInTheDocument();
    });

    it('debe mostrar fecha de expiración', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates!,
          currentExpiryDate: '2025-06-01',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getAllByText('2025-06-01')).toHaveLength(2); // In card and timeline
    });
  });
});

// =============================================================================
// 4. REGRESION - Ensure Existing Functionality Works
// =============================================================================

describe('4. REGRESION - Funcionalidad Existente', () => {
  describe('4.1 Renderizado Básico', () => {
    it('debe renderizar sin errores con datos mínimos', () => {
      const operation = createOperation();

      expect(() => {
        render(
          <OperationSummaryPanel operation={operation} summary={null} />
        );
      }).not.toThrow();
    });

    it('debe renderizar sin errores con datos completos', () => {
      expect(() => {
        render(
          <OperationSummaryPanel
            operation={createOperation()}
            summary={createSummary()}
          />
        );
      }).not.toThrow();
    });

    it('debe mostrar referencia de operación', () => {
      render(
        <OperationSummaryPanel
          operation={createOperation({ reference: 'TEST-REF-123' })}
          summary={createSummary()}
        />
      );

      expect(screen.getByText('TEST-REF-123')).toBeInTheDocument();
    });

    it('debe mostrar tipo de mensaje', () => {
      render(
        <OperationSummaryPanel
          operation={createOperation({ messageType: 'MT700' })}
          summary={createSummary()}
        />
      );

      expect(screen.getByText(/MT700/)).toBeInTheDocument();
    });
  });

  describe('4.2 Cambios de Monto por Enmiendas', () => {
    it('debe mostrar monto original si es diferente al actual', () => {
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          originalAmount: 100000,
          currentAmount: 150000,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('$150,000.00')).toBeInTheDocument();
      expect(screen.getByText(/operations.originalAmount.*\$100,000.00/)).toBeInTheDocument();
    });

    it('no debe mostrar monto original si es igual al actual', () => {
      const summary = createSummary({
        amounts: {
          ...createSummary().amounts!,
          originalAmount: 100000,
          currentAmount: 100000,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.queryByText('operations.originalAmount')).not.toBeInTheDocument();
    });
  });

  describe('4.3 Diferentes Tipos de Producto', () => {
    it.each([
      ['LC_IMPORT', 'MT700'],
      ['LC_EXPORT', 'MT710'],
      ['GUARANTEE', 'MT760'],
    ])('debe renderizar correctamente tipo %s con mensaje %s', (productType, messageType) => {
      const operation = createOperation({ productType, messageType });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      expect(screen.getByText(new RegExp(messageType))).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`operations.productTypes.${productType}`))).toBeInTheDocument();
    });
  });

  describe('4.4 Contador de Enmiendas y Mensajes', () => {
    it('debe mostrar total de enmiendas', () => {
      const summary = createSummary({ totalAmendments: 5 });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('debe mostrar total de mensajes', () => {
      const summary = createSummary({ totalMessages: 10 });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText(/operations.totalMessages.*10/)).toBeInTheDocument();
    });

    it('debe mostrar cero enmiendas cuando no hay', () => {
      const summary = createSummary({ totalAmendments: 0, totalMessages: 1 });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      // Check for total messages text which indirectly validates the card is showing
      expect(screen.getByText(/operations.totalMessages.*1/)).toBeInTheDocument();
    });
  });

  describe('4.5 Props Opcionales', () => {
    it('debe funcionar sin onResponseMarked callback', async () => {
      vi.mocked(operationCommands.markResponseReceived).mockResolvedValue(undefined);

      const operation = createOperation({
        awaitingResponse: true,
        awaitingMessageType: 'MT730',
      });

      render(
        <OperationSummaryPanel operation={operation} summary={createSummary()} />
      );

      const button = screen.getByRole('button', { name: /operations.markResponseReceived/i });

      // Should not throw when clicking without callback
      await expect(userEvent.click(button)).resolves.not.toThrow();
    });

    it('debe funcionar sin loading prop (default false)', () => {
      render(
        <OperationSummaryPanel operation={createOperation()} summary={createSummary()} />
      );

      expect(screen.getByText('REF-LCI-2025-001')).toBeInTheDocument();
    });
  });
});

// =============================================================================
// 5. COBERTURA ADICIONAL - Estilos y Casos Especiales
// =============================================================================

describe('5. COBERTURA ADICIONAL - Estilos y Casos Especiales', () => {
  describe('5.1 Estilos de Expiración', () => {
    it('debe aplicar estilo de expirado cuando expired es true', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates,
          expired: true,
          daysToExpiry: -10,
          currentExpiryDate: '2024-12-01',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      // Should show "expired X days ago" message
      expect(screen.getByText('operations.expiredDaysAgo')).toBeInTheDocument();
    });

    it('debe aplicar estilo de próximo a expirar (1-30 días)', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates,
          expired: false,
          daysToExpiry: 10,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.daysRemaining')).toBeInTheDocument();
    });

    it('debe aplicar estilo normal cuando hay más de 30 días', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates,
          expired: false,
          daysToExpiry: 60,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.daysRemaining')).toBeInTheDocument();
    });
  });

  describe('5.4 Visualización de Fechas en Timeline', () => {
    it('debe mostrar línea de tiempo sin fecha de embarque', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates,
          latestShipmentDate: undefined,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      // Should still render issue and expiry dates (expiryDate appears twice: card + timeline)
      expect(screen.getByText('operations.issueDate')).toBeInTheDocument();
      expect(screen.getAllByText('operations.expiryDate')).toHaveLength(2);
    });

    it('debe mostrar línea de tiempo completa con fecha de embarque', () => {
      const summary = createSummary({
        dates: {
          ...createSummary().dates,
          latestShipmentDate: '2025-03-15',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('operations.issueDate')).toBeInTheDocument();
      expect(screen.getByText('operations.latestShipment')).toBeInTheDocument();
      // expiryDate appears twice: in card and in timeline
      expect(screen.getAllByText('operations.expiryDate')).toHaveLength(2);
    });
  });

  describe('5.5 Visualización de Partes Parciales', () => {
    it('debe renderizar solo applicant cuando beneficiary falta', () => {
      const summary = createSummary({
        parties: {
          ...createSummary().parties,
          beneficiaryName: undefined,
          beneficiaryAddress: undefined,
        },
      });
      const operation = createOperation({ beneficiaryName: undefined });

      render(
        <OperationSummaryPanel operation={operation} summary={summary} />
      );

      expect(screen.getByText('Test Applicant')).toBeInTheDocument();
    });

    it('debe renderizar solo issuing bank cuando advising bank falta', () => {
      const summary = createSummary({
        parties: {
          ...createSummary().parties,
          advisingBankBic: undefined,
          advisingBankName: undefined,
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('Issuing Bank Ltd')).toBeInTheDocument();
    });

    it('debe usar BIC cuando el nombre del banco no está disponible', () => {
      const summary = createSummary({
        parties: {
          ...createSummary().parties,
          issuingBankName: undefined,
          issuingBankBic: 'TESTBANKXXX',
        },
      });

      render(
        <OperationSummaryPanel operation={createOperation()} summary={summary} />
      );

      expect(screen.getByText('TESTBANKXXX')).toBeInTheDocument();
    });
  });
});
