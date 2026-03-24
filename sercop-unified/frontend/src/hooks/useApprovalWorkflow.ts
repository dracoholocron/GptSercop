import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { swiftDraftService } from '../services/swiftDraftService';
import { toaster } from '../components/ui/toaster';

export interface FieldCommentData {
  comment: string;
  commentedAt: string;
  commentedBy: string;
}

export interface UseApprovalWorkflowOptions {
  draftId?: number | string;
  approvalMode: boolean;
}

export function useApprovalWorkflow({ draftId, approvalMode }: UseApprovalWorkflowOptions) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [fieldComments, setFieldComments] = useState<Record<string, FieldCommentData>>({});

  const handleSaveFieldComment = useCallback((fieldCode: string, comment: string) => {
    setFieldComments(prev => ({
      ...prev,
      [fieldCode]: { comment, commentedAt: new Date().toISOString(), commentedBy: user?.username || '' },
    }));
  }, [user?.username]);

  const handleRemoveFieldComment = useCallback((fieldCode: string) => {
    setFieldComments(prev => {
      const next = { ...prev };
      delete next[fieldCode];
      return next;
    });
  }, []);

  const fieldCommentMode: 'approver' | 'creator' | 'none' = useMemo(() => {
    if (approvalMode) return 'approver';
    if (fieldComments && Object.keys(fieldComments).length > 0) return 'creator';
    return 'none';
  }, [approvalMode, fieldComments]);

  // Load field comments from draft (both creator and approver mode)
  // Creator: sees comments from previous rejection to know what to fix
  // Approver: sees their previous comments to verify corrections
  useEffect(() => {
    if (!draftId) return;
    const loadFieldComments = async () => {
      try {
        const draft = await swiftDraftService.getDraftById(String(draftId));
        if (draft?.fieldComments) {
          setFieldComments(draft.fieldComments as Record<string, FieldCommentData>);
        }
      } catch {
        // Silently ignore - field comments are optional
      }
    };
    loadFieldComments();
  }, [draftId]);

  const handleApprove = useCallback(async () => {
    if (!draftId || !user?.username) return;
    try {
      setIsApproving(true);
      await swiftDraftService.approveDraft(String(draftId), user.username);
      toaster.success({
        title: 'Aprobado',
        description: 'La operación ha sido aprobada exitosamente',
      });
      navigate('/workbox/pending-approval');
    } catch (error) {
      console.error('Error approving:', error);
      toaster.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo aprobar',
      });
    } finally {
      setIsApproving(false);
    }
  }, [draftId, user?.username, navigate]);

  const handleReject = useCallback(async () => {
    if (!draftId || !user?.username || !rejectionReason.trim()) return;
    try {
      setIsRejecting(true);
      const commentsToSend = Object.keys(fieldComments).length > 0
        ? Object.fromEntries(Object.entries(fieldComments).map(([k, v]) => [k, { comment: v.comment }]))
        : undefined;
      await swiftDraftService.rejectDraft(String(draftId), user.username, rejectionReason, commentsToSend);
      toaster.success({
        title: 'Rechazado',
        description: 'La operación ha sido rechazada',
      });
      navigate('/workbox/pending-approval');
    } catch (error) {
      console.error('Error rejecting:', error);
      toaster.error({
        title: 'Error',
        description: error instanceof Error ? error.message : 'No se pudo rechazar',
      });
    } finally {
      setIsRejecting(false);
      setShowRejectDialog(false);
    }
  }, [draftId, user?.username, rejectionReason, fieldComments, navigate]);

  const fieldCommentsCount = useMemo(() => Object.keys(fieldComments).length, [fieldComments]);

  return {
    isApproving,
    isRejecting,
    rejectionReason,
    setRejectionReason,
    showRejectDialog,
    setShowRejectDialog,
    fieldComments,
    fieldCommentMode,
    fieldCommentsCount,
    handleSaveFieldComment,
    handleRemoveFieldComment,
    handleApprove,
    handleReject,
  };
}
