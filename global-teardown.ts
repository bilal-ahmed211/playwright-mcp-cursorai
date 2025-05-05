import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { webConfig } from './src/lib/config/webConfig';
// import { apiConfig } from './src/lib/config/apiConfig.ts';
import { globalConfig } from './src/lib/config/globalConfig';

const screenshots_folder = 'allure-report';
const allure_envProperties_path = path.join('allure-report', 'environment.properties');
const allure_envProperties_target_path = path.join('allure-report', 'allure-results', 'environment.properties');
const metricsDir = path.join(__dirname, 'metrics');
const dashboardsDir = path.join(__dirname, 'dashboards');

async function globalTeardown(config: FullConfig) {
  try {
    // Write environment.properties for allure reporter
    const browserVersion = webConfig.browser === 'chrome' ? 'latest' : '';
    
    await fs.writeFileSync(
      allure_envProperties_path,
      `Browser = ${webConfig.browser}\nEnvironment = ${globalConfig.env}\nURL = ${webConfig.baseUrl}`
    );
    
    // Copy allure environment properties file to allure results
    await fs.copyFileSync(allure_envProperties_path, allure_envProperties_target_path);
    console.log('Environment properties file was copied to destination');

    // Read test run info
    const testRunInfoPath = path.join(metricsDir, 'test-run-info.json');
    let testRunInfo = {};
    if (fs.existsSync(testRunInfoPath)) {
      testRunInfo = JSON.parse(fs.readFileSync(testRunInfoPath, 'utf8'));
    }

    // Extract test results from Allure results directory
    const allureResultsDir = path.join(__dirname, 'allure-results');
    interface TestResult {
      title: string;
      status: string;
      duration: number;
      file: string;
      suite: string;
      labels: any[];
    }
    const testResults: TestResult[] = [];
    
    if (fs.existsSync(allureResultsDir)) {
      const files = fs.readdirSync(allureResultsDir);
      const resultFiles = files.filter(file => file.endsWith('-result.json'));
      
      for (const file of resultFiles) {
        try {
          const resultData = JSON.parse(fs.readFileSync(path.join(allureResultsDir, file), 'utf8'));
          testResults.push({
            title: resultData.name,
            status: resultData.status,
            duration: resultData.stop - resultData.start,
            file: resultData.fullName,
            suite: resultData.suite || 'Unknown suite',
            labels: resultData.labels || []
          });
        } catch (err) {
          console.error(`Error parsing result file ${file}:`, err);
        }
      }
    }

    // If you have a reporting system, call it here. Otherwise, just log.
    console.log('Enhanced reporting system would be called here if available.');
    // Example: await generateReports(testResults);
    
    // Open the executive summary in the default browser if not in CI
    if (!process.env.CI && process.platform === 'win32') {
      try {
        execSync(`start ${path.join(dashboardsDir, 'latest-summary.html')}`);
      } catch (err) {
        console.error('Error opening executive summary:', err);
      }
    }
    
    // Create a link or copy to the Allure report
    try {
      // Save history for next run if we're running Allure
      const historyDir = path.join('allure-report', 'history');
      const savedHistoryDir = path.join('allure-history');
      
      if (fs.existsSync(historyDir) && fs.readdirSync(historyDir).length > 0) {
        if (!fs.existsSync(savedHistoryDir)) {
          fs.mkdirSync(savedHistoryDir, { recursive: true });
        }
        
        fs.readdirSync(historyDir).forEach(file => {
          fs.copyFileSync(
            path.join(historyDir, file),
            path.join(savedHistoryDir, file)
          );
        });
        
        console.log('Saved Allure history for next run');
      }
    } catch (err) {
      console.error('Error saving Allure history:', err);
    }
  } catch (err) {
    console.error('Error in global teardown:', err);
    throw err;
  }

  // Clean up screenshots folder if needed
  if (fs.existsSync(screenshots_folder)) {
    fs.rmSync(screenshots_folder, { recursive: true, force: true });
  }
  
  console.log('Global teardown completed with enhanced reporting');
}

export default globalTeardown;