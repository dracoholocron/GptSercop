import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Text,
  Heading,
  Button,
  Input,
  Alert,
  Spinner,
  Badge,
  IconButton,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  Checkbox,
  Flex,
  Separator,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
} from '@chakra-ui/react';
import {
  LuShieldCheck,
  LuSmartphone,
  LuMail,
  LuKey,
  LuFingerprint,
  LuBell,
  LuTrash2,
  LuPlus,
  LuCheck,
  LuX,
  LuRefreshCw,
  LuCircleAlert,
} from 'react-icons/lu';
import type {
  MfaStatusResponse,
  MfaEnrollmentResponse,
  MfaMethod,
  EnrolledMethod,
  AvailableMethod,
} from '../services/mfaService';
import mfaService, { generateDeviceFingerprint } from '../services/mfaService';

const MFA_METHOD_ICONS: Record<MfaMethod, React.ReactNode> = {
  totp: <LuKey size={24} />,
  sms: <LuSmartphone size={24} />,
  email: <LuMail size={24} />,
  webauthn: <LuFingerprint size={24} />,
  push: <LuBell size={24} />,
};

interface EnrollmentDialogState {
  open: boolean;
  method: MfaMethod | null;
  step: 'setup' | 'verify';
  enrollmentData: MfaEnrollmentResponse | null;
}

const MfaSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<MfaStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Enrollment dialog state
  const [enrollDialog, setEnrollDialog] = useState<EnrollmentDialogState>({
    open: false,
    method: null,
    step: 'setup',
    enrollmentData: null,
  });

  // Form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [backupEmail, setBackupEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Load MFA status
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mfaService.getMfaStatus();
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar estado MFA');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Start enrollment for a method
  const handleStartEnrollment = (method: MfaMethod) => {
    setPhoneNumber('');
    setBackupEmail('');
    setVerificationCode('');
    setEnrollDialog({
      open: true,
      method,
      step: 'setup',
      enrollmentData: null,
    });
  };

  // Submit enrollment request
  const handleEnroll = async () => {
    if (!enrollDialog.method) return;

    setSubmitting(true);
    setError(null);

    try {
      const request: { method: MfaMethod; phoneNumber?: string; backupEmail?: string } = {
        method: enrollDialog.method,
      };

      if (enrollDialog.method === 'sms') {
        request.phoneNumber = phoneNumber;
      } else if (enrollDialog.method === 'email') {
        request.backupEmail = backupEmail;
      }

      const response = await mfaService.enrollMfa(request);

      setEnrollDialog(prev => ({
        ...prev,
        step: 'verify',
        enrollmentData: response,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar inscripción');
    } finally {
      setSubmitting(false);
    }
  };

  // Verify code and complete enrollment
  const handleVerify = async () => {
    if (!enrollDialog.method) return;

    setSubmitting(true);
    setError(null);

    try {
      const deviceFingerprint = await generateDeviceFingerprint();

      const response = await mfaService.verifyMfa({
        method: enrollDialog.method,
        code: verificationCode,
        trustDevice,
        deviceFingerprint,
        deviceName: deviceName || `Mi ${navigator.platform}`,
      });

      if (response.success) {
        setSuccess('Método MFA configurado correctamente');
        setEnrollDialog({ open: false, method: null, step: 'setup', enrollmentData: null });
        loadStatus();
      } else {
        setError(response.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar código');
    } finally {
      setSubmitting(false);
    }
  };

  // Remove enrollment
  const handleRemoveEnrollment = async (method: MfaMethod) => {
    if (!window.confirm(`¿Estás seguro de eliminar este método de autenticación?`)) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await mfaService.removeMfaEnrollment(method);
      setSuccess('Método MFA eliminado correctamente');
      loadStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar método');
    } finally {
      setSubmitting(false);
    }
  };

  // Close dialogs
  const handleCloseEnrollDialog = () => {
    setEnrollDialog({ open: false, method: null, step: 'setup', enrollmentData: null });
    setVerificationCode('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Heading size="lg" mb={6} display="flex" alignItems="center" gap={2}>
        <LuShieldCheck />
        Autenticación de Múltiples Factores (MFA)
      </Heading>

      {error && (
        <Alert.Root status="error" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{error}</Alert.Title>
          </Alert.Content>
          <IconButton
            aria-label="Cerrar"
            size="sm"
            variant="ghost"
            onClick={() => setError(null)}
          >
            <LuX />
          </IconButton>
        </Alert.Root>
      )}

      {success && (
        <Alert.Root status="success" mb={4}>
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Title>{success}</Alert.Title>
          </Alert.Content>
          <IconButton
            aria-label="Cerrar"
            size="sm"
            variant="ghost"
            onClick={() => setSuccess(null)}
          >
            <LuX />
          </IconButton>
        </Alert.Root>
      )}

      {/* MFA Status Card */}
      <Card.Root mb={6}>
        <Card.Header>
          <Flex justifyContent="space-between" alignItems="center">
            <Heading size="md">Estado de MFA</Heading>
            <IconButton
              aria-label="Actualizar"
              size="sm"
              variant="ghost"
              onClick={loadStatus}
              disabled={loading}
            >
              <LuRefreshCw />
            </IconButton>
          </Flex>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box>
              <HStack mb={2}>
                <Text fontSize="sm" color="gray.500">MFA Habilitado:</Text>
                <Badge colorPalette={status?.mfaEnabled ? 'green' : 'gray'}>
                  {status?.mfaEnabled ? 'Sí' : 'No'}
                </Badge>
              </HStack>
              <HStack mb={2}>
                <Text fontSize="sm" color="gray.500">MFA Obligatorio:</Text>
                <Badge colorPalette={status?.mfaEnforced ? 'orange' : 'gray'}>
                  {status?.mfaEnforced ? 'Sí' : 'No'}
                </Badge>
              </HStack>
            </Box>
            <Box>
              <HStack mb={2}>
                <Text fontSize="sm" color="gray.500">Dispositivos de Confianza:</Text>
                <Badge>{status?.trustedDevicesCount || 0}</Badge>
              </HStack>
              <HStack mb={2}>
                <Text fontSize="sm" color="gray.500">Códigos de Recuperación:</Text>
                <Badge>{status?.recoveryCodesRemaining || 0}</Badge>
              </HStack>
            </Box>
          </SimpleGrid>

          {status?.gracePeriodUntil && (
            <Alert.Root status="warning" mt={4}>
              <Alert.Indicator>
                <LuCircleAlert />
              </Alert.Indicator>
              <Alert.Content>
                <Alert.Title>
                  Tienes un período de gracia hasta {new Date(status.gracePeriodUntil).toLocaleDateString()}.
                  Configura MFA antes de esa fecha.
                </Alert.Title>
              </Alert.Content>
            </Alert.Root>
          )}
        </Card.Body>
      </Card.Root>

      {/* Enrolled Methods */}
      <Card.Root mb={6}>
        <Card.Header>
          <Heading size="md">Métodos Configurados</Heading>
        </Card.Header>
        <Card.Body>
          {status?.enrolledMethods && status.enrolledMethods.length > 0 ? (
            <VStack align="stretch" gap={3}>
              {status.enrolledMethods.map((method: EnrolledMethod) => (
                <Flex
                  key={method.enrollmentId}
                  p={3}
                  borderWidth={1}
                  borderRadius="md"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <HStack gap={3}>
                    <Box color="blue.500">
                      {MFA_METHOD_ICONS[method.method as MfaMethod]}
                    </Box>
                    <Box>
                      <HStack gap={2}>
                        <Text fontWeight="medium">{method.displayName}</Text>
                        {method.isPrimary && (
                          <Badge colorPalette="blue" size="sm">Principal</Badge>
                        )}
                        {method.verified ? (
                          <Badge colorPalette="green" size="sm">
                            <LuCheck size={12} style={{ marginRight: 4 }} />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge colorPalette="orange" size="sm">
                            <LuX size={12} style={{ marginRight: 4 }} />
                            Pendiente
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="sm" color="gray.500">
                        {method.maskedIdentifier && `${method.maskedIdentifier} • `}
                        Configurado: {new Date(method.enrolledAt).toLocaleDateString()}
                        {method.lastUsedAt && ` • Último uso: ${new Date(method.lastUsedAt).toLocaleDateString()}`}
                      </Text>
                    </Box>
                  </HStack>
                  <IconButton
                    aria-label="Eliminar"
                    colorPalette="red"
                    variant="ghost"
                    onClick={() => handleRemoveEnrollment(method.method as MfaMethod)}
                    disabled={submitting}
                  >
                    <LuTrash2 />
                  </IconButton>
                </Flex>
              ))}
            </VStack>
          ) : (
            <Text color="gray.500" py={4}>
              No tienes métodos MFA configurados
            </Text>
          )}
        </Card.Body>
      </Card.Root>

      {/* Available Methods */}
      <Card.Root>
        <Card.Header>
          <Heading size="md">Agregar Método de Autenticación</Heading>
        </Card.Header>
        <Card.Body>
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={4}>
            {status?.availableMethods?.map((method: AvailableMethod) => (
              <Card.Root key={method.method} variant="outline">
                <Card.Body>
                  <HStack gap={2} mb={2}>
                    <Box color="blue.500">
                      {MFA_METHOD_ICONS[method.method as MfaMethod]}
                    </Box>
                    <Text fontWeight="medium">{method.displayName}</Text>
                  </HStack>
                  <Text fontSize="sm" color="gray.500" mb={3}>
                    {method.description}
                  </Text>
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={() => handleStartEnrollment(method.method as MfaMethod)}
                    disabled={submitting}
                  >
                    <LuPlus style={{ marginRight: 4 }} />
                    Configurar
                  </Button>
                </Card.Body>
              </Card.Root>
            ))}
          </SimpleGrid>
        </Card.Body>
      </Card.Root>

      {/* Enrollment Dialog */}
      <DialogRoot open={enrollDialog.open} onOpenChange={(e) => !e.open && handleCloseEnrollDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {enrollDialog.step === 'setup' ? 'Configurar' : 'Verificar'}{' '}
              {enrollDialog.method && status?.availableMethods?.find(m => m.method === enrollDialog.method)?.displayName}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            {enrollDialog.step === 'setup' && (
              <VStack gap={4} align="stretch">
                {enrollDialog.method === 'totp' && (
                  <Text>
                    Al continuar, se generará un código QR que deberás escanear con tu aplicación de autenticación
                    (Google Authenticator, Authy, Microsoft Authenticator, etc.)
                  </Text>
                )}
                {enrollDialog.method === 'sms' && (
                  <Box>
                    <Text mb={2} fontWeight="medium">Número de Teléfono</Text>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+593 999 932 376"
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Ingresa tu número con código de país
                    </Text>
                  </Box>
                )}
                {enrollDialog.method === 'email' && (
                  <Box>
                    <Text mb={2} fontWeight="medium">Correo Electrónico de Respaldo</Text>
                    <Input
                      type="email"
                      value={backupEmail}
                      onChange={(e) => setBackupEmail(e.target.value)}
                      placeholder="tu@correo.com"
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Este correo se usará para enviar códigos de verificación
                    </Text>
                  </Box>
                )}
              </VStack>
            )}

            {enrollDialog.step === 'verify' && enrollDialog.enrollmentData && (
              <VStack gap={4} align="stretch">
                {/* TOTP QR Code */}
                {enrollDialog.method === 'totp' && enrollDialog.enrollmentData.qrCodeBase64 && (
                  <Box textAlign="center">
                    <Text mb={2}>Escanea este código QR con tu aplicación de autenticación:</Text>
                    <Box
                      as="img"
                      src={`data:image/png;base64,${enrollDialog.enrollmentData.qrCodeBase64}`}
                      alt="QR Code"
                      maxW="200px"
                      mx="auto"
                      my={4}
                    />
                    {enrollDialog.enrollmentData.manualEntryKey && (
                      <Text fontSize="sm" color="gray.500">
                        O ingresa manualmente: <code>{enrollDialog.enrollmentData.manualEntryKey}</code>
                      </Text>
                    )}
                  </Box>
                )}

                {/* Verification message */}
                {enrollDialog.enrollmentData.message && (
                  <Alert.Root status="info">
                    <Alert.Indicator />
                    <Alert.Content>
                      <Alert.Title>{enrollDialog.enrollmentData.message}</Alert.Title>
                    </Alert.Content>
                  </Alert.Root>
                )}

                {/* Verification code input */}
                <Box>
                  <Text mb={2} fontWeight="medium">Código de Verificación</Text>
                  <Input
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    textAlign="center"
                    fontSize="2xl"
                    letterSpacing="0.5em"
                  />
                </Box>

                <Separator />

                {/* Trust device option */}
                <Checkbox
                  checked={trustDevice}
                  onCheckedChange={(e) => setTrustDevice(!!e.checked)}
                >
                  Confiar en este dispositivo (no pedir MFA por 30 días)
                </Checkbox>

                {trustDevice && (
                  <Box>
                    <Text mb={2} fontSize="sm">Nombre del Dispositivo (opcional)</Text>
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      placeholder="Mi computadora de trabajo"
                      size="sm"
                    />
                  </Box>
                )}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCloseEnrollDialog}>
              Cancelar
            </Button>
            {enrollDialog.step === 'setup' ? (
              <Button
                colorPalette="blue"
                onClick={handleEnroll}
                disabled={
                  submitting ||
                  (enrollDialog.method === 'sms' && !phoneNumber) ||
                  (enrollDialog.method === 'email' && !backupEmail)
                }
              >
                {submitting ? <Spinner size="sm" /> : 'Continuar'}
              </Button>
            ) : (
              <Button
                colorPalette="blue"
                onClick={handleVerify}
                disabled={submitting || verificationCode.length !== 6}
              >
                {submitting ? <Spinner size="sm" /> : 'Verificar'}
              </Button>
            )}
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default MfaSettings;
