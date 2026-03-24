/**
 * CustomFieldsAdmin Page
 * Admin UI for configuring custom fields: steps, sections, and fields
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
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiChevronDown,
  FiLayers,
  FiLayout,
  FiEdit,
  FiMove,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiSettings,
  FiDatabase,
  FiGrid,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { notify } from '../components/ui/toaster';
import { get, post, put, del } from '../utils/apiClient';

// Types
interface CustomFieldStep {
  id: string;
  stepCode: string;
  stepNameKey: string;
  stepDescriptionKey?: string;
  productType: string;
  tenantId?: string;
  displayOrder: number;
  icon?: string;
  showInWizard: boolean;
  showInExpert: boolean;
  showInCustom: boolean;
  showInView: boolean;
  embedMode: string;
  embedSwiftStep?: string;
  isActive: boolean;
  sections?: CustomFieldSection[];
}

interface CustomFieldSection {
  id: string;
  sectionCode: string;
  sectionNameKey: string;
  sectionDescriptionKey?: string;
  stepId: string;
  sectionType: 'SINGLE' | 'REPEATABLE';
  minRows?: number;
  maxRows?: number;
  displayOrder: number;
  collapsible: boolean;
  defaultCollapsed: boolean;
  columns: number;
  embedMode: string;
  embedTargetType?: string;
  embedTargetCode?: string;
  embedShowSeparator: boolean;
  embedCollapsible: boolean;
  embedSeparatorTitleKey?: string;
  showInWizard: boolean;
  showInExpert: boolean;
  showInCustom: boolean;
  showInView: boolean;
  isActive: boolean;
  fields?: CustomField[];
}

interface CustomField {
  id: string;
  fieldCode: string;
  fieldNameKey: string;
  fieldDescriptionKey?: string;
  sectionId: string;
  fieldType: string;
  componentType: string;
  dataSourceType?: string;
  dataSourceCode?: string;
  dataSourceFilters?: string;
  displayOrder: number;
  placeholderKey?: string;
  helpTextKey?: string;
  spanColumns: number;
  isRequired: boolean;
  requiredCondition?: string;
  validationRules?: string;
  dependencies?: string;
  defaultValue?: string;
  defaultValueExpression?: string;
  fieldOptions?: string;
  embedAfterSwiftField?: string;
  embedInline: boolean;
  showInWizard: boolean;
  showInExpert: boolean;
  showInCustom: boolean;
  showInView: boolean;
  showInList: boolean;
  isActive: boolean;
  // Field Mapping (Portal → Operation)
  mapsToProductType?: string;
  mapsToFieldCode?: string;
  mapsToSwiftTag?: string;
  mapsToSwiftLine?: number;
  mappingTransformation?: string;
  mappingParams?: string;
}

// Component type options
const COMPONENT_TYPES = [
  { value: 'TEXT_INPUT', label: 'Texto', category: 'BASIC' },
  { value: 'NUMBER_INPUT', label: 'Número', category: 'BASIC' },
  { value: 'DATE_PICKER', label: 'Fecha', category: 'BASIC' },
  { value: 'DATETIME_PICKER', label: 'Fecha y Hora', category: 'BASIC' },
  { value: 'SELECT', label: 'Lista Desplegable', category: 'BASIC' },
  { value: 'RADIO', label: 'Opciones (Radio)', category: 'BASIC' },
  { value: 'CHECKBOX', label: 'Casilla de Verificación', category: 'BASIC' },
  { value: 'MULTILINE_TEXT', label: 'Texto Multilínea', category: 'BASIC' },
  { value: 'PERCENTAGE', label: 'Porcentaje', category: 'BASIC' },
  { value: 'CURRENCY_AMOUNT', label: 'Monto con Moneda', category: 'BASIC' },
  { value: 'EMAIL', label: 'Correo Electrónico', category: 'BASIC' },
  { value: 'PHONE', label: 'Teléfono', category: 'BASIC' },
  { value: 'CATALOG_LISTBOX', label: 'Catálogo Personalizado', category: 'DATA_SOURCE' },
  { value: 'USER_LISTBOX', label: 'Lista de Usuarios', category: 'DATA_SOURCE' },
  { value: 'BANK_SELECTOR', label: 'Selector de Banco', category: 'DATA_SOURCE' },
  { value: 'PARTICIPANT_SELECTOR', label: 'Selector de Participante', category: 'DATA_SOURCE' },
  { value: 'CLIENT_SELECTOR', label: 'Selector de Cliente', category: 'DATA_SOURCE' },
  { value: 'COUNTRY_SELECT', label: 'Selector de País', category: 'SPECIAL' },
  { value: 'CURRENCY_SELECT', label: 'Selector de Moneda', category: 'SPECIAL' },
  { value: 'TAGS_INPUT', label: 'Etiquetas', category: 'SPECIAL' },
  { value: 'FILE_UPLOAD', label: 'Carga de Archivo', category: 'SPECIAL' },
];

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Fecha' },
  { value: 'BOOLEAN', label: 'Booleano' },
  { value: 'SELECT', label: 'Selección' },
  { value: 'TEXTAREA', label: 'Área de Texto' },
];

const PRODUCT_TYPES = [
  { value: 'ALL', label: 'Todos los Productos' },
  // Productos internos (para operadores)
  { value: 'LC_IMPORT', label: 'LC Importación' },
  { value: 'LC_EXPORT', label: 'LC Exportación' },
  { value: 'GUARANTEE', label: 'Garantía' },
  { value: 'STANDBY_LC', label: 'Standby LC' },
  { value: 'COLLECTION', label: 'Cobranza' },
  // Portal de Cliente
  { value: 'CLIENT_LC_IMPORT_REQUEST', label: '🌐 Portal: Solicitud LC Importación' },
  { value: 'CLIENT_LC_EXPORT_REQUEST', label: '🌐 Portal: Solicitud LC Exportación' },
  { value: 'CLIENT_GUARANTEE_REQUEST', label: '🌐 Portal: Solicitud Garantía' },
  { value: 'CLIENT_COLLECTION_REQUEST', label: '🌐 Portal: Solicitud Cobranza' },
];

const EMBED_MODES = [
  { value: 'SEPARATE_STEP', label: 'Paso Separado' },
  { value: 'EMBEDDED_IN_SWIFT', label: 'Embebido en SWIFT' },
];

const SECTION_EMBED_MODES = [
  { value: 'NONE', label: 'Ninguno' },
  { value: 'AFTER_SECTION', label: 'Después de Sección' },
  { value: 'BEFORE_SECTION', label: 'Antes de Sección' },
  { value: 'AFTER_FIELD', label: 'Después de Campo' },
  { value: 'BEFORE_FIELD', label: 'Antes de Campo' },
];

const SWIFT_SECTIONS = [
  { value: 'BASICA', label: 'Información Básica' },
  { value: 'MONTOS', label: 'Montos' },
  { value: 'FECHAS', label: 'Fechas' },
  { value: 'BANCOS', label: 'Bancos' },
  { value: 'PARTIES', label: 'Partes' },
  { value: 'MERCANCIAS', label: 'Mercancías' },
  { value: 'DOCUMENTOS', label: 'Documentos' },
  { value: 'CONDICIONES', label: 'Condiciones' },
  { value: 'TRANSPORTE', label: 'Transporte' },
];

// Catalog item interface
interface CatalogItem {
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  displayOrder: number;
  metadata?: string;
}

export const CustomFieldsAdmin = () => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'steps' | 'preview'>('steps');
  const [selectedProductType, setSelectedProductType] = useState<string>('ALL');

  // Catalogs for mapping (loaded from API)
  const [mappingTargetProducts, setMappingTargetProducts] = useState<CatalogItem[]>([]);
  const [mappingTransformations, setMappingTransformations] = useState<CatalogItem[]>([]);
  const [swiftTags, setSwiftTags] = useState<CatalogItem[]>([]);

  // Data
  const [steps, setSteps] = useState<CustomFieldStep[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Modal state
  const [stepModalOpen, setStepModalOpen] = useState(false);
  const [sectionModalOpen, setSectionModalOpen] = useState(false);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<CustomFieldStep | null>(null);
  const [editingSection, setEditingSection] = useState<CustomFieldSection | null>(null);
  const [editingField, setEditingField] = useState<CustomField | null>(null);
  const [parentStepId, setParentStepId] = useState<string | null>(null);
  const [parentSectionId, setParentSectionId] = useState<string | null>(null);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'step' | 'section' | 'field'; item: CustomFieldStep | CustomFieldSection | CustomField } | null>(null);

  // Form data for step
  const [stepFormData, setStepFormData] = useState({
    stepCode: '',
    stepNameKey: '',
    stepDescriptionKey: '',
    productType: 'ALL',
    displayOrder: 0,
    icon: 'FiFileText',
    showInWizard: true,
    showInExpert: true,
    showInCustom: true,
    showInView: true,
    embedMode: 'SEPARATE_STEP',
    embedSwiftStep: '',
    isActive: true,
  });

  // Form data for section
  const [sectionFormData, setSectionFormData] = useState({
    sectionCode: '',
    sectionNameKey: '',
    sectionDescriptionKey: '',
    sectionType: 'SINGLE' as 'SINGLE' | 'REPEATABLE',
    minRows: 0,
    maxRows: 100,
    displayOrder: 0,
    collapsible: false,
    defaultCollapsed: false,
    columns: 2,
    embedMode: 'NONE',
    embedTargetType: '',
    embedTargetCode: '',
    embedShowSeparator: true,
    embedCollapsible: false,
    embedSeparatorTitleKey: '',
    showInWizard: true,
    showInExpert: true,
    showInCustom: true,
    showInView: true,
    isActive: true,
  });

  // Form data for field
  const [fieldFormData, setFieldFormData] = useState({
    fieldCode: '',
    fieldNameKey: '',
    fieldDescriptionKey: '',
    fieldType: 'TEXT',
    componentType: 'TEXT_INPUT',
    dataSourceType: '',
    dataSourceCode: '',
    dataSourceFilters: '',
    displayOrder: 0,
    placeholderKey: '',
    helpTextKey: '',
    spanColumns: 1,
    isRequired: false,
    requiredCondition: '',
    validationRules: '',
    dependencies: '',
    defaultValue: '',
    defaultValueExpression: '',
    fieldOptions: '',
    embedAfterSwiftField: '',
    embedInline: false,
    showInWizard: true,
    showInExpert: true,
    showInCustom: true,
    showInView: true,
    showInList: false,
    isActive: true,
    // Field Mapping
    mapsToProductType: '',
    mapsToFieldCode: '',
    mapsToSwiftTag: '',
    mapsToSwiftLine: 0,
    mappingTransformation: '',
    mappingParams: '',
  });

  // Styles
  const cardStyles = {
    p: 4,
    borderRadius: 'lg',
    bg: isDark ? 'whiteAlpha.50' : 'white',
    borderWidth: '1px',
    borderColor: isDark ? 'whiteAlpha.100' : 'gray.200',
    _hover: { borderColor: isDark ? 'whiteAlpha.200' : 'gray.300' },
  };

  const headerStyles = {
    p: 3,
    borderRadius: 'md',
    bg: isDark ? 'whiteAlpha.100' : 'gray.50',
    cursor: 'pointer',
  };

  // Load mapping catalogs on mount
  useEffect(() => {
    loadMappingCatalogs();
  }, []);

  // Load data
  useEffect(() => {
    loadSteps();
  }, [selectedProductType]);

  const loadMappingCatalogs = async () => {
    try {
      // Load all three mapping catalogs in parallel
      const [productsRes, transformsRes, tagsRes] = await Promise.all([
        get('/catalogs/MAPPING_TARGET_PRODUCTS/items'),
        get('/catalogs/MAPPING_TRANSFORMATIONS/items'),
        get('/catalogs/SWIFT_TAGS/items'),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setMappingTargetProducts(data);
      }
      if (transformsRes.ok) {
        const data = await transformsRes.json();
        setMappingTransformations(data);
      }
      if (tagsRes.ok) {
        const data = await tagsRes.json();
        setSwiftTags(data);
      }
    } catch (error) {
      console.error('Error loading mapping catalogs:', error);
    }
  };

  const loadSteps = async () => {
    try {
      setLoading(true);
      const response = await get(
        `/custom-fields/config/steps?productType=${selectedProductType}`
      );
      if (!response.ok) {
        throw new Error('Failed to load steps');
      }
      const data = await response.json();
      setSteps(data);
    } catch (error) {
      notify.error(t('common.error'), t('customFieldsAdmin.errorLoading'));
      console.error('Error loading steps:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSectionsForStep = async (stepId: string) => {
    try {
      const response = await get(
        `/custom-fields/config/sections?stepId=${stepId}`
      );
      if (!response.ok) {
        throw new Error('Failed to load sections');
      }
      const data = await response.json();
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, sections: data } : s
        )
      );
    } catch (error) {
      console.error('Error loading sections:', error);
    }
  };

  const loadFieldsForSection = async (sectionId: string) => {
    try {
      const response = await get(
        `/custom-fields/config/fields?sectionId=${sectionId}`
      );
      if (!response.ok) {
        throw new Error('Failed to load fields');
      }
      const data = await response.json();
      setSteps((prev) =>
        prev.map((step) => ({
          ...step,
          sections: step.sections?.map((section) =>
            section.id === sectionId
              ? { ...section, fields: data }
              : section
          ),
        }))
      );
    } catch (error) {
      console.error('Error loading fields:', error);
    }
  };

  // Toggle expansions
  const toggleStep = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
      // Load sections if not already loaded
      const step = steps.find((s) => s.id === stepId);
      if (step && !step.sections) {
        loadSectionsForStep(stepId);
      }
    }
    setExpandedSteps(newExpanded);
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
      // Load fields if not already loaded
      steps.forEach((step) => {
        const section = step.sections?.find((s) => s.id === sectionId);
        if (section && !section.fields) {
          loadFieldsForSection(sectionId);
        }
      });
    }
    setExpandedSections(newExpanded);
  };

  // Open modals
  const openStepModal = (step?: CustomFieldStep) => {
    if (step) {
      setEditingStep(step);
      setStepFormData({
        stepCode: step.stepCode,
        stepNameKey: step.stepNameKey,
        stepDescriptionKey: step.stepDescriptionKey || '',
        productType: step.productType,
        displayOrder: step.displayOrder,
        icon: step.icon || 'FiFileText',
        showInWizard: step.showInWizard,
        showInExpert: step.showInExpert,
        showInCustom: step.showInCustom,
        showInView: step.showInView,
        embedMode: step.embedMode,
        embedSwiftStep: step.embedSwiftStep || '',
        isActive: step.isActive,
      });
    } else {
      setEditingStep(null);
      setStepFormData({
        stepCode: '',
        stepNameKey: '',
        stepDescriptionKey: '',
        productType: selectedProductType,
        displayOrder: steps.length * 10,
        icon: 'FiFileText',
        showInWizard: true,
        showInExpert: true,
        showInCustom: true,
        showInView: true,
        embedMode: 'SEPARATE_STEP',
        embedSwiftStep: '',
        isActive: true,
      });
    }
    setStepModalOpen(true);
  };

  const openSectionModal = (stepId: string, section?: CustomFieldSection) => {
    setParentStepId(stepId);
    if (section) {
      setEditingSection(section);
      setSectionFormData({
        sectionCode: section.sectionCode,
        sectionNameKey: section.sectionNameKey,
        sectionDescriptionKey: section.sectionDescriptionKey || '',
        sectionType: section.sectionType,
        minRows: section.minRows || 0,
        maxRows: section.maxRows || 100,
        displayOrder: section.displayOrder,
        collapsible: section.collapsible,
        defaultCollapsed: section.defaultCollapsed,
        columns: section.columns,
        embedMode: section.embedMode,
        embedTargetType: section.embedTargetType || '',
        embedTargetCode: section.embedTargetCode || '',
        embedShowSeparator: section.embedShowSeparator,
        embedCollapsible: section.embedCollapsible,
        embedSeparatorTitleKey: section.embedSeparatorTitleKey || '',
        showInWizard: section.showInWizard,
        showInExpert: section.showInExpert,
        showInCustom: section.showInCustom,
        showInView: section.showInView,
        isActive: section.isActive,
      });
    } else {
      setEditingSection(null);
      const step = steps.find((s) => s.id === stepId);
      const sectionsCount = step?.sections?.length || 0;
      setSectionFormData({
        sectionCode: '',
        sectionNameKey: '',
        sectionDescriptionKey: '',
        sectionType: 'SINGLE',
        minRows: 0,
        maxRows: 100,
        displayOrder: sectionsCount * 10,
        collapsible: false,
        defaultCollapsed: false,
        columns: 2,
        embedMode: 'NONE',
        embedTargetType: '',
        embedTargetCode: '',
        embedShowSeparator: true,
        embedCollapsible: false,
        embedSeparatorTitleKey: '',
        showInWizard: true,
        showInExpert: true,
        showInCustom: true,
        showInView: true,
        isActive: true,
      });
    }
    setSectionModalOpen(true);
  };

  const openFieldModal = (sectionId: string, field?: CustomField) => {
    setParentSectionId(sectionId);
    if (field) {
      setEditingField(field);
      setFieldFormData({
        fieldCode: field.fieldCode,
        fieldNameKey: field.fieldNameKey,
        fieldDescriptionKey: field.fieldDescriptionKey || '',
        fieldType: field.fieldType,
        componentType: field.componentType,
        dataSourceType: field.dataSourceType || '',
        dataSourceCode: field.dataSourceCode || '',
        dataSourceFilters: field.dataSourceFilters || '',
        displayOrder: field.displayOrder,
        placeholderKey: field.placeholderKey || '',
        helpTextKey: field.helpTextKey || '',
        spanColumns: field.spanColumns,
        isRequired: field.isRequired,
        requiredCondition: field.requiredCondition || '',
        validationRules: field.validationRules || '',
        dependencies: field.dependencies || '',
        defaultValue: field.defaultValue || '',
        defaultValueExpression: field.defaultValueExpression || '',
        fieldOptions: field.fieldOptions || '',
        embedAfterSwiftField: field.embedAfterSwiftField || '',
        embedInline: field.embedInline,
        showInWizard: field.showInWizard,
        showInExpert: field.showInExpert,
        showInCustom: field.showInCustom,
        showInView: field.showInView,
        showInList: field.showInList,
        isActive: field.isActive,
        // Field Mapping
        mapsToProductType: field.mapsToProductType || '',
        mapsToFieldCode: field.mapsToFieldCode || '',
        mapsToSwiftTag: field.mapsToSwiftTag || '',
        mapsToSwiftLine: field.mapsToSwiftLine || 0,
        mappingTransformation: field.mappingTransformation || '',
        mappingParams: field.mappingParams || '',
      });
    } else {
      setEditingField(null);
      // Find section to get fields count
      let fieldsCount = 0;
      steps.forEach((step) => {
        const section = step.sections?.find((s) => s.id === sectionId);
        if (section) {
          fieldsCount = section.fields?.length || 0;
        }
      });
      setFieldFormData({
        fieldCode: '',
        fieldNameKey: '',
        fieldDescriptionKey: '',
        fieldType: 'TEXT',
        componentType: 'TEXT_INPUT',
        dataSourceType: '',
        dataSourceCode: '',
        dataSourceFilters: '',
        displayOrder: fieldsCount * 10,
        placeholderKey: '',
        helpTextKey: '',
        spanColumns: 1,
        isRequired: false,
        requiredCondition: '',
        validationRules: '',
        dependencies: '',
        defaultValue: '',
        defaultValueExpression: '',
        fieldOptions: '',
        embedAfterSwiftField: '',
        embedInline: false,
        showInWizard: true,
        showInExpert: true,
        showInCustom: true,
        showInView: true,
        showInList: false,
        isActive: true,
        // Field Mapping
        mapsToProductType: '',
        mapsToFieldCode: '',
        mapsToSwiftTag: '',
        mapsToSwiftLine: 0,
        mappingTransformation: '',
        mappingParams: '',
      });
    }
    setFieldModalOpen(true);
  };

  // Save handlers
  const handleSaveStep = async () => {
    try {
      setSaving(true);
      let response;
      if (editingStep) {
        response = await put(`/custom-fields/config/steps/${editingStep.id}`, stepFormData);
      } else {
        response = await post('/custom-fields/config/steps', stepFormData);
      }
      if (!response.ok) {
        throw new Error('Failed to save step');
      }
      notify.success(t('common.success'), editingStep ? t('customFieldsAdmin.stepUpdated') : t('customFieldsAdmin.stepCreated'));
      setStepModalOpen(false);
      loadSteps();
    } catch (error) {
      notify.error(t('common.error'), t('customFieldsAdmin.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSection = async () => {
    try {
      setSaving(true);
      const payload = { ...sectionFormData, stepId: parentStepId };
      let response;
      if (editingSection) {
        response = await put(`/custom-fields/config/sections/${editingSection.id}`, payload);
      } else {
        response = await post('/custom-fields/config/sections', payload);
      }
      if (!response.ok) {
        throw new Error('Failed to save section');
      }
      notify.success(t('common.success'), editingSection ? t('customFieldsAdmin.sectionUpdated') : t('customFieldsAdmin.sectionCreated'));
      setSectionModalOpen(false);
      if (parentStepId) {
        loadSectionsForStep(parentStepId);
      }
    } catch (error) {
      notify.error(t('common.error'), t('customFieldsAdmin.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveField = async () => {
    try {
      setSaving(true);
      let response;
      if (editingField) {
        // For updates, don't send sectionId (section can't change)
        response = await put(`/custom-fields/config/fields/${editingField.id}`, fieldFormData);
      } else {
        // For create, include sectionId
        const payload = { ...fieldFormData, sectionId: parentSectionId };
        response = await post('/custom-fields/config/fields', payload);
      }
      if (!response.ok) {
        throw new Error('Failed to save field');
      }
      notify.success(t('common.success'), editingField ? t('customFieldsAdmin.fieldUpdated') : t('customFieldsAdmin.fieldCreated'));
      setFieldModalOpen(false);
      if (parentSectionId) {
        loadFieldsForSection(parentSectionId);
      }
    } catch (error) {
      notify.error(t('common.error'), t('customFieldsAdmin.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  // Delete handlers
  const confirmDelete = (type: 'step' | 'section' | 'field', item: CustomFieldStep | CustomFieldSection | CustomField) => {
    setItemToDelete({ type, item });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setSaving(true);
      const { type, item } = itemToDelete;
      const response = await del(`/custom-fields/config/${type}s/${item.id}`);
      if (!response.ok) {
        throw new Error('Failed to delete');
      }
      notify.success(t('common.success'), t('customFieldsAdmin.deleted'));
      setDeleteDialogOpen(false);
      setItemToDelete(null);
      loadSteps();
    } catch (error) {
      notify.error(t('common.error'), t('customFieldsAdmin.errorDeleting'));
    } finally {
      setSaving(false);
    }
  };

  // Render step card
  const renderStepCard = (step: CustomFieldStep) => {
    const isExpanded = expandedSteps.has(step.id);

    return (
      <Box key={step.id} {...cardStyles} mb={3}>
        {/* Step Header */}
        <HStack
          {...headerStyles}
          onClick={() => toggleStep(step.id)}
          justify="space-between"
        >
          <HStack>
            <IconButton
              aria-label="Expand"
              size="sm"
              variant="ghost"
            >
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </IconButton>
            <FiLayers color={colors.primaryColor} />
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontWeight="bold" color={colors.textColor}>
                  {step.stepCode}
                </Text>
                <Badge colorPalette={step.isActive ? 'green' : 'gray'} variant="subtle">
                  {step.isActive ? t('common.active') : t('common.inactive')}
                </Badge>
                {step.embedMode === 'EMBEDDED_IN_SWIFT' && (
                  <Badge colorPalette="blue" variant="subtle">
                    {t('customFieldsAdmin.embeddedIn')} {step.embedSwiftStep}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color={colors.textColor} opacity={0.7}>
                {t(step.stepNameKey, step.stepCode)}
              </Text>
            </VStack>
          </HStack>

          <HStack onClick={(e) => e.stopPropagation()} gap={2}>
            <Badge colorPalette="purple" variant="subtle">
              {step.productType}
            </Badge>
            <Box
              as="button"
              p={1}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'gray.100' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openStepModal(step);
              }}
              title="Editar paso"
            >
              <FiEdit2 size={16} />
            </Box>
            <Box
              as="button"
              p={1}
              borderRadius="md"
              cursor="pointer"
              color="red.500"
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'red.50' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                confirmDelete('step', step);
              }}
              title="Eliminar paso"
            >
              <FiTrash2 size={16} />
            </Box>
          </HStack>
        </HStack>

        {/* Sections */}
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content>
            <VStack align="stretch" mt={3} ml={6} gap={2}>
              {step.sections?.map((section) => renderSectionCard(step.id, section))}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => openSectionModal(step.id)}
                w="full"
              >
                <FiPlus />
                {t('customFieldsAdmin.addSection')}
              </Button>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    );
  };

  // Render section card
  const renderSectionCard = (stepId: string, section: CustomFieldSection) => {
    const isExpanded = expandedSections.has(section.id);

    return (
      <Box
        key={section.id}
        p={3}
        borderRadius="md"
        bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
        borderWidth="1px"
        borderColor={isDark ? 'whiteAlpha.100' : 'gray.100'}
      >
        {/* Section Header */}
        <HStack
          justify="space-between"
          cursor="pointer"
          onClick={() => toggleSection(section.id)}
        >
          <HStack>
            <IconButton
              aria-label="Expand"
              size="xs"
              variant="ghost"
            >
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </IconButton>
            <FiLayout color={isDark ? '#60A5FA' : '#3B82F6'} />
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontWeight="medium" fontSize="sm" color={colors.textColor}>
                  {section.sectionCode}
                </Text>
                {section.sectionType === 'REPEATABLE' && (
                  <Badge colorPalette="orange" variant="subtle" size="sm">
                    <FiGrid />
                    {t('customFieldsAdmin.repeatable')}
                  </Badge>
                )}
              </HStack>
              <Text fontSize="xs" color={colors.textColor} opacity={0.7}>
                {t(section.sectionNameKey, section.sectionCode)}
              </Text>
            </VStack>
          </HStack>

          <HStack onClick={(e) => e.stopPropagation()} gap={2}>
            <Box
              as="button"
              p={1}
              borderRadius="md"
              cursor="pointer"
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'gray.100' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                openSectionModal(stepId, section);
              }}
              title="Editar sección"
            >
              <FiEdit2 size={14} />
            </Box>
            <Box
              as="button"
              p={1}
              borderRadius="md"
              cursor="pointer"
              color="red.500"
              _hover={{ bg: isDark ? 'whiteAlpha.200' : 'red.50' }}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                confirmDelete('section', section);
              }}
              title="Eliminar sección"
            >
              <FiTrash2 size={14} />
            </Box>
          </HStack>
        </HStack>

        {/* Fields */}
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content>
            <VStack align="stretch" mt={2} ml={6} gap={1}>
              {section.fields?.map((field) => renderFieldRow(section.id, field))}

              <Button
                size="xs"
                variant="ghost"
                onClick={() => openFieldModal(section.id)}
                w="full"
              >
                <FiPlus />
                {t('customFieldsAdmin.addField')}
              </Button>
            </VStack>
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    );
  };

  // Render field row
  const renderFieldRow = (sectionId: string, field: CustomField) => {
    const componentInfo = COMPONENT_TYPES.find((c) => c.value === field.componentType);

    return (
      <HStack
        key={field.id}
        p={2}
        borderRadius="sm"
        bg={isDark ? 'whiteAlpha.50' : 'white'}
        borderWidth="1px"
        borderColor={isDark ? 'whiteAlpha.50' : 'gray.50'}
        justify="space-between"
      >
        <HStack>
          <FiEdit color={isDark ? '#A78BFA' : '#8B5CF6'} size={14} />
          <Text fontSize="sm" color={colors.textColor}>
            {field.fieldCode}
          </Text>
          <Badge colorPalette="gray" variant="subtle" size="sm">
            {componentInfo?.label || field.componentType}
          </Badge>
          {field.isRequired && (
            <Badge colorPalette="red" variant="subtle" size="sm">
              *
            </Badge>
          )}
          {field.dataSourceType && (
            <Badge colorPalette="cyan" variant="subtle" size="sm">
              <FiDatabase size={10} />
              {field.dataSourceCode}
            </Badge>
          )}
        </HStack>

        <HStack gap={2}>
          <Box
            as="button"
            p={1}
            borderRadius="md"
            cursor="pointer"
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'gray.100' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              openFieldModal(sectionId, field);
            }}
            title="Editar campo"
          >
            <FiEdit2 size={12} />
          </Box>
          <Box
            as="button"
            p={1}
            borderRadius="md"
            cursor="pointer"
            color="red.500"
            _hover={{ bg: isDark ? 'whiteAlpha.200' : 'red.50' }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              confirmDelete('field', field);
            }}
            title="Eliminar campo"
          >
            <FiTrash2 size={12} />
          </Box>
        </HStack>
      </HStack>
    );
  };

  // Loading state
  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color="blue.400" />
      </Flex>
    );
  }

  return (
    <Box p={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <VStack align="start" gap={1}>
          <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
            {t('customFieldsAdmin.title', 'Campos Personalizados')}
          </Text>
          <Text color={colors.textColor} opacity={0.7}>
            {t('customFieldsAdmin.subtitle', 'Configure campos adicionales para operaciones')}
          </Text>
        </VStack>

        <HStack>
          <NativeSelectRoot size="sm" w="200px">
            <NativeSelectField
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
            >
              {PRODUCT_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>
                  {pt.label}
                </option>
              ))}
            </NativeSelectField>
          </NativeSelectRoot>

          <Button colorPalette="blue" onClick={() => openStepModal()}>
            <FiPlus />
            {t('customFieldsAdmin.addStep')}
          </Button>
        </HStack>
      </Flex>

      {/* Steps List */}
      <VStack align="stretch" gap={3}>
        {steps.length === 0 ? (
          <Box
            p={8}
            textAlign="center"
            borderRadius="lg"
            bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
          >
            <FiLayers size={48} color={colors.textColor} style={{ margin: '0 auto', opacity: 0.3 }} />
            <Text mt={4} color={colors.textColor} opacity={0.7}>
              {t('customFieldsAdmin.noSteps', 'No hay pasos configurados')}
            </Text>
            <Button mt={4} colorPalette="blue" onClick={() => openStepModal()}>
              <FiPlus />
              {t('customFieldsAdmin.createFirstStep', 'Crear Primer Paso')}
            </Button>
          </Box>
        ) : (
          steps.map((step) => renderStepCard(step))
        )}
      </VStack>

      {/* Step Modal */}
      <DialogRoot open={stepModalOpen} onOpenChange={(e) => setStepModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent
          maxW="600px"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingStep
                ? t('customFieldsAdmin.editStep', 'Editar Paso')
                : t('customFieldsAdmin.createStep', 'Crear Paso')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.stepCode', 'Código')} *
                  </Text>
                  <Input
                    value={stepFormData.stepCode}
                    onChange={(e) => setStepFormData({ ...stepFormData, stepCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                    placeholder="ADDITIONAL_INFO"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.displayOrder', 'Orden')}
                  </Text>
                  <Input
                    type="number"
                    value={stepFormData.displayOrder}
                    onChange={(e) => setStepFormData({ ...stepFormData, displayOrder: Number(e.target.value) })}
                  />
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="sm" mb={1} color={colors.textColor}>
                  {t('customFieldsAdmin.nameKey', 'Clave de Nombre i18n')} *
                </Text>
                <Input
                  value={stepFormData.stepNameKey}
                  onChange={(e) => setStepFormData({ ...stepFormData, stepNameKey: e.target.value })}
                  placeholder="customFields.steps.MY_STEP.name"
                />
              </Box>

              <Box>
                <Text fontSize="sm" mb={1} color={colors.textColor}>
                  {t('customFieldsAdmin.descriptionKey', 'Clave de Descripción i18n')}
                </Text>
                <Input
                  value={stepFormData.stepDescriptionKey}
                  onChange={(e) => setStepFormData({ ...stepFormData, stepDescriptionKey: e.target.value })}
                  placeholder="customFields.steps.MY_STEP.description"
                />
              </Box>

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.productType', 'Producto')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={stepFormData.productType}
                      onChange={(e) => setStepFormData({ ...stepFormData, productType: e.target.value })}
                    >
                      {PRODUCT_TYPES.map((pt) => (
                        <option key={pt.value} value={pt.value}>
                          {pt.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.embedMode', 'Modo de Embed')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={stepFormData.embedMode}
                      onChange={(e) => setStepFormData({ ...stepFormData, embedMode: e.target.value })}
                    >
                      {EMBED_MODES.map((em) => (
                        <option key={em.value} value={em.value}>
                          {em.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </SimpleGrid>

              {stepFormData.embedMode === 'EMBEDDED_IN_SWIFT' && (
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.embedSwiftStep', 'Paso SWIFT a Embeber')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={stepFormData.embedSwiftStep}
                      onChange={(e) => setStepFormData({ ...stepFormData, embedSwiftStep: e.target.value })}
                    >
                      <option value="">Seleccione...</option>
                      {SWIFT_SECTIONS.map((ss) => (
                        <option key={ss.value} value={ss.value}>
                          {ss.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              )}

              {/* Visibility toggles */}
              <Box>
                <Text fontSize="sm" mb={2} color={colors.textColor}>
                  {t('customFieldsAdmin.visibility', 'Visibilidad')}
                </Text>
                <SimpleGrid columns={4} gap={4}>
                  <HStack>
                    <Switch.Root
                      checked={stepFormData.showInWizard}
                      onCheckedChange={(e) => setStepFormData({ ...stepFormData, showInWizard: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Wizard</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={stepFormData.showInExpert}
                      onCheckedChange={(e) => setStepFormData({ ...stepFormData, showInExpert: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Expert</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={stepFormData.showInCustom}
                      onCheckedChange={(e) => setStepFormData({ ...stepFormData, showInCustom: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Custom</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={stepFormData.showInView}
                      onCheckedChange={(e) => setStepFormData({ ...stepFormData, showInView: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">View</Text>
                  </HStack>
                </SimpleGrid>
              </Box>

              <HStack>
                <Switch.Root
                  checked={stepFormData.isActive}
                  onCheckedChange={(e) => setStepFormData({ ...stepFormData, isActive: e.checked })}
                >
                  <Switch.HiddenInput />
                  <Switch.Control><Switch.Thumb /></Switch.Control>
                </Switch.Root>
                <Text fontSize="sm" color={colors.textColor}>
                  {t('customFieldsAdmin.active', 'Activo')}
                </Text>
              </HStack>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setStepModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSaveStep}
              loading={saving}
              disabled={!stepFormData.stepCode || !stepFormData.stepNameKey}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Section Modal */}
      <DialogRoot open={sectionModalOpen} onOpenChange={(e) => setSectionModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent
          maxW="700px"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingSection
                ? t('customFieldsAdmin.editSection', 'Editar Sección')
                : t('customFieldsAdmin.createSection', 'Crear Sección')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.sectionCode', 'Código')} *
                  </Text>
                  <Input
                    value={sectionFormData.sectionCode}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, sectionCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                    placeholder="MY_SECTION"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.sectionType', 'Tipo')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={sectionFormData.sectionType}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, sectionType: e.target.value as 'SINGLE' | 'REPEATABLE' })}
                    >
                      <option value="SINGLE">{t('customFieldsAdmin.single', 'Simple')}</option>
                      <option value="REPEATABLE">{t('customFieldsAdmin.repeatable', 'Repetible')}</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="sm" mb={1} color={colors.textColor}>
                  {t('customFieldsAdmin.nameKey', 'Clave de Nombre i18n')} *
                </Text>
                <Input
                  value={sectionFormData.sectionNameKey}
                  onChange={(e) => setSectionFormData({ ...sectionFormData, sectionNameKey: e.target.value })}
                  placeholder="customFields.sections.MY_SECTION.name"
                />
              </Box>

              {sectionFormData.sectionType === 'REPEATABLE' && (
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.minRows', 'Mínimo Filas')}
                    </Text>
                    <Input
                      type="number"
                      value={sectionFormData.minRows}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, minRows: Number(e.target.value) })}
                    />
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.maxRows', 'Máximo Filas')}
                    </Text>
                    <Input
                      type="number"
                      value={sectionFormData.maxRows}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, maxRows: Number(e.target.value) })}
                    />
                  </Box>
                </SimpleGrid>
              )}

              <SimpleGrid columns={3} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.columns', 'Columnas')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={sectionFormData.columns}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, columns: Number(e.target.value) })}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                      <option value={3}>3</option>
                      <option value={4}>4</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.displayOrder', 'Orden')}
                  </Text>
                  <Input
                    type="number"
                    value={sectionFormData.displayOrder}
                    onChange={(e) => setSectionFormData({ ...sectionFormData, displayOrder: Number(e.target.value) })}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.embedMode', 'Embed')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={sectionFormData.embedMode}
                      onChange={(e) => setSectionFormData({ ...sectionFormData, embedMode: e.target.value })}
                    >
                      {SECTION_EMBED_MODES.map((em) => (
                        <option key={em.value} value={em.value}>
                          {em.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </SimpleGrid>

              {sectionFormData.embedMode !== 'NONE' && (
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.embedTargetType', 'Tipo de Destino')}
                    </Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={sectionFormData.embedTargetType}
                        onChange={(e) => setSectionFormData({ ...sectionFormData, embedTargetType: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        <option value="SECTION">Sección</option>
                        <option value="FIELD">Campo</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.embedTargetCode', 'Código de Destino')}
                    </Text>
                    {sectionFormData.embedTargetType === 'SECTION' ? (
                      <NativeSelectRoot>
                        <NativeSelectField
                          value={sectionFormData.embedTargetCode}
                          onChange={(e) => setSectionFormData({ ...sectionFormData, embedTargetCode: e.target.value })}
                        >
                          <option value="">Seleccione...</option>
                          {SWIFT_SECTIONS.map((ss) => (
                            <option key={ss.value} value={ss.value}>
                              {ss.label}
                            </option>
                          ))}
                        </NativeSelectField>
                      </NativeSelectRoot>
                    ) : (
                      <Input
                        value={sectionFormData.embedTargetCode}
                        onChange={(e) => setSectionFormData({ ...sectionFormData, embedTargetCode: e.target.value })}
                        placeholder="Código del campo SWIFT"
                      />
                    )}
                  </Box>
                </SimpleGrid>
              )}

              <SimpleGrid columns={2} gap={4}>
                <HStack>
                  <Switch.Root
                    checked={sectionFormData.collapsible}
                    onCheckedChange={(e) => setSectionFormData({ ...sectionFormData, collapsible: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                  <Text fontSize="sm">{t('customFieldsAdmin.collapsible', 'Colapsable')}</Text>
                </HStack>
                <HStack>
                  <Switch.Root
                    checked={sectionFormData.isActive}
                    onCheckedChange={(e) => setSectionFormData({ ...sectionFormData, isActive: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                  <Text fontSize="sm">{t('customFieldsAdmin.active', 'Activo')}</Text>
                </HStack>
              </SimpleGrid>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSectionModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSaveSection}
              loading={saving}
              disabled={!sectionFormData.sectionCode || !sectionFormData.sectionNameKey}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Field Modal */}
      <DialogRoot open={fieldModalOpen} onOpenChange={(e) => setFieldModalOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent
          maxW="800px"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingField
                ? t('customFieldsAdmin.editField', 'Editar Campo')
                : t('customFieldsAdmin.createField', 'Crear Campo')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <SimpleGrid columns={3} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.fieldCode', 'Código')} *
                  </Text>
                  <Input
                    value={fieldFormData.fieldCode}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, fieldCode: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '') })}
                    placeholder="MY_FIELD"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.fieldType', 'Tipo de Dato')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={fieldFormData.fieldType}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, fieldType: e.target.value })}
                    >
                      {FIELD_TYPES.map((ft) => (
                        <option key={ft.value} value={ft.value}>
                          {ft.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.componentType', 'Componente')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={fieldFormData.componentType}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, componentType: e.target.value })}
                    >
                      {COMPONENT_TYPES.map((ct) => (
                        <option key={ct.value} value={ct.value}>
                          {ct.label}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="sm" mb={1} color={colors.textColor}>
                  {t('customFieldsAdmin.nameKey', 'Clave de Nombre i18n')} *
                </Text>
                <Input
                  value={fieldFormData.fieldNameKey}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, fieldNameKey: e.target.value })}
                  placeholder="customFields.fields.MY_FIELD.name"
                />
              </Box>

              {/* Data source for CATALOG_LISTBOX / USER_LISTBOX */}
              {['CATALOG_LISTBOX', 'USER_LISTBOX', 'BANK_SELECTOR', 'PARTICIPANT_SELECTOR', 'CLIENT_SELECTOR'].includes(fieldFormData.componentType) && (
                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.dataSourceType', 'Tipo de Fuente')}
                    </Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={fieldFormData.dataSourceType}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, dataSourceType: e.target.value })}
                      >
                        <option value="">Seleccione...</option>
                        <option value="CATALOG">Catálogo</option>
                        <option value="USER">Usuario</option>
                        <option value="API">API</option>
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.dataSourceCode', 'Código de Catálogo')}
                    </Text>
                    <Input
                      value={fieldFormData.dataSourceCode}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, dataSourceCode: e.target.value })}
                      placeholder="ID_TYPES, RISK_CATEGORIES, etc."
                    />
                  </Box>
                </SimpleGrid>
              )}

              {/* Options for SELECT */}
              {fieldFormData.componentType === 'SELECT' && (
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.fieldOptions', 'Opciones (JSON)')}
                  </Text>
                  <Textarea
                    value={fieldFormData.fieldOptions}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, fieldOptions: e.target.value })}
                    placeholder='[{"value": "A", "labelKey": "customFields.options.myField.A"}]'
                    rows={3}
                  />
                </Box>
              )}

              <SimpleGrid columns={3} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.displayOrder', 'Orden')}
                  </Text>
                  <Input
                    type="number"
                    value={fieldFormData.displayOrder}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, displayOrder: Number(e.target.value) })}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.spanColumns', 'Columnas')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={fieldFormData.spanColumns}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, spanColumns: Number(e.target.value) })}
                    >
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.defaultValue', 'Valor Por Defecto')}
                  </Text>
                  <Input
                    value={fieldFormData.defaultValue}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, defaultValue: e.target.value })}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={2} gap={4}>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.placeholderKey', 'Clave de Placeholder i18n')}
                  </Text>
                  <Input
                    value={fieldFormData.placeholderKey}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, placeholderKey: e.target.value })}
                    placeholder="customFields.fields.MY_FIELD.placeholder"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" mb={1} color={colors.textColor}>
                    {t('customFieldsAdmin.helpTextKey', 'Clave de Ayuda i18n')}
                  </Text>
                  <Input
                    value={fieldFormData.helpTextKey}
                    onChange={(e) => setFieldFormData({ ...fieldFormData, helpTextKey: e.target.value })}
                    placeholder="customFields.fields.MY_FIELD.helpText"
                  />
                </Box>
              </SimpleGrid>

              <Box>
                <Text fontSize="sm" mb={1} color={colors.textColor}>
                  {t('customFieldsAdmin.validationRules', 'Reglas de Validación (JSON)')}
                </Text>
                <Textarea
                  value={fieldFormData.validationRules}
                  onChange={(e) => setFieldFormData({ ...fieldFormData, validationRules: e.target.value })}
                  placeholder='{"maxLength": 200, "pattern": "^[A-Z]+$"}'
                  rows={2}
                />
              </Box>

              {/* Field Mapping Section - Portal → Operation */}
              <Box
                p={3}
                borderRadius="md"
                bg={isDark ? 'whiteAlpha.100' : 'blue.50'}
                borderWidth="1px"
                borderColor={isDark ? 'blue.700' : 'blue.200'}
              >
                <HStack mb={3}>
                  <FiDatabase color={isDark ? '#60A5FA' : '#3B82F6'} />
                  <Text fontWeight="medium" color={colors.textColor}>
                    {t('customFieldsAdmin.fieldMapping', 'Mapeo a Operación')}
                  </Text>
                  <Badge colorPalette="blue" variant="subtle" size="sm">
                    Portal → SWIFT
                  </Badge>
                </HStack>

                <SimpleGrid columns={2} gap={4}>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.mapsToProductType', 'Producto Destino')}
                    </Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={fieldFormData.mapsToProductType}
                        onChange={(e) => setFieldFormData({ ...fieldFormData, mapsToProductType: e.target.value })}
                      >
                        <option value="">Sin mapeo</option>
                        {mappingTargetProducts.map((pt) => (
                          <option key={pt.itemCode} value={pt.itemCode}>
                            {pt.itemName}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                  <Box>
                    <Text fontSize="sm" mb={1} color={colors.textColor}>
                      {t('customFieldsAdmin.mapsToFieldCode', 'Campo Destino')}
                    </Text>
                    <Input
                      value={fieldFormData.mapsToFieldCode}
                      onChange={(e) => setFieldFormData({ ...fieldFormData, mapsToFieldCode: e.target.value.toUpperCase() })}
                      placeholder="F59_BENEFICIARY_NAME"
                      disabled={!fieldFormData.mapsToProductType}
                    />
                  </Box>
                </SimpleGrid>

                {fieldFormData.mapsToProductType && (
                  <>
                    <SimpleGrid columns={3} gap={4} mt={3}>
                      <Box>
                        <Text fontSize="sm" mb={1} color={colors.textColor}>
                          {t('customFieldsAdmin.mapsToSwiftTag', 'Tag SWIFT')}
                        </Text>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={fieldFormData.mapsToSwiftTag}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, mapsToSwiftTag: e.target.value })}
                          >
                            <option value="">Sin tag SWIFT</option>
                            {swiftTags.map((tag) => (
                              <option key={tag.itemCode} value={tag.itemCode}>
                                {tag.itemName}
                              </option>
                            ))}
                          </NativeSelectField>
                        </NativeSelectRoot>
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1} color={colors.textColor}>
                          {t('customFieldsAdmin.mapsToSwiftLine', 'Línea SWIFT')}
                        </Text>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={fieldFormData.mapsToSwiftLine}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, mapsToSwiftLine: Number(e.target.value) })}
                          >
                            <option value={0}>N/A</option>
                            <option value={1}>Línea 1</option>
                            <option value={2}>Línea 2</option>
                            <option value={3}>Línea 3</option>
                            <option value={4}>Línea 4</option>
                          </NativeSelectField>
                        </NativeSelectRoot>
                      </Box>
                      <Box>
                        <Text fontSize="sm" mb={1} color={colors.textColor}>
                          {t('customFieldsAdmin.mappingTransformation', 'Transformación')}
                        </Text>
                        <NativeSelectRoot>
                          <NativeSelectField
                            value={fieldFormData.mappingTransformation}
                            onChange={(e) => setFieldFormData({ ...fieldFormData, mappingTransformation: e.target.value })}
                          >
                            <option value="">Sin transformación</option>
                            {mappingTransformations.map((tr) => (
                              <option key={tr.itemCode} value={tr.itemCode}>
                                {tr.itemName}
                              </option>
                            ))}
                          </NativeSelectField>
                        </NativeSelectRoot>
                      </Box>
                    </SimpleGrid>

                    {/* Show params field if transformation requires params (check metadata) */}
                    {mappingTransformations.find(t => t.itemCode === fieldFormData.mappingTransformation)?.metadata?.includes('requiresParams') && (
                      <Box mt={3}>
                        <Text fontSize="sm" mb={1} color={colors.textColor}>
                          {t('customFieldsAdmin.mappingParams', 'Parámetros de Transformación (JSON)')}
                        </Text>
                        <Textarea
                          value={fieldFormData.mappingParams}
                          onChange={(e) => setFieldFormData({ ...fieldFormData, mappingParams: e.target.value })}
                          placeholder='{"param1": "value1", "param2": "value2"}'
                          rows={2}
                        />
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {mappingTransformations.find(t => t.itemCode === fieldFormData.mappingTransformation)?.itemDescription}
                        </Text>
                      </Box>
                    )}
                  </>
                )}
              </Box>

              {/* Toggles */}
              <SimpleGrid columns={3} gap={4}>
                <HStack>
                  <Switch.Root
                    checked={fieldFormData.isRequired}
                    onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, isRequired: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                  <Text fontSize="sm">{t('customFieldsAdmin.required', 'Obligatorio')}</Text>
                </HStack>
                <HStack>
                  <Switch.Root
                    checked={fieldFormData.showInList}
                    onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, showInList: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                  <Text fontSize="sm">{t('customFieldsAdmin.showInList', 'Mostrar en Lista')}</Text>
                </HStack>
                <HStack>
                  <Switch.Root
                    checked={fieldFormData.isActive}
                    onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, isActive: e.checked })}
                  >
                    <Switch.HiddenInput />
                    <Switch.Control><Switch.Thumb /></Switch.Control>
                  </Switch.Root>
                  <Text fontSize="sm">{t('customFieldsAdmin.active', 'Activo')}</Text>
                </HStack>
              </SimpleGrid>

              {/* Visibility */}
              <Box>
                <Text fontSize="sm" mb={2} color={colors.textColor}>
                  {t('customFieldsAdmin.visibility', 'Visibilidad')}
                </Text>
                <SimpleGrid columns={4} gap={4}>
                  <HStack>
                    <Switch.Root
                      checked={fieldFormData.showInWizard}
                      onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, showInWizard: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Wizard</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={fieldFormData.showInExpert}
                      onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, showInExpert: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Expert</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={fieldFormData.showInCustom}
                      onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, showInCustom: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">Custom</Text>
                  </HStack>
                  <HStack>
                    <Switch.Root
                      checked={fieldFormData.showInView}
                      onCheckedChange={(e) => setFieldFormData({ ...fieldFormData, showInView: e.checked })}
                    >
                      <Switch.HiddenInput />
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch.Root>
                    <Text fontSize="sm">View</Text>
                  </HStack>
                </SimpleGrid>
              </Box>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setFieldModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              colorPalette="blue"
              onClick={handleSaveField}
              loading={saving}
              disabled={!fieldFormData.fieldCode || !fieldFormData.fieldNameKey}
            >
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>

      {/* Delete Confirmation Dialog */}
      <DialogRoot open={deleteDialogOpen} onOpenChange={(e) => setDeleteDialogOpen(e.open)}>
        <DialogBackdrop />
        <DialogContent
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <DialogHeader>
            <DialogTitle>{t('common.confirmDelete', 'Confirmar Eliminación')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            <Text color={colors.textColor}>
              {t('customFieldsAdmin.deleteConfirmation', '¿Está seguro de que desea eliminar este elemento? Esta acción no se puede deshacer.')}
            </Text>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button colorPalette="red" onClick={handleDelete} loading={saving}>
              {t('common.delete', 'Eliminar')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default CustomFieldsAdmin;
