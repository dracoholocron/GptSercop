/**
 * Dropdown component for selecting values from a custom catalog
 */
import { useState, useEffect } from 'react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { Spinner, Text, Box } from '@chakra-ui/react';
import { catalogoPersonalizadoService, type CatalogoPersonalizado } from '../services/customCatalogService';

interface CustomCatalogDropdownProps {
  catalogCode: string; // Código del catálogo padre (ej: "TIPO_REFERENCIA")
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showCode?: boolean; // Mostrar código en lugar de nombre como valor
}

export const CustomCatalogDropdown = ({
  catalogCode,
  value,
  onChange,
  placeholder = 'Seleccionar...',
  disabled = false,
  size = 'md',
  showCode = true,
}: CustomCatalogDropdownProps) => {
  const [options, setOptions] = useState<CatalogoPersonalizado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadOptions();
  }, [catalogCode]);

  const loadOptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await catalogoPersonalizadoService.getCatalogosByCodigoPadre(catalogCode);
      // Filter only active and sort by orden
      const activeOptions = data
        .filter(item => item.activo)
        .sort((a, b) => a.orden - b.orden);
      setOptions(activeOptions);
    } catch (err) {
      console.error('Error loading catalog options:', err);
      setError('Error al cargar opciones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Spinner size="sm" />
        <Text fontSize="sm" color="gray.500">Cargando...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Text fontSize="sm" color="red.500">{error}</Text>
    );
  }

  return (
    <NativeSelectRoot size={size}>
      <NativeSelectField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={showCode ? option.codigo : option.nombre}>
            {option.nombre}
          </option>
        ))}
      </NativeSelectField>
    </NativeSelectRoot>
  );
};

export default CustomCatalogDropdown;
