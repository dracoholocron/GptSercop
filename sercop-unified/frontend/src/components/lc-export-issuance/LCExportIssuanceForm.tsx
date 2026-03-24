import { useState, useEffect } from 'react';
import { VStack, Box, Spinner, Center, Text } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useAccountingEntry } from '../../hooks/useAccountingEntry';
import { useLCIssuanceForm } from '../../hooks/useLCIssuanceForm';
import { useApprovalWorkflow } from '../../hooks/useApprovalWorkflow';
import { comisionService, type MensajeSWIFT } from '../../services/commissionService';
import { getStandardFieldValues } from '../../utils/swiftMessageParser';
import type { GenerateEntryRequest } from '../../types/accounting';
import type { IssuanceMode, PaymentScheduleItem } from '../lc-issuance/types';

// Importar secciones dinámicas
import { DynamicSwiftSection } from '../DynamicSwiftSection';
import { useSwiftSections } from '../../hooks/useSwiftSections';
import { EmbeddedCustomSection, CustomFieldsPanel } from '../customfields';
import { useCustomFields } from '../../hooks/useCustomFields';

// Reutilizar secciones legacy del módulo de importación (para modo wizard/client)
import {
  BasicInfoSection,
  AmountsSection,
  BanksSection,
  ShippingSection,
  GoodsDocumentsSection,
  ConditionsSection,
  AccountingSection,
  SwiftPreviewSection,
} from '../lc-issuance/sections';

// Reutilizar layouts
import { WizardLayout, ExpertLayout } from '../lc-issuance/layouts';

// Vista de acordeones para modo experto
import { AccordionExpertView } from './AccordionExpertView';

// Asistente de digitación rápida
import { QuickFieldAssistant } from '../shared/QuickFieldAssistant';
import { ApprovalToolbar } from '../shared/ApprovalToolbar';

export interface LCExportIssuanceFormProps {
  mode?: IssuanceMode;
  draftId?: number | string;
  approvalMode?: boolean;
}

/**
 * Componente principal para emisión de LC de Exportación
 * Soporta 3 modos: wizard, expert, client
 */
export const LCExportIssuanceForm: React.FC<LCExportIssuanceFormProps> = ({
  mode = 'wizard',
  draftId,
  approvalMode = false,
}) => {
  const { t } = useTranslation();

  // Hook centralizado de estado del formulario
  // Pasar operationType: 'LC_EXPORT' para usar productCode 'E' (Exportaciones)
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
  } = useLCIssuanceForm({ mode, draftId, operationType: 'LC_EXPORT' });

  // Hook de aprobación
  const {
    isApproving, isRejecting, rejectionReason, setRejectionReason,
    showRejectDialog, setShowRejectDialog, fieldComments, fieldCommentMode,
    fieldCommentsCount, handleSaveFieldComment, handleRemoveFieldComment,
    handleApprove, handleReject,
  } = useApprovalWorkflow({ draftId, approvalMode });

  // Cargar secciones dinámicas desde la base de datos (para modo experto)
  // Usar MT710 para LC Export (o MT700 si usan el mismo formato)
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
    productType: 'LC_EXPORT',
    mode: 'WIZARD',
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
              tipoMensaje: 'MT700',
              evento: 'EMISSION_LC_EXPORT',
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
          product: 'MT700',
          event: 'EMISSION_LC_EXPORT', // Evento específico para exportación
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
          title={t('expertMode.lcExportTitle')}
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
        title={mode === 'client' ? t('lcExportWizard.clientModeTitle') : t('lcExportWizard.title')}
      >
        {renderCurrentSection()}
      </WizardLayout>
    </VStack>
  );
};

export default LCExportIssuanceForm;
