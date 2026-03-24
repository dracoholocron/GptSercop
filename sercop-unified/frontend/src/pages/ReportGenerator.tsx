import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Heading,
  VStack,
  HStack,
  Text,
  Spinner,
  Input,
} from '@chakra-ui/react';
import { FiDownload, FiPlay, FiPlus, FiX } from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { API_BASE_URL } from '../config/api.config';
import { notify } from '../components/ui/toaster';

interface Column {
  id: string;
  name: string;
  type: string;
  filterable: boolean;
  sortable: boolean;
}

interface TableMetadata {
  id: string;
  name: string;
  description: string;
  relatedTables: string[];
  columns: Column[];
}

interface FilterOperator {
  id: string;
  label: string;
  requiresValue?: boolean;
  requiresTwoValues?: boolean;
}

interface ReportFilter {
  columnId: string;
  operator: string;
  value?: string;
  value2?: string;
}

interface AggregationFunction {
  id: string;
  label: string;
  description: string;
}

interface AggregatedColumn {
  function: string;
  columnId: string;
  alias: string;
}

interface ReportMetadata {
  version: string;
  tables: TableMetadata[];
  filterOperators: {
    [key: string]: FilterOperator[];
  };
  aggregationFunctions: AggregationFunction[];
}

export const ReportGenerator = () => {
  const { getColors } = useTheme();
  const colors = getColors();

  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);
  const [groupBy, setGroupBy] = useState<string[]>([]);
  const [aggregatedColumns, setAggregatedColumns] = useState<AggregatedColumn[]>([]);
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/reports/metadata`);
      const data = await response.json();
      setMetadata(data);
    } catch (error) {
      console.error('Error al cargar metadata:', error);
      notify.error('Error', 'Error al cargar la metadata de reportes');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (tables: string[]) => {
    setSelectedTables(tables);
    setSelectedColumns([]);
    setFilters([]);
    setReportData(null);
  };

  const addFilter = () => {
    setFilters([...filters, { columnId: '', operator: '' }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof ReportFilter, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const addAggregatedColumn = () => {
    setAggregatedColumns([...aggregatedColumns, { function: '', columnId: '', alias: '' }]);
  };

  const removeAggregatedColumn = (index: number) => {
    setAggregatedColumns(aggregatedColumns.filter((_, i) => i !== index));
  };

  const updateAggregatedColumn = (index: number, field: keyof AggregatedColumn, value: string) => {
    const newAggColumns = [...aggregatedColumns];
    newAggColumns[index] = { ...newAggColumns[index], [field]: value };
    setAggregatedColumns(newAggColumns);
  };

  const generateReport = async () => {
    if (selectedTables.length === 0 || selectedColumns.length === 0) {
      notify.warning('Validación', 'Selecciona al menos una tabla y una columna');
      return;
    }

    setGenerating(true);
    try {
      // Por ahora, generamos el reporte solo para la primera tabla seleccionada
      // En el futuro, esto podría combinar datos de múltiples tablas
      const response = await fetch(`${API_BASE_URL}/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTables[0],
          columnIds: selectedColumns,
          filters: filters.filter(f => f.columnId && f.operator),
          groupBy: groupBy,
          aggregatedColumns: aggregatedColumns.filter(ac => ac.function && ac.columnId && ac.alias),
          limit: 10,
        }),
      });

      const data = await response.json();
      setReportData(data);
    } catch (error) {
      console.error('Error al generar reporte:', error);
      notify.error('Error', 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  // Obtener metadata de las tablas seleccionadas y combinar sus columnas
  const selectedTablesMetadata = metadata?.tables?.filter(t => selectedTables.includes(t.id)) || [];
  const allColumns = selectedTablesMetadata.flatMap(table =>
    table.columns.map(col => ({ ...col, tableName: table.name, tableId: table.id }))
  );

  // Determinar si una tabla está habilitada según las relaciones
  const isTableEnabled = (table: TableMetadata): boolean => {
    // Si no hay tablas seleccionadas, todas están habilitadas
    if (selectedTables.length === 0) return true;

    // Si la tabla ya está seleccionada, está habilitada
    if (selectedTables.includes(table.id)) return true;

    // Verificar si hay relaciones bidireccionales con alguna tabla seleccionada
    return selectedTablesMetadata.some(selectedTable => {
      // Asegurar que ambos arrays de relaciones existan
      const selectedRelations = selectedTable.relatedTables || [];
      const currentRelations = table.relatedTables || [];

      // ¿La tabla actual está en las relaciones de la tabla seleccionada?
      const isRelatedToSelected = selectedRelations.includes(table.id);
      // ¿La tabla seleccionada está en las relaciones de la tabla actual?
      const selectedIsRelatedToCurrent = currentRelations.includes(selectedTable.id);

      return isRelatedToSelected || selectedIsRelatedToCurrent;
    });
  };

  if (loading) {
    return (
      <Box p={8} display="flex" justifyContent="center" alignItems="center" minH="400px">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={8} bg={colors.bgColor} minH="100vh">
      <Heading size="lg" mb={6} color={colors.textColor}>
        Generador de Reportes
      </Heading>

      <VStack align="stretch" gap={6}>
        {/* Selección de Tablas */}
        <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
          <Heading size="sm" mb={4} color={colors.textColor}>
            1. Seleccionar Tablas
          </Heading>

          <Box display="flex" flexDirection="column" gap={2}>
            {metadata?.tables.map(table => {
              const isEnabled = isTableEnabled(table);
              return (
                <Box
                  key={table.id}
                  display="flex"
                  alignItems="start"
                  gap={2}
                  opacity={isEnabled ? 1 : 0.5}
                  cursor={isEnabled ? 'pointer' : 'not-allowed'}
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(table.id)}
                    disabled={!isEnabled}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleTableChange([...selectedTables, table.id]);
                      } else {
                        handleTableChange(selectedTables.filter(id => id !== table.id));
                      }
                    }}
                    style={{ marginTop: '4px', cursor: isEnabled ? 'pointer' : 'not-allowed' }}
                  />
                  <Box
                    flex={1}
                    cursor={isEnabled ? 'pointer' : 'not-allowed'}
                    onClick={() => {
                      if (!isEnabled) return;
                      if (selectedTables.includes(table.id)) {
                        handleTableChange(selectedTables.filter(id => id !== table.id));
                      } else {
                        handleTableChange([...selectedTables, table.id]);
                      }
                    }}
                  >
                    <Text color={colors.textColor} fontWeight="medium">{table.name}</Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      {table.description}
                    </Text>
                  </Box>
                </Box>
              );
            })}
          </Box>

          {selectedTables.length > 0 && (
            <Text mt={4} fontSize="sm" color={colors.textColorSecondary}>
              {selectedTables.length} tabla(s) seleccionada(s)
            </Text>
          )}
        </Box>

        {/* Selección de Columnas */}
        {selectedTables.length > 0 && (
          <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
            <Heading size="sm" mb={4} color={colors.textColor}>
              2. Seleccionar Columnas
            </Heading>

            <Box display="flex" flexDirection="column" gap={2}>
              {allColumns.map(column => (
                <Box key={`${column.tableId}-${column.id}`} display="flex" alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedColumns([...selectedColumns, column.id]);
                      } else {
                        setSelectedColumns(selectedColumns.filter(id => id !== column.id));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <HStack gap={2} flex={1} cursor="pointer" onClick={() => {
                    if (selectedColumns.includes(column.id)) {
                      setSelectedColumns(selectedColumns.filter(id => id !== column.id));
                    } else {
                      setSelectedColumns([...selectedColumns, column.id]);
                    }
                  }}>
                    <Text color={colors.textColor}>{column.name}</Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      ({column.type})
                    </Text>
                    {selectedTables.length > 1 && (
                      <Text fontSize="xs" color={colors.primaryColor}>
                        - {column.tableName}
                      </Text>
                    )}
                  </HStack>
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {/* Criterios de Búsqueda */}
        {selectedColumns.length > 0 && (
          <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm" color={colors.textColor}>
                3. Criterios de Búsqueda (Opcional)
              </Heading>
              <Button
                onClick={addFilter}
                colorPalette="blue"
                variant="outline"
                size="sm"
              >
                <HStack gap={2}>
                  <FiPlus />
                  <Text>Agregar Filtro</Text>
                </HStack>
              </Button>
            </HStack>

            {filters.length === 0 ? (
              <Text fontSize="sm" color={colors.textColorSecondary}>
                No hay filtros configurados. Haz clic en "Agregar Filtro" para crear uno.
              </Text>
            ) : (
              <VStack align="stretch" gap={3}>
                {filters.map((filter, index) => {
                  const selectedColumn = allColumns.find(col => col.id === filter.columnId);
                  const operators = selectedColumn
                    ? metadata?.filterOperators[selectedColumn.type] || []
                    : [];
                  const selectedOperator = operators.find(op => op.id === filter.operator);

                  return (
                    <Box
                      key={index}
                      p={4}
                      bg={colors.bgColor}
                      borderRadius="md"
                      borderWidth="1px"
                      borderColor={colors.borderColor}
                    >
                      <HStack gap={3} align="start">
                        {/* Columna */}
                        <Box flex={1}>
                          <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                            Columna
                          </Text>
                          <select
                            value={filter.columnId}
                            onChange={(e) => {
                              const newFilters = [...filters];
                              newFilters[index] = {
                                columnId: e.target.value,
                                operator: '',
                                value: '',
                                value2: '',
                              };
                              setFilters(newFilters);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.borderColor}`,
                              backgroundColor: colors.bgColor,
                              color: colors.textColor,
                            }}
                          >
                            <option value="">Seleccionar...</option>
                            {allColumns.map(col => (
                              <option key={`${col.tableId}-${col.id}`} value={col.id}>
                                {col.name} ({col.type})
                              </option>
                            ))}
                          </select>
                        </Box>

                        {/* Operador */}
                        <Box flex={1}>
                          <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                            Operador
                          </Text>
                          <select
                            value={filter.operator}
                            onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                            disabled={!filter.columnId}
                            style={{
                              width: '100%',
                              padding: '8px',
                              borderRadius: '6px',
                              border: `1px solid ${colors.borderColor}`,
                              backgroundColor: colors.bgColor,
                              color: colors.textColor,
                              opacity: !filter.columnId ? 0.5 : 1,
                            }}
                          >
                            <option value="">Seleccionar...</option>
                            {operators.map(op => (
                              <option key={op.id} value={op.id}>
                                {op.label}
                              </option>
                            ))}
                          </select>
                        </Box>

                        {/* Valor 1 */}
                        {selectedOperator?.requiresValue && (
                          <Box flex={1}>
                            <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                              Valor
                            </Text>
                            <Input
                              value={filter.value || ''}
                              onChange={(e) => updateFilter(index, 'value', e.target.value)}
                              placeholder="Ingresar valor..."
                              size="sm"
                            />
                          </Box>
                        )}

                        {/* Valor 2 (para BETWEEN) */}
                        {selectedOperator?.requiresTwoValues && (
                          <Box flex={1}>
                            <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                              Valor 2
                            </Text>
                            <Input
                              value={filter.value2 || ''}
                              onChange={(e) => updateFilter(index, 'value2', e.target.value)}
                              placeholder="Ingresar valor..."
                              size="sm"
                            />
                          </Box>
                        )}

                        {/* Botón Eliminar */}
                        <Box>
                          <Text fontSize="xs" color="transparent" mb={1}>
                            -
                          </Text>
                          <Button
                            onClick={() => removeFilter(index)}
                            colorPalette="red"
                            variant="ghost"
                            size="sm"
                          >
                            <FiX />
                          </Button>
                        </Box>
                      </HStack>
                    </Box>
                  );
                })}
              </VStack>
            )}
          </Box>
        )}

        {/* Agrupamiento */}
        {selectedColumns.length > 0 && (
          <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
            <Heading size="sm" mb={4} color={colors.textColor}>
              4. Agrupar Por (Opcional)
            </Heading>

            <Text fontSize="sm" color={colors.textColorSecondary} mb={3}>
              Selecciona las columnas por las cuales deseas agrupar los datos
            </Text>

            <Box display="flex" flexDirection="column" gap={2}>
              {allColumns.map(column => (
                <Box key={`group-${column.tableId}-${column.id}`} display="flex" alignItems="center" gap={2}>
                  <input
                    type="checkbox"
                    checked={groupBy.includes(column.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setGroupBy([...groupBy, column.id]);
                      } else {
                        setGroupBy(groupBy.filter(id => id !== column.id));
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  />
                  <HStack gap={2} flex={1} cursor="pointer" onClick={() => {
                    if (groupBy.includes(column.id)) {
                      setGroupBy(groupBy.filter(id => id !== column.id));
                    } else {
                      setGroupBy([...groupBy, column.id]);
                    }
                  }}>
                    <Text color={colors.textColor}>{column.name}</Text>
                    <Text fontSize="xs" color={colors.textColorSecondary}>
                      ({column.type})
                    </Text>
                  </HStack>
                </Box>
              ))}
            </Box>

            {groupBy.length > 0 && (
              <Text mt={3} fontSize="sm" color={colors.textColorSecondary}>
                {groupBy.length} columna(s) seleccionada(s) para agrupar
              </Text>
            )}
          </Box>
        )}

        {/* Columnas Calculadas */}
        {selectedColumns.length > 0 && (
          <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm" color={colors.textColor}>
                5. Columnas Calculadas (Opcional)
              </Heading>
              <Button
                onClick={addAggregatedColumn}
                colorPalette="blue"
                variant="outline"
                size="sm"
              >
                <HStack gap={2}>
                  <FiPlus />
                  <Text>Agregar Columna Calculada</Text>
                </HStack>
              </Button>
            </HStack>

            {aggregatedColumns.length === 0 ? (
              <Text fontSize="sm" color={colors.textColorSecondary}>
                No hay columnas calculadas. Haz clic en "Agregar Columna Calculada" para crear una.
              </Text>
            ) : (
              <VStack align="stretch" gap={3}>
                {aggregatedColumns.map((aggColumn, index) => (
                  <Box
                    key={index}
                    p={4}
                    bg={colors.bgColor}
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={colors.borderColor}
                  >
                    <HStack gap={3} align="start">
                      {/* Función de Agregación */}
                      <Box flex={1}>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                          Función
                        </Text>
                        <select
                          value={aggColumn.function}
                          onChange={(e) => updateAggregatedColumn(index, 'function', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.borderColor}`,
                            backgroundColor: colors.bgColor,
                            color: colors.textColor,
                          }}
                        >
                          <option value="">Seleccionar...</option>
                          {metadata?.aggregationFunctions?.map(func => (
                            <option key={func.id} value={func.id}>
                              {func.label}
                            </option>
                          ))}
                        </select>
                      </Box>

                      {/* Columna */}
                      <Box flex={1}>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                          Columna
                        </Text>
                        <select
                          value={aggColumn.columnId}
                          onChange={(e) => updateAggregatedColumn(index, 'columnId', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            borderRadius: '6px',
                            border: `1px solid ${colors.borderColor}`,
                            backgroundColor: colors.bgColor,
                            color: colors.textColor,
                          }}
                        >
                          <option value="">Seleccionar...</option>
                          {allColumns.map(col => (
                            <option key={`agg-${col.tableId}-${col.id}`} value={col.id}>
                              {col.name} ({col.type})
                            </option>
                          ))}
                        </select>
                      </Box>

                      {/* Alias */}
                      <Box flex={1}>
                        <Text fontSize="xs" color={colors.textColorSecondary} mb={1}>
                          Nombre Personalizado
                        </Text>
                        <Input
                          value={aggColumn.alias}
                          onChange={(e) => updateAggregatedColumn(index, 'alias', e.target.value)}
                          placeholder="ej: Total Ventas"
                          size="sm"
                        />
                      </Box>

                      {/* Botón Eliminar */}
                      <Box>
                        <Text fontSize="xs" color="transparent" mb={1}>
                          -
                        </Text>
                        <Button
                          onClick={() => removeAggregatedColumn(index)}
                          colorPalette="red"
                          variant="ghost"
                          size="sm"
                        >
                          <FiX />
                        </Button>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        )}

        {/* Botón Generar */}
        {selectedTables.length > 0 && selectedColumns.length > 0 && (
          <Box>
            <Button
              onClick={generateReport}
              loading={generating}
              colorPalette="blue"
              size="lg"
              width="full"
            >
              <HStack gap={2}>
                <FiPlay />
                <Text>Generar Reporte</Text>
              </HStack>
            </Button>
          </Box>
        )}

        {/* Resultados */}
        {reportData && (
          <Box p={6} bg={colors.cardBg} borderRadius="lg" borderWidth="1px" borderColor={colors.borderColor}>
            <HStack justify="space-between" mb={4}>
              <Heading size="sm" color={colors.textColor}>
                Resultados: {reportData.tableName}
              </Heading>
              <Text fontSize="sm" color={colors.textColorSecondary}>
                {reportData.totalRecords} registros
              </Text>
            </HStack>

            <Box overflowX="auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                    {reportData.columns.map((col: Column) => (
                      <th key={col.id} style={{ padding: '12px', textAlign: 'left', color: colors.textColor }}>
                        {col.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.data.map((row: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: `1px solid ${colors.borderColor}` }}>
                      {reportData.columns.map((col: Column) => (
                        <td key={col.id} style={{ padding: '12px', color: colors.textColor }}>
                          {String(row[col.id])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>

            <HStack mt={4} gap={4}>
              <Button colorPalette="green" variant="outline">
                <HStack gap={2}>
                  <FiDownload />
                  <Text>Exportar Excel</Text>
                </HStack>
              </Button>
              <Button colorPalette="blue" variant="outline">
                <HStack gap={2}>
                  <FiDownload />
                  <Text>Exportar CSV</Text>
                </HStack>
              </Button>
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
