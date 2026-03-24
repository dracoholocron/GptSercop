/**
 * ChatSidebar - Componente para mostrar la lista de conversaciones
 * 
 * Features:
 * - Lista de conversaciones del usuario
 * - Crear nueva conversación
 * - Filtros (favoritos, carpetas)
 * - Búsqueda de conversaciones
 * - Carpetas colapsables
 * - Mover conversaciones a carpetas
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Spinner,
  Badge,
  Menu,
  Collapsible,
} from '@chakra-ui/react';
import { FiMessageSquare, FiPlus, FiSearch, FiStar, FiMoreVertical, FiTrash2, FiFolder, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';
import { useChatConversations } from '../../hooks/useChatConversations';
import { cmxChatService } from '../../services/cmxChatService';
import { CreateFolderModal } from './CreateFolderModal';
import type { Conversation } from '../../services/cmxChatService';

interface ChatSidebarProps {
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
  onNewConversation: () => void;
}

export const ChatSidebar = ({
  selectedConversationId,
  onSelectConversation,
  onNewConversation,
}: ChatSidebarProps) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const { brand } = useBrand();
  const colors = getColors();

  const {
    conversations,
    loading,
    error,
    deleteConversation,
    toggleFavorite,
    updateFolder,
    loadConversations,
  } = useChatConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [folders, setFolders] = useState<string[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [moveToFolderConversation, setMoveToFolderConversation] = useState<Conversation | null>(null);

  // Cargar carpetas
  useEffect(() => {
    const loadFolders = async () => {
      try {
        setLoadingFolders(true);
        const folderList = await cmxChatService.getFolders();
        setFolders(folderList);
        // Expandir todas las carpetas por defecto
        setExpandedFolders(new Set(folderList));
      } catch (err) {
        console.error('Error loading folders:', err);
      } finally {
        setLoadingFolders(false);
      }
    };
    loadFolders();
  }, [conversations]);

  // Agrupar conversaciones por carpeta
  const conversationsByFolder = useMemo(() => {
    const grouped: Record<string, Conversation[]> = {};
    conversations.forEach(conv => {
      const folder = conv.folderName || 'Sin carpeta';
      if (!grouped[folder]) grouped[folder] = [];
      grouped[folder].push(conv);
    });
    return grouped;
  }, [conversations]);

  // Filtrar conversaciones
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'favorites' && conv.isFavorite);
    return matchesSearch && matchesFilter;
  });

  // Filtrar conversaciones por carpeta
  const getFilteredConversationsForFolder = (folderName: string) => {
    const folderConvs = conversationsByFolder[folderName] || [];
    return folderConvs.filter((conv) => {
      const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filter === 'all' || (filter === 'favorites' && conv.isFavorite);
      return matchesSearch && matchesFilter;
    });
  };

  const toggleFolder = (folderName: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderName)) {
        newSet.delete(folderName);
      } else {
        newSet.add(folderName);
      }
      return newSet;
    });
  };

  const handleFolderCreated = (folderName: string) => {
    setFolders(prev => [...prev, folderName].sort());
    setExpandedFolders(prev => new Set([...prev, folderName]));
  };

  const handleMoveToFolder = async (conversationId: number, folderName: string | null) => {
    try {
      await updateFolder(conversationId, folderName);
      setMoveToFolderConversation(null);
      // Recargar carpetas
      const folderList = await cmxChatService.getFolders();
      setFolders(folderList);
    } catch (err) {
      console.error('Error moving to folder:', err);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(t('ai.chat.deleteConfirm'))) {
      try {
        await deleteConversation(id);
      } catch (err) {
        console.error('Error deleting conversation:', err);
      }
    }
  };

  const handleToggleFavorite = async (id: number, isFavorite: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await toggleFavorite(id, !isFavorite);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const sidebarBg = isDark
    ? 'rgba(30, 41, 59, 0.8)'
    : 'rgba(255, 255, 255, 0.9)';

  return (
    <Box
      w="300px"
      h="100%"
      bg={sidebarBg}
      borderRightWidth="1px"
      borderRightColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box p={4} borderBottomWidth="1px" borderBottomColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}>
        <HStack justify="space-between" mb={3}>
          <Text fontSize="lg" fontWeight="bold" color={colors.textColor}>
            {t('ai.chat.conversations')}
          </Text>
          <Button
            leftIcon={<FiPlus />}
            size="sm"
            colorScheme="blue"
            onClick={(e) => {
              console.log('[ChatSidebar] Button clicked, calling onNewConversation');
              e.preventDefault();
              e.stopPropagation();
              onNewConversation();
            }}
            bg={colors.primaryColor}
            _hover={{ bg: colors.primaryColor, opacity: 0.9 }}
          >
            {t('ai.chat.newConversation')}
          </Button>
        </HStack>

        {/* Search */}
        <Box position="relative">
          <Box
            position="absolute"
            left="12px"
            top="50%"
            transform="translateY(-50%)"
            zIndex={1}
            pointerEvents="none"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <FiSearch size={16} style={{ color: colors.textColorSecondary }} />
          </Box>
          <Input
            pl="36px"
            size="sm"
            placeholder={t('common.search')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            bg={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'}
            borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
            _focus={{
              borderColor: colors.primaryColor,
              boxShadow: `0 0 0 1px ${colors.primaryColor}`,
            }}
          />
        </Box>

        {/* Filters */}
        <HStack mt={2} spacing={2}>
          <Button
            size="xs"
            variant={filter === 'all' ? 'solid' : 'ghost'}
            onClick={() => setFilter('all')}
            colorScheme="blue"
          >
            {t('common.all')}
          </Button>
          <Button
            size="xs"
            variant={filter === 'favorites' ? 'solid' : 'ghost'}
            onClick={() => setFilter('favorites')}
            leftIcon={<FiStar />}
            colorScheme="blue"
          >
            {t('ai.chat.favorite')}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setIsCreateFolderOpen(true)}
            leftIcon={<FiFolder />}
            colorScheme="blue"
          >
            {t('ai.chat.newFolder')}
          </Button>
        </HStack>
      </Box>

      {/* Conversations List */}
      <Box flex="1" overflowY="auto" p={2}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" h="200px">
            <Spinner size="md" color={colors.primaryColor} />
          </Box>
        ) : error ? (
          <Box p={4} textAlign="center">
            <Text color="red.500" fontSize="sm">{error}</Text>
          </Box>
        ) : (
          <VStack spacing={2} align="stretch">
            {/* Carpetas */}
            {Object.keys(conversationsByFolder).sort().map((folderName) => {
              const folderConvs = getFilteredConversationsForFolder(folderName);
              if (folderConvs.length === 0) return null;
              const isExpanded = expandedFolders.has(folderName);
              
              return (
                <Box key={folderName}>
                  <Collapsible.Root 
                    open={isExpanded} 
                    onOpenChange={(details) => {
                      // Ark UI pasa { open: boolean }
                      if (details.open !== isExpanded) {
                        toggleFolder(folderName);
                      }
                    }}
                  >
                    <Collapsible.Trigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        w="100%"
                        justifyContent="space-between"
                        _hover={{ bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                      >
                        <HStack spacing={2}>
                          {isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                          <FiFolder size={14} />
                          <Text fontSize="sm" fontWeight="medium" color={colors.textColor}>
                            {folderName}
                          </Text>
                          <Badge size="sm" colorScheme="blue" variant="subtle">
                            {folderConvs.length}
                          </Badge>
                        </HStack>
                      </Button>
                    </Collapsible.Trigger>
                    <Collapsible.Content>
                      <VStack spacing={1} align="stretch" pl={4} mt={1}>
                        {folderConvs.map((conversation) => (
                          <ConversationItem
                            key={conversation.id}
                            conversation={conversation}
                            selectedConversationId={selectedConversationId}
                            onSelectConversation={onSelectConversation}
                            onDelete={handleDelete}
                            onToggleFavorite={handleToggleFavorite}
                            onMoveToFolder={(conv) => setMoveToFolderConversation(conv)}
                            folders={folders}
                            colors={colors}
                            isDark={isDark}
                            t={t}
                          />
                        ))}
                      </VStack>
                    </Collapsible.Content>
                  </Collapsible.Root>
                </Box>
              );
            })}
            
            {/* Conversaciones sin carpeta (si hay búsqueda o filtro, mostrar todas) */}
            {!searchQuery && filter === 'all' && getFilteredConversationsForFolder('Sin carpeta').length > 0 && (
              <Box>
                <Collapsible.Root open={expandedFolders.has('Sin carpeta')} onOpenChange={() => toggleFolder('Sin carpeta')}>
                  <Collapsible.Trigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      w="100%"
                      justifyContent="space-between"
                      onClick={() => toggleFolder('Sin carpeta')}
                      _hover={{ bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    >
                      <HStack spacing={2}>
                        {expandedFolders.has('Sin carpeta') ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
                        <Text fontSize="sm" fontWeight="medium" color={colors.textColorSecondary}>
                          {t('ai.chat.emptyFolder')}
                        </Text>
                        <Badge size="sm" colorScheme="gray" variant="subtle">
                          {getFilteredConversationsForFolder('Sin carpeta').length}
                        </Badge>
                      </HStack>
                    </Button>
                  </Collapsible.Trigger>
                  <Collapsible.Content>
                    <VStack spacing={1} align="stretch" pl={4} mt={1}>
                      {getFilteredConversationsForFolder('Sin carpeta').map((conversation) => (
                        <ConversationItem
                          key={conversation.id}
                          conversation={conversation}
                          selectedConversationId={selectedConversationId}
                          onSelectConversation={onSelectConversation}
                          onDelete={handleDelete}
                          onToggleFavorite={handleToggleFavorite}
                          onMoveToFolder={(conv) => setMoveToFolderConversation(conv)}
                          folders={folders}
                          colors={colors}
                          isDark={isDark}
                          t={t}
                        />
                      ))}
                    </VStack>
                  </Collapsible.Content>
                </Collapsible.Root>
              </Box>
            )}
          </VStack>
        )}
      </Box>

      {/* Modal para crear carpeta */}
      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onFolderCreated={handleFolderCreated}
        existingFolders={folders}
      />

      {/* Modal para mover a carpeta */}
      {moveToFolderConversation && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.5)"
          zIndex={10000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onClick={() => setMoveToFolderConversation(null)}
        >
          <Box
            bg={isDark ? 'gray.800' : 'white'}
            borderRadius="lg"
            p={6}
            minW="300px"
            maxW="500px"
            onClick={(e) => e.stopPropagation()}
            boxShadow="2xl"
          >
            <Text fontSize="lg" fontWeight="bold" color={colors.textColor} mb={4}>
              {t('ai.chat.folder')}: {moveToFolderConversation.title}
            </Text>
            <VStack spacing={2} align="stretch">
              <Button
                variant={moveToFolderConversation.folderName === null || !moveToFolderConversation.folderName ? 'solid' : 'ghost'}
                onClick={() => handleMoveToFolder(moveToFolderConversation.id, null)}
                justifyContent="flex-start"
                colorScheme="blue"
              >
                {t('ai.chat.emptyFolder')}
              </Button>
              {folders.map((folder) => (
                <Button
                  key={folder}
                  variant={moveToFolderConversation.folderName === folder ? 'solid' : 'ghost'}
                  onClick={() => handleMoveToFolder(moveToFolderConversation.id, folder)}
                  justifyContent="flex-start"
                  leftIcon={<FiFolder />}
                  colorScheme="blue"
                >
                  {folder}
                </Button>
              ))}
            </VStack>
            <HStack justify="flex-end" mt={4}>
              <Button variant="ghost" onClick={() => setMoveToFolderConversation(null)}>
                {t('common.cancel')}
              </Button>
            </HStack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Componente para item de conversación
interface ConversationItemProps {
  conversation: Conversation;
  selectedConversationId: number | null;
  onSelectConversation: (conversation: Conversation) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onToggleFavorite: (id: number, isFavorite: boolean, e: React.MouseEvent) => void;
  onMoveToFolder: (conversation: Conversation) => void;
  folders: string[];
  colors: any;
  isDark: boolean;
  t: (key: string) => string;
}

const ConversationItem = ({
  conversation,
  selectedConversationId,
  onSelectConversation,
  onDelete,
  onToggleFavorite,
  onMoveToFolder,
  colors,
  isDark,
  t,
}: ConversationItemProps) => (
  <Box
    p={3}
    borderRadius="md"
    cursor="pointer"
    bg={
      selectedConversationId === conversation.id
        ? colors.primaryColor + '20'
        : 'transparent'
    }
    borderWidth={selectedConversationId === conversation.id ? '1px' : '0'}
    borderColor={colors.primaryColor}
    _hover={{
      bg: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    }}
    onClick={() => onSelectConversation(conversation)}
    position="relative"
  >
    <HStack justify="space-between" align="start">
      <VStack align="start" spacing={1} flex="1" minW={0}>
        <HStack spacing={2} w="100%">
          {conversation.isFavorite && (
            <FiStar size={14} style={{ color: colors.primaryColor, fill: colors.primaryColor }} />
          )}
          <Text
            fontSize="sm"
            fontWeight="medium"
            color={colors.textColor}
            noOfLines={1}
          >
            {conversation.title}
          </Text>
        </HStack>
        {conversation.lastMessagePreview && (
          <Text
            fontSize="xs"
            color={colors.textColorSecondary}
            noOfLines={1}
          >
            {conversation.lastMessagePreview}
          </Text>
        )}
        <HStack spacing={2}>
          <Text fontSize="xs" color={colors.textColorSecondary}>
            {new Date(conversation.updatedAt).toLocaleDateString()}
          </Text>
          {conversation.messageCount !== undefined && conversation.messageCount > 0 && (
            <Badge size="sm" colorScheme="blue" variant="subtle">
              {conversation.messageCount}
            </Badge>
          )}
        </HStack>
      </VStack>

      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            aria-label="Menu"
            icon={<FiMoreVertical />}
            size="xs"
            variant="ghost"
            onClick={(e) => e.stopPropagation()}
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
              onClick={(e) => onToggleFavorite(conversation.id, conversation.isFavorite, e)}
              color={colors.textColor}
            >
              <HStack spacing={2}>
                <FiStar />
                <Text>{conversation.isFavorite ? t('ai.chat.unfavorite') : t('ai.chat.favorite')}</Text>
              </HStack>
            </Menu.Item>
            <Menu.Item
              onClick={(e) => {
                e.stopPropagation();
                onMoveToFolder(conversation);
              }}
              color={colors.textColor}
            >
              <HStack spacing={2}>
                <FiFolder />
                <Text>{t('ai.chat.folder')}</Text>
              </HStack>
            </Menu.Item>
            <Menu.Item
              onClick={(e) => onDelete(conversation.id, e)}
              color="red.500"
            >
              <HStack spacing={2}>
                <FiTrash2 />
                <Text>{t('ai.chat.deleteConversation')}</Text>
              </HStack>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    </HStack>
  </Box>
);
