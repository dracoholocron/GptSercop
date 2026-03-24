import { Box, Heading, Text, VStack, Card, Button, HStack, Input } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';

export const ClientDocuments = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>
              {t('clientPortal.documents.title', 'My Documents')}
            </Heading>
            <Text color="gray.600">
              {t('clientPortal.documents.subtitle', 'Access and manage your trade finance documents')}
            </Text>
          </Box>
          <Button colorScheme="blue">
            <FiUpload style={{ marginRight: 8 }} />
            {t('clientPortal.documents.upload', 'Upload Document')}
          </Button>
        </HStack>

        <Card.Root>
          <Card.Body>
            <HStack gap={4} mb={4}>
              <Input
                placeholder={t('common.search', 'Search documents...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                maxW="300px"
              />
            </HStack>

            <Text color="gray.500" textAlign="center" py={8}>
              {t('clientPortal.documents.noDocuments', 'No documents found')}
            </Text>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default ClientDocuments;
