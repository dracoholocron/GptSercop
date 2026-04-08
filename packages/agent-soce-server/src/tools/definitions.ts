import type { ToolDef } from '../types/index.js';

export const AGENT_TOOLS: ToolDef[] = [
  {
    name: 'search_knowledge',
    description: 'Buscar en la base de conocimiento (normativa, procedimientos, guías) usando búsqueda semántica + keyword.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Pregunta o tema a buscar' },
      },
      required: ['query'],
    },
  },
  {
    name: 'query_data',
    description: 'Consultar la base de datos transaccional o data marts con lenguaje natural. Los resultados se filtran según permisos del usuario.',
    parameters: {
      type: 'object',
      properties: {
        dataSourceId: { type: 'string', description: 'ID o nombre del data source a consultar' },
        question: { type: 'string', description: 'Pregunta en lenguaje natural sobre los datos' },
      },
      required: ['dataSourceId', 'question'],
    },
  },
  {
    name: 'navigate',
    description: 'Navegar a una pantalla específica del sistema SERCOP.',
    parameters: {
      type: 'object',
      properties: {
        route: { type: 'string', description: 'Ruta de destino (e.g., /cp/processes/create)' },
        reason: { type: 'string', description: 'Razón de la navegación' },
      },
      required: ['route'],
    },
  },
  {
    name: 'highlight_field',
    description: 'Resaltar un campo específico en la pantalla actual para guiar al usuario.',
    parameters: {
      type: 'object',
      properties: {
        fieldId: { type: 'string', description: 'ID del campo a resaltar' },
        instructions: { type: 'string', description: 'Instrucciones para el usuario' },
      },
      required: ['fieldId', 'instructions'],
    },
  },
  {
    name: 'start_guided_flow',
    description: 'Iniciar un flujo guiado paso a paso para crear o completar un proceso.',
    parameters: {
      type: 'object',
      properties: {
        flowId: { type: 'string', description: 'ID del flujo guiado a iniciar' },
      },
      required: ['flowId'],
    },
  },
  {
    name: 'query_provider_graph',
    description: 'Consultar el grafo de relaciones entre proveedores para detectar conexiones y patrones.',
    parameters: {
      type: 'object',
      properties: {
        providerId: { type: 'string', description: 'ID del proveedor a consultar' },
        maxHops: { type: 'number', description: 'Número máximo de saltos en el grafo (1-5)' },
      },
      required: ['providerId'],
    },
  },
];
