import { DEFAULT_RETRY_OPTIONS, DEFAULT_WAIT_OPTIONS, DEFAULT_RESOLVER_OPTIONS, PerformanceOptions } from '../../web/core/types';

export const webConfig = {
  browser: process.env.BROWSER || 'chromium',
  headless: process.env.HEADLESS !== 'false',
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
  defaultNavigationTimeout: parseInt(process.env.DEFAULT_NAVIGATION_TIMEOUT || '30000'),
  isVideoEnabled: process.env.PWVIDEO === 'true',
  isBrowserLogsEnabled: process.env.BROWSER_LOGS_ENABLED === 'true',
  closeBrowser: process.env.CLOSE_BROWSER !== 'false',
  isToUseSameBrowser: process.env.USE_SAME_BROWSER === 'true',
  screenshotOnFailure: true,
  traceOnFailure: true,
  allureReportEnabled: true,
  // Add more web-specific settings as needed
  testData: {
    userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
    userPassword: process.env.TEST_USER_PASSWORD || 'password123',
  },
  PERFORMANCE_OPTIONS: {
    waitForLoadState: true,
    waitForNetworkIdle: false,
  } as PerformanceOptions,
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_NAVIGATION_TIMEOUT: 30000,
  RETRY_OPTIONS: DEFAULT_RETRY_OPTIONS,
  DEFAULT_WAIT_OPTIONS: DEFAULT_WAIT_OPTIONS,
  DEFAULT_RESOLVER_OPTIONS: DEFAULT_RESOLVER_OPTIONS,
  ERROR_MESSAGES: {
    INVALID_SELECTOR: 'Invalid selector: ',
    SELF_HEALING_FAILED: 'Self-healing failed for: ',
    NAVIGATION_FAILED: 'Navigation failed for: ',
    ELEMENT_NOT_FOUND: 'Element not found: ',
  },
  ASSETS_FOLDER: 'src/data/assets',
}; 