package com.globalcmx.api.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Request DTO for generating AI analysis report PDFs.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIReportRequest {
    private String title;
    private String subtitle;
    private String generatedAt;
    private List<KPIItem> kpis;
    private List<ChartImage> chartImages;
    private List<TableData> tables;
    private List<TextSection> textSections;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KPIItem {
        private String label;
        private String value;
        private String color;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChartImage {
        private String title;
        private String dataUrl;  // base64 encoded image
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TableData {
        private String title;
        private List<String> columns;
        private List<List<String>> rows;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TextSection {
        private String title;
        private String content;
    }
}
