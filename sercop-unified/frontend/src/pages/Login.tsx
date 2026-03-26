import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  Separator,
  Link,
  HStack,
  Icon,
  Flex,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { notify } from '../components/ui/toaster';
import { GlobalCMXLogo } from '../components/dashboard/GlobalCMXLogo';
import { IdentityProviderSelector } from '../components/auth/IdentityProviderSelector';
import {
  LuKeyRound,
  LuMail,
  LuShield,
  LuCheck,
  LuSparkles,
  LuLock,
  LuKey,
  LuCloud,
  LuGlobe,
  LuZap,
  LuUsers,
  LuEye,
  LuFileText,
  LuBrain,
  LuArrowRight,
} from 'react-icons/lu';
import { FaGoogle, FaAws, FaMicrosoft, FaJava, FaReact, FaDocker } from 'react-icons/fa';
import { SiSpringboot, SiKubernetes, SiApachekafka, SiPostgresql, SiTypescript, SiRabbitmq, SiRedis } from 'react-icons/si';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'sso' | 'credentials' | 'passwordless'>('credentials');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const { login, logout, isAuthenticated, hasRole } = useAuth();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      // Redirect based on user role
      if (hasRole('ROLE_CLIENT')) {
        navigate('/client/dashboard');
      } else {
        navigate('/business-intelligence');
      }
    }
  }, [isAuthenticated, navigate, hasRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        // Navigation will be handled by useEffect when isAuthenticated becomes true
        // The useEffect will check roles and redirect appropriately
      } else {
        // Usar clave de traducción si existe, o el mensaje directo como fallback
        const errorMessage = result.reasonKey
          ? t(result.reasonKey, result.message)
          : (result.message || t('auth.invalidCredentials'));

        notify.error(t('auth.authenticationFailed'), errorMessage);
      }
    } catch (error) {
      notify.error(t('common.error'), t('common.errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setMagicLinkSent(true);
      notify.success(t('login.linkSent'), t('login.checkEmail'));
    } catch (error) {
      setMagicLinkSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  const cardBg = darkMode ? colors.cardBg : 'white';
  const inputBg = darkMode ? 'gray.700' : 'gray.50';

  // Platform badges
  const platforms = [
    { name: 'AWS', icon: FaAws, color: '#FF9900' },
    { name: 'Azure', icon: FaMicrosoft, color: '#0078D4' },
    { name: 'GCP', icon: LuCloud, color: '#4285F4' },
    { name: 'Kubernetes', icon: SiKubernetes, color: '#326CE5' },
    { name: 'Docker', icon: FaDocker, color: '#2496ED' },
  ];

  // Technology stack
  const technologies = [
    { name: 'Java 21', icon: FaJava, color: '#ED8B00' },
    { name: 'Spring Boot', icon: SiSpringboot, color: '#6DB33F' },
    { name: 'React', icon: FaReact, color: '#61DAFB' },
    { name: 'TypeScript', icon: SiTypescript, color: '#3178C6' },
    { name: 'PostgreSQL', icon: SiPostgresql, color: '#4169E1' },
  ];

  // Message buses supported
  const messageBuses = [
    { name: 'Kafka', icon: SiApachekafka, color: '#231F20' },
    { name: 'RabbitMQ', icon: SiRabbitmq, color: '#FF6600' },
    { name: 'ActiveMQ', icon: LuMail, color: '#D22128' },
    { name: 'Redis', icon: SiRedis, color: '#DC382D' },
  ];

  // SSO Provider badges with icons
  const SSOProviderBadges = () => {
    const providers = [
      { name: 'Auth0', color: '#eb5424', bg: '#fef2f0', icon: LuLock },
      { name: 'Azure AD', color: '#0078d4', bg: '#f0f7ff', icon: FaMicrosoft },
      { name: 'Okta', color: '#007dc1', bg: '#f0f8ff', icon: LuKey },
      { name: 'Google', color: '#4285f4', bg: '#f0f4ff', icon: FaGoogle },
      { name: 'AWS Cognito', color: '#ff9900', bg: '#fff8f0', icon: FaAws },
    ];

    return (
      <Box
        w="100%"
        py={3}
        px={3}
        bg="linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(241,245,249,1) 100%)"
        borderRadius="lg"
        border="1px solid"
        borderColor="gray.200"
      >
        <VStack gap={2}>
          <HStack gap={2}>
            <Icon as={LuSparkles} color="blue.500" boxSize={3} />
            <Text fontSize="xs" fontWeight="semibold" color="gray.600">
              {t('login.ssoTagline')}
            </Text>
          </HStack>
          <Flex gap={1.5} flexWrap="wrap" justify="center">
            {providers.map((provider) => (
              <HStack
                key={provider.name}
                gap={1}
                bg={provider.bg}
                px={2}
                py={1}
                borderRadius="full"
                border="1px solid"
                borderColor={provider.color + '30'}
                _hover={{ transform: 'scale(1.05)' }}
                transition="all 0.2s"
                cursor="default"
              >
                <Icon as={provider.icon} color={provider.color} boxSize={3} />
                <Text fontSize="2xs" fontWeight="bold" color={provider.color}>
                  {provider.name}
                </Text>
              </HStack>
            ))}
          </Flex>
        </VStack>
      </Box>
    );
  };

  const renderLoginMethod = () => {
    switch (loginMethod) {
      case 'credentials':
        return (
          <VStack gap={4} w="100%">
            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <Stack gap={4}>
                <Box>
                  <Text mb={2} fontWeight="medium" color={colors.textColor} fontSize="sm">
                    {t('login.usernameOrEmail')}
                  </Text>
                  <Input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    bg={inputBg}
                    border="1px solid"
                    borderColor="gray.200"
                    size="lg"
                    required
                    disabled={isLoading}
                    placeholder={t('login.emailPlaceholder')}
                    color={colors.textColor}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium" color={colors.textColor} fontSize="sm">
                    {t('login.password')}
                  </Text>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg={inputBg}
                    border="1px solid"
                    borderColor="gray.200"
                    size="lg"
                    required
                    disabled={isLoading}
                    placeholder={t('login.passwordPlaceholder')}
                    color={colors.textColor}
                    _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                  />
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  bg="linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
                  color="white"
                  fontWeight="bold"
                  _hover={{ transform: 'translateY(-2px)', boxShadow: 'xl', opacity: 0.9 }}
                  transition="all 0.2s"
                  loading={isLoading}
                  w="full"
                >
                  <Icon as={LuKeyRound} mr={2} />
                  {t('login.loginButton')}
                </Button>
              </Stack>
            </form>
          </VStack>
        );

      case 'passwordless':
        return (
          <VStack gap={4} w="100%">
            {!magicLinkSent ? (
              <form onSubmit={handleMagicLink} style={{ width: '100%' }}>
                <Stack gap={4}>
                  <Box>
                    <Text mb={2} fontWeight="medium" color={colors.textColor} fontSize="sm">
                      {t('login.email')}
                    </Text>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      bg={inputBg}
                      border="1px solid"
                      borderColor="gray.200"
                      size="lg"
                      required
                      disabled={isLoading}
                      placeholder={t('login.emailPlaceholder')}
                      color={colors.textColor}
                      _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                    />
                  </Box>
                  <Button
                    type="submit"
                    size="lg"
                    colorScheme="blue"
                    loading={isLoading}
                    w="full"
                  >
                    <Icon as={LuMail} mr={2} />
                    {t('login.sendAccessLink')}
                  </Button>
                </Stack>
              </form>
            ) : (
              <VStack gap={4}>
                <Box
                  w={16} h={16}
                  bg="green.100"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={LuCheck} boxSize={8} color="green.600" />
                </Box>
                <Text textAlign="center" color={colors.textColor} fontWeight="medium">
                  {t('login.linkSent')}
                </Text>
                <Text textAlign="center" color={colors.textColorSecondary} fontSize="sm">
                  {t('login.checkEmail')} <strong>{email}</strong>
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setMagicLinkSent(false); setEmail(''); }}
                >
                  {t('login.useAnotherEmail')}
                </Button>
              </VStack>
            )}
          </VStack>
        );

      default: // 'sso'
        return (
          <VStack gap={4} w="100%">
            <Box w="100%">
              <IdentityProviderSelector
                onLocalAuthSelected={() => setLoginMethod('credentials')}
                isLoading={isLoading}
                hideLocalAuth={false}
              />
            </Box>
            <SSOProviderBadges />
          </VStack>
        );
    }
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      bg="linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)"
      position="relative"
      overflow="hidden"
      _before={{
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 50% 100%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
      }}
      _after={{
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }}
    >
      <Flex w="100%" minH="100vh" direction={{ base: 'column', lg: 'row' }}>
        {/* Left Panel - Branding & Info */}
        <Box
          flex={{ base: 'none', lg: '1' }}
          display="flex"
          flexDirection="column"
          justifyContent="center"
          p={{ base: 6, md: 12 }}
          position="relative"
          zIndex={10}
        >
          <VStack align="flex-start" gap={8} maxW="500px">
            {/* Logo & Title */}
            <VStack align="flex-start" gap={4}>
              <HStack gap={4}>
                <Box
                  p={2}
                  borderRadius="xl"
                  bg="linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                >
                  <GlobalCMXLogo size={50} isDark={true} animated={true} />
                </Box>
                <VStack align="flex-start" gap={0}>
                  <Heading color="white" size="xl" fontWeight="bold">
                    GlobalCX
                  </Heading>
                  <Text color="whiteAlpha.700" fontSize="sm">
                    Trade Finance Platform
                  </Text>
                </VStack>
              </HStack>
            </VStack>

            {/* Tagline */}
            <VStack align="flex-start" gap={3}>
              <Heading color="white" size="lg" fontWeight="medium" lineHeight="1.3">
                {t('login.heroTitle', 'Enterprise-grade trade finance solutions')}
              </Heading>
              <Text color="whiteAlpha.700" fontSize="md" lineHeight="1.6">
                {t('login.heroSubtitle', 'Secure, scalable, and compliant platform for Letters of Credit, Guarantees, and Documentary Collections.')}
              </Text>
            </VStack>

            {/* Features */}
            <VStack align="flex-start" gap={3} w="100%">
              {[
                { icon: LuCheck, text: t('login.feature1', 'Multi-cloud deployment ready') },
                { icon: LuShield, text: t('login.feature2', 'Enterprise SSO & Security') },
                { icon: LuGlobe, text: t('login.feature3', 'SWIFT MT/MX compliant') },
                { icon: LuZap, text: t('login.feature4', 'Real-time processing') },
              ].map((feature, idx) => (
                <HStack key={idx} gap={3}>
                  <Icon as={feature.icon} color="green.400" boxSize={5} />
                  <Text color="whiteAlpha.900" fontSize="sm">{feature.text}</Text>
                </HStack>
              ))}
            </VStack>

            {/* Compact Tech & Security Stack */}
            <Box w="100%">
              {/* Mini badges row - Platforms */}
              <Flex gap={1.5} flexWrap="wrap" mb={3}>
                {platforms.map((platform) => (
                  <Box
                    key={platform.name}
                    p={1.5}
                    borderRadius="md"
                    bg="whiteAlpha.100"
                    _hover={{ bg: 'whiteAlpha.200', transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                    title={platform.name}
                  >
                    <Icon as={platform.icon} color={platform.color} boxSize={4} />
                  </Box>
                ))}
                <Box w="1px" bg="whiteAlpha.300" mx={1} />
                {technologies.slice(0, 3).map((tech) => (
                  <Box
                    key={tech.name}
                    p={1.5}
                    borderRadius="md"
                    bg="whiteAlpha.50"
                    _hover={{ bg: 'whiteAlpha.100', transform: 'scale(1.1)' }}
                    transition="all 0.2s"
                    title={tech.name}
                  >
                    <Icon as={tech.icon} color={tech.color} boxSize={4} />
                  </Box>
                ))}
              </Flex>

              {/* Security Framework - Compact Interactive */}
              <Box
                w="100%"
                p={4}
                borderRadius="xl"
                bg="linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.12) 100%)"
                border="1px solid"
                borderColor="whiteAlpha.200"
                position="relative"
                overflow="hidden"
              >
                {/* Animated top border */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  height="2px"
                  bgGradient="linear(to-r, blue.400, purple.400, pink.400)"
                  backgroundSize="200% 100%"
                  sx={{
                    animation: 'shimmer 2s ease infinite',
                    '@keyframes shimmer': {
                      '0%': { backgroundPosition: '200% 0' },
                      '100%': { backgroundPosition: '-200% 0' },
                    },
                  }}
                />

                {/* Header with badge */}
                <HStack justify="space-between" mb={3}>
                  <HStack gap={2}>
                    <Box p={1} borderRadius="md" bgGradient="linear(to-br, blue.400, purple.500)">
                      <Icon as={LuShield} color="white" boxSize={3.5} />
                    </Box>
                    <Text color="white" fontWeight="bold" fontSize="xs">
                      {t('login.headline', 'Adaptive Security')}
                    </Text>
                  </HStack>
                  <Box px={2} py={0.5} borderRadius="full" bg="green.500" fontSize="2xs" color="white" fontWeight="bold">
                    NEW
                  </Box>
                </HStack>

                {/* Interactive Feature Pills */}
                {(() => {
                  const features = [
                    {
                      icon: LuKey,
                      name: 'MFA',
                      color: '#A855F7',
                      title: 'Autenticación Multi-Factor Adaptativa',
                      benefit: '¿Cómo protege tu banco?',
                      explanation: 'Cuando un usuario inicia sesión desde un lugar o dispositivo inusual, el sistema automáticamente solicita una verificación adicional. Esto evita que hackers accedan a cuentas aunque tengan la contraseña.',
                      example: 'Ejemplo: Si normalmente accedes desde México y alguien intenta entrar desde otro país, se bloqueará hasta verificar tu identidad.'
                    },
                    {
                      icon: LuEye,
                      name: '4-Eyes',
                      color: '#F97316',
                      title: 'Principio de 4 Ojos',
                      benefit: '¿Por qué dos personas aprueban?',
                      explanation: 'Ninguna persona puede aprobar sola operaciones críticas. Quien crea una LC no puede aprobarla - debe hacerlo otra persona. Esto elimina fraudes internos y errores costosos.',
                      example: 'Ejemplo: Juan crea una LC por $1M → María debe revisarla y aprobarla. Ni Juan ni María pueden actuar solos.'
                    },
                    {
                      icon: LuBrain,
                      name: 'Riesgo',
                      color: '#22D3EE',
                      title: 'Motor de Riesgo Basado en Reglas',
                      benefit: '¿Cómo evalúa cada operación?',
                      explanation: 'Aplica reglas configurables que suman puntos según factores de riesgo: IP desconocida, horario inusual, dispositivo nuevo, velocidad de operaciones y montos. Si el puntaje supera umbrales definidos, solicita verificación adicional o bloquea.',
                      example: 'Ejemplo: IP nueva (+20) + fin de semana (+10) + monto alto (+20) = 50 pts → Permitido. Si llegara a 55+ → Pide MFA adicional.'
                    },
                    {
                      icon: LuFileText,
                      name: 'Audit',
                      color: '#22C55E',
                      title: 'Auditoría Inmutable',
                      benefit: '¿Para qué sirve el registro?',
                      explanation: 'Cada acción queda grabada permanentemente y no puede ser alterada. Cumple con regulaciones bancarias y permite investigar cualquier incidente con evidencia irrefutable.',
                      example: 'Ejemplo: Ante una auditoría del regulador, puedes demostrar exactamente quién hizo qué, cuándo y desde dónde.'
                    },
                    {
                      icon: LuMail,
                      name: 'Email',
                      color: '#3B82F6',
                      title: 'Notificaciones Garantizadas',
                      benefit: '¿Por qué múltiples proveedores?',
                      explanation: 'Los correos críticos (aprobaciones, alertas, vencimientos) se envían por múltiples canales. Si uno falla, otro toma el relevo automáticamente. Nunca pierdas una notificación importante.',
                      example: 'Ejemplo: Si SendGrid tiene problemas, el sistema automáticamente usa AWS SES sin que notes la diferencia.'
                    },
                    {
                      icon: LuUsers,
                      name: 'AuthZ',
                      color: '#EC4899',
                      title: 'Control de Acceso Inteligente',
                      benefit: '¿Cómo funciona?',
                      explanation: 'Combina roles, atributos y políticas para dar acceso preciso. Un usuario solo ve y hace lo que su rol permite, ni más ni menos. Políticas como código permiten auditar y versionar reglas.',
                      example: 'Ejemplo: Un analista puede ver LCs de su sucursal, pero un gerente regional ve todas las de su zona.'
                    },
                  ];

                  return (
                    <>
                      <Flex gap={2} flexWrap="wrap" mb={2}>
                        {features.map((item) => (
                          <Box
                            key={item.name}
                            onClick={() => setSelectedFeature(selectedFeature === item.name ? null : item.name)}
                            px={2.5}
                            py={1.5}
                            borderRadius="lg"
                            bg={selectedFeature === item.name ? item.color : 'whiteAlpha.100'}
                            border="1px solid"
                            borderColor={selectedFeature === item.name ? item.color : 'whiteAlpha.200'}
                            cursor="pointer"
                            _hover={{
                              bg: item.color,
                              borderColor: item.color,
                              transform: 'translateY(-2px)',
                              boxShadow: `0 6px 16px ${item.color}40`,
                            }}
                            transition="all 0.2s ease"
                          >
                            <HStack gap={1.5}>
                              <Icon as={item.icon} color={selectedFeature === item.name ? 'white' : item.color} boxSize={3.5} />
                              <Text color="white" fontSize="xs" fontWeight="semibold">
                                {item.name}
                              </Text>
                            </HStack>
                          </Box>
                        ))}
                      </Flex>

                      {/* Feature Explanation Panel */}
                      {selectedFeature && (() => {
                        const feature = features.find(f => f.name === selectedFeature);
                        if (!feature) return null;
                        return (
                          <Box
                            mt={2}
                            p={3}
                            borderRadius="lg"
                            bg={`${feature.color}15`}
                            border="1px solid"
                            borderColor={`${feature.color}40`}
                            position="relative"
                            sx={{
                              animation: 'slideIn 0.3s ease',
                              '@keyframes slideIn': {
                                '0%': { opacity: 0, transform: 'translateY(-10px)' },
                                '100%': { opacity: 1, transform: 'translateY(0)' },
                              },
                            }}
                          >
                            {/* Close button */}
                            <Box
                              position="absolute"
                              top={2}
                              right={2}
                              cursor="pointer"
                              opacity={0.6}
                              _hover={{ opacity: 1 }}
                              onClick={() => setSelectedFeature(null)}
                            >
                              <Text color="white" fontSize="xs">✕</Text>
                            </Box>

                            <VStack align="start" gap={2}>
                              <HStack gap={2}>
                                <Icon as={feature.icon} color={feature.color} boxSize={4} />
                                <Text color="white" fontWeight="bold" fontSize="sm">
                                  {feature.title}
                                </Text>
                              </HStack>

                              <Text color={feature.color} fontWeight="semibold" fontSize="xs">
                                {feature.benefit}
                              </Text>

                              <Text color="whiteAlpha.900" fontSize="xs" lineHeight="1.5">
                                {feature.explanation}
                              </Text>

                              <Box
                                w="100%"
                                p={2}
                                borderRadius="md"
                                bg="whiteAlpha.100"
                                borderLeft="3px solid"
                                borderLeftColor={feature.color}
                              >
                                <Text color="whiteAlpha.800" fontSize="2xs" fontStyle="italic">
                                  {feature.example}
                                </Text>
                              </Box>
                            </VStack>
                          </Box>
                        );
                      })()}
                    </>
                  );
                })()}

                {/* Compact Stats */}
                <Flex justify="space-between" pt={2} borderTop="1px solid" borderColor="whiteAlpha.100">
                  {[
                    { value: '99.9%', label: 'SLA' },
                    { value: 'SOC2', label: 'Cert' },
                    { value: '256bit', label: 'AES' },
                    { value: '24/7', label: 'Mon' },
                  ].map((stat, idx) => (
                    <VStack key={idx} gap={0}>
                      <Text color="blue.300" fontSize="xs" fontWeight="bold">{stat.value}</Text>
                      <Text color="whiteAlpha.500" fontSize="2xs">{stat.label}</Text>
                    </VStack>
                  ))}
                </Flex>
              </Box>
            </Box>
          </VStack>
        </Box>

        {/* Right Panel - Login Card */}
        <Box
          flex={{ base: 'none', lg: '1' }}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ base: 4, md: 8 }}
          position="relative"
          zIndex={10}
        >
          <Box
            bg={cardBg}
            borderRadius="2xl"
            boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            p={{ base: 6, md: 8 }}
            w="100%"
            maxW="440px"
            border="1px solid"
            borderColor="whiteAlpha.100"
          >
            <VStack gap={6}>
              {/* Card Header */}
              <VStack gap={2} w="100%">
                <Heading size="lg" color={colors.textColor} textAlign="center">
                  {t('login.welcomeBack', 'Welcome back')}
                </Heading>
                <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                  {t('login.signInToContinue', 'Sign in to continue to your account')}
                </Text>
              </VStack>

              {/* Login Method Tabs */}
              <HStack w="100%" gap={0} p={1} bg={darkMode ? 'gray.700' : 'gray.100'} borderRadius="xl">
                <Button
                  flex={1}
                  size="md"
                  h="50px"
                  variant="ghost"
                  bg={loginMethod === 'sso' ? 'white' : 'transparent'}
                  color={loginMethod === 'sso' ? 'blue.600' : 'gray.500'}
                  boxShadow={loginMethod === 'sso' ? 'sm' : 'none'}
                  borderRadius="lg"
                  onClick={() => setLoginMethod('sso')}
                  _hover={{ bg: loginMethod === 'sso' ? 'white' : 'gray.200' }}
                >
                  <VStack gap={0.5}>
                    <Icon as={LuShield} boxSize={4} />
                    <Text fontSize="2xs">{t('login.methodEnterprise')}</Text>
                  </VStack>
                </Button>
                <Button
                  flex={1}
                  size="md"
                  h="50px"
                  variant="ghost"
                  bg={loginMethod === 'credentials' ? 'white' : 'transparent'}
                  color={loginMethod === 'credentials' ? 'blue.600' : 'gray.500'}
                  boxShadow={loginMethod === 'credentials' ? 'sm' : 'none'}
                  borderRadius="lg"
                  onClick={() => setLoginMethod('credentials')}
                  _hover={{ bg: loginMethod === 'credentials' ? 'white' : 'gray.200' }}
                >
                  <VStack gap={0.5}>
                    <Icon as={LuKeyRound} boxSize={4} />
                    <Text fontSize="2xs">{t('login.methodPassword')}</Text>
                  </VStack>
                </Button>
                <Button
                  flex={1}
                  size="md"
                  h="50px"
                  variant="ghost"
                  bg={loginMethod === 'passwordless' ? 'white' : 'transparent'}
                  color={loginMethod === 'passwordless' ? 'blue.600' : 'gray.500'}
                  boxShadow={loginMethod === 'passwordless' ? 'sm' : 'none'}
                  borderRadius="lg"
                  onClick={() => setLoginMethod('passwordless')}
                  _hover={{ bg: loginMethod === 'passwordless' ? 'white' : 'gray.200' }}
                >
                  <VStack gap={0.5}>
                    <Icon as={LuMail} boxSize={4} />
                    <Text fontSize="2xs">{t('login.methodPasswordless')}</Text>
                  </VStack>
                </Button>
              </HStack>

              {/* Login Content */}
              <Box w="100%" minH="200px">
                {renderLoginMethod()}
              </Box>

              {/* Forgot Password */}
              {loginMethod === 'credentials' && (
                <Link
                  fontSize="sm"
                  color="blue.500"
                  onClick={() => navigate('/forgot-password')}
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                >
                  {t('login.forgotPassword')}
                </Link>
              )}

              <Separator />

              {/* Sign Up */}
              <HStack w="100%" justify="center" gap={1}>
                <Text fontSize="sm" color={colors.textColorSecondary}>
                  {t('login.firstTime')}
                </Text>
                <Link
                  fontSize="sm"
                  color="blue.500"
                  fontWeight="semibold"
                  onClick={() => navigate('/register')}
                  cursor="pointer"
                  _hover={{ textDecoration: 'underline' }}
                >
                  {t('login.requestAccess')}
                </Link>
              </HStack>

              <Text fontSize="xs" color={colors.textColorSecondary} textAlign="center">
                v1.0.0 • Powered by YacareTech
              </Text>
            </VStack>
          </Box>
        </Box>
      </Flex>
    </Box>
  );
};
