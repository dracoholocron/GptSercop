import { Box, VStack, Heading, Text, Card, Flex, Badge, HStack, Button, Progress, Table, Spinner } from '@chakra-ui/react';
import { FiInfo, FiTrendingUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';
import { cotizacionService, type Cotizacion } from '../../../services/exchangeRateService';
import { AccountingEntryViewer } from '../../accounting/AccountingEntryViewer';
import { DeferredCommissionDialog, type PaymentScheduleItem } from '../../DeferredCommissionDialog';
import type { IssuanceMode, SelectedEntities } from '../types';

interface AccountingSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  selectedEntities: SelectedEntities;

  // Contabilidad
  accountingEntry: any;
  loadingAccountingEntry: boolean;
  accountingEntryError: string | null;

  // Comisión
  calculatedCommission: number;
  diasVigencia: number;
  isCommissionDeferred: boolean;
  setIsCommissionDeferred: (value: boolean) => void;
  paymentSchedule: PaymentScheduleItem[];
  setPaymentSchedule: (schedule: PaymentScheduleItem[]) => void;

  // Dialog
  deferredPaymentsDialogOpen: boolean;
  setDeferredPaymentsDialogOpen: (open: boolean) => void;

  showHelp?: boolean;
}

/**
 * Sección de Asientos Contables para Garantías (Paso 6)
 * Muestra vista previa de asientos contables generados por Drools
 */
export const AccountingSection: React.FC<AccountingSectionProps> = ({
  mode,
  swiftFieldsData,
  selectedEntities,
  accountingEntry,
  loadingAccountingEntry,
  accountingEntryError,
  calculatedCommission,
  diasVigencia,
  isCommissionDeferred,
  setIsCommissionDeferred,
  paymentSchedule,
  setPaymentSchedule,
  deferredPaymentsDialogOpen,
  setDeferredPaymentsDialogOpen,
  showHelp = true,
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const { localCurrency, requiresExchangeRate } = useSystemConfig();

  // Estado para cotización
  const [exchangeRate, setExchangeRate] = useState<Cotizacion | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  // Obtener la moneda de la operación
  const operationCurrency = swiftFieldsData[':32B:']?.currency || 'USD';
  const operationAmount = parseFloat(swiftFieldsData[':32B:']?.amount || '0');
  const needsExchangeRate = requiresExchangeRate(operationCurrency);

  // Cargar cotización cuando la moneda es diferente a la local
  useEffect(() => {
    const loadExchangeRate = async () => {
      if (!needsExchangeRate || !operationCurrency) {
        setExchangeRate(null);
        return;
      }

      try {
        setLoadingExchangeRate(true);
        const cotizaciones = await cotizacionService.getCotizacionesByMoneda(operationCurrency);
        if (cotizaciones.length > 0) {
          const sortedCotizaciones = cotizaciones.sort(
            (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
          );
          setExchangeRate(sortedCotizaciones[0]);
        } else {
          setExchangeRate(null);
        }
      } catch (error) {
        console.error('Error loading exchange rate:', error);
        setExchangeRate(null);
      } finally {
        setLoadingExchangeRate(false);
      }
    };

    loadExchangeRate();
  }, [operationCurrency, needsExchangeRate]);

  // Calcular equivalente en moneda local
  const localEquivalent = exchangeRate && operationAmount > 0
    ? operationAmount * exchangeRate.valorVenta
    : null;

  const handleConfirmDeferment = (schedule: PaymentScheduleItem[]) => {
    setPaymentSchedule(schedule);
    setIsCommissionDeferred(true);
    setDeferredPaymentsDialogOpen(false);
  };

  const handleCancelDeferment = () => {
    setDeferredPaymentsDialogOpen(false);
  };

  return (
    <VStack gap={6} align="stretch">
      {mode === 'wizard' && (
        <Box>
          <Heading size="lg" color={colors.textColor} mb={2}>
            Paso 6: Asientos Contables
          </Heading>
          <Text color={colors.textColorSecondary} fontSize="sm">
            Vista previa de los asientos contables que se generarán para esta garantía
          </Text>
        </Box>
      )}

      {mode === 'expert' && (
        <Box pb={2} mb={4} borderBottom="1px solid" borderColor={colors.borderColor}>
          <Heading size="md" color={colors.textColor}>
            {t('lcImportWizard.steps.accounting', 'Asientos Contables')}
          </Heading>
        </Box>
      )}

      {/* Información de la operación */}
      <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
        <Card.Body p={4}>
          <VStack align="stretch" gap={3}>
            <Flex justify="space-between">
              <Text fontSize="sm" color={colors.textColorSecondary}>Producto:</Text>
              <Badge colorPalette="purple">MT760 - Garantía Bancaria</Badge>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="sm" color={colors.textColorSecondary}>Evento:</Text>
              <Badge colorPalette="teal">EMISSION_GUARANTEE</Badge>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="sm" color={colors.textColorSecondary}>Referencia:</Text>
              <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                {swiftFieldsData[':20:'] || 'N/A'}
              </Text>
            </Flex>
            <Flex justify="space-between">
              <Text fontSize="sm" color={colors.textColorSecondary}>Monto:</Text>
              <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                {operationCurrency} {operationAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Flex>

            {/* Mostrar cotización si la moneda es diferente a la local */}
            {needsExchangeRate && (
              <Box
                p={3}
                bg="blue.500/10"
                borderRadius="md"
                borderWidth={1}
                borderColor="blue.500/20"
              >
                <VStack align="stretch" gap={2}>
                  <Flex justify="space-between" align="center">
                    <HStack gap={2}>
                      <FiTrendingUp color="blue" />
                      <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                        Tipo de Cambio ({operationCurrency} → {localCurrency})
                      </Text>
                    </HStack>
                    {loadingExchangeRate ? (
                      <Spinner size="xs" color="blue.500" />
                    ) : exchangeRate ? (
                      <Badge colorPalette="blue">
                        1 {operationCurrency} = {exchangeRate.valorVenta.toFixed(4)} {localCurrency}
                      </Badge>
                    ) : (
                      <Badge colorPalette="orange">Sin cotización registrada</Badge>
                    )}
                  </Flex>

                  {exchangeRate && (
                    <>
                      <Flex justify="space-between">
                        <Text fontSize="xs" color="blue.600">Fecha cotización:</Text>
                        <Text fontSize="xs" color="blue.700" fontWeight="medium">
                          {new Date(exchangeRate.fecha).toLocaleDateString('es-MX')}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text fontSize="xs" color="blue.600">Compra / Venta:</Text>
                        <Text fontSize="xs" color="blue.700" fontWeight="medium">
                          {exchangeRate.valorCompra.toFixed(4)} / {exchangeRate.valorVenta.toFixed(4)}
                        </Text>
                      </Flex>
                      {localEquivalent && (
                        <Flex justify="space-between" pt={1} borderTop="1px dashed" borderColor="blue.500/20">
                          <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                            Equivalente en {localCurrency}:
                          </Text>
                          <Text fontSize="sm" color="blue.800" fontWeight="bold">
                            {localCurrency} {localEquivalent.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </Flex>
                      )}
                    </>
                  )}

                  {!exchangeRate && !loadingExchangeRate && (
                    <Text fontSize="xs" color="orange.600">
                      No se encontró cotización para {operationCurrency}. Configure las cotizaciones en Catálogos → Tipos de Cambio.
                    </Text>
                  )}
                </VStack>
              </Box>
            )}

            <Flex justify="space-between">
              <Text fontSize="sm" color={colors.textColorSecondary}>Días de Vigencia:</Text>
              <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                {diasVigencia > 0 ? `${diasVigencia} días` : 'Calculando...'}
              </Text>
            </Flex>
            <Box>
              <Flex justify="space-between" align="center" mb={2}>
                <Text fontSize="sm" color={colors.textColorSecondary}>Comisión:</Text>
                <HStack gap={2}>
                  <Text fontSize="sm" fontWeight="bold" color={calculatedCommission > 0 ? 'green.600' : 'orange.600'}>
                    {diasVigencia > 0 && calculatedCommission === 0
                      ? `${swiftFieldsData[':32B:']?.currency || 'USD'} 0.00 (sin configurar en Drools)`
                      : calculatedCommission > 0
                      ? `${swiftFieldsData[':32B:']?.currency || 'USD'} ${calculatedCommission.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'Calculando...'}
                  </Text>
                  {calculatedCommission > 0 && (
                    <Button
                      size="xs"
                      variant={isCommissionDeferred ? 'solid' : 'outline'}
                      colorPalette={isCommissionDeferred ? 'orange' : 'blue'}
                      onClick={() => {
                        if (isCommissionDeferred) {
                          setIsCommissionDeferred(false);
                          setPaymentSchedule([]);
                        } else {
                          setDeferredPaymentsDialogOpen(true);
                        }
                      }}
                    >
                      {isCommissionDeferred ? 'Cancelar Diferimiento' : 'Diferir'}
                    </Button>
                  )}
                </HStack>
              </Flex>
              {isCommissionDeferred && calculatedCommission > 0 && paymentSchedule.length > 0 && (
                <Box
                  p={3}
                  bg="orange.500/10"
                  borderRadius="md"
                  borderWidth={1}
                  borderColor="orange.500/30"
                >
                  <VStack align="stretch" gap={2}>
                    <Text fontSize="xs" color="orange.700" fontWeight="semibold">
                      Comisión Diferida - No se generará el asiento contable de comisión en este momento.
                    </Text>
                    <Text fontSize="xs" color="orange.700">
                      Plan de Pagos ({paymentSchedule.length} cuotas):
                    </Text>
                    <Box
                      maxH="150px"
                      overflowY="auto"
                      borderWidth={1}
                      borderColor="orange.500/30"
                      borderRadius="md"
                      bg={colors.bgColor}
                    >
                      <Table.Root size="xs">
                        <Table.Header>
                          <Table.Row bg="orange.500/15">
                            <Table.ColumnHeader fontSize="xs">#</Table.ColumnHeader>
                            <Table.ColumnHeader fontSize="xs">Fecha</Table.ColumnHeader>
                            <Table.ColumnHeader fontSize="xs" textAlign="right">Monto</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {paymentSchedule.map((payment) => (
                            <Table.Row key={payment.number}>
                              <Table.Cell fontSize="xs">{payment.number}</Table.Cell>
                              <Table.Cell fontSize="xs">{payment.date.toLocaleDateString('es-MX')}</Table.Cell>
                              <Table.Cell fontSize="xs" textAlign="right" fontWeight="medium">
                                {swiftFieldsData[':32B:']?.currency || 'USD'} {payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  </VStack>
                </Box>
              )}
            </Box>
          </VStack>
        </Card.Body>
      </Card.Root>

      {/* Mostrar estado de carga o error */}
      {loadingAccountingEntry && (
        <Card.Root bg={colors.bgColor} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={6}>
            <VStack gap={3}>
              <Text color={colors.textColor}>Generando asiento contable...</Text>
              <Progress.Root value={null} size="sm" colorPalette="purple" width="100%">
                <Progress.Track bg={colors.borderColor}>
                  <Progress.Range />
                </Progress.Track>
              </Progress.Root>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {accountingEntryError && (
        <Card.Root bg="red.500/10" border="1px" borderColor="red.500/40">
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color="red" />
              <Box>
                <Text fontWeight="semibold" color="red.700" fontSize="sm">
                  Error al Generar Asiento Contable
                </Text>
                <Text color="red.600" fontSize="xs" mt={1}>
                  {accountingEntryError}
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}

      {/* Mostrar componente de asiento contable si está disponible */}
      {accountingEntry && !loadingAccountingEntry && (
        <AccountingEntryViewer
          entry={accountingEntry}
          commissionAmount={calculatedCommission}
          commissionEvent={isCommissionDeferred ? 'DEFERRED_COMMISSION_GUARANTEE' : 'COMMISSION_CHARGE_GUARANTEE'}
        />
      )}

      {/* Mensaje informativo cuando no hay datos suficientes */}
      {!accountingEntry && !loadingAccountingEntry && !accountingEntryError && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color={colors.activeColor} />
              <Box>
                <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                  Información Requerida
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Para generar el asiento contable, asegúrese de haber completado:
                </Text>
                <VStack align="start" mt={2} gap={1}>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    • Referencia del remitente (Campo :20:)
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    • Moneda de la operación
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    • Monto de la garantía
                  </Text>
                </VStack>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}

      {/* Ayuda contextual */}
      {showHelp && mode !== 'expert' && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
          <Card.Body p={4}>
            <Flex gap={3}>
              <FiInfo size={20} color={colors.activeColor} />
              <Box>
                <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                  Asientos Contables Automáticos
                </Text>
                <Text color={colors.textColorSecondary} fontSize="xs" mt={1}>
                  Los asientos contables se generan automáticamente usando reglas Drools configuradas en el backend.
                  El asiento mostrado arriba es una vista previa que se guardará en estado DRAFT al crear la garantía.
                  Una vez aprobada la operación, el asiento puede ser contabilizado (POSTED).
                </Text>
              </Box>
            </Flex>
          </Card.Body>
        </Card.Root>
      )}

      {/* Diálogo de configuración de diferimiento */}
      <DeferredCommissionDialog
        open={deferredPaymentsDialogOpen}
        onClose={handleCancelDeferment}
        onConfirm={handleConfirmDeferment}
        commissionAmount={calculatedCommission}
        currency={swiftFieldsData[':32B:']?.currency || 'USD'}
      />
    </VStack>
  );
};

export default AccountingSection;
