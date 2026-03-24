/**
 * WorkspacePresenceBar - Shows online/offline avatars for workspace participants
 */
import { HStack, Box, Text, Tooltip } from '@chakra-ui/react';
import type { WorkspaceParticipant } from '../../../services/cpWorkspaceService';

const roleColors: Record<string, string> = {
  COORDINATOR: '#3182CE',
  DEPARTMENT: '#38A169',
  OBSERVER: '#9F7AEA',
};

const roleLabels: Record<string, string> = {
  COORDINATOR: 'Coordinador',
  DEPARTMENT: 'Departamento',
  OBSERVER: 'Observador',
};

interface WorkspacePresenceBarProps {
  participants: WorkspaceParticipant[];
}

export const WorkspacePresenceBar: React.FC<WorkspacePresenceBarProps> = ({ participants }) => {
  if (participants.length === 0) return null;

  return (
    <HStack gap={1} flexWrap="wrap">
      {participants.map((p) => {
        const initials = p.userName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .substring(0, 2)
          .toUpperCase();
        const color = roleColors[p.role] || '#718096';
        const label = `${p.userName} (${roleLabels[p.role] || p.role}${p.departmentName ? ' - ' + p.departmentName : ''}) - ${p.online ? 'En linea' : 'Desconectado'}`;

        return (
          <Tooltip.Root key={p.userId}>
            <Tooltip.Trigger asChild>
              <Box position="relative" cursor="default">
                <Box
                  w="32px"
                  h="32px"
                  borderRadius="full"
                  bg={color}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  opacity={p.online ? 1 : 0.5}
                  border="2px solid"
                  borderColor={p.online ? color : 'gray.400'}
                >
                  <Text fontSize="xs" color="white" fontWeight="bold">
                    {initials}
                  </Text>
                </Box>
                <Box
                  position="absolute"
                  bottom="-1px"
                  right="-1px"
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={p.online ? 'green.400' : 'gray.400'}
                  border="2px solid white"
                />
              </Box>
            </Tooltip.Trigger>
            <Tooltip.Positioner>
              <Tooltip.Content fontSize="xs" px={2} py={1}>
                {label}
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Tooltip.Root>
        );
      })}
      <Text fontSize="xs" color="gray.500" ml={1}>
        {participants.filter((p) => p.online).length}/{participants.length} en linea
      </Text>
    </HStack>
  );
};

export default WorkspacePresenceBar;
