import type { CPPAAPhaseFieldMapping } from '../../../../services/cpMethodologyService';

export interface FieldChangeInfo {
  oldValue: string | null;
  changedByName: string;
  changedAt: string;
}

export interface CardComponentProps {
  fieldConfig: CPPAAPhaseFieldMapping;
  value: string;
  phaseIdx: number;
  isDark: boolean;
  isEditing: boolean;
  onChange?: (value: string) => void;
  entityName?: string;
  fiscalYear?: number;
  fieldChangeInfo?: FieldChangeInfo;
  onDismissChange?: () => void;
}

/** Phase color palette entry */
export interface PhaseColor {
  bg: string;
  border: string;
  text: string;
  label: string;
}

export const methodologyColors: PhaseColor[] = [
  { bg: '#E8EAF6', border: '#3F51B5', text: '#1A237E', label: 'Indigo' },
  { bg: '#E3F2FD', border: '#1E88E5', text: '#0D47A1', label: 'Blue' },
  { bg: '#E8F5E9', border: '#43A047', text: '#1B5E20', label: 'Green' },
  { bg: '#FFF3E0', border: '#FB8C00', text: '#E65100', label: 'Orange' },
  { bg: '#F3E5F5', border: '#8E24AA', text: '#4A148C', label: 'Purple' },
  { bg: '#E0F2F1', border: '#00897B', text: '#004D40', label: 'Teal' },
  { bg: '#FCE4EC', border: '#E91E63', text: '#880E4F', label: 'Pink' },
  { bg: '#FFF9C4', border: '#F9A825', text: '#5D4037', label: 'Yellow' },
];

export const methodologyColorsDark: PhaseColor[] = [
  { bg: '#1A1F3D', border: '#5C6BC0', text: '#C5CAE9', label: 'Indigo' },
  { bg: '#0D2744', border: '#42A5F5', text: '#BBDEFB', label: 'Blue' },
  { bg: '#1B3A1B', border: '#66BB6A', text: '#C8E6C9', label: 'Green' },
  { bg: '#3E2510', border: '#FFA726', text: '#FFE0B2', label: 'Orange' },
  { bg: '#2A1038', border: '#AB47BC', text: '#E1BEE7', label: 'Purple' },
  { bg: '#0A3028', border: '#26A69A', text: '#B2DFDB', label: 'Teal' },
  { bg: '#3C1028', border: '#EC407A', text: '#F8BBD0', label: 'Pink' },
  { bg: '#4A4520', border: '#FFEE58', text: '#FFF9C4', label: 'Yellow' },
];

export function getPhaseColor(phaseIdx: number, isDark: boolean): PhaseColor {
  const palette = isDark ? methodologyColorsDark : methodologyColors;
  return palette[phaseIdx % palette.length];
}
