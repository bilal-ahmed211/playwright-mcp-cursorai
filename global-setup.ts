import { chromium, firefox, webkit, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { mkdir, ensureFileSync, ensureDir } from 'fs-extra';
import { env } from './env';
import config from './playwright.config';

const tracesDir = 'traces';
const screenshots_folder = 'allure-report';
const allure_envProperties_path = path.join('allure-report', 'environment.properties');
const allure_envProperties_target_path = path.join('allure-report', 'allure-results', 'environment.properties');

async function globalSetup(configObj: FullConfig) {
  // Create necessary directories
  await ensureDir(tracesDir);

  if (!fs.existsSync(screenshots_folder)) {
    mkdir(screenshots_folder);
  }

  ensureFileSync(allure_envProperties_target_path);
  // Create history directory inside allure-results
  const historyDir = path.join('allure-results', 'history');
  if (!fs.existsSync(historyDir)) {
    fs.mkdirSync(historyDir, { recursive: true });
  }

  // Copy history from previous builds if it exists
  const savedHistoryDir = path.join('allure-history');
  if (fs.existsSync(savedHistoryDir)) {
    fs.readdirSync(savedHistoryDir).forEach(file => {
      fs.copyFileSync(
        path.join(savedHistoryDir, file),
        path.join(historyDir, file)
      );
    });
  }

  // Create executor.json
  fs.writeFileSync(
    './allure-results/executor.json',
    JSON.stringify({
      name: "Bilal",
      type: "Web",
      buildName: `Build ${process.env.BUILD_NUMBER || 'local'}`,
      buildOrder: process.env.BUILD_NUMBER || '1',
      reportName: "Allure Report",
      url: process.env.CI_JOB_URL || 'http://localhost',
      buildUrl: process.env.CI_JOB_URL || 'http://localhost',
      reportUrl: process.env.CI_JOB_URL ? `${process.env.CI_JOB_URL}/allure` : 'http://localhost/allure'
    })
  );

  console.log('Global setup completed: created directories and files for reporting');
}

export default globalSetup;