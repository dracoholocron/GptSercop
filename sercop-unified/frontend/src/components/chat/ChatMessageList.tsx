/**
 * ChatMessageList - Componente para mostrar la lista de mensajes
 * 
 * Features:
 * - Scroll automático al último mensaje
 * - Diferentes estilos para mensajes de usuario y asistente
 * - Timestamps formateados
 * - Loading states
 */

import { useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Spinner,
  Avatar,
  Icon,
  Card,
} from '@chakra-ui/react';
import { FiUser, FiCpu } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';
import { AIChart } from '../ai/AICharts';
import type { Message, ChartMetadata } from '../../services/cmxChatService';

interface ChatMessageListProps {
  messages: Message[];
  loading?: boolean;
}

export const ChatMessageList = ({ messages, loading }: ChatMessageListProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const { brand } = useBrand();
  const colors = getColors();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll automático al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('common.justNow');
    if (diffMins < 60) return `${diffMins} ${t('common.minutesAgo')}`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} ${t('common.hoursAgo')}`;
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const userBg = isDark
    ? 'rgba(59, 130, 246, 0.2)'
    : 'rgba(59, 130, 246, 0.1)';

  const assistantBg = isDark
    ? 'rgba(255, 255, 255, 0.05)'
    : 'rgba(0, 0, 0, 0.02)';

  if (loading && messages.length === 0) {
    return (
      <Box
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack spacing={4}>
          <Spinner size="xl" color={colors.primaryColor} thickness="4px" />
          <Text color={colors.textColorSecondary}>{t('ai.chat.loading')}</Text>
        </VStack>
      </Box>
    );
  }

  if (messages.length === 0) {
    return (
      <Box
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p={8}
      >
        <VStack spacing={4}>
          <Text color={colors.textColorSecondary} fontSize="lg" textAlign="center">
            {t('ai.chat.startConversation')}
          </Text>
          <Text color={colors.textColorSecondary} fontSize="sm" textAlign="center">
            {t('ai.chat.messagePlaceholder')}
          </Text>
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      flex="1"
      overflowY="auto"
      p={4}
      bg={isDark ? 'rgba(13, 17, 28, 0.3)' : 'rgba(248, 250, 252, 0.5)'}
    >
      <VStack spacing={4} align="stretch">
        {messages.map((message) => {
          const isUser = message.role === 'USER';
          
          return (
            <HStack
              key={message.id}
              align="start"
              spacing={3}
              justify={isUser ? 'flex-end' : 'flex-start'}
              w="100%"
            >
              {!isUser && (
                <Avatar.Root
                  size="sm"
                  bg={colors.primaryColor}
                  color="white"
                >
                  <Avatar.Fallback>
                    <Icon as={FiCpu} color="white" />
                  </Avatar.Fallback>
                </Avatar.Root>
              )}

              <Box
                maxW="70%"
                p={3}
                borderRadius="lg"
                bg={isUser ? userBg : assistantBg}
                borderWidth="1px"
                borderColor={
                  isUser
                    ? colors.primaryColor + '40'
                    : isDark
                    ? 'rgba(255,255,255,0.1)'
                    : 'rgba(0,0,0,0.1)'
                }
                position="relative"
              >
                {/* Detectar si hay metadata con gráfico */}
                {!isUser && message.metadata && typeof message.metadata === 'object' && 
                 'chart' in message.metadata && message.metadata.chart ? (
                  <VStack spacing={3} align="stretch">
                    {/* Texto explicativo si existe */}
                    {'text' in message.metadata && message.metadata.text && (
                      <Text
                        color={colors.textColor}
                        fontSize="sm"
                        whiteSpace="pre-wrap"
                        wordBreak="break-word"
                      >
                        {message.metadata.text}
                      </Text>
                    )}
                    {/* Gráfico */}
                    <Card.Root>
                      <Card.Body>
                        <AIChart
                          data={(message.metadata.chart as any).data || []}
                          type={((message.metadata.chart as any).type || 'bar') as 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'horizontalBar'}
                          title={(message.metadata.chart as any).title}
                          colors={(message.metadata.chart as any).colors}
                          height={320}
                          showLegend={true}
                          showGrid={true}
                        />
                      </Card.Body>
                    </Card.Root>
                  </VStack>
                ) : (
                  <Text
                    color={colors.textColor}
                    fontSize="sm"
                    whiteSpace="pre-wrap"
                    wordBreak="break-word"
                  >
                    {message.content}
                  </Text>
                )}
                <Text
                  fontSize="xs"
                  color={colors.textColorSecondary}
                  mt={2}
                  textAlign={isUser ? 'right' : 'left'}
                >
                  {formatTime(message.createdAt)}
                </Text>
              </Box>

              {isUser && (
                <Avatar.Root
                  size="sm"
                  bg={colors.secondaryColor || colors.primaryColor}
                  color="white"
                >
                  <Avatar.Fallback>
                    <Icon as={FiUser} color="white" />
                  </Avatar.Fallback>
                </Avatar.Root>
              )}
            </HStack>
          );
        })}

        {loading && (
          <HStack align="start" spacing={3}>
            <Avatar.Root
              size="sm"
              bg={colors.primaryColor}
              color="white"
            >
              <Avatar.Fallback>
                <Icon as={FiCpu} color="white" />
              </Avatar.Fallback>
            </Avatar.Root>
            <Box
              p={3}
              borderRadius="lg"
              bg={assistantBg}
              borderWidth="1px"
              borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            >
              <HStack spacing={2}>
                <Spinner size="sm" color={colors.primaryColor} />
                <Text color={colors.textColorSecondary} fontSize="sm">
                  {t('ai.chat.sending')}
                </Text>
              </HStack>
            </Box>
          </HStack>
        )}

        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  );
};

