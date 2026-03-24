import { useState, useEffect, useRef } from 'react';
import { VStack, Box, Spinner, Center, Text } from '@chakra-ui/react';
import { useAccountingEntry } from '../../hooks/useAccountingEntry';
import { useCollectionsIssuanceForm } from '../../hooks/useCollectionsIssuanceForm';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';
import { comisionService, type MensajeSWIFT } from '../../services/commissionService';
import { useSystemConfig } from '../../contexts/SystemConfigContext';
import type { GenerateEntryRequest } from '../../types/accounting';
import type { IssuanceMode, PaymentScheduleItem } from './types';

// Importar secciones
import {
  BasicInfoSection,
  AmountsSection,
  PartiesSection,
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

export interface CollectionsIssuanceFormProps {
  mode?: IssuanceMode;
  draftId?: number | string;
  initialMessageType?: string;
  approvalMode?: boolean;
}

/**
 * Componente principal para emisión de Cobranzas Documentarias (MT4xx)
 * Soporta 2 modos: wizard y expert (sin modo cliente)
 */
export const CollectionsIssuanceForm: React.FC<CollectionsIssuanceFormProps> = ({
  mode = 'wizard',
  draftId,
  initialMessageType = 'MT400',
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
    messageType,
    setMessageType,
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
    optionalFieldsStats,
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
  } = useCollectionsIssuanceForm({ mode, draftId, messageType: initialMessageType, customDataRef });

  const { config: systemConfig } = useSystemConfig();

  // Hook de aprobación
  const {
    isApproving, isRejecting, rejectionReason, setRejectionReason,
    showRejectDialog, setShowRejectDialog, fieldComments, fieldCommentMode,
    fieldCommentsCount, handleSaveFieldComment, handleRemoveFieldComment,
    handleApprove, handleReject,
  } = useApprovalWorkflow({ draftId, approvalMode });

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

  // Estado para mostrar/ocultar campos opcionales
  const [showOptionalFields, setShowOptionalFields] = useState(true);

  // Calcular el paso de contabilidad dinámicamente (penúltimo paso, el último es SWIFT)
  const accountingStep = totalSteps - 1;

  // Generar preview del asiento contable cuando el usuario llega al paso de Contabilidad o en modo experto
  useEffect(() => {
    const generateAccountingPreview = async () => {
      // Solo generar si estamos en el paso de Contabilidad (wizard) o si es modo experto
      if (mode === 'wizard' && currentStep !== accountingStep) return;

      const currencyAmount = swiftFieldsData[':32B:'] || swiftFieldsData[':32a:'];
      const referencia = swiftFieldsData[':20:'];

      const monto = currencyAmount?.amount ? parseFloat(currencyAmount.amount) : 0;
      const moneda = currencyAmount?.currency || '';

      if (!monto || !moneda || !referencia) {
        return;
      }

      try {
        let comisionCalculada = 0;

        const comisionRequest: MensajeSWIFT = {
          tipoMensaje: messageType,
          evento: 'COLLECTION_ADVICE',
          monto: monto,
          moneda: moneda,
          paisOrigen: systemConfig.countryCode || 'MX',
          paisDestino: '',
        };

        const comisionResponse = await comisionService.calcularComision(comisionRequest);
        comisionCalculada = comisionResponse.comisionCalculada;

        setCalculatedCommission(comisionCalculada);

        const request: GenerateEntryRequest = {
          product: messageType,
          event: 'COLLECTION_ADVICE',
          amount: monto,
          currency: moneda,
          reference: referencia,
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
  }, [currentStep, swiftFieldsData, mode, messageType, accountingStep]);

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
      messageType,
    };

    // En modo experto, usar vista de acordeones
    if (mode === 'expert') {
      return (
        <AccordionExpertView
          mode={mode}
          formData={formData}
          selectedEntities={selectedEntities}
          swiftFieldsData={swiftFieldsData}
          swiftConfigs={swiftConfigs}
          fieldErrors={fieldErrors}
          onFormDataChange={() => {}}
          onSwiftFieldChange={handleSwiftFieldChange}
          onEntitySelect={() => {}}
          showHelp={modeConfig.help.showContextualHelp}
          showOptionalFields={showOptionalFields}
          messageType={messageType}
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
          alertSelectedIds={selectedAlertIds}
          onAlertSelectedChange={setSelectedAlertIds}
        />
      );
    }

    // En modo wizard, mostrar la sección según el paso actual
    switch (currentStep) {
      case 1:
        return <BasicInfoSection {...sectionProps} />;
      case 2:
        return <AmountsSection {...sectionProps} />;
      case 3:
        return <PartiesSection {...sectionProps} />;
      case 4:
        return <AdditionalInfoSection {...sectionProps} />;
      case 5:
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
      case 6:
        return (
          <AlertPreviewStep
            operationType="COLLECTION"
            swiftFieldsData={swiftFieldsData}
            swiftConfigs={swiftConfigs}
            selectedAlertIds={selectedAlertIds}
            onSelectedAlertsChange={setSelectedAlertIds}
          />
        );
      case 7:
        return (
          <SwiftPreviewSection
            mode={mode}
            swiftFieldsData={swiftFieldsData}
            selectedEntities={selectedEntities}
            messageType={messageType}
          />
        );
      default:
        return null;
    }
  };

  // Mostrar loader mientras carga
  if (isLoadingDraft || isLoadingConfigs) {
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
          title="Emisión de Cobranza - Modo Experto"
          messageType={messageType}
        >
          {renderCurrentSection()}
        </ExpertLayout>
      </VStack>
    );
  }

  // Modo wizard
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
        optionalFieldsStats={optionalFieldsStats}
        showOptionalFields={showOptionalFields}
        onToggleOptionalFields={() => setShowOptionalFields(!showOptionalFields)}
        title="Emisión de Cobranza Documentaria"
        messageType={messageType}
      >
        {renderCurrentSection()}
      </WizardLayout>
    </VStack>
  );
};

export default CollectionsIssuanceForm;
