/**
 * BrandTemplatesAdmin - Admin page for managing UI branding templates
 * Allows customization of colors, logos, typography, and company info
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Heading,
  Card,
  Input,
  IconButton,
  Button,
  SimpleGrid,
  Textarea,
} from '@chakra-ui/react';
import { toaster } from '../../components/ui/toaster';
import {
  FiCheck,
  FiEdit2,
  FiTrash2,
  FiCopy,
  FiPlus,
  FiX,
  FiSave,
  FiBox,
  FiChevronDown,
  FiChevronRight,
  FiType,
  FiSun,
  FiMoon,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useBrand } from '../../contexts/BrandContext';
import {
  brandTemplateService,
  type BrandTemplate,
  type CreateBrandTemplateRequest,
  type UpdateBrandTemplateRequest,
} from '../../services/brandTemplateService';

const FONT_OPTIONS = [
  'Inter',
  'Poppins',
  'Roboto',
  'Nunito Sans',
  'Raleway',
  'Montserrat',
  'Open Sans',
  'Lato',
];

// Color input component
const ColorInput = ({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => (
  <HStack>
    <Text fontSize="sm" minW="140px" color="inherit">{label}</Text>
    <Input
      type="color"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      w="50px"
      h="32px"
      p={1}
      cursor={disabled ? 'not-allowed' : 'pointer'}
    />
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      size="sm"
      w="90px"
      fontFamily="mono"
      fontSize="xs"
    />
  </HStack>
);

// Collapsible section
const Section = ({
  title,
  icon,
  children,
  defaultOpen = true,
  colors,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Box borderWidth="1px" borderColor={colors.borderColor} borderRadius="md" overflow="hidden">
      <Flex
        align="center"
        gap={2}
        px={3}
        py={2}
        bg={colors.hoverBg}
        cursor="pointer"
        onClick={() => setOpen(!open)}
        _hover={{ opacity: 0.8 }}
      >
        {open ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
        {icon}
        <Text fontSize="sm" fontWeight="semibold" color={colors.textColor}>{title}</Text>
      </Flex>
      {open && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </Box>
  );
};

// Live Preview component
const LivePreview = ({
  formData,
  colors,
}: {
  formData: Partial<BrandTemplate>;
  colors: ReturnType<ReturnType<typeof useTheme>['getColors']>;
}) => {
  const fontFamily = formData.fontFamily || 'Inter';

  const renderMockup = (isDark: boolean, label: string) => {
    const bg = isDark ? (formData.contentBgColorDark || '#2D3748') : (formData.contentBgColor || '#F7FAFC');
    const cardBg = isDark ? (formData.cardBgColorDark || '#2D3748') : (formData.cardBgColor || '#FFFFFF');
    const border = isDark ? (formData.borderColorDark || '#4A5568') : (formData.borderColor || '#E2E8F0');
    const text = isDark ? (formData.textColorDark || '#F7FAFC') : (formData.textColor || '#1A202C');
    const textSec = isDark ? (formData.textColorSecondaryDark || '#A0AEC0') : (formData.textColorSecondary || '#718096');

    return (
      <Box>
        <HStack mb={1} gap={1}>
          {isDark ? <FiMoon size={10} /> : <FiSun size={10} />}
          <Text fontSize="xs" color={colors.textColorSecondary}>{label}</Text>
        </HStack>
        <Box
          borderWidth="1px"
          borderColor={colors.borderColor}
          borderRadius="md"
          overflow="hidden"
          h="140px"
          style={{ fontFamily: `'${fontFamily}', Inter, sans-serif` }}
        >
          <Flex h="100%">
            {/* Sidebar */}
            <Box w="44px" bg={formData.sidebarBgColor || '#1A202C'} p={1.5} flexShrink={0}>
              <Box
                w="28px"
                h="28px"
                bg={formData.primaryColor || '#0073E6'}
                borderRadius="sm"
                mb={2}
              />
              <VStack gap={1}>
                {[1, 2, 3].map(i => (
                  <Box
                    key={i}
                    w="28px"
                    h="5px"
                    bg={formData.sidebarTextColor || '#FFFFFF'}
                    opacity={0.3}
                    borderRadius="sm"
                  />
                ))}
              </VStack>
            </Box>
            {/* Main */}
            <Box flex="1" bg={bg}>
              {/* Header */}
              <Flex
                h="22px"
                bg={formData.headerBgColor || '#FFFFFF'}
                borderBottomWidth="1px"
                borderColor={border}
                align="center"
                px={2}
              >
                <Text fontSize="7px" fontWeight="bold" color={text}>
                  {formData.companyName || 'Company'}
                </Text>
              </Flex>
              {/* Content */}
              <Box p={2}>
                {/* Card */}
                <Box
                  bg={cardBg}
                  borderWidth="1px"
                  borderColor={border}
                  borderRadius="sm"
                  p={2}
                  mb={2}
                >
                  <Text fontSize="7px" fontWeight="bold" color={text} mb={1}>
                    Titulo de ejemplo
                  </Text>
                  <Text fontSize="6px" color={textSec}>
                    Texto secundario de muestra
                  </Text>
                </Box>
                {/* Button */}
                <HStack gap={1}>
                  <Box
                    bg={formData.primaryColor || '#0073E6'}
                    borderRadius="sm"
                    px={2}
                    py={0.5}
                  >
                    <Text fontSize="6px" color="#FFFFFF" fontWeight="bold">
                      Boton
                    </Text>
                  </Box>
                  <Box
                    bg={formData.accentColor || '#2DD4BF'}
                    borderRadius="sm"
                    px={2}
                    py={0.5}
                  >
                    <Text fontSize="6px" color="#FFFFFF" fontWeight="bold">
                      Accion
                    </Text>
                  </Box>
                </HStack>
              </Box>
            </Box>
          </Flex>
        </Box>
      </Box>
    );
  };

  return (
    <VStack gap={3} align="stretch">
      <Text fontSize="sm" fontWeight="semibold" color={colors.textColor}>Vista Previa</Text>
      {/* Font preview */}
      <Box
        p={2}
        borderWidth="1px"
        borderColor={colors.borderColor}
        borderRadius="md"
        style={{ fontFamily: `'${fontFamily}', Inter, sans-serif` }}
      >
        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
          <FiType style={{ display: 'inline', marginRight: 4 }} />
          {fontFamily}
        </Text>
        <Text fontSize="md" fontWeight="bold" color={colors.textColor}>
          AaBbCc 0123456789
        </Text>
        <Text fontSize="sm" color={colors.textColorSecondary}>
          The quick brown fox jumps over the lazy dog
        </Text>
      </Box>
      {renderMockup(false, 'Modo Claro')}
      {renderMockup(true, 'Modo Oscuro')}
    </VStack>
  );
};

export const BrandTemplatesAdmin = () => {
  const { getColors, darkMode } = useTheme();
  const { refreshBrand } = useBrand();
  const colors = getColors();

  const [templates, setTemplates] = useState<BrandTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<BrandTemplate | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<BrandTemplate>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await brandTemplateService.getAll();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Google Font in editor for preview
  useEffect(() => {
    if (!formData.fontFamily || formData.fontFamily === 'Inter') return;
    const linkId = 'brand-editor-font';
    let link = document.getElementById(linkId) as HTMLLinkElement | null;
    const url = formData.fontUrl ||
      `https://fonts.googleapis.com/css2?family=${formData.fontFamily.replace(/ /g, '+')}:wght@400;500;600;700&display=swap`;
    if (!link) {
      link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    link.href = url;
  }, [formData.fontFamily, formData.fontUrl]);

  const handleEdit = (template: BrandTemplate) => {
    setEditingTemplate(template);
    setFormData({ ...template });
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsCreating(true);
    setFormData({
      code: '',
      name: '',
      description: '',
      companyName: '',
      companyShortName: '',
      primaryColor: '#0073E6',
      secondaryColor: '#FFB800',
      accentColor: '#2DD4BF',
      sidebarBgColor: '#1A202C',
      sidebarTextColor: '#FFFFFF',
      headerBgColor: '#FFFFFF',
      fontFamily: 'Inter',
      fontUrl: '',
      contentBgColor: '#F7FAFC',
      contentBgColorDark: '#2D3748',
      cardBgColor: '#FFFFFF',
      cardBgColorDark: '#2D3748',
      borderColor: '#E2E8F0',
      borderColorDark: '#4A5568',
      textColor: '#1A202C',
      textColorDark: '#F7FAFC',
      textColorSecondary: '#718096',
      textColorSecondaryDark: '#A0AEC0',
      darkModeEnabled: true,
    });
  };

  const handleCancel = () => {
    setEditingTemplate(null);
    setIsCreating(false);
    setFormData({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (isCreating) {
        const request: CreateBrandTemplateRequest = {
          code: formData.code || '',
          name: formData.name || '',
          description: formData.description,
          companyName: formData.companyName,
          companyShortName: formData.companyShortName,
          logoUrl: formData.logoUrl,
          logoSmallUrl: formData.logoSmallUrl,
          faviconUrl: formData.faviconUrl,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          sidebarBgColor: formData.sidebarBgColor,
          sidebarTextColor: formData.sidebarTextColor,
          headerBgColor: formData.headerBgColor,
          fontFamily: formData.fontFamily,
          fontUrl: formData.fontUrl,
          contentBgColor: formData.contentBgColor,
          contentBgColorDark: formData.contentBgColorDark,
          cardBgColor: formData.cardBgColor,
          cardBgColorDark: formData.cardBgColorDark,
          borderColor: formData.borderColor,
          borderColorDark: formData.borderColorDark,
          textColor: formData.textColor,
          textColorDark: formData.textColorDark,
          textColorSecondary: formData.textColorSecondary,
          textColorSecondaryDark: formData.textColorSecondaryDark,
          darkModeEnabled: formData.darkModeEnabled,
          customCss: formData.customCss,
        };
        await brandTemplateService.create(request);
        toaster.create({
          title: 'Template creado',
          description: 'El template se ha creado exitosamente',
          type: 'success',
          duration: 3000,
        });
      } else if (editingTemplate) {
        const request: UpdateBrandTemplateRequest = {
          name: formData.name,
          description: formData.description,
          companyName: formData.companyName,
          companyShortName: formData.companyShortName,
          logoUrl: formData.logoUrl,
          logoSmallUrl: formData.logoSmallUrl,
          faviconUrl: formData.faviconUrl,
          primaryColor: formData.primaryColor,
          secondaryColor: formData.secondaryColor,
          accentColor: formData.accentColor,
          sidebarBgColor: formData.sidebarBgColor,
          sidebarTextColor: formData.sidebarTextColor,
          headerBgColor: formData.headerBgColor,
          fontFamily: formData.fontFamily,
          fontUrl: formData.fontUrl,
          contentBgColor: formData.contentBgColor,
          contentBgColorDark: formData.contentBgColorDark,
          cardBgColor: formData.cardBgColor,
          cardBgColorDark: formData.cardBgColorDark,
          borderColor: formData.borderColor,
          borderColorDark: formData.borderColorDark,
          textColor: formData.textColor,
          textColorDark: formData.textColorDark,
          textColorSecondary: formData.textColorSecondary,
          textColorSecondaryDark: formData.textColorSecondaryDark,
          darkModeEnabled: formData.darkModeEnabled,
          customCss: formData.customCss,
        };
        await brandTemplateService.update(editingTemplate.id, request);
        toaster.create({
          title: 'Template actualizado',
          description: 'El template se ha actualizado exitosamente',
          type: 'success',
          duration: 3000,
        });
      }
      handleCancel();
      loadData();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (template: BrandTemplate) => {
    try {
      await brandTemplateService.activate(template.id);
      toaster.create({
        title: 'Template activado',
        description: `"${template.name}" es ahora el template activo`,
        type: 'success',
        duration: 3000,
      });
      loadData();
      refreshBrand();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleClone = async (template: BrandTemplate) => {
    const newCode = `${template.code}_COPY`;
    const newName = `${template.name} (Copia)`;
    try {
      await brandTemplateService.clone(template.id, { code: newCode, name: newName });
      toaster.create({
        title: 'Template clonado',
        description: `Se ha creado "${newName}"`,
        type: 'success',
        duration: 3000,
      });
      loadData();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    }
  };

  const handleDelete = async (template: BrandTemplate) => {
    if (!window.confirm(`¿Está seguro de eliminar "${template.name}"?`)) {
      return;
    }
    try {
      await brandTemplateService.delete(template.id);
      toaster.create({
        title: 'Template eliminado',
        description: `"${template.name}" ha sido eliminado`,
        type: 'success',
        duration: 3000,
      });
      loadData();
    } catch (err) {
      toaster.create({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Error desconocido',
        type: 'error',
        duration: 5000,
      });
    }
  };

  const updateField = (field: keyof BrandTemplate, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color={colors.primaryColor} />
      </Flex>
    );
  }

  // Edit/Create Editor
  const renderEditor = () => (
    <Card.Root
      bg={colors.cardBg}
      borderColor={colors.borderColor}
      borderWidth="1px"
      p={4}
      mb={6}
    >
      <VStack gap={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Heading size="md" color={colors.textColor}>
            {isCreating ? 'Nuevo Template' : `Editar: ${editingTemplate?.name}`}
          </Heading>
          <HStack>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              <FiX /> Cancelar
            </Button>
            <Button size="sm" colorScheme="blue" onClick={handleSave} loading={saving}>
              <FiSave /> Guardar
            </Button>
          </HStack>
        </Flex>

        <Flex gap={6} direction={{ base: 'column', xl: 'row' }}>
          {/* Left side - Form sections (60%) */}
          <Box flex="3" minW={0}>
            <VStack gap={3} align="stretch">
              {/* 1. Informacion General */}
              <Section title="Informacion General" colors={colors}>
                <VStack gap={2} align="stretch">
                  {isCreating && (
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Codigo</Text>
                      <Input
                        value={formData.code || ''}
                        onChange={(e) => updateField('code', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                        placeholder="CODIGO_TEMPLATE"
                        size="sm"
                      />
                    </Box>
                  )}
                  <SimpleGrid columns={2} gap={2}>
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Nombre</Text>
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="Nombre del template"
                        size="sm"
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Nombre de Empresa</Text>
                      <Input
                        value={formData.companyName || ''}
                        onChange={(e) => updateField('companyName', e.target.value)}
                        placeholder="Mi Empresa"
                        size="sm"
                      />
                    </Box>
                  </SimpleGrid>
                  <SimpleGrid columns={2} gap={2}>
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Descripcion</Text>
                      <Input
                        value={formData.description || ''}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Descripcion breve"
                        size="sm"
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Nombre Corto</Text>
                      <Input
                        value={formData.companyShortName || ''}
                        onChange={(e) => updateField('companyShortName', e.target.value.substring(0, 10))}
                        placeholder="ME"
                        size="sm"
                        maxLength={10}
                      />
                    </Box>
                  </SimpleGrid>
                </VStack>
              </Section>

              {/* 2. Logos e Iconos */}
              <Section title="Logos e Iconos" defaultOpen={false} colors={colors}>
                <VStack gap={2} align="stretch">
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>URL Logo Principal</Text>
                    <Input
                      value={formData.logoUrl || ''}
                      onChange={(e) => updateField('logoUrl', e.target.value)}
                      placeholder="https://..."
                      size="sm"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>URL Logo Pequeno</Text>
                    <Input
                      value={formData.logoSmallUrl || ''}
                      onChange={(e) => updateField('logoSmallUrl', e.target.value)}
                      placeholder="https://..."
                      size="sm"
                    />
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>URL Favicon</Text>
                    <Input
                      value={formData.faviconUrl || ''}
                      onChange={(e) => updateField('faviconUrl', e.target.value)}
                      placeholder="https://..."
                      size="sm"
                    />
                  </Box>
                  {/* Image previews */}
                  <HStack gap={4} flexWrap="wrap">
                    {formData.logoUrl && (
                      <Box>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>Logo</Text>
                        <Box
                          as="img"
                          src={formData.logoUrl}
                          maxH="40px"
                          maxW="120px"
                          objectFit="contain"
                          borderRadius="sm"
                          bg={colors.hoverBg}
                          p={1}
                        />
                      </Box>
                    )}
                    {formData.logoSmallUrl && (
                      <Box>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>Icono</Text>
                        <Box
                          as="img"
                          src={formData.logoSmallUrl}
                          maxH="32px"
                          maxW="32px"
                          objectFit="contain"
                          borderRadius="sm"
                          bg={colors.hoverBg}
                          p={1}
                        />
                      </Box>
                    )}
                    {formData.faviconUrl && (
                      <Box>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>Favicon</Text>
                        <Box
                          as="img"
                          src={formData.faviconUrl}
                          maxH="24px"
                          maxW="24px"
                          objectFit="contain"
                          borderRadius="sm"
                          bg={colors.hoverBg}
                          p={1}
                        />
                      </Box>
                    )}
                  </HStack>
                </VStack>
              </Section>

              {/* 3. Tipografia */}
              <Section title="Tipografia" icon={<FiType size={14} />} colors={colors}>
                <VStack gap={2} align="stretch">
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>Fuente</Text>
                    <Box
                      as="select"
                      value={formData.fontFamily || 'Inter'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                        updateField('fontFamily', e.target.value);
                        // Auto-generate font URL for known fonts
                        if (e.target.value !== 'Inter') {
                          const encoded = e.target.value.replace(/ /g, '+');
                          updateField('fontUrl', `https://fonts.googleapis.com/css2?family=${encoded}:wght@400;500;600;700&display=swap`);
                        } else {
                          updateField('fontUrl', '');
                        }
                      }}
                      w="100%"
                      h="32px"
                      px={2}
                      fontSize="sm"
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={colors.borderColor}
                      bg={colors.cardBg}
                      color={colors.textColor}
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </Box>
                  </Box>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>URL de fuente personalizada (opcional)</Text>
                    <Input
                      value={formData.fontUrl || ''}
                      onChange={(e) => updateField('fontUrl', e.target.value)}
                      placeholder="https://fonts.googleapis.com/css2?family=..."
                      size="sm"
                    />
                  </Box>
                </VStack>
              </Section>

              {/* 4. Colores Principales */}
              <Section title="Colores Principales" colors={colors}>
                <VStack gap={2} align="stretch">
                  <ColorInput
                    label="Primario"
                    value={formData.primaryColor || '#0073E6'}
                    onChange={(v) => updateField('primaryColor', v)}
                  />
                  <ColorInput
                    label="Secundario"
                    value={formData.secondaryColor || '#FFB800'}
                    onChange={(v) => updateField('secondaryColor', v)}
                  />
                  <ColorInput
                    label="Acento"
                    value={formData.accentColor || '#2DD4BF'}
                    onChange={(v) => updateField('accentColor', v)}
                  />
                </VStack>
              </Section>

              {/* 5. Sidebar y Header */}
              <Section title="Sidebar y Header" colors={colors}>
                <VStack gap={2} align="stretch">
                  <ColorInput
                    label="Fondo Sidebar"
                    value={formData.sidebarBgColor || '#1A202C'}
                    onChange={(v) => updateField('sidebarBgColor', v)}
                  />
                  <ColorInput
                    label="Texto Sidebar"
                    value={formData.sidebarTextColor || '#FFFFFF'}
                    onChange={(v) => updateField('sidebarTextColor', v)}
                  />
                  <ColorInput
                    label="Fondo Header"
                    value={formData.headerBgColor || '#FFFFFF'}
                    onChange={(v) => updateField('headerBgColor', v)}
                  />
                </VStack>
              </Section>

              {/* 6. Contenido Modo Claro */}
              <Section title="Contenido (Modo Claro)" icon={<FiSun size={14} />} colors={colors}>
                <VStack gap={2} align="stretch">
                  <ColorInput
                    label="Fondo Contenido"
                    value={formData.contentBgColor || '#F7FAFC'}
                    onChange={(v) => updateField('contentBgColor', v)}
                  />
                  <ColorInput
                    label="Fondo Cards"
                    value={formData.cardBgColor || '#FFFFFF'}
                    onChange={(v) => updateField('cardBgColor', v)}
                  />
                  <ColorInput
                    label="Bordes"
                    value={formData.borderColor || '#E2E8F0'}
                    onChange={(v) => updateField('borderColor', v)}
                  />
                  <ColorInput
                    label="Texto Principal"
                    value={formData.textColor || '#1A202C'}
                    onChange={(v) => updateField('textColor', v)}
                  />
                  <ColorInput
                    label="Texto Secundario"
                    value={formData.textColorSecondary || '#718096'}
                    onChange={(v) => updateField('textColorSecondary', v)}
                  />
                </VStack>
              </Section>

              {/* 7. Contenido Modo Oscuro */}
              <Section title="Contenido (Modo Oscuro)" icon={<FiMoon size={14} />} defaultOpen={false} colors={colors}>
                <VStack gap={2} align="stretch">
                  <ColorInput
                    label="Fondo Contenido"
                    value={formData.contentBgColorDark || '#2D3748'}
                    onChange={(v) => updateField('contentBgColorDark', v)}
                  />
                  <ColorInput
                    label="Fondo Cards"
                    value={formData.cardBgColorDark || '#2D3748'}
                    onChange={(v) => updateField('cardBgColorDark', v)}
                  />
                  <ColorInput
                    label="Bordes"
                    value={formData.borderColorDark || '#4A5568'}
                    onChange={(v) => updateField('borderColorDark', v)}
                  />
                  <ColorInput
                    label="Texto Principal"
                    value={formData.textColorDark || '#F7FAFC'}
                    onChange={(v) => updateField('textColorDark', v)}
                  />
                  <ColorInput
                    label="Texto Secundario"
                    value={formData.textColorSecondaryDark || '#A0AEC0'}
                    onChange={(v) => updateField('textColorSecondaryDark', v)}
                  />
                </VStack>
              </Section>

              {/* 8. Avanzado */}
              <Section title="Avanzado" defaultOpen={false} colors={colors}>
                <VStack gap={2} align="stretch">
                  <HStack>
                    <Text fontSize="sm" color={colors.textColor}>Modo Oscuro Habilitado</Text>
                    <Box
                      as="input"
                      type="checkbox"
                      checked={formData.darkModeEnabled ?? true}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateField('darkModeEnabled', e.target.checked)
                      }
                      w="18px"
                      h="18px"
                      cursor="pointer"
                    />
                  </HStack>
                  <Box>
                    <Text fontSize="xs" fontWeight="medium" mb={1} color={colors.textColorSecondary}>CSS Personalizado</Text>
                    <Textarea
                      value={formData.customCss || ''}
                      onChange={(e) => updateField('customCss', e.target.value)}
                      placeholder=".mi-clase { color: red; }"
                      size="sm"
                      rows={4}
                      fontFamily="mono"
                      fontSize="xs"
                    />
                  </Box>
                </VStack>
              </Section>
            </VStack>
          </Box>

          {/* Right side - Live Preview (40%) */}
          <Box flex="2" minW={0} position="sticky" top={4} alignSelf="flex-start">
            <LivePreview formData={formData} colors={colors} />
          </Box>
        </Flex>
      </VStack>
    </Card.Root>
  );

  return (
    <Box p={6}>
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack>
            <FiBox size={24} color={colors.primaryColor} />
            <Heading size="lg" color={colors.textColor}>
              Brand Templates
            </Heading>
          </HStack>
          {!isCreating && !editingTemplate && (
            <Button colorScheme="blue" size="sm" onClick={handleCreate}>
              <FiPlus /> Nuevo Template
            </Button>
          )}
        </Flex>

        {/* Description */}
        <Text color={colors.textColorSecondary}>
          Gestiona los templates de marca para personalizar la apariencia de la aplicacion.
          Solo un template puede estar activo a la vez.
        </Text>

        {/* Error */}
        {error && (
          <Box p={4} bg="red.50" borderRadius="md" color="red.600">
            {error}
          </Box>
        )}

        {/* Editor */}
        {(isCreating || editingTemplate) && renderEditor()}

        {/* Templates Grid */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} gap={4}>
          {templates.map((template) => (
            <Card.Root
              key={template.id}
              bg={colors.cardBg}
              borderColor={template.active ? colors.primaryColor : colors.borderColor}
              borderWidth={template.active ? '2px' : '1px'}
              overflow="hidden"
              _hover={{ borderColor: colors.primaryColor, shadow: 'md' }}
              transition="all 0.2s"
            >
              {/* Color preview header */}
              <Flex h="8px">
                <Box flex="1" bg={template.primaryColor} />
                <Box flex="1" bg={template.secondaryColor} />
                <Box flex="1" bg={template.accentColor} />
              </Flex>

              <Card.Body p={4}>
                <VStack align="stretch" gap={3}>
                  {/* Name and badges */}
                  <Flex justify="space-between" align="start">
                    <VStack align="start" gap={1}>
                      <Text fontWeight="bold" color={colors.textColor}>
                        {template.name}
                      </Text>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {template.code}
                      </Text>
                    </VStack>
                    <VStack gap={1}>
                      {template.active && (
                        <Badge colorScheme="green" fontSize="xs">
                          ACTIVO
                        </Badge>
                      )}
                      {template.isDefault && (
                        <Badge colorScheme="blue" fontSize="xs">
                          Sistema
                        </Badge>
                      )}
                    </VStack>
                  </Flex>

                  {/* Description */}
                  {template.description && (
                    <Text fontSize="sm" color={colors.textColorSecondary} noOfLines={2}>
                      {template.description}
                    </Text>
                  )}

                  {/* Company + Font info */}
                  <HStack gap={2} flexWrap="wrap">
                    {template.companyName && (
                      <Text fontSize="xs" color={colors.textColor}>
                        {template.companyName}
                      </Text>
                    )}
                    {template.fontFamily && template.fontFamily !== 'Inter' && (
                      <Badge fontSize="xs" variant="outline">
                        <FiType style={{ marginRight: 2 }} />
                        {template.fontFamily}
                      </Badge>
                    )}
                  </HStack>

                  {/* Color swatches */}
                  <HStack gap={1}>
                    <Box w="20px" h="20px" bg={template.primaryColor} borderRadius="sm" title="Primario" />
                    <Box w="20px" h="20px" bg={template.secondaryColor} borderRadius="sm" title="Secundario" />
                    <Box w="20px" h="20px" bg={template.accentColor} borderRadius="sm" title="Acento" />
                    <Box w="20px" h="20px" bg={template.sidebarBgColor} borderRadius="sm" title="Sidebar" />
                    <Box w="20px" h="20px" bg={template.contentBgColor || '#F7FAFC'} borderRadius="sm" borderWidth="1px" borderColor={colors.borderColor} title="Fondo" />
                  </HStack>

                  {/* Actions */}
                  <HStack justify="space-between" pt={2}>
                    {!template.active ? (
                      <Button
                        size="xs"
                        colorScheme="green"
                        variant="outline"
                        onClick={() => handleActivate(template)}
                      >
                        <FiCheck /> Activar
                      </Button>
                    ) : (
                      <Badge colorScheme="green" variant="solid" px={2} py={1}>
                        <FiCheck /> Activo
                      </Badge>
                    )}
                    <HStack>
                      <IconButton
                        aria-label="Clonar"
                        size="xs"
                        variant="ghost"
                        onClick={() => handleClone(template)}
                      >
                        <FiCopy />
                      </IconButton>
                      {template.isEditable && (
                        <IconButton
                          aria-label="Editar"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                        >
                          <FiEdit2 />
                        </IconButton>
                      )}
                      {!template.isDefault && !template.active && (
                        <IconButton
                          aria-label="Eliminar"
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => handleDelete(template)}
                        >
                          <FiTrash2 />
                        </IconButton>
                      )}
                    </HStack>
                  </HStack>
                </VStack>
              </Card.Body>
            </Card.Root>
          ))}

          {/* Create new card */}
          {!isCreating && !editingTemplate && (
            <Card.Root
              bg="transparent"
              borderColor={colors.borderColor}
              borderWidth="2px"
              borderStyle="dashed"
              cursor="pointer"
              onClick={handleCreate}
              _hover={{ borderColor: colors.primaryColor, bg: colors.hoverBg }}
              transition="all 0.2s"
              minH="200px"
            >
              <Card.Body display="flex" alignItems="center" justifyContent="center">
                <VStack color={colors.textColorSecondary}>
                  <FiPlus size={32} />
                  <Text>Crear Nuevo Template</Text>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default BrandTemplatesAdmin;
