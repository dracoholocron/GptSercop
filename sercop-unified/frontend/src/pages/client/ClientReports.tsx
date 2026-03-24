import { Box, Heading, Text, VStack, Card, SimpleGrid, Button, Icon, HStack } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { FiBarChart2, FiFileText, FiTrendingUp, FiCalendar, FiDownload } from 'react-icons/fi';

const reportTypes = [
  {
    id: 'operations_summary',
    icon: FiBarChart2,
    titleKey: 'clientPortal.reports.operationsSummary',
    descKey: 'clientPortal.reports.operationsSummaryDesc',
  },
  {
    id: 'monthly_statement',
    icon: FiCalendar,
    titleKey: 'clientPortal.reports.monthlyStatement',
    descKey: 'clientPortal.reports.monthlyStatementDesc',
  },
  {
    id: 'commissions',
    icon: FiTrendingUp,
    titleKey: 'clientPortal.reports.commissions',
    descKey: 'clientPortal.reports.commissionsDesc',
  },
  {
    id: 'documents_list',
    icon: FiFileText,
    titleKey: 'clientPortal.reports.documentsList',
    descKey: 'clientPortal.reports.documentsListDesc',
  },
];

export const ClientReports = () => {
  const { t } = useTranslation();

  const handleGenerateReport = (reportId: string) => {
    console.log('Generate report:', reportId);
  };

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        <Box>
          <Heading size="lg" mb={2}>
            {t('clientPortal.reports.title', 'Reports')}
          </Heading>
          <Text color="gray.600">
            {t('clientPortal.reports.subtitle', 'Generate and download reports for your operations')}
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {reportTypes.map((report) => (
            <Card.Root key={report.id}>
              <Card.Body>
                <HStack gap={4}>
                  <Box p={3} borderRadius="lg" bg="blue.50">
                    <Icon as={report.icon} boxSize={6} color="blue.500" />
                  </Box>
                  <VStack align="start" gap={1} flex={1}>
                    <Heading size="sm">
                      {t(report.titleKey, report.titleKey.split('.').pop())}
                    </Heading>
                    <Text color="gray.600" fontSize="sm">
                      {t(report.descKey, 'Report description')}
                    </Text>
                  </VStack>
                  <Button size="sm" variant="outline" onClick={() => handleGenerateReport(report.id)}>
                    <FiDownload style={{ marginRight: 4 }} />
                    {t('common.generate', 'Generate')}
                  </Button>
                </HStack>
              </Card.Body>
            </Card.Root>
          ))}
        </SimpleGrid>
      </VStack>
    </Box>
  );
};

export default ClientReports;
