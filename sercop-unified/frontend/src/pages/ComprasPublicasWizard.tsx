/**
 * ComprasPublicasWizard - Wizard para productos de Compras Públicas del Ecuador
 * Usa DynamicFormWizard con campos personalizados en lugar de SWIFT
 */
import { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  VStack,
  Heading,
  Text,
  Flex,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useTheme } from '../contexts/ThemeContext';
import { DynamicFormWizard } from '../components/client/DynamicFormWizard';
import type { CustomData } from '../services/customFieldsService';
import { getAllConfigs, type ProductTypeConfig } from '../services/productTypeConfigService';

interface ComprasPublicasWizardProps {
  productType: string;
  titleKey?: string;
}

export const ComprasPublicasWizard = ({ productType, titleKey }: ComprasPublicasWizardProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const navigate = useNavigate();

  const [productConfig, setProductConfig] = useState<ProductTypeConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllConfigs().then(configs => {
      const config = configs.find(c => c.productType === productType);
      setProductConfig(config || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [productType]);

  const handleSubmit = useCallback(async (data: CustomData, asDraft: boolean) => {
    try {
      // TODO: Implement actual submission to backend
      console.log('Submitting data:', { productType, data, asDraft });

      toaster.success({
        title: asDraft
          ? t('common.draftSaved', 'Borrador guardado')
          : t('common.submitted', 'Solicitud enviada'),
        duration: 3000,
      });

      if (!asDraft) {
        navigate('/operations');
      }
    } catch (error) {
      toaster.error({
        title: t('common.error', 'Error'),
        description: error instanceof Error ? error.message : 'Error desconocido',
        duration: 5000,
      });
    }
  }, [productType, navigate, t]);

  const handleCancel = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  if (loading) {
    return (
      <Center h="400px">
        <VStack gap={4}>
          <Spinner size="xl" color={colors.primaryColor} />
          <Text color={colors.textColor}>{t('common.loading')}</Text>
        </VStack>
      </Center>
    );
  }

  const title = titleKey
    ? t(titleKey)
    : productConfig?.description || productType.replace(/_/g, ' ').replace('CP ', '');

  return (
    <Box flex={1} p={4}>
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={2}>
          <Heading size="lg" color={colors.textColor}>
            {title}
          </Heading>
        </Flex>

        {/* Dynamic Form Wizard */}
        <DynamicFormWizard
          productType={productType}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      </VStack>
    </Box>
  );
};

export default ComprasPublicasWizard;
