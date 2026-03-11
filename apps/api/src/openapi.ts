/** OpenAPI 3 spec para documentación de la API SERCOP V2 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: { title: 'SERCOP V2 API', version: '0.1.0', description: 'API de contratación pública SERCOP V2' },
  servers: [{ url: '/', description: 'API base' }],
  paths: {
    '/health': {
      get: { summary: 'Health check', responses: { '200': { description: 'OK' }, '503': { description: 'Degraded' } } },
    },
    '/ready': {
      get: { summary: 'Readiness (K8s)', responses: { '200': { description: 'Ready' } } },
    },
    '/api/v1/auth/login': {
      post: {
        summary: 'Login (JWT)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { email: { type: 'string' }, role: { type: 'string', enum: ['supplier', 'entity', 'admin'] } },
              },
            },
          },
        },
        responses: { '200': { description: 'Token' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/tenders': {
      get: {
        summary: 'Listar procesos (paginado)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'data, total, page, pageSize' } },
      },
    },
    '/api/v1/users': {
      get: {
        summary: 'Listar usuarios (protegido)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
          { name: 'offset', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { '200': { description: 'data, total' }, '401': { description: 'Unauthorized' } },
      },
    },
    '/api/v1/rag/chunks': {
      get: {
        summary: 'Listar chunks RAG (protegido)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'data, total' }, '401': { description: 'Unauthorized' } },
      },
      post: {
        summary: 'Crear chunk RAG (protegido)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content', 'source', 'documentType'],
                properties: {
                  title: { type: 'string' },
                  content: { type: 'string' },
                  source: { type: 'string' },
                  documentType: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created' }, '401': { description: 'Unauthorized' } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http' as const, scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
};
