/**
 * CMXChat - Componente principal del Chat CMX
 * 
 * Features:
 * - Interfaz de chat completa con sidebar y área de mensajes
 * - Gestión de conversaciones
 * - Integración con OpenAI
 * - Brand templates y responsive design
 */

import { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  VStack,
  Text,
  Button,
  Spinner,
  Portal,
  IconButton,
  Input,
  Menu,
  Icon,
} from '@chakra-ui/react';
import { FiMessageSquare, FiX, FiDownload } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';
import { ChatSidebar } from './ChatSidebar';
import { ChatMessageList } from './ChatMessageList';
import { ChatInput } from './ChatInput';
import { useChatConversations } from '../../hooks/useChatConversations';
import { useChatMessages } from '../../hooks/useChatMessages';
import { cmxChatService, type Conversation, type AIContext, type Message } from '../../services/cmxChatService';

export const CMXChat = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const { brand } = useBrand();
  const colors = getColors();

  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [contexts, setContexts] = useState<AIContext[]>([]);
  const [loadingContexts, setLoadingContexts] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);

  const {
    conversations,
    loading: conversationsLoading,
    createConversation,
  } = useChatConversations();

  const {
    messages: hookMessages,
    loading: messagesLoading,
    sending: hookSending,
    error: messagesError,
    sendMessage,
    loadMessages,
  } = useChatMessages(selectedConversation?.id || null);

  // Usar mensajes del hook si hay conversación seleccionada, sino usar mensajes locales
  const messages = selectedConversation ? hookMessages : localMessages;
  const messagesLoadingState = selectedConversation ? messagesLoading : false;

  // Estado para el modal de nueva conversación
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const onNewConversationOpen = () => {
    console.log('[CMXChat] Setting modal open to true');
    setIsNewConversationOpen(true);
  };
  const onNewConversationClose = () => {
    console.log('[CMXChat] Setting modal open to false');
    setIsNewConversationOpen(false);
  };

  const [newConversationTitle, setNewConversationTitle] = useState('');
  const [newConversationContextId, setNewConversationContextId] = useState<number | undefined>();
  const [newConversationFolderName, setNewConversationFolderName] = useState<string | undefined>();
  const [folders, setFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);

  // Cargar contextos disponibles
  useEffect(() => {
    const loadContexts = async () => {
      try {
        setLoadingContexts(true);
        setContextError(null);
        console.log('[CMXChat] Loading contexts...');
        const data = await cmxChatService.getAvailableContexts();
        console.log('[CMXChat] Contexts loaded:', data);
        setContexts(data);
        if (data.length === 0) {
          console.warn('[CMXChat] No contexts available');
          setContextError('No hay contextos disponibles');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error al cargar contextos';
        setContextError(errorMsg);
        console.error('[CMXChat] Error loading contexts:', err);
      } finally {
        setLoadingContexts(false);
      }
    };

    loadContexts();
  }, []);

  // Cargar carpetas disponibles
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true);
        const folderList = await cmxChatService.getFolders();
        setFolders(folderList);
      } catch (err) {
        console.error('[CMXChat] Error loading folders:', err);
      } finally {
        setLoadingFolders(false);
      }
    };
    loadFolders();
  }, [conversations]);

  const handleNewConversation = () => {
    console.log('[CMXChat] Opening new conversation modal');
    console.log('[CMXChat] Available contexts:', contexts);
    console.log('[CMXChat] Current isOpen state:', isNewConversationOpen);
    setNewConversationTitle('');
    setNewConversationContextId(undefined);
    setNewConversationFolderName(undefined);
    setIsNewConversationOpen(true);
    console.log('[CMXChat] After setting state to true, new state:', isNewConversationOpen);
  };

  const handleCreateConversation = async () => {
    try {
      const newConv = await createConversation(
        newConversationTitle || undefined,
        newConversationContextId,
        newConversationFolderName || undefined
      );
      // Resetear estados al crear nueva conversación
      setSending(false);
      setLocalMessages([]);
      setSelectedConversation(newConv);
      onNewConversationClose();
    } catch (err) {
      console.error('Error creating conversation:', err);
      setSending(false);
    }
  };

  const handleSelectConversation = (conversation: Conversation) => {
    // Resetear estados al seleccionar una conversación diferente
    setSending(false);
    setLocalMessages([]);
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async (content: string) => {
    try {
      let conversationId = selectedConversation?.id;
      let newConv: Conversation | null = null;
      
      if (!conversationId) {
        // Si no hay conversación seleccionada, crear una nueva
        newConv = await createConversation();
        setSelectedConversation(newConv);
        conversationId = newConv.id;
        
        // Agregar mensaje del usuario inmediatamente (optimistic update)
        const tempUserMessageId = -Date.now();
        const userMessage: Message = {
          id: tempUserMessageId,
          conversationId: conversationId,
          role: 'USER',
          content,
          createdAt: new Date().toISOString(),
        };
        
        // Usar mensajes locales para nueva conversación
        setLocalMessages([userMessage]);
        setSending(true);
        
        // Enviar mensaje con streaming usando el servicio directamente
        let aiMessageContent = '';
        const tempAiMessageId = -Date.now() - 1;
        const tempAiMessage: Message = {
          id: tempAiMessageId,
          conversationId: conversationId,
          role: 'ASSISTANT',
          content: '',
          createdAt: new Date().toISOString(),
        };
        
        setLocalMessages([userMessage, tempAiMessage]);
        
        await cmxChatService.sendMessageStreaming(
          conversationId,
          content,
          (token) => {
            // Actualizar mensaje de IA con cada token
            aiMessageContent += token;
            setLocalMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === tempAiMessageId) {
                  return { ...msg, content: aiMessageContent };
                }
                return msg;
              });
            });
          },
          (messageId) => {
            // Stream completado
            setLocalMessages((prev) => {
              return prev.map((msg) => {
                if (msg.id === tempAiMessageId) {
                  return { ...msg, id: messageId, content: aiMessageContent };
                }
                return msg;
              });
            });
            setSending(false);
            
            // Recargar mensajes para mostrar el mensaje del usuario guardado en la BD
            setTimeout(() => {
              loadMessages();
            }, 500);
          },
          (error) => {
            console.error('Error sending message:', error);
            setSending(false);
            setLocalMessages((prev) => prev.filter((m) => m.id !== tempUserMessageId && m.id !== tempAiMessageId));
          }
        );
      } else {
        // Si ya hay conversación seleccionada, usar el hook
        await sendMessage(content);
        // Asegurar que sending se resetee después de enviar
        setSending(false);
      }
    } catch (err) {
      console.error('Error creating conversation or sending message:', err);
      setSending(false);
    }
  };

  const containerBg = isDark
    ? 'rgba(13, 17, 28, 0.95)'
    : 'rgba(255, 255, 255, 0.98)';

  return (
    <Box
      w="100%"
      h="100%"
      minH="calc(100vh - 200px)"
      display="flex"
      flexDirection="column"
      bg={containerBg}
      borderRadius="lg"
      overflow="hidden"
      boxShadow={isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'}
    >
      {/* Header */}
      <Box
        p={4}
        borderBottomWidth="1px"
        borderBottomColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
        bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      >
        <HStack justify="space-between" align="center">
          <HStack spacing={3}>
            <Box
              p={2}
              borderRadius="md"
              bg={colors.primaryColor + '20'}
              color={colors.primaryColor}
            >
              <FiMessageSquare size={20} />
            </Box>
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                {t('ai.chat.title')}
              </Text>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {selectedConversation?.title || t('ai.chat.subtitle')}
              </Text>
            </VStack>
          </HStack>
          <HStack spacing={2}>
            {selectedConversation?.contextName && (
              <Box
                px={3}
                py={1}
                borderRadius="full"
                bg={colors.primaryColor + '20'}
                borderWidth="1px"
                borderColor={colors.primaryColor + '40'}
              >
                <Text fontSize="xs" color={colors.primaryColor} fontWeight="medium">
                  {selectedConversation.contextName}
                </Text>
              </Box>
            )}
            {selectedConversation && (
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    aria-label="Exportar conversación"
                    icon={<FiDownload />}
                    variant="ghost"
                    size="sm"
                  />
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    bg={isDark ? 'gray.800' : 'white'}
                    borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    boxShadow="lg"
                    borderRadius="md"
                    py={1}
                    minW="150px"
                  >
                    <Menu.Item
                      onClick={async () => {
                        try {
                          const blob = await cmxChatService.exportConversation(selectedConversation.id, 'markdown');
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `conversation-${selectedConversation.id}.md`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error('Error exporting conversation:', err);
                        }
                      }}
                      color={colors.textColor}
                    >
                      <Text>Markdown (.md)</Text>
                    </Menu.Item>
                    <Menu.Item
                      onClick={async () => {
                        try {
                          const blob = await cmxChatService.exportConversation(selectedConversation.id, 'json');
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `conversation-${selectedConversation.id}.json`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error('Error exporting conversation:', err);
                        }
                      }}
                      color={colors.textColor}
                    >
                      <Text>JSON (.json)</Text>
                    </Menu.Item>
                    <Menu.Item
                      onClick={async () => {
                        try {
                          const blob = await cmxChatService.exportConversation(selectedConversation.id, 'pdf');
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `conversation-${selectedConversation.id}.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);
                        } catch (err) {
                          console.error('Error exporting conversation:', err);
                        }
                      }}
                      color={colors.textColor}
                    >
                      <Text>PDF (.pdf)</Text>
                    </Menu.Item>
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Main Content */}
      <HStack flex="1" spacing={0} align="stretch" overflow="hidden">
        {/* Sidebar */}
        <ChatSidebar
          selectedConversationId={selectedConversation?.id || null}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
        />

        {/* Chat Area */}
        <VStack flex="1" spacing={0} align="stretch" overflow="hidden">
          {messagesError && (
            <Box
              p={3}
              bg="red.50"
              borderBottomWidth="1px"
              borderBottomColor="red.200"
              color="red.700"
            >
              <Text fontSize="sm">{messagesError}</Text>
            </Box>
          )}

          {/* Messages */}
          <ChatMessageList messages={messages} loading={messagesLoadingState} />

          {/* Input */}
          <ChatInput
            onSend={handleSendMessage}
            disabled={false}
            sending={sending || hookSending}
          />
        </VStack>
      </HStack>

      {/* New Conversation Modal */}
      {isNewConversationOpen && (
        <Portal>
          {console.log('[CMXChat] Rendering modal, contexts:', contexts.length, 'isOpen:', isNewConversationOpen)}
          {(() => {
            console.log('[CMXChat] Portal content rendering');
            return null;
          })()}
          <Box
            id="new-conversation-modal-overlay"
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
            onClick={onNewConversationClose}
            style={{ pointerEvents: 'auto' }}
          >
            <Box
              id="new-conversation-modal-content"
              bg={isDark ? 'gray.800' : 'white'}
              borderRadius="xl"
              maxW="500px"
              w="100%"
              p={6}
              onClick={(e) => e.stopPropagation()}
              boxShadow="2xl"
              zIndex={10000}
              position="relative"
              style={{ pointerEvents: 'auto' }}
            >
              <HStack justify="space-between" align="center" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
                  {t('ai.chat.newConversation')}
                </Text>
                <IconButton
                  aria-label="Close"
                  icon={<FiX />}
                  size="sm"
                  variant="ghost"
                  onClick={onNewConversationClose}
                />
              </HStack>

              <VStack spacing={4} align="stretch">
                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {t('common.title')}
                  </Text>
                  <Input
                    value={newConversationTitle}
                    onChange={(e) => setNewConversationTitle(e.target.value)}
                    placeholder={t('ai.chat.newConversation')}
                    bg={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
                    borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                    _focus={{
                      borderColor: colors.primaryColor,
                      boxShadow: `0 0 0 1px ${colors.primaryColor}`,
                    }}
                  />
                </VStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {t('ai.chat.selectContext')}
                  </Text>
                  {/* Debug: Always show this to verify rendering */}
                  <Box 
                    p={2} 
                    bg="yellow.200" 
                    borderRadius="md"
                    borderWidth="2px"
                    borderColor="yellow.500"
                  >
                    <Text fontSize="xs" fontWeight="bold">
                      DEBUG: Contextos cargados: {contexts.length} | Loading: {loadingContexts ? 'Sí' : 'No'} | Error: {contextError || 'No'}
                    </Text>
                  </Box>
                  {loadingContexts ? (
                    <HStack spacing={2}>
                      <Spinner size="sm" />
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        Cargando contextos...
                      </Text>
                    </HStack>
                  ) : contextError ? (
                    <VStack align="start" spacing={1}>
                      <Text color="red.500" fontSize="sm">{contextError}</Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        Puedes crear la conversación sin contexto
                      </Text>
                    </VStack>
                  ) : contexts.length === 0 ? (
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      No hay contextos disponibles. Puedes crear la conversación sin contexto.
                    </Text>
                  ) : (
                    <>
                      <Text fontSize="xs" color="green.500" fontWeight="bold">
                        ✓ Renderizando selector con {contexts.length} contextos
                      </Text>
                      <Box
                        as="select"
                        value={newConversationContextId || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          console.log('[CMXChat] Context selected:', value);
                          setNewConversationContextId(
                            value ? Number(value) : undefined
                          );
                        }}
                        w="100%"
                        p={3}
                        borderRadius="md"
                        bg={isDark ? 'rgba(255,255,255,0.1)' : 'white'}
                        borderWidth="2px"
                        borderColor={isDark ? 'rgba(255,255,255,0.2)' : colors.primaryColor}
                        color={colors.textColor}
                        fontSize="sm"
                        fontWeight="medium"
                        cursor="pointer"
                        minH="44px"
                        display="block"
                        style={{
                          appearance: 'auto',
                          WebkitAppearance: 'menulist',
                          MozAppearance: 'menulist',
                        }}
                        _focus={{
                          borderColor: colors.primaryColor,
                          boxShadow: `0 0 0 3px ${colors.primaryColor}40`,
                          outline: 'none',
                        }}
                        _hover={{
                          borderColor: colors.primaryColor,
                          bg: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.02)',
                        }}
                      >
                        <option value="" style={{ 
                          color: colors.textColor,
                          backgroundColor: isDark ? '#1e293b' : 'white'
                        }}>
                          {t('ai.chat.selectContext')} (Opcional)
                        </option>
                        {contexts.map((context) => (
                          <option 
                            key={context.id} 
                            value={context.id}
                            style={{ 
                              color: colors.textColor,
                              backgroundColor: isDark ? '#1e293b' : 'white'
                            }}
                          >
                            {context.name}
                          </option>
                        ))}
                      </Box>
                      <Text 
                        fontSize="xs" 
                        color={colors.textColorSecondary} 
                        mt={1}
                      >
                        {contexts.length} contextos disponibles
                      </Text>
                    </>
                  )}
                </VStack>

                <VStack align="stretch" spacing={2}>
                  <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                    {t('ai.chat.folder')} (Opcional)
                  </Text>
                  <Box
                    as="select"
                    value={newConversationFolderName || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewConversationFolderName(value || undefined);
                    }}
                    w="100%"
                    p={3}
                    borderRadius="md"
                    bg={isDark ? 'rgba(255,255,255,0.1)' : 'white'}
                    borderWidth="1px"
                    borderColor={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
                    color={colors.textColor}
                    fontSize="sm"
                    cursor="pointer"
                    minH="44px"
                    _focus={{
                      borderColor: colors.primaryColor,
                      boxShadow: `0 0 0 1px ${colors.primaryColor}`,
                      outline: 'none',
                    }}
                  >
                    <option value="" style={{ 
                      color: colors.textColor,
                      backgroundColor: isDark ? '#1e293b' : 'white'
                    }}>
                      Sin carpeta
                    </option>
                    {folders.map((folder) => (
                      <option 
                        key={folder} 
                        value={folder}
                        style={{ 
                          color: colors.textColor,
                          backgroundColor: isDark ? '#1e293b' : 'white'
                        }}
                      >
                        {folder}
                      </option>
                    ))}
                  </Box>
                </VStack>

                <HStack justify="flex-end" spacing={3} mt={4}>
                  <Button variant="ghost" onClick={onNewConversationClose}>
                    {t('common.cancel')}
                  </Button>
                  <Button
                    colorScheme="blue"
                    bg={colors.primaryColor}
                    onClick={handleCreateConversation}
                    isDisabled={loadingContexts}
                  >
                    {t('common.create')}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
};

