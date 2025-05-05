import { PlaywrightTestConfig, devices } from '@playwright/test';
import { webConfig } from './src/lib/config/webConfig';
import { apiConfig } from './src/lib/config/apiConfig';
import { globalConfig } from './src/lib/config/globalConfig';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: '.',
testMatch: [
  'src/tests/**/*.spec.{js,ts}',
  'src/web/tests/**/*.spec.{js,ts}',
  'src/api/tests/**/*.spec.{js,ts}',
],
  /* Maximum time one test can run for. */
  timeout: 60000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    // ['html', { outputFolder: 'html-report/' }],
    ['allure-playwright']
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: webConfig.baseUrl || 'https://magento.softwaretestingboard.com',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Take screenshot on test failure */
    screenshot: 'only-on-failure',
  },

  /* Global setup and teardown */
  globalSetup: require.resolve('./global-setup'),
  globalTeardown: require.resolve('./global-teardown'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: webConfig.headless,
      },
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: {
        ...devices['iPhone 12'],
      },
    },

    /* Test against branded browsers. */
    {
      name: 'Microsoft Edge',
      use: {
        channel: 'msedge',
      },
    },
    {
      name: 'Google Chrome',
      use: {
        channel: 'chrome',
      },
    },
  ],

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  // },
};

export default config;





// import { defineConfig } from '@playwright/test';
// import { LaunchOptions } from '@playwright/test';
// import { env } from '/env';

// // import Reporter from './.allure.config'

// let browserOptions: LaunchOptions;

// const browserOptionsLocal: LaunchOptions = {
//   slowMo: 100,
//   timeout: 60 * 2000,
//   headless: env.playwright.isHeadlessModeEnabled,
//   args: [
//     '--use-fake-ui-for-media-stream',
//     '--use-fake-device-for-media-stream',
//     '--incognito',
//     '--start-maximized',
//   ],
//   firefoxUserPrefs: {
//     'media.navigator.streams.fake': true,
//     'media.navigator.permission.disabled': true,
//   },
//   logger: {

//     isEnabled: () => {
//       return env.playwright.isBrowserLogsEnabled;
//     },
//     log: (name, severity, message) => {
//       console.log(`[${severity}] ${name} ${message}`);
//     },
//   },
//   devtools: false,
//   ...env.playwright.browserLaunchOptions
// };

// const browserOptionsCI: LaunchOptions = {
//   headless: true,
//   timeout: 100000,
//   args: [
//     '--use-fake-ui-for-media-stream',
//     '--use-fake-device-for-media-stream',
//     '--incognito',
//     '--disable-dev-shm-usage',
//   ],
//   firefoxUserPrefs: {
//     'media.navigator.streams.fake': true,
//     'media.navigator.permission.disabled': true,
//   },
//   devtools: false,
//   ...env.playwright.headlessLaunchOptions
// }

// export default defineConfig({
//   fullyParallel: true,
//   retries: env.playwright.executeType === 'CI' ? 2 : 0,
//   workers: env.playwright.executeType === 'CI' ? 1 : env.playwright?.workers || 1,
//   reporter: [
//     ["line"],
//     ['allure-playwright']//, ''],  // Pass your config here
//   ],
// });

// if (env.playwright.executeType !== 'CI') {
//   browserOptions = browserOptionsLocal;
// } else {
//   browserOptions = browserOptionsCI;
// }

// export const config = {
//   browserOptions,
//   defineConfig,
// }