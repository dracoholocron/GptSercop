import {
  Box,
  Input,
  VStack,
  HStack,
  Button,
  Text,
  Flex,
  IconButton,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiCalendar, FiPlus, FiX } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

interface DateSelectorProps {
  value: string; // Formato: YYYY-MM-DD
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string; // Formato: YYYY-MM-DD
  maxDate?: string; // Formato: YYYY-MM-DD
  required?: boolean;
}

export const DateSelector = ({
  value,
  onChange,
  label,
  placeholder = 'Seleccione una fecha',
  disabled = false,
  minDate,
  maxDate,
  required = false,
}: DateSelectorProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  const [daysToAdd, setDaysToAdd] = useState<string>('');
  const [showDaysInput, setShowDaysInput] = useState(false);

  // Estado local para el input - evita re-renders mientras el usuario escribe
  const [localValue, setLocalValue] = useState(value);

  // Sincronizar con el valor externo cuando cambia (ej: al usar botones)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Función para formatear fecha a YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Función para obtener la fecha actual
  const getCurrentDate = (): string => {
    return formatDate(new Date());
  };

  // Función para sumar días a la fecha actual
  const addDaysToCurrentDate = (days: number): string => {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + days);
    return formatDate(currentDate);
  };

  // Función para aplicar los días (positivos o negativos)
  const handleApplyDays = () => {
    const days = parseInt(daysToAdd);
    if (!isNaN(days)) {
      const newDate = addDaysToCurrentDate(days);
      onChange(newDate);
      setDaysToAdd('');
      setShowDaysInput(false);
    }
  };

  // Función para limpiar la fecha
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    setDaysToAdd('');
    setShowDaysInput(false);
  };

  // Función para establecer fecha de hoy
  const handleSetToday = () => {
    onChange(getCurrentDate());
    setShowDaysInput(false);
  };

  // Formatear la fecha para mostrarla de manera legible
  const formatDisplayDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Box width="100%">
      {label && (
        <Text fontWeight="semibold" color={colors.textColor} mb={2}>
          {label}
          {required && <Text as="span" color="red.500"> *</Text>}
        </Text>
      )}

      <VStack align="stretch" gap={2}>
        {/* Campo de fecha principal */}
        <HStack>
          <Box position="relative" flex={1}>
            <Input
              type="date"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              onBlur={(e) => {
                // Solo propagar el cambio cuando el usuario termine de editar
                if (e.target.value !== value) {
                  onChange(e.target.value);
                }
              }}
              placeholder={placeholder}
              disabled={disabled}
              min={minDate}
              max={maxDate}
              bg={colors.cardBg}
              borderColor={colors.borderColor}
              color={colors.textColor}
              size="lg"
              _focus={{
                borderColor: colors.primaryColor,
                boxShadow: `0 0 0 1px ${colors.primaryColor}`,
              }}
            />
          </Box>

          {/* Botón para mostrar input de días */}
          {!disabled && (
            <IconButton
              onClick={() => setShowDaysInput(!showDaysInput)}
              variant="outline"
              borderColor={colors.borderColor}
              color={colors.primaryColor}
              size="lg"
              aria-label="Sumar/Restar días"
              title="Sumar o restar días"
            >
              <FiPlus />
            </IconButton>
          )}

          {/* Botón para fecha de hoy */}
          {!disabled && (
            <Button
              onClick={handleSetToday}
              variant="outline"
              borderColor={colors.borderColor}
              color={colors.textColor}
              size="lg"
            >
              Hoy
            </Button>
          )}

          {/* Botón para limpiar */}
          {!disabled && localValue && (
            <IconButton
              onClick={handleClear}
              variant="outline"
              borderColor={colors.borderColor}
              color="red.500"
              size="lg"
              aria-label="Limpiar fecha"
            >
              <FiX />
            </IconButton>
          )}
        </HStack>

        {/* Panel para agregar días */}
        {showDaysInput && !disabled && (
          <Box
            p={4}
            borderRadius="md"
            borderWidth={1}
            borderColor={colors.borderColor}
            bg={colors.cardBg}
          >
            <VStack align="stretch" gap={3}>
              <Text fontSize="sm" fontWeight="semibold" color={colors.textColor}>
                Sumar o restar días a la fecha actual
              </Text>

              <HStack>
                <Input
                  type="number"
                  value={daysToAdd}
                  onChange={(e) => setDaysToAdd(e.target.value)}
                  placeholder="Días (+ para sumar, - para restar)"
                  bg={colors.bgColor}
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  size="md"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyDays();
                    }
                  }}
                />
                <Button
                  onClick={handleApplyDays}
                  bg={colors.primaryColor}
                  color="white"
                  size="md"
                  _hover={{ opacity: 0.8 }}
                  disabled={!daysToAdd || isNaN(parseInt(daysToAdd))}
                >
                  Aplicar
                </Button>
                <Button
                  onClick={() => {
                    setShowDaysInput(false);
                    setDaysToAdd('');
                  }}
                  variant="outline"
                  borderColor={colors.borderColor}
                  color={colors.textColor}
                  size="md"
                >
                  Cancelar
                </Button>
              </HStack>

              {/* Atajos rápidos */}
              <Box>
                <Text fontSize="xs" color={colors.textColorSecondary} mb={2}>
                  Atajos rápidos:
                </Text>
                <Flex gap={2} flexWrap="wrap">
                  {/* Restar días */}
                  {[-90, -60, -30, -15, -7].map((days) => (
                    <Button
                      key={days}
                      size="xs"
                      variant="outline"
                      borderColor={colors.borderColor}
                      color="red.500"
                      onClick={() => {
                        const newDate = addDaysToCurrentDate(days);
                        onChange(newDate);
                        setShowDaysInput(false);
                        setDaysToAdd('');
                      }}
                    >
                      {days} días
                    </Button>
                  ))}
                  {/* Sumar días */}
                  {[7, 15, 30, 60, 90].map((days) => (
                    <Button
                      key={days}
                      size="xs"
                      variant="outline"
                      borderColor={colors.borderColor}
                      color="green.500"
                      onClick={() => {
                        const newDate = addDaysToCurrentDate(days);
                        onChange(newDate);
                        setShowDaysInput(false);
                        setDaysToAdd('');
                      }}
                    >
                      +{days} días
                    </Button>
                  ))}
                </Flex>
              </Box>

              {/* Vista previa */}
              {daysToAdd && !isNaN(parseInt(daysToAdd)) && (
                <Box
                  p={3}
                  borderRadius="md"
                  bg={colors.activeBg}
                  borderWidth={1}
                  borderColor={colors.activeColor}
                >
                  <Text fontSize="xs" fontWeight="semibold" color={colors.textColor}>
                    Vista previa:
                  </Text>
                  <Text fontSize="sm" color={colors.textColor} mt={1}>
                    {formatDisplayDate(addDaysToCurrentDate(parseInt(daysToAdd)))}
                  </Text>
                </Box>
              )}
            </VStack>
          </Box>
        )}

        {/* Mostrar fecha seleccionada de manera legible - siempre visible para evitar layout shift */}
        {!showDaysInput && (
          <Flex
            align="center"
            gap={2}
            p={2}
            borderRadius="md"
            bg={localValue ? colors.activeBg : 'transparent'}
            minH="36px"
          >
            {localValue ? (
              <>
                <FiCalendar color={colors.activeColor} />
                <Text fontSize="sm" color={colors.textColor}>
                  {formatDisplayDate(localValue)}
                </Text>
              </>
            ) : (
              <Text fontSize="sm" color={colors.textColorSecondary} fontStyle="italic">
                {placeholder}
              </Text>
            )}
          </Flex>
        )}
      </VStack>
    </Box>
  );
};
