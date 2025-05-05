import { test as base, Page, BrowserContext, APIRequestContext, request, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
// import { env } from './src/env';
import { chromium, firefox, webkit } from '@playwright/test';
import { webConfig } from './src/lib/config/webConfig';

// Setup directories
const tracesDir = 'traces';

// Define interface for custom fixtures
type CustomFixtures = {
  context: BrowserContext;
  page: Page;
  apiContext: APIRequestContext;
  debug: boolean;
  testName: string;
  // AllureReporter functionality would be imported later
  allure?: any;
  payload?: any;
};

// Create a custom test with our fixtures
export const test = base.extend<CustomFixtures>({
  // Base context fixture
  context: async ({ browser }, use, testInfo) => {
    console.log(`Creating browser context for test: ${testInfo.title}`);
    
    const context = await browser.newContext({
      acceptDownloads: true,
      recordVideo: webConfig.isVideoEnabled ? { dir: 'screenshots' } : undefined,
      // viewport: null,
      ignoreHTTPSErrors: true,
    });
    
    // Set up browser logging if enabled
    if (webConfig.isBrowserLogsEnabled) {
      context.on('weberror', (webError) => {
        console.log(`Uncaught exception: "${JSON.stringify(webError.error)}"`);
      });
    }
    
    // Start tracing for better debugging
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    
    await use(context);
    
    // Handle failures with trace/screenshot collection
    if (testInfo.status !== 'passed') {
      const testName = testInfo.title.replace(/\W/g, '-');
      const tracePath = path.join(tracesDir, `${testName}-trace.zip`);
      
      await context.tracing.stop({
        path: tracePath,
      });
      
      console.log(`Trace saved to: ${tracePath}`);
    } else {
      // Stop tracing but don't save for passing tests to save space
      await context.tracing.stop();
    }
    
    await context.close();
  },
  
  // Page fixture with automatic screenshot on failure
  page: async ({ context }, use, testInfo) => {
    const page = await context.newPage();
    
    await use(page);
    
    // Take screenshot on test failure
    if (testInfo.status !== 'passed') {
      const screenshotPath = path.join('screenshots', `${testInfo.title.replace(/\W/g, '-')}.png`);
      await page.screenshot({ path: screenshotPath });
      await testInfo.attach('screenshot', { path: screenshotPath, contentType: 'image/png' });
      console.log(`Screenshot saved to: ${screenshotPath}`);
      
      // Add video if enabled
      if (webConfig.isVideoEnabled) {
        const video = page.video();
        if (video) {
          const videoPath = await video.path();
          await page.waitForTimeout(1000); // Wait for video to be processed
          await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
        }
      }
    }
  },
  
  // API context fixture for API testing
  apiContext: async ({}, use) => {
    console.log('Initializing API context');
    const apiContext = await request.newContext();
    
    await use(apiContext);
    
    await apiContext.dispose();
    console.log('API context disposed');
  },
  
  // Debug flag for conditional debugging
  debug: [false, { option: true }],
  
  // Test name for file naming
  testName: async ({}, use, testInfo) => {
    const testName = testInfo.title.replace(/\W/g, '-');
    await use(testName);
  },
});

// Create specific test variants
export const apiTest = test.extend({
  // Special API test fixtures would go here
});

// UI test variant that ensures browser is set up
export const uiTest = test.extend({});

// Debug test variant 
export const debugTest = test.extend({
  debug: true,
});

// Skip functionality replacement for @ignore
export const skip = test.skip; 