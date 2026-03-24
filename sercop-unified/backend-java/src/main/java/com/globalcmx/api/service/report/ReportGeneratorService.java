package com.globalcmx.api.service.report;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.globalcmx.api.dto.report.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
public class ReportGeneratorService {

    private ReportMetadataDTO metadata;
    private final ObjectMapper objectMapper;

    public ReportGeneratorService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void loadMetadata() {
        try {
            ClassPathResource resource = new ClassPathResource("reports-metadata.json");
            Map<String, Object> rawMetadata = objectMapper.readValue(resource.getInputStream(), Map.class);

            metadata = ReportMetadataDTO.builder()
                    .version((String) rawMetadata.get("version"))
                    .tables(parseTablesFromRaw((List<Map<String, Object>>) rawMetadata.get("tables")))
                    .filterOperators(parseFilterOperatorsFromRaw((Map<String, List<Map<String, Object>>>) rawMetadata.get("filterOperators")))
                    .exportFormats(parseExportFormatsFromRaw((List<Map<String, Object>>) rawMetadata.get("exportFormats")))
                    .aggregationFunctions(parseAggregationFunctionsFromRaw((List<Map<String, Object>>) rawMetadata.get("aggregationFunctions")))
                    .build();

            log.info("Metadata de reportes cargada exitosamente. {} tablas disponibles", metadata.getTables().size());
        } catch (IOException e) {
            log.error("Error al cargar metadata de reportes", e);
            throw new RuntimeException("No se pudo cargar metadata de reportes", e);
        }
    }

    public ReportMetadataDTO getMetadata() {
        return metadata;
    }

    public Map<String, Object> generateReport(ReportRequestDTO request) {
        log.info("Generando reporte para tabla: {}", request.getTableId());

        // Validar tabla
        ReportTableDTO table = metadata.getTables().stream()
                .filter(t -> t.getId().equals(request.getTableId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Tabla no encontrada: " + request.getTableId()));

        // Generar datos de ejemplo
        List<Map<String, Object>> data = generateSampleData(table, request);

        // Construir respuesta
        Map<String, Object> response = new HashMap<>();
        response.put("tableId", request.getTableId());
        response.put("tableName", table.getName());
        response.put("columns", getSelectedColumns(table, request.getColumnIds()));
        response.put("data", data);
        response.put("totalRecords", data.size());
        response.put("generatedAt", LocalDateTime.now());

        return response;
    }

    private List<Map<String, Object>> generateSampleData(ReportTableDTO table, ReportRequestDTO request) {
        List<Map<String, Object>> data = new ArrayList<>();
        int recordCount = request.getLimit() != null ? request.getLimit() : 10;

        for (int i = 0; i < recordCount; i++) {
            Map<String, Object> record = new HashMap<>();

            for (String columnId : request.getColumnIds()) {
                ReportColumnDTO column = table.getColumns().stream()
                        .filter(c -> c.getId().equals(columnId))
                        .findFirst()
                        .orElse(null);

                if (column != null) {
                    record.put(columnId, generateSampleValue(column.getType(), i));
                }
            }

            data.add(record);
        }

        return data;
    }

    private Object generateSampleValue(String type, int index) {
        switch (type) {
            case "STRING":
                return "Dato " + (index + 1);
            case "NUMBER":
                return 1000 + (index * 100);
            case "BOOLEAN":
                return index % 2 == 0;
            case "DATE":
                return LocalDateTime.now().minusDays(index).toString();
            default:
                return "N/A";
        }
    }

    private List<ReportColumnDTO> getSelectedColumns(ReportTableDTO table, List<String> columnIds) {
        return table.getColumns().stream()
                .filter(c -> columnIds.contains(c.getId()))
                .toList();
    }

    private List<ReportTableDTO> parseTablesFromRaw(List<Map<String, Object>> rawTables) {
        List<ReportTableDTO> tables = new ArrayList<>();

        for (Map<String, Object> rawTable : rawTables) {
            List<ReportColumnDTO> columns = new ArrayList<>();
            List<Map<String, Object>> rawColumns = (List<Map<String, Object>>) rawTable.get("columns");

            for (Map<String, Object> rawColumn : rawColumns) {
                columns.add(ReportColumnDTO.builder()
                        .id((String) rawColumn.get("id"))
                        .name((String) rawColumn.get("name"))
                        .type((String) rawColumn.get("type"))
                        .filterable((Boolean) rawColumn.get("filterable"))
                        .sortable((Boolean) rawColumn.get("sortable"))
                        .build());
            }

            List<String> relatedTables = (List<String>) rawTable.get("relatedTables");

            tables.add(ReportTableDTO.builder()
                    .id((String) rawTable.get("id"))
                    .name((String) rawTable.get("name"))
                    .description((String) rawTable.get("description"))
                    .relatedTables(relatedTables != null ? relatedTables : new ArrayList<>())
                    .columns(columns)
                    .build());
        }

        return tables;
    }

    private Map<String, List<FilterOperatorDTO>> parseFilterOperatorsFromRaw(Map<String, List<Map<String, Object>>> raw) {
        Map<String, List<FilterOperatorDTO>> result = new HashMap<>();

        for (Map.Entry<String, List<Map<String, Object>>> entry : raw.entrySet()) {
            List<FilterOperatorDTO> operators = new ArrayList<>();

            for (Map<String, Object> rawOp : entry.getValue()) {
                operators.add(FilterOperatorDTO.builder()
                        .id((String) rawOp.get("id"))
                        .label((String) rawOp.get("label"))
                        .requiresValue((Boolean) rawOp.get("requiresValue"))
                        .requiresTwoValues((Boolean) rawOp.get("requiresTwoValues"))
                        .build());
            }

            result.put(entry.getKey(), operators);
        }

        return result;
    }

    private List<ExportFormatDTO> parseExportFormatsFromRaw(List<Map<String, Object>> rawFormats) {
        List<ExportFormatDTO> formats = new ArrayList<>();

        for (Map<String, Object> rawFormat : rawFormats) {
            formats.add(ExportFormatDTO.builder()
                    .id((String) rawFormat.get("id"))
                    .label((String) rawFormat.get("label"))
                    .extension((String) rawFormat.get("extension"))
                    .build());
        }

        return formats;
    }

    private List<AggregationFunctionDTO> parseAggregationFunctionsFromRaw(List<Map<String, Object>> rawFunctions) {
        List<AggregationFunctionDTO> functions = new ArrayList<>();

        if (rawFunctions == null) {
            return functions;
        }

        for (Map<String, Object> rawFunction : rawFunctions) {
            functions.add(AggregationFunctionDTO.builder()
                    .id((String) rawFunction.get("id"))
                    .label((String) rawFunction.get("label"))
                    .description((String) rawFunction.get("description"))
                    .build());
        }

        return functions;
    }
}
