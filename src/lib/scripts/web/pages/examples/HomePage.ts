import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Locators } from '../../../../../data/web/locators/fyi-locators';
import { SelfHealingLocators } from '../../../../../data/web/locators/self-healing-locators';

/**
 * HomePage provides functionality to interact with the Home page
 * Using the unified BasePage that combines self-healing capabilities
 */
export class HomePage extends BasePage {
  constructor(page: Page, useSelfHealing: boolean = false) {
    super(page, useSelfHealing);
  }

  /**
   * Navigate to the home page
   */
  async navigateToHomePage() {
    await this.navigate('');
  }

  /**
   * Verify main content on the home page
   */
  async verifyMainContent() {
    const locator = this.useSelfHealing ?
      SelfHealingLocators.homepage.mainHeading :
      Locators.homepage.mainHeading;

    // Use safe verification method that handles strict mode violations
    await this.safeVerifyVisible(locator);
  }

  /**
   * Click the Download button in the navigation
   */
  async clickDownloadButton() {
    const locator = this.useSelfHealing ?
      SelfHealingLocators.common.navigation.downloadButton :
      Locators.common.navigation.downloadButton;

    // Use safe action method that handles strict mode violations
    await this.safeElementAction(locator, 'click');
  }

  /**
   * Check mobile menu functionality
   */
  async checkMobileMenu() {
    // Set mobile viewport
    await this.setMobileViewport();

    // Define locators
    const menuButtonLocator = this.useSelfHealing ?
      SelfHealingLocators.common.navigation.mobileMenuButton :
      Locators.common.navigation.mobileMenuButton;

    const homeLinkLocator = this.useSelfHealing ?
      SelfHealingLocators.common.navigation.homeLink :
      Locators.common.navigation.homeLink;

    const aboutLinkLocator = this.useSelfHealing ?
      SelfHealingLocators.common.navigation.aboutUsLink :
      Locators.common.navigation.aboutUsLink;

    // Check if mobile menu button is visible
    const isMenuButtonVisible = await this.safeElementAction(menuButtonLocator, 'isVisible');

    if (isMenuButtonVisible) {
      // Click the mobile menu button using safe action
      await this.safeElementAction(menuButtonLocator, 'click');

      // Wait for menu to appear
      await this.page.waitForTimeout(500);

      // Verify navigation links are visible
      await this.safeVerifyVisible(homeLinkLocator);
      await this.safeVerifyVisible(aboutLinkLocator);
    }
  }

  /**
   * Perform a complete smoke test of the home page
   */
  async smokeTest() {
    await this.navigateToHomePage();
    await this.verifyTitle('FYI - Focus Your Ideas');
    await this.verifyUrl('');
    await this.verifyMainContent();
    // await this.verifyNavigationLinks();
    await this.verifyFooter();
    await this.clickDownloadButton();
    await this.navigateToHomePage();

    // Test mobile menu if applicable
    await this.checkMobileMenu();
  }
} 