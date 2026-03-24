/**
 * EventMasterList - Left panel showing a scrollable, searchable list of events.
 * Includes a button to create new events and a link to the Action Types dialog.
 */
import { useState, useMemo } from 'react';
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Badge,
  Icon,
  Button,
  Input,
  Spinner,
  Separator,
} from '@chakra-ui/react';
import {
  FiPlus,
  FiSearch,
  FiSettings,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { EventTypeConfig } from '../../types/operations';
import { getIconComponent } from './eventConfigConstants';

interface EventMasterListProps {
  eventTypes: EventTypeConfig[];
  selectedEventCode: string | null;
  isCreatingNew: boolean;
  loading: boolean;
  onSelectEvent: (eventCode: string) => void;
  onCreateNew: () => void;
  onOpenActionTypes: () => void;
}

export const EventMasterList = ({
  eventTypes,
  selectedEventCode,
  isCreatingNew,
  loading,
  onSelectEvent,
  onCreateNew,
  onOpenActionTypes,
}: EventMasterListProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return eventTypes;
    const term = search.toLowerCase();
    return eventTypes.filter(
      (et) =>
        et.eventCode.toLowerCase().includes(term) ||
        et.eventName.toLowerCase().includes(term)
    );
  }, [eventTypes, search]);

  return (
    <Box
      position={{ base: 'relative', md: 'sticky' }}
      top={{ base: 'auto', md: '24px' }}
      bg={colors.cardBg}
      borderWidth="1px"
      borderColor={colors.borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      {/* Header */}
      <Flex
        px={4}
        py={3}
        justify="space-between"
        align="center"
        borderBottomWidth="1px"
        borderColor={colors.borderColor}
        bg={colors.bgColor}
      >
        <HStack gap={2}>
          <Text fontWeight="semibold" fontSize="sm" color={colors.textColor}>
            {t('admin.eventConfig.events', 'Eventos')}
          </Text>
          <Badge colorPalette="blue" variant="subtle" size="sm">
            {eventTypes.length}
          </Badge>
        </HStack>
        <Button size="xs" colorPalette="blue" onClick={onCreateNew} disabled={isCreatingNew}>
          <FiPlus />
        </Button>
      </Flex>

      {/* Search */}
      <Box px={3} py={2}>
        <HStack gap={2}>
          <Icon as={FiSearch} color={colors.textColorSecondary} boxSize={4} />
          <Input
            size="sm"
            placeholder={t('common.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            variant="flushed"
          />
        </HStack>
      </Box>

      {/* Event list */}
      <Box
        maxH={{ base: '250px', md: 'calc(100vh - 480px)' }}
        minH="200px"
        overflowY="auto"
      >
        {loading ? (
          <Flex justify="center" py={8}>
            <Spinner size="md" color={colors.primaryColor} />
          </Flex>
        ) : filtered.length === 0 ? (
          <Text
            textAlign="center"
            py={6}
            fontSize="sm"
            color={colors.textColorSecondary}
          >
            {search
              ? t('common.noResults', 'Sin resultados')
              : t('admin.eventTypes.noEventTypes')}
          </Text>
        ) : (
          <VStack gap={0} align="stretch">
            {filtered.map((et) => {
              const isSelected = et.eventCode === selectedEventCode && !isCreatingNew;
              const IconComp = getIconComponent(et.icon);
              return (
                <Box
                  key={et.id}
                  px={3}
                  py={2}
                  cursor="pointer"
                  bg={isSelected ? `${colors.primaryColor}11` : 'transparent'}
                  borderLeftWidth="3px"
                  borderLeftColor={isSelected ? colors.primaryColor : 'transparent'}
                  _hover={{ bg: colors.hoverBg }}
                  onClick={() => onSelectEvent(et.eventCode)}
                  transition="all 0.15s"
                >
                  <HStack gap={2}>
                    <Flex
                      w="28px"
                      h="28px"
                      borderRadius="full"
                      bg={`${et.color || 'blue'}.100`}
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Icon as={IconComp} boxSize={3.5} color={`${et.color || 'blue'}.600`} />
                    </Flex>
                    <VStack align="start" gap={0} flex={1} minW={0}>
                      <Text
                        fontFamily="mono"
                        fontSize="xs"
                        color={colors.textColorSecondary}
                        lineClamp={1}
                      >
                        {et.eventCode}
                      </Text>
                      <Text
                        fontSize="sm"
                        fontWeight={isSelected ? 'semibold' : 'normal'}
                        color={colors.textColor}
                        lineClamp={1}
                      >
                        {et.eventName}
                      </Text>
                    </VStack>
                    {!et.isActive && (
                      <Badge colorPalette="gray" size="sm" variant="subtle">
                        Off
                      </Badge>
                    )}
                  </HStack>
                </Box>
              );
            })}
          </VStack>
        )}
      </Box>

      {/* Footer: Action Types link */}
      <Separator />
      <Box px={3} py={2}>
        <Button
          size="sm"
          variant="ghost"
          w="100%"
          justifyContent="flex-start"
          onClick={onOpenActionTypes}
        >
          <HStack gap={2}>
            <Icon as={FiSettings} />
            <Text fontSize="sm">
              {t('admin.eventConfig.tabActionTypes', 'Action Types')}
            </Text>
          </HStack>
        </Button>
      </Box>
    </Box>
  );
};

export default EventMasterList;
