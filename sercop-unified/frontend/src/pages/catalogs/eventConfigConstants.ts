/**
 * Shared constants and helpers for event configuration components.
 * Extracted from EventTypeConfigAdmin.tsx to be reused across master-detail sub-components.
 */
import {
  FiSend,
  FiEdit2,
  FiCheckCircle,
  FiFileText,
  FiAlertTriangle,
  FiCheck,
  FiDollarSign,
  FiXCircle,
  FiCalendar,
  FiUnlock,
  FiClock,
  FiArchive,
  FiCornerUpLeft,
  FiUserCheck,
  FiUsers,
  FiGlobe,
} from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { RiShieldCheckLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { TbBuildingBank, TbCertificate, TbReceipt, TbUserDollar } from 'react-icons/tb';
import { LuFactory } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import type { EventTypeConfigCommand, EventFlowConfigCommand } from '../../types/operations';

// Role icons mapping
export const getRoleIcon = (role?: string): IconType => {
  if (!role) return FiUsers;
  const roleUpper = role.toUpperCase();
  if (roleUpper.includes('ISSUING')) return HiOutlineBuildingLibrary;
  if (roleUpper.includes('ADVISING')) return TbBuildingBank;
  if (roleUpper.includes('CONFIRMING')) return RiShieldCheckLine;
  if (roleUpper.includes('REIMBURSING')) return RiMoneyDollarCircleLine;
  if (roleUpper.includes('COLLECTING')) return TbReceipt;
  if (roleUpper.includes('PRESENTING')) return TbCertificate;
  if (roleUpper.includes('BENEFICIARY')) return TbUserDollar;
  if (roleUpper.includes('APPLICANT')) return LuFactory;
  return FiGlobe;
};

// Available icons for events
export const availableIcons: { name: string; icon: IconType }[] = [
  { name: 'FiSend', icon: FiSend },
  { name: 'FiEdit2', icon: FiEdit2 },
  { name: 'FiCheckCircle', icon: FiCheckCircle },
  { name: 'FiFileText', icon: FiFileText },
  { name: 'FiAlertTriangle', icon: FiAlertTriangle },
  { name: 'FiCheck', icon: FiCheck },
  { name: 'FiDollarSign', icon: FiDollarSign },
  { name: 'FiXCircle', icon: FiXCircle },
  { name: 'FiCalendar', icon: FiCalendar },
  { name: 'FiUnlock', icon: FiUnlock },
  { name: 'FiClock', icon: FiClock },
  { name: 'FiArchive', icon: FiArchive },
  { name: 'FiCornerUpLeft', icon: FiCornerUpLeft },
  { name: 'FiUserCheck', icon: FiUserCheck },
];

export const availableColors = [
  { name: 'blue', label: 'Blue' },
  { name: 'green', label: 'Green' },
  { name: 'orange', label: 'Orange' },
  { name: 'red', label: 'Red' },
  { name: 'purple', label: 'Purple' },
  { name: 'teal', label: 'Teal' },
  { name: 'yellow', label: 'Yellow' },
  { name: 'pink', label: 'Pink' },
  { name: 'gray', label: 'Gray' },
];

// These are fallback defaults for Trade Finance only.
// The actual values are loaded dynamically from the API via productTypeConfigService.getAllConfigs()
// CP types are now centralized in product_type_config table and loaded from there.
export const operationTypesFallback = [
  { value: 'LC_IMPORT', label: 'LC Import' },
  { value: 'LC_EXPORT', label: 'LC Export' },
  { value: 'GUARANTEE', label: 'Guarantee' },
  { value: 'COLLECTION', label: 'Collection' },
  { value: 'STANDBY_LC', label: 'Standby LC' },
  { value: 'COLLECTION_IMPORT', label: 'Collection Import' },
  { value: 'COLLECTION_EXPORT', label: 'Collection Export' },
  { value: 'GUARANTEE_MANDATARIA', label: 'Guarantee Mandataria' },
  { value: 'TRADE_FINANCING', label: 'Trade Financing' },
  { value: 'AVAL_DESCUENTO', label: 'Aval Descuento' },
];

export const swiftMessageTypesFallback = [
  '', 'MT700', 'MT707', 'MT710', 'MT720', 'MT730', 'MT732', 'MT734',
  'MT740', 'MT742', 'MT747', 'MT750', 'MT752', 'MT754', 'MT756',
  'MT760', 'MT765', 'MT767', 'MT768', 'MT769',
  'MT400', 'MT405', 'MT410', 'MT412', 'MT416', 'MT420', 'MT422', 'MT430',
  'MT799',
];

export const stagesFallback = [
  'ISSUED', 'ADVISED', 'CONFIRMED', 'AMENDED', 'UTILIZED',
  'CANCELLED', 'EXPIRED', 'CLOSED', 'DRAFT', 'PENDING',
  'DEMAND_PRESENTED', 'EXTENDED', 'RECEIVED', 'PRESENTED', 'ACCEPTED',
  'REFUSED', 'PAID', 'DOCS_RETURNED', 'SENT', 'PROCEEDS_REMITTED',
  'MANDATE_RECEIVED', 'CLAIMED', 'RELEASED', 'CREATED', 'APPROVED',
  'DISBURSED', 'ROLLED_OVER', 'RESTRUCTURED', 'SETTLED',
  'DRAFT_RECEIVED', 'ENDORSED', 'DISCOUNTED', 'PROTESTED',
];

export const stagesWithEmptyFallback = ['', ...stagesFallback];

export const statuses = [
  'ACTIVE', 'PENDING_RESPONSE', 'PENDING_DOCUMENTS', 'ON_HOLD',
  'COMPLETED', 'CANCELLED', 'CLOSED',
];

export const messageParticipants = [
  { value: '', label: '-' },
  { value: 'ISSUING_BANK', label: 'Issuing Bank' },
  { value: 'ADVISING_BANK', label: 'Advising Bank' },
  { value: 'CONFIRMING_BANK', label: 'Confirming Bank' },
  { value: 'BENEFICIARY', label: 'Beneficiary' },
  { value: 'APPLICANT', label: 'Applicant' },
  { value: 'COLLECTING_BANK', label: 'Collecting Bank' },
  { value: 'PRESENTING_BANK', label: 'Presenting Bank' },
];

export const ourRoleOptions = [
  { value: '', label: '-' },
  { value: 'SENDER', label: 'Sender' },
  { value: 'RECEIVER', label: 'Receiver' },
];

export const eventCategories = [
  { value: '', label: '-' },
  { value: 'ISSUANCE', label: 'Issuance' },
  { value: 'ADVICE', label: 'Advice' },
  { value: 'AMENDMENT', label: 'Amendment' },
  { value: 'DOCUMENTS', label: 'Documents' },
  { value: 'PAYMENT', label: 'Payment' },
  { value: 'CLAIM', label: 'Claim' },
  { value: 'CLOSURE', label: 'Closure' },
];

export const eventSourceOptions = [
  { value: 'BACKOFFICE', label: 'Backoffice Only' },
  { value: 'CLIENT_PORTAL', label: 'Client Portal Only' },
  { value: 'CLIENT_AND_BACKOFFICE', label: 'Client & Backoffice' },
];

export const emptyTypeForm: EventTypeConfigCommand = {
  eventCode: '',
  operationType: 'LC_IMPORT',
  language: 'en',
  eventName: '',
  eventDescription: '',
  helpText: '',
  outboundMessageType: '',
  inboundMessageType: '',
  validFromStages: [],
  validFromStatuses: [],
  resultingStage: '',
  resultingStatus: '',
  icon: 'FiSend',
  color: 'blue',
  displayOrder: 0,
  messageSender: '',
  messageReceiver: '',
  ourRole: '',
  requiresSwiftMessage: false,
  eventCategory: '',
  isClientRequestable: false,
  eventSource: 'BACKOFFICE',
  isActive: true,
  requiresApproval: false,
  approvalLevels: 1,
  isReversible: false,
  generatesNotification: true,
  allowedRoles: [],
};

export const emptyFlowForm: EventFlowConfigCommand = {
  operationType: 'LC_IMPORT',
  fromEventCode: '',
  fromStage: '',
  toEventCode: '',
  conditions: {},
  isRequired: false,
  isOptional: true,
  sequenceOrder: 0,
  language: 'en',
  transitionLabel: '',
  transitionHelp: '',
  isActive: true,
};

/** Resolve an icon name string (e.g. "FiSend") to its React icon component */
export const getIconComponent = (iconName?: string): IconType => {
  const iconDef = availableIcons.find(i => i.name === iconName);
  return iconDef ? iconDef.icon : FiSend;
};
