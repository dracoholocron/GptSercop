import { useState, useEffect, useRef } from 'react';
import { VStack, Box, Spinner, Center, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccountingEntry } from '../../hooks/useAccountingEntry';
import { useGuaranteeIssuanceForm } from '../../hooks/useGuaranteeIssuanceForm';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';
import { comisionService, type MensajeSWIFT } from '../../services/commissionService';
import { getStandardFieldValues } from '../../utils/swiftMessageParser';
import type { GenerateEntryRequest } from '../../types/accounting';
import type { IssuanceMode, PaymentScheduleItem } from './types';

// Importar secciones dinámicas
import { DynamicSwiftSection } from '../DynamicSwiftSection';
import { useSwiftSections } from '../../hooks/useSwiftSections';
import { EmbeddedCustomSection, CustomFieldsPanel } from '../customfields';
import { useCustomFields } from '../../hooks/useCustomFields';

// Importar secciones legacy (para modo wizard/client)
import {
  BasicInfoSection,
  AmountsDatesSection,
  BanksSection,
  TermsSection,
  AdditionalInfoSection,
  AccountingSection,
  SwiftPreviewSection,
} from './sections';

// Importar layouts
import { WizardLayout, ExpertLayout } from './layouts';

// Vista de acordeones para modo experto
import { AccordionExpertView } from './AccordionExpertView';

// Asistente de digitación rápida
import { QuickFieldAssistant } from '../shared/QuickFieldAssistant';
import { ApprovalToolbar } from '../shared/ApprovalToolbar';
import { AlertPreviewStep } from '../shared/AlertPreviewStep';

export interface GuaranteeIssuanceFormProps {
  mode?: IssuanceMode;
  draftId?: number | string;
  approvalMode?: boolean;
}

/**
 * Componente principal para emisión de Garantías Bancarias (MT760)
 * Soporta 3 modos: wizard, expert, client
 */
export const GuaranteeIssuanceForm: React.FC<GuaranteeIssuanceFormProps> = ({
  mode = 'wizard',
  draftId,
  approvalMode = false,
}) => {
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
  } = useGuaranteeIssuanceForm({ mode, draftId, customDataRef });

  const { t } = useTranslation();

  // Hook de aprobación
  const {
    isApproving, isRejecting, rejectionReason, setRejectionReason,
    showRejectDialog, setShowRejectDialog, fieldComments, fieldCommentMode,
    fieldCommentsCount, handleSaveFieldComment, handleRemoveFieldComment,
    handleApprove, handleReject,
  } = useApprovalWorkflow({ draftId, approvalMode });

  // Cargar secciones dinámicas desde la base de datos (para modo experto)
  const { sections: dynamicSections, loading: loadingSections } = useSwiftSections('MT760');

  // Cargar campos personalizados (custom fields)
  const {
    customData,
    setCustomData,
    configuration: customFieldsConfig,
    isLoading: loadingCustomFields,
    separateSteps: customFieldSteps,
    userData: customFieldsUserData,
  } = useCustomFields({
    productType: 'GUARANTEE',
    mode: 'WIZARD',
  });

  // Hook para asientos contables
  const {
    entry: accountingEntry,
    loading: loadingAccountingEntry,
    error: accountingEntryError,
    previewEntry,
  } = useAccountingEntry();

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

  // Estado para el diálogo de diferimiento
  const [deferredPaymentsDialogOpen, setDeferredPaymentsDialogOpen] = useState(false);

  // Estado para mostrar/ocultar campos opcionales (default: false en modo cliente, true en otros)
  const [showOptionalFields, setShowOptionalFields] = useState(mode !== 'client');

  // Calcular estadísticas de campos opcionales
  const getOptionalFieldsStats = () => {
    if (!swiftConfigs || swiftConfigs.length === 0) {
      return { filled: 0, total: 0, percentage: 0 };
    }

    const optionalSwiftFields = swiftConfigs.filter(config =>
      !config.isRequired &&
      config.messageType === 'MT760' &&
      config.isActive
    );

    let filled = 0;
    let total = optionalSwiftFields.length;

    optionalSwiftFields.forEach(config => {
      const value = swiftFieldsData[config.fieldCode];
      if (value && value.toString().trim() !== '') {
        filled++;
      }
    });

    const percentage = total > 0 ? Math.round((filled / total) * 100) : 0;
    return { filled, total, percentage };
  };

  // Calcular el paso de contabilidad dinámicamente (penúltimo paso, el último es SWIFT)
  const accountingStep = totalSteps - 1;

  // Generar preview del asiento contable cuando el usuario llega al paso de Contabilidad o en modo experto
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

          // Solo calcular comisión si tenemos los países de origen y destino
          const paisOrigen = selectedEntities.paisOrigen?.codigo;
          const paisDestino = selectedEntities.paisDestino?.codigo;

          if (paisOrigen && paisDestino) {
            const comisionRequest: MensajeSWIFT = {
              tipoMensaje: 'MT760',
              evento: 'GUARANTEE_ISSUANCE',
              monto: amount,
              moneda: currency,
              paisOrigen,
              paisDestino,
            };

            const comisionResponse = await comisionService.calcularComision(comisionRequest);
            comisionCalculada = comisionResponse.comisionCalculada;
            setCalculatedCommission(comisionCalculada);
          }
        }

        const request: GenerateEntryRequest = {
          product: 'MT760',
          event: 'EMISSION_GUARANTEE',
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
      onSwiftFieldChange: handleSwiftFieldChange,
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
          onSwiftFieldChange={handleSwiftFieldChange}
          customData={customData}
          onCustomDataChange={setCustomData}
          customFieldSteps={customFieldSteps}
          customFieldsUserData={customFieldsUserData}
          approvalMode={approvalMode}
          errorSections={[]}
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
        return <AmountsDatesSection {...sectionProps} />;
      case 3:
        return <BanksSection {...sectionProps} />;
      case 4:
        return <TermsSection {...sectionProps} />;
      case 5:
        return <AdditionalInfoSection {...sectionProps} />;
      case 6:
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
      case 7:
        // Alertas de seguimiento - solo wizard
        if (mode === 'wizard') {
          return (
            <AlertPreviewStep
              operationType="GUARANTEE"
              eventCode="ISSUE"
              swiftFieldsData={swiftFieldsData}
              swiftConfigs={swiftConfigs}
              selectedAlertIds={selectedAlertIds}
              onSelectedAlertsChange={setSelectedAlertIds}
            />
          );
        }
        return null;
      case 8:
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
          <Spinner size="xl" color="purple.500" />
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
            isApproving={isApproving} isRejecting={isRejecting}
            rejectionReason={rejectionReason} setRejectionReason={setRejectionReason}
            showRejectDialog={showRejectDialog} setShowRejectDialog={setShowRejectDialog}
            fieldCommentsCount={fieldCommentsCount}
            onApprove={handleApprove} onReject={handleReject}
          />
        )}
        {!approvalMode && !isLoadingConfigs && swiftConfigs && swiftConfigs.length > 0 && (
          <Box px={4} pt={4}>
            <QuickFieldAssistant
              fieldConfigs={swiftConfigs}
              formData={swiftFieldsData}
              onFieldChange={handleSwiftFieldChange}
              enabled={!approvalMode}
              readOnly={approvalMode}
              defaultCollapsed={true}
            />
          </Box>
        )}
        <ExpertLayout
          modeConfig={modeConfig}
          onSaveDraft={approvalMode ? undefined : saveDraft}
          onSubmit={approvalMode ? undefined : submitForm}
          isSubmitting={isSubmitting}
          readOnly={approvalMode}
          title="Emisión de Garantía Bancaria - Modo Experto"
        >
          {renderCurrentSection()}
        </ExpertLayout>
      </VStack>
    );
  }

  // Modo wizard o client
  return (
    <VStack align="stretch" gap={0}>
      {/* Asistente de Digitación Rápida - Colapsado por defecto */}
      {!isLoadingConfigs && swiftConfigs && swiftConfigs.length > 0 && (
        <Box px={4} pt={4}>
          <QuickFieldAssistant
            fieldConfigs={swiftConfigs}
            formData={swiftFieldsData}
            onFieldChange={handleSwiftFieldChange}
            enabled={true}
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
        onSaveDraft={saveDraft}
        onSubmit={submitForm}
        isSubmitting={isSubmitting}
        optionalFieldsStats={getOptionalFieldsStats()}
        showOptionalFields={showOptionalFields}
        onToggleOptionalFields={() => setShowOptionalFields(!showOptionalFields)}
        title={mode === 'client' ? 'Solicitud de Garantía Bancaria' : 'Emisión de Garantía Bancaria'}
      >
        {renderCurrentSection()}
      </WizardLayout>
    </VStack>
  );
};

export default GuaranteeIssuanceForm;
