import { Button } from '@chakra-ui/react';
import { FiColumns, FiNavigation } from 'react-icons/fi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';

interface ModeToggleButtonProps {
  currentMode: 'wizard' | 'expert';
  targetPath: string;
}

/**
 * Botón toggle para cambiar entre modo Wizard y Expert.
 * Preserva query params (draft, mode, operation) al navegar.
 */
export const ModeToggleButton = ({ currentMode, targetPath }: ModeToggleButtonProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getColors } = useTheme();
  const colors = getColors();

  const isWizard = currentMode === 'wizard';
  const label = isWizard ? 'Modo Experto' : 'Modo Asistido';
  const Icon = isWizard ? FiColumns : FiNavigation;

  const handleToggle = () => {
    const params = searchParams.toString();
    navigate(params ? `${targetPath}?${params}` : targetPath);
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleToggle}
      color={colors.textColor}
      borderColor={colors.borderColor}
      _hover={{ bg: isWizard ? 'purple.500/10' : 'blue.500/10' }}
    >
      <Icon />
      {label}
    </Button>
  );
};
