/**
 * BharatStandards AI - Compliance Service API Client
 * Interfaces with the backend Compliance Engine for running readiness checks,
 * fetching requirement assessments, gap prioritizations, and assessment histories.
 */
import { apiClient } from './apiClient';

export const complianceService = {
  /**
   * Trigger an explainable, deterministic compliance audit.
   * @param {number|string} productId
   * @param {number|string} standardId
   * @returns {Promise<Object>} ComplianceReportResponse
   */
  async runCheck(productId, standardId) {
    return await apiClient.post('/compliance/check', {
      product_id: parseInt(productId, 10),
      standard_id: parseInt(standardId, 10),
    });
  },

  /**
   * Retrieve list of completed compliance assessments for the authenticated user.
   * @param {number|string} [productId] Optional filter by product
   * @returns {Promise<Array>} List of ComplianceReportResponse
   */
  async getReports(productId = null) {
    const endpoint = productId
      ? `/compliance?product_id=${encodeURIComponent(productId)}`
      : '/compliance';
    return await apiClient.get(endpoint);
  },

  /**
   * Get full details of a compliance report including results and gaps.
   * @param {number|string} reportId
   * @returns {Promise<Object>} ComplianceReportDetailResponse
   */
  async getReport(reportId) {
    return await apiClient.get(`/compliance/${reportId}`);
  },

  /**
   * Get evaluated requirement results (PASS, PARTIAL, MISSING) for a report.
   * @param {number|string} reportId
   * @returns {Promise<Array>} List of ComplianceResultResponse
   */
  async getResults(reportId) {
    return await apiClient.get(`/compliance/${reportId}/results`);
  },

  /**
   * Get non-conformance and documentation gaps for a report.
   * @param {number|string} reportId
   * @returns {Promise<Array>} List of GapResponse
   */
  async getGaps(reportId) {
    return await apiClient.get(`/compliance/${reportId}/gaps`);
  },

  /**
   * Get high-level summary metrics and gap severity distribution.
   * @param {number|string} reportId
   * @returns {Promise<Object>} ComplianceReportSummaryResponse
   */
  async getSummary(reportId) {
    return await apiClient.get(`/compliance/${reportId}/summary`);
  },

  /**
   * Retrieve latest completed compliance report for a specific product.
   * @param {number|string} productId
   * @returns {Promise<Object|null>} ComplianceReportResponse or null
   */
  async getLatestForProduct(productId) {
    try {
      return await apiClient.get(`/compliance/product/${productId}/latest`);
    } catch (err) {
      // 404 means no report found
      return null;
    }
  },

  /**
   * Retrieve overall risk summary and top risks for a report.
   * @param {number|string} reportId
   * @returns {Promise<Object>} ProductRiskSummaryResponse
   */
  async getRiskSummary(reportId) {
    return await apiClient.get(`/compliance/${reportId}/risk`);
  },

  /**
   * Retrieve all clause-level risk items for a report.
   * @param {number|string} reportId
   * @returns {Promise<Array>} List of ComplianceRiskItem
   */
  async getRisks(reportId) {
    return await apiClient.get(`/compliance/${reportId}/risks`);
  },

  /**
   * Retrieve prioritized risk action plan items.
   * @param {number|string} reportId
   * @returns {Promise<Array>} List of RiskActionPlanItem
   */
  async getRiskActions(reportId) {
    return await apiClient.get(`/compliance/${reportId}/risk/actions`);
  },

  /**
   * Run an in-memory What-If scenario simulation.
   * @param {number|string} reportId
   * @param {Array<number>} resolvedRequirementIds
   * @returns {Promise<Object>} WhatIfResponse
   */
  async runWhatIf(reportId, resolvedRequirementIds) {
    return await apiClient.post(`/compliance/${reportId}/what-if`, {
      resolved_requirement_ids: resolvedRequirementIds,
    });
  },

  /**
   * Force recalculate risk analysis for an existing report.
   * @param {number|string} reportId
   * @returns {Promise<Object>} RiskRecalculateResponse
   */
  async recalculateRisk(reportId) {
    return await apiClient.post(`/compliance/${reportId}/recalculate-risk`);
  },

  /**
   * Retrieve clause-level risk assessment for a specific requirement.
   * @param {number|string} reqId
   * @param {number|string} productId
   * @returns {Promise<Object>} ComplianceRiskItem
   */
  async getRequirementRisk(reqId, productId) {
    return await apiClient.get(`/requirements/${reqId}/risk?product_id=${encodeURIComponent(productId)}`);
  },
};
