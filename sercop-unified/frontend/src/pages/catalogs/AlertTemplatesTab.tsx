/**
 * AlertTemplatesTab - Tab component for managing event alert templates
 * within the unified Event Configuration page.
 * Defines what alerts are automatically created when events are executed.
 * Uses #{variable} placeholders resolved by TemplateVariableResolverService.
 *
 * Alert types, roles, and event codes are loaded from the database - no hardcoding.
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Input,
  VStack,
  Text,
  Flex,
  Button,
  HStack,
  Badge,
  Spinner,
  Textarea,
  Grid,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
  DialogBackdrop,
  Icon,
} from '@chakra-ui/react';
import { NativeSelectRoot, NativeSelectField } from '@chakra-ui/react/native-select';
import { CheckboxRoot, CheckboxControl, CheckboxLabel } from '@chakra-ui/react/checkbox';
import { FiPlus, FiEdit2, FiTrash2, FiBell, FiZap, FiRefreshCw, FiCalendar } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { eventConfigApi, eventConfigCommands } from '../../services/operationsApi';
import { getAlertTypes, getAvailableRoles } from '../../services/alertService';
import type { AlertTypeConfig, RoleDTO } from '../../services/alertService';
import { userService } from '../../services/userService';
import type { User } from '../../services/userService';
import { notify } from '../../components/ui/toaster';
import type { EventAlertTemplate, EventTypeConfig } from '../../types/operations';
import { DataTable, type DataTableColumn, type DataTableAction } from '../../components/ui/DataTable';
import { VariablePicker, useTemplateVariables } from '../../components/VariablePicker';
import { plantillaCorreoService } from '../../services/emailTemplateService';
import type { PlantillaCorreo } from '../../services/emailTemplateService';
import { plantillaService } from '../../services/templateService';
import type { Plantilla } from '../../services/templateService';

// Requirement levels are domain constants (DB column constraint)
const REQUIREMENT_LEVELS = [
  { value: 'MANDATORY', color: 'red' },
  { value: 'RECOMMENDED', color: 'orange' },
  { value: 'OPTIONAL', color: 'gray' },
];

// Priority levels match alert_priority enum in DB
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'gray',
  NORMAL: 'blue',
  HIGH: 'orange',
  URGENT: 'red',
};

type FormData = Omit<EventAlertTemplate, 'id'>;

const DEFAULT_FORM: FormData = {
  operationType: 'LC_IMPORT',
  eventCode: '',
  alertType: '',
  requirementLevel: 'RECOMMENDED',
  titleTemplate: '',
  descriptionTemplate: '',
  defaultPriority: 'NORMAL',
  assignedRole: '',
  dueDaysOffset: -7,
  dueDateReference: 'EXPIRY_DATE',
  tags: '[]',
  language: 'es',
  displayOrder: 0,
  isActive: true,
  emailTemplateId: undefined,
  documentTemplateId: undefined,
  emailSubject: '',
  emailRecipients: '',
};

// Reference dates for calculating alert due date
const DATE_REFERENCES = [
  { value: 'EXPIRY_DATE', labelEs: 'Fecha de Vencimiento', labelEn: 'Expiry Date', icon: '📅' },
  { value: 'ISSUE_DATE', labelEs: 'Fecha de Emisión', labelEn: 'Issue Date', icon: '📋' },
  { value: 'LATEST_SHIPMENT_DATE', labelEs: 'Fecha de Embarque', labelEn: 'Shipment Date', icon: '🚢' },
  { value: 'EVENT_EXECUTION', labelEs: 'Fecha del Evento', labelEn: 'Event Date', icon: '⚡' },
];

// TEMPLATE_VARIABLES removed — now loaded from DB via useTemplateVariables hook

interface AlertTemplatesTabProps {
  operationType: string;
  language: string;
  /** When provided, only show templates for this event and pre-fill eventCode in create form */
  eventCode?: string;
}

export const AlertTemplatesTab = ({ operationType, language, eventCode }: AlertTemplatesTabProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const { bgColor, primaryColor, textColor, textColorSecondary } = getColors();

  const [templates, setTemplates] = useState<EventAlertTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EventAlertTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [generating, setGenerating] = useState(false);

  // Template variables from DB (replaces hardcoded list)
  const { variables: templateVariables, categoryLabels } = useTemplateVariables();

  // Dynamic data from DB
  const [alertTypeConfigs, setAlertTypeConfigs] = useState<AlertTypeConfig[]>([]);
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([]);
  const [assignMode, setAssignMode] = useState<'role' | 'user'>('role');
  const [emailTemplates, setEmailTemplates] = useState<PlantillaCorreo[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<Plantilla[]>([]);

  const isEs = i18n.language?.startsWith('es');

  // Load reference data (alert types, roles, users, templates) once on mount
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [types, availableRoles, internalUsers, emailTmpls, docTmpls] = await Promise.all([
          getAlertTypes(true),
          getAvailableRoles(),
          userService.getInternalUsers(),
          plantillaCorreoService.getActivePlantillasCorreo().catch(() => [] as PlantillaCorreo[]),
          plantillaService.getAllPlantillas().catch(() => [] as Plantilla[]),
        ]);
        setAlertTypeConfigs(types);
        setRoles(availableRoles);
        setUsers(internalUsers);
        setEmailTemplates(emailTmpls);
        setDocumentTemplates(docTmpls.filter(d => d.activo));
      } catch {
        // Silent - non-critical
      }
    };
    loadReferenceData();
  }, []);

  // Load event types and templates when operation/language changes
  useEffect(() => {
    loadData();
  }, [operationType, language]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [templatesData, eventTypesData] = await Promise.all([
        eventConfigApi.getAlertTemplates(operationType, language),
        eventConfigApi.getEventTypes(operationType, language),
      ]);
      setTemplates(templatesData);
      setEventTypes(eventTypesData);
    } catch {
      notify.error(t('common.error'), t('common.loadError'));
    } finally {
      setLoading(false);
    }
  };

  // Helper to get alert type label from DB config
  const getAlertTypeLabel = useCallback((typeCode: string) => {
    const config = alertTypeConfigs.find(c => c.typeCode === typeCode);
    if (!config) return typeCode;
    return isEs ? config.labelEs : config.labelEn;
  }, [alertTypeConfigs, isEs]);

  const getAlertTypeColor = useCallback((typeCode: string) => {
    const config = alertTypeConfigs.find(c => c.typeCode === typeCode);
    return config?.color || 'gray';
  }, [alertTypeConfigs]);

  const getRoleLabel = useCallback((roleName: string) => {
    if (!roleName) return '-';
    const role = roles.find(r => r.name === roleName);
    return role?.description || roleName;
  }, [roles]);

  const getEventName = useCallback((evtCode: string) => {
    const evt = eventTypes.find(e => e.eventCode === evtCode);
    return evt?.eventName || evtCode;
  }, [eventTypes]);

  const getRequirementColor = (level: string) =>
    REQUIREMENT_LEVELS.find(r => r.value === level)?.color || 'gray';

  const getPriorityColor = (priority: string) =>
    PRIORITY_COLORS[priority] || 'gray';

  // Flat filtered templates for DataTable
  const filteredTemplates = useMemo(() => {
    if (eventCode) {
      return templates.filter(tmpl => tmpl.eventCode === eventCode);
    }
    return templates;
  }, [templates, eventCode]);

  // Count filtered templates for the current eventCode
  const filteredCount = useMemo(() => {
    if (!eventCode) return templates.length;
    return templates.filter(tmpl => tmpl.eventCode === eventCode).length;
  }, [templates, eventCode]);

  // DataTable columns
  const columns = useMemo<DataTableColumn<EventAlertTemplate>[]>(() => {
    const cols: DataTableColumn<EventAlertTemplate>[] = [
      {
        key: 'eventCode',
        label: t('admin.alertTemplates.eventCode', 'Evento'),
        render: (row) => (
          <VStack align="start" gap={0}>
            <Text fontSize="sm" fontWeight="medium">{getEventName(row.eventCode)}</Text>
            <Badge colorPalette="purple" variant="subtle" size="sm">{row.eventCode}</Badge>
          </VStack>
        ),
        filterType: 'select' as const,
        filterOptions: eventTypes.map(et => ({ value: et.eventCode, label: `${et.eventCode} - ${et.eventName}` })),
        minWidth: '150px',
      },
      {
        key: 'alertType',
        label: t('admin.alertTemplates.alertType', 'Tipo Alerta'),
        render: (row) => (
          <Badge colorPalette={getAlertTypeColor(row.alertType)} size="sm">
            {getAlertTypeLabel(row.alertType)}
          </Badge>
        ),
        filterType: 'select' as const,
        filterOptions: alertTypeConfigs.map(at => ({ value: at.typeCode, label: isEs ? at.labelEs : at.labelEn })),
      },
      {
        key: 'titleTemplate',
        label: t('admin.alertTemplates.titleTemplate', 'Titulo Plantilla'),
        render: (row) => (
          <Text truncate title={row.titleTemplate} maxW="250px">{row.titleTemplate}</Text>
        ),
        minWidth: '200px',
      },
      {
        key: 'requirementLevel',
        label: t('admin.alertTemplates.level', 'Nivel'),
        render: (row) => (
          <Badge colorPalette={getRequirementColor(row.requirementLevel)} variant="subtle" size="sm">
            {row.requirementLevel}
          </Badge>
        ),
        filterType: 'select' as const,
        filterOptions: REQUIREMENT_LEVELS.map(rl => ({ value: rl.value, label: rl.value })),
      },
      {
        key: 'defaultPriority',
        label: t('admin.alertTemplates.priority', 'Prioridad'),
        render: (row) => (
          <Badge colorPalette={getPriorityColor(row.defaultPriority)} variant="subtle" size="sm">
            {row.defaultPriority}
          </Badge>
        ),
        filterType: 'select' as const,
        filterOptions: ['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => ({ value: p, label: p })),
      },
      {
        key: 'assignedRole',
        label: t('admin.alertTemplates.role', 'Rol'),
        render: (row) => (
          <Text fontSize="xs" color={textColorSecondary}>{getRoleLabel(row.assignedRole || '')}</Text>
        ),
        hideOnMobile: true,
      },
      {
        key: 'dueDaysOffset',
        label: t('admin.alertTemplates.days', 'Dias'),
        render: (row) => <Text color={textColorSecondary}>{row.dueDaysOffset}d</Text>,
        hideOnMobile: true,
      },
      {
        key: 'isActive',
        label: t('common.status'),
        render: (row) => (
          <Badge colorPalette={row.isActive ? 'green' : 'gray'} size="sm">
            {row.isActive ? t('common.active') : t('common.inactive')}
          </Badge>
        ),
        filterType: 'select' as const,
        filterOptions: [
          { value: 'true', label: t('common.active') },
          { value: 'false', label: t('common.inactive') },
        ],
      },
    ];
    // If eventCode is provided (embedded mode), hide the eventCode column
    if (eventCode) {
      return cols.filter(c => c.key !== 'eventCode');
    }
    return cols;
  }, [t, eventTypes, alertTypeConfigs, isEs, textColorSecondary, getEventName, getAlertTypeLabel, getAlertTypeColor, getRoleLabel, getRequirementColor, getPriorityColor, eventCode]);

  // DataTable actions
  const actions = useMemo<DataTableAction<EventAlertTemplate>[]>(() => [
    {
      key: 'edit',
      label: t('common.edit', 'Editar'),
      icon: FiEdit2,
      onClick: (row) => handleEdit(row),
    },
    {
      key: 'delete',
      label: t('common.delete', 'Eliminar'),
      icon: FiTrash2,
      colorPalette: 'red',
      onClick: (row) => handleDelete(row.id!),
    },
  ], [t]);

  const handleCreateNew = () => {
    setEditingTemplate(null);
    const defaultAlertType = alertTypeConfigs.length > 0 ? alertTypeConfigs[0].typeCode : '';
    setFormData({ ...DEFAULT_FORM, operationType, language, alertType: defaultAlertType, eventCode: eventCode || '' });
    setIsModalOpen(true);
  };

  const handleEdit = (template: EventAlertTemplate) => {
    setEditingTemplate(template);
    // Detect if assigned value looks like a username (contains @) vs role name
    const assignedVal = template.assignedRole || '';
    const isUser = assignedVal.includes('@') || users.some(u => u.username === assignedVal);
    setAssignMode(isUser ? 'user' : 'role');
    setFormData({
      operationType: template.operationType,
      eventCode: template.eventCode,
      alertType: template.alertType,
      requirementLevel: template.requirementLevel,
      titleTemplate: template.titleTemplate,
      descriptionTemplate: template.descriptionTemplate || '',
      defaultPriority: template.defaultPriority,
      assignedRole: assignedVal,
      dueDaysOffset: template.dueDaysOffset,
      dueDateReference: template.dueDateReference || 'EVENT_EXECUTION',
      tags: template.tags || '[]',
      language: template.language,
      displayOrder: template.displayOrder,
      isActive: template.isActive,
      emailTemplateId: template.emailTemplateId,
      documentTemplateId: template.documentTemplateId,
      emailSubject: template.emailSubject || '',
      emailRecipients: template.emailRecipients || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.eventCode || !formData.titleTemplate) {
      notify.error(t('common.error'), t('admin.alertTemplates.requiredFields', 'Event code y titulo son requeridos'));
      return;
    }
    try {
      setSaving(true);
      if (editingTemplate?.id) {
        await eventConfigCommands.updateAlertTemplate(editingTemplate.id, formData as EventAlertTemplate);
      } else {
        await eventConfigCommands.createAlertTemplate(formData as EventAlertTemplate);
      }
      setIsModalOpen(false);
      loadData();
      notify.success(t('common.success'), editingTemplate ? t('common.updated') : t('common.created'));
    } catch (e) {
      notify.error(t('common.error'), e instanceof Error ? e.message : t('common.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('common.confirmDelete'))) return;
    try {
      await eventConfigCommands.deleteAlertTemplate(id);
      loadData();
      notify.success(t('common.success'), t('common.deleted'));
    } catch {
      notify.error(t('common.error'), t('common.deleteError'));
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      if (eventCode) {
        await eventConfigCommands.generateAlertTemplates(operationType, eventCode, language);
      } else {
        await eventConfigCommands.generateAllAlertTemplates(operationType, language);
      }
      await loadData();
      notify.success(t('common.success'), isEs ? 'Plantillas generadas correctamente' : 'Templates generated successfully');
    } catch (e) {
      notify.error(t('common.error'), e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // Empty state for when there are no templates at all
  if (!loading && filteredTemplates.length === 0 && templates.length === 0) {
    return (
      <>
        <VStack align="stretch" gap={4} pt={2}>
          <Flex justify="center" py={10} direction="column" align="center" gap={3}>
            <Flex
              w="56px" h="56px" borderRadius="full"
              bg="blue.500/10" alignItems="center" justifyContent="center"
            >
              <Icon as={FiZap} boxSize={6} color="blue.500" />
            </Flex>
            <Text fontWeight="semibold" color={textColor}>
              {isEs ? 'Sin plantillas configuradas' : 'No templates configured'}
            </Text>
            <Text fontSize="sm" color={textColorSecondary} textAlign="center" maxW="350px">
              {isEs
                ? 'Genera plantillas automaticas basadas en las propiedades del evento, o crea una manualmente.'
                : 'Generate automatic templates based on event properties, or create one manually.'}
            </Text>
            <HStack gap={2} mt={1}>
              <Button size="sm" bg={primaryColor} color="white" onClick={handleGenerate} disabled={generating}>
                {generating ? <Spinner size="sm" mr={2} /> : <FiZap style={{ marginRight: '8px' }} />}
                {isEs ? 'Generar plantillas sugeridas' : 'Generate suggested templates'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleCreateNew}>
                <HStack gap={1}><FiPlus /><Text>{isEs ? 'Crear manual' : 'Create manually'}</Text></HStack>
              </Button>
            </HStack>
          </Flex>
        </VStack>

        {/* Create/Edit Modal */}
        {renderModal()}
      </>
    );
  }

  function renderModal() {
    return (
      <DialogRoot open={isModalOpen} onOpenChange={(e) => setIsModalOpen(e.open)}>
        <DialogBackdrop css={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, maxHeight: '90vh', minWidth: '750px', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader flexShrink={0}>
            <DialogTitle>
              {editingTemplate
                ? t('admin.alertTemplates.edit', 'Editar Plantilla de Alerta')
                : t('admin.alertTemplates.create', 'Nueva Plantilla de Alerta')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody overflowY="auto" flex={1}>
            <VStack gap={4} align="stretch">
              {/* Event Code (from DB) + Alert Type (from DB) */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('admin.alertTemplates.eventCode', 'Codigo de Evento')} *
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.eventCode}
                      onChange={(e) => setFormData({ ...formData, eventCode: e.target.value })}
                      disabled={!!eventCode}
                    >
                      <option value="">{t('common.select', '-- Seleccionar --')}</option>
                      {eventTypes.map(et => (
                        <option key={et.eventCode} value={et.eventCode}>
                          {et.eventCode} - {et.eventName}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('admin.alertTemplates.alertType', 'Tipo de Alerta')} *
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.alertType}
                      onChange={(e) => setFormData({ ...formData, alertType: e.target.value })}
                    >
                      <option value="">{t('common.select', '-- Seleccionar --')}</option>
                      {alertTypeConfigs.map(at => (
                        <option key={at.typeCode} value={at.typeCode}>
                          {isEs ? at.labelEs : at.labelEn}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>

              {/* Email/Document Template Selector (conditional on alertType) */}
              {formData.alertType === 'EMAIL' && (
                <>
                  <Box>
                    <Text mb={1} fontSize="sm" fontWeight="medium">
                      {t('alertTemplates.emailTemplate', 'Plantilla de correo')}
                    </Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={formData.emailTemplateId?.toString() || ''}
                        onChange={(e) => setFormData({ ...formData, emailTemplateId: e.target.value ? Number(e.target.value) : undefined })}
                      >
                        <option value="">{t('alertPreview.selectEmailTemplate', 'Seleccionar plantilla de correo')}</option>
                        {emailTemplates.map(et => (
                          <option key={et.id} value={et.id}>
                            {et.nombre} — {et.asunto}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">
                        {isEs ? 'Asunto del correo' : 'Email subject'}
                      </Text>
                      <Input
                        value={formData.emailSubject || ''}
                        onChange={(e) => setFormData({ ...formData, emailSubject: e.target.value })}
                        placeholder={isEs ? 'Asunto con #{variables}' : 'Subject with #{variables}'}
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm" fontWeight="medium">
                        {isEs ? 'Destinatario(s)' : 'Recipient(s)'}
                      </Text>
                      <Input
                        value={formData.emailRecipients || ''}
                        onChange={(e) => setFormData({ ...formData, emailRecipients: e.target.value })}
                        placeholder={isEs ? 'Ej: #{applicantEmail}, operador@banco.com' : 'E.g.: #{applicantEmail}, operator@bank.com'}
                      />
                    </Box>
                  </Grid>
                </>
              )}
              {formData.alertType === 'GENERATE_DOCUMENT' && (
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('alertTemplates.documentTemplate', 'Plantilla de documento')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.documentTemplateId?.toString() || ''}
                      onChange={(e) => setFormData({ ...formData, documentTemplateId: e.target.value ? Number(e.target.value) : undefined })}
                    >
                      <option value="">{t('alertPreview.selectDocTemplate', 'Seleccionar plantilla de documento')}</option>
                      {documentTemplates.map(dt => (
                        <option key={dt.id} value={dt.id}>
                          {dt.nombre}{dt.tipoDocumento ? ` (${dt.tipoDocumento})` : ''}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              )}

              {/* Title Template */}
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">
                  {t('admin.alertTemplates.titleTemplate', 'Titulo de la Plantilla')} *
                </Text>
                <Input
                  value={formData.titleTemplate}
                  onChange={(e) => setFormData({ ...formData, titleTemplate: e.target.value })}
                  placeholder={t('admin.alertTemplates.titlePlaceholder', 'Ej: Dar seguimiento al aviso de LC #{operationReference}')}
                />
              </Box>

              {/* Description Template */}
              <Box>
                <Text mb={1} fontSize="sm" fontWeight="medium">
                  {t('admin.alertTemplates.descriptionTemplate', 'Descripcion de la Plantilla')}
                </Text>
                <Textarea
                  value={formData.descriptionTemplate}
                  onChange={(e) => setFormData({ ...formData, descriptionTemplate: e.target.value })}
                  rows={3}
                  placeholder={t('admin.alertTemplates.descriptionPlaceholder', 'Ej: Verificar que #{beneficiaryName} recibio el aviso de LC #{operationReference}')}
                />
              </Box>

              {/* Variable picker - loaded from DB catalog */}
              <VariablePicker
                availableVariables={templateVariables}
                categoryLabels={categoryLabels}
                variableSyntax="hash"
                onSelect={(varName) => {
                  // Insert variable at cursor position in title or description
                  setFormData(prev => ({
                    ...prev,
                    titleTemplate: prev.titleTemplate + `#{${varName}}`,
                  }));
                }}
              />

              {/* Requirement Level + Priority */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('admin.alertTemplates.requirementLevel', 'Nivel de Requerimiento')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.requirementLevel}
                      onChange={(e) => setFormData({ ...formData, requirementLevel: e.target.value })}
                    >
                      {REQUIREMENT_LEVELS.map(rl => (
                        <option key={rl.value} value={rl.value}>{rl.value}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">
                    {t('admin.alertTemplates.priority', 'Prioridad')}
                  </Text>
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.defaultPriority}
                      onChange={(e) => setFormData({ ...formData, defaultPriority: e.target.value })}
                    >
                      {['LOW', 'NORMAL', 'HIGH', 'URGENT'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                </Box>
              </Grid>

              {/* Assignment: Role or User */}
              <Box>
                <Flex mb={2} align="center" gap={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    {isEs ? 'Asignar a' : 'Assign to'}
                  </Text>
                  <HStack gap={0} borderRadius="md" overflow="hidden" border="1px solid" borderColor="gray.200" _dark={{ borderColor: 'gray.600' }}>
                    <Button
                      size="xs"
                      variant={assignMode === 'role' ? 'solid' : 'ghost'}
                      colorPalette={assignMode === 'role' ? 'blue' : 'gray'}
                      onClick={() => { setAssignMode('role'); setFormData({ ...formData, assignedRole: '' }); }}
                      borderRadius="0"
                      fontSize="xs"
                    >
                      {isEs ? 'Rol' : 'Role'}
                    </Button>
                    <Button
                      size="xs"
                      variant={assignMode === 'user' ? 'solid' : 'ghost'}
                      colorPalette={assignMode === 'user' ? 'blue' : 'gray'}
                      onClick={() => { setAssignMode('user'); setFormData({ ...formData, assignedRole: '' }); }}
                      borderRadius="0"
                      fontSize="xs"
                    >
                      {isEs ? 'Usuario' : 'User'}
                    </Button>
                  </HStack>
                </Flex>
                {assignMode === 'role' ? (
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.assignedRole}
                      onChange={(e) => setFormData({ ...formData, assignedRole: e.target.value })}
                    >
                      <option value="">{isEs ? '-- Seleccionar rol --' : '-- Select role --'}</option>
                      {roles.map(r => (
                        <option key={r.name} value={r.name}>{r.description || r.name}</option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                ) : (
                  <NativeSelectRoot>
                    <NativeSelectField
                      value={formData.assignedRole}
                      onChange={(e) => setFormData({ ...formData, assignedRole: e.target.value })}
                    >
                      <option value="">{isEs ? '-- Seleccionar usuario --' : '-- Select user --'}</option>
                      {users.map(u => (
                        <option key={u.username} value={u.username}>
                          {u.username} {u.email ? `(${u.email})` : ''}
                        </option>
                      ))}
                    </NativeSelectField>
                  </NativeSelectRoot>
                )}
              </Box>

              {/* Date Calculation Section */}
              <Box
                p={4}
                borderRadius="md"
                border="1px solid"
                borderColor="orange.200"
                bg="orange.50"
                _dark={{ bg: 'orange.900/20', borderColor: 'orange.700' }}
              >
                <HStack gap={2} mb={3}>
                  <FiCalendar style={{ color: '#DD6B20' }} />
                  <Text fontSize="sm" fontWeight="semibold" color="orange.700" _dark={{ color: 'orange.300' }}>
                    {isEs ? 'Cálculo de Fecha de Alerta' : 'Alert Date Calculation'}
                  </Text>
                </HStack>

                <Grid templateColumns="1fr 120px" gap={3} mb={3}>
                  {/* Reference Date */}
                  <Box>
                    <Text mb={1} fontSize="xs" fontWeight="medium" color={textColorSecondary}>
                      {isEs ? 'Fecha de referencia' : 'Reference date'}
                    </Text>
                    <NativeSelectRoot>
                      <NativeSelectField
                        value={formData.dueDateReference || 'EVENT_EXECUTION'}
                        onChange={(e) => setFormData({ ...formData, dueDateReference: e.target.value })}
                      >
                        {DATE_REFERENCES.map(dr => (
                          <option key={dr.value} value={dr.value}>
                            {dr.icon} {isEs ? dr.labelEs : dr.labelEn}
                          </option>
                        ))}
                      </NativeSelectField>
                    </NativeSelectRoot>
                  </Box>

                  {/* Days Offset */}
                  <Box>
                    <Text mb={1} fontSize="xs" fontWeight="medium" color={textColorSecondary}>
                      {isEs ? 'Días de offset' : 'Days offset'}
                    </Text>
                    <Input
                      type="number"
                      value={formData.dueDaysOffset}
                      onChange={(e) => setFormData({ ...formData, dueDaysOffset: parseInt(e.target.value) || 0 })}
                    />
                  </Box>
                </Grid>

                {/* Visual Preview */}
                <Box
                  p={2}
                  borderRadius="sm"
                  bg="white"
                  _dark={{ bg: 'gray.800' }}
                  border="1px dashed"
                  borderColor="orange.300"
                  _dark2={{ borderColor: 'orange.600' }}
                >
                  <Text fontSize="xs" color={textColorSecondary} textAlign="center">
                    {(() => {
                      const ref = DATE_REFERENCES.find(d => d.value === (formData.dueDateReference || 'EVENT_EXECUTION'));
                      const refLabel = ref ? (isEs ? ref.labelEs : ref.labelEn) : '';
                      const offset = formData.dueDaysOffset;
                      if (offset === 0) {
                        return isEs
                          ? `La alerta se creará el mismo día de la ${refLabel}`
                          : `Alert will be created on the same day as ${refLabel}`;
                      }
                      if (offset < 0) {
                        return isEs
                          ? `La alerta se creará ${Math.abs(offset)} día(s) ANTES de la ${refLabel}`
                          : `Alert will be created ${Math.abs(offset)} day(s) BEFORE ${refLabel}`;
                      }
                      return isEs
                        ? `La alerta se creará ${offset} día(s) DESPUÉS de la ${refLabel}`
                        : `Alert will be created ${offset} day(s) AFTER ${refLabel}`;
                    })()}
                  </Text>
                </Box>
              </Box>

              {/* Display order + Tags */}
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">{t('common.order', 'Orden')}</Text>
                  <Input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  />
                </Box>
                <Box>
                  <Text mb={1} fontSize="sm" fontWeight="medium">Tags (JSON)</Text>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder='["urgente","documentacion"]'
                    fontFamily="mono"
                    fontSize="sm"
                  />
                </Box>
              </Grid>

              <CheckboxRoot checked={formData.isActive} onCheckedChange={(e) => setFormData({ ...formData, isActive: !!e.checked })}>
                <CheckboxControl />
                <CheckboxLabel>{t('common.active')}</CheckboxLabel>
              </CheckboxRoot>
            </VStack>
          </DialogBody>
          <DialogFooter>
            <DialogActionTrigger asChild><Button variant="ghost">{t('common.cancel')}</Button></DialogActionTrigger>
            <Button bg={primaryColor} color="white" onClick={handleSave} disabled={saving}>
              {saving && <Spinner size="sm" mr={2} />}
              {editingTemplate ? t('common.update') : t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    );
  }

  return (
    <>
      <DataTable<EventAlertTemplate>
        data={filteredTemplates}
        columns={columns}
        rowKey={(row) => String(row.id ?? `${row.eventCode}-${row.alertType}`)}
        actions={actions}
        isLoading={loading}
        emptyMessage={isEs ? 'Sin plantillas configuradas' : 'No templates configured'}
        emptyIcon={FiBell}
        toolbarRight={
          <HStack gap={2}>
            <Badge colorPalette="blue" variant="subtle">
              {filteredCount} {isEs ? 'plantillas' : 'templates'}
            </Badge>
            {filteredCount > 0 && (
              <Button size="sm" variant="outline" colorPalette="orange" onClick={handleGenerate} disabled={generating}>
                {generating ? <Spinner size="sm" mr={1} /> : <FiRefreshCw style={{ marginRight: '4px' }} />}
                {isEs ? 'Regenerar' : 'Regenerate'}
              </Button>
            )}
            <Button size="sm" bg={primaryColor} color="white" onClick={handleCreateNew}>
              <HStack gap={1}><FiPlus /><Text>{t('common.new')}</Text></HStack>
            </Button>
          </HStack>
        }
      />

      {/* Create/Edit Modal */}
      {renderModal()}
    </>
  );
};

export default AlertTemplatesTab;
