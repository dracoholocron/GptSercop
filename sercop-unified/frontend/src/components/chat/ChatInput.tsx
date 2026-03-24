/**
 * ChatInput - Componente para enviar mensajes
 * 
 * Features:
 * - Textarea con auto-resize
 * - Botón de envío
 * - Soporte para Enter (con Shift+Enter para nueva línea)
 * - Loading state mientras se envía
 */

import { useState, KeyboardEvent, useRef, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  Textarea,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { FiSend } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';

interface ChatInputProps {
  onSend: (message: string) => Promise<void>;
  disabled?: boolean;
  sending?: boolean;
}

export const ChatInput = ({ onSend, disabled, sending }: ChatInputProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || sending) return;

    // Guardar el mensaje antes de limpiar
    const messageToSend = trimmedMessage;
    // Limpiar el input inmediatamente para mejor UX
    setMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      await onSend(messageToSend);
    } catch (err) {
      console.error('Error sending message:', err);
      // Si hay error, no restaurar el mensaje para evitar confusión
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  return (
    <Box
      p={4}
      borderTopWidth="1px"
      borderTopColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
      bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
    >
      <HStack spacing={3} align="end">
        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('ai.chat.messagePlaceholder')}
          disabled={disabled || sending}
          minH="44px"
          maxH="200px"
          resize="none"
          bg={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
          borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
          _focus={{
            borderColor: colors.primaryColor,
            boxShadow: `0 0 0 1px ${colors.primaryColor}`,
          }}
          color={colors.textColor}
          _placeholder={{
            color: colors.textColorSecondary,
          }}
        />
        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <IconButton
              aria-label={t('ai.chat.send')}
              onClick={handleSend}
              disabled={!message.trim() || disabled || sending}
              isLoading={sending}
              colorScheme="blue"
              bg={colors.primaryColor}
              color="white"
              _hover={{
                bg: colors.primaryColor,
                opacity: 0.9,
              }}
              _disabled={{
                opacity: 0.5,
                cursor: 'not-allowed',
              }}
              size="lg"
            >
              <FiSend />
            </IconButton>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content
              bg={isDark ? 'gray.800' : 'gray.900'}
              color="white"
              px={3}
              py={2}
              borderRadius="md"
              fontSize="sm"
            >
              {t('ai.chat.send')}
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </HStack>
      <Box mt={2}>
        <Text fontSize="xs" color={colors.textColorSecondary} textAlign="right">
          {t('common.pressEnter')} {t('common.shiftEnter')}
        </Text>
      </Box>
    </Box>
  );
};

