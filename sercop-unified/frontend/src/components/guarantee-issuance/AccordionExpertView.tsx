import {
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiShield,
  FiHome,
  FiEdit3,
  FiInfo,
} from 'react-icons/fi';
import { SharedAccordionExpertView } from '../shared/AccordionExpertView';
import { AccountingSection, SwiftPreviewSection } from './sections';
import type { SwiftSectionConfig } from '../../services/swiftSectionConfigService';
import type { CustomFieldStepDTO } from '../../services/customFieldsService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { IconType } from 'react-icons';

const GUARANTEE_ICONS: Record<string, IconType> = {
  'BASICA': FiFileText,
  'MONTOS': FiDollarSign,
  'FECHAS': FiCalendar,
  'PARTES': FiUsers,
  'TERMINOS': FiShield,
  'BANCOS': FiHome,
  'ADICIONAL': FiInfo,
  'INSTRUCCIONES': FiEdit3,
};

const GUARANTEE_COLORS: Record<string, string> = {
  'BASICA': 'purple',
  'MONTOS': 'green',
  'FECHAS': 'blue',
  'PARTES': 'orange',
  'TERMINOS': 'teal',
  'BANCOS': 'yellow',
  'ADICIONAL': 'pink',
  'INSTRUCCIONES': 'gray',
};

interface AccordionExpertViewProps {
  dynamicSections: SwiftSectionConfig[];
  swiftFieldsData: Record<string, any>;
  onSwiftFieldChange: (fieldCode: string, value: any) => void;
  customData: Record<string, any>;
  onCustomDataChange: (data: Record<string, any>) => void;
  customFieldSteps?: CustomFieldStepDTO[];
  customFieldsUserData?: Array<{ id: string; name: string }>;
  approvalMode?: boolean;
  errorSections?: string[];
  swiftFieldConfigs?: SwiftFieldConfig[];
  accountingEntry?: any;
  loadingAccountingEntry?: boolean;
  accountingEntryError?: string | null;
  calculatedCommission?: number;
  diasVigencia?: number;
  isCommissionDeferred?: boolean;
  setIsCommissionDeferred?: (value: boolean) => void;
  paymentSchedule?: any[];
  setPaymentSchedule?: (schedule: any[]) => void;
  deferredPaymentsDialogOpen?: boolean;
  setDeferredPaymentsDialogOpen?: (open: boolean) => void;
  selectedEntities?: any;
  swiftConfigs?: any[];
  fieldComments?: Record<string, { comment: string; commentedAt: string; commentedBy: string }>;
  onSaveFieldComment?: (fieldCode: string, comment: string) => void;
  onRemoveFieldComment?: (fieldCode: string) => void;
  fieldCommentMode?: 'approver' | 'creator' | 'none';
  alertSelectedIds?: Set<number>;
  onAlertSelectedChange?: (ids: Set<number>) => void;
}

export const AccordionExpertView: React.FC<AccordionExpertViewProps> = (props) => (
  <SharedAccordionExpertView
    {...props}
    messageType="MT760"
    productType="GUARANTEE"
    headerColor="purple"
    showAccounting={true}
    showAlerts={true}
    alertOperationType="GUARANTEE"
    alertEventCode="ISSUE"
    alertSelectedIds={props.alertSelectedIds}
    onAlertSelectedChange={props.onAlertSelectedChange}
    showSwiftPreview={true}
    sectionIcons={GUARANTEE_ICONS}
    sectionColors={GUARANTEE_COLORS}
    AccountingSectionComponent={AccountingSection}
    SwiftPreviewSectionComponent={SwiftPreviewSection}
  />
);

export default AccordionExpertView;
