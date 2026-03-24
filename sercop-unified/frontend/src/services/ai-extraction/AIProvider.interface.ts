/**
 * Interface para proveedores de IA de extracción de documentos
 * Implementa el patrón Strategy para permitir cambiar de proveedor fácilmente
 */

import type {
  AIProviderType,
  AIProviderConfig,
  ExtractionRequest,
  ExtractionResult,
  ExtractedField,
  ExtractionProgressCallback,
} from '../../types/extraction';
import type { SwiftFieldConfig } from '../../types/swiftField';

/**
 * Interface que todos los proveedores de IA deben implementar
 */
export interface IAIProvider {
  /** Tipo del proveedor */
  readonly type: AIProviderType;

  /** Nombre para mostrar */
  readonly displayName: string;

  /** Configuración del proveedor */
  readonly config: AIProviderConfig;

  /**
   * Verifica si el proveedor está disponible y configurado correctamente
   */
  isAvailable(): Promise<boolean>;

  /**
   * Extrae campos de un documento
   * @param request - Request con el documento y opciones
   * @param fieldConfigs - Configuraciones de campos SWIFT desde la base de datos
   * @param onProgress - Callback opcional para reportar progreso
   */
  extractFields(
    request: ExtractionRequest,
    fieldConfigs: SwiftFieldConfig[],
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult>;

  /**
   * Valida un campo extraído contra las reglas de validación
   * @param field - Campo extraído
   * @param fieldConfig - Configuración del campo desde la base de datos
   */
  validateField(
    field: ExtractedField,
    fieldConfig: SwiftFieldConfig
  ): { isValid: boolean; errors: string[] };

  /**
   * Obtiene el costo estimado de una extracción
   * @param request - Request de extracción
   */
  estimateCost(request: ExtractionRequest): number;

  /**
   * Cancela una extracción en progreso (si es soportado)
   */
  cancel?(): void;
}

/**
 * Clase base abstracta con funcionalidad común para proveedores
 */
export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly type: AIProviderType;
  abstract readonly displayName: string;
  abstract readonly config: AIProviderConfig;

  abstract isAvailable(): Promise<boolean>;
  abstract extractFields(
    request: ExtractionRequest,
    fieldConfigs: SwiftFieldConfig[],
    onProgress?: ExtractionProgressCallback
  ): Promise<ExtractionResult>;

  /**
   * Genera el prompt base para extracción de campos SWIFT
   * Los proveedores pueden sobrescribir esto si necesitan un formato diferente
   */
  protected generateExtractionPrompt(
    fieldConfigs: SwiftFieldConfig[],
    messageType: string,
    language: 'es' | 'en' = 'es'
  ): string {
    // Filtrar campos activos para este tipo de mensaje
    const activeFields = fieldConfigs.filter(f => f.isActive && f.messageType === messageType);

    /**
     * Extrae el título/keywords del helpText según el idioma
     * El helpText puede ser:
     * - Un objeto {es: "...", en: "..."} con traducciones
     * - Un string directo
     */
    const extractFieldTitle = (config: SwiftFieldConfig, lang: 'es' | 'en' = 'es'): string => {
      if (config.helpText) {
        let helpTextContent: string;

        // Manejar helpText como objeto con traducciones
        if (typeof config.helpText === 'object' && config.helpText !== null) {
          const helpTextObj = config.helpText as Record<string, string>;
          // Intentar obtener el idioma solicitado, fallback al otro idioma
          helpTextContent = helpTextObj[lang] || helpTextObj['es'] || helpTextObj['en'] || '';
        } else if (typeof config.helpText === 'string') {
          helpTextContent = config.helpText;
        } else {
          helpTextContent = '';
        }

        if (helpTextContent) {
          // Extraer primera línea significativa (no vacía)
          const firstLine = helpTextContent.split('\n').find(line => line.trim().length > 5);
          if (firstLine) {
            // Limpiar comillas y caracteres extra
            return firstLine.replace(/^["']|["']$/g, '').trim();
          }
        }
      }
      // Fallback a fieldName o fieldNameKey
      return config.fieldName || config.fieldNameKey || config.fieldCode;
    };

    // Generar descripción detallada de campos usando la configuración de la base de datos
    const fieldsDescription = activeFields
      .map(f => {
        const required = f.isRequired ? (language === 'es' ? '(OBLIGATORIO)' : '(REQUIRED)') : (language === 'es' ? '(opcional)' : '(optional)');
        const section = f.section ? ` [${f.section}]` : '';
        const title = extractFieldTitle(f, language);
        const swiftFmt = f.swiftFormat ? ` | Format: ${f.swiftFormat}` : '';
        return `- ${f.fieldCode}: ${title} ${required}${section}${swiftFmt}`;
      })
      .join('\n');

    // Identificar campos TEXTAREA (multilínea) que necesitan extracción especial
    const textareaFields = activeFields.filter(f =>
      f.componentType === 'TEXTAREA' ||
      f.fieldType === 'TEXTAREA' ||
      (f.validationRules && f.validationRules.maxLines && f.validationRules.maxLines > 1)
    );

    // Generar mapeo de campos TEXTAREA con sus títulos extraídos del helpText
    const textareaFieldMappingLines: string[] = textareaFields
      .map(f => {
        const title = extractFieldTitle(f, language);
        const section = f.section || 'N/A';
        return `  * ${f.fieldCode} [${section}]: "${title}"`;
      });

    // Generar mapeo de otros campos con helpText
    const otherFieldMappingLines: string[] = activeFields
      .filter(f => f.helpText && !textareaFields.includes(f))
      .slice(0, 20) // Limitar para no hacer el prompt muy largo
      .map(f => {
        const title = extractFieldTitle(f, language);
        return `  - ${f.fieldCode}: "${title}"`;
      });

    // Generar mapeo inteligente de secciones de documento a campos SWIFT
    // basado en el helpText y fieldName de la configuración
    const generateSectionKeywords = (config: SwiftFieldConfig, lang: 'es' | 'en'): string[] => {
      const keywords: string[] = [];
      const title = extractFieldTitle(config, lang);

      // Extraer palabras clave del título
      if (title) {
        keywords.push(title);
        // Extraer también palabras individuales significativas (más de 4 caracteres)
        const words = title.split(/[\s\/\(\)]+/).filter(w => w.length > 4);
        keywords.push(...words);
      }

      // Agregar fieldName si es diferente
      if (config.fieldName && config.fieldName !== title) {
        keywords.push(config.fieldName);
      }

      return [...new Set(keywords)]; // Eliminar duplicados
    };

    const textareaFieldsWithKeywords = textareaFields.map(f => {
      const keywords = generateSectionKeywords(f, language);
      const keywordsStr = keywords.slice(0, 3).map(k => `"${k}"`).join(', ');
      return {
        fieldCode: f.fieldCode,
        section: f.section || 'N/A',
        title: extractFieldTitle(f, language),
        keywords: keywordsStr
      };
    });

    // Generar mapeo con ejemplos dinámicos basados en la configuración
    const textareaFieldsMapping = textareaFieldsWithKeywords
      .map(f => `  * ${f.fieldCode} [${f.section}]: Buscar secciones con: ${f.keywords}`)
      .join('\n');

    // Generar ejemplos dinámicos para las instrucciones (máximo 3)
    const dynamicExamples = textareaFieldsWithKeywords.slice(0, 3).map((f, idx) => {
      const num = idx + 2; // Empezar en 2 porque el 1 es la instrucción general
      if (language === 'es') {
        return `${num}. Si el documento tiene una sección que coincida con ${f.keywords}, extrae TODO su contenido para el campo ${f.fieldCode}`;
      } else {
        return `${num}. If the document has a section matching ${f.keywords}, extract ALL its content for field ${f.fieldCode}`;
      }
    }).join('\n');

    const sectionMappingHints = language === 'es'
      ? `
=== CAMPOS DE TEXTO LARGO (CRÍTICOS - EXTRAER CONTENIDO COMPLETO) ===
Los siguientes campos requieren extracción de SECCIONES COMPLETAS del documento.
Las palabras clave indican qué buscar en el documento:

${textareaFieldsMapping}

INSTRUCCIONES CRÍTICAS PARA CAMPOS DE TEXTO LARGO:
1. Identifica las secciones del documento que coincidan con las palabras clave indicadas arriba
${dynamicExamples}
${textareaFieldsWithKeywords.length + 2}. Extrae el texto COMPLETO de cada sección, incluyendo listas numeradas y viñetas
${textareaFieldsWithKeywords.length + 3}. NO resumas ni parafrasees - copia el contenido íntegro

=== OTROS CAMPOS ===
${otherFieldMappingLines.join('\n')}
`
      : `
=== LONG TEXT FIELDS (CRITICAL - EXTRACT COMPLETE CONTENT) ===
The following fields require extraction of COMPLETE SECTIONS from the document.
The keywords indicate what to look for in the document:

${textareaFieldsMapping}

CRITICAL INSTRUCTIONS FOR LONG TEXT FIELDS:
1. Identify document sections that match the keywords indicated above
${dynamicExamples}
${textareaFieldsWithKeywords.length + 2}. Extract the COMPLETE text from each section, including numbered lists and bullets
${textareaFieldsWithKeywords.length + 3}. Do NOT summarize or paraphrase - copy the content entirely

=== OTHER FIELDS ===
${otherFieldMappingLines.join('\n')}
`;

    const instructions = language === 'es' ? {
      intro: `Analiza el siguiente documento y extrae los campos SWIFT para un mensaje ${messageType}. El documento puede estar en español o inglés.`,
      fields: 'Campos a extraer (desde swift_field_config_readmodel):',
      format: 'Formato de respuesta:',
      rules: [
        'Devuelve SOLO un JSON válido sin texto adicional',
        'Para cada campo, incluye el valor extraído y un puntaje de confianza (0.0 a 1.0)',
        'Si un campo no está presente en el documento, omítelo del resultado',
        'Si hay ambigüedad, incluye alternativas posibles',
        'Respeta el formato SWIFT indicado en cada campo (swiftFormat)',
        'Para campos de tipo TEXTAREA, extrae TODO el contenido de la sección correspondiente',
        'Usa el mapeo de secciones proporcionado para identificar qué contenido va en cada campo',
      ],
    } : {
      intro: `Analyze the following document and extract SWIFT fields for a ${messageType} message. The document may be in English or Spanish.`,
      fields: 'Fields to extract (from swift_field_config_readmodel):',
      format: 'Response format:',
      rules: [
        'Return ONLY valid JSON without additional text',
        'For each field, include the extracted value and a confidence score (0.0 to 1.0)',
        'If a field is not present in the document, omit it from the result',
        'If there is ambiguity, include possible alternatives',
        'Respect the SWIFT format indicated in each field (swiftFormat)',
        'For TEXTAREA type fields, extract ALL content from the corresponding section',
        'Use the section mapping provided to identify which content goes in each field',
      ],
    };

    return `${instructions.intro}
${sectionMappingHints}
${instructions.fields}
${fieldsDescription}

${instructions.format}
{
  "messageType": "${messageType}",
  "fields": [
    {
      "fieldCode": ":20:",
      "value": "extracted value",
      "confidence": 0.95,
      "alternatives": [{"value": "alt value", "confidence": 0.7}]
    }
  ],
  "warnings": ["any warnings about extraction"],
  "rawText": "extracted raw text if applicable"
}

${instructions.rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`;
  }

  /**
   * Parsea la respuesta JSON del modelo de IA
   */
  protected parseAIResponse(response: string): {
    messageType: string;
    fields: Array<{
      fieldCode: string;
      value: string;
      confidence: number;
      alternatives?: Array<{ value: string; confidence: number }>;
    }>;
    warnings?: string[];
    rawText?: string;
  } {
    // Intentar extraer JSON de la respuesta (puede venir envuelto en markdown)
    let jsonStr = response;

    // Buscar bloques de código JSON
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    // Buscar objeto JSON directo
    const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      jsonStr = objectMatch[0];
    }

    try {
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  /**
   * Valida un campo extraído contra su configuración
   */
  validateField(
    field: ExtractedField,
    fieldConfig: SwiftFieldConfig
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const value = typeof field.value === 'string' ? field.value : JSON.stringify(field.value);

    // Validar si es requerido
    if (fieldConfig.isRequired && (!value || value.trim() === '')) {
      errors.push(`Field ${fieldConfig.fieldCode} is required`);
    }

    // Validar reglas de validación
    if (fieldConfig.validationRules && value) {
      const rules = fieldConfig.validationRules;

      // Validar patrón
      if (rules.pattern) {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(value)) {
          errors.push(rules.patternMessage || `Value does not match required pattern`);
        }
      }

      // Validar longitud mínima
      if (rules.minLength && value.length < rules.minLength) {
        errors.push(`Value must be at least ${rules.minLength} characters`);
      }

      // Validar longitud máxima
      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push(`Value must not exceed ${rules.maxLength} characters`);
      }

      // Validar líneas para campos multilínea
      if (rules.maxLines) {
        const lines = value.split('\n');
        if (lines.length > rules.maxLines) {
          errors.push(`Value must not exceed ${rules.maxLines} lines`);
        }
        if (rules.maxLineLength) {
          lines.forEach((line, i) => {
            if (line.length > rules.maxLineLength!) {
              errors.push(`Line ${i + 1} exceeds ${rules.maxLineLength} characters`);
            }
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Estima el costo basado en el tamaño del documento
   */
  estimateCost(request: ExtractionRequest): number {
    // Estimación base - los proveedores específicos deben sobrescribir esto
    const baseTokens = request.file.content.length / 4; // ~4 caracteres por token
    const outputTokens = 2000; // Estimado de respuesta

    // Costo base genérico (USD)
    return ((baseTokens * 0.003) + (outputTokens * 0.015)) / 1000;
  }
}

/**
 * Factory para crear instancias de proveedores
 */
export type AIProviderFactory = (config?: Partial<AIProviderConfig>) => IAIProvider;

/**
 * Función utilitaria standalone para generar el prompt de extracción
 * Puede ser usada directamente sin necesidad de instanciar un proveedor
 */
export function generateSwiftExtractionPrompt(
  fieldConfigs: SwiftFieldConfig[],
  messageType: string,
  language: 'es' | 'en' = 'es'
): string {
  // Filtrar campos activos para este tipo de mensaje
  const activeFields = fieldConfigs.filter(f => f.isActive && f.messageType === messageType);

  /**
   * Verifica si un string parece ser una clave i18n (contiene puntos como "swift.mt700.45A.fieldName")
   */
  const isI18nKey = (str: string): boolean => {
    return str.includes('.') && str.split('.').length >= 3;
  };

  /**
   * Extrae el título/keywords del helpText según el idioma
   */
  const extractFieldTitle = (config: SwiftFieldConfig, lang: 'es' | 'en' = 'es'): string => {
    // Primero intentar extraer del helpText
    if (config.helpText) {
      let helpTextContent: string;

      if (typeof config.helpText === 'object' && config.helpText !== null) {
        const helpTextObj = config.helpText as Record<string, string>;
        helpTextContent = helpTextObj[lang] || helpTextObj['es'] || helpTextObj['en'] || '';
      } else if (typeof config.helpText === 'string') {
        helpTextContent = config.helpText;
      } else {
        helpTextContent = '';
      }

      if (helpTextContent && !isI18nKey(helpTextContent)) {
        const firstLine = helpTextContent.split('\n').find(line => line.trim().length > 5);
        if (firstLine) {
          return firstLine.replace(/^["']|["']$/g, '').trim();
        }
      }
    }

    // Usar swiftUsageNotes si está disponible
    if (config.swiftUsageNotes && !isI18nKey(config.swiftUsageNotes)) {
      const firstLine = config.swiftUsageNotes.split('\n').find(line => line.trim().length > 5);
      if (firstLine) {
        return firstLine.replace(/^["']|["']$/g, '').trim().slice(0, 60);
      }
    }

    // Usar fieldName solo si no es una clave i18n
    if (config.fieldName && !isI18nKey(config.fieldName)) {
      return config.fieldName;
    }

    // Usar la sección como contexto
    if (config.section && !isI18nKey(config.section)) {
      const code = config.fieldCode.replace(/^:|:$/g, '');
      return `${config.section} - ${code}`;
    }

    // Fallback al código del campo sin los dos puntos
    return config.fieldCode.replace(/^:|:$/g, '');
  };

  // Identificar campos TEXTAREA - solo por componentType explícito
  // Los campos TEXTAREA típicos terminan en letra mayúscula: :45A:, :46A:, :47A:
  const textareaFields = activeFields.filter(f => {
    // Solo considerar TEXTAREA explícitos
    if (f.componentType !== 'TEXTAREA') return false;

    // Excluir campos que son selectores de instituciones (terminan en letra minúscula: :51a:, :52a:)
    // El patrón es: dos puntos, números, letra minúscula, dos puntos
    const fieldCode = f.fieldCode;
    if (/^:\d+[a-z]:$/.test(fieldCode)) return false;

    return true;
  });

  // Generar mapeo de secciones del documento a campos SWIFT para TEXTAREA
  // Usar la sección del campo para dar contexto sobre qué tipo de contenido va en cada campo
  const textareaSectionMapping = textareaFields.map(fc => {
    const title = extractFieldTitle(fc, language);
    const section = fc.section || '';

    // Generar palabras clave basadas en el título y sección
    const keywords: string[] = [];

    // Si el título no es solo el código del campo, usarlo
    if (title && title !== fc.fieldCode.replace(/^:|:$/g, '')) {
      keywords.push(title);
      // Extraer palabras significativas del título
      const words = title.split(/[\s\/\(\),]+/).filter(w => w.length > 4);
      keywords.push(...words);
    }

    // Agregar la sección como contexto
    if (section && !isI18nKey(section)) {
      keywords.push(section);
    }

    // Eliminar duplicados y limitar
    const uniqueKeywords = [...new Set(keywords)].slice(0, 4);

    // Si no hay palabras clave útiles, indicar la sección
    if (uniqueKeywords.length === 0) {
      return `  * ${fc.fieldCode} [${section || 'GENERAL'}]: texto multilínea`;
    }

    return `  * ${fc.fieldCode} [${section || 'GENERAL'}]: ${uniqueKeywords.map(k => `"${k}"`).join(', ')}`;
  }).join('\n');

  // Determinar formato según componentType
  const getFieldFormat = (fc: SwiftFieldConfig): { valueFormat: string; example: string } => {
    const componentType = fc.componentType;

    switch (componentType) {
      case 'CURRENCY_AMOUNT_INPUT':
        return {
          valueFormat: '{ "currency": "XXX", "amount": "999999.99" }',
          example: '{ "currency": "USD", "amount": "125750.00" }'
        };
      case 'DATE_PLACE_INPUT':
      case 'DATE_PLACE':
        return {
          valueFormat: '{ "date": "YYYY-MM-DD", "place": "texto" }',
          example: '{ "date": "2026-04-15", "place": "Shanghai, China" }'
        };
      case 'TOLERANCE_PERCENTAGE':
        return {
          valueFormat: '"NN/NN" (tolerancia +/-)',
          example: '"05/05"'
        };
      case 'SWIFT_PARTY':
        return {
          valueFormat: '{ "text": "nombre\\ndireccion\\nciudad" }',
          example: '{ "text": "COMPANY NAME\\nADDRESS LINE 1\\nCITY, COUNTRY" }'
        };
      case 'DATE_PICKER':
        return {
          valueFormat: '"YYYY-MM-DD"',
          example: '"2026-01-15"'
        };
      case 'DROPDOWN':
      case 'SELECT':
        const options = fc.fieldOptions;
        if (options && Array.isArray(options) && options.length > 0) {
          const optValues = options.map((o: any) => o.value || o).slice(0, 5).join(', ');
          return {
            valueFormat: optValues,
            example: `"${options[0]?.value || options[0]}"`
          };
        }
        return { valueFormat: 'string', example: '"valor"' };
      case 'TEXTAREA':
        return {
          valueFormat: 'texto multilínea (separar con \\n)',
          example: '"LINEA 1\\nLINEA 2\\nLINEA 3"'
        };
      case 'INSTITUTION_SELECTOR':
      case 'FINANCIAL_INSTITUTION_SELECTOR':
      case 'BANK_SELECTOR':
        return {
          valueFormat: 'BIC/SWIFT (8 u 11 caracteres)',
          example: '"BKCHCNBJ300"'
        };
      case 'SWIFT_MULTI_OPTION':
        return {
          valueFormat: '{ "detectedOption": "A", "inputMethod": "bic", "bic": "XXX" }',
          example: '{ "detectedOption": "A", "inputMethod": "bic", "bic": "BKCHCNBJ300" }'
        };
      case 'CURRENCY_AMOUNT':
        return {
          valueFormat: '"999999.99"',
          example: '"125750.00"'
        };
      default:
        return { valueFormat: 'string', example: '"texto"' };
    }
  };

  // Generar esquema de campos
  const fieldSchema = activeFields.map(fc => {
    const { valueFormat, example } = getFieldFormat(fc);
    const title = extractFieldTitle(fc, language);
    return `- ${fc.fieldCode} (${title}): ${valueFormat} | Ej: ${example}`;
  }).join('\n');

  // Instrucciones TEXTAREA
  const textareaInstructions = textareaFields.length > 0 ? (language === 'es' ? `

=== CAMPOS TEXTAREA (EXTRAER SECCIONES COMPLETAS) ===
Busca secciones del documento que coincidan con estas palabras clave:
${textareaSectionMapping}

INSTRUCCIONES TEXTAREA:
1. Identifica secciones del documento que coincidan con las palabras clave
2. Extrae el contenido COMPLETO de cada sección (todas las líneas)
3. NO resumas - copia el texto íntegro incluyendo listas numeradas
4. Separa líneas con \\n
` : `

=== TEXTAREA FIELDS (EXTRACT COMPLETE SECTIONS) ===
Look for document sections matching these keywords:
${textareaSectionMapping}

TEXTAREA INSTRUCTIONS:
1. Identify document sections matching the keywords
2. Extract the COMPLETE content of each section (all lines)
3. Do NOT summarize - copy the entire text including numbered lists
4. Separate lines with \\n
`) : '';

  // Construir prompt
  const intro = language === 'es'
    ? `Eres un experto en mensajes SWIFT y cartas de crédito.
Analiza el documento y extrae campos para un mensaje ${messageType}.`
    : `You are a SWIFT messaging and letters of credit expert.
Analyze the document and extract fields for a ${messageType} message.`;

  const rules = language === 'es'
    ? `REGLAS:
1. El "value" DEBE tener el formato especificado (objeto o string)
2. Fechas en formato ISO: YYYY-MM-DD
3. Montos como string con punto decimal: "125750.00"
4. Monedas en ISO 4217: USD, EUR, etc.
5. Códigos BIC/SWIFT exactamente como aparecen`
    : `RULES:
1. The "value" MUST have the specified format (object or string)
2. Dates in ISO format: YYYY-MM-DD
3. Amounts as string with decimal point: "125750.00"
4. Currencies in ISO 4217: USD, EUR, etc.
5. BIC/SWIFT codes exactly as they appear`;

  // Instrucciones para análisis adicional
  const additionalAnalysisInstructions = language === 'es' ? `

=== ANÁLISIS ADICIONAL (OBLIGATORIO) ===
Además de los campos SWIFT, proporciona el siguiente análisis completo:

1. RESUMEN EJECUTIVO (executiveSummary):
   - summary: Resumen del documento en 2-3 oraciones claras y concisas
   - documentType: Tipo de documento detectado (MT700, MT760, Invoice, BL, etc.)
   - detectedLanguage: Idioma principal del documento (es, en, fr, etc.)
   - overallConfidence: Confianza general de la extracción (0-100)
   - keyPoints: Array de 3-5 puntos clave del documento

2. ANÁLISIS DE DISCREPANCIAS (discrepancyAnalysis):
   - hasDiscrepancies: true/false si hay inconsistencias
   - discrepancies: Array de discrepancias encontradas, cada una con:
     * type: DATE/AMOUNT/PARTY/DOCUMENT/TERM
     * severity: LOW/MEDIUM/HIGH
     * field1: Primer campo involucrado
     * field2: Segundo campo involucrado
     * description: Descripción de la inconsistencia
     * suggestion: Sugerencia de corrección (opcional)
   - totalCount: Número total de discrepancias
   - highSeverityCount: Número de discrepancias de alta severidad

3. ALERTAS DE COMPLIANCE (complianceAnalysis):
   - requiresReview: true/false si requiere revisión de compliance
   - alerts: Array de alertas, cada una con:
     * type: COUNTRY/ENTITY/PRODUCT/AMOUNT
     * severity: INFO/WARNING/CRITICAL
     * entity: Entidad o país relacionado
     * reason: Razón de la alerta
     * action: Acción recomendada
   - countriesOfConcern: Array de países que podrían requerir revisión de sanciones
   - suggestedScreenings: Array de verificaciones sugeridas (OFAC, UN, PEPs, etc.)

4. CALIDAD DE DATOS (dataQualityAnalysis):
   - completenessScore: Porcentaje de campos completados (0-100)
   - totalFields: Número total de campos esperados
   - populatedFields: Número de campos con valor
   - missingRequired: Array de campos requeridos faltantes
   - invalidFormats: Array de campos con formato inválido, cada uno con:
     * field: Código del campo
     * issue: Problema detectado
     * suggestion: Sugerencia de corrección
   - warnings: Array de advertencias generales

5. DOCUMENTOS REQUERIDOS (documentsAnalysis):
   - Lista de documentos mencionados (facturas, conocimientos de embarque, certificados, etc.)
   - Para cada documento: tipo, cantidad de originales/copias requeridas, observaciones

6. ANÁLISIS DE RIESGO (riskAnalysis):
   - Nivel de riesgo general (LOW/MEDIUM/HIGH) con JUSTIFICACIÓN clara (riskReason)
   - Países mencionados y su nivel de riesgo (alto/medio/bajo)
   - Términos o condiciones inusuales detectadas
   - Alertas o banderas rojas identificadas

7. PARTES INVOLUCRADAS (partiesAnalysis):
   - Ordenante/Applicant: nombre, país, tipo de entidad, estado de validación (VALID/NEEDS_REVIEW/INCOMPLETE)
   - Beneficiario: nombre, país, tipo de entidad, estado de validación
   - Bancos: nombre, BIC, rol, estado del BIC (VALID/INVALID/NOT_FOUND)

8. CLASIFICACIÓN DE MERCANCÍAS (goodsAnalysis):
   - Descripción resumida de la mercancía
   - Código HS sugerido (si es posible inferirlo)
   - Categoría general (maquinaria, textiles, alimentos, etc.)
   - Alertas si es mercancía restringida o especial

9. ANÁLISIS DE FECHAS Y PLAZOS (datesAnalysis):
   - Fecha de emisión
   - Fecha de vencimiento
   - Período de presentación de documentos
   - Última fecha de embarque
   - Días hasta vencimiento
   - Alertas si los plazos son muy cortos o inconsistentes

10. ACCIONES RECOMENDADAS (recommendedActionsAnalysis):
   - summary: Resumen breve de las acciones pendientes
   - totalActions: Número total de acciones
   - highPriorityCount: Número de acciones urgentes
   - nextDeadline: Fecha del próximo vencimiento (formato YYYY-MM-DD)
   - nextDeadlineDays: Días hasta el próximo vencimiento
   - actions: Array de acciones recomendadas, cada una con:
     * id: Identificador único (ej: "action_1")
     * description: Descripción clara de la acción a realizar
     * dueDate: Fecha límite sugerida (YYYY-MM-DD)
     * dueDays: Días hasta la fecha límite
     * priority: HIGH/MEDIUM/LOW
     * responsible: Área o rol responsable (ej: "Área de Cumplimiento", "Operaciones", "Comercio Exterior")
     * type: VERIFICATION/DOCUMENT/COMMUNICATION/REVIEW/APPROVAL/SHIPMENT/PAYMENT/OTHER
     * status: PENDING (siempre iniciar como pendiente)
     * relatedField: Campo SWIFT relacionado (opcional)
     * notes: Notas adicionales (opcional)

   IMPORTANTE para acciones recomendadas:
   - Analiza las fechas del documento y calcula los plazos
   - Prioridad HIGH: Acciones que deben completarse en los próximos 3 días
   - Prioridad MEDIUM: Acciones para los próximos 7 días
   - Prioridad LOW: Acciones sin urgencia inmediata
   - Incluye verificaciones de compliance, preparación de documentos, comunicaciones con bancos, etc.
   - Las acciones deben ser específicas y accionables

   MENSAJES SWIFT EN ACCIONES:
   Para acciones de tipo SWIFT_MESSAGE, incluye el campo swiftMessage con:
   - messageType: Tipo de mensaje SWIFT (MT700, MT707, MT710, MT720, MT730, MT732, MT734, MT740, MT742, MT747, MT752, MT754, MT756, MT760, MT767, MT768, MT769, MT799, etc.)
   - direction: SEND si el banco debe enviar, RECEIVE si debe recibir, BOTH si aplica ambos
   - purpose: Propósito específico del mensaje
   - parties: Array de partes involucradas (Issuing Bank, Advising Bank, Confirming Bank, Reimbursing Bank, Beneficiary, Applicant)

   Ejemplos de flujos SWIFT típicos:
   - LC Import: MT700 (emisión) → MT730 (aviso de recepción) → MT734 (aviso de discrepancias) → MT732 (respuesta) → MT756 (aviso de pago)
   - LC Export: MT710 (aviso de LC) → MT720 (transferencia) → MT740 (autorización reembolso)
   - Garantías: MT760 (emisión) → MT767 (enmienda) → MT769 (aviso de reclamo)
   - Comunicaciones: MT799 (mensaje libre)
` : `

=== ADDITIONAL ANALYSIS (REQUIRED) ===
In addition to SWIFT fields, provide the following comprehensive analysis:

1. EXECUTIVE SUMMARY (executiveSummary):
   - summary: Document summary in 2-3 clear and concise sentences
   - documentType: Detected document type (MT700, MT760, Invoice, BL, etc.)
   - detectedLanguage: Main document language (es, en, fr, etc.)
   - overallConfidence: Overall extraction confidence (0-100)
   - keyPoints: Array of 3-5 key document points

2. DISCREPANCY ANALYSIS (discrepancyAnalysis):
   - hasDiscrepancies: true/false if inconsistencies found
   - discrepancies: Array of found discrepancies, each with:
     * type: DATE/AMOUNT/PARTY/DOCUMENT/TERM
     * severity: LOW/MEDIUM/HIGH
     * field1: First field involved
     * field2: Second field involved
     * description: Description of the inconsistency
     * suggestion: Correction suggestion (optional)
   - totalCount: Total number of discrepancies
   - highSeverityCount: Number of high severity discrepancies

3. COMPLIANCE ALERTS (complianceAnalysis):
   - requiresReview: true/false if compliance review required
   - alerts: Array of alerts, each with:
     * type: COUNTRY/ENTITY/PRODUCT/AMOUNT
     * severity: INFO/WARNING/CRITICAL
     * entity: Related entity or country
     * reason: Alert reason
     * action: Recommended action
   - countriesOfConcern: Array of countries that may require sanctions review
   - suggestedScreenings: Array of suggested screenings (OFAC, UN, PEPs, etc.)

4. DATA QUALITY (dataQualityAnalysis):
   - completenessScore: Percentage of completed fields (0-100)
   - totalFields: Total expected fields
   - populatedFields: Number of fields with values
   - missingRequired: Array of missing required fields
   - invalidFormats: Array of fields with invalid format, each with:
     * field: Field code
     * issue: Detected problem
     * suggestion: Correction suggestion
   - warnings: Array of general warnings

5. REQUIRED DOCUMENTS (documentsAnalysis):
   - List of documents mentioned (invoices, bills of lading, certificates, etc.)
   - For each document: type, number of originals/copies required, observations

6. RISK ANALYSIS (riskAnalysis):
   - Overall risk level (LOW/MEDIUM/HIGH) with clear JUSTIFICATION (riskReason)
   - Countries mentioned and their risk level (high/medium/low)
   - Unusual terms or conditions detected
   - Alerts or red flags identified

7. PARTIES INVOLVED (partiesAnalysis):
   - Applicant: name, country, entity type, validation status (VALID/NEEDS_REVIEW/INCOMPLETE)
   - Beneficiary: name, country, entity type, validation status
   - Banks: name, BIC, role, BIC status (VALID/INVALID/NOT_FOUND)

8. GOODS CLASSIFICATION (goodsAnalysis):
   - Summary description of goods
   - Suggested HS code (if inferable)
   - General category (machinery, textiles, food, etc.)
   - Alerts if restricted or special merchandise

9. DATES AND DEADLINES ANALYSIS (datesAnalysis):
   - Issue date
   - Expiry date
   - Document presentation period
   - Latest shipment date
   - Days until expiry
   - Alerts if deadlines are too short or inconsistent

10. RECOMMENDED ACTIONS (recommendedActionsAnalysis):
   - summary: Brief summary of pending actions
   - totalActions: Total number of actions
   - highPriorityCount: Number of urgent actions
   - nextDeadline: Next deadline date (format YYYY-MM-DD)
   - nextDeadlineDays: Days until next deadline
   - actions: Array of recommended actions, each with:
     * id: Unique identifier (e.g., "action_1")
     * description: Clear description of the action to perform
     * dueDate: Suggested deadline (YYYY-MM-DD)
     * dueDays: Days until deadline
     * priority: HIGH/MEDIUM/LOW
     * responsible: Responsible area or role (e.g., "Compliance", "Operations", "Trade Finance")
     * type: VERIFICATION/DOCUMENT/COMMUNICATION/REVIEW/APPROVAL/SHIPMENT/PAYMENT/OTHER
     * status: PENDING (always start as pending)
     * relatedField: Related SWIFT field (optional)
     * notes: Additional notes (optional)

   IMPORTANT for recommended actions:
   - Analyze document dates and calculate deadlines
   - HIGH priority: Actions that must be completed within the next 3 days
   - MEDIUM priority: Actions for the next 7 days
   - LOW priority: Actions without immediate urgency
   - Include compliance verifications, document preparation, bank communications, etc.
   - Actions should be specific and actionable

   SWIFT MESSAGES IN ACTIONS:
   For SWIFT_MESSAGE type actions, include the swiftMessage field with:
   - messageType: SWIFT message type (MT700, MT707, MT710, MT720, MT730, MT732, MT734, MT740, MT742, MT747, MT752, MT754, MT756, MT760, MT767, MT768, MT769, MT799, etc.)
   - direction: SEND if bank must send, RECEIVE if must receive, BOTH if both apply
   - purpose: Specific purpose of the message
   - parties: Array of parties involved (Issuing Bank, Advising Bank, Confirming Bank, Reimbursing Bank, Beneficiary, Applicant)

   Examples of typical SWIFT flows:
   - LC Import: MT700 (issuance) → MT730 (acknowledgement) → MT734 (discrepancy advice) → MT732 (response) → MT756 (payment advice)
   - LC Export: MT710 (LC advice) → MT720 (transfer) → MT740 (reimbursement authorization)
   - Guarantees: MT760 (issuance) → MT767 (amendment) → MT769 (claim advice)
   - Communications: MT799 (free format message)
`;

  const responseFormat = `
{
  "fields": [
    {
      "fieldCode": "${activeFields[0]?.fieldCode || ':20:'}",
      "value": "...",
      "confidence": 0.95,
      "evidence": "texto del documento"
    }
  ],
  "additionalAnalysis": {
    "executiveSummary": {
      "summary": "Resumen conciso del documento en 2-3 oraciones",
      "documentType": "MT700|MT760|Invoice|BL|etc",
      "detectedLanguage": "es|en|fr",
      "overallConfidence": 85,
      "keyPoints": ["Punto clave 1", "Punto clave 2", "Punto clave 3"]
    },
    "discrepancyAnalysis": {
      "hasDiscrepancies": false,
      "discrepancies": [
        { "type": "DATE|AMOUNT|PARTY|DOCUMENT|TERM", "severity": "LOW|MEDIUM|HIGH", "field1": ":31D:", "field2": ":44C:", "description": "Descripción de la inconsistencia", "suggestion": "Sugerencia de corrección" }
      ],
      "totalCount": 0,
      "highSeverityCount": 0
    },
    "complianceAnalysis": {
      "requiresReview": false,
      "alerts": [
        { "type": "COUNTRY|ENTITY|PRODUCT|AMOUNT", "severity": "INFO|WARNING|CRITICAL", "entity": "País o entidad", "reason": "Razón de la alerta", "action": "Acción recomendada" }
      ],
      "countriesOfConcern": [],
      "suggestedScreenings": ["OFAC", "UN_CONSOLIDATED", "INTERNAL_LIST"]
    },
    "dataQualityAnalysis": {
      "completenessScore": 87,
      "totalFields": 25,
      "populatedFields": 22,
      "missingRequired": [":20:", ":31D:"],
      "invalidFormats": [
        { "field": ":32B:", "issue": "Formato de monto inválido", "suggestion": "Usar formato: CUR999999.99" }
      ],
      "warnings": ["Advertencia general sobre los datos"]
    },
    "documentsAnalysis": {
      "documents": [
        { "type": "COMMERCIAL_INVOICE", "description": "Factura comercial", "originals": 3, "copies": 0, "notes": "" }
      ],
      "totalDocuments": 5,
      "missingCommon": ["Certificate of Origin"]
    },
    "riskAnalysis": {
      "overallRisk": "LOW|MEDIUM|HIGH",
      "riskReason": "Justificación clara del nivel de riesgo basada en países, montos, términos y partes involucradas",
      "countries": [{ "code": "CN", "name": "China", "risk": "LOW", "role": "BENEFICIARY_COUNTRY" }],
      "alerts": [],
      "unusualTerms": []
    },
    "partiesAnalysis": {
      "applicant": { "name": "", "country": "", "type": "COMPANY", "status": "VALID|NEEDS_REVIEW|INCOMPLETE", "statusReason": "" },
      "beneficiary": { "name": "", "country": "", "type": "COMPANY", "status": "VALID|NEEDS_REVIEW|INCOMPLETE", "statusReason": "" },
      "banks": [{ "name": "", "bic": "", "role": "ISSUING|ADVISING|CONFIRMING", "bicStatus": "VALID|INVALID|NOT_FOUND", "bicStatusReason": "" }]
    },
    "goodsAnalysis": {
      "description": "",
      "suggestedHSCode": "",
      "category": "",
      "isRestricted": false,
      "alerts": []
    },
    "datesAnalysis": {
      "issueDate": "",
      "expiryDate": "",
      "presentationPeriod": "",
      "latestShipmentDate": "",
      "daysUntilExpiry": 0,
      "alerts": []
    },
    "recommendedActionsAnalysis": {
      "summary": "5 acciones pendientes, 2 urgentes relacionadas con emisión de LC",
      "totalActions": 5,
      "highPriorityCount": 2,
      "nextDeadline": "2026-02-10",
      "nextDeadlineDays": 5,
      "actions": [
        {
          "id": "action_1",
          "description": "Enviar MT700 al banco avisador para notificar emisión de LC",
          "dueDate": "2026-02-06",
          "dueDays": 1,
          "priority": "HIGH",
          "responsible": "Área de Operaciones SWIFT",
          "type": "SWIFT_MESSAGE",
          "status": "PENDING",
          "relatedField": ":20:",
          "notes": "Incluir todos los campos obligatorios según UCP 600",
          "swiftMessage": {
            "messageType": "MT700",
            "direction": "SEND",
            "purpose": "Emisión de carta de crédito documentaria al banco avisador",
            "parties": ["Issuing Bank", "Advising Bank"]
          }
        },
        {
          "id": "action_2",
          "description": "Verificar documentos de embarque con el beneficiario",
          "dueDate": "2026-02-10",
          "dueDays": 5,
          "priority": "HIGH",
          "responsible": "Área de Operaciones",
          "type": "VERIFICATION",
          "status": "PENDING",
          "relatedField": ":46A:",
          "notes": "Confirmar que los documentos cumplen con los requisitos de la LC"
        },
        {
          "id": "action_3",
          "description": "Esperar recepción de MT730 confirmando aviso de LC",
          "dueDate": "2026-02-12",
          "dueDays": 7,
          "priority": "MEDIUM",
          "responsible": "Área de Operaciones SWIFT",
          "type": "SWIFT_MESSAGE",
          "status": "PENDING",
          "swiftMessage": {
            "messageType": "MT730",
            "direction": "RECEIVE",
            "purpose": "Confirmación del banco avisador de recepción y aviso de LC",
            "parties": ["Advising Bank", "Issuing Bank"]
          }
        }
      ]
    }
  }
}`;

  return `${intro}

${rules}
${textareaInstructions}
${additionalAnalysisInstructions}
FORMATO JSON:${responseFormat}

CAMPOS ${messageType}:
${fieldSchema}`;
}
