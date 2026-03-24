/**
 * Client Portal Translations
 * Multi-language support for the client portal module
 */
export const clientPortalTranslations = {
  en: {
    // Menu items
    menu: {
      clientPortal: {
        section: 'Client Portal',
        dashboard: 'Dashboard',
        newRequest: 'New Request',
        myRequests: 'My Requests',
        myOperations: 'My Operations',
        myDocuments: 'My Documents',
        reports: 'Reports & Analytics',
        profile: 'Profile',
        companyUsers: 'Company Users',
      },
      clientRequests: {
        section: 'Client Requests',
        inbox: 'Request Inbox',
        myAssigned: 'My Assigned',
        pendingApproval: 'Pending Approval',
        slaDashboard: 'SLA Dashboard',
      },
      admin: {
        clientPortalConfig: 'Client Portal Config',
        clientUsers: 'Client Users',
        assignmentQueues: 'Assignment Queues',
        approvalRules: 'Approval Rules',
      },
    },

    // Product types
    product: {
      guaranteeRequest: {
        name: 'Bank Guarantee',
        description: 'Request a bank guarantee for your business needs',
      },
      lcImportRequest: {
        name: 'Letter of Credit (Import)',
        description: 'Request a letter of credit for import transactions',
      },
      lcExportRequest: {
        name: 'Letter of Credit (Export)',
        description: 'Request a letter of credit for export transactions',
      },
      collectionRequest: {
        name: 'Documentary Collection',
        description: 'Request a documentary collection service',
      },
    },

    // Request statuses
    solicitud: {
      status: {
        draft: 'Draft',
        'draft.description': 'Request is being prepared',
        submitted: 'Submitted',
        'submitted.description': 'Request submitted for review',
        inReview: 'In Review',
        'inReview.description': 'Request is being reviewed',
        pendingDocuments: 'Pending Documents',
        'pendingDocuments.description': 'Additional documents required',
        approved: 'Approved',
        'approved.description': 'Request has been approved',
        rejected: 'Rejected',
        'rejected.description': 'Request has been rejected',
        cancelled: 'Cancelled',
        'cancelled.description': 'Request was cancelled',
      },
    },

    // Priority levels
    priority: {
      low: 'Low',
      normal: 'Normal',
      high: 'High',
      urgent: 'Urgent',
    },

    // Wizard steps - Guarantee
    clientPortal: {
      guarantee: {
        step: {
          general: 'General Information',
          'general.desc': 'Enter basic guarantee details',
          beneficiary: 'Beneficiary',
          'beneficiary.desc': 'Enter beneficiary information',
          text: 'Guarantee Text',
          'text.desc': 'Enter or customize the guarantee wording',
          documents: 'Documents',
          'documents.desc': 'Upload required documents',
          review: 'Review & Submit',
          'review.desc': 'Review and submit your request',
        },
        section: {
          typeAmount: 'Type and Amount',
          beneficiary: 'Beneficiary Details',
          text: 'Guarantee Text',
          documents: 'Required Documents',
        },
      },
      lcImport: {
        step: {
          conditions: 'LC Conditions',
          'conditions.desc': 'Enter letter of credit conditions',
          beneficiary: 'Beneficiary (Supplier)',
          'beneficiary.desc': 'Enter supplier details',
          shipment: 'Shipment Details',
          'shipment.desc': 'Enter shipping information',
          goods: 'Goods Description',
          'goods.desc': 'Describe the merchandise',
          documents: 'Documents Required',
          'documents.desc': 'Specify required documents',
          review: 'Review & Submit',
          'review.desc': 'Review and submit your request',
        },
        section: {
          conditions: 'LC Conditions',
          beneficiary: 'Beneficiary Information',
          shipment: 'Shipment Information',
          goods: 'Goods Information',
          documents: 'Required Documents',
        },
      },
      collection: {
        step: {
          type: 'Collection Type',
          'type.desc': 'Select collection type and terms',
          drawee: 'Drawee (Importer)',
          'drawee.desc': 'Enter importer details',
          instructions: 'Instructions',
          'instructions.desc': 'Specify collection instructions',
          documents: 'Documents',
          'documents.desc': 'Upload collection documents',
          review: 'Review & Submit',
          'review.desc': 'Review and submit your request',
        },
        section: {
          type: 'Collection Details',
          drawee: 'Drawee Information',
          instructions: 'Collection Instructions',
          documents: 'Collection Documents',
        },
      },
    },

    // Form fields
    field: {
      guaranteeType: 'Guarantee Type',
      amount: 'Amount',
      currency: 'Currency',
      issueDate: 'Issue Date',
      expiryDate: 'Expiry Date',
      purpose: 'Purpose',
      beneficiaryName: 'Beneficiary Name',
      beneficiaryIdType: 'ID Type',
      beneficiaryIdNumber: 'ID Number',
      beneficiaryCountry: 'Country',
      beneficiaryAddress: 'Address',
      beneficiaryEmail: 'Email',
      beneficiaryPhone: 'Phone',
      guaranteeText: 'Guarantee Text',
      specialConditions: 'Special Conditions',
      documentType: 'Document Type',
      documentFile: 'Document File',
      documentDescription: 'Description',
      lcType: 'LC Type',
      lcAmount: 'LC Amount',
      lcCurrency: 'Currency',
      paymentType: 'Payment Type',
      paymentTermDays: 'Payment Term (Days)',
      lcExpiryDate: 'Expiry Date',
      latestShipmentDate: 'Latest Shipment Date',
      tolerancePercentage: 'Tolerance (%)',
      advisingBank: 'Advising Bank',
      advisingBankSwift: 'Advising Bank SWIFT',
      portLoading: 'Port of Loading',
      portDischarge: 'Port of Discharge',
      incoterm: 'Incoterm',
      partialShipments: 'Partial Shipments',
      transshipment: 'Transshipment',
      goodsDescription: 'Goods Description',
      hsCode: 'HS Code',
      collectionType: 'Collection Type',
      instructionType: 'Instruction Type',
      collectionAmount: 'Amount',
      collectionCurrency: 'Currency',
      draweeName: 'Drawee Name',
      draweeCountry: 'Country',
      draweeAddress: 'Address',
      collectingBank: 'Collecting Bank',
      collectingBankSwift: 'Collecting Bank SWIFT',
      protestNonPayment: 'Protest Non-Payment',
      protestNonAcceptance: 'Protest Non-Acceptance',
      chargesAccount: 'Charges Account',
      specialInstructions: 'Special Instructions',
    },

    // Options
    option: {
      irrevocable: 'Irrevocable',
      revocable: 'Revocable',
      sight: 'At Sight',
      deferred: 'Deferred Payment',
      acceptance: 'Acceptance',
      negotiation: 'Negotiation',
      allowed: 'Allowed',
      notAllowed: 'Not Allowed',
      documentary: 'Documentary',
      clean: 'Clean',
      documentsAgainstPayment: 'Documents Against Payment (D/P)',
      documentsAgainstAcceptance: 'Documents Against Acceptance (D/A)',
      drawee: 'Drawee',
      principal: 'Principal',
    },

    // Dashboard widgets
    widget: {
      client: {
        activeOperations: {
          name: 'Active Operations',
          desc: 'Number of active operations',
        },
        pendingRequests: {
          name: 'Pending Requests',
          desc: 'Requests awaiting processing',
        },
        totalAmount: {
          name: 'Total Amount',
          desc: 'Total value of active operations',
        },
        documentsPending: {
          name: 'Documents Pending',
          desc: 'Documents awaiting upload',
        },
        operationsByType: {
          name: 'Operations by Type',
          desc: 'Distribution of operations',
        },
        monthlyVolume: {
          name: 'Monthly Volume',
          desc: 'Request volume by month',
        },
        recentRequests: {
          name: 'Recent Requests',
          desc: 'Your latest requests',
        },
        recentOperations: {
          name: 'Recent Operations',
          desc: 'Your latest operations',
        },
        activityFeed: {
          name: 'Activity Feed',
          desc: 'Recent activity on your account',
        },
        upcomingExpirations: {
          name: 'Upcoming Expirations',
          desc: 'Operations expiring soon',
        },
      },
      backoffice: {
        pendingTotal: {
          name: 'Total Pending',
          desc: 'All pending requests',
        },
        myAssigned: {
          name: 'My Assigned',
          desc: 'Requests assigned to you',
        },
        slaAtRisk: {
          name: 'SLA At Risk',
          desc: 'Requests nearing SLA deadline',
        },
        slaBreached: {
          name: 'SLA Breached',
          desc: 'Requests that exceeded SLA',
        },
        requestsByStatus: {
          name: 'Requests by Status',
          desc: 'Distribution by status',
        },
        processingTrend: {
          name: 'Processing Time Trend',
          desc: 'Average processing time',
        },
        urgentRequests: {
          name: 'Urgent Requests',
          desc: 'Requests requiring immediate attention',
        },
      },
    },

    // Reports
    report: {
      client: {
        accountStatement: {
          name: 'Account Statement',
          desc: 'View account transactions and balances',
        },
        activeOperations: {
          name: 'Active Operations',
          desc: 'List of all active operations',
        },
        requestHistory: {
          name: 'Request History',
          desc: 'History of all your requests',
        },
        commissions: {
          name: 'Commissions Report',
          desc: 'Detailed breakdown of commissions',
        },
      },
    },

    // Filters
    filter: {
      dateFrom: 'From Date',
      dateTo: 'To Date',
      productType: 'Product Type',
      currency: 'Currency',
      status: 'Status',
      expiryFrom: 'Expiry From',
      expiryTo: 'Expiry To',
      commissionType: 'Commission Type',
    },

    // Table columns
    column: {
      date: 'Date',
      reference: 'Reference',
      requestNumber: 'Request #',
      productType: 'Product',
      description: 'Description',
      debit: 'Debit',
      credit: 'Credit',
      balance: 'Balance',
      beneficiary: 'Beneficiary',
      amount: 'Amount',
      currency: 'Currency',
      issueDate: 'Issue Date',
      expiryDate: 'Expiry Date',
      status: 'Status',
      createdAt: 'Created',
      submittedAt: 'Submitted',
      processingDays: 'Days',
      operationReference: 'Operation Ref',
      baseAmount: 'Base Amount',
      rate: 'Rate',
      commissionAmount: 'Commission',
      commissionType: 'Type',
    },

    // Roles
    role: {
      clientPortalUser: {
        name: 'Client Portal User',
        desc: 'Standard client portal access',
      },
      clientAdmin: {
        name: 'Client Admin',
        desc: 'Admin access for client company',
      },
      clientRequestProcessor: {
        name: 'Request Processor',
        desc: 'Processes client requests',
      },
      clientRequestSupervisor: {
        name: 'Request Supervisor',
        desc: 'Supervises request processing',
      },
      clientRequestApprover: {
        name: 'Request Approver',
        desc: 'Approves or rejects requests',
      },
      clientRequestManager: {
        name: 'Request Manager',
        desc: 'Full management access',
      },
    },

    // User types
    userType: {
      internal: {
        name: 'Internal User',
        description: 'Bank employee with backoffice access',
      },
      client: {
        name: 'Client User',
        description: 'External client with portal access',
      },
    },

    // Activity types
    activity: {
      solicitud: {
        created: 'Request created',
        submitted: 'Request submitted for review',
        assigned: 'Request assigned to {{userName}}',
        docsRequested: 'Additional documents requested',
        docsUploaded: 'Documents uploaded',
        approved: 'Request approved',
        rejected: 'Request rejected',
        cancelled: 'Request cancelled',
        commented: 'Comment added',
      },
    },

    // Actions
    action: {
      createRequest: 'Create Request',
      saveDraft: 'Save Draft',
      submit: 'Submit',
      cancel: 'Cancel',
      approve: 'Approve',
      reject: 'Reject',
      requestDocs: 'Request Documents',
      assignTo: 'Assign To',
      viewDetails: 'View Details',
      download: 'Download',
      upload: 'Upload',
      addComment: 'Add Comment',
    },

    // Messages
    message: {
      requestCreated: 'Request created successfully',
      requestSubmitted: 'Request submitted successfully',
      requestCancelled: 'Request cancelled',
      requestApproved: 'Request approved successfully',
      requestRejected: 'Request rejected',
      draftSaved: 'Draft saved',
      documentUploaded: 'Document uploaded successfully',
      commentAdded: 'Comment added',
      assignmentSuccess: 'Request assigned successfully',
    },

    // Errors
    error: {
      requestNotFound: 'Request not found',
      accessDenied: 'Access denied',
      invalidStatus: 'Invalid status for this action',
      uploadFailed: 'Failed to upload document',
      submitFailed: 'Failed to submit request',
    },
  },

  es: {
    // Menu items
    menu: {
      clientPortal: {
        section: 'Portal del Cliente',
        dashboard: 'Panel de Control',
        newRequest: 'Nueva Solicitud',
        myRequests: 'Mis Solicitudes',
        myOperations: 'Mis Operaciones',
        myDocuments: 'Mis Documentos',
        reports: 'Reportes y Analitica',
        profile: 'Perfil',
        companyUsers: 'Usuarios de la Empresa',
      },
      clientRequests: {
        section: 'Solicitudes de Clientes',
        inbox: 'Bandeja de Solicitudes',
        myAssigned: 'Mis Asignadas',
        pendingApproval: 'Pendientes de Aprobacion',
        slaDashboard: 'Panel de SLA',
      },
      admin: {
        clientPortalConfig: 'Configuracion Portal',
        clientUsers: 'Usuarios Clientes',
        assignmentQueues: 'Colas de Asignacion',
        approvalRules: 'Reglas de Aprobacion',
      },
    },

    // Product types
    product: {
      guaranteeRequest: {
        name: 'Garantia Bancaria',
        description: 'Solicite una garantia bancaria para sus necesidades comerciales',
      },
      lcImportRequest: {
        name: 'Carta de Credito (Importacion)',
        description: 'Solicite una carta de credito para transacciones de importacion',
      },
      lcExportRequest: {
        name: 'Carta de Credito (Exportacion)',
        description: 'Solicite una carta de credito para transacciones de exportacion',
      },
      collectionRequest: {
        name: 'Cobranza Documentaria',
        description: 'Solicite un servicio de cobranza documentaria',
      },
    },

    // Request statuses
    solicitud: {
      status: {
        draft: 'Borrador',
        'draft.description': 'Solicitud en preparacion',
        submitted: 'Enviada',
        'submitted.description': 'Solicitud enviada para revision',
        inReview: 'En Revision',
        'inReview.description': 'Solicitud siendo revisada',
        pendingDocuments: 'Documentos Pendientes',
        'pendingDocuments.description': 'Se requieren documentos adicionales',
        approved: 'Aprobada',
        'approved.description': 'Solicitud aprobada',
        rejected: 'Rechazada',
        'rejected.description': 'Solicitud rechazada',
        cancelled: 'Cancelada',
        'cancelled.description': 'Solicitud cancelada',
      },
    },

    // Priority levels
    priority: {
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    },

    // Form fields
    field: {
      guaranteeType: 'Tipo de Garantia',
      amount: 'Monto',
      currency: 'Moneda',
      issueDate: 'Fecha de Emision',
      expiryDate: 'Fecha de Vencimiento',
      purpose: 'Proposito',
      beneficiaryName: 'Nombre del Beneficiario',
      beneficiaryIdType: 'Tipo de Identificacion',
      beneficiaryIdNumber: 'Numero de Identificacion',
      beneficiaryCountry: 'Pais',
      beneficiaryAddress: 'Direccion',
      beneficiaryEmail: 'Correo Electronico',
      beneficiaryPhone: 'Telefono',
      guaranteeText: 'Texto de la Garantia',
      specialConditions: 'Condiciones Especiales',
      documentType: 'Tipo de Documento',
      documentFile: 'Archivo',
      documentDescription: 'Descripcion',
    },

    // Options
    option: {
      irrevocable: 'Irrevocable',
      revocable: 'Revocable',
      sight: 'A la Vista',
      deferred: 'Pago Diferido',
      acceptance: 'Aceptacion',
      negotiation: 'Negociacion',
      allowed: 'Permitido',
      notAllowed: 'No Permitido',
      documentary: 'Documentaria',
      clean: 'Limpia',
      documentsAgainstPayment: 'Documentos Contra Pago (D/P)',
      documentsAgainstAcceptance: 'Documentos Contra Aceptacion (D/A)',
      drawee: 'Girado',
      principal: 'Cedente',
    },

    // Actions
    action: {
      createRequest: 'Crear Solicitud',
      saveDraft: 'Guardar Borrador',
      submit: 'Enviar',
      cancel: 'Cancelar',
      approve: 'Aprobar',
      reject: 'Rechazar',
      requestDocs: 'Solicitar Documentos',
      assignTo: 'Asignar A',
      viewDetails: 'Ver Detalles',
      download: 'Descargar',
      upload: 'Cargar',
      addComment: 'Agregar Comentario',
    },

    // Messages
    message: {
      requestCreated: 'Solicitud creada exitosamente',
      requestSubmitted: 'Solicitud enviada exitosamente',
      requestCancelled: 'Solicitud cancelada',
      requestApproved: 'Solicitud aprobada exitosamente',
      requestRejected: 'Solicitud rechazada',
      draftSaved: 'Borrador guardado',
      documentUploaded: 'Documento cargado exitosamente',
      commentAdded: 'Comentario agregado',
      assignmentSuccess: 'Solicitud asignada exitosamente',
    },

    // Errors
    error: {
      requestNotFound: 'Solicitud no encontrada',
      accessDenied: 'Acceso denegado',
      invalidStatus: 'Estado invalido para esta accion',
      uploadFailed: 'Error al cargar documento',
      submitFailed: 'Error al enviar solicitud',
    },
  },
};

export default clientPortalTranslations;
