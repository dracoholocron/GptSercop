/**
 * GuaranteeDocumentButton - Button component for generating guarantee documents
 * Provides options to download or preview guarantee PDFs in Spanish or English
 */
import { useState } from 'react';
import {
  Button,
  Menu,
  Spinner,
  Text,
  HStack,
  VStack,
  Box,
} from '@chakra-ui/react';
import { FiFileText, FiDownload, FiExternalLink, FiGlobe } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { guaranteeDocumentService, type Language } from '../../services/guaranteeDocumentService';
import { toaster } from '../ui/toaster';

interface GuaranteeDocumentButtonProps {
  /** The guarantee ID (numeric ID from bank_guarantee_readmodel) */
  guaranteeId?: number | string;
  /** The guarantee reference number (alternative to ID) */
  guaranteeNumber?: string;
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Button variant */
  variant?: 'solid' | 'outline' | 'ghost';
  /** Full width button */
  fullWidth?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export const GuaranteeDocumentButton = ({
  guaranteeId,
  guaranteeNumber,
  size = 'sm',
  variant = 'outline',
  fullWidth = false,
  disabled = false,
}: GuaranteeDocumentButtonProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async (language: Language) => {
    if (!guaranteeId && !guaranteeNumber) {
      toaster.error({
        title: t('documents.errors.noGuarantee', 'No se encontro la garantia'),
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (guaranteeId) {
        await guaranteeDocumentService.downloadPdf(guaranteeId, language);
      } else if (guaranteeNumber) {
        const blob = await guaranteeDocumentService.generatePdfByNumber(guaranteeNumber, language);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `garantia_${guaranteeNumber}_${language.toLowerCase()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
      toaster.success({
        title: t('documents.success.downloaded', 'Documento descargado'),
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toaster.error({
        title: t('documents.errors.generateFailed', 'Error al generar el documento'),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async (language: Language) => {
    if (!guaranteeId && !guaranteeNumber) {
      toaster.error({
        title: t('documents.errors.noGuarantee', 'No se encontro la garantia'),
      });
      return;
    }

    setIsGenerating(true);
    try {
      if (guaranteeId) {
        await guaranteeDocumentService.openPdfInNewTab(guaranteeId, language);
      } else if (guaranteeNumber) {
        const blob = await guaranteeDocumentService.generatePdfByNumber(guaranteeNumber, language);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
      toaster.error({
        title: t('documents.errors.previewFailed', 'Error al generar vista previa'),
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine default language based on current i18n language
  const defaultLanguage: Language = i18n.language?.startsWith('en') ? 'EN' : 'ES';

  if (!guaranteeId && !guaranteeNumber) {
    return null;
  }

  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          size={size}
          variant={variant}
          colorPalette="blue"
          disabled={disabled || isGenerating}
          width={fullWidth ? '100%' : 'auto'}
        >
          <HStack gap={2}>
            {isGenerating ? <Spinner size="sm" /> : <FiFileText />}
            <Text display={{ base: 'none', sm: 'inline' }}>
              {t('guaranteeDocument.generate', 'Generar Documento')}
            </Text>
          </HStack>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content bg={colors.cardBg} borderColor={colors.borderColor}>
          <Box px={3} py={2} borderBottomWidth="1px" borderColor={colors.borderColor}>
            <Text fontSize="xs" fontWeight="bold" color={colors.textColor} textTransform="uppercase">
              {t('guaranteeDocument.title', 'Documento de Garantia')}
            </Text>
          </Box>

          {/* Spanish Options */}
          <Box px={2} py={1}>
            <Text fontSize="xs" color="gray.500" px={2} py={1}>
              <HStack gap={1}>
                <FiGlobe size={12} />
                <span>Espanol</span>
              </HStack>
            </Text>
            <Menu.Item
              value="download-es"
              onClick={() => handleDownload('ES')}
              color={colors.textColor}
            >
              <HStack gap={2}>
                <FiDownload />
                <VStack align="start" gap={0}>
                  <Text fontSize="sm">{t('guaranteeDocument.downloadEs', 'Descargar PDF')}</Text>
                </VStack>
              </HStack>
            </Menu.Item>
            <Menu.Item
              value="preview-es"
              onClick={() => handlePreview('ES')}
              color={colors.textColor}
            >
              <HStack gap={2}>
                <FiExternalLink />
                <Text fontSize="sm">{t('guaranteeDocument.previewEs', 'Abrir en nueva pestana')}</Text>
              </HStack>
            </Menu.Item>
          </Box>

          <Menu.Separator />

          {/* English Options */}
          <Box px={2} py={1}>
            <Text fontSize="xs" color="gray.500" px={2} py={1}>
              <HStack gap={1}>
                <FiGlobe size={12} />
                <span>English</span>
              </HStack>
            </Text>
            <Menu.Item
              value="download-en"
              onClick={() => handleDownload('EN')}
              color={colors.textColor}
            >
              <HStack gap={2}>
                <FiDownload />
                <Text fontSize="sm">{t('guaranteeDocument.downloadEn', 'Download PDF')}</Text>
              </HStack>
            </Menu.Item>
            <Menu.Item
              value="preview-en"
              onClick={() => handlePreview('EN')}
              color={colors.textColor}
            >
              <HStack gap={2}>
                <FiExternalLink />
                <Text fontSize="sm">{t('guaranteeDocument.previewEn', 'Open in new tab')}</Text>
              </HStack>
            </Menu.Item>
          </Box>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export default GuaranteeDocumentButton;
