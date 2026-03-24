/**
 * SecurityAuditPage
 * Main page for viewing security audit logs, alerts, and critical events
 * Supports compliance requirements: SOX, PCI-DSS, GDPR, Basel III
 */
import { Box, Container } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { SecurityAuditPanel } from '../../components/admin/SecurityAuditPanel';

export default function SecurityAuditPage() {
  const { t } = useTranslation();

  return (
    <Container maxW="container.2xl" py={6}>
      <Box>
        <SecurityAuditPanel autoRefresh={true} refreshInterval={30000} />
      </Box>
    </Container>
  );
}
