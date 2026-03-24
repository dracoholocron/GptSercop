import {
  Box,
  VStack,
  Text,
  Flex,
  Button,
  HStack,
  Badge,
  Spinner,
  Progress,
  Card,
  SimpleGrid,
  IconButton,
  Textarea,
  Input,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogBackdrop,
  Collapsible,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertTriangle, FiChevronDown, FiChevronRight, FiEdit2, FiRefreshCw } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { featureCertificationService, type FeatureCertification, type CertificationStatus, type CertificationStats, type FeatureCertificationUpdateRequest } from '../services/featureCertificationService';
import { notify } from '../components/ui/toaster';

const STATUS_KEYS: Record<CertificationStatus, { color: string; icon: React.ReactNode; i18nKey: string }> = {
  NOT_TESTED: { color: 'gray', icon: <FiClock />, i18nKey: 'featureCertification.notTested' },
  IN_PROGRESS: { color: 'blue', icon: <FiRefreshCw />, i18nKey: 'featureCertification.inProgress' },
  CERTIFIED: { color: 'green', icon: <FiCheckCircle />, i18nKey: 'featureCertification.certified' },
  FAILED: { color: 'red', icon: <FiXCircle />, i18nKey: 'featureCertification.failed' },
  BLOCKED: { color: 'orange', icon: <FiAlertTriangle />, i18nKey: 'featureCertification.blocked' },
};

interface FeatureRowProps {
  feature: FeatureCertification;
  level: number;
  onEdit: (feature: FeatureCertification) => void;
  colors: any;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ feature, level, onEdit, colors }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = feature.children && feature.children.length > 0;
  const statusConfig = STATUS_KEYS[feature.status];

  return (
    <Box>
      <Flex
        py={2}
        px={4}
        pl={`${level * 24 + 16}px`}
        alignItems="center"
        borderBottom="1px solid"
        borderColor={colors.borderColor}
        bg={level === 0 ? colors.cardBg : 'transparent'}
        _hover={{ bg: colors.hoverBg }}
        cursor="pointer"
      >
        {hasChildren && (
          <IconButton
            aria-label="Toggle"
            size="xs"
            variant="ghost"
            onClick={() => setIsOpen(!isOpen)}
            mr={2}
          >
            {isOpen ? <FiChevronDown /> : <FiChevronRight />}
          </IconButton>
        )}
        {!hasChildren && <Box w="24px" mr={2} />}

        <Box flex="1">
          <Text fontWeight={level === 0 ? 'bold' : 'normal'} color={colors.textColor}>
            {feature.featureName}
          </Text>
          {feature.featureNameEn && (
            <Text fontSize="xs" color={colors.textColorSecondary}>
              {feature.featureNameEn}
            </Text>
          )}
        </Box>

        <HStack gap={2}>
          <Badge colorPalette={statusConfig.color} variant="subtle" display="flex" alignItems="center" gap={1}>
            {statusConfig.icon}
            {t(statusConfig.i18nKey)}
          </Badge>

          {feature.testedBy && (
            <Text fontSize="xs" color={colors.textColorSecondary}>
              {t('featureCertification.testedBy')}: {feature.testedBy}
            </Text>
          )}

          {feature.certifiedBy && feature.status === 'CERTIFIED' && (
            <Text fontSize="xs" color="green.500">
              {t('featureCertification.certifiedBy')}: {feature.certifiedBy}
            </Text>
          )}

          <IconButton
            aria-label="Edit"
            size="xs"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(feature);
            }}
          >
            <FiEdit2 />
          </IconButton>
        </HStack>
      </Flex>

      {hasChildren && isOpen && (
        <Box>
          {feature.children!.map((child) => (
            <FeatureRow
              key={child.featureCode}
              feature={child}
              level={level + 1}
              onEdit={onEdit}
              colors={colors}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export const FeatureCertificationPage = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [features, setFeatures] = useState<FeatureCertification[]>([]);
  const [stats, setStats] = useState<CertificationStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState<FeatureCertification | null>(null);
  const [editForm, setEditForm] = useState<FeatureCertificationUpdateRequest>({
    status: 'NOT_TESTED',
    notes: '',
    testEvidenceUrl: '',
    blockerReason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [featuresData, statsData] = await Promise.all([
        featureCertificationService.getAllHierarchical(),
        featureCertificationService.getStats(),
      ]);
      setFeatures(featuresData);
      setStats(statsData);
    } catch (error) {
      notify.error('Error', t('featureCertification.loadError'));
      console.error('Error loading certification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (feature: FeatureCertification) => {
    setEditingFeature(feature);
    setEditForm({
      status: feature.status,
      notes: feature.notes || '',
      testEvidenceUrl: feature.testEvidenceUrl || '',
      blockerReason: feature.blockerReason || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingFeature) return;

    try {
      setSaving(true);
      await featureCertificationService.updateStatus(editingFeature.featureCode, editForm);
      notify.success(t('featureCertification.save'), t('featureCertification.saveSuccess'));
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      notify.error('Error', t('featureCertification.saveError'));
      console.error('Error saving certification:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" />
      </Flex>
    );
  }

  return (
    <Box p={6} bg={colors.bgColor} minH="100vh">
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <Box>
            <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>
              {t('featureCertification.title')}
            </Text>
            <Text color={colors.textColorSecondary}>
              {t('featureCertification.subtitle')}
            </Text>
          </Box>
          <Button onClick={loadData} variant="outline">
            <FiRefreshCw style={{ marginRight: 8 }} />
            {t('featureCertification.refresh')}
          </Button>
        </Flex>

        {/* Stats Cards */}
        {stats && (
          <SimpleGrid columns={{ base: 2, md: 3, lg: 6 }} gap={4}>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color={colors.textColorSecondary}>{t('featureCertification.total')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color={colors.textColor}>{stats.total}</Text>
            </Card.Root>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color="gray.500">{t('featureCertification.notTested')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="gray.500">{stats.notTested}</Text>
            </Card.Root>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color="blue.500">{t('featureCertification.inProgress')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.inProgress}</Text>
            </Card.Root>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color="green.500">{t('featureCertification.certified')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.certified}</Text>
            </Card.Root>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color="red.500">{t('featureCertification.failed')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="red.500">{stats.failed}</Text>
            </Card.Root>
            <Card.Root p={4} bg={colors.cardBg}>
              <Text fontSize="sm" color="orange.500">{t('featureCertification.blocked')}</Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">{stats.blocked}</Text>
            </Card.Root>
          </SimpleGrid>
        )}

        {/* Progress Bar */}
        {stats && (
          <Box bg={colors.cardBg} p={4} borderRadius="md" borderWidth="1px" borderColor={colors.borderColor}>
            <Flex justify="space-between" mb={2}>
              <Text fontWeight="medium" color={colors.textColor}>{t('featureCertification.certificationProgress')}</Text>
              <Text fontWeight="bold" color="green.500">{stats.certifiedPercentage}%</Text>
            </Flex>
            <Progress.Root value={stats.certifiedPercentage}>
              <Progress.Track>
                <Progress.Range bg="green.500" />
              </Progress.Track>
            </Progress.Root>
          </Box>
        )}

        {/* Features List */}
        <Box
          bg={colors.cardBg}
          borderRadius="md"
          borderWidth="1px"
          borderColor={colors.borderColor}
          overflow="hidden"
        >
          <Box p={4} borderBottom="1px solid" borderColor={colors.borderColor}>
            <Text fontWeight="bold" color={colors.textColor}>{t('featureCertification.features')}</Text>
          </Box>
          <Box>
            {features.map((feature) => (
              <FeatureRow
                key={feature.featureCode}
                feature={feature}
                level={0}
                onEdit={handleEdit}
                colors={colors}
              />
            ))}
          </Box>
        </Box>
      </VStack>

      {/* Edit Modal */}
      <DialogRoot open={isEditModalOpen} onOpenChange={(e) => setIsEditModalOpen(e.open)} size="md">
        <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" />
        <DialogContent
          bg={colors.cardBg}
          borderRadius="xl"
          shadow="xl"
          css={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 9999,
            overflowY: 'auto',
          }}
          width={{ base: '95vw', md: '500px' }}
          maxH="90vh"
        >
          <DialogHeader>
            <DialogTitle color={colors.textColor}>{t('featureCertification.editTitle')}</DialogTitle>
            <DialogCloseTrigger />
          </DialogHeader>
          <DialogBody>
            {editingFeature && (
              <VStack gap={4} align="stretch">
                <Box>
                  <Text fontWeight="bold" color={colors.textColor}>{editingFeature.featureName}</Text>
                  {editingFeature.featureNameEn && (
                    <Text fontSize="sm" color={colors.textColorSecondary}>{editingFeature.featureNameEn}</Text>
                  )}
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">{t('featureCertification.status')}</Text>
                  <HStack gap={2} flexWrap="wrap">
                    {Object.entries(STATUS_KEYS).map(([status, config]) => (
                      <Button
                        key={status}
                        size="sm"
                        variant={editForm.status === status ? 'solid' : 'outline'}
                        colorPalette={config.color}
                        onClick={() => setEditForm({ ...editForm, status: status as CertificationStatus })}
                      >
                        {config.icon}
                        <Text ml={1}>{t(config.i18nKey)}</Text>
                      </Button>
                    ))}
                  </HStack>
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">{t('featureCertification.notes')}</Text>
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder={t('featureCertification.notesPlaceholder')}
                    rows={3}
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="medium">{t('featureCertification.evidenceUrl')}</Text>
                  <Input
                    value={editForm.testEvidenceUrl}
                    onChange={(e) => setEditForm({ ...editForm, testEvidenceUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </Box>

                {editForm.status === 'BLOCKED' && (
                  <Box>
                    <Text mb={2} fontWeight="medium">{t('featureCertification.blockerReason')}</Text>
                    <Textarea
                      value={editForm.blockerReason}
                      onChange={(e) => setEditForm({ ...editForm, blockerReason: e.target.value })}
                      placeholder={t('featureCertification.blockerReasonPlaceholder')}
                      rows={2}
                    />
                  </Box>
                )}
              </VStack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              {t('featureCertification.cancel')}
            </Button>
            <Button colorPalette="blue" onClick={handleSave} loading={saving}>
              {t('featureCertification.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </Box>
  );
};

export default FeatureCertificationPage;
