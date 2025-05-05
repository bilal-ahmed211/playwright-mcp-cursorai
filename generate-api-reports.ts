/**
 * generate-api-reports.ts
 * Script to generate API-specific reports and dashboards
 */
import { ApiReportingDashboards } from './src/lib/common/reporting/ApiReportingDashboards';
import { MetricsCollector } from './src/lib/common/reporting/MetricsCollector';

async function main() {
  try {
    console.log('Starting API-specific report generation...');
    
    // Create metrics collector and API dashboards generator
    const metricsCollector = new MetricsCollector();
    const apiDashboards = new ApiReportingDashboards(metricsCollector);
    
    // Generate all API dashboards
    apiDashboards.generateAllDashboards();
    
    console.log('API reports generated successfully!');
    console.log('Open the dashboards from the dashboards/api directory:');
    console.log('- API Performance Dashboard: dashboards/api/api-performance-dashboard.html');
    console.log('- Contract Compliance Report: dashboards/api/api-contract-compliance.html');
    console.log('- API Coverage Analysis: dashboards/api/api-coverage-analysis.html');
  } catch (error) {
    console.error('Error generating API reports:', error);
    process.exit(1);
  }
}

main();