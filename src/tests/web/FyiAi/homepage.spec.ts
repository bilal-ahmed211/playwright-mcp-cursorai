import { uiTest as test } from '../../../fixtures';
import { expect } from '@playwright/test';
import { HomePage } from '../../../pages';

test.describe('FYI.ai Homepage Tests', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Initialize page object with self-healing
    homePage = new HomePage(page, true);
  });


  test('Homepage - Verify main content and navigation', async ({ page }) => {
    try {
      // Perform homepage smoke test
      await homePage.smokeTest();
    } catch (error) {
      console.error(`Error in Homepage content test: ${error}`);
      throw error;
    }
  });

  test('Homepage - Test download button', async ({ page }) => {
    try {
      // Navigate to homepage
      await homePage.navigateToHomePage();

      // Click on download button
      await homePage.clickDownloadButton();

      // Verify URL after clicking download button
      await expect(page).toHaveURL(/\/app\/fyi.*/);
    } catch (error) {
      console.error(`Error in Download button test: ${error}`);
      throw error;
    }
  });

  test('Homepage - Test responsive layout on mobile viewport', async ({ page }) => {
    try {
      // Navigate to homepage
      await homePage.navigateToHomePage();

      // Set mobile viewport
      await homePage.setMobileViewport();

      // Verify mobile content and navigation
      await homePage.verifyMainContent();
    } catch (error) {
      console.error(`Error in mobile layout test: ${error}`);
      throw error;
    }
  });
}); 