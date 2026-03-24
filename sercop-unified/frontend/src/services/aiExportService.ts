/**
 * AI Export Service - Handles PDF export of AI analysis results
 */

import { apiClient } from '../utils/apiClient';
import type { AIResponse, AIResult, KPIData } from './aiAssistantService';

interface AIReportData {
  title: string;
  subtitle: string;
  generatedAt: string;
  kpis: Array<{ label: string; value: string; color?: string }>;
  chartImages: Array<{ title: string; dataUrl: string }>;
  tables: Array<{ title: string; columns: string[]; rows: string[][] }>;
  textSections: Array<{ title: string; content: string }>;
}

/**
 * Service for exporting AI analysis results to PDF
 */
export const aiExportService = {
  /**
   * Prepares the report data from an AIResponse
   */
  prepareReportData(response: AIResponse, title: string): AIReportData {
    const data: AIReportData = {
      title,
      subtitle: response.message,
      generatedAt: new Date().toLocaleString(),
      kpis: [],
      chartImages: [],
      tables: [],
      textSections: [],
    };

    if (!response.results) return data;

    response.results.forEach((result: AIResult) => {
      switch (result.type) {
        case 'kpi':
          // Extract KPIs
          const kpis = result.data as KPIData[];
          data.kpis.push(...kpis.map(k => ({
            label: k.label,
            value: String(k.value),
            color: k.color || 'blue'
          })));
          break;

        case 'chart':
          // For charts, we also add the data as a table for PDF
          // The chart image will be added separately after conversion
          const chartData = result.data as Record<string, unknown>[];
          if (chartData && chartData.length > 0) {
            const columns = Object.keys(chartData[0]);
            const rows = chartData.map(row =>
              columns.map(col => String(row[col] ?? ''))
            );
            data.tables.push({
              title: `${result.title} (Data)`,
              columns,
              rows
            });
          }
          break;

        case 'table':
          // Extract table data
          const tableData = result.data as Record<string, unknown>[];
          if (tableData && tableData.length > 0) {
            const columns = Object.keys(tableData[0]);
            const rows = tableData.map(row =>
              columns.map(col => String(row[col] ?? ''))
            );
            data.tables.push({
              title: result.title,
              columns,
              rows
            });
          }
          break;

        case 'text':
          // Extract text content
          const textData = result.data as { content: string };
          if (textData?.content) {
            data.textSections.push({
              title: result.title,
              content: textData.content
            });
          }
          break;
      }
    });

    return data;
  },

  /**
   * Converts a chart element to a base64 image
   */
  async chartToImage(chartElement: HTMLElement): Promise<string> {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(chartElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
      });
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Error converting chart to image:', error);
      throw error;
    }
  },

  /**
   * Generates and downloads a PDF report
   */
  async generatePdf(
    response: AIResponse,
    title: string,
    chartElements?: Map<number, HTMLElement>
  ): Promise<void> {
    // Prepare base report data
    const reportData = this.prepareReportData(response, title);

    // Convert charts to images if provided
    if (chartElements && chartElements.size > 0) {
      const chartResults = response.results?.filter(r => r.type === 'chart') || [];

      for (const [index, element] of chartElements.entries()) {
        try {
          const dataUrl = await this.chartToImage(element);
          const chartResult = chartResults[index];
          reportData.chartImages.push({
            title: chartResult?.title || `Chart ${index + 1}`,
            dataUrl
          });
        } catch (error) {
          console.warn(`Failed to convert chart ${index} to image:`, error);
        }
      }
    }

    // Call backend to generate PDF
    const apiResponse = await apiClient('/v1/ai/report/generate-pdf', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });

    if (!apiResponse.ok) {
      throw new Error(`Failed to generate PDF: ${apiResponse.statusText}`);
    }

    // Download the PDF
    const blob = await apiResponse.blob();
    const url = URL.createObjectURL(blob);

    // Get filename from Content-Disposition header or generate one
    const contentDisposition = apiResponse.headers.get('Content-Disposition');
    let filename = `ai-report-${Date.now()}.pdf`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
};

export default aiExportService;
