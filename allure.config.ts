import { defineConfig } from '@playwright/test';
import { AllureReporter } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { globalConfig } from './src/lib/config/globalConfig';
import { webConfig } from './src//lib/config/webConfig';
import { apiConfig } from './src/lib/config/apiConfig';

// Create allure results directory if it doesn't exist
const allureResultsDir = path.resolve(__dirname, './allure-report/allure-results');
if (!fs.existsSync(allureResultsDir)) {
    fs.mkdirSync(allureResultsDir, { recursive: true });
}

// Create metrics directory for storing test execution metrics
const metricsDir = path.resolve(__dirname, './metrics');
if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
}

// Get Git info for environment details
const getGitInfo = () => {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
    const commit = execSync('git rev-parse --short HEAD').toString().trim();
    return { branch, commit };
  } catch (error) {
    return { branch: 'unknown', commit: 'unknown' };
  }
};

const gitInfo = getGitInfo();

export default defineConfig({
  reporter: [
    ['line'],
    ['allure-playwright', {
      detail: true,
      outputFolder: allureResultsDir,
      suiteTitle: false,
      categories: [
        {
          name: 'Flaky tests',
          matchedStatuses: ['failed', 'passed'],
          messageRegex: /.*Flaky.*/
        },
        {
          name: 'API errors',
          matchedStatuses: ['failed'],
          messageRegex: /.*API error.*/
        },
        {
          name: 'UI issues',
          matchedStatuses: ['failed'],
          messageRegex: /.*UI issue.*/
        },
        {
          name: 'Performance issues',
          matchedStatuses: ['failed'],
          messageRegex: /.*Performance threshold exceeded.*/
        },
        {
          name: 'Data validation errors',
          matchedStatuses: ['failed'],
          messageRegex: /.*Data validation failed.*/
        }
      ],
      environmentInfo: {
        APP_VERSION: globalConfig.app.version || 'local',
        ENVIRONMENT: globalConfig.env || 'dev',
        BROWSER: webConfig.browser || 'chromium',
        PLATFORM: process.platform,
        PRODUCT: 'FYI',
        GIT_BRANCH: gitInfo.branch,
        GIT_COMMIT: gitInfo.commit,
        TEST_RUN_ID: new Date().toISOString().replace(/[:.]/g, '-'),
        NODE_VERSION: process.version
      }
    }]
  ]
});

// Export metrics collection function for use in global setup/teardown
export const collectMetrics = (testResults) => {
  if (!testResults) return;
  
  const timestamp = new Date().toISOString();
  const metricsFile = path.join(metricsDir, `metrics-${timestamp.replace(/[:.]/g, '-')}.json`);
  
  const metrics = {
    timestamp,
    summary: {
      total: testResults.length,
      passed: testResults.filter(r => r.status === 'passed').length,
      failed: testResults.filter(r => r.status === 'failed').length,
      skipped: testResults.filter(r => r.status === 'skipped').length,
      duration: testResults.reduce((sum, r) => sum + (r.duration || 0), 0)
    },
    environment: {
      browser: webConfig.browser || 'chromium',
      platform: process.platform,
      gitBranch: gitInfo.branch,
      gitCommit: gitInfo.commit
    },
    tests: testResults.map(r => ({
      title: r.title,
      status: r.status,
      duration: r.duration || 0,
      file: r.file
    }))
  };
  
  fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
  console.log(`Metrics saved to ${metricsFile}`);
  
  return metrics;
};