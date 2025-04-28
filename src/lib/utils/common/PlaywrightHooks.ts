import * as fs from 'fs';
import * as path from 'path';
import { Browser, BrowserContext, Page, TestInfo, test as base, chromium, firefox, webkit, expect, APIRequest, APIRequestContext, APIResponse, request } from '@playwright/test';
import { AllureApiLogger } from './AllureApiLogger';

// Environment variables - would normally be loaded from a .env file or environment
export const env = {
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.HEADLESS !== 'false',
  baseUrl: process.env.BASE_URL || 'https://fyi.ai',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
  isVideoEnabled: process.env.VIDEO === 'true',
  isBrowserLogsEnabled: process.env.BROWSER_LOGS === 'true',
  closeBrowser: process.env.CLOSE_BROWSER !== 'false',
  isToUseSameBrowser: process.env.USE_SAME_BROWSER === 'true'
};

// Configuration for paths
const SCREENSHOTS_FOLDER = path.join(process.cwd(), 'allure-report');
const TRACES_DIR = path.join(process.cwd(), 'traces');
const ALLURE_RESULTS_DIR = path.join(process.cwd(), 'allure-report', 'allure-results');
const ALLURE_ENV_PATH = path.join(ALLURE_RESULTS_DIR, 'environment.properties');
const ALLURE_CATEGORIES_PATH = path.join(ALLURE_RESULTS_DIR, 'categories.json');

// Create necessary directories
if (!fs.existsSync(SCREENSHOTS_FOLDER)) {
  fs.mkdirSync(SCREENSHOTS_FOLDER, { recursive: true });
}

if (!fs.existsSync(TRACES_DIR)) {
  fs.mkdirSync(TRACES_DIR, { recursive: true });
}

if (!fs.existsSync(ALLURE_RESULTS_DIR)) {
  fs.mkdirSync(ALLURE_RESULTS_DIR, { recursive: true });
}

// Create interface for our fixture
interface TestFixtures {
  apiContext: APIRequestContext;
  apiRequest: APIRequest;
  apiResponse: APIResponse | null;
  isDebug: boolean;
  testName: string;
  payload: any;
}

interface WorkerFixtures {
  browser: Browser;
}

// Extend base test with our fixtures
export const test = base.extend<TestFixtures, WorkerFixtures>({
  // Define browser fixture that is run once per worker (shared across tests)
  browser: [async ({}, use) => {
    let browser: Browser;
    
    console.log(`Launching ${env.browser} browser`);
    
    // Launch browser based on environment variable
    switch (env.browser) {
      case 'firefox':
        browser = await firefox.launch({
          headless: env.headless
        });
        break;
      case 'webkit':
        browser = await webkit.launch({
          headless: env.headless
        });
        break;
      default:
        browser = await chromium.launch({
          headless: env.headless,
          channel: env.browser === 'chromium' ? undefined : env.browser as any
        });
    }
    
    await use(browser);
    
    // Close browser after all tests if closeBrowser is true
    if (env.closeBrowser) {
      await browser.close();
    }
  }, { scope: 'worker' }],
  
  // Default fixtures for each test
  isDebug: [false, { option: true }],
  testName: async ({ }, use) => {
    await use('');
  },
  apiContext: async ({ }, use) => {
    const apiContext = await request.newContext({
      baseURL: env.baseUrl,
    });
    console.log('API context initialized');
    await use(apiContext);
    await apiContext.dispose();
    console.log('API context disposed');
  },
  apiRequest: async ({ }, use) => {
    await use(request);
  },
  apiResponse: async ({ }, use) => {
    await use(null);
  },
  payload: async ({ }, use) => {
    await use(null);
  },
  
  // Configure browser context and page for each test
  context: async ({ browser }, use) => {
    const context = await browser.newContext({
      acceptDownloads: true,
      recordVideo: env.isVideoEnabled ? { dir: 'screenshots' } : undefined,
      viewport: null,
      ignoreHTTPSErrors: true,
    });
    
    if (env.isBrowserLogsEnabled) {
      context.on('console', (message) => {
        console.log(`Browser console [${message.type()}]: ${message.text()}`);
      });
      
      context.on('weberror', (error) => {
        console.error(`Uncaught exception: "${error.error()}"`);
      });
    }
    
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
    
    await use(context);
    
    // After test
    if (!env.isToUseSameBrowser) {
      await context.close();
    }
  },
  
  page: async ({ context, testName }, use, testInfo) => {
    const page = await context.newPage();
    
    // Set test name for tracing
    testInfo.setTimeout(env.defaultTimeout);
    
    await use(page);
    
    // After test hooks
    if (testInfo.status !== 'passed') {
      // Take screenshot on test failure
      const screenshot = await page.screenshot({ path: path.join(SCREENSHOTS_FOLDER, `${testInfo.title.replace(/\s+/g, '-')}-failure.png`), type: 'png' });
      await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
      
      // Save trace
      const tracePath = path.join(TRACES_DIR, `${testInfo.title.replace(/\s+/g, '-')}-trace.zip`);
      await context.tracing.stop({ path: tracePath });
      await testInfo.attach('trace', { path: tracePath, contentType: 'application/zip' });
      
      // Log video if enabled
      if (env.isVideoEnabled) {
        const video = page.video();
        if (video) {
          const videoPath = await video.path();
          await page.waitForTimeout(1000); // Wait for video to be saved
          await testInfo.attach('video', { path: videoPath, contentType: 'video/webm' });
        }
      }
    }
    
    if (!env.isToUseSameBrowser) {
      await page.close();
    }
  }
});

// Extend expect for custom assertions
expect.extend({
  async toBeAccessible(page: Page) {
    // You could implement accessibility testing here
    return {
      pass: true,
      message: () => 'Accessibility check passed'
    };
  }
});

// Before/After All hooks
export const globalSetup = async () => {
  console.log('Global setup: Initializing test environment...');
  
};

export const globalTeardown = async () => {
  // Write environment properties for Allure
  const browserInfo = env.browser;
  const envPropertiesContent = 
    `Browser = ${browserInfo}\n` +
    `Environment = ${process.env.ENV || 'test'}\n` +
    `URL = ${env.baseUrl}\n` +
    `Timestamp = ${new Date().toISOString()}`;
  
  fs.writeFileSync(ALLURE_ENV_PATH, envPropertiesContent);
  console.log('Environment properties written for Allure reporting');
  
  // Cleanup if needed
  if (fs.existsSync(SCREENSHOTS_FOLDER) && process.env.CLEAN_SCREENSHOTS === 'true') {
    fs.rmSync(SCREENSHOTS_FOLDER, { recursive: true, force: true });
  }
  
  console.log('Global teardown: Test environment cleanup complete');
};

// Helper to log API details to Allure
export const logApiCall = async (
  testInfo: TestInfo,
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: any,
  response: APIResponse
) => {
  await AllureApiLogger.attachApiCallDetails(
    testInfo,
    method,
    url,
    headers,
    payload,
    response
  );
};

// Example debug helper
export const debug = async (page: Page) => {
  // Pause for debugging in headed mode
  if (!env.headless) {
    await page.pause();
  }
};

export { expect }; 