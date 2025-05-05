export * from './ReportManager';
export * from './MetricsCollector';
export * from './AllureEnhancer';
export * from './ApiReportingDashboards';

/**
 * Enhanced reporting system for Playwright test framework.
 * Provides custom dashboards, metrics collection, and executive summary reports.
 * 
 * @example
 * // Generate all reports after test execution
 * import { generateReports } from './lib/reporting';
 * 
 * // Call from global teardown or after tests complete
 * await generateReports();
 * 
 * @example
 * // Use specific components
 * import { MetricsCollector, AllureEnhancer, ReportManager } from './lib/reporting';
 * 
 * const metricsCollector = new MetricsCollector();
 * const metrics = metricsCollector.collectRunMetrics(testResults);
 */