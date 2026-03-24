import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Icon,
  Spinner,
  Center,
  Flex,
  Switch,
  Button,
  Textarea,
  Input,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogBackdrop,
} from '@chakra-ui/react';
import {
  FiBell,
  FiLock,
  FiAlertCircle,
  FiEdit2,
  FiMessageSquare,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiX,
  FiMail,
  FiFileText,
  FiEye,
  FiDownload,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { useAlertPreview } from '../../hooks/useAlertPreview';
import { getAvailableRoles } from '../../services/alertService';
import { getAlertTypes } from '../../services/alertService';
import type { RoleDTO, AlertTypeConfig } from '../../services/alertService';
import { eventConfigApi } from '../../services/operationsApi';
import { userService } from '../../services/userService';
import type { User } from '../../services/userService';
import type { EventAlertTemplate } from '../../types/operations';
import { plantillaCorreoService } from '../../services/emailTemplateService';
import type { PlantillaCorreo } from '../../services/emailTemplateService';
import { plantillaService } from '../../services/templateService';
import type { Plantilla } from '../../services/templateService';
import { HtmlEmailEditor } from '../HtmlEmailEditor';
import { notify } from '../ui/toaster';

export interface CustomAlert {
  tempId: string;
  title: string;
  dueDate: string;
  priority: string;
  note: string;
  assignedTo: string;
  alertType?: string;
  emailTemplateId?: number;
  documentTemplateId?: number;
}

export interface AlertPreviewStepProps {
  operationType: string;
  eventCode?: string;
  swiftFieldsData: Record<string, any>;
  swiftConfigs?: import('../../types/swiftField').SwiftFieldConfig[];
  selectedAlertIds?: Set<number>;
  onSelectedAlertsChange?: (ids: Set<number>) => void;
  notes?: Record<number, string>;
  onNotesChange?: (notes: Record<number, string>) => void;
  dateOverrides?: Record<number, string>;
  onDateOverridesChange?: (dates: Record<number, string>) => void;
  generalNote?: string;
  onGeneralNoteChange?: (note: string) => void;
  customAlerts?: CustomAlert[];
  onCustomAlertsChange?: (alerts: CustomAlert[]) => void;
  emailEdits?: Record<string, { subject: string; body: string }>;
  onEmailEditsChange?: (edits: Record<string, { subject: string; body: string }>) => void;
  documentVariableEdits?: Record<string, Record<string, string>>;
  onDocumentVariableEditsChange?: (edits: Record<string, Record<string, string>>) => void;
  language?: string;
  variant?: 'full' | 'compact';
}

const PRIORITY_COLORS: Record<string, { bar: string; dot: string; bg: string }> = {
  URGENT: { bar: '#E53E3E', dot: '#C53030', bg: 'rgba(229,62,62,0.15)' },
  HIGH: { bar: '#DD6B20', dot: '#C05621', bg: 'rgba(221,107,32,0.15)' },
  NORMAL: { bar: '#3182CE', dot: '#2B6CB0', bg: 'rgba(49,130,206,0.12)' },
  LOW: { bar: '#A0AEC0', dot: '#718096', bg: 'rgba(160,174,192,0.12)' },
};

const PRIORITY_COLORS_DARK: Record<string, { bar: string; dot: string; bg: string }> = {
  URGENT: { bar: '#FC8181', dot: '#FEB2B2', bg: 'rgba(252,129,129,0.2)' },
  HIGH: { bar: '#F6AD55', dot: '#FBD38D', bg: 'rgba(246,173,85,0.2)' },
  NORMAL: { bar: '#63B3ED', dot: '#90CDF4', bg: 'rgba(99,179,237,0.15)' },
  LOW: { bar: '#A0AEC0', dot: '#CBD5E0', bg: 'rgba(160,174,192,0.15)' },
};

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
}

function toInputDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

// Row data common to templates and custom alerts
interface GanttRow {
  key: string;
  title: string;
  priority: string;
  alertType: string;
  date: Date | null;
  role: string;
  isMandatory: boolean;
  isCustom: boolean;
  isSelected: boolean;
  noteValue: string;
  // For templates
  templateId?: number;
  emailTemplateId?: number;
  documentTemplateId?: number;
  // Raw templates for variable extraction in preview
  rawTitleTemplate?: string;
  rawDescriptionTemplate?: string;
  // Email-specific fields
  emailSubject?: string;
  emailRecipients?: string;
  // For custom alerts
  customTempId?: string;
}

const ALERT_TYPE_COLORS: Record<string, string> = {
  DEADLINE: 'red',
  TASK: 'blue',
  FOLLOW_UP: 'orange',
  REMINDER: 'purple',
  NOTIFICATION: 'gray',
  EMAIL: 'cyan',
  GENERATE_DOCUMENT: 'teal',
};

// Resolve ${var} placeholders in text using swiftFieldsData
function resolveVariables(text: string, data: Record<string, any>): string {
  return text.replace(/\$\{([^}]+)\}/g, (_match, varName) => {
    return data[varName] != null ? String(data[varName]) : `\${${varName}}`;
  });
}

export const AlertPreviewStep: React.FC<AlertPreviewStepProps> = ({
  operationType,
  eventCode,
  swiftFieldsData,
  swiftConfigs,
  selectedAlertIds: externalSelectedIds,
  onSelectedAlertsChange,
  notes: externalNotes,
  onNotesChange,
  dateOverrides: externalDateOverrides,
  onDateOverridesChange,
  generalNote: externalGeneralNote,
  onGeneralNoteChange,
  customAlerts: externalCustomAlerts,
  onCustomAlertsChange,
  emailEdits: externalEmailEdits,
  onEmailEditsChange,
  documentVariableEdits: externalDocVariableEdits,
  onDocumentVariableEditsChange,
  language = 'es',
  variant = 'full',
}) => {
  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const [internalGeneralNote, setInternalGeneralNote] = useState('');
  const [internalNotes, setInternalNotes] = useState<Record<number, string>>({});
  const [internalDateOverrides, setInternalDateOverrides] = useState<Record<number, string>>({});
  const [internalCustomAlerts, setInternalCustomAlerts] = useState<CustomAlert[]>([]);
  const [internalEmailEdits, setInternalEmailEdits] = useState<Record<string, { subject: string; body: string }>>({});
  const [internalDocVariableEdits, setInternalDocVariableEdits] = useState<Record<string, Record<string, string>>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showNewAlertForm, setShowNewAlertForm] = useState(false);
  const [newAlertTitle, setNewAlertTitle] = useState('');
  const [newAlertDate, setNewAlertDate] = useState('');
  const [newAlertPriority, setNewAlertPriority] = useState('NORMAL');
  const [newAlertNote, setNewAlertNote] = useState('');
  const [newAlertAssignedTo, setNewAlertAssignedTo] = useState('');
  const [newAlertType, setNewAlertType] = useState('TASK');
  const [newAlertEmailTemplateId, setNewAlertEmailTemplateId] = useState<number | undefined>();
  const [newAlertDocTemplateId, setNewAlertDocTemplateId] = useState<number | undefined>();
  const [availableRoles, setAvailableRoles] = useState<RoleDTO[]>([]);
  const [internalUsers, setInternalUsers] = useState<User[]>([]);
  const [alertTypeConfigs, setAlertTypeConfigs] = useState<AlertTypeConfig[]>([]);
  const [eventName, setEventName] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'role' | 'user'>('role');

  // Email/Document templates for selectors and preview
  const [emailTemplatesList, setEmailTemplatesList] = useState<PlantillaCorreo[]>([]);
  const [documentTemplatesList, setDocumentTemplatesList] = useState<Plantilla[]>([]);

  // Preview modal state
  const [previewModalKey, setPreviewModalKey] = useState<string | null>(null);
  const [previewEmailData, setPreviewEmailData] = useState<{ subject: string; body: string; recipients?: string; cc?: string } | null>(null);
  const [previewDocData, setPreviewDocData] = useState<{ name: string; variables: Record<string, string>; documentTemplateId?: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generatingDoc, setGeneratingDoc] = useState(false);

  const isEs = language?.startsWith('es') ?? true;

  useEffect(() => {
    getAvailableRoles().then(setAvailableRoles).catch(() => {});
    getAlertTypes(true).then(setAlertTypeConfigs).catch(() => {});
    userService.getInternalUsers().then(setInternalUsers).catch(() => {});
    plantillaCorreoService.getActivePlantillasCorreo().then(setEmailTemplatesList).catch(() => {});
    plantillaService.getAllPlantillas().then(list => setDocumentTemplatesList(list.filter(d => d.activo))).catch(() => {});
  }, []);

  // Load event name for the stage badge
  useEffect(() => {
    if (!operationType) return;
    const code = eventCode;
    if (!code) return;
    eventConfigApi.getEventTypes(operationType, language).then(types => {
      const found = types.find(t => t.eventCode === code);
      if (found) setEventName(found.eventName);
    }).catch(() => {});
  }, [operationType, eventCode, language]);

  const {
    templates,
    mandatoryTemplates,
    suggestedTemplates,
    loading,
    error,
    selectedAlertIds: internalSelectedIds,
    toggleAlert: internalToggle,
    selectAllSuggested: internalSelectAll,
    deselectAllSuggested: internalDeselectAll,
    resolveTemplate,
    getEstimatedDate,
  } = useAlertPreview({ operationType, eventCode, swiftFieldsData, swiftConfigs, language });

  const selectedIds = externalSelectedIds ?? internalSelectedIds;
  const generalNote = externalGeneralNote ?? internalGeneralNote;
  const notes = externalNotes ?? internalNotes;
  const dateOverrides = externalDateOverrides ?? internalDateOverrides;
  const customAlerts = externalCustomAlerts ?? internalCustomAlerts;
  const emailEdits = externalEmailEdits ?? internalEmailEdits;
  const documentVariableEdits = externalDocVariableEdits ?? internalDocVariableEdits;

  const handleToggle = (id: number) => {
    if (onSelectedAlertsChange) {
      const tmpl = templates.find(t => t.id === id);
      if (tmpl?.requirementLevel === 'MANDATORY') return;
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id); else next.add(id);
      onSelectedAlertsChange(next);
    } else {
      internalToggle(id);
    }
  };

  const handleSelectAll = () => {
    if (onSelectedAlertsChange) {
      const next = new Set(selectedIds);
      suggestedTemplates.forEach(t => { if (t.id != null) next.add(t.id); });
      onSelectedAlertsChange(next);
    } else {
      internalSelectAll();
    }
  };

  const handleDeselectAll = () => {
    if (onSelectedAlertsChange) {
      const next = new Set<number>();
      mandatoryTemplates.forEach(t => { if (t.id != null && selectedIds.has(t.id)) next.add(t.id); });
      onSelectedAlertsChange(next);
    } else {
      internalDeselectAll();
    }
  };

  const handleGeneralNoteChange = (val: string) => {
    if (onGeneralNoteChange) onGeneralNoteChange(val);
    else setInternalGeneralNote(val);
  };

  const handleNoteChange = (id: number, val: string) => {
    const updated = { ...notes, [id]: val };
    if (onNotesChange) onNotesChange(updated);
    else setInternalNotes(updated);
  };

  const handleDateOverride = (id: number, val: string) => {
    const updated = { ...dateOverrides, [id]: val };
    if (onDateOverridesChange) onDateOverridesChange(updated);
    else setInternalDateOverrides(updated);
  };

  const handleAddCustomAlert = () => {
    if (!newAlertTitle.trim()) return;
    const alert: CustomAlert = {
      tempId: `custom_${Date.now()}`,
      title: newAlertTitle.trim(),
      dueDate: newAlertDate,
      priority: newAlertPriority,
      note: newAlertNote.trim(),
      assignedTo: newAlertAssignedTo,
      alertType: newAlertType,
      emailTemplateId: newAlertType === 'EMAIL' ? newAlertEmailTemplateId : undefined,
      documentTemplateId: newAlertType === 'GENERATE_DOCUMENT' ? newAlertDocTemplateId : undefined,
    };
    const updated = [...customAlerts, alert];
    if (onCustomAlertsChange) onCustomAlertsChange(updated);
    else setInternalCustomAlerts(updated);
    setNewAlertTitle('');
    setNewAlertDate('');
    setNewAlertPriority('NORMAL');
    setNewAlertNote('');
    setNewAlertAssignedTo('');
    setNewAlertType('TASK');
    setNewAlertEmailTemplateId(undefined);
    setNewAlertDocTemplateId(undefined);
    setShowNewAlertForm(false);
  };

  const handleRemoveCustomAlert = (tempId: string) => {
    const updated = customAlerts.filter(a => a.tempId !== tempId);
    if (onCustomAlertsChange) onCustomAlertsChange(updated);
    else setInternalCustomAlerts(updated);
  };

  // Email edits handlers
  const handleEmailEditsChange = useCallback((key: string, data: { subject: string; body: string }) => {
    const updated = { ...emailEdits, [key]: data };
    if (onEmailEditsChange) onEmailEditsChange(updated);
    else setInternalEmailEdits(updated);
  }, [emailEdits, onEmailEditsChange]);

  const handleDocVariableEditsChange = useCallback((key: string, vars: Record<string, string>) => {
    const updated = { ...documentVariableEdits, [key]: vars };
    if (onDocumentVariableEditsChange) onDocumentVariableEditsChange(updated);
    else setInternalDocVariableEdits(updated);
  }, [documentVariableEdits, onDocumentVariableEditsChange]);

  // Extract #{variable} names from template strings
  const extractTemplateVars = useCallback((text: string): string[] => {
    const matches = text.match(/#\{([^}]+)\}/g);
    if (!matches) return [];
    return [...new Set(matches.map(m => m.slice(2, -1)))];
  }, []);

  // Open preview modal for EMAIL row
  const openEmailPreview = useCallback(async (row: GanttRow) => {
    setLoadingPreview(true);
    setPreviewModalKey(row.key);
    setPreviewDocData(null);
    const recipients = row.emailRecipients ? resolveTemplate(row.emailRecipients) : '';
    try {
      // Check if we already have edits for this row
      const existing = emailEdits[row.key];
      if (existing) {
        setPreviewEmailData(existing);
      } else if (row.emailTemplateId) {
        // Try loading linked email template (PlantillaCorreo)
        try {
          const tmpl = await plantillaCorreoService.getPlantillaCorreoById(row.emailTemplateId);
          const rendered = plantillaCorreoService.renderEmailPreview(tmpl.asunto, tmpl.cuerpoHtml, swiftFieldsData);
          // Use emailSubject override if available, otherwise use template's subject
          const subject = row.emailSubject
            ? resolveTemplate(row.emailSubject)
            : rendered.asunto;
          setPreviewEmailData({ subject, body: rendered.cuerpo, recipients });
        } catch {
          // Fallback: use alert template's own title/description
          const subject = row.emailSubject
            ? resolveTemplate(row.emailSubject)
            : row.title || '';
          const body = row.rawDescriptionTemplate
            ? resolveTemplate(row.rawDescriptionTemplate)
            : '';
          setPreviewEmailData({ subject, body: `<p>${body}</p>`, recipients });
        }
      } else {
        // No linked email template — use alert template content
        const subject = row.emailSubject
          ? resolveTemplate(row.emailSubject)
          : row.title || '';
        const body = row.rawDescriptionTemplate
          ? resolveTemplate(row.rawDescriptionTemplate)
          : '';
        setPreviewEmailData({ subject, body: `<p>${body}</p>`, recipients });
      }
    } catch {
      setPreviewEmailData({ subject: '', body: '', recipients });
    } finally {
      setLoadingPreview(false);
    }
  }, [emailEdits, swiftFieldsData, resolveTemplate]);

  // Open preview modal for GENERATE_DOCUMENT row
  const openDocumentPreview = useCallback(async (row: GanttRow) => {
    setLoadingPreview(true);
    setPreviewModalKey(row.key);
    setPreviewEmailData(null);
    try {
      const existing = documentVariableEdits[row.key];
      let templateName = '';
      let vars: Record<string, string> = {};

      // Extract variables from the alert template's own title and description
      const rawText = `${row.rawTitleTemplate || ''} ${row.rawDescriptionTemplate || ''}`;
      const alertVarNames = extractTemplateVars(rawText);
      // Resolve each variable using the same DB-driven resolveTemplate logic
      alertVarNames.forEach(v => {
        if (existing?.[v]) {
          vars[v] = existing[v];
        } else {
          const resolved = resolveTemplate(`#{${v}}`);
          vars[v] = resolved === '—' ? '' : resolved;
        }
      });

      // Also try to load linked document template if it exists
      if (row.documentTemplateId) {
        try {
          const tmpl = await plantillaService.getPlantillaById(row.documentTemplateId);
          templateName = tmpl.nombre;
          // Merge any additional variables from the document template
          const detectedVars = await plantillaService.getTemplateVariables(row.documentTemplateId).catch(() => [] as string[]);
          detectedVars.forEach(v => {
            if (!(v in vars)) {
              if (existing?.[v]) {
                vars[v] = existing[v];
              } else {
                const resolved = resolveTemplate(`#{${v}}`);
                vars[v] = resolved === '—' ? '' : resolved;
              }
            }
          });
        } catch {
          templateName = row.title;
        }
      } else {
        templateName = row.title;
      }

      setPreviewDocData({ name: templateName, variables: vars, documentTemplateId: row.documentTemplateId });
    } catch {
      setPreviewDocData({ name: row.title, variables: {}, documentTemplateId: row.documentTemplateId });
    } finally {
      setLoadingPreview(false);
    }
  }, [documentVariableEdits, swiftFieldsData, extractTemplateVars]);

  const closePreviewModal = () => {
    // Save edits before closing
    if (previewModalKey) {
      if (previewEmailData) {
        handleEmailEditsChange(previewModalKey, previewEmailData);
      }
      if (previewDocData) {
        handleDocVariableEditsChange(previewModalKey, previewDocData.variables);
      }
    }
    setPreviewModalKey(null);
    setPreviewEmailData(null);
    setPreviewDocData(null);
  };

  // Generate PDF document from template
  const handleGenerateDocument = useCallback(async () => {
    if (!previewDocData?.documentTemplateId) {
      notify.warning(
        isEs ? 'Sin plantilla' : 'No template',
        isEs ? 'No hay plantilla de documento vinculada. Seleccione una en la configuración de alertas.' : 'No document template linked. Select one in alert configuration.'
      );
      return;
    }
    try {
      setGeneratingDoc(true);
      const blob = await plantillaService.generatePdfFromTemplate(
        previewDocData.documentTemplateId,
        previewDocData.variables,
        `${previewDocData.name || 'documento'}.pdf`
      );
      // Download the generated PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${previewDocData.name || 'documento'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      notify.success(
        isEs ? 'Documento generado' : 'Document generated',
        isEs ? 'El documento se descargó correctamente' : 'Document downloaded successfully'
      );
    } catch (err) {
      notify.error(
        isEs ? 'Error' : 'Error',
        err instanceof Error ? err.message : (isEs ? 'Error al generar documento' : 'Error generating document')
      );
    } finally {
      setGeneratingDoc(false);
    }
  }, [previewDocData, isEs]);

  // Build unified row data for Gantt
  const ganttRows = useMemo<GanttRow[]>(() => {
    const rows: GanttRow[] = [];

    const buildTemplateRow = (tmpl: EventAlertTemplate, isMandatory: boolean): GanttRow => {
      const dateOverride = tmpl.id != null ? dateOverrides[tmpl.id] : undefined;
      const estimatedDate = getEstimatedDate(tmpl.dueDaysOffset, tmpl.dueDateReference);
      const displayDate = dateOverride ? new Date(dateOverride + 'T00:00:00') : estimatedDate;
      return {
        key: `tmpl_${tmpl.id}`,
        title: resolveTemplate(tmpl.titleTemplate),
        priority: tmpl.defaultPriority,
        alertType: tmpl.alertType || '',
        date: displayDate,
        role: tmpl.assignedRole?.replace('ROLE_', '') || '',
        isMandatory,
        isCustom: false,
        isSelected: isMandatory || (tmpl.id != null && selectedIds.has(tmpl.id)),
        noteValue: tmpl.id != null ? (notes[tmpl.id] || '') : '',
        templateId: tmpl.id,
        emailTemplateId: tmpl.emailTemplateId,
        documentTemplateId: tmpl.documentTemplateId,
        rawTitleTemplate: tmpl.titleTemplate,
        rawDescriptionTemplate: tmpl.descriptionTemplate || '',
        emailSubject: tmpl.emailSubject,
        emailRecipients: tmpl.emailRecipients,
      };
    };

    mandatoryTemplates.forEach(t => rows.push(buildTemplateRow(t, true)));
    suggestedTemplates.forEach(t => rows.push(buildTemplateRow(t, false)));

    customAlerts.forEach(ca => {
      const roleObj = availableRoles.find(r => r.name === ca.assignedTo);
      const roleLabel = roleObj ? (roleObj.description || roleObj.name) : (ca.assignedTo || t('alertPreview.customLabel', 'Personal'));
      rows.push({
        key: ca.tempId,
        title: ca.title,
        priority: ca.priority,
        alertType: ca.alertType || 'TASK',
        date: ca.dueDate ? new Date(ca.dueDate + 'T00:00:00') : null,
        role: roleLabel,
        isMandatory: false,
        isCustom: true,
        isSelected: true,
        noteValue: ca.note || '',
        customTempId: ca.tempId,
        emailTemplateId: ca.emailTemplateId,
        documentTemplateId: ca.documentTemplateId,
      });
    });

    return rows;
  }, [mandatoryTemplates, suggestedTemplates, customAlerts, selectedIds, notes, dateOverrides, getEstimatedDate, resolveTemplate, t, availableRoles]);

  // Sort by date for Gantt display
  const sortedRows = useMemo(() => {
    return [...ganttRows].sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });
  }, [ganttRows]);

  // Timeline calculations
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const { timelineStart, timelineEnd, timelineDays, ticks } = useMemo(() => {
    const dates = sortedRows.map(r => r.date).filter((d): d is Date => d != null);
    if (dates.length === 0) {
      const end = new Date(today);
      end.setDate(end.getDate() + 30);
      return { timelineStart: today, timelineEnd: end, timelineDays: 30, ticks: [] as { pos: number; label: string }[] };
    }

    const start = new Date(today);
    start.setDate(start.getDate() - 2); // 2 days before today
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    const end = new Date(maxDate);
    end.setDate(end.getDate() + 5); // 5 day buffer after last date

    const totalDays = Math.max(daysBetween(start, end), 7);

    // Generate ticks: ~4-6 ticks along the timeline
    const tickCount = Math.min(6, Math.max(3, Math.floor(totalDays / 7)));
    const tickInterval = totalDays / tickCount;
    const tickArr: { pos: number; label: string }[] = [];
    for (let i = 0; i <= tickCount; i++) {
      const tickDate = new Date(start);
      tickDate.setDate(tickDate.getDate() + Math.round(i * tickInterval));
      const pos = (daysBetween(start, tickDate) / totalDays) * 100;
      tickArr.push({ pos: Math.min(pos, 100), label: formatDateShort(tickDate) });
    }

    return { timelineStart: start, timelineEnd: end, timelineDays: totalDays, ticks: tickArr };
  }, [sortedRows, today]);

  const getPosition = (date: Date | null): number | null => {
    if (!date || timelineDays === 0) return null;
    const days = daysBetween(timelineStart, date);
    return Math.max(0, Math.min(100, (days / timelineDays) * 100));
  };

  const todayPos = getPosition(today);

  const selectedCount = templates.filter(t => t.id != null && selectedIds.has(t.id)).length + customAlerts.length;
  const totalCount = templates.length + customAlerts.length;

  const pColors = isDark ? PRIORITY_COLORS_DARK : PRIORITY_COLORS;

  // Helper: get icon for alert type
  const getAlertTypeIcon = (alertType: string) => {
    if (alertType === 'EMAIL') return FiMail;
    if (alertType === 'GENERATE_DOCUMENT') return FiFileText;
    return null;
  };

  // Check if a row has a reviewable template (EMAIL or GENERATE_DOCUMENT with template ID)
  const isReviewable = (row: GanttRow) => {
    return row.alertType === 'EMAIL' || row.alertType === 'GENERATE_DOCUMENT';
  };

  if (loading) {
    return (
      <Center py={variant === 'compact' ? 6 : 12}>
        <VStack gap={2}>
          <Spinner size="md" color="orange.500" />
          <Text fontSize="xs" color={colors.textColorSecondary}>{t('alertPreview.loading', 'Cargando...')}</Text>
        </VStack>
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={6}>
        <HStack gap={2}>
          <Icon as={FiAlertCircle} boxSize={5} color="red.500" />
          <Text fontSize="sm" color="red.500">{error}</Text>
        </HStack>
      </Center>
    );
  }

  if (templates.length === 0 && customAlerts.length === 0) {
    return (
      <Center py={variant === 'compact' ? 6 : 10}>
        <HStack gap={2}>
          <Icon as={FiBell} boxSize={5} color={colors.textColorSecondary} />
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {t('alertPreview.emptyTitle', 'Sin plan de seguimiento configurado')}
          </Text>
        </HStack>
      </Center>
    );
  }

  const isCompact = variant === 'compact';

  return (
    <VStack align="stretch" gap={isCompact ? 2 : 3}>
      {/* Header */}
      {!isCompact && (
        <Flex justify="space-between" align="center" pb={1}>
          <HStack gap={2}>
            <Icon as={FiBell} boxSize={4} color="orange.500" />
            <Text fontSize="sm" fontWeight="600" color={colors.textColor}>
              {t('alertPreview.title', 'Plan de Seguimiento')}
            </Text>
            {eventName && (
              <Box
                px={2}
                py={0.5}
                borderRadius="full"
                bg={isDark ? 'purple.900/40' : 'purple.50'}
                border="1px solid"
                borderColor={isDark ? 'purple.700' : 'purple.200'}
              >
                <Text fontSize="2xs" fontWeight="600" color={isDark ? 'purple.300' : 'purple.600'}>
                  {eventName}
                </Text>
              </Box>
            )}
            <Text fontSize="xs" color={colors.textColorSecondary}>
              ({selectedCount}/{totalCount})
            </Text>
          </HStack>
          <HStack gap={1}>
            {suggestedTemplates.length > 0 && (
              <>
                <Button size="xs" variant="ghost" colorPalette="blue" onClick={handleSelectAll} fontSize="xs">
                  {t('alertPreview.selectAll', 'Todas')}
                </Button>
                <Text fontSize="xs" color={colors.textColorSecondary}>|</Text>
                <Button size="xs" variant="ghost" colorPalette="gray" onClick={handleDeselectAll} fontSize="xs">
                  {t('alertPreview.deselectAll', 'Ninguna')}
                </Button>
                <Text fontSize="xs" color={colors.textColorSecondary}>|</Text>
              </>
            )}
            <Button
              size="xs"
              variant="ghost"
              colorPalette="orange"
              onClick={() => setShowNewAlertForm(!showNewAlertForm)}
              fontSize="xs"
            >
              <Icon as={FiPlus} boxSize={3} mr={0.5} />
              {t('alertPreview.addCustom', 'Personalizada')}
            </Button>
          </HStack>
        </Flex>
      )}

      {/* Gantt Chart */}
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor={isDark ? 'gray.700' : 'gray.200'}
        overflow="hidden"
      >
        {/* Timeline header with ticks */}
        <Flex
          bg={isDark ? 'gray.800' : 'gray.50'}
          borderBottom="1px solid"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
          minH="28px"
        >
          {/* Left label area */}
          <Box w={{ base: '180px', md: '240px' }} flexShrink={0} px={2} py={1}>
            <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} textTransform="uppercase">
              {t('alertPreview.totalLabel', 'Control')}
            </Text>
          </Box>
          {/* Timeline axis */}
          <Box flex={1} position="relative" py={1} pr={2}>
            {ticks.map((tick, i) => (
              <Text
                key={i}
                position="absolute"
                left={`${tick.pos}%`}
                transform="translateX(-50%)"
                fontSize="2xs"
                color={colors.textColorSecondary}
                whiteSpace="nowrap"
              >
                {tick.label}
              </Text>
            ))}
          </Box>
          {/* Right actions area */}
          <Box w={{ base: '60px', md: '100px' }} flexShrink={0} px={1} py={1} display={{ base: 'none', md: 'block' }}>
            <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} textTransform="uppercase" textAlign="center">
              {t('alertPreview.roleHeader', 'Rol')}
            </Text>
          </Box>
          <Box w="36px" flexShrink={0} />
        </Flex>

        {/* Gantt rows */}
        {sortedRows.map((row) => {
          const pc = pColors[row.priority] || pColors.NORMAL;
          const pos = getPosition(row.date);
          const isEditing = editingKey === row.key;
          const typeIcon = getAlertTypeIcon(row.alertType);
          const reviewable = isReviewable(row);
          const hasEdits = (row.alertType === 'EMAIL' && emailEdits[row.key]) ||
                           (row.alertType === 'GENERATE_DOCUMENT' && documentVariableEdits[row.key]);

          return (
            <React.Fragment key={row.key}>
              <Flex
                borderBottom="1px solid"
                borderColor={isDark ? 'gray.800' : 'gray.100'}
                opacity={row.isSelected ? 1 : 0.4}
                transition="opacity 0.15s"
                _hover={{ bg: isDark ? 'gray.800/50' : 'gray.50' }}
                minH="36px"
                align="center"
              >
                {/* Left: Toggle + Title */}
                <Flex
                  w={{ base: '180px', md: '240px' }}
                  flexShrink={0}
                  align="center"
                  gap={1.5}
                  px={2}
                  py={1}
                >
                  {/* Toggle */}
                  <Box w="28px" flexShrink={0}>
                    {row.isCustom ? (
                      <Icon as={FiPlus} boxSize={3} color="orange.500" />
                    ) : row.isMandatory ? (
                      <Icon as={FiLock} boxSize={3} color={isDark ? 'red.300' : 'red.500'} />
                    ) : (
                      <Switch.Root
                        checked={row.isSelected}
                        onCheckedChange={() => row.templateId != null && handleToggle(row.templateId)}
                        colorPalette="orange"
                        size="sm"
                      >
                        <Switch.HiddenInput />
                        <Switch.Control>
                          <Switch.Thumb />
                        </Switch.Control>
                      </Switch.Root>
                    )}
                  </Box>
                  {/* Alert type badge + Title */}
                  <VStack align="start" gap={0} flex={1} overflow="hidden">
                    <HStack gap={1}>
                      {typeIcon && (
                        <Icon
                          as={typeIcon}
                          boxSize={3}
                          color={`${ALERT_TYPE_COLORS[row.alertType] || 'gray'}.${isDark ? '300' : '500'}`}
                        />
                      )}
                      <Text
                        fontSize="xs"
                        color={colors.textColor}
                        noOfLines={1}
                        fontStyle={row.isCustom ? 'italic' : undefined}
                        fontWeight={row.isMandatory ? '600' : undefined}
                        title={row.title}
                        lineHeight="1.3"
                      >
                        {row.title}
                      </Text>
                    </HStack>
                    {row.alertType && (
                      <Text
                        fontSize="2xs"
                        color={`${ALERT_TYPE_COLORS[row.alertType] || 'gray'}.${isDark ? '300' : '500'}`}
                        fontWeight="500"
                        lineHeight="1"
                      >
                        {(() => {
                          const cfg = alertTypeConfigs.find(c => c.typeCode === row.alertType);
                          return cfg ? (isEs ? cfg.labelEs : cfg.labelEn) : row.alertType;
                        })()}
                      </Text>
                    )}
                  </VStack>
                </Flex>

                {/* Gantt bar area */}
                <Box flex={1} position="relative" h="36px" py="6px" pr={2}>
                  {/* Track background */}
                  <Box
                    position="absolute"
                    top="50%"
                    left="0"
                    right="8px"
                    h="2px"
                    transform="translateY(-50%)"
                    bg={isDark ? 'gray.700' : 'gray.200'}
                    borderRadius="full"
                  />

                  {/* Today marker */}
                  {todayPos != null && (
                    <Box
                      position="absolute"
                      left={`${todayPos}%`}
                      top="2px"
                      bottom="2px"
                      w="1px"
                      bg={isDark ? 'orange.400' : 'orange.500'}
                      opacity={0.5}
                      zIndex={1}
                    />
                  )}

                  {/* Bar from today to due date */}
                  {pos != null && todayPos != null && (
                    <Box
                      position="absolute"
                      top="50%"
                      transform="translateY(-50%)"
                      left={`${Math.min(todayPos, pos)}%`}
                      w={`${Math.abs(pos - todayPos)}%`}
                      h="8px"
                      bg={pc.bg}
                      borderRadius="full"
                      zIndex={2}
                    />
                  )}

                  {/* Due date marker (diamond) */}
                  {pos != null && (
                    <Box
                      position="absolute"
                      left={`${pos}%`}
                      top="50%"
                      transform="translate(-50%, -50%) rotate(45deg)"
                      w="10px"
                      h="10px"
                      bg={pc.bar}
                      borderRadius="2px"
                      zIndex={3}
                      boxShadow={`0 0 0 2px ${isDark ? '#1A202C' : '#FFFFFF'}`}
                    />
                  )}

                  {/* Date label near marker */}
                  {pos != null && row.date && (
                    <Text
                      position="absolute"
                      left={`${pos}%`}
                      bottom="-2px"
                      transform="translateX(-50%)"
                      fontSize="2xs"
                      fontWeight="600"
                      color={pc.bar}
                      whiteSpace="nowrap"
                      zIndex={4}
                    >
                      {formatDateShort(row.date)}
                    </Text>
                  )}

                  {/* No date indicator */}
                  {pos == null && (
                    <Text
                      position="absolute"
                      left="50%"
                      top="50%"
                      transform="translate(-50%, -50%)"
                      fontSize="2xs"
                      color={colors.textColorSecondary}
                      fontStyle="italic"
                    >
                      {t('alertPreview.datePending', 'Fecha pendiente')}
                    </Text>
                  )}
                </Box>

                {/* Role */}
                <Box w={{ base: '60px', md: '100px' }} flexShrink={0} px={1} display={{ base: 'none', md: 'flex' }} justifyContent="center">
                  <Text fontSize="2xs" color={row.isCustom ? 'orange.400' : colors.textColorSecondary} noOfLines={1}>
                    {row.role || '—'}
                  </Text>
                </Box>

                {/* Edit / Delete / Review button */}
                <Box w="36px" flexShrink={0} display="flex" justifyContent="center">
                  {row.isCustom ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => handleRemoveCustomAlert(row.customTempId!)}
                      p={0}
                      minW="auto"
                    >
                      <Icon as={FiTrash2} boxSize={3.5} color="red.400" />
                    </Button>
                  ) : reviewable ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => {
                        if (row.alertType === 'EMAIL') openEmailPreview(row);
                        else if (row.alertType === 'GENERATE_DOCUMENT') openDocumentPreview(row);
                      }}
                      p={0}
                      minW="auto"
                      title={row.alertType === 'EMAIL'
                        ? t('alertPreview.reviewEmail', 'Revisar correo')
                        : t('alertPreview.reviewDocument', 'Revisar documento')}
                    >
                      <Icon
                        as={FiEye}
                        boxSize={3.5}
                        color={hasEdits ? `${ALERT_TYPE_COLORS[row.alertType]}.500` : (isDark ? 'gray.300' : 'gray.600')}
                      />
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setEditingKey(isEditing ? null : row.key)}
                      p={0}
                      minW="auto"
                    >
                      <Icon
                        as={isEditing ? FiAlertCircle : (row.noteValue ? FiMessageSquare : FiEdit2)}
                        boxSize={3.5}
                        color={isEditing ? 'orange.500' : (row.noteValue ? 'orange.400' : (isDark ? 'gray.300' : 'gray.600'))}
                      />
                    </Button>
                  )}
                </Box>
              </Flex>

              {/* Inline edit row */}
              {isEditing && !row.isCustom && row.templateId != null && (
                <Box
                  borderBottom="1px solid"
                  borderColor={isDark ? 'gray.800' : 'gray.100'}
                  bg={isDark ? 'gray.800' : 'gray.50'}
                  px={3}
                  py={2}
                >
                  <Flex gap={3} flexWrap="wrap" align="flex-start">
                    <Box>
                      <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                        {t('alertPreview.dateHeader', 'Fecha')}
                      </Text>
                      <Input
                        type="date"
                        size="xs"
                        value={dateOverrides[row.templateId] || (row.date ? toInputDate(row.date) : '')}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleDateOverride(row.templateId!, e.target.value)}
                        bg={isDark ? 'gray.750' : 'white'}
                        borderColor={isDark ? 'gray.600' : 'gray.200'}
                        fontSize="xs"
                        w="150px"
                      />
                    </Box>
                    <Box flex={1} minW="200px">
                      <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                        {t('alertPreview.noteLabel', 'Nota')}
                      </Text>
                      <Textarea
                        value={notes[row.templateId] || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleNoteChange(row.templateId!, e.target.value)}
                        placeholder={t('alertPreview.notePlaceholder', 'Agregar nota...')}
                        size="xs"
                        rows={1}
                        bg={isDark ? 'gray.750' : 'white'}
                        borderColor={isDark ? 'gray.600' : 'gray.200'}
                        fontSize="xs"
                        _placeholder={{ color: colors.textColorSecondary }}
                      />
                    </Box>
                  </Flex>
                </Box>
              )}
            </React.Fragment>
          );
        })}

        {/* Add custom alert form */}
        {showNewAlertForm && (
          <Box px={3} py={3} bg={isDark ? 'gray.800' : 'orange.50'} borderTop="1px solid" borderColor={isDark ? 'gray.700' : 'orange.200'}>
            <VStack align="stretch" gap={2}>
              <Text fontSize="xs" fontWeight="600" color="orange.500">
                {t('alertPreview.newCustomTitle', 'Nueva alerta personalizada')}
              </Text>
              <Flex gap={2} flexWrap="wrap" align="flex-end">
                <Box flex={1} minW="180px">
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.customTitleField', 'Título')} *
                  </Text>
                  <Input
                    value={newAlertTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlertTitle(e.target.value)}
                    placeholder={t('alertPreview.customTitlePlaceholder', 'Ej: Revisar documentos...')}
                    size="xs"
                    bg={isDark ? 'gray.750' : 'white'}
                    borderColor={isDark ? 'gray.600' : 'gray.200'}
                    fontSize="xs"
                  />
                </Box>
                {/* Alert Type selector */}
                <Box w="140px">
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.alertTypeField', 'Tipo de alerta')}
                  </Text>
                  <select
                    value={newAlertType}
                    onChange={(e) => {
                      setNewAlertType(e.target.value);
                      setNewAlertEmailTemplateId(undefined);
                      setNewAlertDocTemplateId(undefined);
                    }}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                      background: isDark ? '#1A202C' : 'white',
                      color: isDark ? '#E2E8F0' : '#1A202C',
                      width: '100%',
                    }}
                  >
                    {alertTypeConfigs.map(at => (
                      <option key={at.typeCode} value={at.typeCode}>
                        {isEs ? at.labelEs : at.labelEn}
                      </option>
                    ))}
                  </select>
                </Box>
                <Box w="140px">
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.dateHeader', 'Fecha')}
                  </Text>
                  <Input
                    type="date"
                    value={newAlertDate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewAlertDate(e.target.value)}
                    size="xs"
                    bg={isDark ? 'gray.750' : 'white'}
                    borderColor={isDark ? 'gray.600' : 'gray.200'}
                    fontSize="xs"
                  />
                </Box>
                <Box w="110px">
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.priorityLabel', 'Prioridad')}
                  </Text>
                  <select
                    value={newAlertPriority}
                    onChange={(e) => setNewAlertPriority(e.target.value)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                      background: isDark ? '#1A202C' : 'white',
                      color: isDark ? '#E2E8F0' : '#1A202C',
                      width: '100%',
                    }}
                  >
                    <option value="URGENT">{t('alertPreview.priority.urgent', 'Urgente')}</option>
                    <option value="HIGH">{t('alertPreview.priority.high', 'Alta')}</option>
                    <option value="NORMAL">{t('alertPreview.priority.normal', 'Normal')}</option>
                    <option value="LOW">{t('alertPreview.priority.low', 'Baja')}</option>
                  </select>
                </Box>
                <Box w="200px">
                  <Flex mb={0.5} align="center" gap={1}>
                    <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary}>
                      {t('alertPreview.assignToLabel', 'Asignar a')}
                    </Text>
                    <HStack gap={0} borderRadius="sm" overflow="hidden" border="1px solid" borderColor={isDark ? 'gray.600' : 'gray.300'}>
                      <Box
                        as="button"
                        px={1.5}
                        py={0}
                        fontSize="2xs"
                        fontWeight="600"
                        bg={assignMode === 'role' ? (isDark ? 'blue.700' : 'blue.500') : 'transparent'}
                        color={assignMode === 'role' ? 'white' : colors.textColorSecondary}
                        onClick={() => { setAssignMode('role'); setNewAlertAssignedTo(''); }}
                        cursor="pointer"
                      >
                        Rol
                      </Box>
                      <Box
                        as="button"
                        px={1.5}
                        py={0}
                        fontSize="2xs"
                        fontWeight="600"
                        bg={assignMode === 'user' ? (isDark ? 'blue.700' : 'blue.500') : 'transparent'}
                        color={assignMode === 'user' ? 'white' : colors.textColorSecondary}
                        onClick={() => { setAssignMode('user'); setNewAlertAssignedTo(''); }}
                        cursor="pointer"
                      >
                        Usuario
                      </Box>
                    </HStack>
                  </Flex>
                  <select
                    value={newAlertAssignedTo}
                    onChange={(e) => setNewAlertAssignedTo(e.target.value)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                      background: isDark ? '#1A202C' : 'white',
                      color: isDark ? '#E2E8F0' : '#1A202C',
                      width: '100%',
                    }}
                  >
                    <option value="">{t('alertPreview.assignNone', '-- Seleccionar --')}</option>
                    {assignMode === 'role'
                      ? availableRoles.map(r => (
                          <option key={r.name} value={r.name}>{r.description || r.name}</option>
                        ))
                      : internalUsers.map(u => (
                          <option key={u.username} value={u.username}>{u.username}{u.email ? ` (${u.email})` : ''}</option>
                        ))
                    }
                  </select>
                </Box>
              </Flex>
              {/* Template selector for EMAIL / GENERATE_DOCUMENT */}
              {newAlertType === 'EMAIL' && (
                <Box>
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.selectEmailTemplate', 'Seleccionar plantilla de correo')}
                  </Text>
                  <select
                    value={newAlertEmailTemplateId?.toString() || ''}
                    onChange={(e) => setNewAlertEmailTemplateId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                      background: isDark ? '#1A202C' : 'white',
                      color: isDark ? '#E2E8F0' : '#1A202C',
                      width: '100%',
                    }}
                  >
                    <option value="">-- {t('alertPreview.selectEmailTemplate', 'Seleccionar plantilla de correo')} --</option>
                    {emailTemplatesList.map(et => (
                      <option key={et.id} value={et.id}>{et.nombre} — {et.asunto}</option>
                    ))}
                  </select>
                </Box>
              )}
              {newAlertType === 'GENERATE_DOCUMENT' && (
                <Box>
                  <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                    {t('alertPreview.selectDocTemplate', 'Seleccionar plantilla de documento')}
                  </Text>
                  <select
                    value={newAlertDocTemplateId?.toString() || ''}
                    onChange={(e) => setNewAlertDocTemplateId(e.target.value ? Number(e.target.value) : undefined)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${isDark ? '#4A5568' : '#E2E8F0'}`,
                      background: isDark ? '#1A202C' : 'white',
                      color: isDark ? '#E2E8F0' : '#1A202C',
                      width: '100%',
                    }}
                  >
                    <option value="">-- {t('alertPreview.selectDocTemplate', 'Seleccionar plantilla de documento')} --</option>
                    {documentTemplatesList.map(dt => (
                      <option key={dt.id} value={dt.id}>{dt.nombre}{dt.tipoDocumento ? ` (${dt.tipoDocumento})` : ''}</option>
                    ))}
                  </select>
                </Box>
              )}
              <Box>
                <Text fontSize="2xs" fontWeight="600" color={colors.textColorSecondary} mb={0.5}>
                  {t('alertPreview.noteLabel', 'Nota')}
                </Text>
                <Textarea
                  value={newAlertNote}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewAlertNote(e.target.value)}
                  placeholder={t('alertPreview.notePlaceholder', 'Agregar nota...')}
                  size="xs"
                  rows={1}
                  bg={isDark ? 'gray.750' : 'white'}
                  borderColor={isDark ? 'gray.600' : 'gray.200'}
                  fontSize="xs"
                />
              </Box>
              <HStack gap={2} justify="flex-end">
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => { setShowNewAlertForm(false); setNewAlertTitle(''); setNewAlertDate(''); setNewAlertNote(''); setNewAlertPriority('NORMAL'); setNewAlertAssignedTo(''); setNewAlertType('TASK'); setNewAlertEmailTemplateId(undefined); setNewAlertDocTemplateId(undefined); }}
                >
                  <Icon as={FiX} boxSize={3.5} mr={1} />
                  {t('common.cancel', 'Cancelar')}
                </Button>
                <Button
                  size="xs"
                  colorPalette="orange"
                  onClick={handleAddCustomAlert}
                  disabled={!newAlertTitle.trim()}
                >
                  <Icon as={FiCheck} boxSize={3.5} mr={1} />
                  {t('common.add', 'Agregar')}
                </Button>
              </HStack>
            </VStack>
          </Box>
        )}

        {/* Legend */}
        <Flex
          px={3}
          py={1.5}
          bg={isDark ? 'gray.800' : 'gray.50'}
          borderTop="1px solid"
          borderColor={isDark ? 'gray.700' : 'gray.200'}
          gap={4}
          align="center"
          flexWrap="wrap"
        >
          <HStack gap={1}>
            <Box w="6px" h="6px" transform="rotate(45deg)" bg={isDark ? 'orange.400' : 'orange.500'} borderRadius="1px" />
            <Text fontSize="2xs" color={colors.textColorSecondary}>{t('alertPreview.todayLabel', 'Hoy')}</Text>
          </HStack>
          {['URGENT', 'HIGH', 'NORMAL', 'LOW'].map(p => (
            <HStack key={p} gap={1}>
              <Box w="8px" h="8px" transform="rotate(45deg)" bg={pColors[p].bar} borderRadius="1px" />
              <Text fontSize="2xs" color={colors.textColorSecondary}>
                {t(`alertPreview.priority.${p.toLowerCase()}`, p)}
              </Text>
            </HStack>
          ))}
        </Flex>
      </Box>

      {/* General Notes */}
      <Box>
        <HStack gap={1} mb={1}>
          <Icon as={FiMessageSquare} boxSize={3.5} color={colors.textColorSecondary} />
          <Text fontSize="xs" fontWeight="500" color={colors.textColorSecondary}>
            {t('alertPreview.noteLabel', 'Notas')}
          </Text>
        </HStack>
        <Textarea
          value={generalNote}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleGeneralNoteChange(e.target.value)}
          placeholder={t('alertPreview.notePlaceholder', 'Agregar nota personalizada...')}
          size="sm"
          rows={2}
          bg={isDark ? 'gray.800' : 'white'}
          borderColor={isDark ? 'gray.600' : 'gray.200'}
          fontSize="xs"
          _placeholder={{ color: colors.textColorSecondary }}
        />
      </Box>

      {/* Preview Modal for EMAIL / GENERATE_DOCUMENT */}
      <DialogRoot open={previewModalKey != null} onOpenChange={(e) => { if (!e.open) closePreviewModal(); }}>
        <DialogBackdrop css={{ position: 'fixed', inset: 0, zIndex: 9998 }} />
        <DialogContent css={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 9999, maxHeight: '85vh', minWidth: '700px', display: 'flex', flexDirection: 'column' }}>
          <DialogHeader flexShrink={0}>
            <DialogTitle>
              {previewEmailData
                ? t('alertPreview.reviewEmail', 'Revisar correo')
                : t('alertPreview.reviewDocument', 'Revisar documento')}
            </DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody overflowY="auto" flex={1}>
            {loadingPreview ? (
              <Center py={10}>
                <Spinner size="md" color="orange.500" />
              </Center>
            ) : previewEmailData ? (
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>
                    {isEs ? 'Destinatario(s)' : 'Recipient(s)'}
                  </Text>
                  <Input
                    value={previewEmailData.recipients || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPreviewEmailData(prev => prev ? { ...prev, recipients: e.target.value } : prev)
                    }
                    fontSize="sm"
                    placeholder={isEs ? 'correo@ejemplo.com' : 'email@example.com'}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>
                    CC
                  </Text>
                  <Input
                    value={previewEmailData.cc || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPreviewEmailData(prev => prev ? { ...prev, cc: e.target.value } : prev)
                    }
                    fontSize="sm"
                    placeholder={isEs ? 'Con copia a...' : 'Copy to...'}
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>
                    {t('alertPreview.emailSubject', 'Asunto')}
                  </Text>
                  <Input
                    value={previewEmailData.subject}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPreviewEmailData(prev => prev ? { ...prev, subject: e.target.value } : prev)
                    }
                    fontSize="sm"
                  />
                </Box>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>
                    {t('alertPreview.emailBody', 'Cuerpo')}
                  </Text>
                  <HtmlEmailEditor
                    value={previewEmailData.body}
                    onChange={(val) =>
                      setPreviewEmailData(prev => prev ? { ...prev, body: val } : prev)
                    }
                  />
                </Box>
              </VStack>
            ) : previewDocData ? (
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="600" mb={1}>
                    {t('alertPreview.documentTemplate', 'Plantilla de documento')}
                  </Text>
                  <Text fontSize="sm" color={colors.textColorSecondary} mb={2}>{previewDocData.name}</Text>
                  {/* Selector de plantilla de documento */}
                  <Flex gap={2} align="center">
                    <Text fontSize="xs" color={colors.textColorSecondary} flexShrink={0}>
                      {isEs ? 'Usar plantilla:' : 'Use template:'}
                    </Text>
                    <select
                      value={previewDocData.documentTemplateId?.toString() || ''}
                      onChange={(e) => setPreviewDocData(prev => prev ? {
                        ...prev,
                        documentTemplateId: e.target.value ? Number(e.target.value) : undefined,
                      } : prev)}
                      style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '4px', border: '1px solid #ccc', flex: 1 }}
                    >
                      <option value="">{isEs ? '— Seleccionar plantilla —' : '— Select template —'}</option>
                      {documentTemplatesList.map(dt => (
                        <option key={dt.id} value={dt.id}>
                          {dt.nombre}{dt.tipoDocumento ? ` (${dt.tipoDocumento})` : ''}
                        </option>
                      ))}
                    </select>
                  </Flex>
                </Box>
                {Object.keys(previewDocData.variables).length > 0 && (
                  <Box>
                    <Text fontSize="sm" fontWeight="600" mb={2}>
                      {t('alertPreview.documentVariables', 'Variables')}
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {Object.entries(previewDocData.variables).map(([varName, varValue]) => (
                        <Flex key={varName} gap={2} align="center">
                          <Text fontSize="xs" fontWeight="500" w="150px" flexShrink={0} color={colors.textColorSecondary}>
                            {varName}
                          </Text>
                          <Input
                            size="sm"
                            value={varValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                              setPreviewDocData(prev => prev ? {
                                ...prev,
                                variables: { ...prev.variables, [varName]: e.target.value },
                              } : prev)
                            }
                            fontSize="xs"
                          />
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}
                {Object.keys(previewDocData.variables).length === 0 && (
                  <Text fontSize="sm" color={colors.textColorSecondary} fontStyle="italic">
                    {isEs ? 'No se detectaron variables en esta plantilla' : 'No variables detected in this template'}
                  </Text>
                )}
              </VStack>
            ) : null}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={closePreviewModal}>
              {t('common.cancel', 'Cancelar')}
            </Button>
            {previewDocData && (
              <Button
                colorPalette="teal"
                onClick={handleGenerateDocument}
                disabled={generatingDoc || !previewDocData.documentTemplateId}
                title={!previewDocData.documentTemplateId ? (isEs ? 'Seleccione una plantilla primero' : 'Select a template first') : ''}
              >
                {generatingDoc ? (
                  <Spinner size="sm" mr={1} />
                ) : (
                  <Icon as={FiDownload} boxSize={4} mr={1} />
                )}
                {isEs ? 'Generar Documento' : 'Generate Document'}
              </Button>
            )}
            <Button colorPalette="orange" onClick={closePreviewModal}>
              <Icon as={FiCheck} boxSize={4} mr={1} />
              {t('alertPreview.saveEdits', 'Guardar cambios')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </VStack>
  );
};

export default AlertPreviewStep;
