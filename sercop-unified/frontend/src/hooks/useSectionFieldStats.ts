import { useMemo } from 'react';
import type { SwiftFieldConfig } from '../types/swiftField';
import type { SwiftSectionConfig } from '../services/swiftSectionConfigService';

export interface SectionFieldStats {
  total: number;
  filled: number;
  required: number;
  requiredFilled: number;
  percentage: number;
}

export interface GlobalFieldStats extends SectionFieldStats {}

interface UseSectionFieldStatsInput {
  swiftFieldConfigs: SwiftFieldConfig[];
  swiftFieldsData: Record<string, any>;
  dynamicSections: SwiftSectionConfig[];
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;
  extraSectionsCount?: number;
}

interface UseSectionFieldStatsOutput {
  sectionStats: Record<string, SectionFieldStats>;
  completedSections: Set<string>;
  sectionsWithComments: Map<string, number>;
  progress: number;
  globalStats: GlobalFieldStats;
}

/** Determines if a SWIFT field value is filled */
export const isValueFilled = (value: any): boolean => {
  if (value === undefined || value === null || value === '') return false;

  if (typeof value === 'object') {
    if (Array.isArray(value)) return value.length > 0;
    if (Object.keys(value).length === 0) return false;

    // SWIFT_MULTI_OPTION: { detectedOption, inputMethod, bic, manualText, ... }
    if ('detectedOption' in value || 'inputMethod' in value) {
      const hasBic = value.bic && value.bic.trim() !== '';
      const hasManualText = Array.isArray(value.manualText) && value.manualText.some((t: string) => t && t.trim() !== '');
      return hasBic || hasManualText;
    }

    // CURRENCY_AMOUNT_INPUT: { currency, amount }
    if ('currency' in value && 'amount' in value) {
      return value.currency && value.amount && String(value.amount).trim() !== '';
    }

    // DATE_PLACE_INPUT: { date, place }
    if ('date' in value && 'place' in value) {
      return (value.date && value.date.trim() !== '') || (value.place && value.place.trim() !== '');
    }

    // SWIFT_PARTY: { text }
    if ('text' in value && Object.keys(value).length === 1) {
      return value.text && value.text.trim() !== '';
    }

    // For other objects, check if at least one property has a value
    return Object.values(value).some(v =>
      v !== undefined && v !== null && v !== '' &&
      !(Array.isArray(v) && v.length === 0)
    );
  }

  return true;
};

export const useSectionFieldStats = ({
  swiftFieldConfigs,
  swiftFieldsData,
  dynamicSections,
  fieldComments,
  extraSectionsCount = 2,
}: UseSectionFieldStatsInput): UseSectionFieldStatsOutput => {
  // Section stats
  const sectionStats = useMemo((): Record<string, SectionFieldStats> => {
    if (!swiftFieldConfigs || swiftFieldConfigs.length === 0) {
      return {};
    }

    const stats: Record<string, SectionFieldStats> = {};
    const fieldsBySection: Record<string, SwiftFieldConfig[]> = {};

    swiftFieldConfigs.forEach(field => {
      const section = field.section || 'OTHER';
      if (!fieldsBySection[section]) {
        fieldsBySection[section] = [];
      }
      fieldsBySection[section].push(field);
    });

    Object.entries(fieldsBySection).forEach(([section, fields]) => {
      const activeFields = fields.filter(f => f.isActive !== false);
      const requiredFields = activeFields.filter(f => f.isRequired);

      let filled = 0;
      let requiredFilled = 0;

      activeFields.forEach(field => {
        const value = swiftFieldsData[field.fieldCode];
        if (isValueFilled(value)) {
          filled++;
          if (field.isRequired) {
            requiredFilled++;
          }
        }
      });

      stats[section] = {
        total: activeFields.length,
        filled,
        required: requiredFields.length,
        requiredFilled,
        percentage: activeFields.length > 0 ? Math.round((filled / activeFields.length) * 100) : 0,
      };
    });

    return stats;
  }, [swiftFieldConfigs, swiftFieldsData]);

  // Completed sections
  const completedSections = useMemo(() => {
    const completed = new Set<string>();
    Object.entries(sectionStats).forEach(([section, stats]) => {
      if (stats.required > 0 && stats.requiredFilled === stats.required) {
        completed.add(section);
      } else if (stats.required === 0 && stats.filled > 0) {
        completed.add(section);
      }
    });
    return completed;
  }, [sectionStats]);

  // Sections with rejection comments
  const sectionsWithComments = useMemo(() => {
    if (!fieldComments || Object.keys(fieldComments).length === 0 || !swiftFieldConfigs || swiftFieldConfigs.length === 0) {
      return new Map<string, number>();
    }
    const commentedFieldCodes = new Set(Object.keys(fieldComments));
    const sectionCounts = new Map<string, number>();
    swiftFieldConfigs.forEach(config => {
      if (commentedFieldCodes.has(config.fieldCode)) {
        sectionCounts.set(config.section, (sectionCounts.get(config.section) || 0) + 1);
      }
    });
    return sectionCounts;
  }, [fieldComments, swiftFieldConfigs]);

  // Total progress
  const progress = useMemo(() => {
    const totalSections = dynamicSections.length + extraSectionsCount;
    const completed = completedSections.size;
    return totalSections > 0 ? Math.round((completed / totalSections) * 100) : 0;
  }, [dynamicSections.length, completedSections.size, extraSectionsCount]);

  // Global stats
  const globalStats = useMemo(() => {
    let totalFields = 0;
    let totalFilled = 0;
    let totalRequired = 0;
    let totalRequiredFilled = 0;

    Object.values(sectionStats).forEach(stats => {
      totalFields += stats.total;
      totalFilled += stats.filled;
      totalRequired += stats.required;
      totalRequiredFilled += stats.requiredFilled;
    });

    return {
      total: totalFields,
      filled: totalFilled,
      required: totalRequired,
      requiredFilled: totalRequiredFilled,
      percentage: totalFields > 0 ? Math.round((totalFilled / totalFields) * 100) : 0,
    };
  }, [sectionStats]);

  return {
    sectionStats,
    completedSections,
    sectionsWithComments,
    progress,
    globalStats,
  };
};
