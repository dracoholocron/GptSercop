/**
 * ApprovalChainStatus Component
 * Displays multi-level approval chain progress and allows approval/rejection actions.
 */

import React, { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiUser,
  FiChevronRight,
  FiMessageSquare,
  FiSkipForward,
} from 'react-icons/fi';
import { backofficeRequestService } from '../../services/backofficeRequestService';
import type { ApprovalChainEntry, ApprovalChainStatusResponse } from '../../services/backofficeRequestService';

interface ApprovalChainStatusProps {
  requestId: string;
  userId?: string;
  userName?: string;
  onApprovalComplete?: () => void;
  onRefresh?: () => void;
}

export const ApprovalChainStatus: React.FC<ApprovalChainStatusProps> = ({
  requestId,
  userId,
  userName,
  onApprovalComplete,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ApprovalChainStatusResponse | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await backofficeRequestService.getApprovalChainStatus(requestId);
      setData(result);
    } catch (error) {
      console.error('Error fetching approval chain status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId]);

  const handleRefresh = () => {
    fetchData();
    onRefresh?.();
  };

  const handleApprove = async () => {
    setProcessing(true);
    setError(null);
    try {
      const result = await backofficeRequestService.processApprovalChainApproval(
        requestId,
        comments,
        userId,
        userName
      );

      if (result.success) {
        setShowApproveModal(false);
        setComments('');
        fetchData();
        if (result.chainStatus?.allComplete) {
          onApprovalComplete?.();
        }
      } else {
        setError(result.error || 'Error al procesar aprobacion');
      }
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      setError('Se requiere un motivo de rechazo');
      return;
    }

    setProcessing(true);
    setError(null);
    try {
      const result = await backofficeRequestService.processApprovalChainRejection(
        requestId,
        comments,
        userId,
        userName
      );

      if (result.success) {
        setShowRejectModal(false);
        setComments('');
        fetchData();
        onApprovalComplete?.();
      } else {
        setError(result.error || 'Error al procesar rechazo');
      }
    } catch (err) {
      setError('Error de conexion');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          icon: FiCheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: 'Aprobado',
        };
      case 'REJECTED':
        return {
          icon: FiXCircle,
          color: 'text-red-500',
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Rechazado',
        };
      case 'SKIPPED':
        return {
          icon: FiSkipForward,
          color: 'text-gray-400',
          bg: 'bg-gray-100',
          text: 'text-gray-600',
          label: 'Omitido',
        };
      default:
        return {
          icon: FiClock,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: 'Pendiente',
        };
    }
  };

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      ROLE_OPERATOR: 'Operador',
      ROLE_MANAGER: 'Supervisor',
      ROLE_ADMIN: 'Jefe Comex',
      ROLE_COMPLIANCE: 'Compliance',
    };
    return roleLabels[role] || role;
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <FiRefreshCw className="animate-spin w-5 h-5 text-blue-500 mr-2" />
        <span className="text-gray-600">Cargando cadena de aprobacion...</span>
      </div>
    );
  }

  if (!data || data.approvals.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <FiUser className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No hay cadena de aprobacion configurada para esta solicitud.</p>
        <p className="text-sm mt-1">La cadena se crea al pasar a la etapa de Aprobacion.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">Cadena de Aprobacion</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            data.allComplete
              ? data.hasRejection ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {data.allComplete
              ? data.hasRejection ? 'Rechazada' : 'Completada'
              : `Nivel ${data.currentPendingLevel} pendiente`}
          </span>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
          title="Actualizar"
        >
          <FiRefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Approval Chain Timeline */}
      <div className="p-4">
        <div className="relative">
          {data.approvals.map((approval, index) => {
            const statusConfig = getStatusConfig(approval.status);
            const StatusIcon = statusConfig.icon;
            const isLast = index === data.approvals.length - 1;
            const isCurrent = approval.status === 'PENDING' && approval.approvalLevel === data.currentPendingLevel;

            return (
              <div key={approval.id} className="relative flex items-start pb-6">
                {/* Connector Line */}
                {!isLast && (
                  <div className={`absolute left-4 top-8 w-0.5 h-full ${
                    approval.status === 'APPROVED' ? 'bg-green-200' :
                    approval.status === 'REJECTED' ? 'bg-red-200' : 'bg-gray-200'
                  }`} />
                )}

                {/* Status Icon */}
                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                  isCurrent ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                } ${statusConfig.bg}`}>
                  <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">
                        Nivel {approval.approvalLevel}: {getRoleLabel(approval.requiredRole)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {approval.approvedByUserName || 'Pendiente de aprobacion'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${statusConfig.bg} ${statusConfig.text}`}>
                      {statusConfig.label}
                    </span>
                  </div>

                  {approval.approvedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(approval.approvedAt)}
                    </p>
                  )}

                  {approval.comments && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600 flex items-start gap-2">
                      <FiMessageSquare className="w-4 h-4 mt-0.5 text-gray-400" />
                      <p>{approval.comments}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {data.canUserApproveNow && !data.allComplete && (
        <div className="px-4 py-3 bg-yellow-50 border-t border-yellow-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-yellow-800">
              Tienes permiso para aprobar en el nivel {data.currentPendingLevel}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded hover:bg-red-200"
              >
                Rechazar
              </button>
              <button
                onClick={() => setShowApproveModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700"
              >
                Aprobar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Etapa actual: <span className="font-medium">{data.currentStage || 'N/A'}</span>
        </div>
        <div className="text-gray-500 text-xs">
          Tus roles: {data.userRoles.map(r => getRoleLabel(r)).join(', ')}
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Aprobacion</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentarios (opcional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
                placeholder="Agregar comentarios..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowApproveModal(false); setComments(''); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
                disabled={processing}
              >
                {processing ? 'Procesando...' : 'Confirmar Aprobacion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirmar Rechazo</h3>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo del rechazo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Especifique el motivo del rechazo..."
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setComments(''); setError(null); }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                disabled={processing}
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                disabled={processing || !comments.trim()}
              >
                {processing ? 'Procesando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalChainStatus;
