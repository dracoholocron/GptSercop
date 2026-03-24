import { Box, Grid, Input, Text, Flex } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { FiCalendar, FiMapPin } from 'react-icons/fi';

export interface DatePlaceValue {
  date: string;   // Formato ISO: YYYY-MM-DD
  place: string;  // Lugar de vencimiento (max 29 caracteres según SWIFT)
}

interface DatePlaceInputProps {
  value?: DatePlaceValue | string | null;
  onChange: (value: DatePlaceValue) => void;
  placeholder?: string;
  placePlaceholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxPlaceLength?: number;
  minDate?: string;
  maxDate?: string;
}

/**
 * Componente que combina selector de fecha + input de lugar
 * Para el campo SWIFT :31D: (Date and Place of Expiry)
 *
 * Formato SWIFT: 6!n29x = YYMMDD + hasta 29 caracteres de lugar
 * Ejemplo: "251231QUITO" = 31 Dic 2025, lugar: QUITO
 */
export const DatePlaceInput: React.FC<DatePlaceInputProps> = ({
  value,
  onChange,
  placeholder = 'Seleccione fecha',
  placePlaceholder = 'Lugar de vencimiento',
  required = false,
  disabled = false,
  maxPlaceLength = 29,
  minDate,
  maxDate,
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // Normalizar el valor (puede venir como string o como objeto)
  const normalizedValue: DatePlaceValue = typeof value === 'object' && value !== null
    ? { date: value.date || '', place: value.place || '' }
    : { date: '', place: '' };

  const handleDateChange = (date: string) => {
    onChange({
      date,
      place: normalizedValue.place,
    });
  };

  const handlePlaceChange = (place: string) => {
    // Limitar a maxPlaceLength caracteres
    const truncatedPlace = place.slice(0, maxPlaceLength);
    onChange({
      date: normalizedValue.date,
      place: truncatedPlace,
    });
  };

  // Formatear la fecha para mostrarla de manera legible
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box>
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
        {/* Campo de fecha */}
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <FiCalendar size={14} color={colors.textColorSecondary} />
            <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
              {t('common:datePlaceInput.date', 'Fecha de Vencimiento')}
            </Text>
          </Flex>
          <Input
            type="date"
            value={normalizedValue.date}
            onChange={(e) => handleDateChange(e.target.value)}
            placeholder={placeholder}
            min={minDate}
            max={maxDate}
            bg={colors.cardBg}
            borderColor={colors.borderColor}
            color={colors.textColor}
            required={required}
            disabled={disabled}
            _focus={{
              borderColor: colors.primaryColor,
              boxShadow: `0 0 0 1px ${colors.primaryColor}`,
            }}
          />
        </Box>

        {/* Campo de lugar */}
        <Box>
          <Flex align="center" gap={2} mb={1}>
            <FiMapPin size={14} color={colors.textColorSecondary} />
            <Text fontSize="xs" color={colors.textColorSecondary} fontWeight="medium">
              {t('common:datePlaceInput.place', 'Lugar')}
            </Text>
          </Flex>
          <Input
            type="text"
            value={normalizedValue.place}
            onChange={(e) => handlePlaceChange(e.target.value.toUpperCase())}
            placeholder={placePlaceholder}
            maxLength={maxPlaceLength}
            bg={colors.cardBg}
            borderColor={colors.borderColor}
            color={colors.textColor}
            required={required}
            disabled={disabled}
            textTransform="uppercase"
            _focus={{
              borderColor: colors.primaryColor,
              boxShadow: `0 0 0 1px ${colors.primaryColor}`,
            }}
          />
        </Box>
      </Grid>

      {/* Información adicional */}
      <Flex justify="space-between" mt={2} px={1}>
        {/* Vista previa de fecha formateada */}
        {normalizedValue.date && (
          <Text fontSize="xs" color={colors.textColorSecondary}>
            {formatDisplayDate(normalizedValue.date)}
          </Text>
        )}

        {/* Contador de caracteres del lugar */}
        <Text
          fontSize="xs"
          color={normalizedValue.place.length >= maxPlaceLength ? 'orange.500' : colors.textColorSecondary}
          ml="auto"
        >
          {normalizedValue.place.length}/{maxPlaceLength}
        </Text>
      </Flex>

      {/* Vista previa del formato SWIFT */}
      {(normalizedValue.date || normalizedValue.place) && (
        <Box
          mt={2}
          p={2}
          borderRadius="md"
          bg={isDark ? 'gray.700' : 'gray.100'}
          borderWidth="1px"
          borderColor={colors.borderColor}
        >
          <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
            {t('common:datePlaceInput.swiftPreview', 'Vista previa SWIFT')}:
          </Text>
          <Text fontSize="sm" fontFamily="mono" color={colors.textColor}>
            :31D:{formatSwiftDate(normalizedValue.date)}{normalizedValue.place}
          </Text>
        </Box>
      )}
    </Box>
  );
};

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato SWIFT (YYMMDD)
 */
function formatSwiftDate(isoDate: string): string {
  if (!isoDate) return '';
  try {
    const [year, month, day] = isoDate.split('-');
    // Tomar los últimos 2 dígitos del año
    const yy = year.slice(-2);
    return `${yy}${month}${day}`;
  } catch {
    return '';
  }
}

export default DatePlaceInput;
