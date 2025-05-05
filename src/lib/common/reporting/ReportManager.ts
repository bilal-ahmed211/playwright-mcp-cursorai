import { MetricsCollector } from './MetricsCollector';
import { AllureEnhancer } from './AllureEnhancer';
import { ApiReportingDashboards } from './ApiReportingDashboards';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Main function to generate enhanced reports after test execution.
 * - Collects metrics from test results (if available)
 * - Enhances the Allure report with dashboards and widgets
 * - Generates API-specific dashboards for performance, compliance, and coverage
 */
export async function generateReports(testResults?: any[]): Promise<void> {
  // 1. Collect metrics if test results are provided
  const metricsCollector = new MetricsCollector();
  if (testResults && Array.isArray(testResults)) {
    metricsCollector.collectRunMetrics(testResults);
  }

  // 2. Enhance the Allure report with dashboards and widgets
  const allureResultsDir = path.join(process.cwd(), 'allure-results');
  const allureReportDir = path.join(process.cwd(), 'allure-report');
  const enhancer = new AllureEnhancer(allureResultsDir, allureReportDir, metricsCollector);
  enhancer.enhanceAllureReport();
  
  // 3. Generate API-specific reporting dashboards
  console.log('Generating API-specific dashboards...');
  const apiDashboards = new ApiReportingDashboards(metricsCollector);
  apiDashboards.generateAllDashboards();

  // 4. Print summary or next steps
  if (fs.existsSync(path.join(allureReportDir, 'index.html'))) {
    console.log('Allure report enhanced. Open it with:');
    console.log(`  npx allure open ${allureReportDir}`);
  } else {
    console.warn('Allure report index.html not found. Did you run the Allure report generation step?');
  }
  
  console.log('API dashboards generated. Open them from the dashboards/api directory.');
}