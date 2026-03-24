import {
  Box,
  Input,
  Text,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface TolerancePercentageFieldProps {
  value: string; // Formato SWIFT: "NN/NN" (ej: "05/05")
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

/**
 * Componente para el campo :39A: Tolerancia Porcentual
 * Formato SWIFT: NN/NN (ej: 10/01 = +10% / -1%)
 * Input simple: el usuario escribe los números y el "/" se inserta automáticamente.
 * Solo emite onChange cuando el valor está completo (NN/NN) o al perder foco.
 */
export const TolerancePercentageField: React.FC<TolerancePercentageFieldProps> = ({
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
}) => {
  const { getColors } = useTheme();
  const colors = getColors();
  const [displayValue, setDisplayValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar valor externo → display
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      const strValue = String(value);
      if (strValue.includes('/')) {
        setDisplayValue(strValue);
      } else {
        const numValue = parseFloat(strValue);
        if (!isNaN(numValue)) {
          const pct = numValue < 1 ? Math.round(numValue * 100) : Math.round(numValue);
          const formatted = String(pct).padStart(2, '0').slice(-2);
          setDisplayValue(`${formatted}/${formatted}`);
        }
      }
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9/]/g, '');

    const parts = cleaned.split('/');
    if (parts.length > 2) return;

    const before = parts[0].slice(0, 2);
    const after = parts.length > 1 ? parts[1].slice(0, 2) : undefined;

    // Auto-insertar "/" después de 2 dígitos
    if (after === undefined && before.length === 2 && !raw.includes('/')) {
      if (raw.length > displayValue.length) {
        setDisplayValue(before + '/');
        return;
      }
    }

    const newDisplay = after !== undefined ? `${before}/${after}` : before;
    setDisplayValue(newDisplay);

    // Solo emitir onChange cuando el valor está completo: NN/NN (5 chars)
    if (before.length === 2 && after !== undefined && after.length === 2) {
      onChange(`${before}/${after}`);
    } else if (newDisplay === '') {
      onChange('');
    }
  };

  // Al perder foco: formatear y emitir valor final
  const handleBlur = () => {
    if (!displayValue) return;
    const parts = displayValue.split('/');
    const before = (parts[0] || '').padStart(2, '0').slice(-2);
    const after = (parts[1] || '').padStart(2, '0').slice(-2);
    const formatted = `${before}/${after}`;
    setDisplayValue(formatted);
    onChange(formatted);
  };

  return (
    <Box>
      <Input
        ref={inputRef}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder || '00/00'}
        maxLength={5}
        required={required}
        disabled={disabled || readOnly}
        readOnly={readOnly}
        inputMode="numeric"
      />
      <Text fontSize="xs" color={colors.textColorSecondary} mt={1}>
        +tolerancia / -tolerancia (ej: 10/01 = +10% / -1%)
      </Text>
    </Box>
  );
};

export default TolerancePercentageField;
