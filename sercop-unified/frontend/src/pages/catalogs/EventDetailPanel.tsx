/**
 * EventDetailPanel - Right panel orchestrator with a header and 4 collapsible
 * accordion sections: Event Details, Transitions, Rules, Alert Templates.
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
  Collapsible,
  IconButton,
} from '@chakra-ui/react';
import {
  FiActivity,
  FiGitBranch,
  FiZap,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
} from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import type { EventTypeConfig, EventFlowConfig } from '../../types/operations';
import { getIconComponent } from './eventConfigConstants';
import { EventDetailForm } from './EventDetailForm';
import { EventTransitionsSection } from './EventTransitionsSection';
import { EventRulesTab } from './EventRulesTab';
import { AlertTemplatesTab } from './AlertTemplatesTab';

interface EventDetailPanelProps {
  event: EventTypeConfig | null;
  isCreatingNew: boolean;
  eventTypes: EventTypeConfig[];
  flows: EventFlowConfig[];
  operationType: string;
  language: string;
  onEventSaved: () => void;
  onCancelCreate: () => void;
  onDeleteEvent: (id: number, name: string) => void;
  onFlowSaved: () => void;
  onFlowDeleted: (id: number, name: string) => void;
}

/** Internal accordion section helper */
const AccordionSection = ({
  icon,
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  icon: React.ElementType;
  title: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { getColors } = useTheme();
  const colors = getColors();

  return (
    <Box
      borderWidth="1px"
      borderColor={colors.borderColor}
      borderRadius="lg"
      overflow="hidden"
    >
      <Collapsible.Root open={isOpen} onOpenChange={(e) => setIsOpen(e.open)}>
        <Collapsible.Trigger asChild>
          <Button
            variant="ghost"
            w="100%"
            justifyContent="space-between"
            py={3}
            px={4}
            h="auto"
            borderRadius={0}
            _hover={{ bg: colors.hoverBg }}
          >
            <HStack gap={2}>
              <Icon as={icon} color={colors.primaryColor} />
              <Text fontWeight="semibold" fontSize="sm" color={colors.textColor}>
                {title}
              </Text>
              {badge !== undefined && (
                <Badge colorPalette="blue" variant="subtle" size="sm">
                  {badge}
                </Badge>
              )}
            </HStack>
            <Icon
              as={isOpen ? FiChevronUp : FiChevronDown}
              color={colors.textColorSecondary}
            />
          </Button>
        </Collapsible.Trigger>
        <Collapsible.Content>
          <Box px={4} pb={4} pt={2}>
            {children}
          </Box>
        </Collapsible.Content>
      </Collapsible.Root>
    </Box>
  );
};

export const EventDetailPanel = ({
  event,
  isCreatingNew,
  eventTypes,
  flows,
  operationType,
  language,
  onEventSaved,
  onCancelCreate,
  onDeleteEvent,
  onFlowSaved,
  onFlowDeleted,
}: EventDetailPanelProps) => {
  const { t } = useTranslation();
  const { getColors } = useTheme();
  const colors = getColors();

  // Filter flows for this event
  const eventFlows = useMemo(() => {
    if (!event) return [];
    return flows.filter(
      (f) =>
        f.fromEventCode === event.eventCode || f.toEventCode === event.eventCode
    );
  }, [flows, event]);

  // Count alert templates (simple count via flows — real count comes from AlertTemplatesTab)
  const transitionCount = eventFlows.length;

  if (!event && !isCreatingNew) {
    return (
      <Flex
        justify="center"
        align="center"
        h="300px"
        bg={colors.cardBg}
        borderWidth="1px"
        borderColor={colors.borderColor}
        borderRadius="lg"
      >
        <VStack gap={2}>
          <Icon as={FiActivity} boxSize={10} color={colors.textColorSecondary} />
          <Text color={colors.textColorSecondary} fontSize="sm">
            {t('admin.eventConfig.selectEvent', 'Selecciona un evento de la lista')}
          </Text>
        </VStack>
      </Flex>
    );
  }

  const IconComp = event ? getIconComponent(event.icon) : FiActivity;

  return (
    <VStack align="stretch" gap={3}>
      {/* Header */}
      {event && (
        <Flex
          px={4}
          py={3}
          bg={colors.cardBg}
          borderWidth="1px"
          borderColor={colors.borderColor}
          borderRadius="lg"
          justify="space-between"
          align="center"
        >
          <HStack gap={3}>
            <Flex
              w="36px"
              h="36px"
              borderRadius="full"
              bg={`${event.color || 'blue'}.100`}
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Icon
                as={IconComp}
                boxSize={4}
                color={`${event.color || 'blue'}.600`}
              />
            </Flex>
            <VStack align="start" gap={0}>
              <HStack gap={2}>
                <Badge
                  colorPalette={event.color || 'blue'}
                  variant="subtle"
                  size="sm"
                  fontFamily="mono"
                >
                  {event.eventCode}
                </Badge>
                <Badge
                  colorPalette={event.isActive ? 'green' : 'gray'}
                  size="sm"
                >
                  {event.isActive
                    ? t('admin.eventTypes.active')
                    : t('admin.eventTypes.inactive')}
                </Badge>
              </HStack>
              <Text fontWeight="semibold" fontSize="md" color={colors.textColor}>
                {event.eventName}
              </Text>
            </VStack>
          </HStack>
          <IconButton
            aria-label={t('admin.eventTypes.delete')}
            variant="ghost"
            size="sm"
            colorPalette="red"
            onClick={() => onDeleteEvent(event.id, event.eventName)}
          >
            <Icon as={FiTrash2} />
          </IconButton>
        </Flex>
      )}

      {/* Section 1: Event Details */}
      <AccordionSection
        icon={FiActivity}
        title={t('admin.eventConfig.eventDetails', 'Detalles del Evento')}
        defaultOpen={true}
      >
        <EventDetailForm
          event={event}
          isCreatingNew={isCreatingNew}
          operationType={operationType}
          language={language}
          onSaved={onEventSaved}
          onCancel={onCancelCreate}
        />
      </AccordionSection>

      {/* Sections 2-4 only show when event exists */}
      {event && (
        <>
          {/* Section 2: Transitions */}
          <AccordionSection
            icon={FiGitBranch}
            title={t('admin.eventConfig.tabFlowTransitions', 'Transiciones')}
            badge={transitionCount}
            defaultOpen={true}
          >
            <EventTransitionsSection
              event={event}
              eventTypes={eventTypes}
              flows={eventFlows}
              operationType={operationType}
              language={language}
              onFlowSaved={onFlowSaved}
              onFlowDeleted={onFlowDeleted}
            />
          </AccordionSection>

          {/* Section 3: Event Rules */}
          <AccordionSection
            icon={FiZap}
            title={t('admin.eventConfig.tabEventRules', 'Reglas de Evento')}
            defaultOpen={false}
          >
            <EventRulesTab
              operationType={operationType}
              eventCode={event.eventCode}
            />
          </AccordionSection>

          {/* Section 4: Alert Templates */}
          <AccordionSection
            icon={FiBell}
            title={t('admin.eventConfig.tabAlertTemplates', 'Plantillas de Alerta')}
            defaultOpen={false}
          >
            <AlertTemplatesTab
              operationType={operationType}
              language={language}
              eventCode={event.eventCode}
            />
          </AccordionSection>
        </>
      )}
    </VStack>
  );
};

export default EventDetailPanel;
