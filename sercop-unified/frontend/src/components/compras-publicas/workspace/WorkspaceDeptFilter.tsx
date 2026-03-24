/**
 * WorkspaceDeptFilter - Search by name + filter by status for department cards
 */
import { HStack, Input, Box } from '@chakra-ui/react';
import { NativeSelect } from '@chakra-ui/react';
import { FiSearch } from 'react-icons/fi';

interface WorkspaceDeptFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const WorkspaceDeptFilter: React.FC<WorkspaceDeptFilterProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) => {
  return (
    <HStack gap={2} mb={3} flexWrap="wrap">
      <Box position="relative" flex={1} minW="200px">
        <Input
          placeholder="Buscar departamento..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          size="sm"
          pl={8}
        />
        <Box position="absolute" left={2} top="50%" transform="translateY(-50%)" color="gray.400">
          <FiSearch size={14} />
        </Box>
      </Box>
      <NativeSelect.Root size="sm" w="180px">
        <NativeSelect.Field
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="EN_PROGRESO">En Progreso</option>
          <option value="ENVIADO">Enviado</option>
          <option value="APROBADO">Aprobado</option>
          <option value="RECHAZADO">Rechazado</option>
          <option value="CONSOLIDADO">Consolidado</option>
        </NativeSelect.Field>
      </NativeSelect.Root>
    </HStack>
  );
};

export default WorkspaceDeptFilter;
