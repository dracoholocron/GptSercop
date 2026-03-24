/**
 * Panel de Ayuda Legal para Compras Públicas
 * Muestra asistencia legal contextual con referencias a LOSNCP
 */

import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Spinner,
  Alert,
  Accordion,
  Collapsible,
  Button,
  Card,
  Separator
} from '@chakra-ui/react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiFileText,
  FiExternalLink,
  FiHelpCircle,
  FiBook
} from 'react-icons/fi';
import { LuScale, LuLightbulb, LuSparkles } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getLegalHelp } from '../../../services/cpAIService';
import type { CPLegalHelpRequest, CPLegalHelpResponse, LegalReference } from '../../../services/cpAIService';

const MotionBox = motion.create(Box as any);
const MotionCard = motion.create(Card.Root as any);

interface CPLegalHelpPanelProps {
  processType: string;
  currentStep: string;
  fieldId: string;
  budget?: number;
  onClose?: () => void;
}

export const CPLegalHelpPanel: React.FC<CPLegalHelpPanelProps> = ({
  processType,
  currentStep,
  fieldId,
  budget,
  onClose
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [helpData, setHelpData] = useState<CPLegalHelpResponse | null>(null);
  const [question, setQuestion] = useState('');

  const bgGradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  const cardBg = 'white';
  const borderColor = 'gray.200';

  const fetchHelp = async (customQuestion?: string) => {
    setLoading(true);
    setError(null);

    try {
      const request: CPLegalHelpRequest = {
        processType,
        currentStep,
        fieldId,
        budget,
        question: customQuestion || undefined
      };

      const response = await getLegalHelp(request);
      setHelpData(response);
    } catch (err: any) {
      setError(err.message || 'Error al obtener ayuda legal');
    } finally {
      setLoading(false);
    }
  };

  // Cargar ayuda inicial
  React.useEffect(() => {
    fetchHelp();
  }, [processType, currentStep, fieldId]);

  const SeverityBadge = ({ severity }: { severity: string }) => {
    const config = {
      INFO: { color: 'blue', icon: HelpCircle, label: 'Información' },
      WARNING: { color: 'orange', icon: AlertTriangle, label: 'Advertencia' },
      REQUIRED: { color: 'red', icon: AlertTriangle, label: 'Obligatorio' }
    };
    const { color, icon, label } = config[severity as keyof typeof config] || config.INFO;

    return (
      <Badge colorPalette={color} variant="subtle" display="flex" alignItems="center" gap={1}>
        <Icon as={icon} boxSize={3} />
        {label}
      </Badge>
    );
  };

  const LegalReferenceCard = ({ reference }: { reference: LegalReference }) => (
    <MotionCard
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      size="sm"
      variant="outline"
      borderColor="purple.200"
      _dark={{ borderColor: 'purple.700' }}
    >
      <Card.Body p={3}>
        <HStack justify="space-between" mb={1}>
          <Badge colorPalette="purple" variant="solid">
            {reference.law}
          </Badge>
          <Text fontWeight="bold" color="purple.600" _dark={{ color: 'purple.300' }}>
            {reference.article}
          </Text>
        </HStack>
        <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
          {reference.summary}
        </Text>
      </Card.Body>
    </MotionCard>
  );

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <MotionBox
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          display="inline-block"
        >
          <Icon as={LuScale} boxSize={8} color="purple.500" />
        </MotionBox>
        <Text mt={3} color="gray.500">
          Consultando marco legal...
        </Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert.Root status="error" borderRadius="lg">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>Error</Alert.Title>
          <Alert.Description>{error}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
    );
  }

  if (!helpData) return null;

  return (
    <MotionBox
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header con gradiente */}
      <Box
        background={bgGradient}
        p={4}
        borderTopRadius="xl"
        color="white"
      >
        <HStack justify="space-between">
          <HStack>
            <Icon as={LuSparkles} boxSize={5} />
            <Text fontWeight="bold" fontSize="lg">Asistente Legal IA</Text>
          </HStack>
          <HStack>
            <SeverityBadge severity={helpData.severity} />
            {helpData.confidence && (
              <Badge colorPalette="green" variant="subtle">
                {Math.round(helpData.confidence * 100)}% confianza
              </Badge>
            )}
          </HStack>
        </HStack>
        <Text fontSize="lg" fontWeight="semibold" mt={2}>
          {helpData.title}
        </Text>
      </Box>

      {/* Contenido principal */}
      <Box bg={cardBg} p={4} borderBottomRadius="xl" borderWidth="1px" borderColor={borderColor} borderTop="none">
        <VStack align="stretch" gap={4}>
          {/* Descripción */}
          <Text color="gray.700" _dark={{ color: 'gray.300' }} lineHeight="tall">
            {helpData.content}
          </Text>

          {/* Referencias Legales */}
          {helpData.legalReferences.length > 0 && (
            <Box>
              <HStack mb={2}>
                <Icon as={LuScale} boxSize={4} color="purple.500" />
                <Text fontWeight="semibold" color="purple.700" _dark={{ color: 'purple.300' }}>
                  Referencias Legales
                </Text>
              </HStack>
              <VStack align="stretch" gap={2}>
                <AnimatePresence>
                  {helpData.legalReferences.map((ref, idx) => (
                    <LegalReferenceCard key={idx} reference={ref} />
                  ))}
                </AnimatePresence>
              </VStack>
            </Box>
          )}

          <Separator />

          {/* Requisitos */}
          {helpData.requirements.length > 0 && (
            <Collapsible.Root>
              <Collapsible.Trigger asChild>
                <Button variant="ghost" size="sm" w="full" justifyContent="space-between">
                  <HStack>
                    <Icon as={FiCheckCircle} boxSize={4} color="green.500" />
                    <Text>Requisitos ({helpData.requirements.length})</Text>
                  </HStack>
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <VStack align="stretch" gap={1} pl={6} pt={2}>
                  {helpData.requirements.map((req, idx) => (
                    <HStack key={idx} align="start">
                      <Icon as={FiCheckCircle} boxSize={3} color="green.500" mt={1} />
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {req}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>
          )}

          {/* Errores Comunes */}
          {helpData.commonErrors.length > 0 && (
            <Collapsible.Root>
              <Collapsible.Trigger asChild>
                <Button variant="ghost" size="sm" w="full" justifyContent="space-between">
                  <HStack>
                    <Icon as={FiAlertTriangle} boxSize={4} color="orange.500" />
                    <Text>Errores Comunes a Evitar ({helpData.commonErrors.length})</Text>
                  </HStack>
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <VStack align="stretch" gap={1} pl={6} pt={2}>
                  {helpData.commonErrors.map((err, idx) => (
                    <HStack key={idx} align="start">
                      <Icon as={FiAlertTriangle} boxSize={3} color="orange.500" mt={1} />
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {err}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>
          )}

          {/* Tips */}
          {helpData.tips.length > 0 && (
            <Collapsible.Root>
              <Collapsible.Trigger asChild>
                <Button variant="ghost" size="sm" w="full" justifyContent="space-between">
                  <HStack>
                    <Icon as={LuLightbulb} boxSize={4} color="yellow.500" />
                    <Text>Consejos ({helpData.tips.length})</Text>
                  </HStack>
                </Button>
              </Collapsible.Trigger>
              <Collapsible.Content>
                <VStack align="stretch" gap={1} pl={6} pt={2}>
                  {helpData.tips.map((tip, idx) => (
                    <HStack key={idx} align="start">
                      <Icon as={LuLightbulb} boxSize={3} color="yellow.500" mt={1} />
                      <Text fontSize="sm" color="gray.600" _dark={{ color: 'gray.400' }}>
                        {tip}
                      </Text>
                    </HStack>
                  ))}
                </VStack>
              </Collapsible.Content>
            </Collapsible.Root>
          )}

          {/* Resoluciones SERCOP */}
          {helpData.sercopResolutions.length > 0 && (
            <Box>
              <HStack mb={2}>
                <Icon as={FiFileText} boxSize={4} color="blue.500" />
                <Text fontWeight="semibold" fontSize="sm">
                  Resoluciones SERCOP Relacionadas
                </Text>
              </HStack>
              <HStack flexWrap="wrap" gap={2}>
                {helpData.sercopResolutions.map((res, idx) => (
                  <Badge
                    key={idx}
                    colorPalette="blue"
                    variant="outline"
                    cursor="pointer"
                    _hover={{ bg: 'blue.50' }}
                  >
                    <Icon as={FiExternalLink} boxSize={3} mr={1} />
                    {res}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}

          {/* Footer con info del modelo */}
          <HStack justify="space-between" pt={2} borderTopWidth="1px" borderColor={borderColor}>
            <Text fontSize="xs" color="gray.400">
              Procesado en {helpData.processingTimeMs}ms
            </Text>
            <Text fontSize="xs" color="gray.400">
              {helpData.provider} / {helpData.model}
            </Text>
          </HStack>
        </VStack>
      </Box>
    </MotionBox>
  );
};

export default CPLegalHelpPanel;
