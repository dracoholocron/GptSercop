import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  Heading,
  Text,
  VStack,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { LuClock, LuMail, LuLogOut } from 'react-icons/lu';

interface PendingUser {
  username: string;
  name: string;
  provider: string;
}

export const PendingApproval = () => {
  const navigate = useNavigate();
  const [pendingUser, setPendingUser] = useState<PendingUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pendingUser');
    if (stored) {
      setPendingUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('pendingUser');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.100" p={4}>
      <Card.Root w="full" maxW="md" p={6}>
        <VStack gap={4}>
          <Flex
            w={16}
            h={16}
            bg="yellow.100"
            borderRadius="full"
            align="center"
            justify="center"
          >
            <Icon as={LuClock} boxSize={8} color="yellow.600" />
          </Flex>
          
          <Heading size="lg" textAlign="center">
            Cuenta Pendiente de Aprobación
          </Heading>
          
          <Text textAlign="center" color="gray.600">
            Tu cuenta ha sido creada exitosamente, pero requiere aprobación de un 
            administrador antes de que puedas acceder al sistema.
          </Text>
          
          {pendingUser && (
            <Box bg="gray.50" p={4} borderRadius="lg" w="full">
              <VStack align="start" gap={2}>
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Usuario:</Text> {pendingUser.username}
                </Text>
                {pendingUser.name && (
                  <Text fontSize="sm">
                    <Text as="span" fontWeight="medium">Nombre:</Text> {pendingUser.name}
                  </Text>
                )}
                <Text fontSize="sm">
                  <Text as="span" fontWeight="medium">Proveedor:</Text> {pendingUser.provider}
                </Text>
              </VStack>
            </Box>
          )}

          <Flex bg="blue.50" p={4} borderRadius="lg" w="full" gap={3} align="start">
            <Icon as={LuMail} boxSize={5} color="blue.600" mt={0.5} />
            <Text fontSize="sm" color="blue.800">
              Recibirás una notificación por correo electrónico cuando tu cuenta sea aprobada.
            </Text>
          </Flex>

          <Button 
            variant="outline" 
            w="full" 
            onClick={handleLogout}
          >
            <Icon as={LuLogOut} boxSize={4} mr={2} />
            Volver al Login
          </Button>
        </VStack>
      </Card.Root>
    </Flex>
  );
};

export default PendingApproval;
