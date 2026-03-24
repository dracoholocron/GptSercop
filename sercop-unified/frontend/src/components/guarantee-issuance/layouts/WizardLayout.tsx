import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Progress,
  Button,
  HStack,
  Badge,
  Card,
  Switch,
} from '@chakra-ui/react';
import { FiChevronLeft, FiChevronRight, FiCheck, FiSave } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../contexts/ThemeContext';
import type { IssuanceMode, StepDefinition, ModeConfig } from '../types';
import { WIZARD_STEPS, CLIENT_STEPS, getWizardStepsWithErrors } from '../types';

/** Estadísticas de campos por paso */
interface StepFieldStats {
  total: number;
  filled: number;
  required: number;
  requiredFilled: number;
}

interface WizardLayoutProps {
  mode: IssuanceMode;
  modeConfig: ModeConfig;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  isSubmitting: boolean;
  optionalFieldsStats: { filled: number; total: number; percentage: number };
  showOptionalFields?: boolean;
  onToggleOptionalFields?: () => void;
  title?: string;
  children: React.ReactNode;
  readOnly?: boolean;
  /** Códigos de sección con errores de validación (ej: ['GOODS', 'TERMS']) */
  errorSections?: string[];
  /** Estadísticas de campos por paso (paso => stats) */
  stepFieldStats?: Record<number, StepFieldStats>;
}

/**
 * Layout para el modo Wizard (paso a paso)
 * Incluye indicadores de progreso, navegación entre pasos y acciones
 */
export const WizardLayout: React.FC<WizardLayoutProps> = ({
  mode,
  modeConfig,
  currentStep,
  setCurrentStep,
  goToNextStep,
  goToPreviousStep,
  onSaveDraft,
  onSubmit,
  isSubmitting,
  optionalFieldsStats,
  showOptionalFields = true,
  onToggleOptionalFields,
  title,
  children,
  readOnly = false,
  errorSections = [],
  stepFieldStats = {},
}) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // Seleccionar pasos según el modo
  const steps: StepDefinition[] = mode === 'client' ? CLIENT_STEPS : WIZARD_STEPS;
  const totalSteps = modeConfig.totalSteps;
  const progress = (currentStep / totalSteps) * 100;

  // Calcular qué pasos tienen errores basado en las secciones con errores
  const stepsWithErrors = getWizardStepsWithErrors(errorSections);

  return (
    <Box flex={1} p={4}>
      <VStack gap={3} align="stretch">
        {/* Header Compacto */}
        <Heading size="lg" color={colors.textColor}>
          {title || (mode === 'client'
            ? t('lcImportWizard.clientModeTitle')
            : t('lcImportWizard.title'))}
        </Heading>

        {/* Barra de Progreso y Campos Opcionales - Compacto */}
        <Flex gap={4} align="center" flexWrap="wrap">
          <Flex flex={1} minW="200px" align="center" gap={3}>
            <Progress.Root value={progress} size="sm" colorPalette="blue" flex={1}>
              <Progress.Track bg={colors.borderColor}>
                <Progress.Range bg={colors.primaryColor} />
              </Progress.Track>
            </Progress.Root>
            <Text fontSize="xs" color={colors.textColorSecondary} whiteSpace="nowrap">
              {Math.round(progress)}%
            </Text>
          </Flex>
          {mode === 'wizard' && (
            <Flex align="center" gap={2} px={2} py={1} bg="cyan.500/10" borderRadius="md" border="1px" borderColor="cyan.500/30">
              <Text fontSize="xs" color="cyan.700" fontWeight="medium">
                Opcionales:
              </Text>
              <Badge colorPalette={optionalFieldsStats.filled > 0 ? "green" : "gray"} size="sm">
                {optionalFieldsStats.filled}/{optionalFieldsStats.total}
              </Badge>
            </Flex>
          )}
        </Flex>

        {/* Toggle de Campos Opcionales (solo en modo cliente) */}
        {mode === 'client' && onToggleOptionalFields && (
          <Card.Root bg={colors.activeBg} border="1px" borderColor={colors.borderColor}>
            <Card.Body p={3}>
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="semibold" color={colors.textColor} fontSize="sm">
                    Mostrar campos adicionales
                  </Text>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    Active esta opción para ver todos los campos disponibles en este paso
                  </Text>
                </Box>
                <Switch.Root
                  checked={showOptionalFields}
                  onCheckedChange={onToggleOptionalFields}
                  colorPalette="blue"
                >
                  <Switch.HiddenInput />
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Root>
              </Flex>
            </Card.Body>
          </Card.Root>
        )}

        {/* Indicador de Pasos Compacto */}
        <Box>
          <Flex align="center" justify="center" mb={2} gap={2}>
            <Badge
              colorPalette={stepsWithErrors.includes(currentStep) ? 'red' : 'blue'}
              size="sm"
            >
              {currentStep}/{totalSteps}
            </Badge>
            <Text fontSize="md" fontWeight="semibold" color={colors.textColor}>
              {steps[currentStep - 1]?.title}
            </Text>
            {/* Stats del paso actual */}
            {stepFieldStats[currentStep] && (
              <Badge
                colorPalette={stepFieldStats[currentStep].filled === stepFieldStats[currentStep].total ? 'green' : 'gray'}
                size="sm"
                variant="subtle"
              >
                {stepFieldStats[currentStep].filled}/{stepFieldStats[currentStep].total} campos
              </Badge>
            )}
          </Flex>

          {/* Números de Pasos Compactos */}
          <Flex justify="center" align="center" gap={1} flexWrap="wrap">
            {steps.map((step, index) => {
              const hasError = stepsWithErrors.includes(step.number);
              const stats = stepFieldStats[step.number];
              const isStepComplete = stats ? stats.requiredFilled === stats.required && stats.required > 0 : false;
              const isCompleted = currentStep > step.number || isStepComplete;
              const isCurrent = currentStep === step.number;

              // Calcular título con stats
              const statsTitle = stats
                ? ` (${stats.filled}/${stats.total} campos${stats.required > 0 ? `, ${stats.requiredFilled}/${stats.required} req` : ''})`
                : '';

              return (
                <Box key={step.number} display="flex" alignItems="center">
                  <Box position="relative">
                    <Flex
                      w={6}
                      h={6}
                      borderRadius="full"
                      align="center"
                      justify="center"
                      cursor="pointer"
                      onClick={() => setCurrentStep(step.number)}
                      bg={hasError ? 'red.500' : isCurrent ? colors.primaryColor : isCompleted ? 'green.500' : colors.borderColor}
                      color={hasError || isCurrent || isCompleted ? 'white' : colors.textColorSecondary}
                      fontWeight="bold"
                      fontSize="2xs"
                      transition="all 0.2s"
                      boxShadow={isCurrent ? `0 0 0 2px ${colors.primaryColor}40` : 'none'}
                      _hover={{ transform: 'scale(1.1)' }}
                      title={`${step.number}. ${step.title}${statsTitle}${hasError ? ' - Errores' : ''}`}
                    >
                      {isCompleted && !hasError ? <FiCheck size={10} /> : step.number}
                    </Flex>
                    {/* Mini indicador de progreso debajo del paso */}
                    {stats && stats.total > 0 && (
                      <Box
                        position="absolute"
                        bottom="-4px"
                        left="50%"
                        transform="translateX(-50%)"
                        w="16px"
                        h="2px"
                        borderRadius="full"
                        bg={colors.borderColor}
                        overflow="hidden"
                      >
                        <Box
                          h="100%"
                          w={`${Math.round((stats.filled / stats.total) * 100)}%`}
                          bg={isCompleted ? 'green.500' : isCurrent ? colors.primaryColor : 'gray.400'}
                          transition="width 0.3s"
                        />
                      </Box>
                    )}
                  </Box>
                  {index < steps.length - 1 && (
                    <Box w={2} h="1px" bg={isCompleted ? 'green.500' : colors.borderColor} />
                  )}
                </Box>
              );
            })}
          </Flex>

          {stepsWithErrors.length > 0 && (
            <Text fontSize="xs" color="red.500" textAlign="center" mt={1}>
              Errores en pasos: {stepsWithErrors.join(', ')}
            </Text>
          )}
        </Box>

        {/* Form Content */}
        <Box
          bg={colors.cardBg}
          borderRadius="lg"
          border="1px"
          borderColor={colors.borderColor}
          p={5}
          minH="400px"
        >
          {children}
        </Box>

        {/* Navigation Buttons */}
        <Flex justify="space-between" align="center">
          <Button
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
            variant="outline"
            borderColor={colors.borderColor}
            color={colors.textColor}
            size="lg"
          >
            <FiChevronLeft />
            Anterior
          </Button>

          <HStack gap={3}>
            {!readOnly && (
              <Button
                onClick={onSaveDraft}
                variant="outline"
                borderColor={colors.borderColor}
                color={colors.textColor}
                size="lg"
                disabled={isSubmitting}
              >
                <FiSave />
                Guardar Borrador
              </Button>
            )}

            {currentStep < totalSteps ? (
              <Button
                onClick={goToNextStep}
                bg={colors.primaryColor}
                color="white"
                size="lg"
                _hover={{ opacity: 0.9 }}
              >
                Siguiente
                <FiChevronRight />
              </Button>
            ) : !readOnly ? (
              <Button
                onClick={onSubmit}
                bg="green.500"
                color="white"
                size="lg"
                _hover={{ opacity: 0.9 }}
                disabled={isSubmitting}
              >
                <FiCheck />
                {mode === 'client' ? 'Enviar Solicitud' : 'Enviar Carta de Crédito'}
              </Button>
            ) : null}
          </HStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default WizardLayout;
