import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Text,
  VStack,
  Icon,
  Link,
  HStack,
  Separator,
} from '@chakra-ui/react';
import { LuUserPlus, LuArrowLeft, LuCheck, LuMail, LuUser, LuLock } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { notify } from '../../components/ui/toaster';
import { GlobalCMXLogo } from '../../components/dashboard/GlobalCMXLogo';
import { IdentityProviderSelector } from '../../components/auth/IdentityProviderSelector';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showLocalForm, setShowLocalForm] = useState(false);
  const navigate = useNavigate();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      notify.error('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 8) {
      notify.error('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          username: formData.username,
          password: formData.password,
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        const error = await response.json();
        notify.error('Error', error.message || 'No se pudo crear la cuenta');
      }
    } catch (error) {
      notify.error('Error', 'Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = '#FFB800';
  const cardBg = darkMode ? colors.cardBg : 'white';
  const inputBg = darkMode ? 'gray.700' : 'gray.50';

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
      position="relative"
      py={8}
      _before={{
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    >
      <Container maxW="md" position="relative" zIndex={10}>
        <Box
          bg={cardBg}
          borderRadius="2xl"
          boxShadow="2xl"
          p={8}
          backdropFilter="blur(10px)"
        >
          <VStack gap={6}>
            {/* Logo */}
            <Box
              p={2}
              borderRadius="2xl"
              bg="linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%)"
              boxShadow="0 8px 32px rgba(0, 0, 0, 0.2)"
            >
              <GlobalCMXLogo size={60} isDark={true} animated={false} />
            </Box>

            {!isSubmitted ? (
              <>
                <VStack gap={2}>
                  <Heading size="lg" color={colors.textColor}>
                    Crear una cuenta
                  </Heading>
                  <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                    {showLocalForm 
                      ? 'Completa el formulario para crear tu cuenta'
                      : 'Elige cómo quieres registrarte'}
                  </Text>
                </VStack>

                {!showLocalForm ? (
                  <>
                    {/* SSO Registration Options */}
                    <Box w="100%">
                      <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center" mb={4}>
                        Regístrate con tu cuenta empresarial
                      </Text>
                      <IdentityProviderSelector
                        onLocalAuthSelected={() => setShowLocalForm(true)}
                        isLoading={isLoading}
                        hideLocalAuth={true}
                      />
                    </Box>

                    <Separator />

                    <Button
                      variant="outline"
                      w="full"
                      size="lg"
                      onClick={() => setShowLocalForm(true)}
                    >
                      <Icon as={LuMail} mr={2} />
                      Registrarse con correo electrónico
                    </Button>
                  </>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                      <VStack gap={4}>
                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" color={colors.textColor}>
                            Nombre completo
                          </Text>
                          <Input
                            name="name"
                            type="text"
                            value={formData.name}
                            onChange={handleChange}
                            bg={inputBg}
                            border="1px solid"
                            borderColor="gray.200"
                            size="lg"
                            required
                            disabled={isLoading}
                            placeholder="Tu nombre"
                            color={colors.textColor}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          />
                        </Box>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" color={colors.textColor}>
                            Correo electrónico
                          </Text>
                          <Input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            bg={inputBg}
                            border="1px solid"
                            borderColor="gray.200"
                            size="lg"
                            required
                            disabled={isLoading}
                            placeholder="tu@email.com"
                            color={colors.textColor}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          />
                        </Box>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" color={colors.textColor}>
                            Nombre de usuario
                          </Text>
                          <Input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            bg={inputBg}
                            border="1px solid"
                            borderColor="gray.200"
                            size="lg"
                            required
                            disabled={isLoading}
                            placeholder="usuario123"
                            color={colors.textColor}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          />
                        </Box>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" color={colors.textColor}>
                            Contraseña
                          </Text>
                          <Input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            bg={inputBg}
                            border="1px solid"
                            borderColor="gray.200"
                            size="lg"
                            required
                            disabled={isLoading}
                            placeholder="Mínimo 8 caracteres"
                            color={colors.textColor}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          />
                        </Box>

                        <Box w="100%">
                          <Text mb={2} fontWeight="medium" color={colors.textColor}>
                            Confirmar contraseña
                          </Text>
                          <Input
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            bg={inputBg}
                            border="1px solid"
                            borderColor="gray.200"
                            size="lg"
                            required
                            disabled={isLoading}
                            placeholder="Repite tu contraseña"
                            color={colors.textColor}
                            _focus={{ borderColor: 'blue.500', boxShadow: '0 0 0 1px blue.500' }}
                          />
                        </Box>

                        <Button
                          type="submit"
                          size="lg"
                          colorScheme="blue"
                          w="full"
                          loading={isLoading}
                          _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                          transition="all 0.2s"
                        >
                          <Icon as={LuUserPlus} mr={2} />
                          Crear cuenta
                        </Button>
                      </VStack>
                    </form>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLocalForm(false)}
                      color={colors.textColorSecondary}
                    >
                      <Icon as={LuArrowLeft} mr={2} />
                      Volver a opciones de registro
                    </Button>
                  </>
                )}
              </>
            ) : (
              <>
                {/* Success State */}
                <Box
                  w={16}
                  h={16}
                  bg="green.100"
                  borderRadius="full"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Icon as={LuCheck} boxSize={8} color="green.600" />
                </Box>

                <VStack gap={2}>
                  <Heading size="lg" color={colors.textColor}>
                    ¡Cuenta creada!
                  </Heading>
                  <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                    Tu solicitud ha sido enviada. Un administrador revisará tu cuenta y recibirás una notificación cuando sea aprobada.
                  </Text>
                </VStack>

                <Box bg="blue.50" p={4} borderRadius="lg" w="100%">
                  <Text fontSize="sm" color="blue.800" textAlign="center">
                    Revisa tu correo electrónico para más información.
                  </Text>
                </Box>

                <Button
                  colorScheme="blue"
                  w="full"
                  onClick={() => navigate('/login')}
                >
                  Ir al inicio de sesión
                </Button>
              </>
            )}

            <HStack gap={1}>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                ¿Ya tienes una cuenta?
              </Text>
              <Link
                fontSize="sm"
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate('/login')}
                cursor="pointer"
                _hover={{ textDecoration: 'underline' }}
              >
                Inicia sesión
              </Link>
            </HStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default Register;
