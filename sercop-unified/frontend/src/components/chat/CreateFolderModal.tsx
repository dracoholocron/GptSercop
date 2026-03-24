/**
 * CreateFolderModal - Modal para crear una nueva carpeta
 * 
 * Features:
 * - Input para nombre de carpeta
 * - Validación de nombre único
 * - Integración con cmxChatService
 */

import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Portal,
  IconButton,
} from '@chakra-ui/react';
import { FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { cmxChatService } from '../../services/cmxChatService';

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFolderCreated: (folderName: string) => void;
  existingFolders?: string[];
}

export const CreateFolderModal = ({
  isOpen,
  onClose,
  onFolderCreated,
  existingFolders = [],
}: CreateFolderModalProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [folderName, setFolderName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!folderName.trim()) {
      setError('El nombre de la carpeta no puede estar vacío');
      return;
    }

    // Validar que el nombre no exista
    if (existingFolders.includes(folderName.trim())) {
      setError('Ya existe una carpeta con este nombre');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // No hay endpoint para crear carpetas directamente
      // Las carpetas se crean automáticamente al asignar folderName a una conversación
      // Por lo tanto, solo validamos y llamamos al callback
      onFolderCreated(folderName.trim());
      setFolderName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear carpeta');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFolderName('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Portal>
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.6)'}
        zIndex={9999}
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={4}
        onClick={handleClose}
      >
        <Box
          bg={isDark ? 'gray.800' : 'white'}
          borderRadius="xl"
          maxW="400px"
          w="100%"
          p={6}
          onClick={(e) => e.stopPropagation()}
          boxShadow="2xl"
          zIndex={10000}
          position="relative"
        >
          <HStack justify="space-between" align="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
              {t('ai.chat.newFolder')}
            </Text>
            <IconButton
              aria-label="Close"
              icon={<FiX />}
              size="sm"
              variant="ghost"
              onClick={handleClose}
            />
          </HStack>

          <VStack spacing={4} align="stretch">
            <Box>
              <Text fontSize="sm" color={colors.textColorSecondary} mb={2}>
                {t('ai.chat.folder')}
              </Text>
              <Input
                placeholder={t('ai.chat.folder')}
                value={folderName}
                onChange={(e) => {
                  setFolderName(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading) {
                    handleSubmit();
                  }
                }}
                bg={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
                borderColor={error ? 'red.500' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')}
                _focus={{
                  borderColor: colors.primaryColor,
                  boxShadow: `0 0 0 1px ${colors.primaryColor}`,
                }}
                autoFocus
              />
              {error && (
                <Text fontSize="xs" color="red.500" mt={1}>
                  {error}
                </Text>
              )}
            </Box>
          </VStack>

          <HStack justify="flex-end" spacing={2} mt={6}>
            <Button
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={loading}
              bg={colors.primaryColor}
              _hover={{ bg: colors.primaryColor, opacity: 0.9 }}
              color="white"
            >
              {t('common.create')}
            </Button>
          </HStack>
        </Box>
      </Box>
    </Portal>
  );
};

