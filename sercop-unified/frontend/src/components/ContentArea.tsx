import {
  Box,
  Button,
  HStack,
  Input,
  VStack,
  Text,
  SimpleGrid,
  Flex,
  IconButton,
  Table,
} from '@chakra-ui/react';
import { InputGroup } from '@chakra-ui/react';
import { Badge } from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiMaximize2, FiMinimize2, FiChevronRight, FiChevronLeft, FiSend, FiX } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

interface SwiftMessageDetail {
  fecha: string;
  tipo: 'enviado' | 'recibido';
  bancoEmisor: string;
  contenido: string;
}

interface PendingRecord {
  id: string;
  title: string;
  status: 'pending' | 'completed';
  tipo: 'LC Importación' | 'LC Exportación' | 'Garantía';
  ordenante: string;
  beneficiario: string;
  fechaEmision: string;
  fechaVencimiento: string;
  moneda: string;
  valor: number;
  saldo: number;
  agencia: string;
  swiftMessagesSent: {
    [key: string]: number;
  };
  swiftMessagesReceived: {
    [key: string]: number;
  };
  swiftMessagesDetails: {
    [key: string]: SwiftMessageDetail[];
  };
}

const mockRecords: PendingRecord[] = [
  {
    id: '1',
    title: 'REF:LCI20250001',
    status: 'pending',
    tipo: 'LC Importación',
    ordenante: 'Importadora XYZ S.A.',
    beneficiario: 'Export Trading Ltd.',
    fechaEmision: '2025-10-15',
    fechaVencimiento: '2025-12-15',
    moneda: 'USD',
    valor: 125000.00,
    saldo: 125000.00,
    agencia: 'Centro',
    swiftMessagesSent: { MT700: 2, MT707: 1, MT710: 0, MT720: 3 },
    swiftMessagesReceived: { MT700: 1, MT707: 2, MT710: 1, MT720: 2 },
    swiftMessagesDetails: {
      MT700: [
        { fecha: '2025-10-15 10:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Emisión de LC por USD 125,000.00 a favor de Export Trading Ltd.' },
        { fecha: '2025-10-15 14:20', tipo: 'recibido', bancoEmisor: 'Global Banking Corp.', contenido: 'Confirmación de recepción LC Ref 001' },
        { fecha: '2025-10-16 09:15', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Envío de documentos adicionales requeridos' },
      ],
      MT707: [
        { fecha: '2025-10-17 11:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Enmienda: Extensión de fecha de embarque hasta 2025-11-30' },
        { fecha: '2025-10-17 15:45', tipo: 'recibido', bancoEmisor: 'Global Banking Corp.', contenido: 'Aceptación de enmienda MT707' },
        { fecha: '2025-10-18 10:30', tipo: 'recibido', bancoEmisor: 'Export Trading Ltd.', contenido: 'Confirmación de beneficiario sobre enmienda' },
      ],
      MT710: [
        { fecha: '2025-10-20 12:00', tipo: 'recibido', bancoEmisor: 'Global Banking Corp.', contenido: 'Notificación de discrepancias en documentos presentados' },
      ],
      MT720: [
        { fecha: '2025-10-14 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Transferencia de LC a banco corresponsal' },
        { fecha: '2025-10-14 16:30', tipo: 'recibido', bancoEmisor: 'Correspondent Bank Inc.', contenido: 'Confirmación de transferencia recibida' },
        { fecha: '2025-10-15 08:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Actualización de términos de transferencia' },
      ],
    },
  },
  {
    id: '2',
    title: 'REF:LCE20250001',
    status: 'pending',
    tipo: 'LC Exportación',
    ordenante: 'Global Bank Inc.',
    beneficiario: 'Exportadora ABC S.A.',
    fechaEmision: '2025-10-14',
    fechaVencimiento: '2025-11-30',
    moneda: 'EUR',
    valor: 85000.00,
    saldo: 85000.00,
    agencia: 'Norte',
    swiftMessagesSent: { MT700: 1, MT705: 2, MT730: 1, MT740: 0 },
    swiftMessagesReceived: { MT700: 3, MT705: 1, MT730: 2, MT740: 1 },
    swiftMessagesDetails: {
      MT700: [
        { fecha: '2025-10-14 08:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Aviso de LC exportación EUR 85,000' },
        { fecha: '2025-10-14 12:30', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Confirmación de LC de exportación' },
        { fecha: '2025-10-15 09:00', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Solicitud de documentos adicionales' },
        { fecha: '2025-10-16 10:00', tipo: 'recibido', bancoEmisor: 'Exportadora ABC S.A.', contenido: 'Notificación de preparación de embarque' },
      ],
      MT705: [
        { fecha: '2025-10-15 14:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Pre-aviso de LC de exportación' },
        { fecha: '2025-10-16 11:30', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Confirmación de pre-aviso recibido' },
        { fecha: '2025-10-17 08:45', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Actualización de condiciones de pre-aviso' },
      ],
      MT730: [
        { fecha: '2025-10-18 13:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Acuse de recibo de documentos' },
        { fecha: '2025-10-19 09:30', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Confirmación de recepción de documentos' },
        { fecha: '2025-10-20 14:15', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Validación final de documentación' },
      ],
      MT740: [
        { fecha: '2025-10-21 10:00', tipo: 'recibido', bancoEmisor: 'Global Bank Inc.', contenido: 'Autorización de reembolso' },
      ],
    },
  },
  {
    id: '3',
    title: 'REF:GAR20250001',
    status: 'completed',
    tipo: 'Garantía',
    ordenante: 'Constructora MNO Ltda.',
    beneficiario: 'Ministerio de Obras Públicas',
    fechaEmision: '2025-10-13',
    fechaVencimiento: '2026-10-13',
    moneda: 'USD',
    valor: 250000.00,
    saldo: 0.00,
    agencia: 'Sur',
    swiftMessagesSent: { MT760: 3, MT767: 2, MT768: 1 },
    swiftMessagesReceived: { MT760: 2, MT767: 3, MT768: 2 },
    swiftMessagesDetails: {
      MT760: [
        { fecha: '2025-10-13 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Emisión de garantía bancaria USD 250,000' },
        { fecha: '2025-10-13 15:30', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Confirmación de garantía recibida' },
        { fecha: '2025-10-14 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Envío de documentos de respaldo' },
        { fecha: '2025-10-15 11:00', tipo: 'recibido', bancoEmisor: 'Ministerio Obras Públicas', contenido: 'Aceptación de garantía' },
        { fecha: '2025-10-16 08:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Confirmación final de emisión' },
      ],
      MT767: [
        { fecha: '2025-11-20 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Enmienda de garantía: Extensión de plazo' },
        { fecha: '2025-11-20 16:45', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Acuse de recibo de enmienda' },
        { fecha: '2025-11-21 09:30', tipo: 'recibido', bancoEmisor: 'Ministerio Obras Públicas', contenido: 'Aceptación de enmienda' },
        { fecha: '2025-11-22 11:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Confirmación de enmienda procesada' },
        { fecha: '2025-11-23 14:00', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Confirmación final de enmienda' },
      ],
      MT768: [
        { fecha: '2026-10-12 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Notificación de vencimiento de garantía' },
        { fecha: '2026-10-12 15:30', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Confirmación de liberación de garantía' },
        { fecha: '2026-10-13 10:00', tipo: 'recibido', bancoEmisor: 'Ministerio Obras Públicas', contenido: 'Carta de no reclamo' },
      ],
    },
  },
  {
    id: '4',
    title: 'LC Importación Ref 004',
    status: 'pending',
    tipo: 'LC Importación',
    ordenante: 'Comercial PQR S.A.',
    beneficiario: 'International Suppliers Co.',
    fechaEmision: '2025-10-12',
    fechaVencimiento: '2025-12-31',
    moneda: 'USD',
    valor: 95000.00,
    saldo: 47500.00,
    agencia: 'Este',
    swiftMessagesSent: { MT700: 1, MT707: 0, MT710: 2, MT720: 1 },
    swiftMessagesReceived: { MT700: 2, MT707: 1, MT710: 1, MT720: 0 },
    swiftMessagesDetails: {
      MT700: [
        { fecha: '2025-10-12 11:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Emisión de LC importación USD 95,000' },
        { fecha: '2025-10-12 16:00', tipo: 'recibido', bancoEmisor: 'International Bank', contenido: 'Confirmación de recepción de LC' },
        { fecha: '2025-10-13 10:30', tipo: 'recibido', bancoEmisor: 'International Suppliers Co.', contenido: 'Aceptación de términos de LC' },
      ],
      MT707: [
        { fecha: '2025-10-18 14:00', tipo: 'recibido', bancoEmisor: 'International Bank', contenido: 'Solicitud de enmienda por beneficiario' },
      ],
      MT710: [
        { fecha: '2025-10-25 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Notificación de discrepancias en documentos' },
        { fecha: '2025-10-26 11:00', tipo: 'recibido', bancoEmisor: 'International Bank', contenido: 'Respuesta a notificación de discrepancias' },
        { fecha: '2025-10-27 15:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Solicitud de corrección de documentos' },
      ],
      MT720: [
        { fecha: '2025-10-11 13:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Transferencia de LC a banco notificador' },
      ],
    },
  },
  {
    id: '5',
    title: 'REF:LCE20250002',
    status: 'completed',
    tipo: 'LC Exportación',
    ordenante: 'Deutsche Bank AG',
    beneficiario: 'Agro Export S.A.',
    fechaEmision: '2025-10-11',
    fechaVencimiento: '2025-11-15',
    moneda: 'EUR',
    valor: 150000.00,
    saldo: 0.00,
    agencia: 'Centro',
    swiftMessagesSent: { MT700: 4, MT705: 3, MT730: 2, MT740: 1 },
    swiftMessagesReceived: { MT700: 3, MT705: 4, MT730: 3, MT740: 2 },
    swiftMessagesDetails: {
      MT700: [
        { fecha: '2025-10-11 08:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Aviso LC exportación EUR 150,000' },
        { fecha: '2025-10-11 13:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Confirmación de LC recibida' },
        { fecha: '2025-10-12 09:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Envío de documentos complementarios' },
        { fecha: '2025-10-12 15:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Acuse de documentos recibidos' },
        { fecha: '2025-10-13 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Confirmación de términos acordados' },
        { fecha: '2025-10-13 16:30', tipo: 'recibido', bancoEmisor: 'Agro Export S.A.', contenido: 'Notificación de preparación de embarque' },
        { fecha: '2025-10-14 11:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Autorización de embarque' },
      ],
      MT705: [
        { fecha: '2025-10-10 14:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Pre-aviso de LC EUR 150,000' },
        { fecha: '2025-10-10 18:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Confirmación de pre-aviso' },
        { fecha: '2025-10-11 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Actualización de pre-aviso' },
        { fecha: '2025-10-11 12:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Acuse de actualización' },
        { fecha: '2025-10-11 16:00', tipo: 'recibido', bancoEmisor: 'Agro Export S.A.', contenido: 'Confirmación de beneficiario' },
        { fecha: '2025-10-12 08:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Confirmación final de pre-aviso' },
        { fecha: '2025-10-12 14:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Aprobación de términos' },
      ],
      MT730: [
        { fecha: '2025-10-20 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Acuse de recibo de documentos' },
        { fecha: '2025-10-20 16:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Confirmación de documentos conformes' },
        { fecha: '2025-10-21 11:30', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Notificación de aceptación de documentos' },
        { fecha: '2025-10-22 09:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Autorización de pago' },
        { fecha: '2025-10-23 14:00', tipo: 'recibido', bancoEmisor: 'Agro Export S.A.', contenido: 'Confirmación de recepción de pago' },
      ],
      MT740: [
        { fecha: '2025-10-25 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Autorización de reembolso EUR 150,000' },
        { fecha: '2025-10-25 15:30', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Confirmación de reembolso procesado' },
        { fecha: '2025-10-26 11:00', tipo: 'recibido', bancoEmisor: 'Deutsche Bank AG', contenido: 'Comprobante de transferencia completada' },
      ],
    },
  },
  {
    id: '6',
    title: 'REF:GAR20250002',
    status: 'pending',
    tipo: 'Garantía',
    ordenante: 'Inmobiliaria DEF S.A.',
    beneficiario: 'Banco Nacional',
    fechaEmision: '2025-10-10',
    fechaVencimiento: '2026-04-10',
    moneda: 'USD',
    valor: 180000.00,
    saldo: 180000.00,
    agencia: 'Norte',
    swiftMessagesSent: { MT760: 1, MT767: 1, MT768: 2 },
    swiftMessagesReceived: { MT760: 0, MT767: 2, MT768: 1 },
    swiftMessagesDetails: {
      MT760: [
        { fecha: '2025-10-10 10:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Emisión de garantía bancaria USD 180,000' },
      ],
      MT767: [
        { fecha: '2025-11-15 11:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Enmienda: Modificación de términos de garantía' },
        { fecha: '2025-11-15 17:00', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Solicitud de aclaración sobre enmienda' },
        { fecha: '2025-11-16 10:30', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Aceptación de enmienda' },
      ],
      MT768: [
        { fecha: '2025-12-01 09:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Notificación de reducción de garantía a USD 90,000' },
        { fecha: '2025-12-20 14:00', tipo: 'enviado', bancoEmisor: 'Banco Internacional S.A.', contenido: 'Segunda reducción de garantía a USD 45,000' },
        { fecha: '2025-12-21 10:00', tipo: 'recibido', bancoEmisor: 'Banco Nacional', contenido: 'Confirmación de reducción procesada' },
      ],
    },
  },
];

export const ContentArea = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { getColors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [records, setRecords] = useState(mockRecords);
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [contractedRecords, setContractedRecords] = useState<Set<string>>(new Set());
  const [selectedSwiftMessage, setSelectedSwiftMessage] = useState<{ recordId: string; messageType: string } | null>(null);

  const colors = getColors();
  const { bgColor, borderColor, cardBg, textColor, textColorSecondary, primaryColor } = colors;

  const handleApplyFilters = () => {
    let filtered = mockRecords;

    if (searchTerm) {
      filtered = filtered.filter((record) =>
        record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.ordenante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.beneficiario.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((record) => record.status === statusFilter);
    }

    setRecords(filtered);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRecords(mockRecords);
  };

  const getStatusColor = (status: string) => {
    return status === 'pending' ? 'orange' : 'green';
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'LC Importación':
        return '#3B82F6'; // Blue
      case 'LC Exportación':
        return '#10B981'; // Green
      case 'Garantía':
        return '#F59E0B'; // Amber
      default:
        return '#6B7280'; // Gray
    }
  };

  const getTipoBorderColor = (tipo: string) => {
    switch (tipo) {
      case 'LC Importación':
        return '#2563EB'; // Darker Blue
      case 'LC Exportación':
        return '#059669'; // Darker Green
      case 'Garantía':
        return '#D97706'; // Darker Amber
      default:
        return '#4B5563'; // Darker Gray
    }
  };

  const getTipoBackgroundColor = (tipo: string) => {
    switch (tipo) {
      case 'LC Importación':
        return 'rgba(59, 130, 246, 0.08)'; // Light Blue background
      case 'LC Exportación':
        return 'rgba(16, 185, 129, 0.08)'; // Light Green background
      case 'Garantía':
        return 'rgba(245, 158, 11, 0.08)'; // Light Amber background
      default:
        return 'rgba(107, 114, 128, 0.08)'; // Light Gray background
    }
  };

  const handleToggleExpand = (recordId: string) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleToggleContract = (recordId: string) => {
    setContractedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const handleOpenSwiftMessage = (recordId: string, messageType: string) => {
    setSelectedSwiftMessage({ recordId, messageType });
  };

  const handleCloseSwiftMessage = () => {
    setSelectedSwiftMessage(null);
  };

  const selectedMessageData = useMemo(() => {
    if (!selectedSwiftMessage) {
      return null;
    }

    const record = records.find((r) => r.id === selectedSwiftMessage.recordId);
    if (!record) {
      return null;
    }

    const messages = record.swiftMessagesDetails[selectedSwiftMessage.messageType] || [];
    return {
      record,
      messageType: selectedSwiftMessage.messageType,
      messages,
    };
  }, [selectedSwiftMessage, records]);

  return (
    <Box flex={1} p={6}>
      <VStack spacing={6} align="stretch">
        {/* Filters Section */}
        <Box
          bg={bgColor}
          p={6}
          borderRadius="lg"
          border="1px"
          borderColor={borderColor}
          boxShadow="sm"
        >
          <VStack spacing={4} align="stretch">
            <Flex align="center" gap={2}>
              <FiFilter color={textColor} />
              <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                {t('filters.title')}
              </Text>
            </Flex>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <InputGroup startElement={<FiSearch color="gray" />}>
                <Input
                  placeholder={t('filters.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>

              <Box>
                <NativeSelectRoot>
                  <NativeSelectField
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('filters.all')}</option>
                    <option value="pending">{t('filters.pending')}</option>
                    <option value="completed">{t('filters.completed')}</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              <Input type="date" placeholder={t('filters.date')} />
            </SimpleGrid>

            <HStack spacing={3}>
              <Button
                bg={colors.primaryColor}
                color="white"
                leftIcon={<FiFilter />}
                onClick={handleApplyFilters}
                _hover={{
                  opacity: 0.8,
                }}
              >
                {t('filters.apply')}
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                borderColor={borderColor}
                color={textColor}
              >
                {t('filters.clear')}
              </Button>
            </HStack>
          </VStack>
        </Box>

        {/* Records Display */}
        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={4}>
          {records.map((record) => {
            const isContracted = contractedRecords.has(record.id);
            return (
              <Box key={record.id} position="relative">
                <Flex gap={2} position="relative">
                  {/* Action Buttons Sidebar - Shows when contracted */}
                  {isContracted && (
                    <VStack
                      spacing={2}
                      width="20%"
                      justify="center"
                      opacity={isContracted ? 1 : 0}
                      transform={isContracted ? 'translateX(0)' : 'translateX(-100%)'}
                      transition="all 0.3s ease-in-out"
                    >
                      <Button
                        size="sm"
                        width="100%"
                        variant="outline"
                        borderColor={getTipoColor(record.tipo)}
                        color={getTipoColor(record.tipo)}
                        _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                        onClick={() => {
                          if (record.tipo === 'LC Importación') {
                            navigate('/lc-importaciones/enmienda');
                          } else if (record.tipo === 'LC Exportación') {
                            navigate('/lc-exportacion/enmienda');
                          }
                        }}
                      >
                        Enmiendas
                      </Button>
                      <Button
                        size="sm"
                        width="100%"
                        variant="outline"
                        borderColor={getTipoColor(record.tipo)}
                        color={getTipoColor(record.tipo)}
                        _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                        onClick={() => {
                          if (record.tipo === 'LC Importación') {
                            navigate('/lc-importaciones/negociacion');
                          } else if (record.tipo === 'LC Exportación') {
                            navigate('/lc-exportacion/negociacion');
                          }
                        }}
                      >
                        Negociación
                      </Button>
                      <Button
                        size="sm"
                        width="100%"
                        variant="outline"
                        borderColor={getTipoColor(record.tipo)}
                        color={getTipoColor(record.tipo)}
                        _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                        onClick={() => {
                          if (record.tipo === 'LC Importación') {
                            navigate('/lc-importaciones/pago');
                          } else if (record.tipo === 'LC Exportación') {
                            navigate('/lc-exportacion/pago');
                          } else if (record.tipo === 'Garantía') {
                            navigate('/garantias/pago');
                          }
                        }}
                      >
                        Pago
                      </Button>
                      <Button
                        size="sm"
                        width="100%"
                        variant="outline"
                        borderColor={getTipoColor(record.tipo)}
                        color={getTipoColor(record.tipo)}
                        _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                        onClick={() => {
                          if (record.tipo === 'LC Importación') {
                            navigate('/lc-importaciones/reconocimiento');
                          } else if (record.tipo === 'LC Exportación') {
                            navigate('/lc-exportacion/reconocimiento');
                          } else if (record.tipo === 'Garantía') {
                            navigate('/garantias/reconocimiento');
                          }
                        }}
                      >
                        Reconocimiento
                      </Button>
                    </VStack>
                  )}

                  {/* Main Card */}
                  <Box
                    flex={1}
                    bg={getTipoBackgroundColor(record.tipo)}
                    p={5}
                    borderRadius="lg"
                    position="relative"
                    _hover={{
                      boxShadow: 'lg',
                      transform: 'translateY(-2px)',
                      bg: getTipoBackgroundColor(record.tipo),
                    }}
                    transform={isContracted ? 'translateX(0)' : 'translateX(0)'}
                    transition="all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)"
                    cursor="pointer"
                  >
                    <VStack align="stretch" spacing={3}>
                      {/* Header */}
                      <Flex justify="space-between" align="center">
                        <HStack spacing={2}>
                          <IconButton
                            size="sm"
                            borderRadius="full"
                            variant="outline"
                            borderColor={getTipoColor(record.tipo)}
                            color={getTipoColor(record.tipo)}
                            bg={bgColor}
                            _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                            onClick={() => handleToggleContract(record.id)}
                            aria-label={isContracted ? 'Expandir' : 'Contraer'}
                          >
                            {isContracted ? <FiChevronLeft /> : <FiChevronRight />}
                          </IconButton>
                          <Box
                            w="12px"
                            h="12px"
                            borderRadius="full"
                            bg={getTipoColor(record.tipo)}
                          />
                          <Text fontSize="lg" fontWeight="semibold" color={textColor}>
                            {record.title}
                          </Text>
                        </HStack>
                        <HStack spacing={2}>
                          <Badge
                            bg={getTipoColor(record.tipo)}
                            color="white"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {record.tipo}
                          </Badge>
                          <Badge colorScheme={getStatusColor(record.status)}>
                            {t(`filters.${record.status}`)}
                          </Badge>
                          <IconButton
                            size="sm"
                            borderRadius="full"
                            variant="outline"
                            borderColor={getTipoColor(record.tipo)}
                            color={getTipoColor(record.tipo)}
                            _hover={{ bg: getTipoBackgroundColor(record.tipo) }}
                            onClick={() => handleToggleExpand(record.id)}
                            aria-label={expandedRecords.has(record.id) ? 'Minimizar' : 'Expandir'}
                          >
                            {expandedRecords.has(record.id) ? <FiMinimize2 /> : <FiMaximize2 />}
                          </IconButton>
                        </HStack>
                      </Flex>

                      {/* Detalles */}
                      <SimpleGrid columns={2} spacing={2}>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Ordenante:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.ordenante}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Beneficiario:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.beneficiario}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Fecha Emisión:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.fechaEmision}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Fecha Vencimiento:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.fechaVencimiento}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Moneda:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.moneda}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Agencia:
                          </Text>
                          <Text fontSize="sm" color={textColor}>
                            {record.agencia}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Valor:
                          </Text>
                          <Text fontSize="sm" color={textColor} fontWeight="bold">
                            {record.moneda} {record.valor.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                            Saldo:
                          </Text>
                          <Text fontSize="sm" color={textColor} fontWeight="bold">
                            {record.moneda} {record.saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </Text>
                        </Box>
                      </SimpleGrid>

                      {/* Detalles Adicionales - Se muestra cuando está expandido */}
                      {expandedRecords.has(record.id) && (
                        <Box
                          mt={3}
                          pt={3}
                          borderTop="1px"
                          borderColor={borderColor}
                          maxH={expandedRecords.has(record.id) ? '500px' : '0'}
                          opacity={expandedRecords.has(record.id) ? 1 : 0}
                          overflow="hidden"
                          transition="all 0.3s ease-in-out"
                        >
                          <SimpleGrid columns={2} spacing={2}>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Banco Emisor:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Banco Internacional S.A.
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Banco Corresponsal:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Global Banking Corp.
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Tipo de Operación:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                {record.tipo}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Método de Pago:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Transferencia Bancaria
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                País de Origen:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Ecuador
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                País de Destino:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Estados Unidos
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Incoterm:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                FOB
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Puerto de Embarque:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Guayaquil
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Mercancía:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                Productos manufacturados
                              </Text>
                            </Box>
                            <Box>
                              <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                                Documentos Requeridos:
                              </Text>
                              <Text fontSize="sm" color={textColor}>
                                B/L, Factura, Certificado
                              </Text>
                            </Box>
                          </SimpleGrid>
                        </Box>
                      )}

                      {/* Franja de Mensajes SWIFT */}
                      <Box
                        mt={3}
                        width="100%"
                        bg={getTipoColor(record.tipo)}
                        p={2}
                        borderRadius="md"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                      >
                        {/* Icono SWIFT Alliance */}
                        <Flex align="center" gap={2} minW="fit-content">
                          <Box
                            bg="white"
                            borderRadius="md"
                            p={1.5}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <FiSend size={18} color={getTipoColor(record.tipo)} />
                          </Box>
                          <Text fontSize="xs" fontWeight="bold" color="white" display={{ base: 'none', md: 'block' }}>
                            SWIFT
                          </Text>
                        </Flex>

                        {/* Botones de Mensajes */}
                        <Flex gap={2} justify="center" flex={1}>
                          {record.tipo === 'LC Importación' && (
                            <>
                              <Box position="relative">
                                <Button
                                  size="xs"
                                  variant="solid"
                                  bg="white"
                                  color={getTipoColor(record.tipo)}
                                  _hover={{ opacity: 0.8 }}
                                  onClick={() => handleOpenSwiftMessage(record.id, 'MT700')}
                                >
                                  MT700
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT700}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT700}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button
                                  size="xs"
                                  variant="solid"
                                  bg="white"
                                  color={getTipoColor(record.tipo)}
                                  _hover={{ opacity: 0.8 }}
                                  onClick={() => handleOpenSwiftMessage(record.id, 'MT707')}
                                >
                                  MT707
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT707}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT707}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button
                                  size="xs"
                                  variant="solid"
                                  bg="white"
                                  color={getTipoColor(record.tipo)}
                                  _hover={{ opacity: 0.8 }}
                                  onClick={() => handleOpenSwiftMessage(record.id, 'MT710')}
                                >
                                  MT710
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT710}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT710}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button
                                  size="xs"
                                  variant="solid"
                                  bg="white"
                                  color={getTipoColor(record.tipo)}
                                  _hover={{ opacity: 0.8 }}
                                  onClick={() => handleOpenSwiftMessage(record.id, 'MT720')}
                                >
                                  MT720
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT720}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT720}
                                  </Text>
                                </Box>
                              </Box>
                            </>
                          )}
                          {record.tipo === 'LC Exportación' && (
                            <>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT700')}>
                                  MT700
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT700}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT700}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT705')}>
                                  MT705
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT705}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT705}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT730')}>
                                  MT730
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT730}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT730}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT740')}>
                                  MT740
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT740}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT740}
                                  </Text>
                                </Box>
                              </Box>
                            </>
                          )}
                          {record.tipo === 'Garantía' && (
                            <>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT760')}>
                                  MT760
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT760}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT760}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT767')}>
                                  MT767
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT767}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT767}
                                  </Text>
                                </Box>
                              </Box>
                              <Box position="relative">
                                <Button size="xs" variant="solid" bg="white" color={getTipoColor(record.tipo)} _hover={{ opacity: 0.8 }} onClick={() => handleOpenSwiftMessage(record.id, 'MT768')}>
                                  MT768
                                </Button>
                                <Box position="absolute" top="-6px" left="-6px" bg="gray.200" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesSent.MT768}
                                  </Text>
                                </Box>
                                <Box position="absolute" bottom="-6px" right="-6px" bg="white" border="2px solid" borderColor={getTipoColor(record.tipo)} borderRadius="full" minW="16px" minH="16px" display="flex" alignItems="center" justifyContent="center" pointerEvents="none">
                                  <Text fontSize="9px" fontWeight="bold" color={getTipoColor(record.tipo)}>
                                    {record.swiftMessagesReceived.MT768}
                                  </Text>
                                </Box>
                              </Box>
                            </>
                          )}
                        </Flex>
                      </Box>

                    </VStack>
                  </Box>
                </Flex>
              </Box>
            );
          })}
        </SimpleGrid>

        {records.length === 0 && (
          <Box textAlign="center" py={10}>
            <Text color={textColorSecondary}>No se encontraron registros</Text>
          </Box>
        )}
      </VStack>

      {/* Modal de Mensajes SWIFT */}
      {selectedSwiftMessage !== null && selectedMessageData && (
        <Box
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bg="rgba(0, 0, 0, 0.6)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
          onClick={handleCloseSwiftMessage}
        >
          <Box
            bg={cardBg}
            borderRadius="lg"
            boxShadow="2xl"
            maxW="900px"
            width="90%"
            maxH="85vh"
            overflow="hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={6} borderBottom="1px" borderColor={borderColor}>
              <Flex justify="space-between" align="center">
                <Text fontSize="xl" fontWeight="bold" color={textColor}>
                  Detalles del Mensaje {selectedMessageData.messageType}
                </Text>
                <IconButton
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseSwiftMessage}
                  aria-label="Cerrar"
                >
                  <FiX />
                </IconButton>
              </Flex>
            </Box>
            <Box p={6} overflowY="auto" maxH="calc(85vh - 80px)">
              <VStack spacing={4} align="stretch">
                {/* Información del Registro */}
                <Box p={4} bg={getTipoBackgroundColor(selectedMessageData.record.tipo)} borderRadius="md" border="1px" borderColor={borderColor}>
                  <SimpleGrid columns={2} spacing={3}>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                        Operación:
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {selectedMessageData.record.title}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                        Tipo:
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {selectedMessageData.record.tipo}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                        Ordenante:
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {selectedMessageData.record.ordenante}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="semibold" color={textColorSecondary}>
                        Beneficiario:
                      </Text>
                      <Text fontSize="sm" color={textColor}>
                        {selectedMessageData.record.beneficiario}
                      </Text>
                    </Box>
                  </SimpleGrid>
                </Box>

                {/* Tabla de Mensajes */}
                <Box overflowX="auto">
                  <Table.Root size="sm" variant="outline">
                    <Table.Header>
                      <Table.Row bg={bgColor}>
                        <Table.ColumnHeader color={textColor} fontWeight="bold">Fecha</Table.ColumnHeader>
                        <Table.ColumnHeader color={textColor} fontWeight="bold">Tipo</Table.ColumnHeader>
                        <Table.ColumnHeader color={textColor} fontWeight="bold">Banco Emisor</Table.ColumnHeader>
                        <Table.ColumnHeader color={textColor} fontWeight="bold">Contenido</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {selectedMessageData.messages.map((message, index) => (
                        <Table.Row key={index} _hover={{ bg: getTipoBackgroundColor(selectedMessageData.record.tipo) }}>
                          <Table.Cell color={textColor}>{message.fecha}</Table.Cell>
                          <Table.Cell>
                            <Badge colorScheme={message.tipo === 'enviado' ? 'blue' : 'green'}>
                              {message.tipo === 'enviado' ? 'Enviado' : 'Recibido'}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell color={textColor}>{message.bancoEmisor}</Table.Cell>
                          <Table.Cell color={textColor}>{message.contenido}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </VStack>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
