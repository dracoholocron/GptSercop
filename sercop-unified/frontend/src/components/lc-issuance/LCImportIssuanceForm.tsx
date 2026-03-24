import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { VStack, Box, Spinner, Center, Text, HStack, Button, Badge, Heading } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccountingEntry } from '../../hooks/useAccountingEntry';
import { useLCIssuanceForm } from '../../hooks/useLCIssuanceForm';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import { comisionService, type MensajeSWIFT } from '../../services/commissionService';
import { swiftDraftService, SwiftValidationError } from '../../services/swiftDraftService';
import { getStandardFieldValues } from '../../utils/swiftMessageParser';
import { toaster } from '../ui/toaster';
import type { GenerateEntryRequest } from '../../types/accounting';
import type { IssuanceMode, LCImportIssuanceFormProps, PaymentScheduleItem } from './types';
import { DEFAULT_SECTION_STEP_MAP } from './types';

// Importar secciones dinámicas
import { DynamicSwiftSection } from '../DynamicSwiftSection';
import { useSwiftSections } from '../../hooks/useSwiftSections';
import { EmbeddedCustomSection, CustomFieldsPanel } from '../customfields';
import { useCustomFields } from '../../hooks/useCustomFields';

// Importar secciones legacy (para modo wizard/client)
import {
  BasicInfoSection,
  AmountsSection,
  BanksSection,
  ShippingSection,
  GoodsDocumentsSection,
  ConditionsSection,
  AccountingSection,
  SwiftPreviewSection,
} from './sections';

// Importar layouts
import { WizardLayout, ExpertLayout } from './layouts';

// Importar vista de acordeones para modo experto
import { AccordionExpertView } from './AccordionExpertView';

// Importar asistente de digitación rápida
import { QuickFieldAssistant } from '../shared/QuickFieldAssistant';

// Toolbar de aprobación compartido
import { ApprovalToolbar } from '../shared/ApprovalToolbar';

// Alert Preview
import { AlertPreviewStep } from '../shared/AlertPreviewStep';

/**
 * Componente principal para emisión de LC de Importación
 * Soporta 3 modos: wizard, expert, client
 * Soporta modo de aprobación: approvalMode=true muestra botones aprobar/rechazar
 */
export const LCImportIssuanceForm: React.FC<LCImportIssuanceFormProps> = ({
  mode = 'wizard',
  draftId,
  approvalMode = false,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Ref for passing alert selection data to the hook's save/submit functions
  const customDataRef = useRef<Record<string, any> | undefined>(undefined);

  // Hook centralizado de estado del formulario
  const {
    formData,
    selectedEntities,
    swiftFieldsData,
    swiftConfigs,
    handleSwiftFieldChange,
    fieldErrors,
    currentStep,
    setCurrentStep,
    totalSteps,
    goToNextStep,
    goToPreviousStep,
    saveDraft,
    submitForm,
    isSubmitting,
    isLoadingDraft,
    isLoadingConfigs,
    modeConfig,
    // Contabilidad
    accountingResult,
    setAccountingResult,
    loadingAccounting,
    // Comisión
    commissionResult,
    setCommissionResult,
    calculatedCommission,
    setCalculatedCommission,
    diasVigencia,
    setDiasVigencia,
    // Diferimiento
    isCommissionDeferred,
    setIsCommissionDeferred,
    paymentSchedule,
    setPaymentSchedule,
    // Custom data from loaded draft
    loadedCustomData,
  } = useLCIssuanceForm({ mode, draftId, customDataRef });

  const { t } = useTranslation();
  const { getColors, isDark } = useTheme();
  const { config: systemConfig } = useSystemConfig();
  const colors = getColors();

  // Cargar secciones dinámicas desde la base de datos (para modo experto)
  const { sections: dynamicSections, loading: loadingSections } = useSwiftSections('MT700');

  // Cargar campos personalizados (custom fields)
  const {
    customData,
    setCustomData,
    configuration: customFieldsConfig,
    isLoading: loadingCustomFields,
    separateSteps: customFieldSteps,
    userData: customFieldsUserData,
  } = useCustomFields({
    productType: 'LC_IMPORT',
    mode: approvalMode ? 'VIEW' : 'WIZARD',
  });

  // Hook para asientos contables
  const {
    entry: accountingEntry,
    loading: loadingAccountingEntry,
    error: accountingEntryError,
    previewEntry,
  } = useAccountingEntry();

  // Estado para el diálogo de diferimiento
  const [deferredPaymentsDialogOpen, setDeferredPaymentsDialogOpen] = useState(false);

  // Estado para mostrar/ocultar campos opcionales (default: false en modo cliente, true en otros)
  const [showOptionalFields, setShowOptionalFields] = useState(mode !== 'client');

  // Hook centralizado de aprobación
  const {
    isApproving,
    isRejecting,
    rejectionReason,
    setRejectionReason,
    showRejectDialog,
    setShowRejectDialog,
    fieldComments,
    fieldCommentMode,
    fieldCommentsCount,
    handleSaveFieldComment,
    handleRemoveFieldComment,
    handleApprove,
    handleReject,
  } = useApprovalWorkflow({ draftId, approvalMode });

  // Estado para alertas de seguimiento
  const [selectedAlertIds, setSelectedAlertIds] = useState<Set<number>>(new Set());

  // Sync selectedAlertIds to customDataRef so hook includes them in save/submit
  useEffect(() => {
    if (selectedAlertIds.size > 0) {
      customDataRef.current = { _selectedAlertTemplateIds: Array.from(selectedAlertIds) };
    } else {
      customDataRef.current = undefined;
    }
  }, [selectedAlertIds]);

  // Restore selectedAlertIds from loaded draft customData
  useEffect(() => {
    if (loadedCustomData?._selectedAlertTemplateIds && Array.isArray(loadedCustomData._selectedAlertTemplateIds)) {
      setSelectedAlertIds(new Set(loadedCustomData._selectedAlertTemplateIds));
    }
  }, [loadedCustomData]);

  // Estado para secciones con errores de validación
  const [errorSections, setErrorSections] = useState<string[]>([]);

  // Calcular estadísticas de campos por paso para el wizard
  const stepFieldStats = useMemo(() => {
    if (!swiftConfigs || swiftConfigs.length === 0) {
      return {};
    }

    const stats: Record<number, { total: number; filled: number; required: number; requiredFilled: number }> = {};

    // Agrupar campos por paso usando DEFAULT_SECTION_STEP_MAP
    swiftConfigs.forEach(field => {
      if (field.isActive === false) return;

      const section = field.section || 'OTHER';
      const step = DEFAULT_SECTION_STEP_MAP[section];
      if (!step) return;

      if (!stats[step]) {
        stats[step] = { total: 0, filled: 0, required: 0, requiredFilled: 0 };
      }

      stats[step].total++;
      if (field.isRequired) {
        stats[step].required++;
      }

      // Función auxiliar para verificar si un valor está realmente lleno
      const isValueFilled = (value: any): boolean => {
        if (value === undefined || value === null || value === '') return false;

        if (typeof value === 'object') {
          if (Array.isArray(value)) return value.length > 0;
          if (Object.keys(value).length === 0) return false;

          // SWIFT_MULTI_OPTION: { detectedOption, inputMethod, bic, manualText, ... }
          if ('detectedOption' in value || 'inputMethod' in value) {
            const hasBic = value.bic && value.bic.trim() !== '';
            const hasManualText = Array.isArray(value.manualText) && value.manualText.some((t: string) => t && t.trim() !== '');
            return hasBic || hasManualText;
          }

          // CURRENCY_AMOUNT_INPUT: { currency, amount }
          if ('currency' in value && 'amount' in value) {
            return value.currency && value.amount && String(value.amount).trim() !== '';
          }

          // DATE_PLACE_INPUT: { date, place }
          if ('date' in value && 'place' in value) {
            return (value.date && value.date.trim() !== '') || (value.place && value.place.trim() !== '');
          }

          // SWIFT_PARTY: { text }
          if ('text' in value && Object.keys(value).length === 1) {
            return value.text && value.text.trim() !== '';
          }

          // Para otros objetos, verificar si al menos una propiedad tiene valor
          return Object.values(value).some(v =>
            v !== undefined && v !== null && v !== '' &&
            !(Array.isArray(v) && v.length === 0)
          );
        }

        return true;
      };

      // Verificar si el campo tiene valor
      const value = swiftFieldsData[field.fieldCode];

      if (isValueFilled(value)) {
        stats[step].filled++;
        if (field.isRequired) {
          stats[step].requiredFilled++;
        }
      }
    });

    return stats;
  }, [swiftConfigs, swiftFieldsData]);

  /**
   * Maneja el envío del formulario capturando errores de validación
   * y extrayendo las secciones con errores para resaltarlas en el UI
   */
  const handleSubmitWithErrorTracking = useCallback(async () => {
    try {
      // Limpiar errores previos antes de intentar enviar
      setErrorSections([]);
      await submitForm();
    } catch (error) {
      console.log('🔴 Error capturado:', error);
      console.log('🔴 Es SwiftValidationError?:', error instanceof SwiftValidationError);
      console.log('🔴 Nombre del error:', error?.constructor?.name);

      // Si es un error de validación SWIFT, extraer las secciones con errores
      if (error instanceof SwiftValidationError) {
        console.log('🔴 Errores de validación:', error.errors);
        const sectionsWithErrors = new Set<string>();
        for (const validationError of error.errors) {
          console.log('🔴 Error:', validationError.field, '- Sección:', validationError.section);
          if (validationError.section) {
            sectionsWithErrors.add(validationError.section);
          }
        }
        const sections = Array.from(sectionsWithErrors);
        console.log('🔴 Secciones con errores:', sections);
        setErrorSections(sections);
      } else if (error && typeof error === 'object' && 'errors' in error) {
        // Fallback: si el error tiene la estructura esperada pero instanceof falla
        console.log('🔴 Usando fallback para extraer errores');
        const anyError = error as { errors: Array<{ section?: string }> };
        const sectionsWithErrors = new Set<string>();
        for (const validationError of anyError.errors) {
          if (validationError.section) {
            sectionsWithErrors.add(validationError.section);
          }
        }
        const sections = Array.from(sectionsWithErrors);
        console.log('🔴 Secciones con errores (fallback):', sections);
        setErrorSections(sections);
      }
      // No re-lanzar el error ya que la notificación ya se mostró en swiftDraftService
    }
  }, [submitForm]);

  /**
   * Wrapper de handleSwiftFieldChange que también limpia errores de la sección
   * cuando el usuario edita un campo
   */
  const handleSwiftFieldChangeWithErrorClear = useCallback((fieldCode: string, value: any) => {
    // Primero llamar al handler original
    handleSwiftFieldChange(fieldCode, value);

    // Si hay errores, buscar la sección del campo y limpiarla
    if (errorSections.length > 0 && swiftConfigs.length > 0) {
      const fieldConfig = swiftConfigs.find(c => c.fieldCode === fieldCode);
      if (fieldConfig?.section) {
        setErrorSections(prev => prev.filter(s => s !== fieldConfig.section));
      }
    }
  }, [handleSwiftFieldChange, errorSections, swiftConfigs]);

  // Calcular estadísticas de campos opcionales
  const getOptionalFieldsStats = () => {
    if (!swiftConfigs || swiftConfigs.length === 0) {
      return { filled: 0, total: 0, percentage: 0 };
    }

    const swiftFieldMapping: Record<string, keyof typeof formData> = {
      ':23:': 'referenciaPreAviso',
      ':26E:': 'numeroEnmienda',
      ':39A:': 'toleranciaPorcentaje',
      ':39B:': 'montoMaximo',
      ':39C:': 'montoAdicional',
      ':51a:': 'bancoOrdenante',
      ':49:': 'instruccionesConfirmacion',
      ':44E:': 'rutaPuertoAPuerto',
      ':48:': 'periodoPresentacion',
      ':71B:': 'responsableComisiones',
      ':78:': 'instruccionesBancoPagador',
      ':79:': 'narrativaAdicional',
    };

    const optionalSwiftFields = swiftConfigs.filter(config =>
      !config.isRequired &&
      config.messageType === 'MT700' &&
      config.isActive
    );

    let filled = 0;
    let total = 0;

    optionalSwiftFields.forEach(config => {
      const formFieldName = swiftFieldMapping[config.fieldCode];
      if (formFieldName) {
        total++;
        const value = formData[formFieldName];
        if (value && value.toString().trim() !== '') {
          filled++;
        }
      }
    });

    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { filled, total, percentage };
  };

  // Generar preview del asiento contable cuando el usuario llega al paso de Contabilidad o en modo experto
  // El paso de Contabilidad es el penúltimo (totalSteps - 1), el último es SWIFT
  const accountingStep = totalSteps - 1;

  useEffect(() => {
    const generateAccountingPreview = async () => {
      // Solo generar si estamos en el paso de Contabilidad (wizard) o si es modo experto
      if (mode === 'wizard' && currentStep !== accountingStep) return;
      if (mode === 'client') return; // No generar en modo cliente

      // Extraer valores usando la configuración de campos (sin hardcode)
      const { reference, amount, currency, issueDate, expiryDate } = getStandardFieldValues(swiftFieldsData, swiftConfigs);

      if (!amount || !currency || !reference) {
        return;
      }

      try {
        let comisionCalculada = 0;
        let diasCalculados = 0;

        if (issueDate && expiryDate) {
          const fechaEm = new Date(issueDate);
          const fechaVenc = new Date(expiryDate);
          const diffTime = Math.abs(fechaVenc.getTime() - fechaEm.getTime());
          diasCalculados = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDiasVigencia(diasCalculados);

          // Calcular comisión - usar países de selectedEntities o COUNTRY_CODE del sistema como default
          const defaultCountry = systemConfig.countryCode || 'MX';
          const paisOrigen = selectedEntities.paisOrigen?.codigo || defaultCountry;
          const paisDestino = selectedEntities.paisDestino?.codigo || '';

          const comisionRequest: MensajeSWIFT = {
            tipoMensaje: 'MT700',
            evento: 'EMISSION_LC_IMPORT',
            monto: amount,
            moneda: currency,
            paisOrigen,
            paisDestino,
          };

          const comisionResponse = await comisionService.calcularComision(comisionRequest);
          comisionCalculada = comisionResponse.comisionCalculada;
          setCalculatedCommission(comisionCalculada);
        }

        const request: GenerateEntryRequest = {
          product: 'MT700',
          event: 'EMISSION_LC_IMPORT',
          amount: amount,
          currency: currency,
          reference: reference,
        };

        if (comisionCalculada > 0) {
          request.additionalAmounts = {
            commission: comisionCalculada,
          };
        }

        await previewEntry(request);
      } catch (error) {
        console.error('Error generando preview de asiento contable:', error);
      }
    };

    generateAccountingPreview();
  }, [currentStep, swiftFieldsData, swiftConfigs, mode, accountingStep, selectedEntities]);

  // Renderizar la sección correspondiente al paso actual
  const renderCurrentSection = () => {
    // Props comunes para todas las secciones
    const sectionProps = {
      mode,
      formData,
      selectedEntities,
      swiftFieldsData,
      swiftConfigs,
      fieldErrors,
      onFormDataChange: () => {},
      onSwiftFieldChange: handleSwiftFieldChangeWithErrorClear,
      onEntitySelect: () => {},
      showHelp: modeConfig.help.showContextualHelp,
      showOptionalFields,
    };

    // En modo experto, usar vista de acordeones
    if (mode === 'expert') {
      return (
        <AccordionExpertView
          dynamicSections={dynamicSections}
          swiftFieldsData={swiftFieldsData}
          onSwiftFieldChange={handleSwiftFieldChangeWithErrorClear}
          customData={customData}
          onCustomDataChange={setCustomData}
          customFieldSteps={customFieldSteps}
          customFieldsUserData={customFieldsUserData}
          approvalMode={approvalMode}
          errorSections={errorSections}
          swiftFieldConfigs={swiftConfigs}
          accountingEntry={accountingEntry}
          loadingAccountingEntry={loadingAccountingEntry}
          accountingEntryError={accountingEntryError}
          calculatedCommission={calculatedCommission}
          diasVigencia={diasVigencia}
          isCommissionDeferred={isCommissionDeferred}
          setIsCommissionDeferred={setIsCommissionDeferred}
          paymentSchedule={paymentSchedule}
          setPaymentSchedule={setPaymentSchedule}
          deferredPaymentsDialogOpen={deferredPaymentsDialogOpen}
          setDeferredPaymentsDialogOpen={setDeferredPaymentsDialogOpen}
          selectedEntities={selectedEntities}
          swiftConfigs={swiftConfigs}
          fieldComments={fieldComments}
          onSaveFieldComment={handleSaveFieldComment}
          onRemoveFieldComment={handleRemoveFieldComment}
          fieldCommentMode={fieldCommentMode}
          alertSelectedIds={selectedAlertIds}
          onAlertSelectedChange={setSelectedAlertIds}
        />
      );
    }

    // En modo wizard o client, mostrar la sección según el paso actual
    switch (currentStep) {
      case 1:
        return <BasicInfoSection {...sectionProps} />;
      case 2:
        return <AmountsSection {...sectionProps} />;
      case 3:
        return <BanksSection {...sectionProps} />;
      case 4:
        return <ShippingSection {...sectionProps} />;
      case 5:
        return <GoodsDocumentsSection {...sectionProps} />;
      case 6:
        return <ConditionsSection {...sectionProps} />;
      case 7:
        // Solo visible en modo wizard
        if (mode === 'wizard') {
          return (
            <AccountingSection
              mode={mode}
              swiftFieldsData={swiftFieldsData}
              selectedEntities={selectedEntities}
              accountingEntry={accountingEntry}
              loadingAccountingEntry={loadingAccountingEntry}
              accountingEntryError={accountingEntryError}
              calculatedCommission={calculatedCommission}
              diasVigencia={diasVigencia}
              isCommissionDeferred={isCommissionDeferred}
              setIsCommissionDeferred={setIsCommissionDeferred}
              paymentSchedule={paymentSchedule}
              setPaymentSchedule={setPaymentSchedule}
              deferredPaymentsDialogOpen={deferredPaymentsDialogOpen}
              setDeferredPaymentsDialogOpen={setDeferredPaymentsDialogOpen}
            />
          );
        }
        return null;
      case 8:
        // Alertas de seguimiento - solo wizard
        if (mode === 'wizard') {
          return (
            <AlertPreviewStep
              operationType="LC_IMPORT"
              eventCode="ISSUE"
              swiftFieldsData={swiftFieldsData}
              swiftConfigs={swiftConfigs}
              selectedAlertIds={selectedAlertIds}
              onSelectedAlertsChange={setSelectedAlertIds}
            />
          );
        }
        return null;
      case 9:
        // Solo visible en modo wizard
        if (mode === 'wizard') {
          return (
            <SwiftPreviewSection
              mode={mode}
              swiftFieldsData={swiftFieldsData}
              selectedEntities={selectedEntities}
              fieldConfigs={swiftConfigs}
            />
          );
        }
        return null;
      default:
        return null;
    }
  };

  // Mostrar loader mientras carga
  if (isLoadingDraft || isLoadingConfigs || loadingSections || loadingCustomFields) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Cargando formulario...</Text>
        </VStack>
      </Center>
    );
  }

  // Renderizar según el modo
  if (mode === 'expert') {
    return (
      <VStack align="stretch" gap={0}>
        {approvalMode && (
          <ApprovalToolbar
            isApproving={isApproving}
            isRejecting={isRejecting}
            rejectionReason={rejectionReason}
            setRejectionReason={setRejectionReason}
            showRejectDialog={showRejectDialog}
            setShowRejectDialog={setShowRejectDialog}
            fieldCommentsCount={fieldCommentsCount}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {/* Asistente de Digitación Rápida - Colapsado por defecto en modo experto */}
        {!approvalMode && !isLoadingConfigs && swiftConfigs && swiftConfigs.length > 0 && (
          <Box px={4} pt={4}>
            <QuickFieldAssistant
              fieldConfigs={swiftConfigs}
              formData={swiftFieldsData}
              onFieldChange={handleSwiftFieldChangeWithErrorClear}
              enabled={!approvalMode}
              readOnly={approvalMode}
              defaultCollapsed={true}
            />
          </Box>
        )}
        <ExpertLayout
          modeConfig={modeConfig}
          onSaveDraft={approvalMode ? undefined : saveDraft}
          onSubmit={approvalMode ? undefined : handleSubmitWithErrorTracking}
          isSubmitting={isSubmitting}
          readOnly={approvalMode}
        >
          {renderCurrentSection()}
        </ExpertLayout>
      </VStack>
    );
  }

  // Modo wizard o client

  return (
    <VStack align="stretch" gap={0}>
      {approvalMode && (
        <ApprovalToolbar
          isApproving={isApproving}
          isRejecting={isRejecting}
          rejectionReason={rejectionReason}
          setRejectionReason={setRejectionReason}
          showRejectDialog={showRejectDialog}
          setShowRejectDialog={setShowRejectDialog}
          fieldCommentsCount={fieldCommentsCount}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      {/* Asistente de Digitación Rápida - Colapsado por defecto */}
      {!approvalMode && !isLoadingConfigs && swiftConfigs && swiftConfigs.length > 0 && (
        <Box px={4} pt={4}>
          <QuickFieldAssistant
            fieldConfigs={swiftConfigs}
            formData={swiftFieldsData}
            onFieldChange={handleSwiftFieldChangeWithErrorClear}
            enabled={!approvalMode}
            readOnly={approvalMode}
            defaultCollapsed={true}
          />
        </Box>
      )}
      <WizardLayout
        mode={mode}
        modeConfig={modeConfig}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        goToNextStep={goToNextStep}
        goToPreviousStep={goToPreviousStep}
        onSaveDraft={approvalMode ? undefined : saveDraft}
        onSubmit={approvalMode ? undefined : handleSubmitWithErrorTracking}
        isSubmitting={isSubmitting}
        optionalFieldsStats={getOptionalFieldsStats()}
        showOptionalFields={showOptionalFields}
        onToggleOptionalFields={() => setShowOptionalFields(!showOptionalFields)}
        readOnly={approvalMode}
        errorSections={errorSections}
        stepFieldStats={stepFieldStats}
      >
        {renderCurrentSection()}
      </WizardLayout>
    </VStack>
  );
};

export default LCImportIssuanceForm;
