import {
  Menu,
  Button,
  HStack,
  VStack,
  Text,
  Badge,
  Icon,
  Box,
  Separator,
} from '@chakra-ui/react';
import { FiChevronDown, FiBriefcase, FiLayers, FiCheck, FiGrid } from 'react-icons/fi';
import { useCorporation } from '../contexts/CorporationContext';
import { useTranslation } from 'react-i18next';

interface CompanySwitcherProps {
  variant?: 'default' | 'compact';
}

const CompanySwitcher = ({ variant = 'default' }: CompanySwitcherProps) => {
  const { t } = useTranslation();
  const {
    hasMultipleCompanies,
    accessibleCompanies,
    selectedCompany,
    selectCompany,
    clearSelection,
    isLoading,
  } = useCorporation();

  // Don't render if user doesn't have multiple companies
  if (!hasMultipleCompanies || accessibleCompanies.length <= 1) {
    return null;
  }

  const getHierarchyIcon = (hierarchyType: string) => {
    switch (hierarchyType) {
      case 'CORPORATION':
        return FiLayers;
      case 'BRANCH':
        return FiGrid;
      default:
        return FiBriefcase;
    }
  };

  const getHierarchyBadge = (hierarchyType: string) => {
    switch (hierarchyType) {
      case 'CORPORATION':
        return { label: t('clientPortal.hierarchy.corporation', 'Corporation'), color: 'purple' as const };
      case 'BRANCH':
        return { label: t('clientPortal.hierarchy.branch', 'Branch'), color: 'gray' as const };
      default:
        return { label: t('clientPortal.hierarchy.company', 'Company'), color: 'blue' as const };
    }
  };

  if (variant === 'compact') {
    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Button
            size="sm"
            variant="outline"
            loading={isLoading}
          >
            <HStack gap={2}>
              <Icon>
                {selectedCompany ? <FiBriefcase /> : <FiLayers />}
              </Icon>
              <Text lineClamp={1} maxW="150px">
                {selectedCompany ? selectedCompany.displayName : t('clientPortal.allCompanies', 'All Companies')}
              </Text>
              <FiChevronDown />
            </HStack>
          </Button>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content zIndex={1500}>
            <Menu.Item
              value="all"
              onClick={() => clearSelection()}
              bg={!selectedCompany ? 'blue.50' : undefined}
            >
              <HStack justify="space-between" w="full">
                <HStack>
                  <Icon><FiLayers /></Icon>
                  <Text>{t('clientPortal.allCompanies', 'All Companies')}</Text>
                </HStack>
                {!selectedCompany && <Icon color="blue.600"><FiCheck /></Icon>}
              </HStack>
            </Menu.Item>
            <Menu.Separator />
            {accessibleCompanies.map((company) => (
              <Menu.Item
                key={company.id}
                value={company.id.toString()}
                onClick={() => selectCompany(company)}
                bg={selectedCompany?.id === company.id ? 'blue.50' : undefined}
                pl={company.hierarchyLevel > 0 ? `${(company.hierarchyLevel + 1) * 12}px` : undefined}
              >
                <HStack justify="space-between" w="full">
                  <HStack>
                    <Icon>
                      {getHierarchyIcon(company.hierarchyType) === FiLayers ? <FiLayers /> :
                       getHierarchyIcon(company.hierarchyType) === FiGrid ? <FiGrid /> : <FiBriefcase />}
                    </Icon>
                    <Text lineClamp={1}>{company.displayName}</Text>
                  </HStack>
                  {selectedCompany?.id === company.id && <Icon color="blue.600"><FiCheck /></Icon>}
                </HStack>
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  }

  // Default variant with more details
  return (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button
          variant="outline"
          loading={isLoading}
          w="full"
          textAlign="left"
        >
          <HStack gap={3} flex={1}>
            <Icon boxSize={5}>
              {selectedCompany ? <FiBriefcase /> : <FiLayers />}
            </Icon>
            <VStack align="start" gap={0} flex={1}>
              <Text fontSize="sm" fontWeight="medium" lineClamp={1}>
                {selectedCompany ? selectedCompany.displayName : t('clientPortal.allCompanies', 'All Companies')}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {selectedCompany
                  ? selectedCompany.identificacion
                  : t('clientPortal.viewingAllCompanies', 'Viewing all {count} companies', { count: accessibleCompanies.length })}
              </Text>
            </VStack>
            <FiChevronDown />
          </HStack>
        </Button>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content zIndex={1500} maxH="400px" overflowY="auto">
          {/* All Companies option */}
          <Menu.Item
            value="all"
            onClick={() => clearSelection()}
            bg={!selectedCompany ? 'blue.50' : undefined}
            py={3}
          >
            <HStack justify="space-between" w="full">
              <HStack gap={3}>
                <Icon boxSize={5}><FiLayers /></Icon>
                <VStack align="start" gap={0}>
                  <Text fontWeight="medium">{t('clientPortal.allCompanies', 'All Companies')}</Text>
                  <Text fontSize="xs" color="gray.500">
                    {t('clientPortal.viewAllData', 'View data from all companies')}
                  </Text>
                </VStack>
              </HStack>
              {!selectedCompany && <Icon color="blue.600"><FiCheck /></Icon>}
            </HStack>
          </Menu.Item>

          <Menu.Separator />

          {/* Company list */}
          {accessibleCompanies.map((company) => {
            const badge = getHierarchyBadge(company.hierarchyType);
            return (
              <Menu.Item
                key={company.id}
                value={company.id.toString()}
                onClick={() => selectCompany(company)}
                bg={selectedCompany?.id === company.id ? 'blue.50' : undefined}
                py={3}
                pl={company.hierarchyLevel > 0 ? `${(company.hierarchyLevel + 1) * 16}px` : undefined}
              >
                <HStack justify="space-between" w="full">
                  <HStack gap={3}>
                    <Icon boxSize={5}>
                      {getHierarchyIcon(company.hierarchyType) === FiLayers ? <FiLayers /> :
                       getHierarchyIcon(company.hierarchyType) === FiGrid ? <FiGrid /> : <FiBriefcase />}
                    </Icon>
                    <VStack align="start" gap={0}>
                      <HStack>
                        <Text fontWeight="medium" lineClamp={1}>
                          {company.displayName}
                        </Text>
                        <Badge size="sm" colorPalette={badge.color} fontSize="xs">
                          {badge.label}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {company.identificacion}
                      </Text>
                    </VStack>
                  </HStack>
                  {selectedCompany?.id === company.id && <Icon color="blue.600"><FiCheck /></Icon>}
                </HStack>
              </Menu.Item>
            );
          })}
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  );
};

export default CompanySwitcher;
