import { chromium, firefox, webkit, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { mkdir, ensureFileSync, ensureDir } from 'fs-extra';
// import { env } from './src/env';
import config from './playwright.config';
import { webConfig } from './src/lib/config/webConfig';
import { apiConfig } from './src/lib/config/apiConfig';
import { globalConfig } from './src/lib/config/globalConfig';

const tracesDir = 'traces';
const screenshots_folder = 'allure-report';
const allure_envProperties_path = path.join('allure-report', 'environment.properties');
const allure_envProperties_target_path = path.join('allure-report', 'allure-results', 'environment.properties');
const metricsDir = path.join(__dirname, 'metrics');
const dashboardDir = path.join(__dirname, 'dashboards');

async function globalSetup(configObj: FullConfig) {
  // Create necessary directories
  await ensureDir(tracesDir);
  await ensureDir(metricsDir);
  await ensureDir(dashboardDir);

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

  // Get Git information
  const getGitInfo = () => {
    try {
      const branch = require('child_process').execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      const commit = require('child_process').execSync('git rev-parse --short HEAD').toString().trim();
      const lastCommitMsg = require('child_process').execSync('git log -1 --pretty=%B').toString().trim();
      return { branch, commit, lastCommitMsg };
    } catch (error) {
      return { branch: 'unknown', commit: 'unknown', lastCommitMsg: 'unknown' };
    }
  };

  const gitInfo = getGitInfo();
  
  // Create test run information file
  const testRunInfo = {
    startTime: new Date().toISOString(),
    platform: process.platform,
    browser: webConfig.browser,
    environment: globalConfig.env,
    gitBranch: gitInfo.branch,
    gitCommit: gitInfo.commit,
    gitCommitMessage: gitInfo.lastCommitMsg,
    runId: process.env.RUN_ID || new Date().toISOString().replace(/[:.]/g, '-')
  };
  
  fs.writeFileSync(
    path.join(metricsDir, 'test-run-info.json'),
    JSON.stringify(testRunInfo, null, 2)
  );

  // Create executor.json with enhanced information
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
      reportUrl: process.env.CI_JOB_URL ? `${process.env.CI_JOB_URL}/allure` : 'http://localhost/allure',
      gitBranch: gitInfo.branch,
      gitCommit: gitInfo.commit
    })
  );

  // Create custom dashboards directory structure
  const customDashboardsDir = path.join('allure-report', 'dashboards');
  if (!fs.existsSync(customDashboardsDir)) {
    fs.mkdirSync(customDashboardsDir, { recursive: true });
  }

  console.log('Global setup completed: created directories and files for reporting and metrics collection');
}

export default globalSetup;