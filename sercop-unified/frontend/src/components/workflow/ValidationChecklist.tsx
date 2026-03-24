/**
 * ValidationChecklist Component
 * Displays validation results from Core Banking validations executed in VALIDACION stage.
 */

import React, { useEffect, useState } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';
import { backofficeRequestService } from '../../services/backofficeRequestService';
import type { ValidationResult, ValidationResultsResponse } from '../../services/backofficeRequestService';

interface ValidationChecklistProps {
  requestId: string;
  onRefresh?: () => void;
}

export const ValidationChecklist: React.FC<ValidationChecklistProps> = ({
  requestId,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ValidationResultsResponse | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await backofficeRequestService.getValidationResults(requestId);
      setData(result);
    } catch (error) {
      console.error('Error fetching validation results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId]);

  const toggleExpand = (checkCode: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(checkCode)) {
      newExpanded.delete(checkCode);
    } else {
      newExpanded.add(checkCode);
    }
    setExpandedItems(newExpanded);
  };

  const handleRefresh = () => {
    fetchData();
    onRefresh?.();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <FiRefreshCw className="animate-spin w-5 h-5 text-blue-500 mr-2" />
        <span className="text-gray-600">Cargando validaciones...</span>
      </div>
    );
  }

  if (!data || data.validations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No hay validaciones ejecutadas para esta solicitud.</p>
        <p className="text-sm mt-1">Las validaciones se ejecutan al pasar a la etapa de Validacion.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-800">Validaciones del Core Bancario</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            data.allPassed
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {data.passedCount}/{data.totalCount} aprobadas
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

      {/* Validation List */}
      <div className="divide-y divide-gray-100">
        {data.validations.map((validation) => (
          <div key={validation.checkCode} className="hover:bg-gray-50">
            <div
              className="px-4 py-3 flex items-center justify-between cursor-pointer"
              onClick={() => toggleExpand(validation.checkCode)}
            >
              <div className="flex items-center gap-3">
                {validation.passed ? (
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <FiXCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium text-gray-800">{validation.checkName}</p>
                  <p className="text-xs text-gray-500">{validation.checkCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs rounded ${
                  validation.passed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {validation.passed ? 'Aprobada' : 'Fallida'}
                </span>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <FiClock className="w-3 h-3" />
                  {formatDuration(validation.executionTimeMs)}
                </div>
                {expandedItems.has(validation.checkCode) ? (
                  <FiChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <FiChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedItems.has(validation.checkCode) && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Mensaje</p>
                    <p className="font-medium text-gray-800">{validation.message || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Ejecutado</p>
                    <p className="font-medium text-gray-800">{formatDate(validation.executedAt)}</p>
                  </div>
                </div>
                {validation.responseData && (
                  <div className="mt-3">
                    <p className="text-gray-500 text-sm mb-1">Respuesta del sistema</p>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32">
                      {validation.responseData}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Etapa actual: <span className="font-medium">{data.currentStage || 'N/A'}</span>
        </div>
        <div className={`font-medium ${data.allPassed ? 'text-green-600' : 'text-red-600'}`}>
          {data.allPassed ? 'Todas las validaciones aprobadas' : `${data.failedCount} validacion(es) fallida(s)`}
        </div>
      </div>
    </div>
  );
};

export default ValidationChecklist;
