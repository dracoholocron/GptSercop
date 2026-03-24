/**
 * FlowDiagram - Reusable flow diagram component for visualizing event flows
 * Enhanced version with bank role icons and improved visual styling
 */
import { useMemo, useCallback } from 'react';
import {
  Box,
  Flex,
  Text,
  Icon,
  Badge,
  VStack,
  HStack,
  Tooltip,
} from '@chakra-ui/react';
import {
  FiArrowRight,
  FiArrowDown,
  FiCheck,
  FiCircle,
  FiAlertCircle,
  FiClock,
  FiSend,
  FiFileText,
  FiDollarSign,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
  FiUnlock,
  FiAlertTriangle,
  FiArchive,
  FiCornerUpLeft,
  FiUserCheck,
  FiUsers,
  FiGlobe,
} from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { RiShieldCheckLine, RiMoneyDollarCircleLine } from 'react-icons/ri';
import { TbBuildingBank, TbCertificate, TbReceipt, TbUserDollar } from 'react-icons/tb';
import { LuFactory } from 'react-icons/lu';
import type { IconType } from 'react-icons';
import { useTheme } from '../../contexts/ThemeContext';

// Icon mapping for event types
const iconMap: Record<string, IconType> = {
  FiSend: FiSend,
  FiEdit: FiEdit,
  FiEdit2: FiEdit,
  FiCheckCircle: FiCheckCircle,
  FiFileText: FiFileText,
  FiAlertTriangle: FiAlertTriangle,
  FiCheck: FiCheck,
  FiDollarSign: FiDollarSign,
  FiXCircle: FiXCircle,
  FiCalendar: FiCalendar,
  FiAlertCircle: FiAlertCircle,
  FiUnlock: FiUnlock,
  FiClock: FiClock,
  FiArchive: FiArchive,
  FiCornerUpLeft: FiCornerUpLeft,
  FiUserCheck: FiUserCheck,
};

// Role icons mapping - distinctive icons for each participant type
const getRoleIcon = (role?: string): IconType => {
  if (!role) return FiUsers;
  const roleUpper = role.toUpperCase();
  if (roleUpper.includes('ISSUING')) return HiOutlineBuildingLibrary;
  if (roleUpper.includes('ADVISING')) return TbBuildingBank;
  if (roleUpper.includes('CONFIRMING')) return RiShieldCheckLine;
  if (roleUpper.includes('REIMBURSING')) return RiMoneyDollarCircleLine;
  if (roleUpper.includes('COLLECTING')) return TbReceipt;
  if (roleUpper.includes('PRESENTING')) return TbCertificate;
  if (roleUpper.includes('BENEFICIARY')) return TbUserDollar;
  if (roleUpper.includes('APPLICANT')) return LuFactory;
  return FiGlobe;
};

export interface FlowNode {
  id: string;
  code: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  stage?: string;
  status?: string;
  isStart?: boolean;
  isEnd?: boolean;
  isCurrent?: boolean;
  isCompleted?: boolean;
  isPending?: boolean;
  outboundMessage?: string;
  inboundMessage?: string;
  requiresApproval?: boolean;
  sequence?: number;
  // Fields for message direction
  messageSender?: string;
  messageReceiver?: string;
  ourRole?: string;
  requiresSwiftMessage?: boolean;
  eventCategory?: string;
  // Initial event configuration
  isInitialEvent?: boolean;
  initialEventRole?: string;
  // Execution timestamps
  completedAt?: string;
  executedBy?: string;
}

export interface FlowEdge {
  from: string;
  to: string;
  label?: string;
  isRequired?: boolean;
  isOptional?: boolean;
  condition?: string;
}

export interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  direction?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showMessages?: boolean;
  interactive?: boolean;
  onNodeClick?: (node: FlowNode) => void;
  onNodeHover?: (node: FlowNode | null) => void;
  selectedNodeId?: string;
  highlightPath?: string[];
  compact?: boolean;
}

const getNodeColor = (node: FlowNode) => {
  if (node.isCurrent) return 'blue';
  if (node.isCompleted) return 'green';
  if (node.isPending) return 'gray';
  if (node.isEnd) return 'red';
  return node.color || 'blue';
};

const getIconComponent = (iconName?: string): IconType => {
  if (!iconName) return FiCircle;
  return iconMap[iconName] || FiCircle;
};

// Main Flow Diagram Component - Enhanced Visual Style
export const FlowDiagram = ({
  nodes,
  edges,
  direction = 'horizontal',
  showMessages = false,
  interactive = false,
  onNodeClick,
  selectedNodeId,
  highlightPath = [],
  compact = false,
}: FlowDiagramProps) => {
  const { getColors } = useTheme();
  const colors = getColors();

  // Sort nodes by sequence
  const sortedNodes = useMemo(() => {
    return [...nodes].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }, [nodes]);

  // Separate initial events from regular flow events
  const initialEvents = useMemo(() => {
    return sortedNodes.filter(n => n.isInitialEvent);
  }, [sortedNodes]);

  const flowEvents = useMemo(() => {
    return sortedNodes.filter(n => !n.isInitialEvent);
  }, [sortedNodes]);

  const hasMultipleStarts = initialEvents.length > 1;

  // Get edge for a target node
  const getEdgeToNode = useCallback((nodeId: string) => {
    return edges.find(e => e.to === nodeId);
  }, [edges]);

  const isNodeHighlighted = (nodeId: string) => highlightPath.includes(nodeId);

  const handleNodeClick = useCallback((node: FlowNode) => {
    if (interactive && onNodeClick) {
      onNodeClick(node);
    }
  }, [interactive, onNodeClick]);

  const IconDisplay = ({ iconName }: { iconName?: string }) => {
    const IconComp = getIconComponent(iconName);
    return <Icon as={IconComp} />;
  };

  // Render a single node
  const renderNode = (node: FlowNode, showStartBadge = false, index?: number) => {
    const nodeColor = getNodeColor(node);
    const isSelected = selectedNodeId === node.id;
    const isHighlighted = isNodeHighlighted(node.id);

    // Determine the role to display
    const roleToShow = node.initialEventRole ||
      (node.ourRole === 'SENDER' ? node.messageSender : node.messageReceiver);

    return (
      <VStack key={node.id} gap={1} align="center">
        {/* Role label with icon */}
        {roleToShow && (
          <Badge
            colorPalette={node.ourRole === 'SENDER' ? 'orange' : 'teal'}
            variant="subtle"
            fontSize="8px"
          >
            <HStack gap={1}>
              <Icon as={getRoleIcon(roleToShow)} boxSize={3} />
              <Text>{roleToShow.replace(/_/g, ' ')}</Text>
            </HStack>
          </Badge>
        )}

        <Tooltip.Root positioning={{ placement: 'top' }}>
          <Tooltip.Trigger asChild>
            <VStack
              p={compact ? 2 : 3}
              bg={node.isCompleted ? 'green.50' : node.isCurrent ? 'blue.50' : `${nodeColor}.50`}
              borderWidth={isSelected ? '3px' : node.isCompleted || node.isCurrent ? '3px' : '2px'}
              borderColor={
                isSelected ? `${nodeColor}.500` :
                node.isCompleted ? 'green.400' :
                node.isCurrent ? 'blue.400' :
                `${nodeColor}.300`
              }
              borderRadius="lg"
              minW={compact ? '120px' : '140px'}
              maxW={compact ? '140px' : '180px'}
              gap={1}
              boxShadow={isSelected || isHighlighted ? 'md' : 'sm'}
              cursor={interactive ? 'pointer' : 'default'}
              onClick={() => handleNodeClick(node)}
              position="relative"
              transition="all 0.2s"
              _hover={interactive ? {
                boxShadow: 'md',
                transform: 'translateY(-2px)',
              } : undefined}
            >
              {/* Step number badge */}
              {index !== undefined && (
                <Badge
                  position="absolute"
                  top="-10px"
                  left="-10px"
                  colorPalette="gray"
                  variant="solid"
                  borderRadius="full"
                  w="24px"
                  h="24px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  fontSize="xs"
                >
                  {index + 1}
                </Badge>
              )}

              {/* Start badge */}
              {showStartBadge && (
                <Badge colorPalette="green" size="sm" fontSize="9px" mb={1}>START</Badge>
              )}

              {/* Completed indicator with tooltip */}
              {node.isCompleted && (
                <Tooltip.Root positioning={{ placement: 'top' }}>
                  <Tooltip.Trigger asChild>
                    <Box position="absolute" top="-8px" right="-8px" cursor="pointer">
                      <Flex
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        bg="green.500"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="sm"
                      >
                        <Icon as={FiCheck} boxSize={3} color="white" />
                      </Flex>
                    </Box>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Content>
                      <VStack align="start" gap={1}>
                        <Text fontSize="sm" fontWeight="bold">Evento completado</Text>
                        {node.completedAt && (
                          <Text fontSize="xs">
                            Fecha: {new Date(node.completedAt).toLocaleString()}
                          </Text>
                        )}
                        {node.executedBy && (
                          <Text fontSize="xs">Por: {node.executedBy}</Text>
                        )}
                      </VStack>
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
              )}

              {/* Current indicator with tooltip */}
              {node.isCurrent && !node.isCompleted && (
                <Tooltip.Root positioning={{ placement: 'top' }}>
                  <Tooltip.Trigger asChild>
                    <Box position="absolute" top="-8px" right="-8px" cursor="pointer">
                      <Flex
                        w="20px"
                        h="20px"
                        borderRadius="full"
                        bg="blue.500"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="sm"
                      >
                        <Icon as={FiClock} boxSize={3} color="white" />
                      </Flex>
                    </Box>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Content>
                      <Text fontSize="sm">Evento actual en progreso</Text>
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
              )}

              {/* Icon + Label */}
              <HStack gap={2}>
                <Flex
                  w={compact ? '24px' : '28px'}
                  h={compact ? '24px' : '28px'}
                  borderRadius="full"
                  bg={
                    node.isCompleted ? 'green.200' :
                    node.isCurrent ? 'blue.200' :
                    `${nodeColor}.200`
                  }
                  alignItems="center"
                  justifyContent="center"
                  flexShrink={0}
                >
                  {node.isCompleted ? (
                    <Icon as={FiCheck} boxSize={compact ? 3 : 4} color="green.700" />
                  ) : node.isCurrent ? (
                    <Icon as={FiClock} boxSize={compact ? 3 : 4} color="blue.700" />
                  ) : (
                    <IconDisplay iconName={node.icon} />
                  )}
                </Flex>
                <Text
                  fontSize={compact ? '10px' : 'xs'}
                  fontWeight="bold"
                  color={
                    node.isCompleted ? 'green.800' :
                    node.isCurrent ? 'blue.800' :
                    `${nodeColor}.800`
                  }
                  lineClamp={2}
                >
                  {node.label}
                </Text>
              </HStack>

              {/* SWIFT Messages */}
              {showMessages && (node.outboundMessage || node.inboundMessage) && (
                <HStack gap={1} flexWrap="wrap" justify="center">
                  {node.outboundMessage && (
                    <Badge colorPalette="purple" size="sm" fontSize="9px">↑{node.outboundMessage}</Badge>
                  )}
                  {node.inboundMessage && (
                    <Badge colorPalette="green" size="sm" fontSize="9px">↓{node.inboundMessage}</Badge>
                  )}
                </HStack>
              )}

              {/* Resulting stage */}
              {!compact && node.stage && (
                <Text fontSize="9px" color="gray.600">→ {node.stage}</Text>
              )}

              {/* Requires approval indicator with tooltip */}
              {node.requiresApproval && (
                <Tooltip.Root positioning={{ placement: 'bottom' }}>
                  <Tooltip.Trigger asChild>
                    <Box position="absolute" bottom="-6px" right="-6px" cursor="pointer">
                      <Flex
                        w="18px"
                        h="18px"
                        borderRadius="full"
                        bg="orange.500"
                        alignItems="center"
                        justifyContent="center"
                        boxShadow="sm"
                      >
                        <Icon as={FiAlertCircle} boxSize={2.5} color="white" />
                      </Flex>
                    </Box>
                  </Tooltip.Trigger>
                  <Tooltip.Positioner>
                    <Tooltip.Content>
                      <Text fontSize="sm">Requiere aprobación</Text>
                    </Tooltip.Content>
                  </Tooltip.Positioner>
                </Tooltip.Root>
              )}
            </VStack>
          </Tooltip.Trigger>
          <Tooltip.Positioner>
            <Tooltip.Content>
              <VStack align="start" gap={1} p={2}>
                <Text fontWeight="bold">{node.label}</Text>
                {node.description && <Text fontSize="sm">{node.description}</Text>}
                {node.stage && <Text fontSize="xs" color="gray.400">Stage: {node.stage}</Text>}
                {node.isCompleted && <Badge colorPalette="green" size="sm">Completed</Badge>}
                {node.isCurrent && <Badge colorPalette="blue" size="sm">Current</Badge>}
                {node.requiresApproval && <Badge colorPalette="orange" size="sm">Requires Approval</Badge>}
              </VStack>
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Tooltip.Root>
      </VStack>
    );
  };

  // Render arrow between nodes
  const renderArrow = (toNodeId: string, isHorizontal: boolean) => {
    const edge = getEdgeToNode(toNodeId);
    const hasRequired = edge?.isRequired;
    const ArrowIcon = isHorizontal ? FiArrowRight : FiArrowDown;

    return (
      <VStack gap={0} px={isHorizontal ? 1 : 0} py={isHorizontal ? 0 : 1}>
        {edge?.label && (
          <Text fontSize="8px" color="gray.500" maxW="60px" textAlign="center" lineClamp={1}>
            {edge.label}
          </Text>
        )}
        <HStack gap={0}>
          <Box
            w={isHorizontal ? '20px' : '2px'}
            h={isHorizontal ? '2px' : '20px'}
            bg={hasRequired ? 'red.400' : 'gray.300'}
          />
          <Icon
            as={ArrowIcon}
            boxSize={4}
            color={hasRequired ? 'red.400' : 'gray.400'}
          />
        </HStack>
        {hasRequired && (
          <Text fontSize="7px" color="red.500" fontWeight="bold">REQ</Text>
        )}
      </VStack>
    );
  };

  const isHorizontal = direction === 'horizontal';

  return (
    <Box
      p={4}
      bg={colors.cardBg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colors.borderColor}
      overflowX="auto"
    >
      <VStack gap={4} align="stretch">
        {/* Multiple entry points section */}
        {hasMultipleStarts && (
          <Box position="relative">
            <HStack gap={4} align="flex-end" justify="center" flexWrap="wrap">
              {initialEvents.map((node) => (
                <VStack key={node.id} gap={2} align="center">
                  {renderNode(node, false)}
                  <Icon as={FiArrowDown} boxSize={5} color="gray.400" />
                </VStack>
              ))}
            </HStack>
            {/* Convergence line */}
            <Flex justify="center" mt={-2}>
              <Box
                w={`${Math.min(initialEvents.length * 180, 400)}px`}
                h="2px"
                bg="gray.300"
                borderRadius="full"
              />
            </Flex>
            <Flex justify="center">
              <Icon as={FiArrowDown} boxSize={5} color="gray.400" />
            </Flex>
          </Box>
        )}

        {/* Main flow */}
        <HStack gap={0} align="center" minW="max-content" justify="center" flexWrap="nowrap">
          {/* Single start node if not multiple starts */}
          {!hasMultipleStarts && initialEvents.length === 1 && (
            <>
              {renderNode(initialEvents[0], true)}
            </>
          )}

          {/* Generic start if no initial events */}
          {!hasMultipleStarts && initialEvents.length === 0 && (
            <Flex
              w="50px"
              h="50px"
              borderRadius="full"
              bg="green.500"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
            >
              <Text color="white" fontWeight="bold" fontSize="xs">START</Text>
            </Flex>
          )}

          {/* Flow events */}
          {flowEvents.map((node, index) => (
            <HStack key={node.id} gap={0} align="center">
              {renderArrow(node.id, isHorizontal)}
              {renderNode(node, false, index + (hasMultipleStarts ? 0 : (initialEvents.length > 0 ? 1 : 0)) - 1)}
            </HStack>
          ))}

          {/* End node */}
          {flowEvents.length > 0 && (
            <>
              {renderArrow('END', isHorizontal)}
              <Flex
                w="50px"
                h="50px"
                borderRadius="full"
                bg="red.500"
                alignItems="center"
                justifyContent="center"
                flexShrink={0}
              >
                <Text color="white" fontWeight="bold" fontSize="xs">END</Text>
              </Flex>
            </>
          )}
        </HStack>

        {/* Flow Statistics */}
        <HStack gap={4} justify="center" pt={2}>
          <Badge colorPalette="green" variant="subtle">
            {highlightPath.length} completed
          </Badge>
          <Badge colorPalette="blue" variant="subtle">
            {nodes.length} events
          </Badge>
          <Badge colorPalette="purple" variant="subtle">
            {edges.length} transitions
          </Badge>
        </HStack>

        {/* Timeline Section - Only show if there are completed events */}
        {(() => {
          const completedNodes = sortedNodes
            .filter(n => n.isCompleted && n.completedAt)
            .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());

          if (completedNodes.length === 0) return null;

          // Calculate time differences
          const getTimeDiff = (date1: string, date2: string) => {
            const diff = new Date(date2).getTime() - new Date(date1).getTime();
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);

            if (days > 0) return `${days}d ${hours % 24}h`;
            if (hours > 0) return `${hours}h ${minutes % 60}m`;
            return `${minutes}m`;
          };

          // Calculate total time
          const totalTime = completedNodes.length >= 2
            ? getTimeDiff(completedNodes[0].completedAt!, completedNodes[completedNodes.length - 1].completedAt!)
            : null;

          return (
            <Box mt={4} p={4} bg="gray.50" borderRadius="lg" borderWidth="1px" borderColor="gray.200">
              <HStack justify="space-between" mb={3}>
                <HStack gap={2}>
                  <Icon as={FiClock} color="blue.500" />
                  <Text fontSize="sm" fontWeight="bold" color="gray.700">
                    Timeline de Ejecución
                  </Text>
                </HStack>
                {totalTime && (
                  <Badge colorPalette="blue" variant="solid">
                    Tiempo total: {totalTime}
                  </Badge>
                )}
              </HStack>

              {/* Timeline visualization */}
              <Box overflowX="auto">
                <HStack gap={0} align="center" minW="max-content">
                  {completedNodes.map((node, index) => {
                    const IconComp = getIconComponent(node.icon);
                    const timeDiff = index > 0
                      ? getTimeDiff(completedNodes[index - 1].completedAt!, node.completedAt!)
                      : null;

                    return (
                      <HStack key={node.id} gap={0} align="center">
                        {/* Time connector */}
                        {index > 0 && (
                          <VStack gap={0} px={2}>
                            <Text fontSize="9px" color="blue.600" fontWeight="bold">
                              {timeDiff}
                            </Text>
                            <HStack gap={0}>
                              <Box w="40px" h="2px" bg="green.400" />
                              <Icon as={FiArrowRight} boxSize={3} color="green.400" />
                            </HStack>
                          </VStack>
                        )}

                        {/* Event node */}
                        <Tooltip.Root positioning={{ placement: 'top' }}>
                          <Tooltip.Trigger asChild>
                            <VStack
                              p={2}
                              bg="white"
                              borderWidth="2px"
                              borderColor="green.400"
                              borderRadius="md"
                              minW="100px"
                              maxW="120px"
                              gap={1}
                              cursor="pointer"
                              boxShadow="sm"
                            >
                              <HStack gap={1}>
                                <Flex
                                  w="20px"
                                  h="20px"
                                  borderRadius="full"
                                  bg="green.100"
                                  alignItems="center"
                                  justifyContent="center"
                                >
                                  <Icon as={IconComp} boxSize={3} color="green.600" />
                                </Flex>
                                <Text fontSize="10px" fontWeight="bold" color="gray.700" lineClamp={1}>
                                  {node.label}
                                </Text>
                              </HStack>
                              <Text fontSize="9px" color="gray.500">
                                {new Date(node.completedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                              <Text fontSize="8px" color="gray.400">
                                {new Date(node.completedAt!).toLocaleDateString()}
                              </Text>
                            </VStack>
                          </Tooltip.Trigger>
                          <Tooltip.Positioner>
                            <Tooltip.Content>
                              <VStack align="start" gap={1}>
                                <Text fontWeight="bold">{node.label}</Text>
                                <Text fontSize="xs">
                                  {new Date(node.completedAt!).toLocaleString()}
                                </Text>
                                {node.executedBy && (
                                  <Text fontSize="xs">Por: {node.executedBy}</Text>
                                )}
                              </VStack>
                            </Tooltip.Content>
                          </Tooltip.Positioner>
                        </Tooltip.Root>
                      </HStack>
                    );
                  })}
                </HStack>
              </Box>

              {/* Progress bar */}
              {nodes.length > 0 && (
                <Box mt={3}>
                  <HStack justify="space-between" mb={1}>
                    <Text fontSize="xs" color="gray.600">Progreso</Text>
                    <Text fontSize="xs" color="gray.600">
                      {completedNodes.length} de {nodes.length} eventos
                    </Text>
                  </HStack>
                  <Box w="100%" h="8px" bg="gray.200" borderRadius="full" overflow="hidden">
                    <Box
                      h="100%"
                      w={`${(completedNodes.length / nodes.length) * 100}%`}
                      bg="green.500"
                      borderRadius="full"
                      transition="width 0.3s"
                    />
                  </Box>
                </Box>
              )}
            </Box>
          );
        })()}
      </VStack>
    </Box>
  );
};

export default FlowDiagram;
