import { Page, Locator, expect } from '@playwright/test';
import { WebHelpers } from './WebHelpers';
import { SelfHealingLocators, SelfHealingLocator } from '../../data/web/locators/self-healing-locators';

/**
 * SelfHealingHandler extends the functionality of PageActions to add self-healing capabilities
 * when dealing with locators that may change.
 */
export class SelfHealingHandler {
  readonly page: Page;
  readonly webHelper: WebHelpers;
  
  /**
   * Creates a new SelfHealingHandler
   * @param page Playwright page
   */
  constructor(page: Page) {
    this.page = page;
    this.webHelper = new WebHelpers(page);
  }
  
  /**
   * Gets a Locator from a SelfHealingLocator strategy
   * @param locatorStrategy The self-healing locator strategy
   * @returns Playwright Locator
   */
  async locate(locatorStrategy: any): Promise<Locator> {
    if (typeof locatorStrategy === 'string') {
      // If a string is passed, use the existing handler to locate it
      return this.webHelper.getLocator(locatorStrategy);
    } else if (locatorStrategy.getLocator) {
      // If it's a self-healing locator strategy, use it
      return locatorStrategy.getLocator(this.page);
    } else {
      // For any other case, fall back to the standard behavior
      return this.page.locator(String(locatorStrategy));
    }
  }
  
  /**
   * Click on an element using self-healing locator
   * @param locator Self-healing locator or selector string
   */
  async click(locator: any): Promise<void> {
    const element = await this.locate(locator);
    await element.click();
  }
  
  /**
   * Fill an input using self-healing locator
   * @param locator Self-healing locator or selector string
   * @param value Value to fill
   */
  async fill(locator: any, value: string): Promise<void> {
    const element = await this.locate(locator);
    await element.fill(value);
  }
  
  /**
   * Check if element is visible
   * @param locator Self-healing locator or selector string
   * @returns True if element is visible
   */
  async isVisible(locator: any): Promise<boolean> {
    const element = await this.locate(locator);
    return await element.isVisible();
  }
  
  /**
   * Check if element is enabled
   * @param locator Self-healing locator or selector string
   * @returns True if element is enabled
   */
  async isEnabled(locator: any): Promise<boolean> {
    const element = await this.locate(locator);
    return await element.isEnabled();
  }
  
  /**
   * Get text content of element
   * @param locator Self-healing locator or selector string
   * @returns Text content
   */
  async getText(locator: any): Promise<string | null> {
    const element = await this.locate(locator);
    return await element.textContent();
  }
  
  /**
   * Expect element to be visible
   * @param locator Self-healing locator or selector string
   */
  async expectVisible(locator: any): Promise<void> {
    const element = await this.locate(locator);
    await expect(element).toBeVisible({ timeout: 10000 });
  }
  
  /**
   * Expect element to have text
   * @param locator Self-healing locator or selector string
   * @param text Expected text
   */
  async expectText(locator: any, text: string | RegExp): Promise<void> {
    const element = await this.locate(locator);
    await expect(element).toHaveText(text);
  }
  
  /**
   * Expect element to contain text
   * @param locator Self-healing locator or selector string
   * @param text Expected text to be contained
   */
  async expectContainText(locator: any, text: string): Promise<void> {
    const element = await this.locate(locator);
    await expect(element).toContainText(text);
  }
  
  /**
   * Expect element to have attribute value
   * @param locator Self-healing locator or selector string
   * @param attribute Attribute name
   * @param value Expected attribute value
   */
  async expectAttribute(locator: any, attribute: string, value: string | RegExp): Promise<void> {
    const element = await this.locate(locator);
    await expect(element).toHaveAttribute(attribute, value);
  }
  
  /**
   * Wait for element to be visible
   * @param locator Self-healing locator or selector string
   * @param timeout Timeout in milliseconds
   */
  async waitForVisible(locator: any, timeout: number = 5000): Promise<void> {
    const element = await this.locate(locator);
    await element.waitFor({ state: 'visible', timeout });
  }
  
  /**
   * Hover over an element
   * @param locator Self-healing locator or selector string
   */
  async hover(locator: any): Promise<void> {
    const element = await this.locate(locator);
    await element.hover();
  }
  
  /**
   * Double click on an element
   * @param locator Self-healing locator or selector string
   */
  async doubleClick(locator: any): Promise<void> {
    const element = await this.locate(locator);
    await element.dblclick();
  }
  
  /**
   * Get count of elements
   * @param locator Self-healing locator or selector string
   * @returns Number of matching elements
   */
  async count(locator: any): Promise<number> {
    const element = await this.locate(locator);
    return await element.count();
  }
  
  /**
   * Select option from dropdown
   * @param locator Self-healing locator or selector string
   * @param value Value to select
   */
  async selectOption(locator: any, value: string): Promise<void> {
    const element = await this.locate(locator);
    await element.selectOption(value);
  }
  
  /**
   * Get attribute value
   * @param locator Self-healing locator or selector string
   * @param attribute Attribute name
   * @returns Attribute value
   */
  async getAttribute(locator: any, attribute: string): Promise<string | null> {
    const element = await this.locate(locator);
    return await element.getAttribute(attribute);
  }
} 