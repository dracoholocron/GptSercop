import {
  Box,
  HStack,
  VStack,
  Text,
  Badge,
  Flex,
  Progress,
  Grid,
  GridItem,
  IconButton,
  Spinner,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiChevronDown,
  FiChevronUp,
  FiCheckCircle,
  FiClock,
  FiAlertTriangle,
  FiPlay,
} from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { getTags, advancedSearch } from '../../services/alertService';
import type { AlertTag, AlertResponse, AlertSearchRequest } from '../../services/alertService';
import { AlertCard } from './AlertCard';

interface TagScheduleViewProps {
  filters: AlertSearchRequest;
  lang: string;
  onAlertClick: (alert: AlertResponse) => void;
  onAlertUpdate: () => void;
}

interface TagStats {
  tag: AlertTag;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
  overdue: number;
  alerts: AlertResponse[];
}

export const TagScheduleView = ({
  filters,
  lang,
  onAlertClick,
  onAlertUpdate,
}: TagScheduleViewProps) => {
  const { t, i18n } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const currentLang = i18n.language === 'en' ? 'en' : 'es';

  const [tags, setTags] = useState<AlertTag[]>([]);
  const [tagStats, setTagStats] = useState<TagStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [untaggedAlerts, setUntaggedAlerts] = useState<AlertResponse[]>([]);

  useEffect(() => {
    loadData();
  }, [filters, lang]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [availableTags, searchResults] = await Promise.all([
        getTags(true),
        advancedSearch({ ...filters, size: 500 }, lang),
      ]);

      setTags(availableTags);

      // Group alerts by tags and calculate stats
      const statsMap = new Map<string, TagStats>();
      const untagged: AlertResponse[] = [];

      // Initialize stats for each tag
      availableTags.forEach(tag => {
        statsMap.set(tag.name, {
          tag,
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0,
          overdue: 0,
          alerts: [],
        });
      });

      // Process each alert
      searchResults.content.forEach(alert => {
        if (!alert.tags || alert.tags.length === 0) {
          untagged.push(alert);
        } else {
          alert.tags.forEach(tagName => {
            const stats = statsMap.get(tagName);
            if (stats) {
              stats.total++;
              stats.alerts.push(alert);

              switch (alert.status) {
                case 'COMPLETED':
                  stats.completed++;
                  break;
                case 'IN_PROGRESS':
                  stats.inProgress++;
                  break;
                case 'PENDING':
                  stats.pending++;
                  break;
              }

              if (alert.overdue) {
                stats.overdue++;
              }
            }
          });
        }
      });

      // Convert to array and sort by total (descending)
      const statsArray = Array.from(statsMap.values())
        .filter(s => s.total > 0)
        .sort((a, b) => b.total - a.total);

      setTagStats(statsArray);
      setUntaggedAlerts(untagged);

      // Expand first 3 tags by default
      const initialExpanded = new Set(statsArray.slice(0, 3).map(s => s.tag.name));
      setExpandedTags(initialExpanded);
    } catch (error) {
      console.error('Error loading tag schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagName: string) => {
    const newExpanded = new Set(expandedTags);
    if (newExpanded.has(tagName)) {
      newExpanded.delete(tagName);
    } else {
      newExpanded.add(tagName);
    }
    setExpandedTags(newExpanded);
  };

  const getTagLabel = (tag: AlertTag): string => {
    if (currentLang === 'en' && tag.nameEn) return tag.nameEn;
    if (currentLang === 'es' && tag.nameEs) return tag.nameEs;
    return tag.name;
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 75) return 'green';
    if (percentage >= 50) return 'blue';
    if (percentage >= 25) return 'yellow';
    return 'red';
  };

  const getStatusIcon = (alert: AlertResponse) => {
    if (alert.status === 'COMPLETED') return <FiCheckCircle color="green" />;
    if (alert.status === 'IN_PROGRESS') return <FiPlay color="blue" />;
    if (alert.overdue) return <FiAlertTriangle color="red" />;
    return <FiClock color="gray" />;
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <Spinner size="xl" color={colors.primaryColor} />
      </Flex>
    );
  }

  if (tagStats.length === 0 && untaggedAlerts.length === 0) {
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
        <FiClock size={48} color={colors.textColorSecondary} />
        <Text mt={4} fontSize="lg" color={colors.textColorSecondary}>
          {t('alerts.schedule.noAlerts', 'No hay alertas para mostrar')}
        </Text>
      </Flex>
    );
  }

  return (
    <VStack align="stretch" gap={4}>
      {/* Summary Stats */}
      <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
        {tagStats.slice(0, 6).map(stats => {
          const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
          return (
            <GridItem key={stats.tag.name}>
              <Box
                bg={colors.cardBg}
                p={4}
                borderRadius="lg"
                borderWidth={1}
                borderColor={colors.borderColor}
                borderLeftWidth={4}
                borderLeftColor={stats.tag.color}
                cursor="pointer"
                _hover={{ transform: 'translateY(-2px)', boxShadow: 'md' }}
                transition="all 0.2s"
                onClick={() => toggleTag(stats.tag.name)}
              >
                <HStack justify="space-between" mb={2}>
                  <HStack gap={2}>
                    <Box w={3} h={3} borderRadius="full" bg={stats.tag.color} />
                    <Text fontWeight="bold" color={colors.textColor} fontSize="sm">
                      {getTagLabel(stats.tag)}
                    </Text>
                  </HStack>
                  <Badge colorPalette={getProgressColor(progress)} fontSize="xs">
                    {progress}%
                  </Badge>
                </HStack>

                <Progress.Root value={progress} size="sm" mb={2}>
                  <Progress.Track bg={colors.borderColor}>
                    <Progress.Range bg={stats.tag.color} />
                  </Progress.Track>
                </Progress.Root>

                <HStack justify="space-between" fontSize="xs" color={colors.textColorSecondary}>
                  <HStack gap={3}>
                    <HStack gap={1}>
                      <FiCheckCircle color="green" size={12} />
                      <Text>{stats.completed}</Text>
                    </HStack>
                    <HStack gap={1}>
                      <FiPlay color="blue" size={12} />
                      <Text>{stats.inProgress}</Text>
                    </HStack>
                    <HStack gap={1}>
                      <FiClock color="gray" size={12} />
                      <Text>{stats.pending}</Text>
                    </HStack>
                  </HStack>
                  {stats.overdue > 0 && (
                    <Badge colorPalette="red" fontSize="2xs">
                      {stats.overdue} {t('alerts.overdue', 'vencidas')}
                    </Badge>
                  )}
                </HStack>
              </Box>
            </GridItem>
          );
        })}
      </Grid>

      {/* Detailed Tag Sections */}
      <VStack align="stretch" gap={3}>
        {tagStats.map(stats => {
          const isExpanded = expandedTags.has(stats.tag.name);
          const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

          return (
            <Box
              key={stats.tag.name}
              bg={colors.cardBg}
              borderRadius="lg"
              borderWidth={1}
              borderColor={colors.borderColor}
              overflow="hidden"
            >
              {/* Tag Header */}
              <Flex
                p={4}
                cursor="pointer"
                onClick={() => toggleTag(stats.tag.name)}
                bg={isExpanded ? colors.activeBg : 'transparent'}
                _hover={{ bg: colors.activeBg }}
                align="center"
                justify="space-between"
              >
                <HStack gap={3}>
                  <Box
                    w={4}
                    h={4}
                    borderRadius="full"
                    bg={stats.tag.color}
                    boxShadow={`0 0 0 2px ${colors.cardBg}, 0 0 0 4px ${stats.tag.color}`}
                  />
                  <VStack align="flex-start" gap={0}>
                    <HStack gap={2}>
                      <Text fontWeight="bold" color={colors.textColor}>
                        {getTagLabel(stats.tag)}
                      </Text>
                      <Badge colorPalette="gray" fontSize="xs">
                        {stats.total} {t('alerts.schedule.alerts', 'alertas')}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {stats.completed} {t('alerts.schedule.completed', 'completadas')} •{' '}
                      {stats.inProgress} {t('alerts.schedule.inProgress', 'en progreso')} •{' '}
                      {stats.pending} {t('alerts.schedule.pending', 'pendientes')}
                    </Text>
                  </VStack>
                </HStack>

                <HStack gap={4}>
                  <Box w="200px">
                    <HStack justify="space-between" mb={1}>
                      <Text fontSize="xs" color={colors.textColorSecondary}>
                        {t('alerts.schedule.progress', 'Progreso')}
                      </Text>
                      <Text fontSize="xs" fontWeight="bold" color={stats.tag.color}>
                        {progress}%
                      </Text>
                    </HStack>
                    <Progress.Root value={progress} size="md">
                      <Progress.Track bg={colors.borderColor} h="8px" borderRadius="full">
                        <Progress.Range bg={stats.tag.color} borderRadius="full" />
                      </Progress.Track>
                    </Progress.Root>
                  </Box>

                  {stats.overdue > 0 && (
                    <Badge colorPalette="red" px={2} py={1}>
                      <HStack gap={1}>
                        <FiAlertTriangle size={12} />
                        <Text>{stats.overdue}</Text>
                      </HStack>
                    </Badge>
                  )}

                  <IconButton
                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    size="sm"
                    variant="ghost"
                  >
                    {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                  </IconButton>
                </HStack>
              </Flex>

              {/* Expanded Content */}
              {isExpanded && (
                <Box p={4} pt={0}>
                  <VStack align="stretch" gap={2}>
                    {/* Status groups */}
                    {['PENDING', 'IN_PROGRESS', 'COMPLETED'].map(status => {
                      const statusAlerts = stats.alerts.filter(a => a.status === status);
                      if (statusAlerts.length === 0) return null;

                      const statusLabel = {
                        PENDING: t('alerts.status.pending', 'Pendientes'),
                        IN_PROGRESS: t('alerts.status.inProgress', 'En Progreso'),
                        COMPLETED: t('alerts.status.completed', 'Completadas'),
                      }[status];

                      const statusColor = {
                        PENDING: 'gray',
                        IN_PROGRESS: 'blue',
                        COMPLETED: 'green',
                      }[status];

                      return (
                        <Box key={status}>
                          <HStack mb={2} mt={2}>
                            <Badge colorPalette={statusColor} fontSize="xs">
                              {statusLabel} ({statusAlerts.length})
                            </Badge>
                            <Box flex={1} h="1px" bg={colors.borderColor} />
                          </HStack>
                          <VStack align="stretch" gap={2} pl={2}>
                            {statusAlerts.map(alert => (
                              <AlertCard
                                key={alert.alertId}
                                alert={alert}
                                compact
                                onClick={() => onAlertClick(alert)}
                                onQuickComplete={onAlertUpdate}
                              />
                            ))}
                          </VStack>
                        </Box>
                      );
                    })}
                  </VStack>
                </Box>
              )}
            </Box>
          );
        })}

        {/* Untagged Alerts Section */}
        {untaggedAlerts.length > 0 && (
          <Box
            bg={colors.cardBg}
            borderRadius="lg"
            borderWidth={1}
            borderColor={colors.borderColor}
            borderStyle="dashed"
            overflow="hidden"
          >
            <Flex
              p={4}
              cursor="pointer"
              onClick={() => toggleTag('_untagged')}
              bg={expandedTags.has('_untagged') ? colors.activeBg : 'transparent'}
              _hover={{ bg: colors.activeBg }}
              align="center"
              justify="space-between"
            >
              <HStack gap={3}>
                <Box w={4} h={4} borderRadius="full" bg={colors.textColorSecondary} />
                <VStack align="flex-start" gap={0}>
                  <HStack gap={2}>
                    <Text fontWeight="bold" color={colors.textColor}>
                      {t('alerts.schedule.untagged', 'Sin etiqueta')}
                    </Text>
                    <Badge colorPalette="gray" fontSize="xs">
                      {untaggedAlerts.length}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color={colors.textColorSecondary}>
                    {t('alerts.schedule.untaggedDesc', 'Alertas sin clasificar')}
                  </Text>
                </VStack>
              </HStack>

              <IconButton
                aria-label={expandedTags.has('_untagged') ? 'Collapse' : 'Expand'}
                size="sm"
                variant="ghost"
              >
                {expandedTags.has('_untagged') ? <FiChevronUp /> : <FiChevronDown />}
              </IconButton>
            </Flex>

            {expandedTags.has('_untagged') && (
              <Box p={4} pt={0}>
                <VStack align="stretch" gap={2}>
                  {untaggedAlerts.map(alert => (
                    <AlertCard
                      key={alert.alertId}
                      alert={alert}
                      compact
                      onClick={() => onAlertClick(alert)}
                      onQuickComplete={onAlertUpdate}
                    />
                  ))}
                </VStack>
              </Box>
            )}
          </Box>
        )}
      </VStack>
    </VStack>
  );
};

export default TagScheduleView;
