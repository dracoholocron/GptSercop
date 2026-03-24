import { Box, Heading, Text, VStack, Card, SimpleGrid, Button, Icon, HStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FiFileText, FiShield, FiPackage, FiCreditCard } from 'react-icons/fi';

const requestTypes = [
  {
    id: 'lc_import',
    icon: FiFileText,
    titleKey: 'clientPortal.newRequest.lcImport',
    descKey: 'clientPortal.newRequest.lcImportDesc',
    color: 'blue.500',
  },
  {
    id: 'lc_export',
    icon: FiPackage,
    titleKey: 'clientPortal.newRequest.lcExport',
    descKey: 'clientPortal.newRequest.lcExportDesc',
    color: 'green.500',
  },
  {
    id: 'guarantee',
    icon: FiShield,
    titleKey: 'clientPortal.newRequest.guarantee',
    descKey: 'clientPortal.newRequest.guaranteeDesc',
    color: 'purple.500',
  },
  {
    id: 'collection',
    icon: FiCreditCard,
    titleKey: 'clientPortal.newRequest.collection',
    descKey: 'clientPortal.newRequest.collectionDesc',
    color: 'orange.500',
  },
];

export const ClientNewRequest = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelectType = (typeId: string) => {
    navigate(`/client/requests/new/${typeId}`);
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('clientPortal.newRequest.title', 'New Request')}
          </Heading>
          <Text color="gray.600">
            {t('clientPortal.newRequest.subtitle', 'Select the type of operation you want to request')}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {requestTypes.map((type) => (
            <Card.Root
              key={type.id}
              cursor="pointer"
              _hover={{ shadow: 'lg', borderColor: type.color }}
              transition="all 0.2s"
              onClick={() => handleSelectType(type.id)}
            >
              <Card.Body>
                <HStack gap={4}>
                  <Box p={4} borderRadius="lg" bg={`${type.color}20`}>
                    <Icon as={type.icon} boxSize={8} color={type.color} />
                  </Box>
                  <VStack align="start" gap={1}>
                    <Heading size="md">
                      {t(type.titleKey, type.titleKey.split('.').pop())}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {t(type.descKey, 'Request description')}
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ClientNewRequest;
