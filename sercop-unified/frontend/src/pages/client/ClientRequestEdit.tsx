/**
 * ClientRequestEdit - Edit an existing client request
 * Uses DynamicFormWizard with pre-populated data from the existing request
 */

import { Box, Heading, Text, VStack, Button, Center, Spinner } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import clientPortalService from '../../services/clientPortalService';
import type { ClientRequest } from '../../services/clientPortalService';
import { toaster } from '../../components/ui/toaster';
import { DynamicFormWizard } from '../../components/client';
import type { CustomData } from '../../services/customFieldsService';
import { useTheme } from '../../contexts/ThemeContext';

// Map backend product type to display labels
const productTypeLabels: Record<string, string> = {
  LC_IMPORT_REQUEST: 'clientPortal.products.lcImport',
  LC_EXPORT_REQUEST: 'clientPortal.products.lcExport',
  GUARANTEE_REQUEST: 'clientPortal.products.guarantee',
  COLLECTION_REQUEST: 'clientPortal.products.collection',
};

// Map backend product type to custom fields product type
const customFieldsProductTypeMap: Record<string, string> = {
  LC_IMPORT_REQUEST: 'CLIENT_LC_IMPORT_REQUEST',
  LC_EXPORT_REQUEST: 'CLIENT_LC_EXPORT_REQUEST',
  GUARANTEE_REQUEST: 'CLIENT_GUARANTEE_REQUEST',
  COLLECTION_REQUEST: 'CLIENT_COLLECTION_REQUEST',
};

export const ClientRequestEdit = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { getColors } = useTheme();
  const colors = getColors();

  const [request, setRequest] = useState<ClientRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load existing request
  useEffect(() => {
    const loadRequest = async () => {
      if (!id) return;
      try {
        const data = await clientPortalService.getRequest(id);

        // Only allow editing draft requests
        if (data.status !== 'DRAFT') {
          toaster.error({
            title: t('common.error', 'Error'),
            description: t('clientPortal.requestEdit.cannotEditNonDraft', 'Only draft requests can be edited'),
          });
          navigate(`/client/requests/${id}`);
          return;
        }

        setRequest(data);
      } catch (error) {
        console.error('Error loading request:', error);
        toaster.error({
          title: t('common.error', 'Error'),
          description: t('clientPortal.requestEdit.loadError', 'Failed to load request'),
        });
        navigate('/client/requests');
      } finally {
        setLoadingRequest(false);
      }
    };
    loadRequest();
  }, [id, navigate, t]);

  // Handle form submission
  const handleSubmit = async (customData: CustomData, asDraft: boolean) => {
    if (!request) return;

    setSaving(true);
    try {
      // Extract amount and currency from custom data if present
      const amount = customData.LC_AMOUNT || customData.AMOUNT || customData.COL_AMOUNT;
      const currency = customData.LC_CURRENCY || customData.CURRENCY || customData.COL_CURRENCY;

      // Update the request
      await clientPortalService.updateRequest(request.id, {
        amount: typeof amount === 'number' ? amount : (amount ? parseFloat(String(amount)) : undefined),
        currency: currency ? String(currency) : request.currency,
        customData: customData as Record<string, unknown>,
      });

      if (!asDraft) {
        // Submit the request after updating
        await clientPortalService.submitRequest(request.id);
        toaster.success({
          title: t('clientPortal.requestEdit.submitSuccess', 'Request submitted successfully'),
          description: t('clientPortal.requestEdit.submitSuccessDesc', 'Your request has been submitted for review'),
        });
      } else {
        toaster.success({
          title: t('clientPortal.requestEdit.saveSuccess', 'Changes saved successfully'),
          description: t('clientPortal.requestEdit.saveSuccessDesc', 'Your changes have been saved'),
        });
      }

      navigate('/client/requests');
    } catch (error) {
      console.error('Error updating request:', error);
      toaster.error({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : t('clientPortal.requestEdit.updateError', 'Failed to update request'),
      });
      throw error;
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/client/requests/${id}`);
  };

  // Loading state
  if (loadingRequest) {
    return (
      <Center p={8}>
        <VStack>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text>{t('common.loading', 'Loading...')}</Text>
        </VStack>
      </Center>
    );
  }

  // Request not found or not editable
  if (!request) {
    return (
      <Box p={6}>
        <Center>
          <VStack gap={4}>
            <Text color="red.500">{t('clientPortal.requestEdit.notFound', 'Request not found')}</Text>
            <Button onClick={() => navigate('/client/requests')}>
              {t('common.goBack', 'Go Back')}
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  // Get the custom fields product type
  const customFieldsProductType = customFieldsProductTypeMap[request.productType] || '';

  if (!customFieldsProductType) {
    return (
      <Box p={6}>
        <Center>
          <VStack gap={4}>
            <Text color="red.500">{t('clientPortal.requestEdit.invalidProductType', 'Invalid product type')}</Text>
            <Button onClick={() => navigate('/client/requests')}>
              {t('common.goBack', 'Go Back')}
            </Button>
          </VStack>
        </Center>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <VStack align="stretch" gap={6}>
        {/* Header */}
        <Box>
          <Button
            variant="ghost"
            onClick={() => navigate(`/client/requests/${id}`)}
            mb={4}
          >
            <FiArrowLeft style={{ marginRight: 8 }} />
            {t('common.back', 'Back')}
          </Button>

          <Heading size="lg" mb={2}>
            {t('clientPortal.requestEdit.title', 'Edit Request')} - {request.requestNumber || t('clientPortal.requestEdit.draft', 'Draft')}
          </Heading>
          <Text color="gray.600">
            {t(productTypeLabels[request.productType] || '', request.productType)}
          </Text>
        </Box>

        {/* Dynamic Form Wizard with pre-populated data */}
        <DynamicFormWizard
          productType={customFieldsProductType}
          initialData={(request.customData as CustomData) || {}}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
          requestId={request.id}
        />
      </VStack>
    </Box>
  );
};

export default ClientRequestEdit;
