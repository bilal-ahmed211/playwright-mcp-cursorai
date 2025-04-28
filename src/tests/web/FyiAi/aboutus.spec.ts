import { uiTest as test } from '../../../fixtures';
import { AboutUsPage, HomePage } from '../../../pages';

test.describe('FYI.ai About Us Page Tests', () => {
  let aboutUsPage: AboutUsPage;
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    // Initialize page objects with self-healing
    aboutUsPage = new AboutUsPage(page, true);
    homePage = new HomePage(page, true);
  });

  test('About Us page - Verify content and functionality', async ({ page }) => {
    try {
      // Perform About Us page smoke test
      await aboutUsPage.smokeTest();
    } catch (error) {
      console.error(`Error in About Us page content test: ${error}`);
      throw error;
    }
  });

  test('About Us page - Navigation from homepage', async ({ page }) => {
    try {
      // Navigate to homepage first
      await homePage.navigateToHomePage();

      // Click About Us link in navigation
      // aboutUsPage.navigateToAboutUsPage();
      await page.locator('.u-button-style').first().click();
      await page.getByRole('banner').getByRole('link', { name: 'About us' }).click();
      await page.waitForTimeout(4000)

      // Verify we're on the About Us page
      await aboutUsPage.verifyTitle('About Us - FYI');
      await aboutUsPage.verifyUrl('aboutus');
      await aboutUsPage.verifyMainContent();
    } catch (error) {
      console.error(`Error in About Us navigation test: ${error}`);
      throw error;
    }
  });


});

