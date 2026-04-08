import type { FlowDefinition } from '../orchestrator/flow-engine.js';

export interface AppManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  screens: ScreenDef[];
  flows: FlowDefinition[];
  capabilities: string[];
}

export interface ScreenDef {
  id: string;
  route: string;
  title: string;
  description: string;
  fields: FieldDef[];
  actions: string[];
}

export interface FieldDef {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  description?: string;
}

export const SERCOP_FLOWS: FlowDefinition[] = [
  {
    id: 'crear_proceso_subasta',
    name: 'crear proceso subasta inversa',
    steps: [
      {
        id: 'step_nav',
        label: 'Navegar a creación de proceso',
        screenRoute: '/cp/processes/create',
        instructions: 'Primero debes ir a la sección de Procesos y hacer clic en "Nuevo Proceso". Te llevaré ahí ahora.',
      },
      {
        id: 'step_type',
        label: 'Seleccionar tipo de contratación',
        screenRoute: '/cp/processes/create',
        fieldId: 'processType',
        instructions: 'Selecciona "Subasta Inversa Electrónica" en el campo de Tipo de Contratación. Este procedimiento aplica para bienes y servicios normalizados.',
      },
      {
        id: 'step_object',
        label: 'Definir objeto de contratación',
        screenRoute: '/cp/processes/create',
        fieldId: 'object',
        instructions: 'Escribe el objeto de la contratación. Debe ser claro y conciso. Ejemplo: "Adquisición de equipos de computación para la entidad".',
      },
      {
        id: 'step_budget',
        label: 'Ingresar presupuesto referencial',
        screenRoute: '/cp/processes/create',
        fieldId: 'budget',
        instructions: 'Ingresa el presupuesto referencial. Para Subasta Inversa, debe superar el 0.0000002 del PIE (aprox. $7,263). Verifica la disponibilidad presupuestaria antes.',
      },
      {
        id: 'step_code',
        label: 'Código de partida presupuestaria',
        screenRoute: '/cp/processes/create',
        fieldId: 'budgetCode',
        instructions: 'Ingresa el código de partida presupuestaria. Este código debe corresponder a la certificación presupuestaria previamente emitida.',
      },
      {
        id: 'step_dates',
        label: 'Fechas del proceso',
        screenRoute: '/cp/processes/create',
        fieldId: 'startDate',
        instructions: 'Establece la fecha de inicio del proceso. El cronograma debe cumplir los plazos mínimos establecidos en el RGLOSNCP.',
      },
      {
        id: 'step_publish',
        label: 'Revisar y publicar',
        screenRoute: '/cp/processes/create',
        instructions: 'Revisa toda la información antes de publicar. Una vez publicado, el proceso estará visible para todos los proveedores habilitados en el SOCE.',
      },
    ],
  },
  {
    id: 'buscar_proceso',
    name: 'buscar proceso existente',
    steps: [
      {
        id: 'step_nav_list',
        label: 'Ir a lista de procesos',
        screenRoute: '/cp/processes',
        instructions: 'Abre el módulo de Procesos desde el menú lateral. Verás la lista de todos los procesos de tu entidad.',
      },
      {
        id: 'step_search',
        label: 'Usar el buscador',
        screenRoute: '/cp/processes',
        fieldId: 'search',
        instructions: 'Usa el campo de búsqueda para encontrar el proceso. Puedes buscar por código (ej: SIE-MSP-2024-0001), objeto o descripción.',
      },
      {
        id: 'step_filters',
        label: 'Aplicar filtros',
        screenRoute: '/cp/processes',
        fieldId: 'processType',
        instructions: 'Si hay muchos resultados, usa los filtros de Tipo de Contratación, Estado y rango de fechas para acotar la búsqueda.',
      },
    ],
  },
  {
    id: 'registrar_pac',
    name: 'crear plan anual de contratación',
    steps: [
      {
        id: 'step_nav_pac',
        label: 'Ir al Plan Anual',
        screenRoute: '/cp/pac',
        instructions: 'Navega al módulo del Plan Anual de Contratación (PAC). Este plan debe publicarse antes del 15 de enero de cada año.',
      },
      {
        id: 'step_items',
        label: 'Agregar ítems al PAC',
        screenRoute: '/cp/pac',
        fieldId: 'items',
        instructions: 'Agrega cada ítem de contratación planificada. Debes especificar: descripción, tipo de contratación, presupuesto estimado y período de ejecución.',
      },
      {
        id: 'step_publish_pac',
        label: 'Publicar el PAC',
        screenRoute: '/cp/pac',
        instructions: 'Una vez completado, publica el PAC. Este será visible en el portal de compras públicas para transparencia y control ciudadano.',
      },
    ],
  },
  {
    id: 'consultar_proveedor',
    name: 'consultar información de proveedor',
    steps: [
      {
        id: 'step_nav_prov',
        label: 'Ir a Proveedores',
        screenRoute: '/cp/providers',
        instructions: 'Accede al módulo de Proveedores para consultar información del RUP.',
      },
      {
        id: 'step_search_prov',
        label: 'Buscar proveedor',
        screenRoute: '/cp/providers',
        fieldId: 'search',
        instructions: 'Ingresa el RUC, razón social o nombre del proveedor para buscarlo en el Registro Único de Proveedores.',
      },
    ],
  },
];

export const SERCOP_APP_MANIFEST: AppManifest = {
  id: 'sercop',
  name: 'SERCOP - Sistema Nacional de Contratación Pública',
  description: 'Sistema oficial de gestión de contratación pública del Ecuador',
  version: '2.0',
  capabilities: [
    'crear_proceso', 'buscar_proceso', 'ver_contratos', 'gestionar_pac',
    'consultar_proveedores', 'ver_analytics', 'administrar_usuarios',
  ],
  flows: SERCOP_FLOWS,
  screens: [
    {
      id: 'crear_proceso',
      route: '/cp/processes/create',
      title: 'Crear Proceso de Contratación',
      description: 'Formulario para crear un nuevo proceso de contratación pública',
      fields: [
        { id: 'processType', label: 'Tipo de Contratación', type: 'select', required: true, description: 'Subasta Inversa, Cotización, Licitación, etc.' },
        { id: 'object', label: 'Objeto del Proceso', type: 'textarea', required: true, description: 'Descripción clara del bien, servicio u obra a contratar' },
        { id: 'budget', label: 'Presupuesto Referencial', type: 'number', required: true, description: 'Monto en dólares sin IVA' },
        { id: 'budgetCode', label: 'Partida Presupuestaria', type: 'text', required: true },
        { id: 'startDate', label: 'Fecha de Inicio', type: 'date', required: true },
        { id: 'description', label: 'Descripción', type: 'textarea', required: false },
      ],
      actions: ['save_draft', 'publish', 'attach_files'],
    },
  ],
};
