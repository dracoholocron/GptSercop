import { Box, Flex, Text, VStack, HStack, Badge, Spinner, Collapsible } from '@chakra-ui/react';
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronRight, FiChevronDown, FiCheckCircle, FiClock, FiAlertCircle, FiPlay, FiFolder, FiFile } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { advancedSearch } from '../../services/alertService';
import type { AlertResponse, AlertSearchRequest } from '../../services/alertService';
import { AlertCard } from './AlertCard';

interface GroupedListViewProps {
  filters: AlertSearchRequest;
  lang: string;
  onAlertClick: (alert: AlertResponse) => void;
  onAlertUpdate: () => void;
}

interface HierarchyNode {
  id: string;
  name: string;
  color: string;
  level: number;
  children: Map<string, HierarchyNode>;
  alerts: AlertResponse[];
  completedCount: number;
  totalCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'green';
    case 'IN_PROGRESS': return 'blue';
    case 'CANCELLED': return 'gray';
    default: return 'orange';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'COMPLETED': return <FiCheckCircle />;
    case 'IN_PROGRESS': return <FiPlay />;
    case 'CANCELLED': return <FiAlertCircle />;
    default: return <FiClock />;
  }
};

// Get tag detail from alert by tag name
const getTagDetail = (alert: AlertResponse, tagName: string) => {
  return alert.tagDetails?.find(td => td.name === tagName);
};

export const GroupedListView = ({ filters, lang, onAlertClick, onAlertUpdate }: GroupedListViewProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const searchFilters: AlertSearchRequest = {
          ...filters,
          page: 0,
          size: 200,
        };
        const result = await advancedSearch(searchFilters, lang);
        setAlerts(result.content);

        // Auto-expand first level
        const firstLevelTags = new Set<string>();
        result.content.forEach(alert => {
          if (alert.tags && alert.tags.length > 0) {
            firstLevelTags.add(alert.tags[0]);
          }
        });
        setExpandedNodes(new Set(['root', ...firstLevelTags]));
      } catch (error) {
        console.error('Error loading alerts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, [filters, lang]);

  // Build dynamic hierarchy from alerts based on tag order
  const hierarchy = useMemo(() => {
    const root: HierarchyNode = {
      id: 'root',
      name: 'Todas las Alertas',
      color: colors.primaryColor,
      level: 0,
      children: new Map(),
      alerts: [],
      completedCount: 0,
      totalCount: 0,
    };

    // Group alerts without tags
    const untaggedAlerts: AlertResponse[] = [];

    alerts.forEach(alert => {
      if (!alert.tags || alert.tags.length === 0) {
        untaggedAlerts.push(alert);
        root.totalCount++;
        if (alert.status === 'COMPLETED') root.completedCount++;
        return;
      }

      // Navigate/create hierarchy based on tag order
      let currentNode = root;
      const tags = alert.tags;

      for (let i = 0; i < tags.length; i++) {
        const tagName = tags[i];
        const tagDetail = getTagDetail(alert, tagName);
        const nodeId = tags.slice(0, i + 1).join('/');

        if (!currentNode.children.has(tagName)) {
          currentNode.children.set(tagName, {
            id: nodeId,
            name: tagName,
            color: tagDetail?.color || colors.primaryColor,
            level: i + 1,
            children: new Map(),
            alerts: [],
            completedCount: 0,
            totalCount: 0,
          });
        }

        currentNode = currentNode.children.get(tagName)!;
        currentNode.totalCount++;
        if (alert.status === 'COMPLETED') {
          currentNode.completedCount++;
        }
      }

      // Add alert to the deepest node
      currentNode.alerts.push(alert);
      root.totalCount++;
      if (alert.status === 'COMPLETED') root.completedCount++;
    });

    // Add untagged alerts to root
    root.alerts = untaggedAlerts;

    return root;
  }, [alerts, colors.primaryColor]);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const renderNode = (node: HierarchyNode, path: string = ''): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.size > 0 || node.alerts.length > 0;
    const progressPercent = node.totalCount > 0
      ? Math.round((node.completedCount / node.totalCount) * 100)
      : 0;

    const paddingLeft = node.level * 16;

    return (
      <Box key={node.id}>
        {/* Node Header */}
        <Flex
          align="center"
          py={2}
          px={3}
          pl={`${paddingLeft + 12}px`}
          cursor={hasChildren ? 'pointer' : 'default'}
          onClick={() => hasChildren && toggleNode(node.id)}
          bg={isExpanded ? colors.activeBg : 'transparent'}
          borderRadius="md"
          _hover={{ bg: colors.hoverBg }}
          borderLeft={node.level > 0 ? `3px solid ${node.color}` : 'none'}
          ml={node.level > 0 ? 2 : 0}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <Box mr={2} color={colors.textColorSecondary}>
              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
            </Box>
          ) : (
            <Box mr={2} w="16px" />
          )}

          {/* Folder/File Icon */}
          <Box mr={2} color={node.color}>
            {node.children.size > 0 ? <FiFolder /> : <FiFile />}
          </Box>

          {/* Node Name */}
          <Text fontWeight={node.level === 0 ? '600' : '500'} color={colors.textColor} flex={1}>
            {node.name}
          </Text>

          {/* Stats */}
          <HStack gap={2}>
            {/* Progress */}
            <HStack gap={1}>
              <Box
                w="60px"
                h="6px"
                bg={colors.borderColor}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${progressPercent}%`}
                  bg={progressPercent === 100 ? 'green.500' : node.color}
                  transition="width 0.3s"
                />
              </Box>
              <Text fontSize="xs" color={colors.textColorSecondary} w="35px" textAlign="right">
                {progressPercent}%
              </Text>
            </HStack>

            {/* Count Badge */}
            <Badge colorPalette={progressPercent === 100 ? 'green' : 'gray'} size="sm">
              {node.completedCount}/{node.totalCount}
            </Badge>
          </HStack>
        </Flex>

        {/* Children and Alerts */}
        <Collapsible.Root open={isExpanded}>
          <Collapsible.Content>
            {/* Child Nodes */}
            {Array.from(node.children.values())
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(child => renderNode(child, `${path}/${child.name}`))}

            {/* Alerts at this level */}
            {node.alerts.length > 0 && (
              <VStack align="stretch" gap={2} pl={`${paddingLeft + 40}px`} pr={2} py={2}>
                {node.alerts
                  .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                  .map(alert => (
                    <AlertCard
                      key={alert.alertId}
                      alert={alert}
                      onClick={() => onAlertClick(alert)}
                      onQuickComplete={onAlertUpdate}
                      compact
                    />
                  ))}
              </VStack>
            )}
          </Collapsible.Content>
        </Collapsible.Root>
      </Box>
    );
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="300px">
        <Spinner size="xl" color={colors.primaryColor} />
      </Flex>
    );
  }

  if (alerts.length === 0) {
    return (
      <Flex
        direction="column"
        align="center"
        justify="center"
        py={20}
        bg={colors.cardBg}
        borderRadius="lg"
        borderWidth={1}
        borderColor={colors.borderColor}
      >
        <FiFolder size={48} color={colors.textColorSecondary} />
        <Text mt={4} fontSize="lg" color={colors.textColorSecondary}>
          {t('alerts.page.noAlerts', 'No se encontraron alertas')}
        </Text>
      </Flex>
    );
  }

  return (
    <Box
      bg={colors.cardBg}
      borderRadius="lg"
      borderWidth={1}
      borderColor={colors.borderColor}
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        px={4}
        py={3}
        bg={colors.bgColor}
        borderBottomWidth={1}
        borderColor={colors.borderColor}
        align="center"
        justify="space-between"
      >
        <HStack gap={2}>
          <FiFolder color={colors.primaryColor} />
          <Text fontWeight="600" color={colors.textColor}>
            {t('alerts.groupedView.title', 'Vista Agrupada por Etiquetas')}
          </Text>
        </HStack>
        <HStack gap={3}>
          <Text fontSize="sm" color={colors.textColorSecondary}>
            {alerts.length} {t('alerts.total', 'alertas')}
          </Text>
          <Badge colorPalette="green" size="sm">
            {alerts.filter(a => a.status === 'COMPLETED').length} {t('alerts.completed', 'completadas')}
          </Badge>
        </HStack>
      </Flex>

      {/* Tree View */}
      <Box p={2} maxH="600px" overflowY="auto">
        {renderNode(hierarchy)}
      </Box>
    </Box>
  );
};

export default GroupedListView;
