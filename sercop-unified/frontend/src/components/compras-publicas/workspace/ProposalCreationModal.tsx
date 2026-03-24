/**
 * ProposalCreationModal — Modal to propose a field value change.
 * Shows current value (read-only) vs proposed value (editable) side by side.
 */
import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Button,
  Badge,
  DialogRoot,
  DialogBackdrop,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogActionTrigger,
} from '@chakra-ui/react';
import { FiGitPullRequest } from 'react-icons/fi';
import { useTheme } from '../../../contexts/ThemeContext';
import { createProposal } from '../../../services/cpWorkspaceService';
import { toaster } from '../../ui/toaster';

interface ProposalCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  departmentPlanId: number;
  fieldCode: string;
  phaseIdx: number;
  currentValue: string;
  currentUserName?: string;
  onProposalCreated?: () => void;
}

export function ProposalCreationModal({
  isOpen,
  onClose,
  workspaceId,
  departmentPlanId,
  fieldCode,
  phaseIdx,
  currentValue,
  currentUserName,
  onProposalCreated,
}: ProposalCreationModalProps) {
  const { isDark } = useTheme();
  const [proposedValue, setProposedValue] = useState(currentValue);
  const [justification, setJustification] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const cardBg = isDark ? 'gray.800' : 'white';

  const handleSubmit = async () => {
    if (!proposedValue.trim() || proposedValue === currentValue) return;
    setSubmitting(true);
    try {
      await createProposal(workspaceId, {
        departmentPlanId,
        anchorField: fieldCode,
        anchorPhaseIndex: phaseIdx,
        currentValue,
        proposedValue: proposedValue.trim(),
        justification: justification.trim(),
        proposerName: currentUserName,
      });
      toaster.create({ title: 'Propuesta creada', type: 'success', duration: 3000 });
      onProposalCreated?.();
      onClose();
    } catch (err) {
      toaster.create({ title: 'Error al crear propuesta', type: 'error', duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isOpen} onOpenChange={(e) => !e.open && onClose()}>
      <DialogBackdrop bg="rgba(0, 0, 0, 0.5)" />
      <DialogContent
        bg={cardBg}
        maxW="2xl"
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        zIndex={1400}
        maxH="90vh"
        display="flex"
        flexDirection="column"
        w={{ base: '95%', md: '650px' }}
      >
        <DialogHeader>
          <DialogTitle>
            <HStack>
              <FiGitPullRequest />
              <Text>Proponer Cambio</Text>
              <Badge colorPalette="teal" fontSize="xs">{fieldCode}</Badge>
            </HStack>
          </DialogTitle>
          <DialogCloseTrigger />
        </DialogHeader>
        <DialogBody>
          <HStack gap={4} align="start">
            {/* Current value */}
            <VStack flex={1} align="stretch" gap={1}>
              <Text fontSize="xs" fontWeight="bold" color="gray.500">Valor Actual</Text>
              <Box
                p={3}
                borderRadius="md"
                bg={isDark ? 'gray.700' : 'gray.50'}
                border="1px solid"
                borderColor={isDark ? 'gray.600' : 'gray.200'}
                minH="120px"
                maxH="200px"
                overflowY="auto"
              >
                <Text fontSize="sm" whiteSpace="pre-wrap" color="gray.500">
                  {currentValue || '(vacío)'}
                </Text>
              </Box>
            </VStack>

            {/* Proposed value */}
            <VStack flex={1} align="stretch" gap={1}>
              <Text fontSize="xs" fontWeight="bold" color="teal.500">Valor Propuesto</Text>
              <Textarea
                value={proposedValue}
                onChange={e => setProposedValue(e.target.value)}
                placeholder="Ingrese el nuevo valor propuesto..."
                minH="120px"
                fontSize="sm"
              />
            </VStack>
          </HStack>

          <VStack mt={4} align="stretch" gap={1}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500">Justificación</Text>
            <Textarea
              value={justification}
              onChange={e => setJustification(e.target.value)}
              placeholder="Explique por qué propone este cambio..."
              rows={2}
              fontSize="sm"
            />
          </VStack>
        </DialogBody>
        <DialogFooter>
          <DialogActionTrigger asChild>
            <Button variant="ghost" mr={3}>Cancelar</Button>
          </DialogActionTrigger>
          <Button
            colorPalette="teal"
            onClick={handleSubmit}
            disabled={!proposedValue.trim() || proposedValue === currentValue || submitting}
            loading={submitting}
          >
            <FiGitPullRequest /> Crear Propuesta
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
