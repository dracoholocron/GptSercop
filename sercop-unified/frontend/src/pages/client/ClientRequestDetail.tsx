/**
 * ClientRequestDetail - View a single client request with dynamic fields
 * Uses custom fields configuration to display data in wizard-style layout
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Card,
  Button,
  Badge,
  Spinner,
  Center,
  SimpleGrid,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiEdit,
  FiSend,
  FiX,
  FiClock,
  FiUser,
  FiFileText,
  FiInfo,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiDollarSign,
  FiList,
  FiShield,
  FiCheck,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiEye,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import clientPortalService from '../../services/clientPortalService';
import type { ClientRequest, DocumentInfo } from '../../services/clientPortalService';
import { useCustomFields } from '../../hooks/useCustomFields';
import type { CustomDataRow, CustomFieldStepDTO, CustomFieldSectionDTO } from '../../services/customFieldsService';
import { toaster } from '../../components/ui/toaster';
import { useTheme } from '../../contexts/ThemeContext';
import { openDocumentWithAuth } from '../../utils/documentUtils';

// Icon mapping
const iconMap: Record<string, IconType> = {
  FiInfo,
  FiUser,
  FiTruck,
  FiPackage,
  FiUpload,
  FiCheckCircle,
  FiFileText,
  FiDollarSign,
  FiList,
  FiShield,
};

const statusColors: Record<string, string> = {
  DRAFT: 'gray',
  SUBMITTED: 'blue',
  IN_REVIEW: 'orange',
  PENDING_DOCUMENTS: 'yellow',
  APPROVED: 'green',
  REJECTED: 'red',
  CANCELLED: 'gray',
};

// Map backend product type to custom fields product type
const customFieldsProductTypeMap: Record<string, string> = {
  LC_IMPORT_REQUEST: 'CLIENT_LC_IMPORT_REQUEST',
  LC_EXPORT_REQUEST: 'CLIENT_LC_EXPORT_REQUEST',
  GUARANTEE_REQUEST: 'CLIENT_GUARANTEE_REQUEST',
  COLLECTION_REQUEST: 'CLIENT_COLLECTION_REQUEST',
};

export const ClientRequestDetail = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getColors, isDark } = useTheme();
  const colors = getColors();

  const [request, setRequest] = useState<ClientRequest | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Get custom fields product type based on request
  const customFieldsProductType = request?.productType
    ? customFieldsProductTypeMap[request.productType] || ''
    : '';

  // Use custom fields hook to get configuration
  const {
    configuration,
    isLoading: configLoading,
  } = useCustomFields({
    productType: customFieldsProductType,
    mode: 'VIEW',
    autoLoad: !!customFieldsProductType,
  });

  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        // Load request and documents in parallel
        const [requestData, docsData] = await Promise.all([
          clientPortalService.getRequest(id),
          clientPortalService.getRequestDocuments(id),
        ]);
        setRequest(requestData);
        setDocuments(docsData);
      } catch (error) {
        console.error('Error loading request:', error);
        toaster.error({
          title: t('common.error', 'Error'),
          description: t('clientPortal.requestDetail.loadError', 'Failed to load request'),
        });
      } finally {
        setLoading(false);
      }
    };
    loadRequest();
  }, [id, t]);

  // Filter steps to show (exclude review step)
  const viewSteps = useMemo(() => {
    if (!configuration) return [];
    return configuration.steps
      .filter((step) => !step.stepCode.includes('REVIEW'))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [configuration]);

  // Current step data
  const currentStepData = viewSteps[currentStep];

  const handleSubmit = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await clientPortalService.submitRequest(request.id);
      toaster.success({
        title: t('clientPortal.requestDetail.submitSuccess', 'Request submitted'),
        description: t('clientPortal.requestDetail.submitSuccessDesc', 'Your request has been submitted for review'),
      });
      const updated = await clientPortalService.getRequest(request.id);
      setRequest(updated);
    } catch (error) {
      console.error('Error submitting request:', error);
      toaster.error({
        title: t('common.error', 'Error'),
        description: t('clientPortal.requestDetail.submitError', 'Failed to submit request'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!request) return;
    setActionLoading(true);
    try {
      await clientPortalService.cancelRequest(request.id);
      toaster.success({
        title: t('clientPortal.requestDetail.cancelSuccess', 'Request cancelled'),
      });
      navigate('/client/requests');
    } catch (error) {
      console.error('Error cancelling request:', error);
      toaster.error({
        title: t('common.error', 'Error'),
        description: t('clientPortal.requestDetail.cancelError', 'Failed to cancel request'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Get display value for a field
  const getFieldValue = (fieldCode: string): string => {
    const customData = request?.customData || {};
    const value = customData[fieldCode];
    if (value === null || value === undefined || value === '') return '-';
    if (typeof value === 'boolean') return value ? t('common.yes', 'Yes') : t('common.no', 'No');
    return String(value);
  };

  // Get repeatable section rows
  const getSectionRows = (sectionCode: string): CustomDataRow[] => {
    const customData = request?.customData || {};
    const rows = customData[sectionCode];
    if (Array.isArray(rows)) return rows as CustomDataRow[];
    return [];
  };

  // Navigate to next step
  const handleNext = () => {
    if (currentStep < viewSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Render progress indicator (same style as wizard)
  const renderProgressIndicator = () => {
    return (
      <Box
        overflowX="auto"
        py={4}
        px={2}
        bg={isDark ? 'whiteAlpha.50' : 'white'}
        borderRadius="lg"
        mb={6}
      >
        <Flex justify="space-between" align="center" minW="fit-content">
          {viewSteps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep;
            const IconComponent = step.icon && iconMap[step.icon] ? iconMap[step.icon] : FiFileText;
            const stepName = t(step.stepNameKey, step.stepCode);

            return (
              <Flex key={step.id} align="center" flex={1}>
                <VStack
                  gap={1}
                  cursor="pointer"
                  onClick={() => setCurrentStep(index)}
                  _hover={{ opacity: 0.8 }}
                >
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="full"
                    align="center"
                    justify="center"
                    bg={
                      isActive
                        ? colors.primaryColor
                        : isCompleted
                        ? 'green.500'
                        : isDark
                        ? 'whiteAlpha.200'
                        : 'gray.200'
                    }
                    color={isActive || isCompleted ? 'white' : colors.textColor}
                    transition="all 0.2s"
                  >
                    {isCompleted ? <FiCheck /> : <Icon as={IconComponent} />}
                  </Flex>
                  <Text
                    fontSize="xs"
                    fontWeight={isActive ? 'semibold' : 'normal'}
                    color={isActive ? colors.primaryColor : colors.textColor}
                    textAlign="center"
                    maxW="80px"
                  >
                    {stepName}
                  </Text>
                </VStack>

                {index < viewSteps.length - 1 && (
                  <Box
                    flex={1}
                    h="2px"
                    mx={2}
                    bg={isCompleted ? 'green.500' : isDark ? 'whiteAlpha.200' : 'gray.200'}
                    transition="background 0.2s"
                  />
                )}
              </Flex>
            );
          })}
        </Flex>
      </Box>
    );
  };

  // Render section content
  const renderSection = (section: CustomFieldSectionDTO) => {
    const sectionName = t(section.sectionNameKey, section.sectionCode);

    if (section.sectionType === 'REPEATABLE') {
      const rows = getSectionRows(section.sectionCode);
      return (
        <Box key={section.id}>
          <Text fontWeight="semibold" mb={3} color={colors.textColor}>
            {sectionName} ({rows.length})
          </Text>
          {rows.length === 0 ? (
            <Text color={colors.textColor} opacity={0.5} fontSize="sm">
              {t('common.noData', 'No data')}
            </Text>
          ) : (
            <VStack align="stretch" gap={2}>
              {rows.map((row, idx) => (
                <Box
                  key={idx}
                  p={3}
                  borderRadius="md"
                  bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                >
                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={3}>
                    {section.fields
                      .sort((a, b) => a.displayOrder - b.displayOrder)
                      .map((field) => {
                        const fieldName = t(field.fieldNameKey, field.fieldCode);
                        const value = row[field.fieldCode];

                        // Handle null/undefined
                        if (value === null || value === undefined) {
                          return (
                            <Box key={field.fieldCode}>
                              <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                                {fieldName}
                              </Text>
                              <Text fontSize="sm" color={colors.textColor}>-</Text>
                            </Box>
                          );
                        }

                        // Check if this is a document field (object with documentId or downloadUrl)
                        let docInfo: { name?: string; size?: number; downloadUrl?: string; previewUrl?: string } | null = null;
                        if (typeof value === 'object' && value !== null) {
                          const obj = value as Record<string, unknown>;
                          if (obj.documentId || (obj.name && obj.downloadUrl)) {
                            docInfo = obj as typeof docInfo;
                          }
                        } else if (typeof value === 'string' && value.startsWith('{')) {
                          try {
                            const parsed = JSON.parse(value);
                            if (parsed.documentId || (parsed.name && parsed.downloadUrl)) {
                              docInfo = parsed;
                            }
                          } catch {
                            // Not JSON
                          }
                        }

                        // Render document nicely
                        if (docInfo && docInfo.name) {
                          const fileSize = docInfo.size ? ` (${(docInfo.size / 1024).toFixed(1)} KB)` : '';
                          return (
                            <Box key={field.fieldCode}>
                              <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                                {fieldName}
                              </Text>
                              <HStack gap={2}>
                                <Icon as={FiFileText} color="blue.500" boxSize={4} />
                                <Text fontSize="sm" color="blue.600" fontWeight="medium">
                                  {docInfo.name}{fileSize}
                                </Text>
                                {docInfo.previewUrl && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    onClick={() => openDocumentWithAuth(docInfo!.previewUrl!)}
                                    title={t('common.preview', 'Preview')}
                                  >
                                    <Icon as={FiEye} boxSize={3} />
                                  </Button>
                                )}
                                {docInfo.downloadUrl && (
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="blue"
                                    onClick={() => openDocumentWithAuth(docInfo!.downloadUrl!)}
                                    title={t('common.download', 'Download')}
                                  >
                                    <Icon as={FiDownload} boxSize={3} />
                                  </Button>
                                )}
                              </HStack>
                            </Box>
                          );
                        }

                        const displayValue = String(value);

                        return (
                          <Box key={field.fieldCode}>
                            <Text fontSize="xs" color={colors.textColor} opacity={0.6}>
                              {fieldName}
                            </Text>
                            <Text fontSize="sm" color={colors.textColor}>{displayValue}</Text>
                          </Box>
                        );
                      })}
                  </SimpleGrid>
                </Box>
              ))}
            </VStack>
          )}
        </Box>
      );
    }

    // Single section
    return (
      <Box key={section.id}>
        {section.sectionNameKey && (
          <Text fontWeight="semibold" mb={3} color={colors.textColor}>
            {sectionName}
          </Text>
        )}
        <SimpleGrid columns={{ base: 1, md: section.columns || 2 }} gap={4}>
          {section.fields
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((field) => {
              const fieldName = t(field.fieldNameKey, field.fieldCode);
              const value = getFieldValue(field.fieldCode);

              return (
                <Box
                  key={field.fieldCode}
                  gridColumn={field.spanColumns === 2 ? 'span 2' : 'auto'}
                >
                  <Text fontSize="sm" color={colors.textColor} opacity={0.6}>
                    {fieldName}
                  </Text>
                  <Text color={colors.textColor} whiteSpace="pre-wrap">{value}</Text>
                </Box>
              );
            })}
        </SimpleGrid>
      </Box>
    );
  };

  // Render step content
  const renderStepContent = () => {
    if (!currentStepData) return null;

    const stepDescription = currentStepData.stepDescriptionKey
      ? t(currentStepData.stepDescriptionKey, '')
      : '';

    return (
      <VStack align="stretch" gap={6}>
        {stepDescription && (
          <Text color={colors.textColor} opacity={0.7}>
            {stepDescription}
          </Text>
        )}
        {currentStepData.sections
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((section) => renderSection(section))}
      </VStack>
    );
  };

  if (loading) {
    return (
      <Center p={8}>
        <VStack>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text>{t('common.loading', 'Loading...')}</Text>
        </VStack>
      </Center>
    );
  }

  if (!request) {
    return (
      <Center p={8}>
        <VStack>
          <Text color="red.500">{t('clientPortal.requestDetail.notFound', 'Request not found')}</Text>
          <Button onClick={() => navigate('/client/requests')}>
            {t('common.goBack', 'Go Back')}
          </Button>
        </VStack>
      </Center>
    );
  }

  const canEdit = request.status === 'DRAFT';
  const canSubmit = request.status === 'DRAFT';
  const canCancel = ['DRAFT', 'SUBMITTED'].includes(request.status);

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box>
          <Button
            variant="ghost"
            onClick={() => navigate('/client/requests')}
            mb={4}
          >
            <FiArrowLeft style={{ marginRight: 8 }} />
            {t('common.back', 'Back')}
          </Button>

          <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
            <Box>
              <HStack gap={4} align="center" flexWrap="wrap">
                <Heading size="lg">{request.requestNumber || t('clientPortal.requestDetail.newRequest', 'New Request')}</Heading>
                <Badge colorPalette={statusColors[request.status] || 'gray'} size="lg">
                  {request.statusLabel || t(`status.${request.status.toLowerCase()}`, request.status)}
                </Badge>
              </HStack>
              <Text color={colors.textColorSecondary} mt={1}>
                {request.productTypeLabel || request.productType}
                {request.amount && ` • ${request.currency} ${request.amount.toLocaleString()}`}
              </Text>
            </Box>

            <HStack flexWrap="wrap" gap={2}>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/client/requests/${request.id}/edit`)}
                  disabled={actionLoading}
                >
                  <FiEdit style={{ marginRight: 8 }} />
                  {t('common.edit', 'Edit')}
                </Button>
              )}
              {canSubmit && (
                <Button
                  colorPalette="green"
                  onClick={handleSubmit}
                  disabled={actionLoading}
                >
                  {actionLoading ? <Spinner size="sm" mr={2} /> : <FiSend style={{ marginRight: 8 }} />}
                  {t('clientPortal.requestDetail.submit', 'Submit')}
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="outline"
                  colorPalette="red"
                  onClick={handleCancel}
                  disabled={actionLoading}
                >
                  <FiX style={{ marginRight: 8 }} />
                  {t('common.cancel', 'Cancel')}
                </Button>
              )}
            </HStack>
          </HStack>
        </Box>

        {/* Wizard-style view */}
        {configLoading ? (
          <Card.Root>
            <Card.Body>
              <Center p={4}>
                <Spinner />
              </Center>
            </Card.Body>
          </Card.Root>
        ) : viewSteps.length > 0 ? (
          <>
            {/* Progress Indicator */}
            {renderProgressIndicator()}

            {/* Step Title */}
            <Box>
              <Heading size="lg" color={colors.textColor}>
                {t(currentStepData?.stepNameKey || '', currentStepData?.stepCode || '')}
              </Heading>
            </Box>

            {/* Step Content */}
            <Card.Root>
              <Card.Body>{renderStepContent()}</Card.Body>
            </Card.Root>

            {/* Navigation Buttons */}
            <HStack justify="space-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <FiChevronLeft style={{ marginRight: 8 }} />
                {t('common.previous', 'Previous')}
              </Button>

              <Text color={colors.textColorSecondary}>
                {currentStep + 1} / {viewSteps.length}
              </Text>

              <Button
                variant="outline"
                onClick={handleNext}
                disabled={currentStep === viewSteps.length - 1}
              >
                {t('common.next', 'Next')}
                <FiChevronRight style={{ marginLeft: 8 }} />
              </Button>
            </HStack>
          </>
        ) : (
          // Fallback if no configuration - show raw custom data
          <Card.Root>
            <Card.Header>
              <Heading size="md">{t('clientPortal.requestDetail.details', 'Request Details')}</Heading>
            </Card.Header>
            <Card.Body>
              {Object.keys(request.customData || {}).length === 0 ? (
                <Text color={colors.textColorSecondary}>
                  {t('clientPortal.requestDetail.noDetails', 'No additional details')}
                </Text>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                  {Object.entries(request.customData || {}).map(([key, value]) => {
                    // Skip object values (documents, etc)
                    if (typeof value === 'object') return null;

                    // Check for stringified document JSON
                    if (typeof value === 'string' && value.startsWith('{')) {
                      try {
                        const parsed = JSON.parse(value);
                        if (parsed.documentId || (parsed.name && parsed.downloadUrl)) {
                          // This is a document - show nicely
                          const fileName = parsed.name || 'Documento';
                          const fileSize = parsed.size ? ` (${(parsed.size / 1024).toFixed(1)} KB)` : '';
                          return (
                            <Box key={key}>
                              <Text fontSize="sm" color={colors.textColorSecondary}>
                                {key}
                              </Text>
                              <Text color="blue.600">📎 {fileName}{fileSize}</Text>
                            </Box>
                          );
                        }
                      } catch {
                        // Not JSON, continue
                      }
                    }

                    return (
                      <Box key={key}>
                        <Text fontSize="sm" color={colors.textColorSecondary}>
                          {key}
                        </Text>
                        <Text>{String(value) || '-'}</Text>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}
            </Card.Body>
          </Card.Root>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <Card.Root>
            <Card.Header>
              <Heading size="md">
                {t('clientPortal.requestDetail.documents', 'Documentos Adjuntos')} ({documents.length})
              </Heading>
            </Card.Header>
            <Card.Body>
              <VStack align="stretch" gap={2}>
                {documents.map((doc) => (
                  <HStack
                    key={doc.documentId}
                    p={3}
                    bg={isDark ? 'whiteAlpha.50' : 'gray.50'}
                    borderRadius="md"
                    justify="space-between"
                  >
                    <HStack>
                      <Icon as={FiFileText} color="blue.500" boxSize={5} />
                      <VStack align="start" gap={0}>
                        <Text fontWeight="medium">{doc.originalFileName}</Text>
                        <Text fontSize="xs" color={colors.textColorSecondary}>
                          {doc.documentTypeCode || doc.categoryCode || 'Documento'}
                          {doc.formattedFileSize && ` - ${doc.formattedFileSize}`}
                          {!doc.formattedFileSize && doc.fileSize && ` - ${(doc.fileSize / 1024).toFixed(1)} KB`}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack gap={1}>
                      {doc.previewUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDocumentWithAuth(doc.previewUrl!)}
                          title={t('common.preview', 'Preview')}
                        >
                          <Icon as={FiEye} />
                        </Button>
                      )}
                      {doc.downloadUrl && (
                        <Button
                          size="sm"
                          variant="ghost"
                          colorPalette="blue"
                          onClick={() => openDocumentWithAuth(doc.downloadUrl!)}
                          title={t('common.download', 'Download')}
                        >
                          <Icon as={FiDownload} />
                        </Button>
                      )}
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}

        {/* Activity Timeline */}
        <Card.Root>
          <Card.Header>
            <Heading size="md">{t('clientPortal.requestDetail.activity', 'Activity')}</Heading>
          </Card.Header>
          <Card.Body>
            <VStack align="stretch" gap={4}>
              {request.createdAt && (
                <HStack>
                  <Box p={2} borderRadius="full" bg={isDark ? 'whiteAlpha.100' : 'gray.100'}>
                    <FiFileText />
                  </Box>
                  <Box>
                    <Text fontWeight="medium">{t('activity.created', 'Request created')}</Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {new Date(request.createdAt).toLocaleString()}
                    </Text>
                  </Box>
                </HStack>
              )}
              {request.submittedAt && (
                <HStack>
                  <Box p={2} borderRadius="full" bg="blue.100">
                    <FiSend color="blue" />
                  </Box>
                  <Box>
                    <Text fontWeight="medium">{t('activity.submitted', 'Request submitted')}</Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {new Date(request.submittedAt).toLocaleString()}
                    </Text>
                  </Box>
                </HStack>
              )}
              {request.assignedToUserName && (
                <HStack>
                  <Box p={2} borderRadius="full" bg="purple.100">
                    <FiUser color="purple" />
                  </Box>
                  <Box>
                    <Text fontWeight="medium">
                      {t('activity.assigned', 'Assigned to {{name}}', { name: request.assignedToUserName })}
                    </Text>
                  </Box>
                </HStack>
              )}
              {request.approvedAt && (
                <HStack>
                  <Box p={2} borderRadius="full" bg="green.100">
                    <FiClock color="green" />
                  </Box>
                  <Box>
                    <Text fontWeight="medium">{t('activity.approved', 'Request approved')}</Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {new Date(request.approvedAt).toLocaleString()}
                      {request.approvedByUserName && ` by ${request.approvedByUserName}`}
                    </Text>
                  </Box>
                </HStack>
              )}
              {request.rejectedAt && (
                <HStack>
                  <Box p={2} borderRadius="full" bg="red.100">
                    <FiX color="red" />
                  </Box>
                  <Box>
                    <Text fontWeight="medium">{t('activity.rejected', 'Request rejected')}</Text>
                    <Text fontSize="sm" color={colors.textColorSecondary}>
                      {new Date(request.rejectedAt).toLocaleString()}
                    </Text>
                    {request.rejectionReason && (
                      <Text fontSize="sm" color="red.500" mt={1}>
                        {t('activity.reason', 'Reason')}: {request.rejectionReason}
                      </Text>
                    )}
                  </Box>
                </HStack>
              )}
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    </Box>
  );
};

export default ClientRequestDetail;
