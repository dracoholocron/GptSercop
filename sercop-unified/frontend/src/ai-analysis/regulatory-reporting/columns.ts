/**
 * Column definitions for Regulatory Reporting
 */

import type { ColumnDefinition } from './types';

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  // Operation Info
  {
    key: 'reference',
    label: 'Operation Number',
    labelEs: 'Número de Operación',
    category: 'operation',
    defaultVisible: true,
    width: 150,
    minWidth: 120,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'productType',
    label: 'Product Type',
    labelEs: 'Producto de Riesgo',
    category: 'operation',
    defaultVisible: true,
    width: 140,
    minWidth: 120,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'status',
    label: 'Status',
    labelEs: 'Estado',
    category: 'operation',
    defaultVisible: true,
    width: 110,
    minWidth: 90,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'stage',
    label: 'Stage',
    labelEs: 'Etapa',
    category: 'operation',
    defaultVisible: true,
    width: 120,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'messageType',
    label: 'Event',
    labelEs: 'Evento',
    category: 'operation',
    defaultVisible: true,
    width: 120,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },

  // Client Info
  {
    key: 'applicantName',
    label: 'Applicant Name',
    labelEs: 'Nombre Cliente Ordenante',
    category: 'client',
    defaultVisible: true,
    width: 200,
    minWidth: 150,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'applicantId',
    label: 'Client ID',
    labelEs: 'Identificación Cliente',
    category: 'client',
    defaultVisible: false,
    width: 130,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'beneficiaryName',
    label: 'Beneficiary Name',
    labelEs: 'Nombre Cliente Beneficiario',
    category: 'client',
    defaultVisible: true,
    width: 200,
    minWidth: 150,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'beneficiaryId',
    label: 'Beneficiary ID',
    labelEs: 'ID Beneficiario',
    category: 'client',
    defaultVisible: false,
    width: 130,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },

  // Bank Info
  {
    key: 'issuingBankName',
    label: 'Issuing Bank',
    labelEs: 'Banco Emisor',
    category: 'bank',
    defaultVisible: true,
    width: 180,
    minWidth: 140,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'issuingBankSwift',
    label: 'Issuing Bank SWIFT',
    labelEs: 'SWIFT Banco Emisor',
    category: 'bank',
    defaultVisible: false,
    width: 140,
    minWidth: 110,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'issuingBankCountry',
    label: 'Issuing Bank Country',
    labelEs: 'País Banco Emisor',
    category: 'bank',
    defaultVisible: false,
    width: 140,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'advisingBankName',
    label: 'Advising Bank',
    labelEs: 'Banco Avisador',
    category: 'bank',
    defaultVisible: false,
    width: 180,
    minWidth: 140,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'advisingBankSwift',
    label: 'Advising Bank SWIFT',
    labelEs: 'SWIFT Banco Avisador',
    category: 'bank',
    defaultVisible: false,
    width: 140,
    minWidth: 110,
    sortable: true,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'advisingBankCountry',
    label: 'Advising Bank Country',
    labelEs: 'País Banco Avisador',
    category: 'bank',
    defaultVisible: false,
    width: 140,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },

  // Amount Info
  {
    key: 'currency',
    label: 'Currency',
    labelEs: 'Moneda',
    category: 'amount',
    defaultVisible: true,
    width: 90,
    minWidth: 70,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
  {
    key: 'amount',
    label: 'Amount',
    labelEs: 'Monto Operación',
    category: 'amount',
    defaultVisible: true,
    width: 140,
    minWidth: 110,
    sortable: true,
    filterable: true,
    filterType: 'number',
    format: (val) => typeof val === 'number' ? val.toLocaleString('en-US', { minimumFractionDigits: 2 }) : String(val || '')
  },
  {
    key: 'exchangeRate',
    label: 'Exchange Rate',
    labelEs: 'Tipo de Cambio',
    category: 'amount',
    defaultVisible: false,
    width: 120,
    minWidth: 90,
    sortable: true,
    filterable: false
  },
  {
    key: 'amountBase',
    label: 'Base Amount',
    labelEs: 'Monto Moneda Base',
    category: 'amount',
    defaultVisible: false,
    width: 140,
    minWidth: 110,
    sortable: true,
    filterable: true,
    filterType: 'number'
  },

  // Dates
  {
    key: 'issueDate',
    label: 'Issue Date',
    labelEs: 'Fecha de Emisión',
    category: 'dates',
    defaultVisible: true,
    width: 120,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'date',
    format: (val) => val ? new Date(val as string).toLocaleDateString() : ''
  },
  {
    key: 'expiryDate',
    label: 'Expiry Date',
    labelEs: 'Fecha de Vencimiento',
    category: 'dates',
    defaultVisible: true,
    width: 130,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'date',
    format: (val) => val ? new Date(val as string).toLocaleDateString() : ''
  },
  {
    key: 'createdAt',
    label: 'Created At',
    labelEs: 'Fecha Creación',
    category: 'dates',
    defaultVisible: false,
    width: 120,
    minWidth: 100,
    sortable: true,
    filterable: true,
    filterType: 'date',
    format: (val) => val ? new Date(val as string).toLocaleDateString() : ''
  },

  // Other
  {
    key: 'description',
    label: 'Description',
    labelEs: 'Descripción de Mercadería',
    category: 'other',
    defaultVisible: false,
    width: 250,
    minWidth: 180,
    sortable: false,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'guaranteeObject',
    label: 'Guarantee Object',
    labelEs: 'Objeto de la Garantía',
    category: 'other',
    defaultVisible: false,
    width: 200,
    minWidth: 150,
    sortable: false,
    filterable: true,
    filterType: 'text'
  },
  {
    key: 'createdBy',
    label: 'Created By',
    labelEs: 'Usuario',
    category: 'other',
    defaultVisible: false,
    width: 120,
    minWidth: 90,
    sortable: true,
    filterable: true,
    filterType: 'select'
  },
];

export const CATEGORY_LABELS = {
  operation: { en: 'Operation', es: 'Operación' },
  client: { en: 'Client', es: 'Cliente' },
  bank: { en: 'Bank', es: 'Banco' },
  amount: { en: 'Amount', es: 'Montos' },
  dates: { en: 'Dates', es: 'Fechas' },
  other: { en: 'Other', es: 'Otros' },
};
