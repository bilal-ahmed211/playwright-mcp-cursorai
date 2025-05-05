/**
 * ApiReportingDashboards.ts
 * Specialized reporting dashboards for API testing
 */
import * as fs from 'fs';
import * as path from 'path';
import { MetricsCollector } from './MetricsCollector';

// Define interfaces for the data structures
interface PerformanceData {
  endpoints: string[];
  responseTimes: number[];
  successRates: number[];
  throughput: number[];
  timestamps: string[];
}

interface ValidationResult {
  endpoint: string;
  status: string;
  errorType: string | null;
  timestamp: string;
}

interface ComplianceData {
  endpoints: string[];
  validationResults: ValidationResult[];
  errorTypes: Record<string, number>;
  complianceRate: number;
  trendData: any[];
}

interface MethodCoverage {
  tested: number;
  total: number;
}

interface ServiceEndpoints {
  total: number;
  tested: number;
  untested: number;
}

interface ServiceMethodCoverage {
  GET: MethodCoverage;
  POST: MethodCoverage;
  PUT: MethodCoverage;
  DELETE: MethodCoverage;
  PATCH: MethodCoverage;
}

interface ServiceData {
  name: string;
  endpoints: ServiceEndpoints;
  coverage: number;
  methods: ServiceMethodCoverage;
  untested: Array<{ path: string; method: string }>;
}

interface CoverageData {
  services: Record<string, ServiceData>;
  overallCoverage: number;
  endpointCounts: {
    total: number;
    tested: number;
    untested: number;
  };
  methodCoverage: ServiceMethodCoverage;
}

interface ErrorWithMessage {
  message: string;
}

export class ApiReportingDashboards {
  private metricsCollector: MetricsCollector;
  private dashboardsDir: string;
  private metricsDir: string;

  constructor(metricsCollector: MetricsCollector) {
    this.metricsCollector = metricsCollector;
    this.dashboardsDir = path.join(process.cwd(), 'dashboards', 'api');
    this.metricsDir = path.join(process.cwd(), 'metrics');
    
    // Ensure directories exist
    if (!fs.existsSync(this.dashboardsDir)) {
      fs.mkdirSync(this.dashboardsDir, { recursive: true });
    }
  }

  /**
   * Generate all API-specific dashboards
   */
  generateAllDashboards(): void {
    this.generatePerformanceDashboard();
    this.generateContractComplianceDashboard();
    this.generateCoverageAnalysisDashboard();
    console.log(`API dashboards generated in ${this.dashboardsDir}`);
  }

  /**
   * Generate performance metrics dashboard with charts and trends
   */
  generatePerformanceDashboard(): void {
    // Collect API performance data from metrics directory
    const performanceData = this.collectApiPerformanceData();
    
    // Generate performance dashboard HTML with charts
    const dashboardHtml = this.createPerformanceDashboardHtml(performanceData);
    
    // Write dashboard to file
    fs.writeFileSync(
      path.join(this.dashboardsDir, 'api-performance-dashboard.html'),
      dashboardHtml
    );
  }

  /**
   * Generate contract compliance dashboard showing schema validation results
   */
  generateContractComplianceDashboard(): void {
    // Collect schema validation results
    const complianceData = this.collectContractComplianceData();
    
    // Generate compliance dashboard HTML
    const dashboardHtml = this.createContractComplianceDashboardHtml(complianceData);
    
    // Write dashboard to file
    fs.writeFileSync(
      path.join(this.dashboardsDir, 'api-contract-compliance.html'),
      dashboardHtml
    );
  }

  /**
   * Generate API test coverage analysis dashboard
   */
  generateCoverageAnalysisDashboard(): void {
    // Collect API coverage data
    const coverageData = this.collectApiCoverageData();
    
    // Generate coverage dashboard HTML
    const dashboardHtml = this.createCoverageAnalysisDashboardHtml(coverageData);
    
    // Write dashboard to file
    fs.writeFileSync(
      path.join(this.dashboardsDir, 'api-coverage-analysis.html'),
      dashboardHtml
    );
  }

  /**
   * Collect performance data from metrics files
   */
  private collectApiPerformanceData(): PerformanceData {
    const performanceData: PerformanceData = {
      endpoints: [],
      responseTimes: [],
      successRates: [],
      throughput: [],
      timestamps: []
    };

    try {
      // Look for performance metrics JSON files in the metrics directory
      const perfMetricsDir = path.join(this.metricsDir, 'integrated');
      if (fs.existsSync(perfMetricsDir)) {
        const files = fs.readdirSync(perfMetricsDir).filter(file => file.endsWith('.json'));
        
        for (const file of files) {
          try {
            const filePath = path.join(perfMetricsDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (data.summary) {
              // Extract key performance metrics
              const url = data.details?.[0]?.url || 'unknown';
              if (!performanceData.endpoints.includes(url)) {
                performanceData.endpoints.push(url);
              }
              
              performanceData.responseTimes.push(data.summary.avgResponseTime || 0);
              performanceData.successRates.push(data.summary.successRate || 0);
              performanceData.throughput.push(data.summary.count / (data.summary.totalDuration / 1000) || 0);
              performanceData.timestamps.push(new Date(data.details?.[0]?.timestamp || Date.now()).toISOString());
            }
          } catch (error) {
            console.warn(`Error processing metrics file ${file}: ${(error as Error).message}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Error collecting API performance data: ${(error as Error).message}`);
    }

    return performanceData;
  }

  /**
   * Collect contract compliance data from schema validation results
   */
  private collectContractComplianceData(): ComplianceData {
    const complianceData: ComplianceData = {
      endpoints: [],
      validationResults: [],
      errorTypes: {},
      complianceRate: 0,
      trendData: []
    };

    try {
      // Process Allure results for schema validation data
      const allureResultsDir = path.join(process.cwd(), 'allure-results');
      if (fs.existsSync(allureResultsDir)) {
        const files = fs.readdirSync(allureResultsDir).filter(file => file.endsWith('-result.json'));
        let totalValidations = 0;
        let passedValidations = 0;
        
        for (const file of files) {
          try {
            const filePath = path.join(allureResultsDir, file);
            const resultData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            // Look for schema validation tests
            if ((resultData.name && resultData.name.includes('schema')) || 
                (resultData.fullName && resultData.fullName.includes('schema'))) {
              
              totalValidations++;
              const isPassed = resultData.status === 'passed';
              if (isPassed) passedValidations++;
              
              // Extract endpoint information from test name or labels
              let endpoint = 'unknown';
              if (resultData.labels) {
                const apiLabel = resultData.labels.find((l: any) => l.name === 'api' || l.name === 'endpoint');
                if (apiLabel) endpoint = apiLabel.value;
              }
              
              if (!complianceData.endpoints.includes(endpoint)) {
                complianceData.endpoints.push(endpoint);
              }
              
              complianceData.validationResults.push({
                endpoint,
                status: isPassed ? 'passed' : 'failed',
                errorType: isPassed ? null : this.extractErrorType(resultData),
                timestamp: resultData.start || new Date().toISOString()
              });
              
              // Collect error types
              if (!isPassed) {
                const errorType = this.extractErrorType(resultData);
                complianceData.errorTypes[errorType] = (complianceData.errorTypes[errorType] || 0) + 1;
              }
            }
          } catch (error) {
            console.warn(`Error processing result file ${file}: ${(error as Error).message}`);
          }
        }
        
        // Calculate overall compliance rate
        complianceData.complianceRate = totalValidations > 0 ? 
          (passedValidations / totalValidations * 100) : 0;
      }
    } catch (error) {
      console.warn(`Error collecting contract compliance data: ${(error as Error).message}`);
    }

    return complianceData;
  }

  /**
   * Extract error type from test result data
   */
  private extractErrorType(resultData: any): string {
    if (!resultData.statusDetails || !resultData.statusDetails.message) {
      return 'unknown';
    }
    
    const message = resultData.statusDetails.message;
    
    if (message.includes('required property')) return 'missing-required';
    if (message.includes('type')) return 'type-mismatch';
    if (message.includes('format')) return 'format-invalid';
    if (message.includes('enum')) return 'enum-violation';
    if (message.includes('minimum') || message.includes('maximum')) return 'range-violation';
    if (message.includes('pattern')) return 'pattern-mismatch';
    
    return 'other';
  }

  /**
   * Collect API coverage data
   */
  private collectApiCoverageData(): CoverageData {
    const coverageData: CoverageData = {
      services: {},
      overallCoverage: 0,
      endpointCounts: {
        total: 0,
        tested: 0,
        untested: 0
      },
      methodCoverage: {
        GET: { tested: 0, total: 0 },
        POST: { tested: 0, total: 0 },
        PUT: { tested: 0, total: 0 },
        DELETE: { tested: 0, total: 0 },
        PATCH: { tested: 0, total: 0 }
      }
    };

    try {
      // Check if we have API specs directory for OpenAPI docs
      const apiSpecsDir = path.join(process.cwd(), 'src', 'api', 'specs');
      
      // Try to find OpenAPI/Swagger specs
      if (fs.existsSync(apiSpecsDir)) {
        const specFiles = fs.readdirSync(apiSpecsDir).filter(file => 
          file.endsWith('.json') || file.endsWith('.yaml') || file.endsWith('.yml'));
        
        // For demo purposes, we'll use placeholder data
        // In a real implementation, parse the OpenAPI specs and cross-reference with tests
        coverageData.services['petstore'] = {
          name: 'Petstore API',
          endpoints: {
            total: 10,
            tested: 7,
            untested: 3
          },
          coverage: 70,
          methods: {
            GET: { tested: 4, total: 5 },
            POST: { tested: 2, total: 2 },
            PUT: { tested: 1, total: 1 },
            DELETE: { tested: 0, total: 1 },
            PATCH: { tested: 0, total: 1 }
          },
          untested: [
            { path: '/pet/{petId}/uploadImage', method: 'POST' },
            { path: '/store/inventory', method: 'GET' },
            { path: '/user/logout', method: 'GET' }
          ]
        };
        
        // Aggregate totals
        coverageData.endpointCounts.total = 10;
        coverageData.endpointCounts.tested = 7;
        coverageData.endpointCounts.untested = 3;
        coverageData.overallCoverage = 70;
        
        // Method totals
        coverageData.methodCoverage.GET = { tested: 4, total: 5 };
        coverageData.methodCoverage.POST = { tested: 2, total: 2 };
        coverageData.methodCoverage.PUT = { tested: 1, total: 1 };
        coverageData.methodCoverage.DELETE = { tested: 0, total: 1 };
        coverageData.methodCoverage.PATCH = { tested: 0, total: 1 };
      }
    } catch (error) {
      console.warn(`Error collecting API coverage data: ${(error as Error).message}`);
    }

    return coverageData;
  }

  /**
   * Create HTML for performance dashboard
   */
  private createPerformanceDashboardHtml(data: PerformanceData): string {
    // Calculate averages for summary metrics
    const avgResponseTime = data.responseTimes.length
      ? data.responseTimes.reduce((sum: number, t: number) => sum + t, 0) / data.responseTimes.length
      : 0;
    
    const avgSuccessRate = data.successRates.length
      ? data.successRates.reduce((sum: number, r: number) => sum + r, 0) / data.successRates.length
      : 0;
    
    const avgThroughput = data.throughput.length
      ? data.throughput.reduce((sum: number, t: number) => sum + t, 0) / data.throughput.length
      : 0;

    // Create endpoint-specific performance items
    const endpointItems = data.endpoints.map((endpoint: string, index: number) => `
      <div class="endpoint-item">
        <div class="endpoint-name">${endpoint}</div>
        <div class="endpoint-metrics">
          <div class="endpoint-metric">
            <div class="endpoint-metric-label">Resp. Time</div>
            <div class="endpoint-metric-value">${index < data.responseTimes.length ? data.responseTimes[index].toFixed(2) : 'N/A'} ms</div>
          </div>
          <div class="endpoint-metric">
            <div class="endpoint-metric-label">Success</div>
            <div class="endpoint-metric-value ${
              index < data.successRates.length 
                ? (data.successRates[index] > 95 
                  ? 'success-rate-good' 
                  : data.successRates[index] > 80 
                    ? 'success-rate-medium' 
                    : 'success-rate-bad') 
                : ''
            }">${index < data.successRates.length ? data.successRates[index].toFixed(2) : 'N/A'}%</div>
          </div>
          <div class="endpoint-metric">
            <div class="endpoint-metric-label">Throughput</div>
            <div class="endpoint-metric-value">${index < data.throughput.length ? data.throughput[index].toFixed(2) : 'N/A'} req/sec</div>
          </div>
        </div>
      </div>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Performance Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/moment"></script>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
    .dashboard-container { max-width: 1200px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .dashboard-header { padding: 20px; border-bottom: 1px solid #eaeaea; display: flex; justify-content: space-between; align-items: center; }
    h1, h2, h3 { margin: 0; color: #333; }
    .metrics-summary { display: flex; padding: 20px; gap: 20px; }
    .metric-card { flex: 1; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .metric-card h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #666; }
    .metric-value { font-size: 28px; font-weight: bold; color: #2c7be5; }
    .chart-container { padding: 20px; margin-bottom: 20px; }
    .chart-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .chart-card { flex: 1; padding: 20px; border-radius: 8px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3 { margin-bottom: 15px; font-size: 16px; color: #333; }
    .endpoint-list { padding: 20px; }
    .endpoint-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
    .endpoint-name { font-weight: 500; }
    .endpoint-metrics { display: flex; gap: 20px; }
    .endpoint-metric { display: flex; flex-direction: column; align-items: center; min-width: 80px; }
    .endpoint-metric-label { font-size: 12px; color: #666; }
    .endpoint-metric-value { font-weight: bold; color: #2c7be5; }
    .success-rate-good { color: #00b894; }
    .success-rate-medium { color: #fdcb6e; }
    .success-rate-bad { color: #e17055; }
    .timestamp { font-size: 12px; color: #999; text-align: right; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>API Performance Dashboard</h1>
      <div>
        <p>Last updated: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="metrics-summary">
      <div class="metric-card">
        <h3>Avg Response Time</h3>
        <div class="metric-value">${avgResponseTime.toFixed(2)} ms</div>
      </div>
      <div class="metric-card">
        <h3>Success Rate</h3>
        <div class="metric-value">${avgSuccessRate.toFixed(2)}%</div>
      </div>
      <div class="metric-card">
        <h3>Avg Throughput</h3>
        <div class="metric-value">${avgThroughput.toFixed(2)} req/sec</div>
      </div>
      <div class="metric-card">
        <h3>Endpoints Monitored</h3>
        <div class="metric-value">${data.endpoints.length || 0}</div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-card">
        <h3>Response Time Trends</h3>
        <canvas id="responseTimeChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Success Rate Trends</h3>
        <canvas id="successRateChart"></canvas>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-card">
        <h3>Throughput Trends</h3>
        <canvas id="throughputChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Response Time Distribution</h3>
        <canvas id="distributionChart"></canvas>
      </div>
    </div>
    
    <div class="endpoint-list">
      <h2>Endpoint Performance</h2>
      ${endpointItems}
    </div>
    
    <div class="timestamp">
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Sample data
    const timestamps = ${JSON.stringify(data.timestamps)};
    const responseTimes = ${JSON.stringify(data.responseTimes)};
    const successRates = ${JSON.stringify(data.successRates)};
    const throughputs = ${JSON.stringify(data.throughput)};
    
    // Response Time Trend Chart
    const responseTimeCtx = document.getElementById('responseTimeChart').getContext('2d');
    new Chart(responseTimeCtx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Response Time (ms)',
          data: responseTimes,
          borderColor: '#2c7be5',
          backgroundColor: 'rgba(44, 123, 229, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Response Time (ms)' },
            min: 0
          }
        }
      }
    });
    
    // Success Rate Chart
    const successRateCtx = document.getElementById('successRateChart').getContext('2d');
    new Chart(successRateCtx, {
      type: 'line',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Success Rate (%)',
          data: successRates,
          borderColor: '#00b894',
          backgroundColor: 'rgba(0, 184, 148, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Success Rate (%)' },
            min: 0,
            max: 100
          }
        }
      }
    });
    
    // Throughput Chart
    const throughputCtx = document.getElementById('throughputChart').getContext('2d');
    new Chart(throughputCtx, {
      type: 'bar',
      data: {
        labels: timestamps,
        datasets: [{
          label: 'Throughput (req/sec)',
          data: throughputs,
          backgroundColor: 'rgba(253, 150, 68, 0.8)',
          borderColor: '#fd9644',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Time' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Throughput (req/sec)' },
            min: 0
          }
        }
      }
    });
    
    // Distribution Chart - using response times as sample data
    const distributionCtx = document.getElementById('distributionChart').getContext('2d');
    
    // Create histogram data
    function createHistogram(data: number[], bins = 10) {
      if (data.length === 0) return { labels: [], values: [] };
      
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      const binWidth = range / bins;
      
      const histogram = Array(bins).fill(0);
      const binLabels = [];
      
      for (let i = 0; i < bins; i++) {
        const binStart = min + (i * binWidth);
        const binEnd = binStart + binWidth;
        binLabels.push(binStart.toFixed(0) + '-' + binEnd.toFixed(0));
      }
      
      data.forEach(value => {
        if (value === max) {
          histogram[bins - 1]++;
        } else {
          const binIndex = Math.floor((value - min) / binWidth);
          histogram[binIndex]++;
        }
      });
      
      return { labels: binLabels, values: histogram };
    }
    
    const histogramData = createHistogram(responseTimes);
    
    new Chart(distributionCtx, {
      type: 'bar',
      data: {
        labels: histogramData.labels,
        datasets: [{
          label: 'Count',
          data: histogramData.values,
          backgroundColor: 'rgba(106, 137, 204, 0.8)',
          borderColor: '#6a89cc',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Response Time Range (ms)' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Count' },
            min: 0
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Create HTML for contract compliance dashboard
   */
  private createContractComplianceDashboardHtml(data: ComplianceData): string {
    // Convert error types object to array for chart
    const errorTypes = Object.entries(data.errorTypes || {}).map(([type, count]) => ({
      type,
      count
    }));

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Contract Compliance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
    .dashboard-container { max-width: 1200px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .dashboard-header { padding: 20px; border-bottom: 1px solid #eaeaea; display: flex; justify-content: space-between; align-items: center; }
    h1, h2, h3 { margin: 0; color: #333; }
    .compliance-summary { display: flex; padding: 20px; gap: 20px; }
    .compliance-card { flex: 1; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .compliance-card h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #666; }
    .compliance-value { font-size: 28px; font-weight: bold; }
    .chart-container { padding: 20px; margin-bottom: 20px; }
    .chart-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .chart-card { flex: 1; padding: 20px; border-radius: 8px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3 { margin-bottom: 15px; font-size: 16px; color: #333; }
    .endpoint-validation { padding: 20px; }
    .validation-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .validation-table th, .validation-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    .validation-table th { background-color: #f8f9fa; font-weight: 600; color: #333; }
    .status-passed { color: #00b894; font-weight: bold; }
    .status-failed { color: #e17055; font-weight: bold; }
    .error-list { padding: 20px; }
    .error-item { padding: 15px; margin-bottom: 10px; background-color: #fff3f3; border-left: 4px solid #e17055; border-radius: 4px; }
    .error-type { font-weight: bold; margin-bottom: 5px; color: #e17055; }
    .error-message { font-family: monospace; background-color: #f9f9f9; padding: 10px; border-radius: 4px; overflow-x: auto; }
    .timestamp { font-size: 12px; color: #999; text-align: right; margin-top: 20px; }
    .good-compliance { color: #00b894; }
    .medium-compliance { color: #fdcb6e; }
    .poor-compliance { color: #e17055; }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>API Contract Compliance Report</h1>
      <div>
        <p>Last updated: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="compliance-summary">
      <div class="compliance-card">
        <h3>Overall Compliance</h3>
        <div class="compliance-value ${
          data.complianceRate > 90 ? 'good-compliance' : 
          data.complianceRate > 75 ? 'medium-compliance' : 'poor-compliance'
        }">${data.complianceRate.toFixed(2)}%</div>
      </div>
      <div class="compliance-card">
        <h3>Endpoints Validated</h3>
        <div class="compliance-value">${data.endpoints.length || 0}</div>
      </div>
      <div class="compliance-card">
        <h3>Total Validations</h3>
        <div class="compliance-value">${data.validationResults.length || 0}</div>
      </div>
      <div class="compliance-card">
        <h3>Error Types Found</h3>
        <div class="compliance-value">${Object.keys(data.errorTypes || {}).length || 0}</div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-card">
        <h3>Compliance by Endpoint</h3>
        <canvas id="endpointComplianceChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Error Types Distribution</h3>
        <canvas id="errorTypesChart"></canvas>
      </div>
    </div>
    
    <div class="endpoint-validation">
      <h2>Endpoint Validation Results</h2>
      <table class="validation-table">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Status</th>
            <th>Error Type</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          ${data.validationResults.map((result: ValidationResult) => `
            <tr>
              <td>${result.endpoint}</td>
              <td class="${result.status === 'passed' ? 'status-passed' : 'status-failed'}">${result.status}</td>
              <td>${result.errorType || '-'}</td>
              <td>${new Date(result.timestamp).toLocaleString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    
    ${Object.keys(data.errorTypes || {}).length ? `
    <div class="error-list">
      <h2>Common Error Types</h2>
      ${Object.entries(data.errorTypes).map(([type, count]) => `
        <div class="error-item">
          <div class="error-type">${type} (${count} occurrences)</div>
          <div class="error-message">
            ${type === 'missing-required' ? 'Schema validation failed: required property missing' : 
              type === 'type-mismatch' ? 'Schema validation failed: property has wrong type' :
              type === 'format-invalid' ? 'Schema validation failed: property format is invalid' :
              type === 'enum-violation' ? 'Schema validation failed: value not in allowed enum values' :
              type === 'range-violation' ? 'Schema validation failed: value outside allowed range' :
              type === 'pattern-mismatch' ? 'Schema validation failed: value does not match pattern' :
              'Schema validation failed: unknown error'}
          </div>
        </div>
      `).join('')}
    </div>
    ` : ''}
    
    <div class="timestamp">
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Calculate compliance rate by endpoint
    const endpointData: Record<string, { total: number; passed: number }> = {};
    
    ${JSON.stringify(data.validationResults || [])}.forEach((result: ValidationResult) => {
      if (!endpointData[result.endpoint]) {
        endpointData[result.endpoint] = { total: 0, passed: 0 };
      }
      
      endpointData[result.endpoint].total++;
      if (result.status === 'passed') {
        endpointData[result.endpoint].passed++;
      }
    });
    
    const endpoints = Object.keys(endpointData);
    const complianceRates = endpoints.map(endpoint => 
      (endpointData[endpoint].passed / endpointData[endpoint].total) * 100
    );
    
    // Endpoint Compliance Chart
    const endpointCtx = document.getElementById('endpointComplianceChart').getContext('2d');
    new Chart(endpointCtx, {
      type: 'bar',
      data: {
        labels: endpoints,
        datasets: [{
          label: 'Compliance Rate (%)',
          data: complianceRates,
          backgroundColor: complianceRates.map(rate => 
            rate > 90 ? 'rgba(0, 184, 148, 0.7)' : 
            rate > 75 ? 'rgba(253, 203, 110, 0.7)' : 
            'rgba(225, 112, 85, 0.7)'
          ),
          borderColor: complianceRates.map(rate => 
            rate > 90 ? '#00b894' : 
            rate > 75 ? '#fdcb6e' : 
            '#e17055'
          ),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Endpoint' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Compliance Rate (%)' },
            min: 0,
            max: 100
          }
        }
      }
    });
    
    // Error Types Chart
    const errorTypesCtx = document.getElementById('errorTypesChart').getContext('2d');
    new Chart(errorTypesCtx, {
      type: 'pie',
      data: {
        labels: ${JSON.stringify(errorTypes.map(e => e.type))},
        datasets: [{
          data: ${JSON.stringify(errorTypes.map(e => e.count))},
          backgroundColor: [
            'rgba(225, 112, 85, 0.7)',
            'rgba(253, 203, 110, 0.7)',
            'rgba(106, 137, 204, 0.7)',
            'rgba(130, 204, 221, 0.7)',
            'rgba(184, 233, 148, 0.7)',
            'rgba(232, 67, 147, 0.7)'
          ],
          borderColor: [
            '#e17055',
            '#fdcb6e',
            '#6a89cc',
            '#82ccdd',
            '#b8e994',
            '#e84393'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Create HTML for API coverage analysis dashboard
   */
  private createCoverageAnalysisDashboardHtml(data: CoverageData): string {
    // Generate the service cards HTML
    const serviceCards = Object.entries(data.services).map(([serviceId, service]) => {
      const serviceColorClass = service.coverage > 80 
        ? 'good-coverage' 
        : service.coverage > 60 
          ? 'medium-coverage' 
          : 'poor-coverage';
      
      // Generate untested endpoints HTML if any exist
      const untestedEndpointsHtml = service.untested && service.untested.length > 0 
        ? `
          <div class="untested-endpoints">
            <div class="untested-title">Untested Endpoints:</div>
            <div class="untested-list">
              ${service.untested.map(endpoint => `
                <div class="untested-item">${endpoint.method} ${endpoint.path}</div>
              `).join('')}
            </div>
          </div>
        ` 
        : '';
      
      return `
        <div class="service-card">
          <div class="service-header">
            <div class="service-title">${service.name}</div>
            <div class="service-coverage-value ${serviceColorClass}">${service.coverage}% covered</div>
          </div>
          
          <div class="service-metrics">
            <div class="service-metric">
              <div class="service-metric-label">Total Endpoints</div>
              <div class="service-metric-value">${service.endpoints.total}</div>
            </div>
            <div class="service-metric">
              <div class="service-metric-label">Tested Endpoints</div>
              <div class="service-metric-value">${service.endpoints.tested}</div>
            </div>
            <div class="service-metric">
              <div class="service-metric-label">Untested Endpoints</div>
              <div class="service-metric-value">${service.endpoints.untested}</div>
            </div>
          </div>
          
          <div class="method-coverage">
            <div class="method-item get-method">
              GET: ${service.methods.GET.tested}/${service.methods.GET.total}
            </div>
            <div class="method-item post-method">
              POST: ${service.methods.POST.tested}/${service.methods.POST.total}
            </div>
            <div class="method-item put-method">
              PUT: ${service.methods.PUT.tested}/${service.methods.PUT.total}
            </div>
            <div class="method-item delete-method">
              DELETE: ${service.methods.DELETE.tested}/${service.methods.DELETE.total}
            </div>
            <div class="method-item patch-method">
              PATCH: ${service.methods.PATCH.tested}/${service.methods.PATCH.total}
            </div>
          </div>
          
          ${untestedEndpointsHtml}
        </div>
      `;
    }).join('');

    // Convert service data for charts
    const serviceNames = Object.values(data.services).map(s => s.name);
    const serviceCoverages = Object.values(data.services).map(s => s.coverage);
    const serviceCoverageColors = Object.values(data.services).map(s => 
      s.coverage > 80 ? 'rgba(0, 184, 148, 0.7)' : 
      s.coverage > 60 ? 'rgba(253, 203, 110, 0.7)' : 
      'rgba(225, 112, 85, 0.7)'
    );
    const serviceCoverageBorders = Object.values(data.services).map(s => 
      s.coverage > 80 ? '#00b894' : 
      s.coverage > 60 ? '#fdcb6e' : 
      '#e17055'
    );

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Test Coverage Analysis</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f7fa; }
    .dashboard-container { max-width: 1200px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
    .dashboard-header { padding: 20px; border-bottom: 1px solid #eaeaea; display: flex; justify-content: space-between; align-items: center; }
    h1, h2, h3 { margin: 0; color: #333; }
    .coverage-summary { display: flex; padding: 20px; gap: 20px; }
    .coverage-card { flex: 1; padding: 20px; border-radius: 8px; background-color: #f8f9fa; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
    .coverage-card h3 { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; color: #666; }
    .coverage-value { font-size: 28px; font-weight: bold; color: #2c7be5; }
    .chart-container { padding: 20px; margin-bottom: 20px; }
    .chart-row { display: flex; gap: 20px; margin-bottom: 20px; }
    .chart-card { flex: 1; padding: 20px; border-radius: 8px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .chart-card h3 { margin-bottom: 15px; font-size: 16px; color: #333; }
    .service-coverage { padding: 20px; }
    .service-card { padding: 20px; margin-bottom: 20px; border-radius: 8px; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .service-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .service-title { font-size: 18px; font-weight: bold; color: #333; }
    .service-coverage-value { font-size: 18px; font-weight: bold; }
    .service-metrics { display: flex; gap: 20px; margin-bottom: 15px; }
    .service-metric { padding: 10px; background-color: #f8f9fa; border-radius: 4px; text-align: center; flex: 1; }
    .service-metric-label { font-size: 12px; color: #666; margin-bottom: 5px; }
    .service-metric-value { font-weight: bold; color: #2c7be5; }
    .method-coverage { display: flex; gap: 10px; margin-bottom: 15px; }
    .method-item { padding: 8px 12px; border-radius: 4px; font-size: 14px; }
    .get-method { background-color: #dff0d8; color: #3c763d; }
    .post-method { background-color: #d9edf7; color: #31708f; }
    .put-method { background-color: #fcf8e3; color: #8a6d3b; }
    .delete-method { background-color: #f2dede; color: #a94442; }
    .patch-method { background-color: #e8eaf6; color: #3949ab; }
    .untested-endpoints { margin-top: 15px; }
    .untested-title { font-weight: bold; margin-bottom: 10px; color: #a94442; }
    .untested-list { background-color: #fff3f3; border-left: 4px solid #e17055; border-radius: 4px; padding: 15px; font-family: monospace; }
    .untested-item { margin-bottom: 5px; }
    .timestamp { font-size: 12px; color: #999; text-align: right; margin-top: 20px; }
    .good-coverage { color: #00b894; }
    .medium-coverage { color: #fdcb6e; }
    .poor-coverage { color: #e17055; }
  </style>
</head>
<body>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>API Test Coverage Analysis</h1>
      <div>
        <p>Last updated: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="coverage-summary">
      <div class="coverage-card">
        <h3>Overall Coverage</h3>
        <div class="coverage-value ${
          data.overallCoverage > 80 ? 'good-coverage' : 
          data.overallCoverage > 60 ? 'medium-coverage' : 'poor-coverage'
        }">${data.overallCoverage}%</div>
      </div>
      <div class="coverage-card">
        <h3>Endpoints Tested</h3>
        <div class="coverage-value">${data.endpointCounts.tested} / ${data.endpointCounts.total}</div>
      </div>
      <div class="coverage-card">
        <h3>Untested Endpoints</h3>
        <div class="coverage-value ${
          data.endpointCounts.untested === 0 ? 'good-coverage' : 
          data.endpointCounts.untested < 3 ? 'medium-coverage' : 'poor-coverage'
        }">${data.endpointCounts.untested}</div>
      </div>
      <div class="coverage-card">
        <h3>API Services</h3>
        <div class="coverage-value">${Object.keys(data.services).length}</div>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-card">
        <h3>Coverage by Service</h3>
        <canvas id="serviceCoverageChart"></canvas>
      </div>
      <div class="chart-card">
        <h3>Method Coverage</h3>
        <canvas id="methodCoverageChart"></canvas>
      </div>
    </div>
    
    <div class="chart-row">
      <div class="chart-card">
        <h3>Tested vs Untested Endpoints</h3>
        <canvas id="endpointCoverageChart"></canvas>
      </div>
    </div>
    
    <div class="service-coverage">
      <h2>Service-level Coverage</h2>
      ${serviceCards}
    </div>
    
    <div class="timestamp">
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Service Coverage Chart
    const serviceCtx = document.getElementById('serviceCoverageChart').getContext('2d');
    new Chart(serviceCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(serviceNames)},
        datasets: [{
          label: 'Coverage (%)',
          data: ${JSON.stringify(serviceCoverages)},
          backgroundColor: ${JSON.stringify(serviceCoverageColors)},
          borderColor: ${JSON.stringify(serviceCoverageBorders)},
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: { display: true, text: 'Service' }
          },
          y: {
            display: true,
            title: { display: true, text: 'Coverage (%)' },
            min: 0,
            max: 100
          }
        }
      }
    });
    
    // Method Coverage Chart
    const methodCtx = document.getElementById('methodCoverageChart').getContext('2d');
    new Chart(methodCtx, {
      type: 'radar',
      data: {
        labels: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        datasets: [{
          label: 'Tested',
          data: [
            ${data.methodCoverage.GET.tested},
            ${data.methodCoverage.POST.tested},
            ${data.methodCoverage.PUT.tested},
            ${data.methodCoverage.DELETE.tested},
            ${data.methodCoverage.PATCH.tested}
          ],
          backgroundColor: 'rgba(44, 123, 229, 0.2)',
          borderColor: '#2c7be5',
          borderWidth: 2,
          pointBackgroundColor: '#2c7be5'
        }, {
          label: 'Total',
          data: [
            ${data.methodCoverage.GET.total},
            ${data.methodCoverage.POST.total},
            ${data.methodCoverage.PUT.total},
            ${data.methodCoverage.DELETE.total},
            ${data.methodCoverage.PATCH.total}
          ],
          backgroundColor: 'rgba(192, 192, 192, 0.2)',
          borderColor: '#c0c0c0',
          borderWidth: 2,
          pointBackgroundColor: '#c0c0c0'
        }]
      },
      options: {
        responsive: true,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            suggestedMin: 0
          }
        }
      }
    });
    
    // Endpoint Coverage Chart
    const endpointCtx = document.getElementById('endpointCoverageChart').getContext('2d');
    new Chart(endpointCtx, {
      type: 'doughnut',
      data: {
        labels: ['Tested Endpoints', 'Untested Endpoints'],
        datasets: [{
          data: [${data.endpointCounts.tested}, ${data.endpointCounts.untested}],
          backgroundColor: ['rgba(0, 184, 148, 0.7)', 'rgba(225, 112, 85, 0.7)'],
          borderColor: ['#00b894', '#e17055'],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
  }
}