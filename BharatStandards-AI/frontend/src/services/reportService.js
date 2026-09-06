/**
 * BharatStandards AI - Compliance Report API Client
 * Manages fetching report listings, detailed readiness dossiers, PDF generation & downloads.
 */
import { apiClient } from './apiClient';

export const reportService = {
  /**
   * Fetch all reports owned by the authenticated user.
   * @param {Object} [params]
   * @param {number|string} [params.product_id]
   * @returns {Promise<Array>}
   */
  async getReports(params = {}) {
    const query = new URLSearchParams();
    if (params.product_id) query.append('product_id', params.product_id);
    const qs = query.toString();
    return await apiClient.get(`/reports${qs ? `?${qs}` : ''}`);
  },

  /**
   * Fetch complete structured report dossier by ID.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async getReport(id) {
    return await apiClient.get(`/reports/${id}`);
  },

  /**
   * Generate a formal report dossier from a compliance assessment.
   * @param {number|string} complianceReportId
   * @returns {Promise<Object>}
   */
  async generateReport(complianceReportId) {
    return await apiClient.post('/reports/generate', {
      compliance_report_id: complianceReportId,
    });
  },

  /**
   * Fetch report directly from a compliance assessment ID (or auto-generate if missing).
   * @param {number|string} complianceId
   * @returns {Promise<Object>}
   */
  async getReportForCompliance(complianceId) {
    return await apiClient.get(`/compliance/${complianceId}/report`);
  },

  /**
   * Download the compliance dossier as a PDF file.
   * @param {number|string} id
   * @param {string} [filename='Compliance-Readiness-Report.pdf']
   */
  async downloadReport(id, filename = 'Compliance-Readiness-Report.pdf') {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/reports/${id}/download`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Failed to download PDF report.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Permanently delete a report.
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async deleteReport(id) {
    return await apiClient.delete(`/reports/${id}`);
  },
};
