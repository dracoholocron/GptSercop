/**
 * ActivityHeatmap Component
 * GitHub-style activity calendar showing daily operations
 */

import { Box, Text, HStack, VStack, Tooltip } from '@chakra-ui/react';
import { useTheme } from '../../contexts/ThemeContext';
import type { ActivityHeatmap as ActivityHeatmapType } from '../../types/dashboard';

interface ActivityHeatmapProps {
  data: ActivityHeatmapType[];
}

const LEVEL_COLORS_LIGHT = [
  '#EBEDF0', // 0 - no activity
  '#9BE9A8', // 1
  '#40C463', // 2
  '#30A14E', // 3
  '#216E39', // 4
];

const LEVEL_COLORS_DARK = [
  '#161B22', // 0 - no activity
  '#0E4429', // 1
  '#006D32', // 2
  '#26A641', // 3
  '#39D353', // 4
];

export const ActivityHeatmap = ({ data }: ActivityHeatmapProps) => {
  const { getColors, isDark } = useTheme();
  const colors = getColors();
  const levelColors = isDark ? LEVEL_COLORS_DARK : LEVEL_COLORS_LIGHT;

  // Group data by weeks
  const weeks: ActivityHeatmapType[][] = [];
  let currentWeek: ActivityHeatmapType[] = [];

  // Sort by date
  const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

  sortedData.forEach((day, index) => {
    if (index > 0 && day.dayOfWeek === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <Box
      p={5}
      borderRadius="xl"
      bg={isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)'}
      backdropFilter="blur(10px)"
      borderWidth="1px"
      borderColor={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}
      boxShadow={isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.08)'}
    >
      <Text fontSize="lg" fontWeight="bold" color={colors.textColor} mb={4}>
        Actividad Diaria
      </Text>

      <HStack gap={1} align="start" overflowX="auto" pb={2}>
        {/* Day labels */}
        <VStack gap={1} mr={2}>
          {dayLabels.map((label, i) => (
            <Box key={i} h="12px" display="flex" alignItems="center">
              {i % 2 === 1 && (
                <Text fontSize="xs" color={colors.textColor} opacity={0.5}>
                  {label}
                </Text>
              )}
            </Box>
          ))}
        </VStack>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <VStack key={weekIndex} gap={1}>
            {/* Fill empty days at start of first week */}
            {weekIndex === 0 && week[0]?.dayOfWeek > 0 &&
              Array.from({ length: week[0].dayOfWeek }).map((_, i) => (
                <Box key={`empty-${i}`} w="12px" h="12px" />
              ))
            }
            {week.map((day) => (
              <Tooltip.Root key={day.date}>
                <Tooltip.Trigger asChild>
                  <Box
                    w="12px"
                    h="12px"
                    borderRadius="sm"
                    bg={levelColors[day.level]}
                    cursor="pointer"
                    transition="transform 0.1s"
                    _hover={{ transform: 'scale(1.3)' }}
                  />
                </Tooltip.Trigger>
                <Tooltip.Positioner>
                  <Tooltip.Content
                    bg={isDark ? 'gray.700' : 'gray.800'}
                    color="white"
                    px={2}
                    py={1}
                    borderRadius="md"
                    fontSize="xs"
                  >
                    <Text fontWeight="bold">{day.operationCount} operaciones</Text>
                    <Text opacity={0.8}>{new Date(day.date).toLocaleDateString('es-MX', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                  </Tooltip.Content>
                </Tooltip.Positioner>
              </Tooltip.Root>
            ))}
          </VStack>
        ))}
      </HStack>

      {/* Legend */}
      <HStack justify="flex-end" mt={3} gap={1}>
        <Text fontSize="xs" color={colors.textColor} opacity={0.5} mr={2}>
          Menos
        </Text>
        {levelColors.map((color, i) => (
          <Box key={i} w="12px" h="12px" borderRadius="sm" bg={color} />
        ))}
        <Text fontSize="xs" color={colors.textColor} opacity={0.5} ml={2}>
          Más
        </Text>
      </HStack>
    </Box>
  );
};

export default ActivityHeatmap;
