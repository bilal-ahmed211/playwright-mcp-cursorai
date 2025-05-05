import * as fs from 'fs';
import * as path from 'path';
import { MetricsCollector } from './MetricsCollector';

/**
 * Class to enhance Allure reports with custom dashboards and metrics
 */
export class AllureEnhancer {
  private allureResultsDir: string;
  private allureReportDir: string;
  private metricsCollector: MetricsCollector;
  
  constructor(
    allureResultsDir = path.join(process.cwd(), 'allure-results'),
    allureReportDir = path.join(process.cwd(), 'allure-report'),
    metricsCollector = new MetricsCollector()
  ) {
    this.allureResultsDir = allureResultsDir;
    this.allureReportDir = allureReportDir;
    this.metricsCollector = metricsCollector;
  }
  
  /**
   * Enhance the existing Allure report with custom dashboards
   */
  enhanceAllureReport() {
    if (!fs.existsSync(this.allureReportDir)) {
      console.error('Allure report directory does not exist:', this.allureReportDir);
      return false;
    }
    
    // Create custom widgets directory if it doesn't exist
    const widgetsDir = path.join(this.allureReportDir, 'widgets');
    if (!fs.existsSync(widgetsDir)) {
      fs.mkdirSync(widgetsDir, { recursive: true });
    }
    
    // Create dashboards directory if it doesn't exist
    const dashboardsDir = path.join(this.allureReportDir, 'dashboards');
    if (!fs.existsSync(dashboardsDir)) {
      fs.mkdirSync(dashboardsDir, { recursive: true });
    }
    
    // Create the custom dashboard HTML
    this.createExecutiveDashboard();
    
    // Create custom widgets
    this.createTestMetricsWidget();
    this.createTestStabilityWidget();
    
    // Add link to custom dashboards in Allure index.html
    this.modifyAllureIndex();
    
    console.log('Allure report enhanced with custom dashboards and widgets');
    return true;
  }
  
  /**
   * Create executive dashboard in Allure report
   */
  private createExecutiveDashboard() {
    // Generate trends data
    const trends = this.metricsCollector.generateTrends();
    if (!trends) {
      console.log('No trends data available for executive dashboard');
      return;
    }
    
    // Calculate the index of the latest run data
    const lastRunIndex = trends.testCounts.total.length - 1 >= 0 ? trends.testCounts.total.length - 1 : 0;
    
    // Create executive summary dashboard
    const dashboardHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Executive Test Dashboard</title>
  <link rel="stylesheet" href="../styles.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body { font-family: 'Open Sans', sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 20px; }
    .card { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; }
    .card h3 { margin-top: 0; color: #333; }
    .metrics-value { font-size: 36px; font-weight: bold; margin: 15px 0; }
    .metrics-label { font-size: 14px; color: #666; text-transform: uppercase; }
    .chart-container { background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); padding: 20px; margin-bottom: 20px; }
    .chart-row { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 20px; }
    .chart-col { flex: 1; min-width: 300px; }
    .passed { color: #4CAF50; }
    .failed { color: #f44336; }
    .skipped { color: #2196F3; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
    th { background-color: #f8f8f8; }
    .back-link { margin-bottom: 20px; }
    .back-link a { color: #0066cc; text-decoration: none; }
    .back-link a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="back-link">
      <a href="../index.html">← Back to Allure Report</a>
    </div>
    
    <div class="header">
      <h1>Executive Test Dashboard</h1>
      <div>
        <p>Last updated: ${new Date().toLocaleString()}</p>
      </div>
    </div>
    
    <div class="summary-cards">
      <div class="card">
        <div class="metrics-label">Pass Rate</div>
        <div class="metrics-value passed">
          ${trends.passRate.length > 0 ? trends.passRate[trends.passRate.length - 1] + '%' : 'N/A'}
        </div>
        <p>Latest test run</p>
      </div>
      
      <div class="card">
        <div class="metrics-label">Tests Executed</div>
        <div class="metrics-value">
          ${trends.testCounts.total.length > 0 ? 
            trends.testCounts.total[lastRunIndex] : 'N/A'}
        </div>
        <p>Latest test run</p>
      </div>
      
      <div class="card">
        <div class="metrics-label">Avg Duration</div>
        <div class="metrics-value">
          ${trends.avgDuration.length > 0 ? 
            trends.avgDuration[lastRunIndex] + 's' : 'N/A'}
        </div>
        <p>Per test</p>
      </div>
      
      <div class="card">
        <div class="metrics-label">Overall Stability</div>
        <div class="metrics-value ${trends.stability.all > 90 ? 'passed' : (trends.stability.all > 75 ? '' : 'failed')}">
          ${trends.stability.all.toFixed(1)}%
        </div>
        <p>Last 10 runs</p>
      </div>
    </div>
    
    <div class="chart-container">
      <h2>Pass Rate Trend</h2>
      <canvas id="passRateChart"></canvas>
    </div>
    
    <div class="chart-row">
      <div class="chart-container chart-col">
        <h2>Test Results Composition</h2>
        <canvas id="resultsChart"></canvas>
      </div>
      
      <div class="chart-container chart-col">
        <h2>Test Categories Distribution</h2>
        <canvas id="categoriesChart"></canvas>
      </div>
    </div>
    
    <div class="chart-container">
      <h2>Top Failing Tests</h2>
      <table>
        <tr>
          <th>Test</th>
          <th>Failure Rate</th>
          <th>Last Failed</th>
        </tr>
        ${trends.topFailingTests.map(test => `
        <tr>
          <td>${test.title}</td>
          <td class="${parseFloat(test.failureRate) > 50 ? 'failed' : ''}">${test.failureRate}%</td>
          <td>${new Date(test.lastFailed).toLocaleString()}</td>
        </tr>
        `).join('')}
      </table>
    </div>
  </div>
  
  <script>
    // Pass rate trend chart
    const passRateCtx = document.getElementById('passRateChart').getContext('2d');
    new Chart(passRateCtx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trends.timestamps.map(t => new Date(t).toLocaleDateString()))},
        datasets: [{
          label: 'Pass Rate (%)',
          data: ${JSON.stringify(trends.passRate)},
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: 'Pass Rate (%)'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Test Run Date'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        }
      }
    });
    
    // Latest test results composition chart
    const resultsCtx = document.getElementById('resultsChart').getContext('2d');
    new Chart(resultsCtx, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped'],
        datasets: [{
          data: [
            ${trends.testCounts.passed.length > 0 ? trends.testCounts.passed[lastRunIndex] : 0},
            ${trends.testCounts.failed.length > 0 ? trends.testCounts.failed[lastRunIndex] : 0},
            ${trends.testCounts.skipped.length > 0 ? trends.testCounts.skipped[lastRunIndex] : 0}
          ],
          backgroundColor: [
            'rgba(76, 175, 80, 0.7)',
            'rgba(244, 67, 54, 0.7)',
            'rgba(33, 150, 243, 0.7)'
          ],
          borderColor: [
            'rgba(76, 175, 80, 1)',
            'rgba(244, 67, 54, 1)',
            'rgba(33, 150, 243, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
    
    // Categories distribution chart
    const categoriesCtx = document.getElementById('categoriesChart').getContext('2d');
    
    // Function to get latest category data from multiple runs
    function getLatestCategoryData() {
      const categories = {
        'API Tests': ${trends.stability.api ? trends.stability.api : 0},
        'Web Tests': ${trends.stability.web ? trends.stability.web : 0},
        'Other Tests': ${trends.stability.all ? (trends.stability.all - (trends.stability.api || 0) - (trends.stability.web || 0)) : 0}
      };
      
      return {
        labels: Object.keys(categories),
        data: Object.values(categories)
      };
    }
    
    const categoryData = getLatestCategoryData();
    
    new Chart(categoriesCtx, {
      type: 'pie',
      data: {
        labels: categoryData.labels,
        datasets: [{
          data: categoryData.data,
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        plugins: {
          legend: {
            position: 'right'
          }
        }
      }
    });
  </script>
</body>
</html>
    `;
    
    // Save the dashboard to the custom dashboards directory
    fs.writeFileSync(
      path.join(this.allureReportDir, 'dashboards', 'executive-dashboard.html'),
      dashboardHtml
    );
    
    console.log('Executive dashboard created in Allure report');
  }
  
  /**
   * Create a custom test metrics widget for Allure
   */
  private createTestMetricsWidget() {
    // Create a simple widget that links to the full dashboard
    const widgetHtml = `
<div class="widget">
  <div class="widget__title">
    Test Metrics Dashboard
  </div>
  <div class="widget__body">
    <div style="padding: 15px; text-align: center;">
      <p style="margin-bottom: 15px;">View detailed test metrics and trends</p>
      <a href="dashboards/executive-dashboard.html" class="link" style="display: inline-block; padding: 8px 15px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 4px;">
        Open Executive Dashboard
      </a>
    </div>
  </div>
</div>
    `;
    
    // Save the widget
    fs.writeFileSync(
      path.join(this.allureReportDir, 'widgets', 'custom-metrics-widget.html'),
      widgetHtml
    );
    
    console.log('Test metrics widget created');
  }
  
  /**
   * Create a custom test stability widget for Allure
   */
  private createTestStabilityWidget() {
    // Get trends data
    const trends = this.metricsCollector.generateTrends();
    if (!trends) {
      console.log('No trends data available for stability widget');
      return;
    }
    
    // Create the stability widget
    const widgetHtml = `
<div class="widget">
  <div class="widget__title">
    Test Stability Index
  </div>
  <div class="widget__body">
    <div style="padding: 15px;">
      <div style="margin-bottom: 15px;">
        <div style="font-size: 36px; font-weight: bold; color: ${trends.stability.all > 90 ? '#4CAF50' : (trends.stability.all > 75 ? '#FF9800' : '#F44336')}">
          ${trends.stability.all.toFixed(1)}%
        </div>
        <div style="font-size: 14px; color: #666;">Overall Stability</div>
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; background-color: #f8f8f8;">Category</th>
          <th style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; background-color: #f8f8f8;">Stability</th>
        </tr>
        ${Object.entries(trends.stability)
          .filter(([key]) => key !== 'all')
          .map(([category, value]) => `
        <tr>
          <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd;">${category}</td>
          <td style="text-align: left; padding: 8px; border-bottom: 1px solid #ddd; color: ${value > 90 ? '#4CAF50' : (value > 75 ? '#FF9800' : '#F44336')}">
            ${value.toFixed(1)}%
          </td>
        </tr>
        `).join('')}
      </table>
    </div>
  </div>
</div>
    `;
    
    // Save the widget
    fs.writeFileSync(
      path.join(this.allureReportDir, 'widgets', 'test-stability-widget.html'),
      widgetHtml
    );
    
    console.log('Test stability widget created');
  }
  
  /**
   * Modify Allure index.html to add links to custom dashboards
   */
  private modifyAllureIndex() {
    const indexPath = path.join(this.allureReportDir, 'index.html');
    
    // Check if index.html exists
    if (!fs.existsSync(indexPath)) {
      console.error('Allure index.html does not exist:', indexPath);
      return;
    }
    
    // Instead of modifying the Allure index.html directly (which can break the SPA),
    // create a custom entry point for the dashboards
    const dashboardIndexPath = path.join(this.allureReportDir, 'custom-dashboards.html');
    
    const dashboardIndexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Dashboards</title>
  <link rel="stylesheet" href="styles.css">
  <style>
    body { 
      font-family: 'Open Sans', sans-serif; 
      margin: 0; 
      padding: 20px; 
      background-color: #f5f5f5; 
    }
    .container { 
      max-width: 1200px; 
      margin: 0 auto; 
    }
    .header { 
      display: flex; 
      justify-content: space-between; 
      align-items: center;
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .dashboard-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 20px;
      text-align: center;
      transition: transform 0.3s ease;
    }
    .card:hover {
      transform: translateY(-5px);
    }
    .card-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .card-body {
      color: #666;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      padding: 10px 20px;
      background-color: #0066cc;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      transition: background-color 0.3s ease;
    }
    .btn:hover {
      background-color: #0052a3;
    }
    .back-link {
      margin-bottom: 20px;
    }
    .back-link a {
      color: #0066cc;
      text-decoration: none;
    }
    .back-link a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="back-link">
      <a href="index.html">← Back to Allure Report</a>
    </div>

    <div class="header">
      <h1>Test Dashboards</h1>
      <div>
        <p>Enhanced reporting dashboards</p>
      </div>
    </div>

    <div class="dashboard-cards">
      <div class="card">
        <div class="card-title">Executive Dashboard</div>
        <div class="card-body">
          View key metrics, pass rates, and test stability metrics in a concise executive-friendly format.
        </div>
        <a href="dashboards/executive-dashboard.html" class="btn">Open Dashboard</a>
      </div>

      <div class="card">
        <div class="card-title">Trends Dashboard</div>
        <div class="card-body">
          Analyze historical trends in test execution, identify patterns, and track improvements over time.
        </div>
        <a href="../dashboards/trends-dashboard.html" class="btn">Open Dashboard</a>
      </div>

      <div class="card">
        <div class="card-title">Latest Test Summary</div>
        <div class="card-body">
          View detailed summary of the most recent test execution with in-depth analysis.
        </div>
        <a href="../dashboards/latest-summary.html" class="btn">Open Summary</a>
      </div>
    </div>

    <div style="text-align: center; margin-top: 40px; color: #666;">
      <p>Custom dashboards for enhanced test reporting</p>
    </div>
  </div>
</body>
</html>
    `;
    
    // Write the dashboard index file
    fs.writeFileSync(dashboardIndexPath, dashboardIndexContent);
    
    // Add a simple JavaScript snippet to the Allure index.html that doesn't break the SPA
    // It adds a button/link to the custom dashboards in a non-intrusive way
    try {
      let indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Create a script that will add a dashboard button to the UI
      const scriptInjection = `
<script>
// Add custom dashboard link after Allure loads
window.addEventListener('load', function() {
  setTimeout(function() {
    var headerRight = document.querySelector('.app__header');
    if (headerRight) {
      var dashboardLink = document.createElement('a');
      dashboardLink.href = 'custom-dashboards.html';
      dashboardLink.target = '_blank';
      dashboardLink.className = 'custom-dashboard-btn';
      dashboardLink.textContent = 'Custom Dashboards';
      dashboardLink.style.cssText = 'display: inline-block; margin-left: 15px; padding: 5px 10px; background: #0066cc; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;';
      
      // Insert at the appropriate position
      headerRight.appendChild(dashboardLink);
    }
  }, 1000); // Delay to ensure Allure UI is loaded
});
</script>
`;
      
      // Add the script just before the closing body tag
      const bodyEndPosition = indexContent.lastIndexOf('</body>');
      if (bodyEndPosition !== -1) {
        indexContent = indexContent.substring(0, bodyEndPosition) + 
                      scriptInjection + 
                      indexContent.substring(bodyEndPosition);
        
        // Write back to the file
        fs.writeFileSync(indexPath, indexContent);
        console.log('Added custom dashboard link to Allure index.html');
      } else {
        console.warn('Could not find </body> tag in Allure index.html');
      }
    } catch (err) {
      console.error('Error modifying Allure index.html:', err);
      
      // Even if modification fails, we still have the standalone dashboard entry point
      console.log('Created standalone dashboard entry point at custom-dashboards.html');
    }
  }
}

/**
 * Utility function to enhance an Allure report after it's been generated
 */
export async function enhanceAllureReportWithMetrics(
  allureResultsDir = path.join(process.cwd(), 'allure-results'),
  allureReportDir = path.join(process.cwd(), 'allure-report')
) {
  const enhancer = new AllureEnhancer(allureResultsDir, allureReportDir);
  return enhancer.enhanceAllureReport();
}