import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Flex,
  IconButton,
  Input,
  Spinner,
  Button,
  Dialog,
} from '@chakra-ui/react';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FiX, FiChevronDown, FiPlus, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { getTags, createTag } from '../../services/alertService';
import type { AlertTag, CreateTagRequest } from '../../services/alertService';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  allowCreate?: boolean;
}

const PRESET_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#6366F1', // indigo
  '#14B8A6', // teal
  '#F97316', // orange
  '#6B7280', // gray
];

export const TagSelector = ({
  selectedTags,
  onChange,
  placeholder,
  maxTags = 5,
  disabled = false,
  size = 'md',
  allowCreate = true,
}: TagSelectorProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const lang = i18n.language === 'en' ? 'en' : 'es';

  const [tags, setTags] = useState<AlertTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTag, setNewTag] = useState<CreateTagRequest>({
    name: '',
    nameEs: '',
    nameEn: '',
    color: '#3B82F6',
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadTags = async () => {
    try {
      const availableTags = await getTags(true);
      setTags(availableTags);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagSelect = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onChange(selectedTags.filter(t => t !== tagName));
    } else if (selectedTags.length < maxTags) {
      onChange([...selectedTags, tagName]);
    }
    setSearchText('');
  };

  const handleRemoveTag = (tagName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedTags.filter(t => t !== tagName));
  };

  const handleCreateTag = async () => {
    if (!newTag.name || !newTag.nameEs || !newTag.nameEn) return;

    setCreating(true);
    try {
      const created = await createTag(newTag);
      setTags([...tags, created]);
      onChange([...selectedTags, created.name]);
      setNewTag({ name: '', nameEs: '', nameEn: '', color: '#3B82F6' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating tag:', error);
    } finally {
      setCreating(false);
    }
  };

  const getTagLabel = (tag: AlertTag): string => {
    if (lang === 'en' && tag.nameEn) return tag.nameEn;
    if (lang === 'es' && tag.nameEs) return tag.nameEs;
    return tag.name;
  };

  const getTagDescription = (tag: AlertTag): string | undefined => {
    if (lang === 'en' && tag.descriptionEn) return tag.descriptionEn;
    if (lang === 'es' && tag.descriptionEs) return tag.descriptionEs;
    return tag.description;
  };

  const filteredTags = tags.filter(tag => {
    const label = getTagLabel(tag).toLowerCase();
    const desc = getTagDescription(tag)?.toLowerCase() || '';
    const search = searchText.toLowerCase();
    return label.includes(search) || desc.includes(search) || tag.name.includes(search);
  });

  const getTagByName = (name: string): AlertTag | undefined => {
    return tags.find(t => t.name === name);
  };

  const sizeStyles = {
    sm: { py: 1, px: 2, fontSize: 'xs' },
    md: { py: 2, px: 3, fontSize: 'sm' },
    lg: { py: 3, px: 4, fontSize: 'md' },
  };

  return (
    <Box ref={containerRef} position="relative" width="100%">
      {/* Selected Tags Display / Input */}
      <Box
        borderWidth={1}
        borderColor={isOpen ? colors.primaryColor : colors.borderColor}
        borderRadius="md"
        bg={colors.bgColor}
        cursor={disabled ? 'not-allowed' : 'pointer'}
        opacity={disabled ? 0.6 : 1}
        onClick={() => !disabled && setIsOpen(true)}
        {...sizeStyles[size]}
        minH="40px"
      >
        <Flex wrap="wrap" gap={1} align="center">
          {selectedTags.map(tagName => {
            const tag = getTagByName(tagName);
            return (
              <Badge
                key={tagName}
                px={2}
                py={0.5}
                borderRadius="full"
                bg={tag?.color || '#6B7280'}
                color="white"
                fontSize="xs"
                display="flex"
                alignItems="center"
                gap={1}
              >
                {tag ? getTagLabel(tag) : tagName}
                {!disabled && (
                  <Box
                    as="span"
                    cursor="pointer"
                    onClick={(e: React.MouseEvent) => handleRemoveTag(tagName, e)}
                    _hover={{ opacity: 0.8 }}
                  >
                    <FiX size={12} />
                  </Box>
                )}
              </Badge>
            );
          })}
          {selectedTags.length === 0 && (
            <Text color={colors.textColorSecondary} fontSize={sizeStyles[size].fontSize}>
              {placeholder || t('alerts.tags.selectTags', 'Seleccionar etiquetas...')}
            </Text>
          )}
          <Box flex={1} />
          <FiChevronDown color={colors.textColorSecondary} />
        </Flex>
      </Box>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={colors.cardBg}
          borderWidth={1}
          borderColor={colors.borderColor}
          borderRadius="md"
          boxShadow="lg"
          zIndex={1000}
          maxH="400px"
          overflowY="auto"
        >
          {/* Search Input */}
          <Box p={2} borderBottomWidth={1} borderColor={colors.borderColor}>
            <Input
              size="sm"
              placeholder={t('alerts.tags.searchTags', 'Buscar etiquetas...')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              bg={colors.bgColor}
              borderColor={colors.borderColor}
              color={colors.textColor}
              autoFocus
            />
          </Box>

          {/* Tags List */}
          {loading ? (
            <Flex justify="center" p={4}>
              <Spinner size="sm" color={colors.primaryColor} />
            </Flex>
          ) : (
            <>
              {filteredTags.length === 0 && !showCreateForm ? (
                <Box p={4} textAlign="center">
                  <Text color={colors.textColorSecondary} fontSize="sm">
                    {t('alerts.tags.noTags', 'No hay etiquetas disponibles')}
                  </Text>
                  {allowCreate && (
                    <Button
                      size="sm"
                      mt={2}
                      colorScheme="blue"
                      variant="outline"
                      onClick={() => setShowCreateForm(true)}
                    >
                      <FiPlus /> {t('alerts.tags.createNew', 'Crear etiqueta')}
                    </Button>
                  )}
                </Box>
              ) : (
                <VStack align="stretch" p={1} gap={0}>
                  {filteredTags.map(tag => {
                    const isSelected = selectedTags.includes(tag.name);
                    return (
                      <HStack
                        key={tag.id}
                        p={2}
                        cursor="pointer"
                        bg={isSelected ? colors.activeBg : 'transparent'}
                        _hover={{ bg: colors.activeBg }}
                        borderRadius="sm"
                        onClick={() => handleTagSelect(tag.name)}
                        justify="space-between"
                      >
                        <HStack gap={2}>
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={tag.color}
                            flexShrink={0}
                          />
                          <VStack align="flex-start" gap={0}>
                            <Text
                              fontSize="sm"
                              fontWeight={isSelected ? 'semibold' : 'normal'}
                              color={colors.textColor}
                            >
                              {getTagLabel(tag)}
                            </Text>
                            {getTagDescription(tag) && (
                              <Text fontSize="xs" color={colors.textColorSecondary}>
                                {getTagDescription(tag)}
                              </Text>
                            )}
                          </VStack>
                        </HStack>
                        {isSelected && (
                          <FiCheck color={colors.primaryColor} />
                        )}
                      </HStack>
                    );
                  })}
                </VStack>
              )}

              {/* Create New Tag Button */}
              {allowCreate && !showCreateForm && filteredTags.length > 0 && (
                <Box p={2} borderTopWidth={1} borderColor={colors.borderColor}>
                  <Button
                    size="sm"
                    width="100%"
                    variant="ghost"
                    color={colors.primaryColor}
                    onClick={() => setShowCreateForm(true)}
                  >
                    <FiPlus /> {t('alerts.tags.createNew', 'Crear nueva etiqueta')}
                  </Button>
                </Box>
              )}

              {/* Create Tag Form */}
              {showCreateForm && (
                <Box p={3} borderTopWidth={1} borderColor={colors.borderColor} bg={colors.bgColor}>
                  <VStack gap={3} align="stretch">
                    <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
                      {t('alerts.tags.createTitle', 'Nueva Etiqueta')}
                    </Text>

                    <Input
                      size="sm"
                      placeholder={t('alerts.tags.codePlaceholder', 'Código (ej: mi-etiqueta)')}
                      value={newTag.name}
                      onChange={(e) => setNewTag({ ...newTag, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      bg={colors.cardBg}
                      borderColor={colors.borderColor}
                      color={colors.textColor}
                    />

                    <HStack gap={2}>
                      <Input
                        size="sm"
                        placeholder={t('alerts.tags.nameEs', 'Nombre (ES)')}
                        value={newTag.nameEs}
                        onChange={(e) => setNewTag({ ...newTag, nameEs: e.target.value })}
                        bg={colors.cardBg}
                        borderColor={colors.borderColor}
                        color={colors.textColor}
                      />
                      <Input
                        size="sm"
                        placeholder={t('alerts.tags.nameEn', 'Name (EN)')}
                        value={newTag.nameEn}
                        onChange={(e) => setNewTag({ ...newTag, nameEn: e.target.value })}
                        bg={colors.cardBg}
                        borderColor={colors.borderColor}
                        color={colors.textColor}
                      />
                    </HStack>

                    <Box>
                      <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                        {t('alerts.tags.selectColor', 'Color')}
                      </Text>
                      <HStack gap={1} flexWrap="wrap">
                        {PRESET_COLORS.map(color => (
                          <Box
                            key={color}
                            w={6}
                            h={6}
                            borderRadius="md"
                            bg={color}
                            cursor="pointer"
                            borderWidth={2}
                            borderColor={newTag.color === color ? 'white' : 'transparent'}
                            boxShadow={newTag.color === color ? '0 0 0 2px ' + colors.primaryColor : 'none'}
                            onClick={() => setNewTag({ ...newTag, color })}
                            _hover={{ transform: 'scale(1.1)' }}
                            transition="all 0.1s"
                          />
                        ))}
                      </HStack>
                    </Box>

                    <HStack gap={2} justify="flex-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowCreateForm(false)}
                      >
                        {t('common.cancel', 'Cancelar')}
                      </Button>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleCreateTag}
                        loading={creating}
                        disabled={!newTag.name || !newTag.nameEs || !newTag.nameEn}
                      >
                        {t('common.create', 'Crear')}
                      </Button>
                    </HStack>
                  </VStack>
                </Box>
              )}
            </>
          )}

          {/* Max Tags Warning */}
          {selectedTags.length >= maxTags && (
            <Box
              p={2}
              borderTopWidth={1}
              borderColor={colors.borderColor}
              bg={colors.bgColor}
            >
              <Text fontSize="xs" color="orange.500" textAlign="center">
                {t('alerts.tags.maxReached', `Máximo ${maxTags} etiquetas permitidas`)}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

// Compact tag display for cards
export const TagDisplay = ({ tags, maxVisible = 3 }: { tags?: string[]; maxVisible?: number }) => {
  const { getColors } = useTheme();
  const { i18n } = useTranslation();
  const colors = getColors();
  const lang = i18n.language === 'en' ? 'en' : 'es';
  const [allTags, setAllTags] = useState<AlertTag[]>([]);

  useEffect(() => {
    getTags(true).then(setAllTags).catch(() => {});
  }, []);

  if (!tags || tags.length === 0) return null;

  const getTagInfo = (name: string): { color: string; label: string } => {
    const tag = allTags.find(t => t.name === name);
    if (!tag) return { color: '#6B7280', label: name };

    let label = name;
    if (lang === 'en' && tag.nameEn) label = tag.nameEn;
    else if (lang === 'es' && tag.nameEs) label = tag.nameEs;

    return { color: tag.color, label };
  };

  const visibleTags = tags.slice(0, maxVisible);
  const remainingCount = tags.length - maxVisible;

  return (
    <HStack gap={1} flexWrap="wrap">
      {visibleTags.map(tagName => {
        const { color, label } = getTagInfo(tagName);
        return (
          <Badge
            key={tagName}
            px={1.5}
            py={0.5}
            borderRadius="full"
            bg={color}
            color="white"
            fontSize="2xs"
            fontWeight="medium"
          >
            {label}
          </Badge>
        );
      })}
      {remainingCount > 0 && (
        <Badge
          px={1.5}
          py={0.5}
          borderRadius="full"
          bg={colors.textColorSecondary}
          color="white"
          fontSize="2xs"
        >
          +{remainingCount}
        </Badge>
      )}
    </HStack>
  );
};

export default TagSelector;
