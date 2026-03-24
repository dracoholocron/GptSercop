import {
  Box,
  Button,
  HStack,
  Input,
  Text,
  VStack,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogCloseTrigger,
  DialogBackdrop,
  Table,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { notify } from '../components/ui/toaster';

interface DeferredCommissionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (schedule: PaymentScheduleItem[]) => void;
  commissionAmount: number;
  currency: string;
}

export interface PaymentScheduleItem {
  number: number;
  date: Date;
  amount: number;
}

export const DeferredCommissionDialog: React.FC<DeferredCommissionDialogProps> = ({
  open,
  onClose,
  onConfirm,
  commissionAmount,
  currency
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, textColor, textColorSecondary, borderColor } = colors;

  const [numberOfPayments, setNumberOfPayments] = useState<string>('');
  const [paymentPeriodicity, setPaymentPeriodicity] = useState<string>('MONTHLY');
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentScheduleItem[]>([]);

  // Resetear estado cuando se cierra el diálogo
  useEffect(() => {
    console.log('DeferredCommissionDialog - open changed:', open);
    if (!open) {
      setNumberOfPayments('');
      setPaymentPeriodicity('MONTHLY');
      setPaymentSchedule([]);
    }
  }, [open]);

  const handleCalculateDeferredPayments = () => {
    const numPayments = parseInt(numberOfPayments);
    if (!numPayments || numPayments < 2) {
      return;
    }

    const paymentAmount = commissionAmount / numPayments;
    const today = new Date();
    const schedule: PaymentScheduleItem[] = [];

    for (let i = 0; i < numPayments; i++) {
      const paymentDate = new Date(today);

      // Calcular fecha según periodicidad
      if (paymentPeriodicity === 'MONTHLY') {
        paymentDate.setMonth(today.getMonth() + i + 1);
      } else if (paymentPeriodicity === 'QUARTERLY') {
        paymentDate.setMonth(today.getMonth() + (i + 1) * 3);
      } else if (paymentPeriodicity === 'BIANNUAL') {
        paymentDate.setMonth(today.getMonth() + (i + 1) * 6);
      } else if (paymentPeriodicity === 'ANNUAL') {
        paymentDate.setFullYear(today.getFullYear() + i + 1);
      }

      schedule.push({
        number: i + 1,
        date: paymentDate,
        amount: paymentAmount
      });
    }

    setPaymentSchedule(schedule);
  };

  const handleConfirm = () => {
    if (paymentSchedule.length === 0) {
      notify.warning('Validación', 'Debe calcular el plan de pagos antes de confirmar');
      return;
    }

    onConfirm(paymentSchedule);
  };

  const handleCancel = () => {
    setNumberOfPayments('');
    setPaymentPeriodicity('MONTHLY');
    setPaymentSchedule([]);
    onClose();
  };

  return (
    <DialogRoot open={open} onOpenChange={(e) => !e.open && handleCancel()} lazyMount unmountOnExit>
      <DialogBackdrop />
      <DialogContent maxW="600px" maxH="90vh" display="flex" flexDirection="column" bg={bgColor} position="fixed" top="50%" left="50%" transform="translate(-50%, -50%)" zIndex={1500}>
        <DialogHeader flexShrink={0}>
          <DialogTitle color={textColor}>Configurar Diferimiento de Comisión</DialogTitle>
          <DialogCloseTrigger onClick={handleCancel} />
        </DialogHeader>

        <DialogBody pb={6} overflowY="auto" flex={1}>
          <VStack align="stretch" gap={4}>
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                Comisión Total a Diferir:
              </Text>
              <Text fontSize="lg" fontWeight="bold" color="green.600">
                {currency} {commissionAmount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                Número de Cuotas:
              </Text>
              <Input
                type="number"
                min="2"
                value={numberOfPayments}
                onChange={(e) => setNumberOfPayments(e.target.value)}
                placeholder="Ingrese el número de cuotas (mínimo 2)"
                bg={bgColor}
                borderColor={borderColor}
                color={textColor}
              />
            </Box>

            <Box>
              <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                Periodicidad:
              </Text>
              <NativeSelectRoot>
                <NativeSelectField
                  value={paymentPeriodicity}
                  onChange={(e) => setPaymentPeriodicity(e.target.value)}
                  bg={bgColor}
                  borderColor={borderColor}
                  color={textColor}
                >
                  <option value="MONTHLY">Mensual</option>
                  <option value="QUARTERLY">Trimestral</option>
                  <option value="BIANNUAL">Semestral</option>
                  <option value="ANNUAL">Anual</option>
                </NativeSelectField>
              </NativeSelectRoot>
            </Box>

            <Button
              colorScheme="blue"
              onClick={handleCalculateDeferredPayments}
              isDisabled={!numberOfPayments || parseInt(numberOfPayments) < 2}
            >
              Calcular Plan de Pagos
            </Button>

            {paymentSchedule.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" color={textColor} mb={2}>
                  Plan de Pagos:
                </Text>
                <Box
                  maxH="300px"
                  overflowY="auto"
                  borderWidth={1}
                  borderColor={borderColor}
                  borderRadius="md"
                >
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row bg={bgColor}>
                        <Table.ColumnHeader color={textColor}>#</Table.ColumnHeader>
                        <Table.ColumnHeader color={textColor}>Fecha de Pago</Table.ColumnHeader>
                        <Table.ColumnHeader color={textColor} textAlign="right">
                          Monto
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {paymentSchedule.map((payment) => (
                        <Table.Row key={payment.number}>
                          <Table.Cell color={textColorSecondary}>
                            {payment.number}
                          </Table.Cell>
                          <Table.Cell color={textColor}>
                            {payment.date.toLocaleDateString('es-MX')}
                          </Table.Cell>
                          <Table.Cell textAlign="right" color={textColor} fontWeight="medium">
                            {currency} {payment.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Box>
            )}
          </VStack>
        </DialogBody>

        <DialogFooter>
          <HStack gap={3} justify="flex-end">
            <Button variant="outline" onClick={handleCancel} colorScheme="gray">
              Cancelar
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleConfirm}
              isDisabled={paymentSchedule.length === 0}
            >
              Confirmar Diferimiento
            </Button>
          </HStack>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
};

export default DeferredCommissionDialog;
