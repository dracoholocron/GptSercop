import { useState, useEffect, useMemo, useCallback } from 'react';
import { eventConfigApi } from '../services/operationsApi';
import type { EventAlertTemplate } from '../types/operations';
import type { SwiftFieldConfig } from '../types/swiftField';

export interface UseAlertPreviewProps {
  operationType: string;
  eventCode?: string;
  swiftFieldsData: Record<string, any>;
  swiftConfigs?: SwiftFieldConfig[];
  language?: string;
}

export interface UseAlertPreviewReturn {
  templates: EventAlertTemplate[];
  mandatoryTemplates: EventAlertTemplate[];
  suggestedTemplates: EventAlertTemplate[];
  loading: boolean;
  error: string | null;
  selectedAlertIds: Set<number>;
  toggleAlert: (templateId: number) => void;
  selectAllSuggested: () => void;
  deselectAllSuggested: () => void;
  resolveTemplate: (template: string) => string;
  getEstimatedDate: (dueDaysOffset: number, dueDateReference?: string) => Date | null;
  totalAlerts: number;
  initialEventCode: string | null;
}

/**
 * Hook centralizado para cargar y gestionar la preview de alertas.
 * Flujo:
 * 1. Llama getInitialEvents(operationType) → obtiene eventCode dinámicamente
 * 2. Llama getAlertTemplatesForEvent(operationType, eventCode, language)
 * 3. Separa por requirementLevel: MANDATORY vs RECOMMENDED/OPTIONAL
 * 4. Auto-selecciona MANDATORY + RECOMMENDED; OPTIONAL off por defecto
 */
export function useAlertPreview({
  operationType,
  eventCode: explicitEventCode,
  swiftFieldsData,
  swiftConfigs,
  language = 'es',
}: UseAlertPreviewProps): UseAlertPreviewReturn {
  const [templates, setTemplates] = useState<EventAlertTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<number>>(new Set());
  const [initialEventCode, setInitialEventCode] = useState<string | null>(null);

  // Load templates when operationType changes
  useEffect(() => {
    if (!operationType) return;

    let cancelled = false;
    const loadTemplates = async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Determine event code: use explicit if provided, otherwise fetch initial
        let eventCode = explicitEventCode;
        if (!eventCode) {
          const initialEvents = await eventConfigApi.getInitialEvents(operationType, language);
          if (cancelled) return;

          if (!initialEvents.length) {
            setTemplates([]);
            setInitialEventCode(null);
            setLoading(false);
            return;
          }
          eventCode = initialEvents[0].toEventCode;
        }
        setInitialEventCode(eventCode);

        // 2. Get alert templates for this event
        const alertTemplates = await eventConfigApi.getAlertTemplatesForEvent(
          operationType,
          eventCode,
          language
        );
        if (cancelled) return;

        const activeTemplates = alertTemplates
          .filter(t => t.isActive)
          .sort((a, b) => a.displayOrder - b.displayOrder);

        setTemplates(activeTemplates);

        // 3. Auto-select MANDATORY + RECOMMENDED
        const autoSelected = new Set<number>();
        activeTemplates.forEach(t => {
          if (t.id != null) {
            if (t.requirementLevel === 'MANDATORY' || t.requirementLevel === 'RECOMMENDED') {
              autoSelected.add(t.id);
            }
          }
        });
        setSelectedAlertIds(autoSelected);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al cargar alertas');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadTemplates();
    return () => { cancelled = true; };
  }, [operationType, explicitEventCode, language]);

  // Separate by requirement level
  const mandatoryTemplates = useMemo(
    () => templates.filter(t => t.requirementLevel === 'MANDATORY'),
    [templates]
  );

  const suggestedTemplates = useMemo(
    () => templates.filter(t => t.requirementLevel !== 'MANDATORY'),
    [templates]
  );

  // Toggle a suggested alert
  const toggleAlert = useCallback((templateId: number) => {
    setSelectedAlertIds(prev => {
      const next = new Set(prev);
      // Don't allow deselecting MANDATORY
      const tmpl = templates.find(t => t.id === templateId);
      if (tmpl?.requirementLevel === 'MANDATORY') return prev;

      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  }, [templates]);

  // Select all suggested
  const selectAllSuggested = useCallback(() => {
    setSelectedAlertIds(prev => {
      const next = new Set(prev);
      suggestedTemplates.forEach(t => {
        if (t.id != null) next.add(t.id);
      });
      return next;
    });
  }, [suggestedTemplates]);

  // Deselect all suggested (keep mandatory)
  const deselectAllSuggested = useCallback(() => {
    setSelectedAlertIds(prev => {
      const next = new Set<number>();
      mandatoryTemplates.forEach(t => {
        if (t.id != null && prev.has(t.id)) next.add(t.id);
      });
      return next;
    });
  }, [mandatoryTemplates]);

  // Build mapping: draftFieldMapping name → SWIFT fieldCode from swiftConfigs (DB-driven)
  // e.g. { applicantName: ':50:', beneficiaryName: ':59:', 'currency,amount': ':32B:', reference: ':20:' }
  const variableToFieldCode = useMemo(() => {
    const map: Record<string, string> = {};
    if (swiftConfigs) {
      for (const cfg of swiftConfigs) {
        if (cfg.draftFieldMapping) {
          // draftFieldMapping can be comma-separated (e.g. "currency,amount" for :32B:)
          // Map each part to the same fieldCode
          const parts = cfg.draftFieldMapping.split(',').map(s => s.trim());
          for (const part of parts) {
            map[part] = cfg.fieldCode;
          }
          // Also map the full composite key
          if (parts.length > 1) {
            map[cfg.draftFieldMapping] = cfg.fieldCode;
          }
        }
      }
    }
    return map;
  }, [swiftConfigs]);

  // Extract a display-friendly value from a SWIFT field (may be object, multiline, etc.)
  const extractDisplayValue = useCallback((val: any, varName: string): string => {
    if (val == null) return '';
    // Object with named properties (e.g. { currency: 'USD', amount: '100000' })
    if (typeof val === 'object') {
      // For specific sub-properties
      if (varName === 'currency' && val.currency) return val.currency;
      if (varName === 'formattedAmount' || varName === 'amount') {
        const amt = val.amount;
        if (amt != null) {
          const num = parseFloat(String(amt));
          return isNaN(num) ? String(amt) : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
      if (val.date && (varName.includes('Date') || varName.includes('date'))) return val.date;
      if (val.name) return val.name;
      if (val.nombreCompleto) return val.nombreCompleto;
      if (val.razonSocial) return val.razonSocial;
      // Fallback: first non-empty string property
      for (const key of Object.keys(val)) {
        if (typeof val[key] === 'string' && val[key]) return val[key];
      }
      return JSON.stringify(val);
    }
    // Multiline string — first line is usually the name
    if (typeof val === 'string') {
      if (varName.includes('Name') || varName.includes('name') || varName.includes('Bank') || varName.includes('bank')) {
        return val.split('\n')[0];
      }
      return val;
    }
    return String(val);
  }, []);

  // Resolve #{variable} placeholders using swiftFieldsData + swiftConfigs mapping (NO hardcode)
  const resolveTemplate = useCallback((text: string): string => {
    if (!text) return text;

    return text.replace(/#\{(\w+)\}/g, (_match, varName: string) => {
      // 1. Look up the SWIFT field code for this variable via DB-driven mapping
      const fieldCode = variableToFieldCode[varName];
      if (fieldCode) {
        const val = swiftFieldsData[fieldCode];
        if (val != null) {
          const display = extractDisplayValue(val, varName);
          if (display) return display;
        }
      }

      // 2. Also check operationReference → mapped via 'reference' draftFieldMapping
      if (varName === 'operationReference') {
        const refFieldCode = variableToFieldCode['reference'];
        if (refFieldCode) {
          const val = swiftFieldsData[refFieldCode];
          if (val != null) return extractDisplayValue(val, varName);
        }
      }

      // 3. Try direct key lookup in swiftFieldsData (both :XX: and plain)
      const colonVal = swiftFieldsData[`:${varName}:`];
      if (colonVal != null && colonVal !== '') return extractDisplayValue(colonVal, varName);
      const directVal = swiftFieldsData[varName];
      if (directVal != null && directVal !== '') return extractDisplayValue(directVal, varName);

      // 4. Not found
      return '—';
    });
  }, [swiftFieldsData, variableToFieldCode, extractDisplayValue]);

  // Map due_date_reference values to draftFieldMapping names (from DB config)
  // This avoids hardcoding any SWIFT field codes
  const DATE_REF_TO_MAPPING: Record<string, string> = {
    EXPIRY_DATE: 'expiryDate',
    ISSUE_DATE: 'issueDate',
    LATEST_SHIPMENT_DATE: 'latestShipmentDate',
  };

  // Build a lookup: draftFieldMapping → fieldCode from swiftConfigs (DB-driven)
  const fieldMappingToCode = useMemo(() => {
    const map: Record<string, string> = {};
    if (swiftConfigs) {
      for (const cfg of swiftConfigs) {
        if (cfg.draftFieldMapping) {
          map[cfg.draftFieldMapping] = cfg.fieldCode;
        }
      }
    }
    return map;
  }, [swiftConfigs]);

  // Extract a date value from swiftFieldsData by fieldCode (handles object or string)
  const extractDateFromField = useCallback((fieldCode: string): Date | null => {
    const val = swiftFieldsData[fieldCode];
    if (!val) return null;
    // Handle object with .date property (e.g. { date: '2026-06-30', place: 'MEXICO' })
    const raw = typeof val === 'object' && val.date ? val.date : val;
    if (typeof raw === 'string' || typeof raw === 'number') {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }, [swiftFieldsData]);

  // Calculate estimated date based on due_date_reference + offset
  // Returns null if the reference date is not yet available in the form
  const getEstimatedDate = useCallback((dueDaysOffset: number, dueDateReference?: string): Date | null => {
    // EVENT_EXECUTION or unknown → use today
    if (!dueDateReference || dueDateReference === 'EVENT_EXECUTION') {
      const d = new Date();
      d.setDate(d.getDate() + dueDaysOffset);
      return d;
    }

    // Look up the draftFieldMapping name for this reference type
    const mappingName = DATE_REF_TO_MAPPING[dueDateReference];
    if (!mappingName) {
      // Unknown reference type → fallback to today
      const d = new Date();
      d.setDate(d.getDate() + dueDaysOffset);
      return d;
    }

    // Find the fieldCode from DB config
    const fieldCode = fieldMappingToCode[mappingName];
    if (!fieldCode) return null; // No config for this mapping → date not available

    // Extract the date value from the form
    const refDate = extractDateFromField(fieldCode);
    if (!refDate) return null; // User hasn't filled this field yet

    const result = new Date(refDate);
    result.setDate(result.getDate() + dueDaysOffset);
    return result;
  }, [fieldMappingToCode, extractDateFromField]);

  const totalAlerts = useMemo(
    () => templates.filter(t => t.id != null && selectedAlertIds.has(t.id)).length,
    [templates, selectedAlertIds]
  );

  return {
    templates,
    mandatoryTemplates,
    suggestedTemplates,
    loading,
    error,
    selectedAlertIds,
    toggleAlert,
    selectAllSuggested,
    deselectAllSuggested,
    resolveTemplate,
    getEstimatedDate,
    totalAlerts,
    initialEventCode,
  };
}
