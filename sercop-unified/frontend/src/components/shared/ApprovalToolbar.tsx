import {
  Box,
  HStack,
  Button,
  Badge,
  Text,
  Textarea,
  VStack,
  DialogRoot,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogCloseTrigger,
  DialogTitle,
  DialogBackdrop,
} from '@chakra-ui/react';
import { FiCheckCircle, FiXCircle, FiArrowLeft, FiMessageSquare } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ApprovalToolbarProps {
  isApproving: boolean;
  isRejecting: boolean;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  showRejectDialog: boolean;
  setShowRejectDialog: (open: boolean) => void;
  fieldCommentsCount: number;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalToolbar: React.FC<ApprovalToolbarProps> = ({
  isApproving,
  isRejecting,
  rejectionReason,
  setRejectionReason,
  showRejectDialog,
  setShowRejectDialog,
  fieldCommentsCount,
  onApprove,
  onReject,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <>
      <Box
        bg="blue.50"
        borderWidth="1px"
        borderColor="blue.200"
        borderRadius="lg"
        p={4}
        mb={6}
      >
        <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
          <HStack gap={4}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/workbox/pending-approval')}
            >
              <FiArrowLeft style={{ marginRight: 8 }} />
              {t('common.back', 'Volver')}
            </Button>
            <Box>
              <HStack gap={2} mb={1}>
                <Badge colorPalette="blue" size="lg">{t('operations.approvalMode', 'Modo Aprobación')}</Badge>
                <Badge colorPalette="orange">{t('operations.pendingReview', 'Pendiente de Revisión')}</Badge>
              </HStack>
              <Text fontSize="sm" color="blue.700">
                {t('operations.reviewInstructions', 'Revisa la información y aprueba o rechaza esta operación')}
              </Text>
            </Box>
          </HStack>
          <HStack gap={3}>
            {fieldCommentsCount > 0 && (
              <HStack fontSize="sm" color="blue.600" gap={1}>
                <FiMessageSquare />
                <Text>{fieldCommentsCount} {t('fieldComments.commentsCount', 'comentario(s)')}</Text>
              </HStack>
            )}
            <Button
              colorPalette="red"
              variant="outline"
              onClick={() => setShowRejectDialog(true)}
              disabled={isApproving}
            >
              <FiXCircle style={{ marginRight: 8 }} />
              {t('operations.reject', 'Rechazar')}
            </Button>
            <Button
              colorPalette="green"
              onClick={onApprove}
              loading={isApproving}
              disabled={isRejecting}
            >
              <FiCheckCircle style={{ marginRight: 8 }} />
              {t('operations.approve', 'Aprobar')}
            </Button>
          </HStack>
        </HStack>
      </Box>

      {/* Reject Dialog */}
      <DialogRoot
        open={showRejectDialog}
        onOpenChange={(e) => setShowRejectDialog(e.open)}
      >
        <DialogBackdrop />
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('operations.rejectOperation', 'Rechazar Operación')}</DialogTitle>
          </DialogHeader>
          <DialogBody>
            <VStack gap={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                {t('operations.rejectDescription', 'Indique el motivo del rechazo. La operación será devuelta al creador para corrección.')}
              </Text>
              {fieldCommentsCount > 0 && (
                <HStack
                  p={3}
                  bg="blue.50"
                  borderRadius="md"
                  borderLeft="3px solid"
                  borderColor="blue.400"
                  fontSize="sm"
                  color="blue.700"
                  gap={2}
                >
                  <FiMessageSquare />
                  <Text>
                    {fieldCommentsCount} {t('fieldComments.fieldCommentsIncluded', 'comentario(s) por campo serán incluidos')}
                  </Text>
                </HStack>
              )}
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder={t('operations.rejectionReasonPlaceholder', 'Motivo del rechazo...')}
                rows={4}
              />
            </VStack>
          </DialogBody>
          <DialogFooter>
            <HStack gap={3}>
              <Button
                variant="ghost"
                onClick={() => setShowRejectDialog(false)}
              >
                {t('common.cancel', 'Cancelar')}
              </Button>
              <Button
                colorPalette="red"
                onClick={onReject}
                loading={isRejecting}
                disabled={!rejectionReason.trim()}
              >
                <FiXCircle style={{ marginRight: 8 }} />
                {t('operations.confirmReject', 'Confirmar Rechazo')}
              </Button>
            </HStack>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>
    </>
  );
};

export default ApprovalToolbar;
