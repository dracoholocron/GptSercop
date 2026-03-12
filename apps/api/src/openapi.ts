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
          { name: 'method', in: 'query', schema: { type: 'string' } },
          { name: 'processType', in: 'query', schema: { type: 'string', description: 'Tipo de proceso (ej. infima_cuantia)' } },
          { name: 'regime', in: 'query', schema: { type: 'string', description: 'Régimen (ej. ordinario)' } },
          { name: 'territoryPreference', in: 'query', schema: { type: 'string', enum: ['ninguna', 'amazonia', 'galapagos'], description: 'Preferencia territorial (Amazonía, Galápagos)' } },
          { name: 'isRestrictedVisibility', in: 'query', schema: { type: 'boolean', description: 'Visibilidad restringida' } },
        ],
        responses: { '200': { description: 'data, total, page, pageSize' } },
      },
    },
    '/api/v1/processes/{id}/offer-form-config': {
      get: {
        summary: 'Obtener configuración de wizard de oferta por proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OfferFormConfig (JSON)' }, '500': { description: 'Error' } },
      },
      put: {
        summary: 'Guardar configuración de wizard por proceso (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modality', 'config'],
                properties: { modality: { type: 'string' }, version: { type: 'string' }, config: { type: 'object' } },
              },
            },
          },
        },
        responses: { '200': { description: 'Config guardada (JSON)' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/offers/drafts': {
      post: {
        summary: 'Crear borrador de oferta (wizard)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['processId', 'providerId'],
                properties: { processId: { type: 'string' }, tenderId: { type: 'string' }, providerId: { type: 'string' }, modality: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'OfferDraft' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/offers/drafts/{id}': {
      get: {
        summary: 'Obtener borrador de oferta',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'OfferDraft' }, '404': { description: 'Not found' } },
      },
      patch: {
        summary: 'Actualizar borrador (merge stepData / status)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { stepData: { type: 'object' }, status: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'OfferDraft' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/offers/{id}/validate': {
      post: {
        summary: 'Validar borrador (según OfferFormConfig)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'ok/status' }, '422': { description: 'Issues' } },
      },
    },
    '/api/v1/offers/{id}/sign/start': {
      post: {
        summary: 'Iniciar firma (simulación/stub)',
        description: 'En desarrollo: simulación. En producción se sustituirá por integración con proveedor de firma electrónica. Límites por oferta: 20 MB por archivo, 100 MB total.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'signSessionId' }, '409': { description: 'Invalid state' } },
      },
    },
    '/api/v1/offers/{id}/sign/complete': {
      post: {
        summary: 'Completar firma (simulación/stub)',
        description: 'Simulación para desarrollo. En producción: proveedor de firma electrónica real.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['signSessionId'], properties: { signSessionId: { type: 'string' }, action: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'COMPLETED' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/offers/{id}/otp/send': {
      post: {
        summary: 'Enviar OTP (simulación/stub)',
        description: 'En desarrollo: no se envía SMS/email real. En producción: integración con canal SMS/EMAIL real.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['channel', 'destination'], properties: { channel: { type: 'string', enum: ['SMS', 'EMAIL'] }, destination: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'otpSessionId (+ debugCode en dev)' } },
      },
    },
    '/api/v1/offers/{id}/otp/verify': {
      post: {
        summary: 'Verificar OTP (simulación/stub)',
        description: 'Simulación: en producción el código se validará contra el enviado por SMS/email.',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', required: ['otpSessionId', 'code'], properties: { otpSessionId: { type: 'string' }, code: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'VERIFIED' }, '400': { description: 'Invalid' } },
      },
    },
    '/api/v1/offers/{id}/submit': {
      post: {
        summary: 'Enviar oferta (submit) y generar acuse',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'SUBMITTED + receipt' }, '409': { description: 'Invalid state' } },
      },
    },
    '/api/v1/documents/presign': {
      post: {
        summary: 'Obtener URL presign para subir documento (S3/MinIO)',
        description: 'Límites: 20 MB por archivo, 100 MB total por oferta/borrador. Respuesta 413 si se excede.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['docType', 'fileName', 'mimeType', 'sizeBytes'],
                properties: { draftId: { type: 'string' }, offerId: { type: 'string' }, docType: { type: 'string' }, fileName: { type: 'string' }, mimeType: { type: 'string' }, sizeBytes: { type: 'integer' } },
              },
            },
          },
        },
        responses: { '200': { description: 'uploadUrl + storageKey' }, '413': { description: 'Too large' } },
      },
    },
    '/api/v1/documents/commit': {
      post: {
        summary: 'Registrar documento subido (commit) y aplicar límites',
        description: 'Valida tamaño por archivo (máx 20 MB) y total por oferta (máx 100 MB). 413 si excede.',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['docType', 'fileName', 'mimeType', 'sizeBytes', 'hash', 'storageKey'],
                properties: { draftId: { type: 'string' }, offerId: { type: 'string' }, docType: { type: 'string' }, fileName: { type: 'string' }, mimeType: { type: 'string' }, sizeBytes: { type: 'integer' }, hash: { type: 'string' }, storageKey: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'OfferDocument' }, '413': { description: 'Too large' } },
      },
    },
    '/api/v1/offer-documents': {
      get: {
        summary: 'Listar documentos por draft u offer',
        parameters: [
          { name: 'draftId', in: 'query', schema: { type: 'string' } },
          { name: 'offerId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'data[]' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/sie/{tenderId}/status': {
      get: {
        summary: 'Estado SIE (polling)',
        parameters: [
          { name: 'tenderId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'auction + bestBid + myLastBid' } },
      },
    },
    '/api/v1/sie/{tenderId}/initial': {
      post: {
        summary: 'Enviar oferta inicial SIE',
        parameters: [{ name: 'tenderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['providerId', 'amount'], properties: { providerId: { type: 'string' }, amount: { type: 'number' } } } } } },
        responses: { '201': { description: 'ok + bidId' } },
      },
    },
    '/api/v1/sie/{tenderId}/bids': {
      post: {
        summary: 'Registrar puja SIE',
        parameters: [{ name: 'tenderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['providerId', 'amount'], properties: { providerId: { type: 'string' }, amount: { type: 'number' } } } } } },
        responses: { '201': { description: 'ok + bidId' }, '422': { description: 'Debe mejorar mejor oferta' } },
      },
    },
    '/api/v1/sie/{tenderId}/negotiation/final': {
      post: {
        summary: 'Enviar oferta final de negociación SIE',
        parameters: [{ name: 'tenderId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['providerId', 'amount'], properties: { providerId: { type: 'string' }, amount: { type: 'number' } } } } } },
        responses: { '201': { description: 'ok + bidId' } },
      },
    },
    '/api/v1/offers': {
      get: {
        summary: 'Listar ofertas (por proceso/tender)',
        parameters: [
          { name: 'processId', in: 'query', schema: { type: 'string' } },
          { name: 'tenderId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'data[]' } },
      },
    },
    '/api/v1/offers/{id}/status': {
      post: {
        summary: 'Actualizar estado de oferta (admin/entity)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['status'], properties: { status: { type: 'string' } } } } } },
        responses: { '200': { description: 'Offer' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/offers/{id}/clarifications': {
      get: {
        summary: 'Listar aclaraciones de una oferta',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'data[]' } },
      },
      post: {
        summary: 'Solicitar aclaración (admin/entity)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['subject', 'message'], properties: { subject: { type: 'string' }, message: { type: 'string' } } } } } },
        responses: { '201': { description: 'OfferClarification' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/offers/{id}/clarifications/{clarificationId}/respond': {
      post: {
        summary: 'Responder aclaración (supplier)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'clarificationId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { content: { 'application/json': { schema: { type: 'object', required: ['response'], properties: { response: { type: 'string' } } } } } },
        responses: { '200': { description: 'OfferClarification' } },
      },
    },
    '/api/v1/complaints': {
      post: {
        summary: 'Registrar denuncia pública',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['channel', 'category', 'summary'],
                properties: {
                  tenderId: { type: 'string' },
                  entityId: { type: 'string' },
                  providerId: { type: 'string' },
                  channel: { type: 'string' },
                  category: { type: 'string' },
                  summary: { type: 'string' },
                  details: { type: 'string' },
                  contactEmail: { type: 'string' },
                  contactPhone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Complaint' }, '400': { description: 'Bad request' } },
      },
      get: {
        summary: 'Listar denuncias (admin)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tenderId', in: 'query', schema: { type: 'string' } },
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'data[]' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/complaints/{id}': {
      patch: {
        summary: 'Actualizar denuncia (estado/categoría)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  category: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Complaint' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/process-claims': {
      post: {
        summary: 'Registrar reclamo de proceso (supplier)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['tenderId', 'providerId', 'kind', 'subject', 'message'],
                properties: {
                  tenderId: { type: 'string' },
                  providerId: { type: 'string' },
                  kind: { type: 'string' },
                  subject: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'ProcessClaim' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
      },
      get: {
        summary: 'Listar reclamos de proceso (admin/entity)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'tenderId', in: 'query', schema: { type: 'string' } },
          { name: 'providerId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'data[]' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/process-claims/{id}': {
      patch: {
        summary: 'Actualizar reclamo de proceso',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  response: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'ProcessClaim' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/contracts/{id}/payments': {
      get: {
        summary: 'Listar pagos de contrato',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'data[]' }, '404': { description: 'Not found' } },
      },
      post: {
        summary: 'Crear pago de contrato',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['sequenceNo', 'amount'],
                properties: {
                  sequenceNo: { type: 'integer' },
                  amount: { type: 'number' },
                  status: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'ContractPayment' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/tenders/{id}/clarifications': {
      get: {
        summary: 'Listar aclaraciones/preguntas del proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'data[]' }, '404': { description: 'Not found' } },
      },
      post: {
        summary: 'Formular pregunta sobre el proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['question'],
                properties: { question: { type: 'string' }, askedByProviderId: { type: 'string' } },
              },
            },
          },
        },
        responses: { '201': { description: 'TenderClarification' }, '400': { description: 'Bad request' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/tender-clarifications/{clarificationId}': {
      patch: {
        summary: 'Responder aclaración del proceso (admin/entity)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'clarificationId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['answer'],
                properties: { answer: { type: 'string' } },
              },
            },
          },
        },
        responses: { '200': { description: 'TenderClarification' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/v1/contract-payments/{paymentId}': {
      patch: {
        summary: 'Actualizar pago de contrato',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'paymentId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  amount: { type: 'number' },
                  dueDate: { type: 'string', format: 'date-time' },
                  paidAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'ContractPayment' }, '400': { description: 'Bad request' }, '403': { description: 'Forbidden' } },
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
    '/api/v1/tenders/{id}/bids': {
      get: {
        summary: 'Listar ofertas (bids) del proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'data[]' }, '404': { description: 'Not found' } },
      },
      post: {
        summary: 'Crear oferta (bid) en proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['providerId'],
                properties: {
                  providerId: { type: 'string' },
                  amount: { type: 'number' },
                  baePercentage: { type: 'number', description: 'Porcentaje BAE (Valor Agregado Ecuatoriano)' },
                  nationalParticipation: { type: 'boolean', description: 'Participación nacional' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Bid' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/tenders/{id}/evaluations': {
      get: {
        summary: 'Listar evaluaciones del proceso',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'data[]' }, '404': { description: 'Not found' } },
      },
      post: {
        summary: 'Crear evaluación de oferta',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['bidId'],
                properties: {
                  bidId: { type: 'string' },
                  technicalScore: { type: 'number' },
                  financialScore: { type: 'number' },
                  baeScore: { type: 'number', description: 'Puntaje BAE' },
                  nationalPartScore: { type: 'number', description: 'Puntaje participación nacional' },
                  totalScore: { type: 'number' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Evaluation' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/providers/{id}': {
      put: {
        summary: 'Actualizar proveedor (RUP)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  registrationStep: { type: 'integer' },
                  registrationData: { type: 'object' },
                  activityCodes: { type: 'array', items: { type: 'string' }, description: 'Códigos CPC' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Provider' }, '400': { description: 'Bad request' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/contracts/{id}': {
      put: {
        summary: 'Actualizar contrato',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string' },
                  terminatedAt: { type: 'string', format: 'date-time' },
                  suspendedAt: { type: 'string', format: 'date-time' },
                  resultReportDocumentId: { type: 'string', description: 'ID documento informe de resultado' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Contract' }, '400': { description: 'Bad request' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/cpc/suggestions': {
      get: {
        summary: 'Sugerencias de códigos CPC',
        parameters: [{ name: 'q', in: 'query', schema: { type: 'string', description: 'Búsqueda' } }],
        responses: { '200': { description: 'Lista de códigos CPC' } },
      },
    },
    '/api/v1/catalogs': {
      get: {
        summary: 'Listar catálogos',
        parameters: [
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'data, total, page, pageSize' } },
      },
      post: {
        summary: 'Crear catálogo',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name'],
                properties: {
                  entityId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Catalog' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/catalogs/{id}': {
      get: {
        summary: 'Obtener catálogo por ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Catalog (con items)' }, '404': { description: 'Not found' } },
      },
      put: {
        summary: 'Actualizar catálogo',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  entityId: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Catalog' }, '400': { description: 'Bad request' }, '404': { description: 'Not found' } },
      },
    },
    '/api/v1/catalog-items': {
      post: {
        summary: 'Crear ítem de catálogo',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['catalogId', 'name'],
                properties: {
                  catalogId: { type: 'string' },
                  tenderId: { type: 'string' },
                  cpcCode: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  unit: { type: 'string' },
                  referencePrice: { type: 'number' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'CatalogItem' }, '400': { description: 'Bad request' } },
      },
    },
    '/api/v1/purchase-orders': {
      get: {
        summary: 'Listar órdenes de compra',
        parameters: [
          { name: 'entityId', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: { '200': { description: 'data, total, page, pageSize' } },
      },
      post: {
        summary: 'Crear orden de compra',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['entityId'],
                properties: {
                  entityId: { type: 'string' },
                  catalogId: { type: 'string' },
                  tenderId: { type: 'string' },
                  orderNo: { type: 'string' },
                  totalAmount: { type: 'number' },
                  status: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'PurchaseOrder' }, '400': { description: 'Bad request' } },
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
