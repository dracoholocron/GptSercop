package com.globalcmx.api.controller;

import com.globalcmx.api.dto.ai.AIReportRequest;
import com.globalcmx.api.service.document.HtmlToPdfConverter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * REST controller for generating AI analysis report PDFs.
 */
@RestController
@RequestMapping("/v1/ai/report")
@RequiredArgsConstructor
@Slf4j
public class AIReportController {

    private final HtmlToPdfConverter pdfConverter;

    private static final String AI_REPORT_TEMPLATE = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8"/>
            <style>
                @page {
                    size: A4;
                    margin: 2cm;
                }
                * {
                    box-sizing: border-box;
                }
                body {
                    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                    font-size: 11pt;
                    color: #2D3748;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                }
                .header {
                    border-bottom: 3px solid #3182CE;
                    padding-bottom: 15px;
                    margin-bottom: 25px;
                }
                .title {
                    font-size: 22pt;
                    font-weight: bold;
                    color: #1A365D;
                    margin: 0 0 5px 0;
                }
                .subtitle {
                    font-size: 11pt;
                    color: #718096;
                    margin: 5px 0;
                }
                .generated-at {
                    font-size: 9pt;
                    color: #A0AEC0;
                    margin-top: 10px;
                }
                .kpi-grid {
                    display: table;
                    width: 100%;
                    margin: 20px 0;
                    border-collapse: separate;
                    border-spacing: 10px;
                }
                .kpi-row {
                    display: table-row;
                }
                .kpi-box {
                    display: table-cell;
                    background-color: #F7FAFC;
                    border-radius: 8px;
                    padding: 15px;
                    border-left: 4px solid #3182CE;
                    vertical-align: top;
                    width: 25%;
                }
                .kpi-box.blue { border-left-color: #3182CE; }
                .kpi-box.green { border-left-color: #38A169; }
                .kpi-box.purple { border-left-color: #805AD5; }
                .kpi-box.orange { border-left-color: #DD6B20; }
                .kpi-box.teal { border-left-color: #319795; }
                .kpi-box.red { border-left-color: #E53E3E; }
                .kpi-value {
                    font-size: 18pt;
                    font-weight: bold;
                    color: #1A365D;
                    margin-bottom: 5px;
                }
                .kpi-label {
                    font-size: 9pt;
                    color: #718096;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .section {
                    margin: 25px 0;
                    page-break-inside: avoid;
                }
                .section-title {
                    font-size: 14pt;
                    font-weight: bold;
                    color: #2D3748;
                    border-bottom: 1px solid #E2E8F0;
                    padding-bottom: 8px;
                    margin-bottom: 15px;
                }
                .chart-container {
                    margin: 15px 0;
                    text-align: center;
                }
                .chart-image {
                    max-width: 100%;
                    max-height: 350px;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 10px 0;
                    font-size: 9pt;
                }
                th {
                    background-color: #EDF2F7;
                    text-align: left;
                    padding: 10px 8px;
                    font-weight: 600;
                    color: #4A5568;
                    border-bottom: 2px solid #CBD5E0;
                }
                td {
                    padding: 8px;
                    border-bottom: 1px solid #E2E8F0;
                    color: #4A5568;
                }
                tr:nth-child(even) {
                    background-color: #F7FAFC;
                }
                .text-content {
                    color: #4A5568;
                    line-height: 1.7;
                    white-space: pre-wrap;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 15px;
                    border-top: 1px solid #E2E8F0;
                    font-size: 8pt;
                    color: #A0AEC0;
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="title" th:text="${title}">Analysis Report</div>
                <div class="subtitle" th:text="${subtitle}">Report subtitle</div>
                <div class="generated-at">Generated: <span th:text="${generatedAt}"></span></div>
            </div>

            <!-- KPIs -->
            <div class="kpi-grid" th:if="${kpis != null and !kpis.empty}">
                <div class="kpi-row">
                    <div th:each="kpi : ${kpis}" class="kpi-box" th:classappend="${kpi.color}">
                        <div class="kpi-value" th:text="${kpi.value}">0</div>
                        <div class="kpi-label" th:text="${kpi.label}">Label</div>
                    </div>
                </div>
            </div>

            <!-- Charts as images -->
            <div th:if="${chartImages != null}" th:each="chart : ${chartImages}" class="section">
                <div class="section-title" th:text="${chart.title}">Chart</div>
                <div class="chart-container">
                    <img class="chart-image" th:src="${chart.dataUrl}" alt="Chart"/>
                </div>
            </div>

            <!-- Tables -->
            <div th:if="${tables != null}" th:each="tableData : ${tables}" class="section">
                <div class="section-title" th:text="${tableData.title}">Table</div>
                <table>
                    <thead>
                        <tr>
                            <th th:each="col : ${tableData.columns}" th:text="${col}">Column</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr th:each="row : ${tableData.rows}">
                            <td th:each="cell : ${row}" th:text="${cell}">Cell</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Text sections -->
            <div th:if="${textSections != null}" th:each="text : ${textSections}" class="section">
                <div class="section-title" th:text="${text.title}">Section</div>
                <p class="text-content" th:text="${text.content}">Content</p>
            </div>

            <div class="footer">
                GlobalCMX - AI Analysis Report | Generated automatically
            </div>
        </body>
        </html>
        """;

    @PostMapping("/generate-pdf")
    public ResponseEntity<Resource> generatePdf(@RequestBody AIReportRequest request) {
        try {
            log.info("Generating AI report PDF: {}", request.getTitle());

            // Prepare data for template
            Map<String, Object> data = new HashMap<>();
            data.put("title", request.getTitle() != null ? request.getTitle() : "Analysis Report");
            data.put("subtitle", request.getSubtitle() != null ? request.getSubtitle() : "");
            data.put("generatedAt", request.getGeneratedAt() != null ? request.getGeneratedAt() : java.time.LocalDateTime.now().toString());
            data.put("kpis", request.getKpis());
            data.put("chartImages", request.getChartImages());
            data.put("tables", request.getTables());
            data.put("textSections", request.getTextSections());

            // Generate PDF
            byte[] pdf = pdfConverter.convertHtmlToPdf(AI_REPORT_TEMPLATE, data);

            ByteArrayResource resource = new ByteArrayResource(pdf);
            String filename = "ai-report-" + System.currentTimeMillis() + ".pdf";

            log.info("AI report PDF generated successfully: {} bytes", pdf.length);

            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_PDF)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION)
                    .body(resource);

        } catch (Exception e) {
            log.error("Error generating AI report PDF", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
