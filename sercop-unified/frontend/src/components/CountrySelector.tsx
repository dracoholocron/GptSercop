import React from 'react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';

interface CountrySelectorProps {
  value?: string;
  onChange: (country: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const COUNTRY_OPTIONS = [
  { code: 'EC', name: 'Ecuador' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'MX', name: 'Mexico' },
  { code: 'CO', name: 'Colombia' },
  { code: 'PE', name: 'Peru' },
  { code: 'CL', name: 'Chile' },
  { code: 'AR', name: 'Argentina' },
  { code: 'BR', name: 'Brasil' },
  { code: 'ES', name: 'Espana' },
];

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  placeholder = 'Seleccione un pais',
  disabled = false,
}) => {
  return (
    <NativeSelectRoot>
      <NativeSelectField
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {COUNTRY_OPTIONS.map((country) => (
          <option key={country.code} value={country.code}>
            {country.name}
          </option>
        ))}
      </NativeSelectField>
    </NativeSelectRoot>
  );
};

export default CountrySelector;
