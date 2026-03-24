import { useState } from 'react';
import { Box, Heading, Text, VStack, FormControl, FormLabel, Input, Button, useToast, Container } from '@chakra-ui/react';
import { apiClient } from '../../utils/apiClient';
import { LuSend } from 'react-icons/lu';

export const InfimaCuantiaPage = () => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await apiClient('/v1/tenders/infima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, estimatedAmount: Number(amount) })
      });
      if (res.ok) {
        toast({ title: 'Publicado con éxito', description: 'El proceso está disponible en la red pública.', status: 'success', duration: 4000, isClosable: true });
        setTitle(''); setAmount('');
      } else {
        toast({ title: 'Error de validación', description: 'Por favor, revise el monto o los topes PAC anuales.', status: 'warning', duration: 4000, isClosable: true });
      }
    } catch(err) {
      toast({ title: 'Error de conexión', description: 'El servicio Fastify IA no está respondiendo.', status: 'error', duration: 4000, isClosable: true });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack align="stretch" gap={8}>
        <Box>
          <Heading size="lg" mb={2} color="blue.700">Publicación Rápida: Ínfima Cuantía</Heading>
          <Text color="gray.600" fontSize="md">
            Módulo simplificado para la adquisición de bienes o servicios de cuantía menor, exento del uso complejo de pliegos y comisiones técnicas.
          </Text>
        </Box>
        
        <Box as="form" onSubmit={handlePublish} bg="white" p={8} borderRadius="2xl" boxShadow="lg" borderWidth="1px" borderColor="gray.100">
          <VStack gap={5}>
            <FormControl isRequired>
              <FormLabel fontWeight="600" color="gray.700">Objeto de Contratación (Concepto de Factura)</FormLabel>
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="Ej. Adquisición de teclados y mouses para laboratorios" 
                size="lg" 
                focusBorderColor="blue.500" 
                bg="gray.50"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel fontWeight="600" color="gray.700">Monto Estimado (USD, sin IVA)</FormLabel>
              <Input 
                type="number" 
                step="0.01" 
                value={amount} 
                onChange={e => setAmount(e.target.value)} 
                placeholder="Ej. 1250.50" 
                size="lg" 
                focusBorderColor="blue.500" 
                bg="gray.50"
              />
            </FormControl>

            <FormControl>
              <FormLabel fontWeight="600" color="gray.700">Archivo Adjunto Opcional (TDR u Oficio)</FormLabel>
              <Input type="file" p={1.5} size="lg" bg="gray.50" />
            </FormControl>

            <Button 
              type="submit" 
              colorScheme="blue" 
              size="lg" 
              w="full" 
              isLoading={isLoading} 
              mt={6} 
              height="60px" 
              fontSize="lg"
              leftIcon={<LuSend />}
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
              transition="all 0.2s"
            >
              Publicar Proceso de Compra
            </Button>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default InfimaCuantiaPage;
