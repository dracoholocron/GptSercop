import {
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiCreditCard,
  FiTruck,
  FiPackage,
  FiHome,
  FiEdit3,
} from 'react-icons/fi';
import { SharedAccordionExpertView } from '../shared/AccordionExpertView';
import { AccountingSection, SwiftPreviewSection } from '../lc-issuance/sections';
import type { SwiftSectionConfig } from '../../services/swiftSectionConfigService';
import type { CustomFieldStepDTO } from '../../services/customFieldsService';
import type { SwiftFieldConfig } from '../../types/swiftField';
import type { IconType } from 'react-icons';

const LC_EXPORT_ICONS: Record<string, IconType> = {
  'BASICA': FiFileText,
  'MONTOS': FiDollarSign,
  'FECHAS': FiCalendar,
  'PARTES': FiUsers,
  'DISPONIBILIDAD': FiCreditCard,
  'EMBARQUE': FiTruck,
  'MERCANCIAS': FiPackage,
  'BANCOS': FiHome,
  'INSTRUCCIONES': FiEdit3,
};

const LC_EXPORT_COLORS: Record<string, string> = {
  'BASICA': 'blue',
  'MONTOS': 'green',
  'FECHAS': 'purple',
  'PARTES': 'orange',
  'DISPONIBILIDAD': 'cyan',
  'EMBARQUE': 'teal',
  'MERCANCIAS': 'pink',
  'BANCOS': 'yellow',
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
}

export const AccordionExpertView: React.FC<AccordionExpertViewProps> = (props) => (
  <SharedAccordionExpertView
    {...props}
    messageType="MT700"
    productType="LC_EXPORT"
    headerColor="blue"
    showAccounting={true}
    showSwiftPreview={true}
    sectionIcons={LC_EXPORT_ICONS}
    sectionColors={LC_EXPORT_COLORS}
    AccountingSectionComponent={AccountingSection}
    SwiftPreviewSectionComponent={SwiftPreviewSection}
  />
);

export default AccordionExpertView;
