import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { env } from './env';

const screenshots_folder = 'allure-report';
const allure_envProperties_path = path.join('allure-report', 'environment.properties');
const allure_envProperties_target_path = path.join('allure-report', 'allure-results', 'environment.properties');

async function globalTeardown(config: FullConfig) {
  try {
    // Write environment.properties for allure reporter
    // Note: browserVersion would need to be captured and stored during tests
    const browserVersion = env.playwright.browser === 'chrome' ? 'latest' : '';
    
    await fs.writeFileSync(
      allure_envProperties_path,
      `Browser = ${env.playwright.browser} ${browserVersion} \nEnvironment = prod \nURL = ${env.playwright.baseUrl}`
    );
    
    // Copy allure environment properties file to allure results
    await fs.copyFileSync(allure_envProperties_path, allure_envProperties_target_path);
    console.log('Environment properties file was copied to destination');
  } catch (err) {
    console.error('Error in global teardown:', err);
    throw err;
  }

  // Clean up screenshots folder if needed
  if (fs.existsSync(screenshots_folder)) {
    fs.rmSync(screenshots_folder, { recursive: true, force: true });
  }
  
  console.log('Global teardown completed');
}

export default globalTeardown;