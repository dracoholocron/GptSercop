/**
 * useProductJourney - Loads event types and groups them by eventCategory
 * for the visual journey timeline in Quick Actions.
 *
 * Uses eventConfigApi.getEventTypes() to get ALL events for a product,
 * then groups by eventCategory (ISSUANCE, ADVICE, AMENDMENT, etc.)
 * and orders by displayOrder within each group.
 */

import { useState, useEffect } from 'react';
import { eventConfigApi } from '../services/operationsApi';
import type { EventTypeConfig } from '../types/operations';

export interface JourneyNode {
  id: number;
  eventCode: string;
  eventName: string;
  description?: string;
  icon?: string;
  color?: string;
  eventCategory?: string;
  displayOrder: number;
  isInitialEvent?: boolean;
  fromStage?: string;
  fromEventCode?: string;
  validFromStages?: string[];
}

export interface StageGroup {
  category: string;
  label: string;
  events: JourneyNode[];
}

// Predefined stage order for the timeline
const STAGE_ORDER: string[] = [
  'ISSUANCE',
  'ADVICE',
  'AMENDMENT',
  'DOCUMENTS',
  'PAYMENT',
  'CLAIM',
  'CLOSURE',
];

// Default labels (used as i18n fallback keys)
const STAGE_LABELS: Record<string, Record<string, string>> = {
  en: {
    ISSUANCE: 'Issuance',
    ADVICE: 'Advice',
    AMENDMENT: 'Amendment',
    DOCUMENTS: 'Documents',
    PAYMENT: 'Payment',
    CLAIM: 'Claim',
    CLOSURE: 'Closure',
  },
  es: {
    ISSUANCE: 'Emisión',
    ADVICE: 'Aviso',
    AMENDMENT: 'Enmienda',
    DOCUMENTS: 'Documentos',
    PAYMENT: 'Pago',
    CLAIM: 'Reclamo',
    CLOSURE: 'Cierre',
  },
};

function getStageLabel(category: string, language: string): string {
  const lang = language.startsWith('es') ? 'es' : 'en';
  return STAGE_LABELS[lang]?.[category] || STAGE_LABELS['en']?.[category] || category;
}

function toJourneyNode(evt: EventTypeConfig): JourneyNode {
  // Derive fromStage: if validFromStages includes only DRAFT, treat as creation event
  const isDraftOnly = evt.validFromStages?.length === 1 && evt.validFromStages[0] === 'DRAFT';
  return {
    id: evt.id,
    eventCode: evt.eventCode,
    eventName: evt.eventName,
    description: evt.eventDescription,
    icon: evt.icon,
    color: evt.color,
    eventCategory: evt.eventCategory,
    displayOrder: evt.displayOrder,
    isInitialEvent: evt.isInitialEvent || isDraftOnly,
    fromStage: isDraftOnly ? 'DRAFT' : evt.validFromStages?.[0],
    validFromStages: evt.validFromStages,
  };
}

export function useProductJourney(productType: string, language: string) {
  const [stages, setStages] = useState<StageGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productType) {
      setStages([]);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const eventTypes = await eventConfigApi.getEventTypes(productType, language);
        if (cancelled) return;

        // Filter active events only
        const active = eventTypes.filter(e => e.isActive);

        // Group by eventCategory
        const grouped = new Map<string, EventTypeConfig[]>();
        for (const evt of active) {
          const cat = evt.eventCategory || 'OTHER';
          if (!grouped.has(cat)) grouped.set(cat, []);
          grouped.get(cat)!.push(evt);
        }

        // Sort events within each group by displayOrder
        for (const evts of grouped.values()) {
          evts.sort((a, b) => a.displayOrder - b.displayOrder);
        }

        // Build stages in predefined order, then append any unknown categories
        const result: StageGroup[] = [];
        const seen = new Set<string>();

        for (const cat of STAGE_ORDER) {
          const evts = grouped.get(cat);
          if (evts && evts.length > 0) {
            result.push({
              category: cat,
              label: getStageLabel(cat, language),
              events: evts.map(toJourneyNode),
            });
            seen.add(cat);
          }
        }

        // Append any categories not in STAGE_ORDER
        for (const [cat, evts] of grouped.entries()) {
          if (!seen.has(cat)) {
            result.push({
              category: cat,
              label: getStageLabel(cat, language),
              events: evts.map(toJourneyNode),
            });
          }
        }

        if (!cancelled) setStages(result);
      } catch (err) {
        if (!cancelled) {
          setStages([]);
          setError(err instanceof Error ? err.message : 'Failed to load events');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [productType, language]);

  return { stages, isLoading, error };
}
