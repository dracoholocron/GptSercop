/**
 * ComplianceResults Component
 * Displays compliance/screening results from APIs executed in COMPLIANCE stage.
 */

import React, { useEffect, useState } from 'react';
import {
  FiShield,
  FiAlertTriangle,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
} from 'react-icons/fi';
import { backofficeRequestService } from '../../services/backofficeRequestService';
import type { ComplianceResult, ComplianceResultsResponse } from '../../services/backofficeRequestService';

interface ComplianceResultsProps {
  requestId: string;
  onRefresh?: () => void;
}

export const ComplianceResults: React.FC<ComplianceResultsProps> = ({
  requestId,
  onRefresh,
}) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ComplianceResultsResponse | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await backofficeRequestService.getComplianceResults(requestId);
      setData(result);
    } catch (error) {
      console.error('Error fetching compliance results:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [requestId]);

  const toggleExpand = (screeningCode: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(screeningCode)) {
      newExpanded.delete(screeningCode);
    } else {
      newExpanded.add(screeningCode);
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

  const getRiskLevelConfig = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          icon: FiAlertCircle,
          color: 'text-red-500',
          bg: 'bg-red-100',
          text: 'text-red-700',
          label: 'Alto',
        };
      case 'MEDIUM':
        return {
          icon: FiAlertTriangle,
          color: 'text-yellow-500',
          bg: 'bg-yellow-100',
          text: 'text-yellow-700',
          label: 'Medio',
        };
      default:
        return {
          icon: FiCheckCircle,
          color: 'text-green-500',
          bg: 'bg-green-100',
          text: 'text-green-700',
          label: 'Bajo',
        };
    }
  };

  const getOverallRiskConfig = (level: string) => {
    switch (level) {
      case 'HIGH':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: FiAlertCircle,
          iconColor: 'text-red-500',
          textColor: 'text-red-800',
          label: 'Riesgo Alto - Requiere revision manual',
        };
      case 'MEDIUM':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          icon: FiAlertTriangle,
          iconColor: 'text-yellow-500',
          textColor: 'text-yellow-800',
          label: 'Riesgo Medio - Verificar coincidencias',
        };
      default:
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: FiShield,
          iconColor: 'text-green-500',
          textColor: 'text-green-800',
          label: 'Riesgo Bajo - Sin coincidencias',
        };
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <FiRefreshCw className="animate-spin w-5 h-5 text-blue-500 mr-2" />
        <span className="text-gray-600">Cargando resultados de compliance...</span>
      </div>
    );
  }

  if (!data || data.screenings.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <FiSearch className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No hay screenings ejecutados para esta solicitud.</p>
        <p className="text-sm mt-1">Los screenings se ejecutan al pasar a la etapa de Compliance.</p>
      </div>
    );
  }

  const overallConfig = getOverallRiskConfig(data.overallRiskLevel);
  const OverallIcon = overallConfig.icon;

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiShield className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">Compliance y Screening</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            !data.hasMatches
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {data.completedCount}/{data.totalCount} completados
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

      {/* Overall Risk Alert */}
      <div className={`mx-4 mt-4 p-3 rounded-lg ${overallConfig.bg} ${overallConfig.border} border flex items-center gap-3`}>
        <OverallIcon className={`w-5 h-5 ${overallConfig.iconColor}`} />
        <span className={`font-medium ${overallConfig.textColor}`}>
          {overallConfig.label}
        </span>
      </div>

      {/* Screening List */}
      <div className="divide-y divide-gray-100 mt-4">
        {data.screenings.map((screening) => {
          const riskConfig = getRiskLevelConfig(screening.riskLevel);
          const RiskIcon = riskConfig.icon;

          return (
            <div key={screening.screeningCode} className="hover:bg-gray-50">
              <div
                className="px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(screening.screeningCode)}
              >
                <div className="flex items-center gap-3">
                  <RiskIcon className={`w-5 h-5 ${riskConfig.color}`} />
                  <div>
                    <p className="font-medium text-gray-800">{screening.screeningName}</p>
                    <p className="text-xs text-gray-500">{screening.screeningCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {screening.hasMatch && (
                    <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 font-medium">
                      Coincidencia
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded ${riskConfig.bg} ${riskConfig.text}`}>
                    Riesgo {riskConfig.label}
                  </span>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <FiClock className="w-3 h-3" />
                    {formatDuration(screening.executionTimeMs)}
                  </div>
                  {expandedItems.has(screening.screeningCode) ? (
                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedItems.has(screening.screeningCode) && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Estado</p>
                      <p className="font-medium text-gray-800">
                        {screening.completed ? 'Completado' : 'Pendiente'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Coincidencia</p>
                      <p className={`font-medium ${screening.hasMatch ? 'text-red-600' : 'text-green-600'}`}>
                        {screening.hasMatch ? 'Si' : 'No'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Ejecutado</p>
                      <p className="font-medium text-gray-800">{formatDate(screening.executedAt)}</p>
                    </div>
                  </div>
                  {screening.matchDetails && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-1">Detalles de coincidencia</p>
                      <p className="text-red-700 bg-red-50 p-2 rounded text-sm">
                        {screening.matchDetails}
                      </p>
                    </div>
                  )}
                  {screening.responseData && (
                    <div className="mt-3">
                      <p className="text-gray-500 text-sm mb-1">Respuesta del sistema</p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto max-h-32">
                        {screening.responseData}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="text-gray-600">
          Etapa actual: <span className="font-medium">{data.currentStage || 'N/A'}</span>
        </div>
        <div className={`font-medium ${!data.hasMatches ? 'text-green-600' : 'text-red-600'}`}>
          {!data.hasMatches ? 'Sin coincidencias encontradas' : 'Se encontraron coincidencias - Revisar'}
        </div>
      </div>
    </div>
  );
};

export default ComplianceResults;
