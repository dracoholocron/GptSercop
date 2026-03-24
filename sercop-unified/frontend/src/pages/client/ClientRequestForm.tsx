/**
 * ClientRequestForm - Módulo de Trade Finance (LC, Garantías, Cobranzas)
 * NOTA: Esta funcionalidad fue desactivada en el proyecto SERCOP Unificado.
 * La plataforma ahora se enfoca en Compras Públicas / Contratación Pública.
 */

import { Box, Text, VStack, Button, Center, Heading } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { LuAlertTriangle } from 'react-icons/lu';
import { Icon } from '@chakra-ui/react';

export const ClientRequestForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box p={8} minH="400px">
      <Center h="60vh">
        <VStack gap={4} textAlign="center">
          <Icon as={LuAlertTriangle} boxSize={12} color="orange.400" />
          <Heading size="md" color="gray.700">Módulo No Disponible</Heading>
          <Text color="gray.500" maxW="400px">
            Este módulo de Trade Finance (Cartas de Crédito, Garantías, Cobranzas) 
            no forma parte del sistema SERCOP de Compras Públicas.
          </Text>
          <Button colorScheme="blue" onClick={() => navigate('/')}>
            Ir al Inicio
          </Button>
        </VStack>
      </Center>
    </Box>
  );
};

export default ClientRequestForm;
