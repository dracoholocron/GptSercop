/**
 * AIPromptConfigAdmin Page
 * Admin UI for configuring AI prompts for document extraction
 * Features: CRUD, version history, validation, suggestions, preview
 */

import {
  Box,
  Input,
  VStack,
  HStack,
  Text,
  Flex,
  Button,
  IconButton,
  Badge,
  Spinner,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  Tabs,
  SimpleGrid,
  Textarea,
  Switch,
  Collapsible,
  Card,
  Separator,
  Progress,
  NativeSelect,
} from '@chakra-ui/react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiChevronDown,
  FiSave,
  FiRefreshCw,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiCheck,
  FiAlertTriangle,
  FiInfo,
  FiClock,
  FiZap,
  FiSearch,
  FiFilter,
  FiCode,
  FiFileText,
  FiPlay,
  FiRotateCcw,
  FiSettings,
  FiHelpCircle,
  FiMessageSquare,
  FiList,
  FiLayers,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { notify } from '../components/ui/toaster';
import apiClient, { get, post, put, del } from '../utils/apiClient';

// Types
interface AIPromptConfig {
  id: number;
  promptKey: string;
  displayName: string;
  description: string;
  category: string;
  language: string;
  messageType: string;
  promptTemplate: string;
  availableVariables: string;
  config: string;
  version: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

interface AIPromptHistory {
  id: number;
  promptConfigId: number;
  promptKey: string;
  version: number;
  promptTemplate: string;
  availableVariables: string;
  config: string;
  changedBy: string;
  changedAt: string;
  changeReason: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  variables: string[];
  characterCount: number;
}

interface Suggestions {
  improvements: string[];
  bestPractices: string[];
  estimatedTokens: number;
}

// Category options
const CATEGORIES = [
  { value: 'EXTRACTION', label: 'Extracción', icon: <FiFileText size={14} />, color: 'blue' },
  { value: 'ANALYSIS', label: 'Análisis', icon: <FiSearch size={14} />, color: 'green' },
  { value: 'ACTIONS', label: 'Acciones', icon: <FiZap size={14} />, color: 'orange' },
  { value: 'OTHER', label: 'Otros', icon: <FiSettings size={14} />, color: 'gray' },
];

// Language options
const LANGUAGES = [
  { value: 'all', label: 'Todos los idiomas' },
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
];

// Message type options
const MESSAGE_TYPES = [
  { value: 'ALL', label: 'Todos los tipos' },
  { value: 'MT700', label: 'MT700 - LC Import' },
  { value: 'MT710', label: 'MT710 - LC Export' },
  { value: 'MT760', label: 'MT760 - Garantía' },
  { value: 'MT799', label: 'MT799 - Mensaje Libre' },
];

export default function AIPromptConfigAdmin() {
  const { t } = useTranslation(['common']);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // State
  const [prompts, setPrompts] = useState<AIPromptConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPrompt, setSelectedPrompt] = useState<AIPromptConfig | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<AIPromptHistory[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [previewRendered, setPreviewRendered] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [changeReason, setChangeReason] = useState('');
  const [stats, setStats] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<AIPromptConfig>>({
    promptKey: '',
    displayName: '',
    description: '',
    category: 'OTHER',
    language: 'all',
    messageType: 'ALL',
    promptTemplate: '',
    availableVariables: '[]',
    config: '{}',
    isActive: true,
  });

  // Colors
  const colors = {
    bg: isDark ? 'gray.800' : 'white',
    cardBg: isDark ? 'gray.750' : 'gray.50',
    borderColor: isDark ? 'gray.600' : 'gray.200',
    textColor: isDark ? 'gray.100' : 'gray.800',
    textSecondary: isDark ? 'gray.400' : 'gray.600',
    hoverBg: isDark ? 'gray.700' : 'gray.100',
  };

  // Load prompts
  const loadPrompts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await get('/ai-prompt-config/all');
      if (response.ok) {
        const data = await response.json();
        setPrompts(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Error al cargar prompts');
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
      notify({
        type: 'error',
        title: t('common:error'),
        description: 'Error al cargar los prompts',
      });
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const response = await get('/ai-prompt-config/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  useEffect(() => {
    loadPrompts();
    loadStats();
  }, [loadPrompts, loadStats]);

  // Load history for a prompt
  const loadHistory = async (promptId: number) => {
    try {
      const response = await get(`/ai-prompt-config/${promptId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(Array.isArray(data) ? data : []);
      } else {
        setHistory([]);
      }
      setShowHistory(true);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    }
  };

  // Validate template
  const validateTemplate = async (template: string) => {
    try {
      const response = await post('/ai-prompt-config/validate', { template });
      if (response.ok) {
        const data = await response.json();
        setValidation(data);
      }
    } catch (error) {
      console.error('Error validating:', error);
    }
  };

  // Get suggestions
  const getSuggestions = async (template: string, category: string) => {
    try {
      const response = await post('/ai-prompt-config/suggestions', { template, category });
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  };

  // Preview rendered prompt
  const previewPrompt = async () => {
    try {
      const response = await post('/ai-prompt-config/render', {
        template: formData.promptTemplate,
        variables: {
          messageType: 'MT700',
          language: 'es',
          textareaInstructions: '[Instrucciones TEXTAREA]',
          additionalAnalysisInstructions: '[Instrucciones de análisis]',
          responseFormat: '[Formato JSON]',
          fieldSchema: '[Esquema de campos]',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPreviewRendered(data.rendered || '');
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing:', error);
    }
  };

  // Handle template change with validation
  const handleTemplateChange = (value: string) => {
    setFormData({ ...formData, promptTemplate: value });
    // Debounced validation
    const timeoutId = setTimeout(() => {
      validateTemplate(value);
      getSuggestions(value, formData.category || 'OTHER');
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  // Save prompt
  const handleSave = async () => {
    try {
      if (isCreating) {
        const response = await post('/ai-prompt-config', formData);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al crear el prompt');
        }
        notify({
          type: 'success',
          title: 'Prompt creado',
          description: `Se creó el prompt "${formData.displayName}"`,
        });
      } else if (selectedPrompt) {
        const response = await put(`/ai-prompt-config/${selectedPrompt.id}?changeReason=${encodeURIComponent(changeReason || 'Actualización')}`, formData);
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Error al actualizar el prompt');
        }
        notify({
          type: 'success',
          title: 'Prompt actualizado',
          description: `Se actualizó el prompt "${formData.displayName}"`,
        });
      }
      setIsEditing(false);
      setIsCreating(false);
      setChangeReason('');
      loadPrompts();
    } catch (error: any) {
      notify({
        type: 'error',
        title: 'Error',
        description: error.message || 'Error al guardar el prompt',
      });
    }
  };

  // Restore version
  const restoreVersion = async (promptKey: string, version: number) => {
    try {
      const response = await post(`/ai-prompt-config/key/${promptKey}/restore/${version}`, {});
      if (!response.ok) {
        throw new Error('Error al restaurar la versión');
      }
      notify({
        type: 'success',
        title: 'Versión restaurada',
        description: `Se restauró la versión ${version}`,
      });
      setShowHistory(false);
      loadPrompts();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Error',
        description: 'Error al restaurar la versión',
      });
    }
  };

  // Toggle active
  const toggleActive = async (prompt: AIPromptConfig) => {
    try {
      const response = await apiClient(`/ai-prompt-config/${prompt.id}/toggle-active`, { method: 'PATCH' });
      if (!response.ok) {
        throw new Error('Error al cambiar el estado');
      }
      loadPrompts();
    } catch (error) {
      notify({
        type: 'error',
        title: 'Error',
        description: 'Error al cambiar el estado',
      });
    }
  };

  // Filter prompts
  const filteredPrompts = prompts.filter((p) => {
    const matchesSearch =
      !searchText ||
      p.displayName.toLowerCase().includes(searchText.toLowerCase()) ||
      p.promptKey.toLowerCase().includes(searchText.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !filterCategory || p.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Select prompt for editing
  const selectPrompt = (prompt: AIPromptConfig) => {
    setSelectedPrompt(prompt);
    setFormData(prompt);
    setIsEditing(true);
    setIsCreating(false);
    validateTemplate(prompt.promptTemplate);
    getSuggestions(prompt.promptTemplate, prompt.category);
  };

  // Create new prompt
  const createNew = () => {
    setSelectedPrompt(null);
    setFormData({
      promptKey: '',
      displayName: '',
      description: '',
      category: 'OTHER',
      language: 'all',
      messageType: 'ALL',
      promptTemplate: '',
      availableVariables: '[]',
      config: '{}',
      isActive: true,
    });
    setIsEditing(true);
    setIsCreating(true);
    setValidation(null);
    setSuggestions(null);
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const cat = CATEGORIES.find((c) => c.value === category);
    if (!cat) return <Badge>{category}</Badge>;
    return (
      <Badge colorPalette={cat.color} variant="subtle">
        <HStack gap={1}>
          {cat.icon}
          <Text>{cat.label}</Text>
        </HStack>
      </Badge>
    );
  };

  return (
    <Box p={6} minH="100vh" bg={isDark ? 'gray.900' : 'gray.50'}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" gap={1}>
          <HStack gap={2}>
            <FiMessageSquare size={24} />
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              Configuración de Prompts IA
            </Text>
          </HStack>
          <Text fontSize="sm" color={colors.textSecondary}>
            Gestiona los prompts de extracción y análisis de documentos
          </Text>
        </VStack>
        <HStack gap={2}>
          <Button size="sm" variant="outline" onClick={loadPrompts}>
            <FiRefreshCw size={16} />
            <Text ml={2}>Actualizar</Text>
          </Button>
          <Button size="sm" colorPalette="blue" onClick={createNew}>
            <FiPlus size={16} />
            <Text ml={2}>Nuevo Prompt</Text>
          </Button>
        </HStack>
      </Flex>

      {/* Stats */}
      {stats && (
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
          <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                    {stats.totalPrompts}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Total Prompts
                  </Text>
                </VStack>
                <FiLayers size={24} color="var(--chakra-colors-blue-500)" />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="green.500">
                    {stats.activePrompts}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Activos
                  </Text>
                </VStack>
                <FiCheck size={24} color="var(--chakra-colors-green-500)" />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                    {stats.categories?.length || 0}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Categorías
                  </Text>
                </VStack>
                <FiFilter size={24} color="var(--chakra-colors-orange-500)" />
              </HStack>
            </Card.Body>
          </Card.Root>
          <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
            <Card.Body p={4}>
              <HStack justify="space-between">
                <VStack align="start" gap={0}>
                  <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                    {stats.averageVersion?.toFixed(1) || '1.0'}
                  </Text>
                  <Text fontSize="sm" color={colors.textSecondary}>
                    Versión Promedio
                  </Text>
                </VStack>
                <FiClock size={24} color="var(--chakra-colors-purple-500)" />
              </HStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>
      )}

      <Flex gap={6} direction={{ base: 'column', lg: 'row' }}>
        {/* Prompts List */}
        <Box flex="1" maxW={{ lg: '400px' }}>
          <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
            <Card.Header p={4} borderBottom="1px solid" borderColor={colors.borderColor}>
              <VStack gap={3} align="stretch">
                <HStack>
                  <Input
                    placeholder="Buscar prompts..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    size="sm"
                  />
                  <IconButton size="sm" variant="ghost" aria-label="Search">
                    <FiSearch />
                  </IconButton>
                </HStack>
                <NativeSelect.Root size="sm">
                  <NativeSelect.Field
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="">Todas las categorías</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </VStack>
            </Card.Header>
            <Card.Body p={0} maxH="600px" overflowY="auto">
              {loading ? (
                <Flex justify="center" p={8}>
                  <Spinner />
                </Flex>
              ) : filteredPrompts.length === 0 ? (
                <Flex justify="center" p={8}>
                  <Text color={colors.textSecondary}>No se encontraron prompts</Text>
                </Flex>
              ) : (
                <VStack gap={0} align="stretch">
                  {filteredPrompts.map((prompt) => (
                    <Box
                      key={prompt.id}
                      p={4}
                      cursor="pointer"
                      bg={selectedPrompt?.id === prompt.id ? (isDark ? 'blue.900' : 'blue.50') : 'transparent'}
                      borderBottom="1px solid"
                      borderColor={colors.borderColor}
                      _hover={{ bg: colors.hoverBg }}
                      onClick={() => selectPrompt(prompt)}
                    >
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="600" fontSize="sm" color={colors.textColor} noOfLines={1}>
                          {prompt.displayName}
                        </Text>
                        <HStack gap={1}>
                          {!prompt.isActive && (
                            <Badge colorPalette="red" size="sm">
                              Inactivo
                            </Badge>
                          )}
                          <Badge colorPalette="gray" size="sm">
                            v{prompt.version}
                          </Badge>
                        </HStack>
                      </HStack>
                      <HStack gap={2} mb={2}>
                        {getCategoryBadge(prompt.category)}
                        <Badge variant="outline" size="sm">
                          {prompt.messageType}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {prompt.language}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color={colors.textSecondary} noOfLines={2}>
                        {prompt.description}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              )}
            </Card.Body>
          </Card.Root>
        </Box>

        {/* Editor Panel */}
        <Box flex="2">
          {isEditing ? (
            <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
              <Card.Header p={4} borderBottom="1px solid" borderColor={colors.borderColor}>
                <Flex justify="space-between" align="center">
                  <HStack gap={2}>
                    <FiEdit2 />
                    <Text fontWeight="bold" color={colors.textColor}>
                      {isCreating ? 'Nuevo Prompt' : `Editando: ${selectedPrompt?.displayName}`}
                    </Text>
                    {!isCreating && selectedPrompt && (
                      <Badge colorPalette="purple">v{selectedPrompt.version}</Badge>
                    )}
                  </HStack>
                  <HStack gap={2}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button size="sm" colorPalette="blue" onClick={handleSave}>
                      <FiSave size={14} />
                      <Text ml={2}>Guardar</Text>
                    </Button>
                  </HStack>
                </Flex>
              </Card.Header>
              <Card.Body p={4}>
                <Tabs.Root defaultValue="basic" variant="line">
                  <Tabs.List mb={4}>
                    <Tabs.Trigger value="basic">
                      <FiSettings size={14} />
                      <Text ml={2}>Básico</Text>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="template">
                      <FiCode size={14} />
                      <Text ml={2}>Template</Text>
                    </Tabs.Trigger>
                    <Tabs.Trigger value="help">
                      <FiHelpCircle size={14} />
                      <Text ml={2}>Ayuda</Text>
                    </Tabs.Trigger>
                  </Tabs.List>

                  {/* Basic Tab */}
                  <Tabs.Content value="basic">
                    <VStack gap={4} align="stretch">
                      <SimpleGrid columns={2} gap={4}>
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Clave única *
                          </Text>
                          <Input
                            value={formData.promptKey}
                            onChange={(e) => setFormData({ ...formData, promptKey: e.target.value })}
                            placeholder="swift_extraction_main"
                            disabled={!isCreating}
                          />
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Nombre para mostrar *
                          </Text>
                          <Input
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            placeholder="Extracción SWIFT - Prompt Principal"
                          />
                        </Box>
                      </SimpleGrid>

                      <Box>
                        <Text fontSize="sm" fontWeight="500" mb={1}>
                          Descripción
                        </Text>
                        <Textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Describe el propósito de este prompt..."
                          rows={2}
                        />
                      </Box>

                      <SimpleGrid columns={3} gap={4}>
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Categoría
                          </Text>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                              {CATEGORIES.map((cat) => (
                                <option key={cat.value} value={cat.value}>
                                  {cat.label}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Idioma
                          </Text>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={formData.language}
                              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                            >
                              {LANGUAGES.map((lang) => (
                                <option key={lang.value} value={lang.value}>
                                  {lang.label}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Tipo de Mensaje
                          </Text>
                          <NativeSelect.Root>
                            <NativeSelect.Field
                              value={formData.messageType}
                              onChange={(e) => setFormData({ ...formData, messageType: e.target.value })}
                            >
                              {MESSAGE_TYPES.map((mt) => (
                                <option key={mt.value} value={mt.value}>
                                  {mt.label}
                                </option>
                              ))}
                            </NativeSelect.Field>
                          </NativeSelect.Root>
                        </Box>
                      </SimpleGrid>

                      <HStack gap={4}>
                        <HStack>
                          <Switch.Root
                            checked={formData.isActive}
                            onCheckedChange={(e) => setFormData({ ...formData, isActive: e.checked })}
                          >
                            <Switch.HiddenInput />
                            <Switch.Control>
                              <Switch.Thumb />
                            </Switch.Control>
                          </Switch.Root>
                          <Text fontSize="sm">Activo</Text>
                        </HStack>
                      </HStack>

                      {!isCreating && (
                        <Box>
                          <Text fontSize="sm" fontWeight="500" mb={1}>
                            Razón del cambio
                          </Text>
                          <Input
                            value={changeReason}
                            onChange={(e) => setChangeReason(e.target.value)}
                            placeholder="Describe brevemente qué cambiaste y por qué..."
                          />
                        </Box>
                      )}
                    </VStack>
                  </Tabs.Content>

                  {/* Template Tab */}
                  <Tabs.Content value="template">
                    <VStack gap={4} align="stretch">
                      <Flex justify="space-between" align="center">
                        <Text fontSize="sm" fontWeight="500">
                          Template del Prompt
                        </Text>
                        <HStack gap={2}>
                          <Button size="xs" variant="outline" onClick={previewPrompt}>
                            <FiEye size={12} />
                            <Text ml={1}>Vista Previa</Text>
                          </Button>
                        </HStack>
                      </Flex>

                      <Textarea
                        value={formData.promptTemplate}
                        onChange={(e) => handleTemplateChange(e.target.value)}
                        placeholder="Escribe el prompt aquí...

Puedes usar variables con la sintaxis {{variableName}}

Ejemplo:
Analiza el documento para un mensaje {{messageType}}.
El idioma es {{language}}."
                        rows={15}
                        fontFamily="mono"
                        fontSize="sm"
                      />

                      {/* Validation Results */}
                      {validation && (
                        <Box
                          p={3}
                          borderRadius="md"
                          bg={validation.isValid ? (isDark ? 'green.900' : 'green.50') : (isDark ? 'red.900' : 'red.50')}
                          border="1px solid"
                          borderColor={validation.isValid ? 'green.500' : 'red.500'}
                        >
                          <HStack mb={2}>
                            {validation.isValid ? (
                              <FiCheck color="green" />
                            ) : (
                              <FiAlertTriangle color="red" />
                            )}
                            <Text fontSize="sm" fontWeight="600">
                              {validation.isValid ? 'Template válido' : 'Errores encontrados'}
                            </Text>
                            <Badge>{validation.characterCount} caracteres</Badge>
                            <Badge>~{Math.round(validation.characterCount / 4)} tokens</Badge>
                          </HStack>

                          {validation.errors.length > 0 && (
                            <VStack align="start" gap={1} mt={2}>
                              {validation.errors.map((err, i) => (
                                <Text key={i} fontSize="xs" color="red.500">
                                  • {err}
                                </Text>
                              ))}
                            </VStack>
                          )}

                          {validation.warnings.length > 0 && (
                            <VStack align="start" gap={1} mt={2}>
                              {validation.warnings.map((warn, i) => (
                                <Text key={i} fontSize="xs" color="yellow.600">
                                  ⚠ {warn}
                                </Text>
                              ))}
                            </VStack>
                          )}

                          {validation.variables.length > 0 && (
                            <HStack mt={2} gap={1} flexWrap="wrap">
                              <Text fontSize="xs" color={colors.textSecondary}>
                                Variables:
                              </Text>
                              {validation.variables.map((v, i) => (
                                <Badge key={i} colorPalette="blue" size="sm">
                                  {`{{${v}}}`}
                                </Badge>
                              ))}
                            </HStack>
                          )}
                        </Box>
                      )}
                    </VStack>
                  </Tabs.Content>

                  {/* Help Tab */}
                  <Tabs.Content value="help">
                    <VStack gap={4} align="stretch">
                      {/* Suggestions */}
                      {suggestions && (
                        <>
                          {suggestions.improvements.length > 0 && (
                            <Box
                              p={3}
                              borderRadius="md"
                              bg={isDark ? 'blue.900' : 'blue.50'}
                              border="1px solid"
                              borderColor="blue.500"
                            >
                              <HStack mb={2}>
                                <FiZap color="var(--chakra-colors-blue-500)" />
                                <Text fontSize="sm" fontWeight="600" color="blue.600">
                                  Sugerencias de Mejora
                                </Text>
                              </HStack>
                              <VStack align="start" gap={1}>
                                {suggestions.improvements.map((imp, i) => (
                                  <Text key={i} fontSize="xs" color={colors.textSecondary}>
                                    • {imp}
                                  </Text>
                                ))}
                              </VStack>
                            </Box>
                          )}

                          {suggestions.bestPractices.length > 0 && (
                            <Box
                              p={3}
                              borderRadius="md"
                              bg={isDark ? 'green.900' : 'green.50'}
                              border="1px solid"
                              borderColor="green.500"
                            >
                              <HStack mb={2}>
                                <FiCheck color="var(--chakra-colors-green-500)" />
                                <Text fontSize="sm" fontWeight="600" color="green.600">
                                  Mejores Prácticas
                                </Text>
                              </HStack>
                              <VStack align="start" gap={1}>
                                {suggestions.bestPractices.map((bp, i) => (
                                  <Text key={i} fontSize="xs" color={colors.textSecondary}>
                                    • {bp}
                                  </Text>
                                ))}
                              </VStack>
                            </Box>
                          )}
                        </>
                      )}

                      {/* Variables Reference */}
                      <Box p={3} borderRadius="md" bg={colors.cardBg} border="1px solid" borderColor={colors.borderColor}>
                        <Text fontSize="sm" fontWeight="600" mb={2}>
                          Variables Disponibles
                        </Text>
                        <SimpleGrid columns={2} gap={2}>
                          <HStack>
                            <Badge colorPalette="blue">{`{{messageType}}`}</Badge>
                            <Text fontSize="xs">Tipo de mensaje SWIFT</Text>
                          </HStack>
                          <HStack>
                            <Badge colorPalette="blue">{`{{language}}`}</Badge>
                            <Text fontSize="xs">Idioma (es/en)</Text>
                          </HStack>
                          <HStack>
                            <Badge colorPalette="blue">{`{{fieldSchema}}`}</Badge>
                            <Text fontSize="xs">Esquema de campos</Text>
                          </HStack>
                          <HStack>
                            <Badge colorPalette="blue">{`{{responseFormat}}`}</Badge>
                            <Text fontSize="xs">Formato JSON</Text>
                          </HStack>
                        </SimpleGrid>
                      </Box>

                      {/* History Button */}
                      {!isCreating && selectedPrompt && (
                        <Button variant="outline" onClick={() => loadHistory(selectedPrompt.id)}>
                          <FiClock size={14} />
                          <Text ml={2}>Ver Historial de Versiones</Text>
                        </Button>
                      )}
                    </VStack>
                  </Tabs.Content>
                </Tabs.Root>
              </Card.Body>
            </Card.Root>
          ) : (
            <Card.Root bg={colors.bg} borderColor={colors.borderColor}>
              <Card.Body p={8}>
                <Flex justify="center" align="center" direction="column" gap={4}>
                  <FiMessageSquare size={48} color={colors.textSecondary} />
                  <Text color={colors.textSecondary} textAlign="center">
                    Selecciona un prompt de la lista para editarlo
                    <br />o crea uno nuevo
                  </Text>
                  <Button colorPalette="blue" onClick={createNew}>
                    <FiPlus size={14} />
                    <Text ml={2}>Crear Nuevo Prompt</Text>
                  </Button>
                </Flex>
              </Card.Body>
            </Card.Root>
          )}
        </Box>
      </Flex>

      {/* History Dialog */}
      <DialogRoot open={showHistory} onOpenChange={(e) => setShowHistory(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="800px">
          <DialogHeader>
            <DialogTitle>
              <HStack gap={2}>
                <FiClock />
                <Text>Historial de Versiones</Text>
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {history.length === 0 ? (
              <Text color={colors.textSecondary}>No hay versiones anteriores</Text>
            ) : (
              <VStack gap={3} align="stretch">
                {history.map((h) => (
                  <Box
                    key={h.id}
                    p={4}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={colors.borderColor}
                    bg={colors.cardBg}
                  >
                    <Flex justify="space-between" align="start" mb={2}>
                      <VStack align="start" gap={1}>
                        <HStack gap={2}>
                          <Badge colorPalette="purple">v{h.version}</Badge>
                          <Text fontSize="sm" color={colors.textSecondary}>
                            {new Date(h.changedAt).toLocaleString()}
                          </Text>
                        </HStack>
                        <Text fontSize="sm" color={colors.textColor}>
                          Por: {h.changedBy}
                        </Text>
                        {h.changeReason && (
                          <Text fontSize="xs" color={colors.textSecondary} fontStyle="italic">
                            "{h.changeReason}"
                          </Text>
                        )}
                      </VStack>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => restoreVersion(h.promptKey, h.version)}
                      >
                        <FiRotateCcw size={12} />
                        <Text ml={1}>Restaurar</Text>
                      </Button>
                    </Flex>
                    <Collapsible.Root>
                      <Collapsible.Trigger asChild>
                        <Button size="xs" variant="ghost">
                          <FiChevronDown size={12} />
                          <Text ml={1}>Ver contenido</Text>
                        </Button>
                      </Collapsible.Trigger>
                      <Collapsible.Content>
                        <Box
                          mt={2}
                          p={2}
                          bg={isDark ? 'gray.800' : 'white'}
                          borderRadius="md"
                          fontSize="xs"
                          fontFamily="mono"
                          maxH="200px"
                          overflowY="auto"
                          whiteSpace="pre-wrap"
                        >
                          {h.promptTemplate}
                        </Box>
                      </Collapsible.Content>
                    </Collapsible.Root>
                  </Box>
                ))}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHistory(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Preview Dialog */}
      <DialogRoot open={showPreview} onOpenChange={(e) => setShowPreview(e.open)}>
        <DialogBackdrop />
        <DialogContent maxW="900px">
          <DialogHeader>
            <DialogTitle>
              <HStack gap={2}>
                <FiEye />
                <Text>Vista Previa del Prompt</Text>
              </HStack>
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Box
              p={4}
              bg={isDark ? 'gray.800' : 'gray.50'}
              borderRadius="md"
              fontSize="sm"
              fontFamily="mono"
              maxH="500px"
              overflowY="auto"
              whiteSpace="pre-wrap"
            >
              {previewRendered}
            </Box>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(previewRendered);
                notify({ type: 'success', title: 'Copiado', description: 'Prompt copiado al portapapeles' });
              }}
            >
              <FiCopy size={14} />
              <Text ml={2}>Copiar</Text>
            </Button>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
}
