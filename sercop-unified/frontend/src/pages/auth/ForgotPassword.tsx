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
} from '@chakra-ui/react';
import { LuMail, LuArrowLeft, LuCheck } from 'react-icons/lu';
import { useTheme } from '../../contexts/ThemeContext';
import { notify } from '../../components/ui/toaster';
import { GlobalCMXLogo } from '../../components/dashboard/GlobalCMXLogo';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const navigate = useNavigate();
  const { darkMode, getColors } = useTheme();
  const colors = getColors();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Implement actual password reset API call
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        // Still show success to prevent email enumeration
        setIsSubmitted(true);
      }
    } catch (error) {
      // Still show success to prevent email enumeration
      setIsSubmitted(true);
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
                    ¿Olvidaste tu contraseña?
                  </Heading>
                  <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                    Ingresa tu correo electrónico y te enviaremos instrucciones para restablecer tu contraseña.
                  </Text>
                </VStack>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                  <VStack gap={4}>
                    <Box w="100%">
                      <Text mb={2} fontWeight="medium" color={colors.textColor}>
                        Correo electrónico
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
                        placeholder="tu@email.com"
                        color={colors.textColor}
                        _focus={{
                          borderColor: 'blue.500',
                          boxShadow: '0 0 0 1px blue.500',
                        }}
                      />
                    </Box>

                    <Button
                      type="submit"
                      size="lg"
                      colorScheme="blue"
                      w="full"
                      loading={isLoading}
                      _hover={{
                        transform: 'translateY(-2px)',
                        boxShadow: 'lg',
                      }}
                      transition="all 0.2s"
                    >
                      <Icon as={LuMail} mr={2} />
                      Enviar instrucciones
                    </Button>
                  </VStack>
                </form>
              </>
            ) : (
              <>
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
                    Revisa tu correo
                  </Heading>
                  <Text fontSize="sm" color={colors.textColorSecondary} textAlign="center">
                    Si existe una cuenta asociada a <strong>{email}</strong>, recibirás un correo con instrucciones para restablecer tu contraseña.
                  </Text>
                </VStack>

                <Button
                  variant="outline"
                  w="full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setEmail('');
                  }}
                >
                  Enviar a otro correo
                </Button>
              </>
            )}

            <Link
              fontSize="sm"
              color="blue.500"
              onClick={() => navigate('/login')}
              cursor="pointer"
              display="flex"
              alignItems="center"
              _hover={{ textDecoration: 'underline' }}
            >
              <Icon as={LuArrowLeft} mr={1} />
              Volver al inicio de sesión
            </Link>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
};

export default ForgotPassword;
