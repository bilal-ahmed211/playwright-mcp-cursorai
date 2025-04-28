import { Page, expect } from '@playwright/test';
import { BasePage } from '../BasePage';
import { Locators } from '../../../../../data/web/locators/fyi-locators';
import { SelfHealingLocators } from '../../../../../data/web/locators/self-healing-locators';
import { ResolverStrategy } from '../../utils/web/LocatorResolver';
import { WebHelpers } from '../../utils/web/WebHelpers';

/**
 * AboutUsPage provides functionality to interact with the About Us page
 * Using the unified BasePage that combines self-healing and resolver capabilities
 */
export class AboutUsPage extends BasePage {
  public webHelper: WebHelpers;
  constructor(page: Page, useSelfHealing: boolean = false) {
    super(page, useSelfHealing);
    this.webHelper = new WebHelpers(page);
  }

  /**
   * Navigate to the About Us page
   */
  async navigateToAboutUsPage() {
    await this.navigate('about');
  }

  /**
   * Verify main content on the About Us page
   */
  async verifyMainContent() {
    if (this.useSelfHealing) {
      // Use self-healing locators
      await this.verifyVisibleSafe(SelfHealingLocators.aboutUs.mainHeading);
      await this.verifyVisibleSafe(SelfHealingLocators.aboutUs.subHeading);
    } else {
      // Use standard locators with resolver
      await this.verifyVisibleSafe(Locators.aboutUs.mainHeading, {
        strategy: ResolverStrategy.FIRST
      });
      
      await this.verifyVisibleSafe(Locators.aboutUs.subHeading, {
        strategy: ResolverStrategy.CONTAINS_TEXT,
        strategyOptions: {
          text: 'The FYI app is the first productivity tool'
        }
      });
    }
  }

  /**
   * Click on a specific section of the About Us page
   * @param sectionText Text content within the section to click
   */
  async clickSection(sectionText: string) {
    await this.clickSafe(`text="${sectionText}"`, {
      strategy: ResolverStrategy.CONTAINS_TEXT,
      strategyOptions: {
        text: sectionText
      }
    });
  }

  /**
   * Perform a complete smoke test of the About Us page
   */
  async smokeTest() {
    await this.navigateToAboutUsPage();
    await this.page.waitForTimeout(3000);
    await this.verifyTitle('About Us - FYI');
    await this.verifyUrl('aboutus');
    await this.verifyMainContent();
    // await this.verifyNavigationLinks();
    await this.verifyFooter();
    
    // Test navigation
    // await this.clickNavLinkSafe('Home');
  }
} 