import type {
  SwiftFieldConfig,
  ValidationError,
  ValidationSeverity,
  ContextualAlert,
  ValidationRules,
  ValidationResult
} from '../types/swiftField';

/**
 * Servicio centralizado de validación de campos SWIFT
 *
 * Ejecuta validaciones dinámicas basadas en reglas configuradas en la base de datos
 * según los estándares SWIFT ISO 15022
 */
export class SwiftValidationService {
  private fieldConfigs: Map<string, SwiftFieldConfig> = new Map();
  private customValidators: Map<string, ValidationFunction> = new Map();

  constructor(configs: SwiftFieldConfig[]) {
    // Indexar configuraciones por fieldCode para búsqueda rápida
    configs.forEach(config => {
      this.fieldConfigs.set(config.fieldCode, config);
    });

    // Registrar validadores personalizados
    this.registerCustomValidators();
  }

  /**
   * Registra validadores personalizados predefinidos
   */
  private registerCustomValidators(): void {
    this.customValidators.set('toleranceValidator', this.validateTolerance.bind(this));
    this.customValidators.set('maxAmountValidator', this.validateMaxAmount.bind(this));
    this.customValidators.set('additionalAmountValidator', this.validateAdditionalAmount.bind(this));
    this.customValidators.set('bicValidator', this.validateBIC.bind(this));
    this.customValidators.set('currencyAmountValidator', this.validateCurrencyAmount.bind(this));
    this.customValidators.set('swiftDateValidator', this.validateSwiftDate.bind(this));
    this.customValidators.set('multilineValidator', this.validateMultiline.bind(this));
  }

  /**
   * Registra un validador personalizado externo
   */
  registerValidator(name: string, validator: ValidationFunction): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Valida un campo específico según las reglas de validation_rules
   */
  validateField(
    fieldCode: string,
    value: any,
    allFormData: Record<string, any>
  ): ValidationError | null {
    const config = this.fieldConfigs.get(fieldCode);
    if (!config) return null;

    const rules = config.validationRules;

    // Handle DatePlaceValue objects ({ date, place }) from DATE_PLACE_INPUT components
    const isDatePlaceObject = typeof value === 'object' && value !== null && 'date' in value;

    // Validación de campo requerido (de config o de rules)
    const isRequired = config.isRequired || rules?.required;
    if (isRequired) {
      if (isDatePlaceObject) {
        if (!value.date || value.date.trim() === '') {
          return {
            field: fieldCode,
            fieldName: config.fieldName,
            section: config.section,
            message: rules?.errorMessage || `Campo obligatorio`,
            severity: 'error' as ValidationSeverity
          };
        }
      } else if (this.isEmpty(value)) {
        return {
          field: fieldCode,
          fieldName: config.fieldName,
          section: config.section,
          message: rules?.errorMessage || `Campo obligatorio`,
          severity: 'error' as ValidationSeverity
        };
      }
    }

    // Si está vacío y no es requerido, no validar más
    if (isDatePlaceObject) {
      if (!value.date || value.date.trim() === '') return null;
    } else if (this.isEmpty(value)) {
      return null;
    }

    // Si no hay reglas de validación, el campo es válido
    if (!rules) return null;

    // For DatePlaceValue objects, build the combined SWIFT string for validation
    const strValue = isDatePlaceObject
      ? `${this.isoToYYMMDD(value.date)}${value.place || ''}`.trim()
      : String(value).trim();

    // Validación de patrón regex
    if (rules.pattern) {
      try {
        const regex = new RegExp(rules.pattern);
        if (!regex.test(strValue)) {
          return {
            field: fieldCode,
            fieldName: config.fieldName,
            section: config.section,
            message: rules.patternMessage || rules.errorMessage || `Formato inválido`,
            severity: 'error' as ValidationSeverity
          };
        }
      } catch (e) {
        console.warn(`Regex inválido para campo ${fieldCode}:`, rules.pattern);
      }
    }

    // Validación de código BIC (para campos de bancos)
    // bicRequired=true: Solo acepta código BIC
    // bicRequired=false o undefined: Acepta BIC o texto libre (Opción A o D de SWIFT)
    if (rules.bicPattern && rules.bicRequired) {
      try {
        const bicRegex = new RegExp(rules.bicPattern);
        if (!bicRegex.test(strValue)) {
          return {
            field: fieldCode,
            fieldName: config.fieldName,
            section: config.section,
            message: rules.bicMessage || 'Código BIC inválido. Formato: 4 letras + 2 letras + 2 alfanuméricos [+ 3 alfanuméricos opcionales]',
            severity: 'error' as ValidationSeverity
          };
        }
      } catch (e) {
        console.warn(`BIC regex inválido para campo ${fieldCode}:`, rules.bicPattern);
      }
    }

    // Validación de longitud máxima
    if (rules.maxLength && strValue.length > rules.maxLength) {
      return {
        field: fieldCode,
        fieldName: config.fieldName,
        section: config.section,
        message: `No puede exceder ${rules.maxLength} caracteres (actual: ${strValue.length})`,
        severity: 'error' as ValidationSeverity
      };
    }

    // Validación de longitud mínima
    if (rules.minLength && strValue.length < rules.minLength) {
      return {
        field: fieldCode,
        fieldName: config.fieldName,
        section: config.section,
        message: `Debe tener al menos ${rules.minLength} caracteres`,
        severity: 'error' as ValidationSeverity
      };
    }

    // Validación de campos multilínea (SWIFT format: n*mx)
    if (rules.maxLines || rules.maxLineLength) {
      const multilineError = this.validateMultilineFormat(strValue, rules, fieldCode);
      if (multilineError) return { ...multilineError, field: fieldCode, fieldName: config.fieldName, section: config.section };
    }

    // Validación de rango numérico
    if (this.isNumeric(value)) {
      const numValue = this.toNumber(value);

      if (rules.minValue !== undefined && numValue < rules.minValue) {
        return {
          field: fieldCode,
          fieldName: config.fieldName,
          section: config.section,
          message: `No puede ser menor a ${rules.minValue}`,
          severity: 'error' as ValidationSeverity
        };
      }

      if (rules.maxValue !== undefined && numValue > rules.maxValue) {
        return {
          field: fieldCode,
          fieldName: config.fieldName,
          section: config.section,
          message: `No puede ser mayor a ${rules.maxValue}`,
          severity: 'error' as ValidationSeverity
        };
      }

      // Validación de decimales
      if (rules.maxDecimals !== undefined) {
        const decimalPart = strValue.includes(',')
          ? strValue.split(',')[1]
          : strValue.includes('.')
            ? strValue.split('.')[1]
            : '';
        if (decimalPart && decimalPart.length > rules.maxDecimals) {
          return {
            field: fieldCode,
            fieldName: config.fieldName,
            section: config.section,
            message: `No puede tener más de ${rules.maxDecimals} decimales`,
            severity: 'error' as ValidationSeverity
          };
        }
      }
    }

    // Validación de valores permitidos (para SELECT/DROPDOWN)
    if (rules.allowedValues && rules.allowedValues.length > 0) {
      if (!rules.allowedValues.includes(strValue)) {
        return {
          field: fieldCode,
          fieldName: config.fieldName,
          section: config.section,
          message: `Valor no permitido. Valores válidos: ${rules.allowedValues.join(', ')}`,
          severity: 'error' as ValidationSeverity
        };
      }
    }

    // Validación de fecha SWIFT (formato YYMMDD)
    if (rules.dateFormat === 'YYMMDD') {
      const dateError = this.validateSwiftDateFormat(strValue, fieldCode);
      if (dateError) return { ...dateError, field: fieldCode, fieldName: config.fieldName, section: config.section };
    }

    // Validación de fecha mínima respecto a otro campo (ej: fecha vencimiento > fecha emisión)
    if (rules.minDateField) {
      const minDateError = this.validateMinDateField(
        value,
        allFormData[rules.minDateField],
        rules.minDateField,
        rules.minDateMessage,
        fieldCode,
        config.fieldName,
        config.section
      );
      if (minDateError) return minDateError;
    }

    // Validación de moneda ISO 4217
    if (rules.currencyRequired || rules.currencyPattern) {
      // Obtener el valor de moneda: puede estar en el objeto, en campo separado, o en los primeros 3 chars
      let currencyValue: string | undefined;
      if (typeof value === 'object' && value !== null && 'currency' in value) {
        currencyValue = value.currency;
      } else {
        currencyValue = allFormData[`${fieldCode}_currency`] || strValue.substring(0, 3);
      }

      if (rules.currencyPattern && currencyValue) {
        const currencyRegex = new RegExp(rules.currencyPattern);
        if (!currencyRegex.test(currencyValue)) {
          return {
            field: fieldCode,
            fieldName: config.fieldName,
            section: config.section,
            message: rules.currencyMessage || 'Código de moneda inválido. Debe ser ISO 4217 (3 letras mayúsculas)',
            severity: 'error' as ValidationSeverity
          };
        }
      }
    }

    // Validador personalizado
    if (rules.customValidator) {
      return this.runCustomValidator(rules.customValidator, fieldCode, value, allFormData);
    }

    return null;
  }

  /**
   * Valida formato multilínea SWIFT (ej: 4*35x = máx 4 líneas de 35 chars)
   */
  private validateMultilineFormat(
    value: string,
    rules: ValidationRules,
    fieldCode: string
  ): Omit<ValidationError, 'field'> | null {
    const lines = value.split('\n');

    // Validar número máximo de líneas
    if (rules.maxLines && lines.length > rules.maxLines) {
      return {
        message: `No puede exceder ${rules.maxLines} líneas (actual: ${lines.length})`,
        severity: 'error' as ValidationSeverity
      };
    }

    // Validar longitud de cada línea
    if (rules.maxLineLength) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].length > rules.maxLineLength) {
          return {
            message: `Línea ${i + 1} excede ${rules.maxLineLength} caracteres (actual: ${lines[i].length})`,
            severity: 'error' as ValidationSeverity
          };
        }
      }
    }

    return null;
  }

  /**
   * Valida formato de fecha SWIFT (YYMMDD)
   * Supports composite fields like :31D: where format is 6!n29x (date + place)
   */
  private validateSwiftDateFormat(
    value: string,
    fieldCode: string
  ): Omit<ValidationError, 'field'> | null {
    // Si es una fecha ISO (YYYY-MM-DD), with optional trailing text
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return null; // Fecha ISO válida, se convertirá al guardar
    }

    // Extract date portion: first 6 digits for composite fields (e.g., :31D: = 6!n29x)
    const dateMatch = value.match(/^(\d{6})/);
    if (dateMatch) {
      const datePart = dateMatch[1];
      const mm = parseInt(datePart.substring(2, 4));
      const dd = parseInt(datePart.substring(4, 6));

      if (mm < 1 || mm > 12) {
        return {
          message: `Mes inválido. Debe ser entre 01 y 12`,
          severity: 'error' as ValidationSeverity
        };
      }

      if (dd < 1 || dd > 31) {
        return {
          message: `Día inválido. Debe ser entre 01 y 31`,
          severity: 'error' as ValidationSeverity
        };
      }

      return null;
    }

    return {
      message: `Formato de fecha inválido. Use YYMMDD o YYYY-MM-DD`,
      severity: 'error' as ValidationSeverity
    };
  }

  /**
   * Valida que una fecha sea mayor o igual a otra fecha de referencia
   * Usado para validar que fecha de vencimiento > fecha de emisión
   */
  private validateMinDateField(
    value: any,
    minDateValue: any,
    minDateFieldCode: string,
    customMessage?: string,
    fieldCode?: string,
    fieldName?: string,
    section?: string
  ): ValidationError | null {
    // Si no hay valor de fecha mínima, no validar
    if (!minDateValue) return null;

    const currentDate = this.parseDate(value);
    const minDate = this.parseDate(minDateValue);

    if (!currentDate || !minDate) return null;

    // La fecha actual debe ser mayor que la fecha mínima
    if (currentDate <= minDate) {
      // Obtener nombre legible del campo de referencia
      const minFieldConfig = this.fieldConfigs.get(minDateFieldCode);
      const minFieldName = minFieldConfig?.fieldName || minDateFieldCode;

      return {
        field: fieldCode || '',
        fieldName: fieldName,
        section: section,
        message: customMessage || `La fecha debe ser posterior a ${minFieldName}`,
        severity: 'error' as ValidationSeverity
      };
    }

    return null;
  }

  /**
   * Parsea una fecha en varios formatos a objeto Date
   */
  private parseDate(value: any): Date | null {
    if (!value) return null;

    // Handle DatePlaceValue objects from DATE_PLACE_INPUT
    if (typeof value === 'object' && value !== null && 'date' in value) {
      return value.date ? this.parseDate(value.date) : null;
    }

    const strValue = String(value).trim();

    // Formato YYMMDD (6 dígitos, possibly followed by text for composite fields like :31D:)
    const yymmddMatch = strValue.match(/^(\d{6})/);
    if (yymmddMatch && strValue.length >= 6) {
      const datePart = yymmddMatch[1];
      const yy = parseInt(datePart.slice(0, 2));
      const mm = parseInt(datePart.slice(2, 4)) - 1;
      const dd = parseInt(datePart.slice(4, 6));
      const fullYear = yy > 50 ? 1900 + yy : 2000 + yy;
      return new Date(fullYear, mm, dd);
    }

    // Formato YYYYMMDD (8 dígitos)
    if (/^\d{8}$/.test(strValue)) {
      const yyyy = parseInt(strValue.slice(0, 4));
      const mm = parseInt(strValue.slice(4, 6)) - 1;
      const dd = parseInt(strValue.slice(6, 8));
      return new Date(yyyy, mm, dd);
    }

    // Formato ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(strValue)) {
      return new Date(strValue);
    }

    // Intentar parseo genérico
    const date = new Date(strValue);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Ejecuta un validador personalizado
   */
  private runCustomValidator(
    validatorName: string,
    fieldCode: string,
    value: any,
    allFormData: Record<string, any>
  ): ValidationError | null {
    const validator = this.customValidators.get(validatorName);
    if (validator) {
      return validator(fieldCode, value, allFormData, this.fieldConfigs.get(fieldCode)!);
    }

    console.warn(`Validador personalizado "${validatorName}" no encontrado`);
    return null;
  }

  /**
   * Validador personalizado: Tolerancia porcentual (formato nn/nn)
   */
  private validateTolerance(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    // Formato esperado: nn/nn (ej: 05/05 para +/-5%)
    const tolerancePattern = /^(\d{1,2})\/(\d{1,2})$/;
    const match = value.match(tolerancePattern);

    if (!match) {
      return {
        field: fieldCode,
        message: 'Formato inválido. Use NN/NN (ejemplo: 05/05 para +/-5%)',
        severity: 'error' as ValidationSeverity
      };
    }

    const plusTolerance = parseInt(match[1]);
    const minusTolerance = parseInt(match[2]);

    if (plusTolerance > 99 || minusTolerance > 99) {
      return {
        field: fieldCode,
        message: 'La tolerancia no puede exceder 99%',
        severity: 'error' as ValidationSeverity
      };
    }

    return null;
  }

  /**
   * Validador personalizado: Monto máximo
   */
  private validateMaxAmount(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    const montoMax = parseFloat(value);
    const montoBase = parseFloat(allFormData[':32B:'] || allFormData.monto || '0');

    if (isNaN(montoMax)) {
      return {
        field: fieldCode,
        message: 'Debe ser un número válido',
        severity: 'error' as ValidationSeverity
      };
    }

    if (montoBase > 0 && montoMax <= montoBase) {
      return {
        field: fieldCode,
        message: `El monto máximo debe ser mayor al monto base (${montoBase})`,
        severity: 'warning' as ValidationSeverity
      };
    }

    return null;
  }

  /**
   * Validador personalizado: Monto adicional
   */
  private validateAdditionalAmount(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      return {
        field: fieldCode,
        message: 'Debe ser un número válido mayor o igual a 0',
        severity: 'error' as ValidationSeverity
      };
    }

    return null;
  }

  /**
   * Validador personalizado: Código BIC/SWIFT
   */
  private validateBIC(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    // BIC format: 4!a2!a2!c[3!c]
    // 4 letras (banco) + 2 letras (país) + 2 alfanuméricos (ciudad) + 3 opcionales (sucursal)
    const bicPattern = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;

    if (!bicPattern.test(value.toUpperCase())) {
      return {
        field: fieldCode,
        message: 'Código BIC inválido. Formato: AAAABBCC o AAAABBCCDDD',
        severity: 'error' as ValidationSeverity
      };
    }

    return null;
  }

  /**
   * Validador personalizado: Moneda y Monto (formato 3!a15d)
   */
  private validateCurrencyAmount(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    // El valor puede venir como objeto {currency, amount} o como string "USDNNNN,NN"
    if (typeof value === 'object' && value !== null) {
      const currency = value.currency || allFormData[`${fieldCode}_currency`];
      const amount = value.amount;

      if (!/^[A-Z]{3}$/.test(currency)) {
        return {
          field: fieldCode,
          message: 'Código de moneda inválido (3 letras ISO 4217)',
          severity: 'error' as ValidationSeverity
        };
      }

      if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return {
          field: fieldCode,
          message: 'Monto debe ser un número positivo',
          severity: 'error' as ValidationSeverity
        };
      }
    }

    return null;
  }

  /**
   * Validador personalizado: Fecha SWIFT
   */
  private validateSwiftDate(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    const dateError = this.validateSwiftDateFormat(value, fieldCode);
    return dateError ? { ...dateError, field: fieldCode } : null;
  }

  /**
   * Validador personalizado: Campo multilínea
   */
  private validateMultiline(
    fieldCode: string,
    value: string,
    allFormData: Record<string, any>,
    config: SwiftFieldConfig
  ): ValidationError | null {
    if (!config.validationRules) return null;
    const error = this.validateMultilineFormat(value, config.validationRules, fieldCode);
    return error ? { ...error, field: fieldCode } : null;
  }

  /**
   * Valida todos los campos del formulario
   * @returns Objeto con isValid y array de errores
   */
  validateAllFields(formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    this.fieldConfigs.forEach((config, fieldCode) => {
      const value = formData[fieldCode];
      const error = this.validateField(fieldCode, value, formData);
      if (error) {
        errors.push(error);
      }
    });

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  /**
   * Valida solo los campos obligatorios
   */
  validateRequiredFields(formData: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    this.fieldConfigs.forEach((config, fieldCode) => {
      if (config.isRequired || config.validationRules?.required) {
        const value = formData[fieldCode];
        const error = this.validateField(fieldCode, value, formData);
        if (error) {
          errors.push(error);
        }
      }
    });

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors
    };
  }

  /**
   * Obtiene los campos que deben re-validarse cuando cambia un campo específico
   */
  getDependentFields(fieldCode: string): string[] {
    const config = this.fieldConfigs.get(fieldCode);
    if (!config || !config.dependencies) return [];
    return config.dependencies.revalidates || [];
  }

  /**
   * Obtiene alertas contextuales que deben mostrarse según el estado del formulario
   */
  getContextualAlerts(allFormData: Record<string, any>): ContextualAlert[] {
    const alerts: ContextualAlert[] = [];

    this.fieldConfigs.forEach(config => {
      if (!config.contextualAlerts) return;

      config.contextualAlerts.forEach(alert => {
        if (this.shouldShowAlert(alert, allFormData)) {
          alerts.push(alert);
        }
      });
    });

    return alerts;
  }

  /**
   * Verifica si una alerta debe mostrarse según las condiciones
   */
  private shouldShowAlert(
    alert: ContextualAlert,
    allFormData: Record<string, any>
  ): boolean {
    const fieldValue = allFormData[alert.showWhen.field];

    switch (alert.showWhen.condition) {
      case 'NOT_EMPTY':
        return !this.isEmpty(fieldValue);
      case 'EMPTY':
        return this.isEmpty(fieldValue);
      case 'EQUALS':
        return fieldValue === alert.showWhen.value;
      case 'GREATER_THAN':
        return this.isNumeric(fieldValue) &&
               this.toNumber(fieldValue) > parseFloat(alert.showWhen.value);
      case 'LESS_THAN':
        return this.isNumeric(fieldValue) &&
               this.toNumber(fieldValue) < parseFloat(alert.showWhen.value);
      case 'CONTAINS':
        return fieldValue && fieldValue.toString().includes(alert.showWhen.value);
      default:
        return false;
    }
  }

  /**
   * Converts ISO date (YYYY-MM-DD) to SWIFT YYMMDD format.
   */
  private isoToYYMMDD(isoDate: string): string {
    if (!isoDate) return '';
    // Already YYMMDD
    if (/^\d{6}$/.test(isoDate)) return isoDate;
    // ISO format YYYY-MM-DD
    const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return match[1].slice(-2) + match[2] + match[3];
    }
    return isoDate;
  }

  /**
   * Verifica si un valor está vacío
   */
  private isEmpty(value: any): boolean {
    return value === null ||
           value === undefined ||
           value === '' ||
           (typeof value === 'string' && value.trim() === '');
  }

  /**
   * Verifica si un valor es numérico
   */
  private isNumeric(value: any): boolean {
    if (typeof value === 'number') return !isNaN(value);
    if (typeof value === 'string') {
      // Soportar coma como separador decimal (estándar SWIFT)
      const normalizedValue = value.replace(',', '.');
      return !isNaN(parseFloat(normalizedValue)) && isFinite(parseFloat(normalizedValue));
    }
    return false;
  }

  /**
   * Convierte un valor a número
   */
  private toNumber(value: any): number {
    if (typeof value === 'number') return value;
    // Soportar coma como separador decimal (estándar SWIFT)
    const normalizedValue = String(value).replace(',', '.');
    return parseFloat(normalizedValue);
  }

  /**
   * Obtiene la configuración de un campo
   */
  getFieldConfig(fieldCode: string): SwiftFieldConfig | undefined {
    return this.fieldConfigs.get(fieldCode);
  }

  /**
   * Verifica si un campo debe estar habilitado según dependencias
   */
  isFieldEnabled(fieldCode: string, allFormData: Record<string, any>): boolean {
    const config = this.fieldConfigs.get(fieldCode);
    if (!config || !config.dependencies || !config.dependencies.disabledIf) return true;

    const condition = config.dependencies.disabledIf;
    return allFormData[condition.field] !== condition.value;
  }

  /**
   * Verifica si un campo debe ser visible según dependencias
   */
  isFieldVisible(fieldCode: string, allFormData: Record<string, any>): boolean {
    const config = this.fieldConfigs.get(fieldCode);
    if (!config || !config.dependencies || !config.dependencies.visibleIf) return true;

    const condition = config.dependencies.visibleIf;
    return allFormData[condition.field] === condition.value;
  }

  /**
   * Verifica si un campo debe ser obligatorio según dependencias
   */
  isFieldRequired(fieldCode: string, allFormData: Record<string, any>): boolean {
    const config = this.fieldConfigs.get(fieldCode);
    if (!config) return false;

    // Si el campo es obligatorio por defecto, retornar true
    if (config.isRequired) return true;

    // Verificar condición requiredIf
    if (config.dependencies && config.dependencies.requiredIf) {
      const condition = config.dependencies.requiredIf;
      return allFormData[condition.field] === condition.value;
    }

    return false;
  }

  /**
   * Obtiene un resumen de errores para mostrar al usuario
   */
  getErrorSummary(errors: ValidationError[]): string {
    const errorCount = errors.filter(e => e.severity === 'error').length;
    const warningCount = errors.filter(e => e.severity === 'warning').length;

    let summary = '';
    if (errorCount > 0) {
      summary += `${errorCount} error${errorCount > 1 ? 'es' : ''}`;
    }
    if (warningCount > 0) {
      if (summary) summary += ', ';
      summary += `${warningCount} advertencia${warningCount > 1 ? 's' : ''}`;
    }

    return summary || 'Sin errores';
  }
}

/**
 * Tipo para función de validación personalizada
 */
type ValidationFunction = (
  fieldCode: string,
  value: any,
  allFormData: Record<string, any>,
  config: SwiftFieldConfig
) => ValidationError | null;

export default SwiftValidationService;
