import type { CPPAAPhaseFieldMapping } from '../../../../services/cpMethodologyService';
import TextCard from './TextCard';
import PriorityListCard from './PriorityListCard';
import GanttTimelineCard from './GanttTimelineCard';
import ItemsTableCard from './ItemsTableCard';
import EntityInfoCard from './EntityInfoCard';
import BadgeListCard from './BadgeListCard';
import MissionCard from './MissionCard';
import ReadonlyNoteCard from './ReadonlyNoteCard';
import type { CardComponentProps, FieldChangeInfo } from './types';

/** Map component_type from DB to the correct React component */
const COMPONENT_MAP: Record<string, React.FC<CardComponentProps>> = {
  TEXT: TextCard,
  PRIORITY_LIST: PriorityListCard,
  GANTT_TIMELINE: GanttTimelineCard,
  ITEMS_TABLE: ItemsTableCard,
  ENTITY_INFO: EntityInfoCard,
  BADGE_LIST: BadgeListCard,
  MISSION_CARD: MissionCard,
  READONLY_NOTE: ReadonlyNoteCard,
  ENRICHED_TABLE: ItemsTableCard,
};

interface CardRendererProps {
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

const CardRenderer: React.FC<CardRendererProps> = (props) => {
  const { fieldConfig, value } = props;

  // Skip empty non-required fields
  if (!value && !fieldConfig.isRequired && !props.isEditing) return null;

  const componentType = fieldConfig.componentType || 'TEXT';
  const Component = COMPONENT_MAP[componentType] || TextCard;

  return <Component {...props} />;
};

export default CardRenderer;
export { COMPONENT_MAP };
