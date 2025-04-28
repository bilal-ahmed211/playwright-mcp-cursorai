import { defineConfig } from '@playwright/test';
import { AllureReporter } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';

// Create allure results directory if it doesn't exist
const allureResultsDir = path.resolve(__dirname, './allure-report/allure-results');
if (!fs.existsSync(allureResultsDir)) {
    fs.mkdirSync(allureResultsDir, { recursive: true });
}

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
        }
      ],
      environmentInfo: {
        APP_VERSION: process.env.APP_VERSION || 'local',
        ENVIRONMENT: process.env.ENVIRONMENT || 'dev',
        BROWSER: process.env.BROWSER || 'chromium',
        PLATFORM: process.platform,
        PRODUCT: 'FYI'
      }
    }]
  ]
});