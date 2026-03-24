/**
 * CPAIResponseDisplay - Componente transversal para renderizar respuestas de IA legal
 * Reutilizable en cualquier contexto: asistente de selección, ayuda por campo, ayuda por tarjeta, etc.
 */
import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Badge,
  Icon,
  Flex,
  SimpleGrid,
  Button,
} from '@chakra-ui/react';
import {
  FiCheckCircle,
  FiAlertTriangle,
  FiBook,
  FiShield,
  FiTarget,
  FiZap,
  FiX,
} from 'react-icons/fi';
import { LuSparkles, LuScale, LuBookOpen, LuLightbulb, LuCircleAlert } from 'react-icons/lu';
import { useTheme } from '../../../contexts/ThemeContext';
import type { CPLegalHelpResponse, LegalReference } from '../../../services/cpAIService';

interface CPAIResponseDisplayProps {
  response: CPLegalHelpResponse;
  /** Title shown in the header bar */
  headerTitle?: string;
  /** Subtitle shown in the header bar */
  headerSubtitle?: string;
  /** Gradient start color */
  gradientFrom?: string;
  /** Gradient end color */
  gradientTo?: string;
  /** Show close button */
  onClose?: () => void;
}

export const CPAIResponseDisplay: React.FC<CPAIResponseDisplayProps> = ({
  response,
  headerTitle,
  headerSubtitle = 'Análisis basado en LOSNCP',
  gradientFrom = 'purple.500',
  gradientTo = 'blue.600',
  onClose,
}) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const cardBorder = isDark ? 'gray.700' : 'gray.200';

  // Use severity-based gradient if warning
  const actualGradientFrom = response.severity === 'WARNING' ? 'orange.500' : gradientFrom;
  const actualGradientTo = response.severity === 'WARNING' ? 'red.500' : gradientTo;

  return (
    <Box borderRadius="xl" overflow="hidden" borderWidth="1px" borderColor={isDark ? 'purple.600' : 'purple.200'} shadow="lg">
      {/* Header with gradient */}
      <Box
        bgGradient={isDark ? 'to-r' : 'to-r'}
        gradientFrom={actualGradientFrom}
        gradientTo={actualGradientTo}
        px={4}
        py={3}
        color="white"
      >
        <Flex justify="space-between" align="center">
          <HStack gap={2}>
            <Flex w={8} h={8} borderRadius="full" bg="whiteAlpha.200" align="center" justify="center">
              <Icon as={LuSparkles} boxSize={4} />
            </Flex>
            <VStack align="start" gap={0}>
              <Text fontWeight="bold" fontSize="sm">{headerTitle || response.title}</Text>
              <Text fontSize="2xs" opacity={0.8}>{headerSubtitle}</Text>
            </VStack>
          </HStack>
          <HStack gap={2}>
            {response.confidence > 0 && (
              <Badge bg="whiteAlpha.200" color="white" fontSize="2xs" px={2} borderRadius="full">
                <Icon as={FiTarget} mr={1} boxSize={2.5} />
                {Math.round(response.confidence * 100)}% confianza
              </Badge>
            )}
            {onClose && (
              <Button
                size="xs"
                variant="ghost"
                color="white"
                _hover={{ bg: 'whiteAlpha.200' }}
                onClick={onClose}
                borderRadius="full"
                w={6}
                h={6}
                p={0}
                minW="auto"
              >
                <Icon as={FiX} boxSize={3} />
              </Button>
            )}
          </HStack>
        </Flex>
      </Box>

      <Box p={4} bg={isDark ? 'gray.800' : 'white'}>
        <VStack align="stretch" gap={4}>
          {/* Main Content Card */}
          <Box p={4} bg={isDark ? 'gray.750' : 'gray.50'} borderRadius="lg" borderLeftWidth="4px" borderLeftColor="purple.500">
            <Text fontSize="sm" color={colors.textColor} lineHeight="1.8" whiteSpace="pre-wrap">
              {response.content}
            </Text>
          </Box>

          {/* Two-column: Legal References & Requirements */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {/* Legal References */}
            {response.legalReferences?.length > 0 && (
              <Box p={3} borderWidth="1px" borderColor={isDark ? 'purple.700' : 'purple.200'} borderRadius="lg" bg={isDark ? 'purple.900/30' : 'purple.50'}>
                <HStack mb={2} gap={2}>
                  <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'purple.800' : 'purple.100'} align="center" justify="center">
                    <Icon as={LuScale} color="purple.500" boxSize={3.5} />
                  </Flex>
                  <Text fontWeight="700" fontSize="xs" color="purple.500" textTransform="uppercase" letterSpacing="wide">
                    Referencias Legales
                  </Text>
                </HStack>
                <VStack align="stretch" gap={2}>
                  {response.legalReferences.map((ref: LegalReference, i: number) => (
                    <Box
                      key={i}
                      p={2}
                      bg={isDark ? 'whiteAlpha.50' : 'white'}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={isDark ? 'purple.700' : 'purple.100'}
                      _hover={{ shadow: 'sm', borderColor: 'purple.400' }}
                      transition="all 0.2s"
                    >
                      <HStack align="start" gap={2}>
                        <Badge colorPalette="purple" variant="solid" size="sm" flexShrink={0} fontSize="2xs" px={2} borderRadius="md">
                          {ref.article}
                        </Badge>
                        <VStack align="start" gap={0}>
                          {ref.law && <Text fontSize="2xs" color="purple.500" fontWeight="600">{ref.law}</Text>}
                          <Text fontSize="xs" color={colors.textColor} lineHeight="short">{ref.summary}</Text>
                        </VStack>
                      </HStack>
                    </Box>
                  ))}
                </VStack>
              </Box>
            )}

            {/* Requirements */}
            {response.requirements?.length > 0 && (
              <Box p={3} borderWidth="1px" borderColor={isDark ? 'green.700' : 'green.200'} borderRadius="lg" bg={isDark ? 'green.900/30' : 'green.50'}>
                <HStack mb={2} gap={2}>
                  <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'green.800' : 'green.100'} align="center" justify="center">
                    <Icon as={FiCheckCircle} color="green.500" boxSize={3.5} />
                  </Flex>
                  <Text fontWeight="700" fontSize="xs" color="green.500" textTransform="uppercase" letterSpacing="wide">
                    Requisitos Obligatorios
                  </Text>
                </HStack>
                <VStack align="stretch" gap={1.5}>
                  {response.requirements.map((req: string, i: number) => (
                    <HStack key={i} align="start" gap={2} p={1.5} borderRadius="md" _hover={{ bg: isDark ? 'whiteAlpha.50' : 'green.100' }}>
                      <Flex w={5} h={5} borderRadius="full" bg={isDark ? 'green.800' : 'green.200'} align="center" justify="center" flexShrink={0} mt={0.5}>
                        <Text fontSize="2xs" fontWeight="bold" color="green.500">{i + 1}</Text>
                      </Flex>
                      <Text fontSize="xs" color={colors.textColor} lineHeight="short">{req}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </SimpleGrid>

          {/* Common Errors */}
          {response.commonErrors?.length > 0 && (
            <Box p={3} borderWidth="1px" borderColor={isDark ? 'orange.700' : 'orange.200'} borderRadius="lg" bg={isDark ? 'orange.900/30' : 'orange.50'}>
              <HStack mb={2} gap={2}>
                <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'orange.800' : 'orange.100'} align="center" justify="center">
                  <Icon as={LuCircleAlert} color="orange.500" boxSize={3.5} />
                </Flex>
                <Text fontWeight="700" fontSize="xs" color="orange.500" textTransform="uppercase" letterSpacing="wide">
                  Errores Frecuentes a Evitar
                </Text>
              </HStack>
              <VStack align="stretch" gap={1.5}>
                {response.commonErrors.map((err: string, i: number) => (
                  <HStack key={i} align="start" gap={2} p={1.5}>
                    <Icon as={FiAlertTriangle} color="orange.400" boxSize={3} mt={0.5} flexShrink={0} />
                    <Text fontSize="xs" color={colors.textColor}>{err}</Text>
                  </HStack>
                ))}
              </VStack>
            </Box>
          )}

          {/* Two-column: Tips & SERCOP Resolutions */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
            {response.tips?.length > 0 && (
              <Box p={3} borderWidth="1px" borderColor={isDark ? 'blue.700' : 'blue.200'} borderRadius="lg" bg={isDark ? 'blue.900/30' : 'blue.50'}>
                <HStack mb={2} gap={2}>
                  <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'blue.800' : 'blue.100'} align="center" justify="center">
                    <Icon as={LuLightbulb} color="blue.500" boxSize={3.5} />
                  </Flex>
                  <Text fontWeight="700" fontSize="xs" color="blue.500" textTransform="uppercase" letterSpacing="wide">
                    Recomendaciones
                  </Text>
                </HStack>
                <VStack align="stretch" gap={1.5}>
                  {response.tips.map((tip: string, i: number) => (
                    <HStack key={i} align="start" gap={2} p={1.5}>
                      <Icon as={FiZap} color="blue.400" boxSize={3} mt={0.5} flexShrink={0} />
                      <Text fontSize="xs" color={colors.textColor}>{tip}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}

            {response.sercopResolutions?.length > 0 && (
              <Box p={3} borderWidth="1px" borderColor={isDark ? 'teal.700' : 'teal.200'} borderRadius="lg" bg={isDark ? 'teal.900/30' : 'teal.50'}>
                <HStack mb={2} gap={2}>
                  <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'teal.800' : 'teal.100'} align="center" justify="center">
                    <Icon as={FiBook} color="teal.500" boxSize={3.5} />
                  </Flex>
                  <Text fontWeight="700" fontSize="xs" color="teal.500" textTransform="uppercase" letterSpacing="wide">
                    Resoluciones SERCOP
                  </Text>
                </HStack>
                <VStack align="stretch" gap={1.5}>
                  {response.sercopResolutions.map((res: string, i: number) => (
                    <HStack key={i} align="start" gap={2} p={1.5}>
                      <Icon as={FiShield} color="teal.400" boxSize={3} mt={0.5} flexShrink={0} />
                      <Text fontSize="xs" color={colors.textColor} fontFamily="mono">{res}</Text>
                    </HStack>
                  ))}
                </VStack>
              </Box>
            )}
          </SimpleGrid>

          {/* Examples */}
          {response.examples?.length > 0 && (
            <Box p={3} borderWidth="1px" borderColor={isDark ? 'cyan.700' : 'cyan.200'} borderRadius="lg" bg={isDark ? 'cyan.900/30' : 'cyan.50'}>
              <HStack mb={2} gap={2}>
                <Flex w={6} h={6} borderRadius="md" bg={isDark ? 'cyan.800' : 'cyan.100'} align="center" justify="center">
                  <Icon as={LuBookOpen} color="cyan.500" boxSize={3.5} />
                </Flex>
                <Text fontWeight="700" fontSize="xs" color="cyan.500" textTransform="uppercase" letterSpacing="wide">
                  Ejemplos Prácticos
                </Text>
              </HStack>
              <VStack align="stretch" gap={1.5}>
                {response.examples.map((ex: string, i: number) => (
                  <Box key={i} p={2} bg={isDark ? 'whiteAlpha.50' : 'white'} borderRadius="md" borderLeftWidth="3px" borderLeftColor="cyan.400">
                    <Text fontSize="xs" color={colors.textColor} fontStyle="italic">{ex}</Text>
                  </Box>
                ))}
              </VStack>
            </Box>
          )}

          {/* Footer */}
          <Flex justify="space-between" align="center" pt={2} borderTopWidth="1px" borderColor={isDark ? 'gray.700' : 'gray.100'}>
            <Badge colorPalette="purple" variant="subtle" size="sm" fontSize="2xs">
              <Icon as={LuSparkles} mr={1} boxSize={2.5} />
              Asistente IA LOSNCP
            </Badge>
            {response.processingTimeMs > 0 && (
              <Text fontSize="2xs" color={isDark ? 'gray.500' : 'gray.400'} fontFamily="mono">
                {response.provider} / {response.model} · {response.processingTimeMs}ms
              </Text>
            )}
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default CPAIResponseDisplay;
