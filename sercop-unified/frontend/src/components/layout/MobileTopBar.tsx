/**
 * MobileTopBar - Barra superior para dispositivos móviles
 *
 * Incluye:
 * - Logo "GlobalCX" (sin hamburger, el menu ahora está en bottom tab)
 * - Iconos de acciones (AI, Idioma, Dark Mode, Video, Alertas)
 */

import {
  Flex,
  HStack,
  Text,
  IconButton,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FiMoon,
  FiSun,
  FiGlobe,
  FiCpu,
  FiVideo,
} from 'react-icons/fi';
import GlobalAIExtractionModal from '../shared/GlobalAIExtractionModal';
import { AlertsWidget } from '../alerts/AlertsWidget';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

interface MobileTopBarProps {
  onMenuClick?: () => void;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, getColors } = useTheme();
  const colors = getColors();
  const [showAIExtractionModal, setShowAIExtractionModal] = useState(false);

  const changeLanguage = () => {
    i18n.changeLanguage(i18n.language === 'es' ? 'en' : 'es');
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      w="full"
      minH="56px"
      h="auto"
      px={3}
      py={2}
      bg={colors.cardBg}
      borderBottom="1px"
      borderColor={colors.borderColor}
      flexShrink={0}
      zIndex={100}
      boxShadow="sm"
      // Safe area para iPhone con notch - usar calc para incluir en la altura total
      pt="max(8px, env(safe-area-inset-top))"
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 8px))' }}
    >
      {/* Left - Logo only (hamburger removed, menu is now in bottom tab) */}
      <HStack spacing={2}>
        <Text
          fontSize="lg"
          fontWeight="bold"
          color={colors.primaryColor}
          letterSpacing="-0.5px"
        >
          GlobalCX
        </Text>
      </HStack>

      {/* Right - Actions */}
      <HStack spacing={1}>
        {/* AI Extraction */}
        <IconButton
          aria-label={t('topBar.aiExtraction', 'Extracción IA')}
          variant="ghost"
          size="sm"
          onClick={() => setShowAIExtractionModal(true)}
          bg={darkMode ? 'rgba(147, 51, 234, 0.15)' : 'rgba(147, 51, 234, 0.1)'}
          _hover={{
            bg: darkMode ? 'rgba(147, 51, 234, 0.25)' : 'rgba(147, 51, 234, 0.2)',
          }}
        >
          <FiCpu size={18} color={darkMode ? '#D6BCFA' : '#9333EA'} />
        </IconButton>

        {/* Language */}
        <IconButton
          aria-label="Cambiar idioma"
          variant="ghost"
          size="sm"
          onClick={changeLanguage}
          color={colors.textColor}
        >
          <HStack spacing={1}>
            <FiGlobe size={18} />
            <Text fontSize="xs" fontWeight="medium">
              {i18n.language === 'es' ? 'ES' : 'EN'}
            </Text>
          </HStack>
        </IconButton>

        {/* Dark Mode */}
        <IconButton
          aria-label="Modo oscuro"
          variant="ghost"
          size="sm"
          onClick={toggleDarkMode}
          color={colors.textColor}
        >
          {darkMode ? <FiSun size={18} color="#FCD34D" /> : <FiMoon size={18} />}
        </IconButton>

        {/* Video Conference */}
        <IconButton
          aria-label={t('videoConference.videoCall', 'Videollamada')}
          variant="ghost"
          size="sm"
          onClick={() => navigate('/video-conference')}
          color={darkMode ? '#6EE7B7' : '#10B981'}
          bg={darkMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)'}
          _hover={{
            bg: darkMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.15)',
          }}
        >
          <FiVideo size={18} />
        </IconButton>

        {/* Alerts - real-time from API */}
        <AlertsWidget refreshInterval={60000} />
      </HStack>

      {/* Global AI Extraction Modal */}
      <GlobalAIExtractionModal
        isOpen={showAIExtractionModal}
        onClose={() => setShowAIExtractionModal(false)}
      />
    </Flex>
  );
};

export default MobileTopBar;
