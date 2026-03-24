import { Box, Heading, Text, VStack, Card, Spinner, Center, Flex, Badge, HStack } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { useSystemConfig } from '../../../contexts/SystemConfigContext';
import { cotizacionService, type Cotizacion } from '../../../services/exchangeRateService';
import type { IssuanceMode, SelectedEntities, PaymentScheduleItem } from '../types';
import type { AccountingEntry } from '../../../types/accounting';

interface AccountingSectionProps {
  mode: IssuanceMode;
  swiftFieldsData: Record<string, any>;
  selectedEntities: SelectedEntities;
  accountingEntry: AccountingEntry | null;
  loadingAccountingEntry: boolean;
  accountingEntryError: string | null;
  calculatedCommission: number;
  diasVigencia: number;
  isCommissionDeferred: boolean;
  setIsCommissionDeferred: (value: boolean) => void;
  paymentSchedule: PaymentScheduleItem[];
  setPaymentSchedule: (schedule: PaymentScheduleItem[]) => void;
  deferredPaymentsDialogOpen?: boolean;
  setDeferredPaymentsDialogOpen?: (open: boolean) => void;
  showHelp?: boolean;
}

/**
 * Sección de Contabilidad para Collections
 * Muestra el asiento contable generado
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
  showHelp = true,
}) => {
  const { localCurrency, requiresExchangeRate } = useSystemConfig();

  // Estado para cotización
  const [exchangeRate, setExchangeRate] = useState<Cotizacion | null>(null);
  const [loadingExchangeRate, setLoadingExchangeRate] = useState(false);

  // Obtener la moneda de la operación
  const operationCurrency = swiftFieldsData[':32B:']?.currency || swiftFieldsData[':32a:']?.currency || 'USD';
  const operationAmount = parseFloat(swiftFieldsData[':32B:']?.amount || swiftFieldsData[':32a:']?.amount || '0');
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

  return (
    <Box>
      <VStack align="stretch" gap={4} mb={6}>
        <Heading size="md" color="purple.600">
          Contabilidad
        </Heading>
        {showHelp && (
          <Text fontSize="sm" color="gray.600">
            Revise el asiento contable que se generará para esta cobranza.
          </Text>
        )}
      </VStack>

      {/* Mostrar cotización si la moneda es diferente a la local */}
      {needsExchangeRate && (
        <Box
          p={3}
          mb={4}
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
                {localEquivalent && operationAmount > 0 && (
                  <Flex justify="space-between" pt={1} borderTop="1px dashed" borderColor="blue.500/20">
                    <Text fontSize="sm" color="blue.700" fontWeight="semibold">
                      {operationCurrency} {operationAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} =
                    </Text>
                    <Text fontSize="sm" color="blue.800" fontWeight="bold">
                      {localCurrency} {localEquivalent.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </Text>
                  </Flex>
                )}
              </>
            )}

            {!exchangeRate && !loadingExchangeRate && (
              <Text fontSize="xs" color="orange.600">
                No se encontró cotización para {operationCurrency}. Configure en Catálogos → Tipos de Cambio.
              </Text>
            )}
          </VStack>
        </Box>
      )}

      <Card.Root>
        <Card.Body>
          {loadingAccountingEntry ? (
            <Center py={10}>
              <VStack gap={4}>
                <Spinner size="xl" color="purple.500" />
                <Text color="gray.600">Generando asiento contable...</Text>
              </VStack>
            </Center>
          ) : accountingEntryError ? (
            <Box p={4} bg="red.500/10" borderRadius="md">
              <Text color="red.600">{accountingEntryError}</Text>
            </Box>
          ) : accountingEntry ? (
            <VStack align="stretch" gap={4}>
              <Box>
                <Text fontWeight="bold" mb={2}>Asiento Contable</Text>
                <Box bg="gray.500/10" p={4} borderRadius="md">
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {JSON.stringify(accountingEntry, null, 2)}
                  </pre>
                </Box>
              </Box>
              {calculatedCommission > 0 && (
                <Box>
                  <Text fontWeight="bold" mb={2}>Comisión Calculada</Text>
                  <Text fontSize="lg" color="green.600">
                    ${calculatedCommission.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </Text>
                </Box>
              )}
            </VStack>
          ) : (
            <Center py={10}>
              <Text color="gray.500">
                Complete los campos requeridos para generar el asiento contable.
              </Text>
            </Center>
          )}
        </Card.Body>
      </Card.Root>
    </Box>
  );
};

export default AccountingSection;
