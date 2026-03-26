import {
  Box,
  Flex,
  Link,
  Text,
  Badge,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';
import { swiftFieldConfigService } from '../services/swiftFieldConfigService';
import type { SpecVersionsInfo } from '../types/swiftField';

export const Footer = () => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const [swiftVersionInfo, setSwiftVersionInfo] = useState<SpecVersionsInfo | null>(null);
  const showSwiftVersion = import.meta.env.VITE_ENABLE_SWIFT_VERSION !== 'false';

  useEffect(() => {
    if (!showSwiftVersion) return;

    const loadSwiftVersion = async () => {
      try {
        const info = await swiftFieldConfigService.getSpecVersions('MT700');
        setSwiftVersionInfo(info);
      } catch (error) {
        // Compare mode can run without SWIFT config tables/endpoints.
      }
    };
    loadSwiftVersion();
  }, [showSwiftVersion]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getVersionDateRange = (versionCode: string) => {
    const details = swiftVersionInfo?.versionDetails || [];
    const sortedDetails = [...details].sort((a, b) =>
      new Date(a.effective_date).getTime() - new Date(b.effective_date).getTime()
    );
    const currentIndex = sortedDetails.findIndex(d => d.version_code === versionCode);
    if (currentIndex === -1) return { from: '', until: null };
    const fromDate = sortedDetails[currentIndex].effective_date;
    let untilDate: string | null = null;
    if (currentIndex < sortedDetails.length - 1) {
      const nextEffective = new Date(sortedDetails[currentIndex + 1].effective_date);
      nextEffective.setDate(nextEffective.getDate() - 1);
      untilDate = nextEffective.toISOString().split('T')[0];
    }
    return { from: fromDate, until: untilDate };
  };

  const colors = getColors();
  const { bgColor, borderColor, textColorSecondary, primaryColor } = colors;

  const sep = <Text as="span" color={textColorSecondary} fontSize="2xs" mx={1} opacity={0.5}>|</Text>;
  const dot = <Text as="span" color={textColorSecondary} fontSize="2xs" mx={0.5} opacity={0.5}>&middot;</Text>;

  const swiftRange = swiftVersionInfo
    ? getVersionDateRange(swiftVersionInfo.currentActiveVersion)
    : null;

  return (
    <Box
      as="footer"
      w="full"
      bg={bgColor}
      borderTop="1px"
      borderColor={borderColor}
      py={1.5}
    >
      {/* Desktop: single line */}
      <Flex
        display={{ base: 'none', md: 'flex' }}
        px={4}
        align="center"
        justify="center"
        gap={0}
        flexWrap="wrap"
      >
        <Text fontSize="2xs" color={textColorSecondary}>
          © 2025 GLOBAL CX
        </Text>
        {dot}
        <Text fontSize="2xs" color={textColorSecondary}>
          {t('login.subtitle')}
        </Text>

        {sep}

        <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
          {t('footer.contact')}
        </Link>
        {dot}
        <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
          {t('footer.privacy')}
        </Link>
        {dot}
        <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
          {t('footer.terms')}
        </Link>

        {sep}

        <Text fontSize="2xs" color={textColorSecondary}>
          v1.0.0
        </Text>

        {swiftVersionInfo && swiftRange && (
          <>
            {sep}
            <Text fontSize="2xs" color={textColorSecondary}>SWIFT:</Text>
            <Badge colorPalette="blue" fontSize="2xs" variant="subtle" ml={1} size="sm">
              {swiftVersionInfo.currentActiveVersion}
            </Badge>
            <Text fontSize="2xs" color={textColorSecondary} ml={1}>
              ({formatDate(swiftRange.from)} - {swiftRange.until ? formatDate(swiftRange.until) : 'Vigente'})
            </Text>
          </>
        )}
      </Flex>

      {/* Mobile/Tablet small: two centered lines */}
      <Flex
        display={{ base: 'flex', md: 'none' }}
        direction="column"
        align="center"
        px={3}
        gap={0}
      >
        <Flex align="center" flexWrap="wrap" justify="center">
          <Text fontSize="2xs" color={textColorSecondary}>
            © 2025 GLOBAL CX
          </Text>
          {dot}
          <Text fontSize="2xs" color={textColorSecondary}>
            v1.0.0
          </Text>
          {swiftVersionInfo && swiftRange && (
            <>
              {sep}
              <Text fontSize="2xs" color={textColorSecondary}>SWIFT:</Text>
              <Badge colorPalette="blue" fontSize="2xs" variant="subtle" ml={1} size="sm">
                {swiftVersionInfo.currentActiveVersion}
              </Badge>
            </>
          )}
        </Flex>
        <Flex align="center" gap={1}>
          <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
            {t('footer.contact')}
          </Link>
          {dot}
          <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
            {t('footer.privacy')}
          </Link>
          {dot}
          <Link href="#" fontSize="2xs" color={textColorSecondary} _hover={{ color: primaryColor }}>
            {t('footer.terms')}
          </Link>
        </Flex>
      </Flex>
    </Box>
  );
};
