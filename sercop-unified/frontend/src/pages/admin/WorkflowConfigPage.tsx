/**
 * WorkflowConfigPage
 * Administration page for workflow configuration.
 * Access: ROLE_MANAGER, ROLE_ADMIN
 */

import { Box, Container, HStack, VStack, Text, Badge, Icon } from '@chakra-ui/react';
import { FiCpu } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { WorkflowAdminPanel } from '../../components/workflow';

export const WorkflowConfigPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <Container maxW="container.2xl" py={6}>
      {/* Header */}
      <HStack justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Box p={2} borderRadius="lg" bg="purple.50" color="purple.600">
            <Icon as={FiCpu} fontSize="2xl" />
          </Box>
          <VStack align="start" gap={0}>
            <Text fontSize="xl" fontWeight="bold">
              {t('workflow.config.title', 'Configuracion del Workflow')}
            </Text>
            <Text fontSize="sm" color="gray.500">
              {t('workflow.config.subtitle', 'Administracion de etapas, roles, APIs y reglas del proceso de solicitudes')}
            </Text>
          </VStack>
        </HStack>
        <Badge colorPalette="purple" size="lg" px={3} py={1}>
          {t('common.admin', 'Admin')}
        </Badge>
      </HStack>

      {/* Main Content */}
      <WorkflowAdminPanel />
    </Container>
  );
};

export default WorkflowConfigPage;
