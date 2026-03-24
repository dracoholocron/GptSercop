/**
 * Shared icon map for menu items
 * Maps icon name strings to react-icons components
 */

import {
  FiHome, FiUsers, FiFileText, FiShield, FiFolder, FiFile, FiCpu,
  FiArchive, FiSearch, FiMail, FiZap, FiBarChart2, FiHash, FiBriefcase,
  FiInbox, FiCheckSquare, FiMessageSquare, FiActivity, FiSettings,
  FiDollarSign, FiDroplet, FiClock, FiEdit, FiCode, FiCreditCard,
  FiKey, FiPercent, FiUserCheck,
} from 'react-icons/fi';
import {
  LuBot, LuBuilding, LuFilePen, LuFileInput, LuFileOutput, LuFileType,
  LuFolderOpen, LuHandshake, LuHistory, LuPalette, LuReceipt,
  LuShieldCheck, LuUserCog, LuWallet, LuWand,
} from 'react-icons/lu';
import type { IconType } from 'react-icons';

export const iconMap: Record<string, IconType> = {
  Home: FiHome, Users: FiUsers, FileText: FiFileText, Shield: FiShield,
  Folder: FiFolder, File: FiFile, Cpu: FiCpu, Archive: FiArchive,
  Search: FiSearch, Mail: FiMail, Zap: FiZap, BarChart: FiBarChart2,
  Hash: FiHash, Briefcase: FiBriefcase, Inbox: FiInbox, CheckSquare: FiCheckSquare,
  MessageSquare: FiMessageSquare, Activity: FiActivity, Settings: FiSettings,
  DollarSign: FiDollarSign, Droplet: FiDroplet, Clock: FiClock, Edit: FiEdit,
  Code: FiCode, CreditCard: FiCreditCard, Key: FiKey, Percent: FiPercent,
  UserCheck: FiUserCheck, Bot: LuBot, Building: LuBuilding, FileEdit: LuFilePen,
  FileInput: LuFileInput, FileOutput: LuFileOutput, FileType: LuFileType,
  FolderOpen: LuFolderOpen, Handshake: LuHandshake, History: LuHistory,
  Palette: LuPalette, Receipt: LuReceipt, ShieldCheck: LuShieldCheck,
  UserCog: LuUserCog, Wallet: LuWallet, Wand: LuWand,
};

export const getIcon = (iconName: string | null): IconType => {
  if (!iconName) return FiFile;
  return iconMap[iconName] || FiFile;
};
