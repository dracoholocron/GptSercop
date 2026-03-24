import {
  Box,
  Text,
  Flex,
  Switch,
} from '@chakra-ui/react';
import { useTheme } from '../contexts/ThemeContext';

interface NotExceedingFieldProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Componente para el campo :39B: Monto Máximo del Crédito
 * Este campo indica si el monto del crédito no debe exceder el valor en :32B:
 * Cuando está activo, genera "NOT EXCEEDING" en el mensaje SWIFT
 */
export const NotExceedingField: React.FC<NotExceedingFieldProps> = ({
  value,
  onChange,
  required = false,
  disabled = false,
  readOnly = false,
}) => {
  const { getColors } = useTheme();
  const colors = getColors();

  // El valor es "NOT EXCEEDING" cuando está activo, vacío cuando no
  const isActive = value === 'NOT EXCEEDING';

  const handleToggle = () => {
    if (isActive) {
      onChange('');
    } else {
      onChange('NOT EXCEEDING');
    }
  };

  return (
    <Box>
      <Flex align="center" gap={4}>
        <Switch.Root
          checked={isActive}
          onCheckedChange={handleToggle}
          disabled={disabled || readOnly}
          colorPalette="blue"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Root>

        <Text
          fontSize="sm"
          color={isActive ? colors.activeColor : colors.textColorSecondary}
          fontWeight={isActive ? 'bold' : 'normal'}
        >
          {isActive ? 'El crédito NO EXCEDE el monto indicado' : 'Sin límite máximo'}
        </Text>
      </Flex>

      {/* Texto de ayuda */}
      <Text fontSize="xs" color={colors.textColorSecondary} mt={2}>
        Active esta opción si el monto de la carta de crédito no debe exceder el valor especificado en el campo Monto y Moneda (:32B:)
      </Text>

    </Box>
  );
};

export default NotExceedingField;
