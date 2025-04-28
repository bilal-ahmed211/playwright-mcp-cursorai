import { Page, BrowserContext, expect, Locator } from '@playwright/test';

/**
 * Options for retry logic
 */
interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Delay between retries in milliseconds */
  delayMs: number;
}

/**
 * Options for waiting for elements
 */
interface WaitOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Whether to wait for element to be visible */
  visible?: boolean;
  /** Whether to wait for element to be enabled */
  enabled?: boolean;
}

/**
 * Default retry options
 */
const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 2,
  delayMs: 1000,
};

/**
 * Default wait options
 */
const DEFAULT_WAIT_OPTIONS: WaitOptions = {
  timeout: 30000,
  visible: true,
  enabled: true,
};

/**
 * Comprehensive PageActions class that combines functionality from
 * PageActionsHelper and DynamicElementHandler with enhanced features.
 */
export class WebHelpers {
  readonly page: Page;
  readonly context?: BrowserContext;
  private elements: Record<string, any>;

  /**
   * Creates a new PageActions instance
   * @param page Playwright page
   * @param context Playwright browser context (optional)
   * @param elements Optional object mapping element names to selectors
   */
  constructor(page: Page);
  constructor(page: Page, context: BrowserContext, elements?: Record<string, any>);
  constructor(page: Page, context?: BrowserContext, elements?: Record<string, any>) {
    this.page = page;
    this.context = context;
    this.elements = elements || {};
  }

  /**
   * Creates a handler for the given page and context
   * @param page Playwright page
   * @param context Playwright browser context
   * @param elements Optional element map
   */
  static create(page: Page, context?: BrowserContext, elements?: Record<string, any>): WebHelpers {
    return new WebHelpers (page, context as BrowserContext, elements);
  }

  /**
   * Set page elements for use by actions
   * @param elements Mapping of element names to selectors
   */
  public setElements(elements: Record<string, any>): void {
    this.elements = elements;
  }

  /**
   * Get locator for an element
   * @param selector Selector string or element name from elements map
   * @returns Resolved selector string
   */
  public getSelector(selector: string): string {
    if (this.elements && selector in this.elements) {
      return this.elements[selector];
    }
    return selector;
  }

  /**
   * Get a Playwright locator for an element
   * @param selector Selector string or element name
   * @returns Playwright Locator
   */
  public getLocator(selector: string): Locator {
    const resolvedSelector = this.getSelector(selector);
    return this.page.locator(resolvedSelector);
  }

  /**
   * Creates a wrapped locator with enhanced methods
   * @param selector Selector string or element name
   * @returns DynamicLocator with additional functionality
   */
  public async locate(selector: string): Promise<Locator> {
    return this.getLocator(selector);
  }

  // TAB MANAGEMENT

  /**
   * Open a new tab
   */
  public async openNextTab(): Promise<void> {
    const pages = this.context?.pages();
    if (pages && pages.length > 1) {
      await pages[1].bringToFront();
    } else {
      throw new Error('No additional tabs found');
    }
  }

  /**
   * Switch to previous tab
   */
  public async openPreviousTab(): Promise<void> {
    const pages = this.context?.pages();
    if (pages && pages.length > 0) {
      await pages[0].bringToFront();
    } else {
      throw new Error('No previous tabs found');
    }
  }

  // WAIT OPERATIONS

  /**
   * Wait for specified timeout
   * @param waitTime Timeout in milliseconds
   */
  public async waitForTimeout(waitTime: number = 1000): Promise<void> {
    await this.page.waitForTimeout(waitTime);
  }

  /**
   * Waits for an element to appear with specified conditions
   * @param selector CSS or text selector
   * @param options Options for waiting
   */
  public async waitForElement(selector: string, options: WaitOptions = DEFAULT_WAIT_OPTIONS): Promise<Locator> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);
    
    // Wait for the element to be visible first
    if (options.visible) {
      await locator.first().waitFor({
        state: 'visible',
        timeout: options.timeout || DEFAULT_WAIT_OPTIONS.timeout
      });
    }
    
    // If enabled is required, wait for it to be enabled
    if (options.enabled) {
      let attempts = 0;
      const maxAttempts = 10;
      const interval = Math.floor((options.timeout || 5000) / maxAttempts);
      
      while (attempts < maxAttempts) {
        const enabled = await locator.first().isEnabled();
        if (enabled) break;
        
        await this.page.waitForTimeout(interval);
        attempts++;
        
        if (attempts >= maxAttempts) {
          console.warn(`Element ${selector} still not enabled after ${maxAttempts} attempts`);
        }
      }
    }
    
    return locator;
  }

  /**
   * Waits for a selector to be visible and returns the corresponding Locator
   * @param selector The selector to wait for
   * @param options Retry options (optional)
   * @returns Locator for the visible element
   */
  public async waitForVisible(
    selector: string,
    options: Partial<RetryOptions> = {}
  ): Promise<Locator> {
    const resolvedSelector = this.getSelector(selector);
    const { maxRetries, delayMs } = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    return await this.retry(
      async () => {
        const locator = this.page.locator(resolvedSelector);
        const isVisible = await locator.first().isVisible();
        
        if (!isVisible) {
          throw new Error(`Element matching "${resolvedSelector}" is not visible`);
        }
        
        return locator;
      },
      { maxRetries, delayMs }
    );
  }

  /**
   * Retries an operation until it succeeds or max retries is reached
   * @param operation Function to retry
   * @param options Retry options (optional)
   * @returns Result of the successful operation
   * @throws Last error if all retries fail
   */
  public async retry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const { maxRetries, delayMs } = { ...DEFAULT_RETRY_OPTIONS, ...options };
    
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.log(`Retry attempt ${attempt + 1}/${maxRetries + 1} failed: ${error}`);
        
        if (attempt < maxRetries) {
          await this.page.waitForTimeout(delayMs);
        }
      }
    }
    
    throw lastError;
  }

  // CLICK OPERATIONS

  /**
   * Hover over an element
   * @param selector Element selector or name
   */
  public async hover(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.hover(resolvedSelector);
  }

  /**
   * Double click on an element
   * @param selector Element selector or name
   */
  public async doubleClick(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.dblclick(resolvedSelector);
  }

  /**
   * Click an element by selector
   * @param selector Element selector or name
   * @param options Wait options before clicking
   */
  public async click(selector: string, options?: WaitOptions): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);

    if (options) {
      // Wait for conditions if specified
      if (options.visible) {
        await locator.waitFor({ 
          state: 'visible', 
          timeout: options.timeout || DEFAULT_WAIT_OPTIONS.timeout 
        });
      }
      
      if (options.enabled) {
        // Wait for element to be enabled (with retry)
        let attempts = 0;
        const maxAttempts = 10;
        const interval = Math.floor((options.timeout || 5000) / maxAttempts);
        
        while (attempts < maxAttempts) {
          const enabled = await locator.isEnabled();
          if (enabled) break;
          
          await this.page.waitForTimeout(interval);
          attempts++;
          
          if (attempts >= maxAttempts) {
            console.warn(`Element still not enabled after ${maxAttempts} attempts`);
          }
        }
      }
    }
    
    await locator.click();
  }

  /**
   * Click an element containing text
   * @param text Text content to match
   * @param options Wait options before clicking
   */
  public async clickByText(text: string, options?: WaitOptions): Promise<void> {
    const locator = this.page.locator(`text="${text}"`);
    
    if (options) {
      // Wait for conditions if specified
      if (options.visible) {
        await locator.waitFor({ 
          state: 'visible', 
          timeout: options.timeout || DEFAULT_WAIT_OPTIONS.timeout 
        });
      }
      
      if (options.enabled) {
        // Wait for element to be enabled (with retry)
        let attempts = 0;
        const maxAttempts = 10;
        const interval = Math.floor((options.timeout || 5000) / maxAttempts);
        
        while (attempts < maxAttempts) {
          const enabled = await locator.isEnabled();
          if (enabled) break;
          
          await this.page.waitForTimeout(interval);
          attempts++;
          
          if (attempts >= maxAttempts) {
            console.warn(`Element with text "${text}" still not enabled after ${maxAttempts} attempts`);
          }
        }
      }
    }
    
    await locator.click();
  }

  /**
   * Click an element by role
   * @param role ARIA role
   * @param name Name of the element
   * @param options Additional options
   */
  public async clickByRole(role: 'button' | 'link' | 'checkbox' | 'radio' | 'tab' | 'menuitem', 
                         name: string, 
                         options?: { exact?: boolean }): Promise<void> {
    await this.page.getByRole(role, { name, exact: options?.exact }).click();
  }

  // FORM OPERATIONS

  /**
   * Fill input field by selector
   * @param selector Element selector or name
   * @param value Value to fill
   * @param options Wait options before filling
   */
  public async fill(selector: string, value: string, options?: WaitOptions): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);
    
    if (options) {
      // Wait for conditions if specified
      if (options.visible) {
        await locator.waitFor({ 
          state: 'visible', 
          timeout: options.timeout || DEFAULT_WAIT_OPTIONS.timeout 
        });
      }
      
      if (options.enabled) {
        // Wait for element to be enabled (with retry)
        let attempts = 0;
        const maxAttempts = 10;
        const interval = Math.floor((options.timeout || 5000) / maxAttempts);
        
        while (attempts < maxAttempts) {
          const enabled = await locator.isEnabled();
          if (enabled) break;
          
          await this.page.waitForTimeout(interval);
          attempts++;
          
          if (attempts >= maxAttempts) {
            console.warn(`Element still not enabled after ${maxAttempts} attempts`);
          }
        }
      }
    }
    
    await locator.fill(value);
  }

  /**
   * Fill input field by role
   * @param role ARIA role
   * @param name Name of the element
   * @param value Value to fill
   */
  public async fillByRole(role: 'textbox' | 'combobox' | 'searchbox', name: string, value: string): Promise<void> {
    await this.page.getByRole(role, { name }).fill(value);
  }

  /**
   * Fill input field that has specified text
   * @param text Text content to match
   * @param value Value to fill
   */
  public async fillByText(text: string, value: string): Promise<void> {
    await this.page.locator(`text="${text}"`).fill(value);
  }

  /**
   * Fill input field by placeholder text
   * @param placeholder Placeholder text
   * @param value Value to fill
   */
  public async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
    await this.page.getByPlaceholder(placeholder).fill(value);
  }

  /**
   * Fill input field by associated label
   * @param label Label text
   * @param value Value to fill
   */
  public async fillByLabel(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /**
   * Send keyboard keys
   * @param key Key or key combination to press
   */
  public async pressKey(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  /**
   * Select value from searchable dropdown
   * @param selector Element selector or name
   * @param value Value to select
   */
  public async selectSearchableDropdownValue(selector: string, value: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.click(resolvedSelector);
    await this.page.keyboard.type(value);
    await this.page.click(`text="${value}"`);
  }

  /**
   * Select value from dropdown
   * @param selector Element selector or name
   * @param value Value to select
   */
  public async selectDropdownValue(selector: string, value: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.selectOption(resolvedSelector, value);
  }

  /**
   * Check a checkbox
   * @param selector Element selector or name
   */
  public async checkCheckbox(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.check(resolvedSelector);
  }

  /**
   * Uncheck a checkbox
   * @param selector Element selector or name
   */
  public async uncheckCheckbox(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.uncheck(resolvedSelector);
  }

  /**
   * Upload a file
   * @param selector Element selector or name
   * @param filePath Path to the file
   */
  public async uploadFile(selector: string, filePath: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.setInputFiles(resolvedSelector, filePath);
  }

  /**
   * Click and then upload a file
   * @param selector Element selector or name
   * @param filePath Path to the file
   */
  public async clickAndUploadFile(selector: string, filePath: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await this.page.click(resolvedSelector);
    await this.page.setInputFiles(resolvedSelector, filePath);
  }

  // ASSERTIONS

  /**
   * Assert element is visible
   * @param selector Element selector or name
   */
  public async assertElementVisible(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toBeVisible();
  }

  /**
   * Assert element is enabled
   * @param selector Element selector or name
   */
  public async assertElementEnabled(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toBeEnabled();
  }

  /**
   * Assert element is hidden
   * @param selector Element selector or name
   */
  public async assertElementHidden(selector: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toBeHidden();
  }

  /**
   * Assert element has exact text
   * @param selector Element selector or name
   * @param expectedValue Expected text
   */
  public async assertTextEquals(selector: string, expectedValue: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toHaveText(expectedValue);
  }

  /**
   * Assert element contains text
   * @param selector Element selector or name
   * @param expectedValue Expected text to be contained
   */
  public async assertContainsText(selector: string, expectedValue: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toContainText(expectedValue);
  }

  /**
   * Assert input has value
   * @param selector Element selector or name
   * @param expectedValue Expected value
   */
  public async assertHasValue(selector: string, expectedValue: string): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    await expect(this.page.locator(resolvedSelector)).toHaveValue(expectedValue);
  }

  /**
   * Assert input has one of multiple values
   * @param selector Element selector or name
   * @param expectedValues Array of possible expected values
   */
  public async assertHasValues(selector: string, expectedValues: string[]): Promise<void> {
    const resolvedSelector = this.getSelector(selector);
    const value = await this.page.locator(resolvedSelector).inputValue();
    expect(expectedValues).toContain(value);
  }

  // ELEMENT PROPERTIES

  /**
   * Get text content of element
   * @param selector Element selector or name
   * @returns Text content or null
   */
  public async getTextContent(selector: string): Promise<string | null> {
    const resolvedSelector = this.getSelector(selector);
    return await this.page.locator(resolvedSelector).textContent();
  }

  /**
   * Get input value
   * @param selector Element selector or name
   * @returns Input value
   */
  public async getInputValue(selector: string): Promise<string> {
    const resolvedSelector = this.getSelector(selector);
    return await this.page.locator(resolvedSelector).inputValue();
  }

  /**
   * Get inner text
   * @param selector Element selector or name
   * @returns Inner text
   */
  public async getInnerText(selector: string): Promise<string> {
    const resolvedSelector = this.getSelector(selector);
    return await this.page.locator(resolvedSelector).innerText();
  }

  /**
   * Get attribute value
   * @param selector Element selector or name
   * @param attribute Attribute name
   * @returns Attribute value or null
   */
  public async getAttribute(selector: string, attribute: string): Promise<string | null> {
    const resolvedSelector = this.getSelector(selector);
    return await this.page.locator(resolvedSelector).getAttribute(attribute);
  }

  /**
   * Gets all values of a specific attribute from all matching elements
   * @param selector Element selector or name
   * @param attribute Attribute name
   * @returns Array of attribute values (null values are filtered out)
   */
  public async getAllAttributes(selector: string, attribute: string): Promise<string[]> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);
    const count = await locator.count();
    const results: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const value = await locator.nth(i).getAttribute(attribute);
      if (value !== null) {
        results.push(value);
      }
    }
    
    return results;
  }

  /**
   * Check if element exists
   * @param selector Element selector or name
   * @returns True if element exists
   */
  public async exists(selector: string): Promise<boolean> {
    const resolvedSelector = this.getSelector(selector);
    const count = await this.page.locator(resolvedSelector).count();
    return count > 0;
  }

  /**
   * Check if element is visible
   * @param selector Element selector or name
   * @returns True if element is visible
   */
  public async isVisible(selector: string): Promise<boolean> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);
    const count = await locator.count();
    
    if (count === 0) {
      return false;
    }
    
    try {
      return await locator.first().isVisible();
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if element is enabled
   * @param selector Element selector or name
   * @returns True if element is enabled
   */
  public async isEnabled(selector: string): Promise<boolean> {
    const resolvedSelector = this.getSelector(selector);
    const locator = this.page.locator(resolvedSelector);
    const count = await locator.count();
    
    if (count === 0) {
      return false;
    }
    
    try {
      return await locator.first().isEnabled();
    } catch (error) {
      return false;
    }
  }
} 