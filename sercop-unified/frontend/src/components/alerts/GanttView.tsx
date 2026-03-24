import { Box, Flex, Text, VStack, HStack, Badge, Tooltip, Icon } from '@chakra-ui/react';
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FiChevronRight, FiChevronDown, FiCheckCircle, FiClock, FiAlertCircle, FiPlay, FiMove, FiUser } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { advancedSearch, updateAlertTags } from '../../services/alertService';
import type { AlertResponse, AlertSearchRequest } from '../../services/alertService';
import { toaster } from '../ui/toaster';

interface GanttViewProps {
  filters: AlertSearchRequest;
  lang: string;
  onAlertClick: (alert: AlertResponse) => void;
}

// Dynamic hierarchy - tags are used in order:
// Tag[0] = Level 1, Tag[1] = Level 2, Tag[2] = Level 3, etc.
// NO HARDCODED TAGS - all hierarchy is dynamic based on assigned tag order

interface HierarchyNode {
  id: string;
  name: string;
  nameEs: string;
  color: string;
  level: number;
  children: Map<string, HierarchyNode>;
  alerts: AlertResponse[];
  completedCount: number;
  totalCount: number;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return '#22C55E';
    case 'IN_PROGRESS': return '#3B82F6';
    case 'CANCELLED': return '#6B7280';
    default: return '#F59E0B';
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

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'COMPLETED': return 'Completada';
    case 'IN_PROGRESS': return 'En Progreso';
    case 'CANCELLED': return 'Cancelada';
    default: return 'Pendiente';
  }
};

// Get tag detail from alert by tag name
const getTagDetail = (alert: AlertResponse, tagName: string) => {
  return alert.tagDetails?.find(td => td.name === tagName);
};

export const GanttView = ({ filters, lang, onAlertClick }: GanttViewProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [alerts, setAlerts] = useState<AlertResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Drag and Drop state
  const [draggedAlert, setDraggedAlert] = useState<AlertResponse | null>(null);
  const [draggedCategory, setDraggedCategory] = useState<{ node: HierarchyNode; path: string; alerts: AlertResponse[] } | null>(null);
  const [dragOverNode, setDragOverNode] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const loadAlerts = async () => {
      setLoading(true);
      try {
        const searchFilters: AlertSearchRequest = {
          ...filters,
          page: 0,
          size: 100,
        };
        const result = await advancedSearch(searchFilters, lang);
        setAlerts(result.content);
      } catch (error) {
        console.error('Error loading alerts for Gantt:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAlerts();
  }, [filters, lang]);

  const { minDate, dayCount, days } = useMemo(() => {
    if (alerts.length === 0) {
      const today = new Date();
      return {
        minDate: today,
        dayCount: 15,
        days: Array.from({ length: 15 }, (_, i) => {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          return d;
        }),
      };
    }

    const dates = alerts.map(a => new Date(a.scheduledDate));
    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));

    min.setDate(min.getDate() - 1);
    max.setDate(max.getDate() + 1);

    const count = Math.ceil((max.getTime() - min.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const daysArray = Array.from({ length: count }, (_, i) => {
      const d = new Date(min);
      d.setDate(d.getDate() + i);
      return d;
    });

    return { minDate: min, dayCount: count, days: daysArray };
  }, [alerts]);

  // Build hierarchical structure DYNAMICALLY based on tag order
  // Tag[0] = Level 1, Tag[1] = Level 2, Tag[2] = Level 3, etc.
  const hierarchy = useMemo(() => {
    const root: Map<string, HierarchyNode> = new Map();
    const MAX_LEVELS = 4; // Support up to 4 levels of hierarchy

    // Helper to get or create a node at any level
    const getOrCreateNode = (
      parentMap: Map<string, HierarchyNode>,
      tagName: string,
      level: number,
      alert: AlertResponse
    ): HierarchyNode => {
      if (!parentMap.has(tagName)) {
        const tagDetail = getTagDetail(alert, tagName);
        parentMap.set(tagName, {
          id: tagName,
          name: tagName,
          nameEs: tagDetail?.nameEs || formatTagName(tagName),
          color: tagDetail?.color || getDefaultColor(tagName),
          level,
          children: new Map(),
          alerts: [],
          completedCount: 0,
          totalCount: 0,
        });
      }
      return parentMap.get(tagName)!;
    };

    // Process each alert
    alerts.forEach(alert => {
      const tags = alert.tags || [];

      if (tags.length === 0) {
        // No tags - put in "sin-etiqueta"
        const node = getOrCreateNode(root, 'sin-etiqueta', 1, alert);
        node.alerts.push(alert);
        node.totalCount++;
        if (alert.status === 'COMPLETED') node.completedCount++;
        return;
      }

      // Use tags in ORDER to build hierarchy
      // Tag[0] = Level 1, Tag[1] = Level 2, etc.
      let currentMap = root;
      let currentPath = '';
      const levelsToUse = Math.min(tags.length, MAX_LEVELS);

      for (let i = 0; i < levelsToUse; i++) {
        const tagName = tags[i];
        const level = i + 1;
        const node = getOrCreateNode(currentMap, tagName, level, alert);

        // Update path for tracking
        currentPath = currentPath ? `${currentPath}/${tagName}` : tagName;

        // Update counts at this level
        node.totalCount++;
        if (alert.status === 'COMPLETED') node.completedCount++;

        // If this is the last tag, add the alert here
        if (i === levelsToUse - 1 || i === tags.length - 1) {
          node.alerts.push(alert);
        } else {
          // Move to next level
          currentMap = node.children;
        }
      }
    });

    // Convert Maps to arrays and sort
    const convertToArray = (map: Map<string, HierarchyNode>): HierarchyNode[] => {
      const nodes = Array.from(map.values());

      // Sort nodes alphabetically by name (Spanish)
      nodes.sort((a, b) => a.nameEs.localeCompare(b.nameEs));

      // Recursively process children
      nodes.forEach(node => {
        if (node.children.size > 0) {
          const childArray = convertToArray(node.children);
          node.children = new Map(childArray.map(c => [c.id, c]));
        }

        // Sort alerts by date
        node.alerts.sort((a, b) =>
          new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
        );
      });

      return nodes;
    };

    return convertToArray(root);
  }, [alerts]);

  // Auto-expand level 1 nodes on first load
  useEffect(() => {
    if (hierarchy.length > 0 && expandedNodes.size === 0) {
      const level1Ids = new Set(hierarchy.map(n => n.id));
      setExpandedNodes(level1Ids);
    }
  }, [hierarchy]);

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

  // ============================================
  // HELPER: Collect all alerts from a node and its children
  // ============================================
  const collectAllAlerts = useCallback((node: HierarchyNode): AlertResponse[] => {
    let allAlerts = [...node.alerts];
    node.children.forEach(child => {
      allAlerts = allAlerts.concat(collectAllAlerts(child));
    });
    return allAlerts;
  }, []);

  // ============================================
  // DRAG AND DROP HANDLERS
  // ============================================

  const handleDragStart = useCallback((e: React.DragEvent, alert: AlertResponse) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', alert.alertId);
    setDraggedAlert(alert);
    setIsDragging(true);

    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = alert.title.substring(0, 30) + (alert.title.length > 30 ? '...' : '');
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: ${colors.primaryColor};
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, [colors.primaryColor]);

  const handleDragEnd = useCallback(() => {
    setDraggedAlert(null);
    setDraggedCategory(null);
    setDragOverNode(null);
    setIsDragging(false);
  }, []);

  // Handler for dragging a category (level 2+)
  const handleCategoryDragStart = useCallback((e: React.DragEvent, node: HierarchyNode, nodePath: string) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `category:${nodePath}`);

    const allAlerts = collectAllAlerts(node);
    setDraggedCategory({ node, path: nodePath, alerts: allAlerts });
    setIsDragging(true);

    // Create custom drag image
    const dragImage = document.createElement('div');
    dragImage.textContent = `${node.nameEs} (${allAlerts.length} alertas)`;
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      padding: 8px 12px;
      background: ${node.color};
      color: white;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      max-width: 250px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  }, [collectAllAlerts]);

  const handleDragOver = useCallback((e: React.DragEvent, nodePath: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverNode(nodePath);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the actual element (not entering a child)
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverNode(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverNode(null);
    setIsDragging(false);

    // Parse target path to get the new tag hierarchy
    // e.g., "operaciones/soporte" -> ['operaciones', 'soporte']
    const targetTags = targetPath.split('/').filter(Boolean);

    // Handle category drop (move all alerts in the category)
    if (draggedCategory) {
      const { alerts: categoryAlerts, path: sourcePath, node: draggedNode } = draggedCategory;
      const sourceTags = sourcePath.split('/').filter(Boolean);

      // Don't drop on self or child of self
      if (targetPath === sourcePath || targetPath.startsWith(sourcePath + '/')) {
        setDraggedCategory(null);
        return;
      }

      // The category being dragged (last tag in source path)
      const draggedCategoryTag = sourceTags[sourceTags.length - 1];

      // For each alert in the category, compute new tags
      // Keep the dragged category and its children, prepend target path
      const updates: Promise<void>[] = [];
      const updatedAlerts: { alertId: string; newTags: string[] }[] = [];

      for (const alert of categoryAlerts) {
        const currentTags = alert.tags || [];
        let newTags: string[];

        // Find where the dragged category starts in the alert's tags
        const draggedIndex = currentTags.indexOf(draggedCategoryTag);

        if (draggedIndex >= 0) {
          // Keep the dragged category and everything after it (sub-categories)
          const tagsToKeep = currentTags.slice(draggedIndex);
          newTags = [...targetTags, ...tagsToKeep];
        } else {
          // Fallback: target + the dragged category
          newTags = [...targetTags, draggedCategoryTag];
        }

        updatedAlerts.push({ alertId: alert.alertId, newTags });
        updates.push(updateAlertTags(alert.alertId, newTags).then(() => {}));
      }

      try {
        await Promise.all(updates);

        // Update local state
        setAlerts(prev => prev.map(a => {
          const update = updatedAlerts.find(u => u.alertId === a.alertId);
          return update ? { ...a, tags: update.newTags } : a;
        }));

        const newPath = [...targetTags, draggedCategoryTag].join(' → ');
        toaster.success({
          title: t('alerts.gantt.categoryMoved', 'Categoría movida'),
          description: `${categoryAlerts.length} alertas movidas a: ${newPath}`,
        });
      } catch (error) {
        console.error('Error moving category:', error);
        toaster.error({
          title: t('alerts.error', 'Error'),
          description: t('alerts.gantt.moveError', 'No se pudo mover la categoría'),
        });
      }

      setDraggedCategory(null);
      return;
    }

    // Handle single alert drop
    if (!draggedAlert) return;

    // Don't update if tags are the same
    const currentTags = draggedAlert.tags || [];
    if (JSON.stringify(targetTags) === JSON.stringify(currentTags)) {
      setDraggedAlert(null);
      return;
    }

    try {
      await updateAlertTags(draggedAlert.alertId, targetTags);

      // Update local state
      setAlerts(prev => prev.map(a =>
        a.alertId === draggedAlert.alertId
          ? { ...a, tags: targetTags }
          : a
      ));

      toaster.success({
        title: t('alerts.gantt.moved', 'Alerta movida'),
        description: t('alerts.gantt.movedTo', 'Movida a: ') + targetTags.join(' → '),
      });
    } catch (error: unknown) {
      console.error('Error updating alert tags:', error);

      // Extract error message
      let errorMessage = t('alerts.gantt.moveError', 'No se pudo mover la alerta');
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 403) {
          errorMessage = t('alerts.gantt.permissionError', 'No tiene permisos para mover esta alerta');
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }

      toaster.error({
        title: t('alerts.error', 'Error'),
        description: errorMessage,
      });
    }

    setDraggedAlert(null);
  }, [draggedAlert, draggedCategory, t]);

  const getPositionForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const diffDays = Math.floor((date.getTime() - minDate.getTime()) / (24 * 60 * 60 * 1000));
    return diffDays;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const DAY_WIDTH = 50;
  const ROW_HEIGHT = 32;
  const HEADER_HEIGHT = 60;
  const TASK_NAME_WIDTH = 320;

  // Recursive function to render node labels (left panel)
  const renderNodeLabel = (node: HierarchyNode, parentPath: string): React.ReactNode => {
    const nodePath = parentPath ? `${parentPath}/${node.id}` : node.id;
    const isExpanded = expandedNodes.has(nodePath);
    const indent = (node.level - 1) * 20;
    const hasChildren = node.children.size > 0 || node.alerts.length > 0;
    const isLevel1 = node.level === 1;
    const isDropTarget = dragOverNode === nodePath;
    const isDraggedFromHere = draggedAlert && (draggedAlert.tags || []).join('/') === nodePath;
    const isCategoryBeingDragged = draggedCategory?.path === nodePath;
    // Categories level 2+ can be dragged
    const canDragCategory = node.level >= 2 && node.totalCount > 0;

    return (
      <Box key={nodePath}>
        {/* Node Header Row - DROP ZONE and DRAG SOURCE for categories */}
        <Flex
          h={`${ROW_HEIGHT}px`}
          align="center"
          px={2}
          pl={`${8 + indent}px`}
          bg={isDropTarget
            ? `${colors.primaryColor}25`
            : isCategoryBeingDragged
              ? `${node.color}20`
              : isLevel1
                ? colors.activeBg
                : 'transparent'
          }
          borderBottomWidth={1}
          borderRightWidth={2}
          borderColor={isDropTarget ? colors.primaryColor : colors.borderColor}
          borderLeftWidth={isDropTarget ? 3 : 0}
          borderLeftColor={colors.primaryColor}
          cursor={canDragCategory ? 'grab' : hasChildren ? 'pointer' : 'default'}
          onClick={(e) => {
            // Only toggle if not dragging
            if (!isDragging && hasChildren) {
              toggleNode(nodePath);
            }
          }}
          _hover={{ bg: isDragging ? `${colors.primaryColor}15` : colors.hoverBg }}
          transition="all 0.15s ease"
          opacity={isCategoryBeingDragged ? 0.5 : 1}
          // Drop zone handlers
          onDragOver={(e) => handleDragOver(e, nodePath)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nodePath)}
          // Drag source handlers for categories (level 2+)
          draggable={canDragCategory}
          onDragStart={canDragCategory ? (e) => handleCategoryDragStart(e, node, nodePath) : undefined}
          onDragEnd={handleDragEnd}
        >
          <Box color={colors.textColorSecondary} mr={2} w={4}>
            {hasChildren && (
              isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />
            )}
          </Box>
          {/* Drag handle for categories level 2+ */}
          {canDragCategory && (
            <Box
              color={colors.textColorSecondary}
              mr={1}
              cursor="grab"
              _hover={{ color: colors.primaryColor }}
              title={`Arrastrar ${node.nameEs} (${node.totalCount} alertas)`}
            >
              <FiMove size={12} />
            </Box>
          )}
          <Box
            w={isLevel1 ? 3 : 2}
            h={isLevel1 ? 3 : 2}
            borderRadius="sm"
            bg={node.color}
            mr={2}
            flexShrink={0}
          />
          <Text
            fontSize={isLevel1 ? 'sm' : 'xs'}
            fontWeight={isLevel1 ? 'bold' : 'semibold'}
            color={colors.textColor}
            flex={1}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
          >
            {node.nameEs}
          </Text>
          {isDropTarget && (
            <Badge colorPalette="blue" size="sm" mr={2}>
              <FiMove size={10} style={{ marginRight: 4 }} />
              Soltar aquí
            </Badge>
          )}
          {isCategoryBeingDragged && (
            <Badge colorPalette="purple" size="sm" mr={2}>
              Moviendo...
            </Badge>
          )}
          <Badge
            fontSize="xs"
            colorPalette={node.completedCount === node.totalCount ? 'green' : 'gray'}
          >
            {node.completedCount}/{node.totalCount}
          </Badge>
        </Flex>

        {/* Recursively render children */}
        {isExpanded && Array.from(node.children.values()).map(child =>
          renderNodeLabel(child, nodePath)
        )}

        {/* Render alerts under this node - DRAGGABLE */}
        {isExpanded && node.alerts.map(alert => {
          const isBeingDragged = draggedAlert?.alertId === alert.alertId;

          return (
            <Flex
              key={alert.alertId}
              h={`${ROW_HEIGHT}px`}
              align="center"
              px={2}
              pl={`${8 + indent + 20}px`}
              borderBottomWidth={1}
              borderRightWidth={2}
              borderColor={colors.borderColor}
              cursor="grab"
              onClick={() => !isDragging && onAlertClick(alert)}
              _hover={{ bg: colors.hoverBg }}
              title={`${alert.title} (Arrastra para mover)`}
              opacity={isBeingDragged ? 0.5 : 1}
              transition="opacity 0.15s ease"
              // Drag handlers
              draggable
              onDragStart={(e) => handleDragStart(e, alert)}
              onDragEnd={handleDragEnd}
            >
              <Box
                color={colors.textColorSecondary}
                mr={1}
                cursor="grab"
                _hover={{ color: colors.primaryColor }}
              >
                <FiMove size={12} />
              </Box>
              <Box color={getStatusColor(alert.status)} mr={2} flexShrink={0}>
                {getStatusIcon(alert.status)}
              </Box>
              <Text
                fontSize="xs"
                color={alert.status === 'COMPLETED' ? colors.textColorSecondary : colors.textColor}
                textDecoration={alert.status === 'COMPLETED' ? 'line-through' : 'none'}
                overflow="hidden"
                textOverflow="ellipsis"
                whiteSpace="nowrap"
                flex={1}
              >
                {alert.title.replace('TEST: ', '')}
              </Text>
              <Badge
                fontSize="9px"
                px={1.5}
                py={0}
                borderRadius="full"
                bg={getStatusColor(alert.status)}
                color="white"
                flexShrink={0}
                ml={1}
                lineHeight="16px"
              >
                {getStatusLabel(alert.status)}
              </Badge>
              {alert.createdBy && (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <HStack gap={1} flexShrink={0} ml={1}>
                      <FiUser size={10} color={colors.textColorSecondary} />
                      <Text fontSize="xs" color={colors.textColorSecondary} maxW="80px" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                        {alert.createdBy}
                      </Text>
                    </HStack>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Content bg={colors.cardBg} color={colors.textColor} p={2} borderRadius="md" boxShadow="lg">
                      <Text fontSize="xs">{t('alerts.createdBy', 'Creada por')}: {alert.createdBy}</Text>
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
              )}
            </Flex>
          );
        })}
      </Box>
    );
  };

  // Recursive function to render node timeline (right panel)
  const renderNodeTimeline = (node: HierarchyNode, parentPath: string): React.ReactNode => {
    const nodePath = parentPath ? `${parentPath}/${node.id}` : node.id;
    const isExpanded = expandedNodes.has(nodePath);
    const isLevel1 = node.level === 1;
    const isDropTarget = dragOverNode === nodePath;

    return (
      <Box key={nodePath} minW={`${dayCount * DAY_WIDTH}px`}>
        {/* Node progress bar row - also a DROP ZONE */}
        <Box
          h={`${ROW_HEIGHT}px`}
          borderBottomWidth={1}
          borderColor={isDropTarget ? colors.primaryColor : colors.borderColor}
          bg={isDropTarget
            ? `${colors.primaryColor}25`
            : isLevel1
              ? colors.activeBg
              : 'transparent'
          }
          position="relative"
          transition="all 0.15s ease"
          onDragOver={(e) => handleDragOver(e, nodePath)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, nodePath)}
        >
          {node.totalCount > 0 && (
            <Box
              position="absolute"
              top="50%"
              transform="translateY(-50%)"
              left={2}
              right={2}
              h={isLevel1 ? 3 : 2}
              bg={colors.borderColor}
              borderRadius="full"
              overflow="hidden"
            >
              <Box
                h="100%"
                w={`${(node.completedCount / node.totalCount) * 100}%`}
                bg={node.color}
                borderRadius="full"
              />
            </Box>
          )}
        </Box>

        {/* Recursively render children timelines */}
        {isExpanded && Array.from(node.children.values()).map(child =>
          renderNodeTimeline(child, nodePath)
        )}

        {/* Render alert bars - DRAGGABLE */}
        {isExpanded && node.alerts.map(alert => {
          const position = getPositionForDate(alert.scheduledDate);
          const isBeingDragged = draggedAlert?.alertId === alert.alertId;

          return (
            <Box
              key={alert.alertId}
              h={`${ROW_HEIGHT}px`}
              borderBottomWidth={1}
              borderColor={colors.borderColor}
              position="relative"
              _hover={{ bg: colors.hoverBg }}
              opacity={isBeingDragged ? 0.5 : 1}
              transition="opacity 0.15s ease"
            >
              {/* Today line */}
              {days.some(d => isToday(d)) && (
                <Box
                  position="absolute"
                  top={0}
                  bottom={0}
                  left={`${days.findIndex(d => isToday(d)) * DAY_WIDTH + DAY_WIDTH / 2}px`}
                  w="2px"
                  bg={colors.primaryColor}
                  opacity={0.3}
                />
              )}
              {/* Task bar - DRAGGABLE */}
              <Box
                position="absolute"
                top="50%"
                transform="translateY(-50%)"
                left={`${position * DAY_WIDTH + 4}px`}
                w={`${DAY_WIDTH - 8}px`}
                h="16px"
                bg={getStatusColor(alert.status)}
                borderRadius="md"
                cursor="grab"
                onClick={() => !isDragging && onAlertClick(alert)}
                opacity={alert.status === 'COMPLETED' ? 0.7 : 1}
                display="flex"
                alignItems="center"
                justifyContent="center"
                _hover={{ transform: 'translateY(-50%) scale(1.1)', boxShadow: 'md' }}
                transition="all 0.15s ease"
                draggable
                onDragStart={(e) => handleDragStart(e, alert)}
                onDragEnd={handleDragEnd}
              >
                {alert.status === 'COMPLETED' && <FiCheckCircle color="white" size={10} />}
              </Box>
            </Box>
          );
        })}
      </Box>
    );
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Text color={colors.textColorSecondary}>{t('common.loading', 'Cargando...')}</Text>
      </Flex>
    );
  }

  if (alerts.length === 0) {
    return (
      <Flex justify="center" align="center" h="400px" direction="column" gap={2}>
        <FiClock size={48} color={colors.textColorSecondary} />
        <Text color={colors.textColorSecondary}>{t('alerts.noAlerts', 'No hay alertas para mostrar')}</Text>
      </Flex>
    );
  }

  // Render a node row (level 1 or level 2)
  const renderNodeRow = (node: HierarchyNode, parentId: string = '') => {
    const nodeId = parentId ? `${parentId}/${node.id}` : node.id;
    const isExpanded = expandedNodes.has(nodeId);
    const indent = node.level === 1 ? 0 : 20;

    return (
      <Box key={nodeId}>
        {/* Node Header Row */}
        <Flex>
          {/* Left side - Name */}
          <Flex
            w={`${TASK_NAME_WIDTH}px`}
            h={`${ROW_HEIGHT}px`}
            align="center"
            px={2}
            pl={`${8 + indent}px`}
            bg={node.level === 1 ? colors.activeBg : 'transparent'}
            borderBottomWidth={1}
            borderRightWidth={2}
            borderColor={colors.borderColor}
            cursor="pointer"
            onClick={() => toggleNode(nodeId)}
            _hover={{ bg: colors.hoverBg }}
            flexShrink={0}
          >
            <Box color={colors.textColorSecondary} mr={2}>
              {(node.children.length > 0 || node.alerts.length > 0) && (
                isExpanded ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />
              )}
            </Box>
            <Box
              w={3}
              h={3}
              borderRadius="sm"
              bg={node.color}
              mr={2}
              flexShrink={0}
            />
            <Text
              fontSize={node.level === 1 ? 'sm' : 'xs'}
              fontWeight={node.level === 1 ? 'bold' : 'semibold'}
              color={colors.textColor}
              flex={1}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
            >
              {node.nameEs}
            </Text>
            <Badge
              fontSize="xs"
              colorPalette={node.completedCount === node.totalCount ? 'green' : 'gray'}
              ml={2}
            >
              {node.completedCount}/{node.totalCount}
            </Badge>
          </Flex>

          {/* Right side - Timeline (progress bar for group) */}
          <Box
            flex={1}
            h={`${ROW_HEIGHT}px`}
            borderBottomWidth={1}
            borderColor={colors.borderColor}
            bg={node.level === 1 ? colors.activeBg : 'transparent'}
            minW={`${dayCount * DAY_WIDTH}px`}
            position="relative"
          >
            {node.totalCount > 0 && (
              <Box
                position="absolute"
                top="50%"
                transform="translateY(-50%)"
                left={2}
                right={2}
                h={node.level === 1 ? 3 : 2}
                bg={colors.borderColor}
                borderRadius="full"
                overflow="hidden"
              >
                <Box
                  h="100%"
                  w={`${(node.completedCount / node.totalCount) * 100}%`}
                  bg={node.color}
                  borderRadius="full"
                  transition="width 0.3s"
                />
              </Box>
            )}
          </Box>
        </Flex>

        {/* Children nodes (level 2) */}
        {isExpanded && node.children.map(child => renderNodeRow(child, nodeId))}

        {/* Alerts directly under this node */}
        {isExpanded && node.alerts.map(alert => renderAlertRow(alert, node.level + 1))}
      </Box>
    );
  };

  // Render an alert row
  const renderAlertRow = (alert: AlertResponse, level: number) => {
    const indent = level * 20;
    const position = getPositionForDate(alert.scheduledDate);

    return (
      <Flex key={alert.alertId}>
        {/* Left side - Alert name */}
        <Flex
          w={`${TASK_NAME_WIDTH}px`}
          h={`${ROW_HEIGHT}px`}
          align="center"
          px={2}
          pl={`${8 + indent}px`}
          borderBottomWidth={1}
          borderRightWidth={2}
          borderColor={colors.borderColor}
          cursor="pointer"
          onClick={() => onAlertClick(alert)}
          _hover={{ bg: colors.hoverBg }}
          flexShrink={0}
          title={alert.title}
        >
          <Box color={getStatusColor(alert.status)} mr={2} flexShrink={0}>
            {getStatusIcon(alert.status)}
          </Box>
          <Text
            fontSize="xs"
            color={alert.status === 'COMPLETED' ? colors.textColorSecondary : colors.textColor}
            textDecoration={alert.status === 'COMPLETED' ? 'line-through' : 'none'}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            flex={1}
          >
            {alert.title.replace('TEST: ', '')}
          </Text>
          <Badge
            fontSize="9px"
            px={1.5}
            py={0}
            borderRadius="full"
            bg={getStatusColor(alert.status)}
            color="white"
            flexShrink={0}
            ml={1}
            lineHeight="16px"
          >
            {getStatusLabel(alert.status)}
          </Badge>
        </Flex>

        {/* Right side - Task bar */}
        <Box
          flex={1}
          h={`${ROW_HEIGHT}px`}
          borderBottomWidth={1}
          borderColor={colors.borderColor}
          minW={`${dayCount * DAY_WIDTH}px`}
          position="relative"
          _hover={{ bg: colors.hoverBg }}
        >
          {/* Today line */}
          {days.some(d => isToday(d)) && (
            <Box
              position="absolute"
              top={0}
              bottom={0}
              left={`${days.findIndex(d => isToday(d)) * DAY_WIDTH + DAY_WIDTH / 2}px`}
              w="2px"
              bg={colors.primaryColor}
              opacity={0.3}
              zIndex={1}
            />
          )}

          {/* Task Bar */}
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <Box
                position="absolute"
                top="50%"
                transform="translateY(-50%)"
                left={`${position * DAY_WIDTH + 4}px`}
                w={`${DAY_WIDTH - 8}px`}
                h="18px"
                bg={getStatusColor(alert.status)}
                borderRadius="md"
                cursor="pointer"
                onClick={() => onAlertClick(alert)}
                opacity={alert.status === 'COMPLETED' ? 0.7 : 1}
                _hover={{ opacity: 0.9, transform: 'translateY(-50%) scale(1.05)' }}
                transition="all 0.2s"
                display="flex"
                alignItems="center"
                justifyContent="center"
                boxShadow="sm"
              >
                {alert.status === 'COMPLETED' && (
                  <FiCheckCircle color="white" size={10} />
                )}
              </Box>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content
                bg={colors.cardBg}
                color={colors.textColor}
                p={2}
                borderRadius="md"
                boxShadow="lg"
                maxW="300px"
              >
                <VStack align="flex-start" gap={1}>
                  <HStack gap={2}>
                    <Text fontWeight="bold" fontSize="sm">{alert.title}</Text>
                    <Badge
                      fontSize="9px"
                      px={1.5}
                      py={0}
                      borderRadius="full"
                      bg={getStatusColor(alert.status)}
                      color="white"
                      lineHeight="16px"
                    >
                      {getStatusLabel(alert.status)}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color={colors.textColorSecondary}>{alert.scheduledDate}</Text>
                  {alert.createdBy && (
                    <HStack gap={1}>
                      <FiUser size={10} />
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {t('alerts.createdBy', 'Creada por')}: {alert.createdBy}
                      </Text>
                    </HStack>
                  )}
                  <HStack gap={1} flexWrap="wrap">
                    {alert.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} fontSize="xs" colorPalette="purple">{tag}</Badge>
                    ))}
                  </HStack>
                </VStack>
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        </Box>
      </Flex>
    );
  };

  return (
    <Box
      bg={colors.cardBg}
      borderRadius="lg"
      borderWidth={1}
      borderColor={colors.borderColor}
      overflow="hidden"
    >
      {/* Summary Header */}
      <Flex
        p={4}
        borderBottomWidth={1}
        borderColor={colors.borderColor}
        justify="space-between"
        align="center"
        bg={colors.bgColor}
      >
        <VStack align="flex-start" gap={1}>
          <HStack gap={2}>
            <Text fontWeight="bold" color={colors.textColor}>
              {t('alerts.gantt.title', 'Diagrama de Gantt - Plan de Ejecución')}
            </Text>
            {isDragging && (
              <Badge colorPalette="blue" size="sm" animation="pulse">
                <FiMove size={12} style={{ marginRight: 4 }} />
                {t('alerts.gantt.dragging', 'Arrastrando...')}
              </Badge>
            )}
          </HStack>
          <HStack gap={2}>
            <Text fontSize="sm" color={colors.textColorSecondary}>
              {alerts.length} {t('alerts.gantt.tasks', 'tareas')} · {hierarchy.length} {t('alerts.gantt.categories', 'categorías')}
            </Text>
            <Text fontSize="xs" color={colors.textColorSecondary} fontStyle="italic">
              • {t('alerts.gantt.dragHint', 'Arrastra alertas para reorganizar')}
            </Text>
          </HStack>
        </VStack>
        <HStack gap={4}>
          <HStack gap={1}>
            <Box w={3} h={3} borderRadius="sm" bg="#F59E0B" />
            <Text fontSize="xs" color={colors.textColorSecondary}>{t('alerts.status.pending', 'Pendiente')}</Text>
          </HStack>
          <HStack gap={1}>
            <Box w={3} h={3} borderRadius="sm" bg="#3B82F6" />
            <Text fontSize="xs" color={colors.textColorSecondary}>{t('alerts.status.inProgress', 'En Progreso')}</Text>
          </HStack>
          <HStack gap={1}>
            <Box w={3} h={3} borderRadius="sm" bg="#22C55E" />
            <Text fontSize="xs" color={colors.textColorSecondary}>{t('alerts.status.completed', 'Completada')}</Text>
          </HStack>
        </HStack>
      </Flex>

      {/* Gantt Chart */}
      <Flex overflow="hidden">
        {/* Left Panel - Task Names (fixed) */}
        <Box
          w={`${TASK_NAME_WIDTH}px`}
          flexShrink={0}
          bg={colors.bgColor}
          overflow="hidden"
        >
          {/* Header */}
          <Box
            h={`${HEADER_HEIGHT}px`}
            borderBottomWidth={1}
            borderRightWidth={2}
            borderColor={colors.borderColor}
            p={2}
            display="flex"
            alignItems="flex-end"
          >
            <Text fontWeight="bold" fontSize="sm" color={colors.textColor}>
              {t('alerts.gantt.hierarchy', 'Categoría / Tarea')}
            </Text>
          </Box>
        </Box>

        {/* Right Panel - Timeline (scrollable) */}
        <Box flex={1} overflowX="auto" ref={scrollContainerRef}>
          {/* Date Headers */}
          <Flex
            h={`${HEADER_HEIGHT}px`}
            borderBottomWidth={1}
            borderColor={colors.borderColor}
            minW={`${dayCount * DAY_WIDTH}px`}
          >
            {days.map((day, idx) => (
              <Flex
                key={idx}
                w={`${DAY_WIDTH}px`}
                flexShrink={0}
                direction="column"
                align="center"
                justify="flex-end"
                pb={1}
                borderRightWidth={1}
                borderColor={colors.borderColor}
                bg={isToday(day) ? `${colors.primaryColor}15` : isWeekend(day) ? colors.activeBg : 'transparent'}
              >
                <Text
                  fontSize="xs"
                  color={isToday(day) ? colors.primaryColor : colors.textColorSecondary}
                  fontWeight={isToday(day) ? 'bold' : 'normal'}
                >
                  {day.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { weekday: 'short' })}
                </Text>
                <Text
                  fontSize="sm"
                  color={isToday(day) ? colors.primaryColor : colors.textColor}
                  fontWeight={isToday(day) ? 'bold' : 'normal'}
                >
                  {day.getDate()}
                </Text>
                <Text fontSize="xs" color={colors.textColorSecondary}>
                  {day.toLocaleDateString(lang === 'en' ? 'en-US' : 'es-ES', { month: 'short' })}
                </Text>
              </Flex>
            ))}
          </Flex>
        </Box>
      </Flex>

      {/* Scrollable content area */}
      <Flex maxH="600px" overflow="auto">
        {/* Left Panel - Names */}
        <Box w={`${TASK_NAME_WIDTH}px`} flexShrink={0} bg={colors.bgColor}>
          {hierarchy.map(node => renderNodeLabel(node, ''))}
        </Box>

        {/* Right Panel - Timeline bars */}
        <Box flex={1} overflowX="auto">
          {hierarchy.map(node => renderNodeTimeline(node, ''))}
        </Box>
      </Flex>

      {/* Footer with overall progress */}
      <Flex
        p={4}
        borderTopWidth={1}
        borderColor={colors.borderColor}
        bg={colors.bgColor}
        align="center"
        gap={4}
      >
        <Text fontSize="sm" color={colors.textColorSecondary}>
          {t('alerts.gantt.overallProgress', 'Progreso total')}:
        </Text>
        <Box flex={1} maxW="400px" h={2} bg={colors.borderColor} borderRadius="full" overflow="hidden">
          <Box
            h="100%"
            w={`${(alerts.filter(a => a.status === 'COMPLETED').length / alerts.length) * 100}%`}
            bg="green.500"
            borderRadius="full"
            transition="width 0.3s"
          />
        </Box>
        <Text fontSize="sm" fontWeight="bold" color={colors.textColor}>
          {Math.round((alerts.filter(a => a.status === 'COMPLETED').length / alerts.length) * 100)}%
        </Text>
        <Text fontSize="sm" color={colors.textColorSecondary}>
          ({alerts.filter(a => a.status === 'COMPLETED').length}/{alerts.length} {t('alerts.gantt.completed', 'completadas')})
        </Text>
      </Flex>
    </Box>
  );
};

// Helper functions
function formatTagName(tag: string): string {
  return tag
    .replace('modulo-', '')
    .replace('plan-', '')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getDefaultColor(tag: string): string {
  if (tag.includes('prueba') || tag.includes('test')) return '#8B5CF6';
  if (tag.includes('operacion')) return '#3B82F6';
  if (tag.includes('backoffice')) return '#475569';
  if (tag.includes('lc-import')) return '#3B82F6';
  if (tag.includes('lc-export')) return '#2563EB';
  if (tag.includes('garantia')) return '#1D4ED8';
  if (tag.includes('cobranza')) return '#0EA5E9';
  if (tag.includes('alerta')) return '#EF4444';
  if (tag.includes('dashboard')) return '#14B8A6';
  if (tag.includes('usuario')) return '#EC4899';
  if (tag.includes('cliente')) return '#10B981';
  return '#6B7280';
}

export default GanttView;
