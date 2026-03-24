/**
 * AIShowcase - Página de presentación del Sistema de Compras Públicas con IA
 * Diseño espectacular para convencer sobre la innovación y beneficios
 */
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Flex,
  Button,
  SimpleGrid,
  Icon,
  Badge,
  Card,
  Progress,
  Image,
} from '@chakra-ui/react';
import { keyframes } from '@emotion/react';
import {
  FiCpu,
  FiShield,
  FiTrendingUp,
  FiGlobe,
  FiDatabase,
  FiZap,
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiClock,
  FiUsers,
  FiFileText,
  FiSearch,
  FiMessageSquare,
  FiLock,
  FiActivity,
  FiArrowRight,
  FiExternalLink,
  FiAward,
  FiTarget,
  FiBarChart2,
  FiPieChart,
  FiLayers,
  FiCode,
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';

// Animated counter hook
const useAnimatedCounter = (target: number, duration: number = 2000, startOnView: boolean = true) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasStarted) return;

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, hasStarted]);

  useEffect(() => {
    if (!startOnView || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  return { count, ref };
};

// Pulse animation
const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

// Gradient animation
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Float animation
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

interface StatCardProps {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description?: string;
}

const StatCard = ({ value, suffix = '', prefix = '', label, icon, color, description }: StatCardProps) => {
  const { count, ref } = useAnimatedCounter(value);

  // Color map for backgrounds
  const colorMap: Record<string, { bg: string; accent: string; border: string }> = {
    blue: { bg: '#1e3a8a', accent: '#3b82f6', border: '#60a5fa' },
    purple: { bg: '#4c1d95', accent: '#8b5cf6', border: '#a78bfa' },
    green: { bg: '#14532d', accent: '#22c55e', border: '#4ade80' },
    red: { bg: '#7f1d1d', accent: '#ef4444', border: '#f87171' },
    teal: { bg: '#134e4a', accent: '#14b8a6', border: '#2dd4bf' },
    cyan: { bg: '#164e63', accent: '#06b6d4', border: '#22d3ee' },
    orange: { bg: '#7c2d12', accent: '#f97316', border: '#fb923c' },
    yellow: { bg: '#713f12', accent: '#eab308', border: '#facc15' },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card.Root
      ref={ref}
      bg={colors.bg}
      borderWidth="2px"
      borderColor={colors.border}
      borderRadius="2xl"
      p={6}
      position="relative"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{
        transform: 'translateY(-5px)',
        shadow: '2xl',
        borderColor: colors.accent,
      }}
    >
      <Box
        position="absolute"
        top={0}
        right={0}
        w="100px"
        h="100px"
        bg={colors.accent}
        opacity={0.2}
        borderRadius="full"
        transform="translate(30%, -30%)"
      />
      <VStack align="start" gap={2}>
        <Flex
          w={12}
          h={12}
          borderRadius="xl"
          bg={colors.accent}
          color="white"
          align="center"
          justify="center"
          css={{ animation: `${floatAnimation} 3s ease-in-out infinite` }}
        >
          <Icon as={icon} boxSize={6} />
        </Flex>
        <Text
          fontSize="4xl"
          fontWeight="800"
          color={colors.border}
        >
          {prefix}{count.toLocaleString()}{suffix}
        </Text>
        <Text fontWeight="600" fontSize="lg" color="white">
          {label}
        </Text>
        {description && (
          <Text fontSize="sm" color="whiteAlpha.700">
            {description}
          </Text>
        )}
      </VStack>
    </Card.Root>
  );
};

interface AIModuleCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'active' | 'coming' | 'beta';
  features: string[];
  color: string;
  benefit: string;
}

const AIModuleCard = ({ title, description, icon, status, features, color, benefit }: AIModuleCardProps) => {
  const { isDark } = useTheme();
  const statusColors = {
    active: 'green',
    coming: 'orange',
    beta: 'purple',
  };
  const statusLabels = {
    active: 'Activo',
    coming: 'Próximamente',
    beta: 'Beta',
  };

  // Color map for gradients
  const colorMap: Record<string, { dark: string; light: string; border: string }> = {
    blue: { dark: '#1e3a8a', light: '#1d4ed8', border: '#3b82f6' },
    purple: { dark: '#4c1d95', light: '#7c3aed', border: '#8b5cf6' },
    green: { dark: '#14532d', light: '#16a34a', border: '#22c55e' },
    red: { dark: '#7f1d1d', light: '#dc2626', border: '#ef4444' },
    teal: { dark: '#134e4a', light: '#0d9488', border: '#14b8a6' },
    cyan: { dark: '#164e63', light: '#0891b2', border: '#06b6d4' },
    orange: { dark: '#7c2d12', light: '#ea580c', border: '#f97316' },
    yellow: { dark: '#713f12', light: '#ca8a04', border: '#eab308' },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card.Root
      bg={colors.dark}
      borderWidth="2px"
      borderColor={colors.border}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{
        borderColor: colors.light,
        shadow: '2xl',
        transform: 'translateY(-8px)',
      }}
    >
      <Box
        h="6px"
        bg={colors.light}
      />
      <Card.Body p={6}>
        <VStack align="start" gap={4}>
          <Flex justify="space-between" w="full" align="start">
            <Flex
              w={14}
              h={14}
              borderRadius="xl"
              bg={colors.light}
              color="white"
              align="center"
              justify="center"
              shadow="lg"
            >
              <Icon as={icon} boxSize={7} />
            </Flex>
            <Badge
              colorPalette={statusColors[status]}
              variant="subtle"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="600"
            >
              {statusLabels[status]}
            </Badge>
          </Flex>

          <VStack align="start" gap={1}>
            <Heading size="md" color="white">
              {title}
            </Heading>
            <Text fontSize="sm" color="whiteAlpha.700">
              {description}
            </Text>
          </VStack>

          <Box
            w="full"
            p={3}
            bg="whiteAlpha.200"
            borderRadius="lg"
          >
            <HStack>
              <Icon as={FiTrendingUp} color={colors.border} />
              <Text fontSize="sm" fontWeight="600" color={colors.border}>
                {benefit}
              </Text>
            </HStack>
          </Box>

          <VStack align="start" gap={2} w="full">
            {features.map((feature, idx) => (
              <HStack key={idx}>
                <Icon as={FiCheckCircle} color="green.400" boxSize={4} />
                <Text fontSize="sm" color="whiteAlpha.800">
                  {feature}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

interface CountryBenchmarkProps {
  country: string;
  system: string;
  flag: string;
  savings: string;
  innovation: string;
  features: string[];
  color: string;
}

const CountryBenchmark = ({ country, system, flag, savings, innovation, features, color }: CountryBenchmarkProps) => {
  // Color map for country cards
  const colorMap: Record<string, { bg: string; header: string; accent: string; border: string }> = {
    blue: { bg: '#1e3a8a', header: '#2563eb', accent: '#3b82f6', border: '#60a5fa' },
    purple: { bg: '#4c1d95', header: '#7c3aed', accent: '#8b5cf6', border: '#a78bfa' },
    green: { bg: '#14532d', header: '#16a34a', accent: '#22c55e', border: '#4ade80' },
    red: { bg: '#7f1d1d', header: '#dc2626', accent: '#ef4444', border: '#f87171' },
    teal: { bg: '#134e4a', header: '#0d9488', accent: '#14b8a6', border: '#2dd4bf' },
    cyan: { bg: '#164e63', header: '#0891b2', accent: '#06b6d4', border: '#22d3ee' },
    yellow: { bg: '#713f12', header: '#ca8a04', accent: '#eab308', border: '#facc15' },
  };
  const colors = colorMap[color] || colorMap.blue;

  return (
    <Card.Root
      bg={colors.bg}
      borderWidth="2px"
      borderColor={colors.border}
      borderRadius="2xl"
      overflow="hidden"
      transition="all 0.3s"
      _hover={{ shadow: '2xl', transform: 'scale(1.03)', borderColor: colors.accent }}
    >
      <Box
        bg={colors.header}
        p={4}
        color="white"
      >
        <HStack justify="space-between">
          <HStack>
            <Text fontSize="3xl">{flag}</Text>
            <VStack align="start" gap={0}>
              <Heading size="md">{country}</Heading>
              <Text fontSize="sm" opacity={0.9}>{system}</Text>
            </VStack>
          </HStack>
          <Icon as={FiAward} boxSize={8} opacity={0.8} />
        </HStack>
      </Box>
      <Card.Body p={5}>
        <VStack align="start" gap={4}>
          <SimpleGrid columns={2} gap={4} w="full">
            <Box p={3} bg="whiteAlpha.200" borderRadius="lg" borderWidth="1px" borderColor={colors.border}>
              <Text fontSize="xs" color="whiteAlpha.700">Ahorro</Text>
              <Text fontSize="lg" fontWeight="700" color={colors.border}>{savings}</Text>
            </Box>
            <Box p={3} bg="whiteAlpha.200" borderRadius="lg" borderWidth="1px" borderColor={colors.border}>
              <Text fontSize="xs" color="whiteAlpha.700">Innovación</Text>
              <Text fontSize="lg" fontWeight="700" color={colors.border}>{innovation}</Text>
            </Box>
          </SimpleGrid>
          <VStack align="start" gap={2} w="full">
            {features.map((feature, idx) => (
              <HStack key={idx}>
                <Box w={2} h={2} borderRadius="full" bg={colors.accent} />
                <Text fontSize="sm" color="whiteAlpha.800">
                  {feature}
                </Text>
              </HStack>
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  );
};

export const AIShowcase = () => {
  const { isDark, getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  // Problems data
  const problems = [
    { icon: FiAlertTriangle, label: 'Sistema Obsoleto', value: 'Desde 2015', color: 'red' },
    { icon: FiClock, label: 'Caídas del Sistema', value: '+10 días', color: 'orange' },
    { icon: FiDollarSign, label: 'Pérdidas Anuales', value: '$1,500M', color: 'red' },
    { icon: FiBarChart2, label: 'Ejecución Real', value: 'Solo 3.4%', color: 'orange' },
  ];

  // AI Modules
  const aiModules: AIModuleCardProps[] = [
    {
      title: 'Asistente Legal Inteligente',
      description: 'Guía paso a paso con el marco legal completo (LOSNCP, RGLOSNCP, Resoluciones SERCOP)',
      icon: FiFileText,
      status: 'active',
      color: 'blue',
      benefit: 'Reduce errores formales en 80%',
      features: [
        'Validación automática de requisitos',
        'Alertas de plazos y normativa',
        'Sugerencias de cumplimiento',
      ],
    },
    {
      title: 'Extracción de Documentos',
      description: 'OCR + IA para extraer datos de proformas, certificaciones y documentos escaneados',
      icon: FiSearch,
      status: 'active',
      color: 'purple',
      benefit: 'Automatiza 90% de entrada de datos',
      features: [
        'Reconocimiento de proformas',
        'Extracción de certificaciones',
        'Validación de RUC y datos',
      ],
    },
    {
      title: 'Análisis de Precios con IA',
      description: 'Compara precios históricos y de mercado para validar presupuestos referenciales',
      icon: FiTrendingUp,
      status: 'beta',
      color: 'green',
      benefit: 'Detecta sobreprecios antes de publicar',
      features: [
        'Históricos de contratación',
        'Análisis de mercado en tiempo real',
        'Alertas de precios anómalos',
      ],
    },
    {
      title: 'Detector de Riesgos',
      description: 'Identifica patrones sospechosos de corrupción y colusión entre oferentes',
      icon: FiShield,
      status: 'coming',
      color: 'red',
      benefit: 'Prevención proactiva de corrupción',
      features: [
        'Análisis de redes de proveedores',
        'Detección de direccionamiento',
        'Alertas de comportamiento anómalo',
      ],
    },
    {
      title: 'Generador de Pliegos',
      description: 'Crea pliegos automáticamente basados en plantillas SERCOP y mejores prácticas',
      icon: FiCode,
      status: 'coming',
      color: 'teal',
      benefit: 'Uniformidad y eficiencia en pliegos',
      features: [
        'Plantillas actualizadas SERCOP',
        'Personalización inteligente',
        'Validación de especificaciones',
      ],
    },
    {
      title: 'Chatbot de Asistencia',
      description: 'Asistente 24/7 para resolver dudas de proveedores y entidades contratantes',
      icon: FiMessageSquare,
      status: 'coming',
      color: 'cyan',
      benefit: 'Soporte continuo sin costo adicional',
      features: [
        'Respuestas basadas en normativa',
        'Guía de procedimientos',
        'Escalamiento a humanos',
      ],
    },
  ];

  // International benchmarks
  const benchmarks: CountryBenchmarkProps[] = [
    {
      country: 'Ucrania',
      system: 'ProZorro',
      flag: '🇺🇦',
      savings: '$6,000M',
      innovation: '#1 Mundial',
      color: 'blue',
      features: [
        '100% Open Data (OCDS)',
        'IA para predicción de oferentes',
        'Participación ciudadana activa',
        'Código abierto y auditable',
      ],
    },
    {
      country: 'Estonia',
      system: 'X-Road',
      flag: '🇪🇪',
      savings: '99.9% Uptime',
      innovation: 'e-Residency',
      color: 'cyan',
      features: [
        'Interoperabilidad total de sistemas',
        'Identidad digital para todos',
        'Voto electrónico desde 2005',
        'Blockchain para registros',
      ],
    },
    {
      country: 'Chile',
      system: 'ChileCompra + IA',
      flag: '🇨🇱',
      savings: '25% Eficiencia',
      innovation: 'IA Anticorrupción',
      color: 'red',
      features: [
        'IA para detección de riesgos',
        'Análisis predictivo de precios',
        'Auditoría automatizada',
        'Datos abiertos',
      ],
    },
    {
      country: 'Colombia',
      system: 'VigIA',
      flag: '🇨🇴',
      savings: '40% Menos Riesgos',
      innovation: 'IA Contratos',
      color: 'yellow',
      features: [
        'Revisión automática de contratos',
        'Detección de riesgos de corrupción',
        'Alertas tempranas',
        'Análisis de patrones',
      ],
    },
    {
      country: 'Brasil',
      system: 'ChatTCU',
      flag: '🇧🇷',
      savings: '50% Tiempo',
      innovation: 'Auditoría IA',
      color: 'green',
      features: [
        'Chatbot para auditorías',
        'Análisis automático de contratos',
        'Detección de irregularidades',
        'Asistente del Tribunal de Cuentas',
      ],
    },
    {
      country: 'Corea del Sur',
      system: 'KONEPS',
      flag: '🇰🇷',
      savings: '$8,000M/año',
      innovation: 'Smart Procurement',
      color: 'purple',
      features: [
        'Sistema único integrado',
        'Automatización completa',
        'IA para evaluación',
        'Integración Smart City',
      ],
    },
  ];

  return (
    <Box
      minH="100vh"
      bg={isDark ? '#0a0a1a' : '#1a365d'}
      overflowX="hidden"
    >
      {/* Hero Section */}
      <Box
        position="relative"
        minH="100vh"
        bgGradient={isDark
          ? 'linear(to-br, gray.900, blue.900, purple.900)'
          : 'linear(to-br, blue.600, purple.600, blue.800)'
        }
        overflow="hidden"
      >
        {/* Animated background */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.3}
          bgImage="radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                   radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)"
          css={{ animation: `${gradientAnimation} 15s ease infinite` }}
          bgSize="200% 200%"
        />

        {/* Floating elements */}
        {[...Array(6)].map((_, i) => (
          <Box
            key={i}
            position="absolute"
            w={`${40 + i * 20}px`}
            h={`${40 + i * 20}px`}
            borderRadius="full"
            bg="whiteAlpha.100"
            top={`${10 + i * 15}%`}
            left={`${5 + i * 15}%`}
            css={{
              animation: `${floatAnimation} ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}

        <Flex
          direction="column"
          align="center"
          justify="center"
          minH="100vh"
          px={8}
          py={20}
          position="relative"
          zIndex={1}
        >
          <Badge
            colorPalette="yellow"
            variant="solid"
            px={4}
            py={2}
            borderRadius="full"
            mb={6}
            fontSize="sm"
          >
            🚀 Ley de Integridad Pública - Plazo 120 días
          </Badge>

          <Heading
            size="3xl"
            color="white"
            textAlign="center"
            maxW="1000px"
            mb={6}
            fontWeight="800"
            lineHeight="1.2"
          >
            Sistema de Compras Públicas
            <Text
              as="span"
              display="block"
              bgGradient="linear(to-r, yellow.300, orange.300)"
              bgClip="text"
            >
              Potenciado con Inteligencia Artificial
            </Text>
          </Heading>

          <Text
            fontSize="xl"
            color="whiteAlpha.900"
            textAlign="center"
            maxW="700px"
            mb={10}
          >
            Transformamos la contratación pública del Ecuador con tecnología de vanguardia,
            transparencia total y las mejores prácticas de países líderes como Ucrania, Estonia y Corea del Sur.
          </Text>

          <HStack gap={4} flexWrap="wrap" justify="center">
            <Button
              size="lg"
              colorPalette="yellow"
              px={8}
              onClick={() => navigate('/cp/subasta-inversa/new')}
            >
              <Icon as={FiZap} mr={2} />
              Ver Demo
            </Button>
            <Button
              size="lg"
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              px={8}
            >
              <Icon as={FiFileText} mr={2} />
              Documentación
            </Button>
          </HStack>

          {/* Quick Stats */}
          <SimpleGrid
            columns={{ base: 2, md: 4 }}
            gap={6}
            mt={16}
            w="full"
            maxW="1200px"
          >
            {[
              { value: '8', label: 'Módulos de IA', icon: FiCpu },
              { value: '14', label: 'Tipos de Proceso', icon: FiLayers },
              { value: '100%', label: 'Datos Abiertos', icon: FiDatabase },
              { value: '24/7', label: 'Disponibilidad', icon: FiActivity },
            ].map((stat, idx) => (
              <Box
                key={idx}
                bg="whiteAlpha.200"
                backdropFilter="blur(10px)"
                borderRadius="xl"
                p={6}
                textAlign="center"
                borderWidth="1px"
                borderColor="whiteAlpha.300"
              >
                <Icon as={stat.icon} boxSize={8} color="yellow.300" mb={2} />
                <Text fontSize="3xl" fontWeight="800" color="white">
                  {stat.value}
                </Text>
                <Text color="whiteAlpha.800" fontSize="sm">
                  {stat.label}
                </Text>
              </Box>
            ))}
          </SimpleGrid>
        </Flex>

        {/* Scroll indicator */}
        <Box
          position="absolute"
          bottom={8}
          left="50%"
          transform="translateX(-50%)"
          css={{ animation: `${floatAnimation} 2s ease-in-out infinite` }}
        >
          <VStack>
            <Text color="whiteAlpha.700" fontSize="sm">Scroll para más</Text>
            <Box w={6} h={10} borderRadius="full" borderWidth={2} borderColor="whiteAlpha.500" p={1}>
              <Box
                w={2}
                h={2}
                borderRadius="full"
                bg="white"
                css={{ animation: `${floatAnimation} 1.5s ease-in-out infinite` }}
              />
            </Box>
          </VStack>
        </Box>
      </Box>

      {/* Problems Section */}
      <Box
        py={20}
        px={8}
        bg={isDark ? '#1a0a0a' : '#7f1d1d'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1a0a0a 0%, #450a0a 50%, #1a0a0a 100%)'
            : 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #7f1d1d 100%)'
        }}
      >
        <VStack maxW="1400px" mx="auto" gap={12}>
          <VStack textAlign="center" gap={4}>
            <Badge colorPalette="red" variant="solid" px={4} py={2} fontSize="sm">
              ⚠️ Diagnóstico Actual
            </Badge>
            <Heading size="2xl" color="white">
              Los Problemas del Sistema Actual
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.800" maxW="600px">
              El SOCE/SERCOP enfrenta desafíos críticos que afectan la eficiencia
              y transparencia de la contratación pública en Ecuador.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} w="full">
            {problems.map((problem, idx) => {
              const problemColors: Record<string, { bg: string; accent: string; border: string }> = {
                red: { bg: '#7f1d1d', accent: '#ef4444', border: '#f87171' },
                orange: { bg: '#7c2d12', accent: '#f97316', border: '#fb923c' },
              };
              const pColors = problemColors[problem.color] || problemColors.red;
              return (
                <Card.Root
                  key={idx}
                  bg={pColors.bg}
                  borderWidth="2px"
                  borderColor={pColors.border}
                  borderRadius="xl"
                  p={6}
                  textAlign="center"
                  transition="all 0.3s"
                  _hover={{ transform: 'scale(1.05)', shadow: '2xl' }}
                >
                  <VStack>
                    <Flex
                      w={14}
                      h={14}
                      borderRadius="full"
                      bg={pColors.accent}
                      color="white"
                      align="center"
                      justify="center"
                      shadow="lg"
                    >
                      <Icon as={problem.icon} boxSize={7} />
                    </Flex>
                    <Text fontSize="2xl" fontWeight="800" color={pColors.border}>
                      {problem.value}
                    </Text>
                    <Text fontWeight="600" color="white">
                      {problem.label}
                    </Text>
                  </VStack>
                </Card.Root>
              );
            })}
          </SimpleGrid>

          <Box
            w="full"
            p={8}
            bg="#7f1d1d"
            style={{
              background: 'linear-gradient(135deg, #7f1d1d 0%, #9a3412 100%)'
            }}
            borderRadius="2xl"
            borderLeftWidth={6}
            borderLeftColor="#f87171"
            borderWidth="2px"
            borderColor="#f87171"
          >
            <HStack align="start" gap={4}>
              <Icon as={FiAlertTriangle} boxSize={8} color="#fbbf24" />
              <VStack align="start" gap={2}>
                <Heading size="md" color="white">
                  La Ley de Integridad Pública exige modernización
                </Heading>
                <Text color="whiteAlpha.900">
                  "En un término de <strong>120 días</strong>, el Sercop deberá desarrollar todas las plataformas
                  bajo el concepto de <strong>datos abiertos</strong> y con apoyo de <strong>inteligencia artificial</strong>."
                </Text>
              </VStack>
            </HStack>
          </Box>
        </VStack>
      </Box>

      {/* AI Modules Section */}
      <Box
        py={20}
        px={8}
        bg={isDark ? '#0a0a2e' : '#1e3a5f'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0a0a2e 0%, #1e1b4b 50%, #1e0a3a 100%)'
            : 'linear-gradient(135deg, #1e3a5f 0%, #3730a3 50%, #4c1d95 100%)'
        }}
        position="relative"
        overflow="hidden"
      >
        {/* Background pattern */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          opacity={0.1}
          bgImage="radial-gradient(circle at 25% 25%, blue 2px, transparent 2px),
                   radial-gradient(circle at 75% 75%, purple 2px, transparent 2px)"
          bgSize="60px 60px"
        />
        <VStack maxW="1400px" mx="auto" gap={12} position="relative" zIndex={1}>
          <VStack textAlign="center" gap={4}>
            <Badge colorPalette="blue" variant="solid" px={4} py={2} fontSize="sm">
              🤖 Nuestra Solución
            </Badge>
            <Heading size="2xl" color="white">
              Módulos de Inteligencia Artificial
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.800" maxW="600px">
              Tecnología de vanguardia para transformar cada etapa del proceso de contratación pública.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8} w="full">
            {aiModules.map((module, idx) => (
              <AIModuleCard key={idx} {...module} />
            ))}
          </SimpleGrid>

          {/* Blockchain Section */}
          <Card.Root
            w="full"
            bg="#4c1d95"
            style={{
              background: 'linear-gradient(135deg, #4c1d95 0%, #1e40af 100%)'
            }}
            borderRadius="2xl"
            overflow="hidden"
          >
            <Card.Body p={10}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={10} alignItems="center">
                <VStack align="start" gap={4}>
                  <HStack>
                    <Icon as={FiLock} boxSize={8} color="yellow.300" />
                    <Heading size="xl" color="white">
                      Blockchain para Transparencia
                    </Heading>
                  </HStack>
                  <Text color="whiteAlpha.900" fontSize="lg">
                    Registro inmutable de cada acción en el proceso de contratación.
                    Inspirado en el modelo del Foro Económico Mundial para combatir la corrupción.
                  </Text>
                  <SimpleGrid columns={2} gap={4} w="full">
                    {[
                      { icon: FiFileText, label: 'Ofertas inalterables' },
                      { icon: FiCheckCircle, label: 'Evaluaciones trazables' },
                      { icon: FiDollarSign, label: 'Smart Contracts' },
                      { icon: FiUsers, label: 'Veedores ciudadanos' },
                    ].map((item, idx) => (
                      <HStack key={idx} color="white">
                        <Icon as={item.icon} color="yellow.300" />
                        <Text fontSize="sm">{item.label}</Text>
                      </HStack>
                    ))}
                  </SimpleGrid>
                </VStack>
                <Flex justify="center">
                  <Box
                    p={8}
                    bg="whiteAlpha.200"
                    borderRadius="2xl"
                    backdropFilter="blur(10px)"
                  >
                    <VStack gap={3}>
                      {['Oferta Presentada', 'Evaluación Técnica', 'Adjudicación', 'Contrato Firmado'].map((step, idx) => (
                        <HStack
                          key={idx}
                          w="250px"
                          p={3}
                          bg="whiteAlpha.200"
                          borderRadius="lg"
                          justify="space-between"
                        >
                          <HStack>
                            <Box w={3} h={3} borderRadius="full" bg="green.400" />
                            <Text color="white" fontSize="sm">{step}</Text>
                          </HStack>
                          <Icon as={FiCheckCircle} color="green.400" />
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </Flex>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Box>

      {/* International Benchmarks */}
      <Box
        py={20}
        px={8}
        bg={isDark ? '#1a0a2e' : '#581c87'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #1a0a2e 0%, #4c1d95 50%, #0e7490 100%)'
            : 'linear-gradient(135deg, #581c87 0%, #be185d 50%, #0891b2 100%)'
        }}
        position="relative"
      >
        {/* Globe pattern */}
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          w="800px"
          h="800px"
          borderRadius="full"
          border="2px dashed"
          borderColor={isDark ? 'whiteAlpha.100' : 'purple.100'}
          opacity={0.5}
        />
        <VStack maxW="1400px" mx="auto" gap={12} position="relative" zIndex={1}>
          <VStack textAlign="center" gap={4}>
            <Badge colorPalette="purple" variant="solid" px={4} py={2} fontSize="sm">
              🌍 Referentes Mundiales
            </Badge>
            <Heading size="2xl" color="white">
              Inspirados en los Mejores del Mundo
            </Heading>
            <Text fontSize="lg" color="whiteAlpha.800" maxW="600px">
              Nuestra solución incorpora las mejores prácticas de los sistemas de contratación
              más innovadores y exitosos a nivel mundial.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6} w="full">
            {benchmarks.map((benchmark, idx) => (
              <CountryBenchmark key={idx} {...benchmark} />
            ))}
          </SimpleGrid>

          {/* ProZorro Highlight */}
          <Card.Root
            w="full"
            bg="#1e40af"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #0e7490 100%)'
            }}
            borderWidth="2px"
            borderColor="#3b82f6"
            borderRadius="2xl"
            shadow="xl"
          >
            <Card.Body p={8}>
              <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="center">
                <VStack align="start" gap={4}>
                  <HStack>
                    <Text fontSize="4xl">🇺🇦</Text>
                    <VStack align="start" gap={0}>
                      <Heading size="lg" color="white">
                        ProZorro - El Estándar de Oro
                      </Heading>
                      <Text color="whiteAlpha.800">
                        #1 World Procurement Awards • #1 Open Government Awards
                      </Text>
                    </VStack>
                  </HStack>
                  <Text color="whiteAlpha.800">
                    Creado después de la Revolución de Maidan, ProZorro transformó completamente
                    la contratación pública de Ucrania, ahorrando más de $6,000 millones en 7 años
                    y convirtiéndose en el modelo a seguir para el mundo.
                  </Text>
                  <Button
                    variant="solid"
                    colorPalette="yellow"
                    rightIcon={<FiExternalLink />}
                    onClick={() => window.open('https://prozorro.gov.ua/en', '_blank')}
                  >
                    Conocer ProZorro
                  </Button>
                </VStack>
                <SimpleGrid columns={2} gap={4}>
                  <StatCard
                    value={6000}
                    prefix="$"
                    suffix="M"
                    label="Ahorro Total"
                    icon={FiDollarSign}
                    color="green"
                  />
                  <StatCard
                    value={100}
                    suffix="%"
                    label="Open Data"
                    icon={FiDatabase}
                    color="blue"
                  />
                </SimpleGrid>
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Box>

      {/* Results Section */}
      <Box
        py={20}
        px={8}
        bg={isDark ? '#052e16' : '#047857'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #052e16 0%, #115e59 100%)'
            : 'linear-gradient(135deg, #047857 0%, #0d9488 100%)'
        }}
      >
        <VStack maxW="1400px" mx="auto" gap={12}>
          <VStack textAlign="center" gap={4}>
            <Badge colorPalette="yellow" variant="solid" px={4} py={1}>
              Resultados Esperados
            </Badge>
            <Heading size="2xl" color="white">
              El Impacto de la Transformación
            </Heading>
          </VStack>

          <SimpleGrid columns={{ base: 2, md: 4 }} gap={8} w="full">
            <StatCard
              value={80}
              suffix="%"
              label="Reducción de Errores"
              icon={FiCheckCircle}
              color="green"
              description="Menos rechazos por errores formales"
            />
            <StatCard
              value={60}
              suffix="%"
              label="Menor Tiempo"
              icon={FiClock}
              color="blue"
              description="Procesos más rápidos y eficientes"
            />
            <StatCard
              value={25}
              suffix="%"
              label="Ahorro Presupuestal"
              icon={FiDollarSign}
              color="yellow"
              description="Mejores precios por competencia"
            />
            <StatCard
              value={100}
              suffix="%"
              label="Transparencia"
              icon={FiGlobe}
              color="purple"
              description="Todos los datos públicos"
            />
          </SimpleGrid>
        </VStack>
      </Box>

      {/* CTA Section */}
      <Box
        py={20}
        px={8}
        bg={isDark ? '#0a0a2e' : '#312e81'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0a0a2e 0%, #3730a3 50%, #4c1d95 100%)'
            : 'linear-gradient(135deg, #312e81 0%, #6d28d9 50%, #be185d 100%)'
        }}
      >
        <Card.Root
          maxW="1000px"
          mx="auto"
          bg="#2563eb"
          style={{
            background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #db2777 100%)'
          }}
          borderRadius="3xl"
          overflow="hidden"
          shadow="2xl"
        >
          <Card.Body p={12} textAlign="center">
            <VStack gap={6}>
              <Heading size="2xl" color="white">
                ¿Listo para Transformar las Compras Públicas?
              </Heading>
              <Text color="whiteAlpha.900" fontSize="lg" maxW="600px">
                Nuestro sistema cumple con los requerimientos de la Ley de Integridad Pública
                y supera los estándares internacionales.
              </Text>
              <HStack gap={4} flexWrap="wrap" justify="center">
                <Button
                  size="lg"
                  colorPalette="yellow"
                  px={10}
                  onClick={() => navigate('/cp/catalogo-electronico/new')}
                >
                  <Icon as={FiZap} mr={2} />
                  Iniciar Demo
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  color="white"
                  borderColor="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                  px={10}
                >
                  <Icon as={FiUsers} mr={2} />
                  Contactar Equipo
                </Button>
              </HStack>
            </VStack>
          </Card.Body>
        </Card.Root>
      </Box>

      {/* Footer */}
      <Box
        py={8}
        px={8}
        bg={isDark ? '#0a0a1a' : '#1e3a8a'}
        style={{
          background: isDark
            ? 'linear-gradient(135deg, #0a0a1a 0%, #1e3a5f 50%, #0a0a1a 100%)'
            : 'linear-gradient(135deg, #1e3a8a 0%, #6d28d9 50%, #1e3a8a 100%)'
        }}
      >
        <VStack>
          <Text color="white" fontSize="sm" textAlign="center" fontWeight="500">
            Sistema de Compras Públicas con IA • Basado en estándares Open Contracting Data Standard (OCDS)
          </Text>
          <HStack gap={4}>
            <Badge colorPalette="blue" variant="solid">LOSNCP</Badge>
            <Badge colorPalette="purple" variant="solid">RGLOSNCP</Badge>
            <Badge colorPalette="teal" variant="solid">SERCOP</Badge>
            <Badge colorPalette="green" variant="solid">Open Data</Badge>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default AIShowcase;
