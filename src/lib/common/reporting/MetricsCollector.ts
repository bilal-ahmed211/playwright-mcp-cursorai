import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { webConfig } from '../../config/webConfig';
import { apiConfig } from '../../config/apiConfig';
import { globalConfig } from '../../config/globalConfig';

/**
 * Utilities for collecting and analyzing test metrics
 */
export class MetricsCollector {
  private metricsDir: string;
  private dashboardsDir: string;
  
  constructor(
    metricsDir = path.join(process.cwd(), 'metrics'),
    dashboardsDir = path.join(process.cwd(), 'dashboards')
  ) {
    this.metricsDir = metricsDir;
    this.dashboardsDir = dashboardsDir;
    
    // Ensure directories exist
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.dashboardsDir)) {
      fs.mkdirSync(this.dashboardsDir, { recursive: true });
    }
  }
  
  /**
   * Collect metrics from a test run
   */
  collectRunMetrics(testResults: any[], additionalInfo: Record<string, any> = {}) {
    if (!testResults || testResults.length === 0) return null;
    
    const timestamp = new Date().toISOString();
    const metricsFile = path.join(this.metricsDir, `metrics-${timestamp.replace(/[:.]/g, '-')}.json`);
    
    // Get Git information
    const gitInfo = this.getGitInfo();
    
    // Create metrics object
    const metrics = {
      timestamp,
      runId: additionalInfo.runId || timestamp,
      summary: {
        total: testResults.length,
        passed: testResults.filter(r => r.status === 'passed').length,
        failed: testResults.filter(r => r.status === 'failed').length,
        skipped: testResults.filter(r => r.status === 'skipped').length,
        flaky: testResults.filter(r => r.status === 'flaky').length,
        duration: testResults.reduce((sum, r) => sum + (r.duration || 0), 0)
      },
      environment: {
        browser: webConfig.browser,
        platform: process.platform,
        ...gitInfo,
        ...additionalInfo.environment
      },
      categories: this.categorizeTests(testResults),
      testDetails: testResults.map(r => ({
        title: r.title,
        status: r.status,
        duration: r.duration || 0,
        file: r.file,
        errorMessage: r.error?.message,
        retry: r.retry || 0
      }))
    };
    
    // Write metrics to file
    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
    console.log(`Metrics saved to ${metricsFile}`);
    
    return metrics;
  }
  
  /**
   * Generate historical trends analysis
   */
  generateTrends() {
    const metricsFiles = fs.readdirSync(this.metricsDir)
      .filter(file => file.startsWith('metrics-') && file.endsWith('.json'))
      .sort(); // Naturally sorts by date due to ISO format
    
    if (metricsFiles.length === 0) {
      console.log('No metrics files found to generate trends');
      return null;
    }
    
    const allMetrics = metricsFiles.map(file => {
      try {
        const filePath = path.join(this.metricsDir, file);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (err) {
        console.error(`Error reading metrics file ${file}:`, err);
        return null;
      }
    }).filter(Boolean);
    
    // Get the last N runs (up to 20)
    const recentRuns = allMetrics.slice(-20);
    
    // Generate trends data
    const trends = {
      timestamps: recentRuns.map(m => m.timestamp),
      passRate: recentRuns.map(m => {
        const total = m.summary.total;
        return total > 0 ? (m.summary.passed / total * 100).toFixed(2) : 0;
      }),
      testCounts: {
        total: recentRuns.map(m => m.summary.total),
        passed: recentRuns.map(m => m.summary.passed),
        failed: recentRuns.map(m => m.summary.failed),
        skipped: recentRuns.map(m => m.summary.skipped)
      },
      avgDuration: recentRuns.map(m => {
        const total = m.summary.total;
        return total > 0 ? (m.summary.duration / total / 1000).toFixed(2) : 0;
      }),
      topFailingTests: this.identifyTopFailingTests(allMetrics, 10),
      stability: this.calculateTestStability(allMetrics)
    };
    
    // Save trends data
    const trendsFile = path.join(this.dashboardsDir, 'trends-data.json');
    fs.writeFileSync(trendsFile, JSON.stringify(trends, null, 2));
    
    return trends;
  }
  
  /**
   * Generate HTML dashboard with historical trends
   */
  generateTrendsDashboard() {
    const trends = this.generateTrends();
    if (!trends) return null;
    
    // Create HTML dashboard
    const htmlDashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Metrics Trends Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; background-color: #f8f9fa; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .chart-container { background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
    .flex-container { display: flex; flex-wrap: wrap; gap: 20px; }
    .chart-box { flex: 1; min-width: 300px; }
    .table-container { background: white; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
    h1, h2, h3 { color: #444; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    .good { color: green; }
    .moderate { color: orange; }
    .poor { color: red; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Test Metrics Trends Dashboard</h1>
      <p>Last updated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="chart-container">
      <h2>Pass Rate Trend</h2>
      <canvas id="passRateChart"></canvas>
    </div>
    
    <div class="flex-container">
      <div class="chart-container chart-box">
        <h2>Test Count Trends</h2>
        <canvas id="testCountChart"></canvas>
      </div>
      
      <div class="chart-container chart-box">
        <h2>Average Test Duration</h2>
        <canvas id="durationChart"></canvas>
      </div>
    </div>
    
    <div class="table-container">
      <h2>Top Failing Tests</h2>
      <table id="topFailingTable">
        <tr>
          <th>Test</th>
          <th>Failure Rate</th>
          <th>Last Failed</th>
        </tr>
        ${trends.topFailingTests.map(test => `
        <tr>
          <td>${test.title}</td>
          <td>${test.failureRate}%</td>
          <td>${new Date(test.lastFailed).toLocaleString()}</td>
        </tr>
        `).join('')}
      </table>
    </div>
    
    <div class="table-container">
      <h2>Test Stability Index</h2>
      <table id="stabilityTable">
        <tr>
          <th>Category</th>
          <th>Stability</th>
          <th>Rating</th>
        </tr>
        ${Object.entries(trends.stability).map(([category, value]) => `
        <tr>
          <td>${category}</td>
          <td>${value.toFixed(2)}%</td>
          <td class="${value > 90 ? 'good' : (value > 75 ? 'moderate' : 'poor')}">
            ${value > 90 ? 'Good' : (value > 75 ? 'Moderate' : 'Poor')}
          </td>
        </tr>
        `).join('')}
      </table>
    </div>
  </div>
  
  <script>
    // Pass rate chart
    const passRateCtx = document.getElementById('passRateChart').getContext('2d');
    new Chart(passRateCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trends.timestamps.map(t => new Date(t).toLocaleDateString()))},
        datasets: [{
          label: 'Pass Rate (%)',
          data: ${JSON.stringify(trends.passRate)},
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.1,
          fill: true
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
    
    // Test count chart
    const testCountCtx = document.getElementById('testCountChart').getContext('2d');
    new Chart(testCountCtx, {
      type: 'bar',
      data: {
        labels: ${JSON.stringify(trends.timestamps.map(t => new Date(t).toLocaleDateString()))},
        datasets: [
          {
            label: 'Passed',
            data: ${JSON.stringify(trends.testCounts.passed)},
            backgroundColor: 'rgba(75, 192, 192, 0.7)'
          },
          {
            label: 'Failed',
            data: ${JSON.stringify(trends.testCounts.failed)},
            backgroundColor: 'rgba(255, 99, 132, 0.7)'
          },
          {
            label: 'Skipped',
            data: ${JSON.stringify(trends.testCounts.skipped)},
            backgroundColor: 'rgba(201, 203, 207, 0.7)'
          }
        ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        },
        responsive: true
      }
    });
    
    // Duration chart
    const durationCtx = document.getElementById('durationChart').getContext('2d');
    new Chart(durationCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trends.timestamps.map(t => new Date(t).toLocaleDateString()))},
        datasets: [{
          label: 'Avg Duration (sec)',
          data: ${JSON.stringify(trends.avgDuration)},
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.1
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
    
    // Save HTML dashboard
    const dashboardFile = path.join(this.dashboardsDir, 'trends-dashboard.html');
    fs.writeFileSync(dashboardFile, htmlDashboard);
    
    // Create a copy as index.html for easier access
    fs.writeFileSync(path.join(this.dashboardsDir, 'index.html'), htmlDashboard);
    
    console.log(`Trends dashboard saved to ${dashboardFile}`);
    return dashboardFile;
  }
  
  /**
   * Helper method to get Git information
   */
  private getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      const commit = execSync('git rev-parse --short HEAD').toString().trim();
      const lastCommitMsg = execSync('git log -1 --pretty=%B').toString().trim();
      const authorName = execSync('git log -1 --pretty=%an').toString().trim();
      const authorEmail = execSync('git log -1 --pretty=%ae').toString().trim();
      
      return {
        gitBranch: branch,
        gitCommit: commit,
        gitCommitMessage: lastCommitMsg,
        gitAuthor: authorName,
        gitAuthorEmail: authorEmail
      };
    } catch (error) {
      console.warn('Failed to get Git info:', error);
      return {
        gitBranch: 'unknown',
        gitCommit: 'unknown',
        gitCommitMessage: 'unknown',
        gitAuthor: 'unknown',
        gitAuthorEmail: 'unknown'
      };
    }
  }
  
  /**
   * Helper method to categorize tests
   */
  private categorizeTests(testResults: any[]) {
    // Example categorization logic - customize as needed
    return {
      api: testResults.filter(r => r.file?.includes('/api/')).length,
      web: testResults.filter(r => r.file?.includes('/web/')).length,
      petstore: testResults.filter(r => r.file?.includes('/PetStore/')).length,
      fyiai: testResults.filter(r => r.file?.includes('/FyiAi/')).length,
      // Add more categories as needed
    };
  }
  
  /**
   * Helper method to identify top failing tests
   */
  private identifyTopFailingTests(allMetrics: any[], limit = 10) {
    // Flatten all test results from all metrics
    const allTests = allMetrics.flatMap(m => {
      return (m.testDetails || []).map((t: any) => ({
        ...t,
        runTimestamp: m.timestamp
      }));
    });
    
    // Group by test title
    const testGroups = allTests.reduce((groups: any, test) => {
      const title = test.title;
      if (!groups[title]) {
        groups[title] = [];
      }
      groups[title].push(test);
      return groups;
    }, {});
    
    // Calculate failure rates and statistics
    const testStats = Object.entries(testGroups).map(([title, runs]) => {
      const testsArray = runs as any[];
      const totalRuns = testsArray.length;
      const failedRuns = testsArray.filter(t => t.status === 'failed').length;
      const failureRate = (failedRuns / totalRuns * 100).toFixed(2);
      
      // Find the most recent failure
      const failures = testsArray.filter(t => t.status === 'failed');
      const lastFailed = failures.length > 0 ? 
        failures.sort((a, b) => new Date(b.runTimestamp).getTime() - new Date(a.runTimestamp).getTime())[0].runTimestamp : 
        null;
      
      return {
        title,
        totalRuns,
        failedRuns,
        failureRate,
        lastFailed
      };
    });
    
    // Sort by failure rate (highest first) and limit
    return testStats
      .filter(t => t.failedRuns > 0) // Only include tests that have failed at least once
      .sort((a, b) => parseFloat(b.failureRate) - parseFloat(a.failureRate))
      .slice(0, limit);
  }
  
  /**
   * Calculate test stability metrics
   */
  private calculateTestStability(allMetrics: any[]) {
    // Only use the last 10 runs for stability calculation
    const recentMetrics = allMetrics.slice(-10);
    
    // Group tests by category
    const categories = {
      api: [],
      web: [],
      all: []
    } as Record<string, any[]>;
    
    // Collect all test results
    recentMetrics.forEach(metric => {
      const tests = metric.testDetails || [];
      
      tests.forEach((test: any) => {
        categories.all.push(test);
        
        if (test.file?.includes('/api/')) {
          categories.api.push(test);
        } else if (test.file?.includes('/web/')) {
          categories.web.push(test);
        }
        
        // Add more categories as needed
      });
    });
    
    // Calculate stability percentage for each category
    const stability: Record<string, number> = {};
    
    Object.entries(categories).forEach(([category, tests]) => {
      if (tests.length === 0) {
        stability[category] = 100; // If no tests, assume 100% stable
        return;
      }
      
      const passedCount = tests.filter(t => t.status === 'passed').length;
      stability[category] = Number(((passedCount / tests.length) * 100).toFixed(2));
    });
    
    return stability;
  }
}