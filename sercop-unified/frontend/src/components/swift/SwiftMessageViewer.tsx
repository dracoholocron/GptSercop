import {
  Box,
  Card,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  IconButton,
  Code,
  Flex,
} from '@chakra-ui/react';
import { FiCopy, FiDownload, FiInfo } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useMemo } from 'react';
import type { SwiftFieldConfig } from '../../types/swiftField';
import { buildSwiftMessage } from '../../utils/swiftMessageBuilder';
import { formatFieldValueForDisplay, extractAmountFromFieldValue, extractCurrencyFromFieldValue } from '../../utils/swiftMessageParser';

interface SwiftMessageViewerProps {
  /**
   * Tipo de mensaje SWIFT (e.g., MT700, MT760, MT799)
   */
  messageType: string;

  /**
   * Datos de los campos SWIFT en formato key-value
   * Las keys deben tener el formato ":XX:" o ":XXX:"
   */
  fields: Record<string, any>;

  /**
   * Título personalizado para el visor
   */
  title?: string;

  /**
   * Descripción personalizada
   */
  description?: string;

  /**
   * Mostrar badges informativos
   */
  showBadges?: boolean;

  /**
   * Permitir copiar el mensaje
   */
  allowCopy?: boolean;

  /**
   * Permitir descargar el mensaje
   */
  allowDownload?: boolean;

  /**
   * Información adicional para mostrar en badges
   */
  metadata?: {
    reference?: string;
    amount?: string;
    currency?: string;
    [key: string]: string | undefined;
  };

  /**
   * Configuración de campos SWIFT desde swift_field_config_readmodel
   * Se usa para obtener maxLineLength y otras reglas de formato
   */
  fieldConfigs?: SwiftFieldConfig[];
}

/**
 * Componente reutilizable para visualizar mensajes SWIFT formateados
 *
 * Este componente toma los campos dinámicos de un mensaje SWIFT y los
 * presenta en el formato estándar SWIFT con todas las tags y valores.
 *
 * Características:
 * - Formato estándar SWIFT con tags
 * - Monospace font para mejor legibilidad
 * - Copiado al portapapeles
 * - Descarga como archivo .txt
 * - Badges informativos
 * - Resaltado de sintaxis básico
 *
 * @example
 * ```tsx
 * <SwiftMessageViewer
 *   messageType="MT700"
 *   fields={swiftFieldsData}
 *   title="Mensaje SWIFT - Carta de Crédito"
 *   metadata={{
 *     reference: "LC-123456",
 *     amount: "100,000.00",
 *     currency: "USD"
 *   }}
 *   allowCopy
 *   allowDownload
 * />
 * ```
 */
export const SwiftMessageViewer: React.FC<SwiftMessageViewerProps> = ({
  messageType,
  fields,
  title,
  description,
  showBadges = true,
  allowCopy = true,
  allowDownload = true,
  metadata: providedMetadata = {},
  fieldConfigs = [],
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const { bgColor, borderColor, textColor, textColorSecondary } = colors;

  const [copied, setCopied] = useState(false);

  // Auto-extraer metadata desde los campos usando fieldConfigs
  // Busca campos por sectionCode o caracteristicas para determinar reference, amount, currency
  const metadata = useMemo(() => {
    // Si se proporcionó metadata explícita, usarla
    if (providedMetadata.reference || providedMetadata.amount || providedMetadata.currency) {
      return providedMetadata;
    }

    // Extraer automáticamente desde fields usando fieldConfigs
    const extracted: Record<string, string | undefined> = {};

    // Buscar campo de referencia (generalmente el primero con fieldCode que empiece con :20)
    const referenceConfig = fieldConfigs.find(c =>
      c.fieldCode.startsWith(':20') ||
      c.sectionCode === 'REFERENCIA' ||
      c.fieldNameKey?.toLowerCase().includes('reference')
    );
    if (referenceConfig && fields[referenceConfig.fieldCode]) {
      extracted.reference = formatFieldValueForDisplay(fields[referenceConfig.fieldCode]);
    }

    // Buscar campo de monto/moneda (componentType CURRENCY_AMOUNT o similar)
    const amountConfig = fieldConfigs.find(c =>
      c.componentType === 'CURRENCY_AMOUNT' ||
      c.componentType === 'CURRENCY_AMOUNT_INPUT' ||
      c.fieldCode.startsWith(':32B')
    );
    if (amountConfig && fields[amountConfig.fieldCode]) {
      const amountValue = fields[amountConfig.fieldCode];
      const amount = extractAmountFromFieldValue(amountValue);
      const currency = extractCurrencyFromFieldValue(amountValue);
      if (amount > 0) {
        extracted.amount = amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      }
      if (currency) {
        extracted.currency = currency;
      }
    }

    return { ...extracted, ...providedMetadata };
  }, [fields, fieldConfigs, providedMetadata]);

  // NOTA: Las funciones de formateo locales (formatValue, formatSwiftDate, formatSwiftAmount,
  // formatMultilineText, getMaxLineLength, configByFieldCode) fueron eliminadas.
  // Todo el formateo se delega al builder centralizado (buildSwiftMessage)
  // que usa las reglas de swift_field_config_readmodel.

  /**
   * Genera el mensaje SWIFT formateado usando el servicio centralizado (buildSwiftMessage)
   *
   * IMPORTANTE: Todo el formateo de campos se delega al builder centralizado
   * que usa las reglas de swift_field_config_readmodel. No hay lógica de formateo
   * hardcodeada en este componente.
   */
  const generateSwiftMessage = (): string => {
    // Usar el builder centralizado que aplica todas las reglas de swift_field_config_readmodel
    const messageBody = buildSwiftMessage(fields, fieldConfigs);

    // Agregar header y footer SWIFT estándar
    const header = `{1:F01XXXXUS33AXXX0000000000}{2:I${messageType.replace('MT', '')}XXXXUS33AXXXN}{4:`;
    const footer = '-}';

    return `${header}\n${messageBody}\n${footer}`;
  };

  const swiftMessage = generateSwiftMessage();

  /**
   * Copia el mensaje al portapapeles
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(swiftMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  /**
   * Descarga el mensaje como archivo .txt
   */
  const handleDownload = () => {
    const blob = new Blob([swiftMessage], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${messageType}_${metadata.reference || Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <VStack align="stretch" gap={4}>
      {/* Header */}
      <Flex justify="space-between" align="start">
        <Box>
          <Heading size="lg" color={textColor} mb={2}>
            {title || `Mensaje ${messageType}`}
          </Heading>
          {description && (
            <Text color={textColorSecondary} fontSize="sm">
              {description}
            </Text>
          )}
        </Box>

        <HStack gap={2}>
          {allowCopy && (
            <IconButton
              aria-label="Copiar mensaje"
              onClick={handleCopy}
              size="sm"
              variant={copied ? 'solid' : 'outline'}
              colorPalette={copied ? 'green' : 'blue'}
              title={copied ? 'Copiado!' : 'Copiar mensaje'}
            >
              <FiCopy />
            </IconButton>
          )}

          {allowDownload && (
            <IconButton
              aria-label="Descargar mensaje"
              onClick={handleDownload}
              size="sm"
              variant="outline"
              colorPalette="blue"
              title="Descargar mensaje"
            >
              <FiDownload />
            </IconButton>
          )}
        </HStack>
      </Flex>

      {/* Badges informativos */}
      {showBadges && (
        <Card.Root bg={colors.activeBg} border="1px" borderColor={borderColor}>
          <Card.Body p={4}>
            <VStack align="stretch" gap={3}>
              <Flex justify="space-between" flexWrap="wrap" gap={2}>
                <HStack gap={2}>
                  <Text fontSize="sm" color={textColorSecondary}>Tipo de Mensaje:</Text>
                  <Badge colorScheme="blue" fontSize="sm">{messageType}</Badge>
                </HStack>

                {metadata.reference && (
                  <HStack gap={2}>
                    <Text fontSize="sm" color={textColorSecondary}>Referencia:</Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {metadata.reference}
                    </Text>
                  </HStack>
                )}

                {metadata.amount && metadata.currency && (
                  <HStack gap={2}>
                    <Text fontSize="sm" color={textColorSecondary}>Monto:</Text>
                    <Text fontSize="sm" fontWeight="bold" color={textColor}>
                      {metadata.currency} {metadata.amount}
                    </Text>
                  </HStack>
                )}
              </Flex>

              {/* Metadata adicional */}
              {Object.entries(metadata)
                .filter(([key]) => !['reference', 'amount', 'currency'].includes(key))
                .map(([key, value]) => value && (
                  <Flex key={key} justify="space-between">
                    <Text fontSize="sm" color={textColorSecondary} textTransform="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </Text>
                    <Text fontSize="sm" fontWeight="medium" color={textColor}>
                      {value}
                    </Text>
                  </Flex>
                ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* Mensaje SWIFT formateado */}
      <Card.Root bg={bgColor} border="1px" borderColor={borderColor}>
        <Card.Body p={0}>
          <Box
            bg="gray.900"
            p={6}
            borderRadius="md"
            overflowX="auto"
            position="relative"
          >
            <Code
              display="block"
              whiteSpace="pre"
              fontFamily="'Courier New', Courier, monospace"
              fontSize="sm"
              color="green.300"
              bg="transparent"
              p={0}
            >
              {swiftMessage}
            </Code>
          </Box>
        </Card.Body>
      </Card.Root>

      {/* Información adicional */}
      <Card.Root bg="blue.50" border="1px" borderColor="blue.200">
        <Card.Body p={4}>
          <Flex gap={3} align="start">
            <Box color="blue.600" mt={0.5}>
              <FiInfo size={18} />
            </Box>
            <Box flex={1}>
              <Text fontSize="sm" color="blue.800" fontWeight="medium" mb={1}>
                Formato SWIFT Estándar
              </Text>
              <Text fontSize="xs" color="blue.700" mb={2}>
                Este mensaje ha sido generado en formato SWIFT estándar MT{messageType.replace('MT', '')}.
              </Text>
              <Text fontSize="xs" color="blue.600">
                <strong>Formato aplicado:</strong> Fechas en YYMMDD (6 dígitos), montos con coma decimal,
                campos de parte en 4 líneas x 35 caracteres máximo.
              </Text>
            </Box>
          </Flex>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};
