import { Page, BrowserContext, Locator, expect } from '@playwright/test';
import { LocalStore } from '../../lib/common/utils/LocalStore';
import { 
    DEFAULT_RETRY_OPTIONS, 
    DEFAULT_WAIT_OPTIONS,
    DEFAULT_RESOLVER_OPTIONS,
    PerformanceOptions,
    ResolverOptions,
    ResolverStrategy,
    RetryOptions,
    WaitOptions,
    ErrorType,
    PlaywrightActionError
} from '../core/types';
import { IWebInteractor } from '../core/IWebInteractor';
import { Locators, SelfHealingLocators } from '../locators/locators';
import { webConfig } from '../../lib/config/webConfig';
import * as path from 'path';

const ASSETS_FOLDER = 'src/data/assets';

type AriaRole = 'button' | 'link' | 'checkbox' | 'radio' | 'tab' | 'option' | 'menuitem' | 'textbox' | 'combobox';

export class PlaywrightActions implements IWebInteractor {
    readonly page: Page;
    readonly context?: BrowserContext;
    private localStore: LocalStore;
    private elementsMap: Record<string, any>;
    private useSelfHealing: boolean;
    private performanceOptions: PerformanceOptions;

    constructor(
        page: Page, 
        context?: BrowserContext, 
        elementsMap: Record<string, any> = {}, 
        useSelfHealing: boolean = false,
        performanceOptions: Partial<PerformanceOptions> = {}
    ) {
        this.page = page;
        this.context = context;
        this.localStore = LocalStore.getInstance();
        this.elementsMap = elementsMap;
        this.useSelfHealing = useSelfHealing;
        this.performanceOptions = {
            ...webConfig.PERFORMANCE_OPTIONS,
            ...performanceOptions
        };

        // Set default timeouts
        this.page.setDefaultTimeout(webConfig.DEFAULT_TIMEOUT);
        this.page.setDefaultNavigationTimeout(webConfig.DEFAULT_NAVIGATION_TIMEOUT);
    }

    /**
     * Set page elements map for lookup by name
     */
    setElementsMap(elementsMap: Record<string, any>): void {
        this.elementsMap = elementsMap;
    }

    /**
     * Get selector from elements map or return original
     */
    private getSelector(selector: string): string {
        return this.elementsMap[selector] || selector;
    }

    /**
     * Check if an object is a Playwright Locator
     */
    private isPlaywrightLocator(obj: any): boolean {
        return obj && 
               typeof obj === 'object' && 
               typeof obj.click === 'function' && 
               typeof obj.fill === 'function' && 
               typeof obj.count === 'function' &&
               typeof obj.first === 'function';
    }

    /**
     * Retry an async operation with configurable retry options
     */
    private async retry<T>(
        operation: () => Promise<T>,
        options: Partial<RetryOptions> = {},
        errorType: ErrorType,
        errorMessage: string
    ): Promise<T> {
        const retryOptions = { ...webConfig.RETRY_OPTIONS, ...options };
        let lastError: Error | undefined;

        for (let attempt = 1; attempt <= retryOptions.maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                if (attempt < retryOptions.maxRetries) {
                    await this.page.waitForTimeout(retryOptions.delayMs);
                }
            }
        }

        throw new PlaywrightActionError(
            errorType,
            `${errorMessage} (after ${retryOptions.maxRetries} attempts)`,
            undefined,
            lastError
        );
    }

    /**
     * Wait for performance conditions based on configuration
     */
    private async waitForPerformanceConditions(): Promise<void> {
        if (this.performanceOptions.waitForLoadState) {
            await this.page.waitForLoadState('load');
        }
        if (this.performanceOptions.waitForNetworkIdle) {
            await this.page.waitForLoadState('networkidle');
        }
        // Add more performance-related waits as needed
    }

    // Self-healing Locator Methods

    private getLocator(key: string): string {
        try {
            const parts = key.split('.');
            let current: any = this.useSelfHealing ? SelfHealingLocators : Locators;
            
            for (const part of parts) {
                if (!current[part]) {
                    throw new PlaywrightActionError(
                        ErrorType.INVALID_SELECTOR,
                        `${webConfig.ERROR_MESSAGES.INVALID_SELECTOR}${key}`,
                        key
                    );
                }
                current = current[part];
            }
            
            if (this.useSelfHealing && current.selectors) {
                return current.selectors[0];
            }
            
            return current;
        } catch (error) {
            throw new PlaywrightActionError(
                ErrorType.INVALID_SELECTOR,
                `${webConfig.ERROR_MESSAGES.INVALID_SELECTOR}${key}`,
                key,
                error as Error
            );
        }
    }

    private async trySelfHealingSelectors(key: string): Promise<void> {
        if (!this.useSelfHealing) return;

        try {
            const parts = key.split('.');
            let current: any = SelfHealingLocators;
            
            for (const part of parts) {
                if (!current[part]) return;
                current = current[part];
            }

            if (current.selectors) {
                for (const selector of current.selectors) {
                    try {
                        if (await this.exists(selector)) return;
                    } catch (e) {
                        continue;
                    }
                }
                throw new PlaywrightActionError(
                    ErrorType.SELF_HEALING_FAILED,
                    `${webConfig.ERROR_MESSAGES.SELF_HEALING_FAILED}${key}`,
                    key
                );
            }
        } catch (error) {
            throw new PlaywrightActionError(
                ErrorType.SELF_HEALING_FAILED,
                `${webConfig.ERROR_MESSAGES.SELF_HEALING_FAILED}${key}`,
                key,
                error as Error
            );
        }
    }

    // Navigation Actions

    async navigate(url: string): Promise<void> {
        await this.retry(
            async () => {
                const response = await this.page.goto(url);
                if (!response?.ok()) {
                    throw new Error(`Navigation failed with status ${response?.status()}`);
                }
                await this.waitForPerformanceConditions();
            },
            undefined,
            ErrorType.NAVIGATION_FAILED,
            `${webConfig.ERROR_MESSAGES.NAVIGATION_FAILED}${url}`
        );
    }

    async clickNavLink(name: string): Promise<void> {
        const key = `common.navigation.${name}Link`;
        const locator = this.getLocator(key);
        
        await this.retry(
            async () => {
                try {
                    await this.click(locator);
                    await this.waitForPerformanceConditions();
                } catch (e) {
                    if (this.useSelfHealing) {
                        await this.trySelfHealingSelectors(key);
                    }
                    throw e;
                }
            },
            undefined,
            ErrorType.ELEMENT_NOT_FOUND,
            `${webConfig.ERROR_MESSAGES.ELEMENT_NOT_FOUND}${name}Link`
        );
    }

    // Core Element Methods

    async locate(selector: string | Locator): Promise<Locator> {
        if (this.isPlaywrightLocator(selector)) {
            return selector as Locator;
        }
        return this.page.locator(this.getSelector(selector as string));
    }

    async resolve(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<Locator | undefined> {
        const resolvedOptions = { ...webConfig.DEFAULT_RESOLVER_OPTIONS, ...options };
        
        return this.retry(
            async () => {
                const elementLocator = await this.locate(selector);
                const count = await elementLocator.count();
                
                if (count === 0) {
                    if (resolvedOptions.throwOnNotFound) {
                        throw new PlaywrightActionError(
                            ErrorType.ELEMENT_NOT_FOUND,
                            `${webConfig.ERROR_MESSAGES.ELEMENT_NOT_FOUND}${selector}`,
                            selector as string
                        );
                    }
                    return undefined;
                }
                
                if (count === 1) {
                    return elementLocator.first();
                }
                
                // Multiple elements found, apply resolution strategy
                switch (resolvedOptions.strategy) {
                    case ResolverStrategy.FIRST:
                        return elementLocator.first();
                    case ResolverStrategy.LAST:
                        return elementLocator.last();
                    case ResolverStrategy.MOST_VISIBLE:
                        return this.resolveMostVisible(elementLocator, count);
                    default:
                        return elementLocator.first();
                }
            },
            {},
            ErrorType.ELEMENT_NOT_FOUND,
            `${webConfig.ERROR_MESSAGES.ELEMENT_NOT_FOUND}${selector}`
        );
    }

    private async resolveMostVisible(elementLocator: Locator, count: number): Promise<Locator> {
        let highestVisibility = 0;
        let mostVisibleIndex = 0;
        
        for (let i = 0; i < count; i++) {
            const el = elementLocator.nth(i);
            const isVisible = await el.isVisible();
            
            if (isVisible) {
                const bbox = await el.boundingBox();
                if (bbox) {
                    const area = bbox.width * bbox.height;
                    const viewport = this.page.viewportSize();
                    
                    if (viewport && 
                        bbox.x >= 0 && bbox.y >= 0 && 
                        bbox.x + bbox.width <= viewport.width && 
                        bbox.y + bbox.height <= viewport.height) {
                        if (area > highestVisibility) {
                            highestVisibility = area;
                            mostVisibleIndex = i;
                        }
                    }
                }
            }
        }
        
        return elementLocator.nth(mostVisibleIndex);
    }

    // Tab Management Methods

    async switchToNextTab(): Promise<void> {
        const pages = this.context?.pages();
        if (pages && pages.length > 1) {
            await pages[1].bringToFront();
        } else {
            throw new Error('No additional tabs found');
        }
    }

    async switchToPreviousTab(): Promise<void> {
        const pages = this.context?.pages();
        if (pages && pages.length > 0) {
            await pages[0].bringToFront();
        } else {
            throw new Error('No previous tabs found');
        }
    }

    // Wait Operations

    async waitForTimeout(waitTime: number = 1000): Promise<void> {
        await this.page.waitForTimeout(waitTime);
    }

    async waitForElement(selector: string | Locator, options: Partial<WaitOptions> = {}): Promise<Locator> {
        const resolvedOptions = { ...webConfig.DEFAULT_WAIT_OPTIONS, ...options };
        const elementLocator = await this.locate(selector);
        
        if (resolvedOptions.visible) {
            await elementLocator.first().waitFor({
                state: 'visible',
                timeout: resolvedOptions.timeout
            });
        }
        
        if (resolvedOptions.enabled) {
            await elementLocator.first().waitFor({
                state: 'visible',  // Using visible since enabled is not a valid state
                timeout: resolvedOptions.timeout
            });
        }
        
        return elementLocator;
    }

    // Enhanced Mouse Actions

    async hover(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.hover();
        }
    }

    async doubleClick(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.dblclick();
        }
    }

    async sendKeyboardKeys(key: string): Promise<void> {
        return this.page.keyboard.press(key);
    }

    // Enhanced Click Actions

    async click(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.click();
        }
    }

    async clickByElementText(text: string): Promise<void> {
        await this.page.getByText(text).click();
    }

    async clickByElementRole(role: AriaRole, name: string): Promise<void> {
        await this.page.getByRole(role, { name: name }).waitFor({ state: 'visible' });
        await this.page.getByRole(role, { name: name }).click();
    }

    // Enhanced Fill Actions

    async fill(selector: string | Locator, value: string, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.fill(value);
        }
    }

    async fillElementByRole(role: AriaRole, name: string, input: string): Promise<void> {
        await this.page.getByRole(role, { name: name }).waitFor({ state: 'visible' });
        await this.page.getByRole(role, { name: name }).fill(input);
    }

    async fillElementByPlaceholder(placeholder: string, input: string): Promise<void> {
        await this.page.getByPlaceholder(placeholder).waitFor({ state: 'visible' });
        await this.page.getByPlaceholder(placeholder).fill(input);
    }

    async fillElementByLabel(label: string, input: string): Promise<void> {
        await this.page.getByLabel(label).waitFor({ state: 'visible' });
        await this.page.getByLabel(label).fill(input);
    }

    // Form Operations

    async selectOption(selector: string | Locator, value: string | string[], options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.selectOption(value);
        }
    }

    async check(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.check();
        }
    }

    async uncheck(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.uncheck();
        }
    }

    async setInputFiles(selector: string | Locator, filePath: string | string[], options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await element.setInputFiles(filePath);
        }
    }

    // Enhanced Dropdown Actions

    async searchAndSelectFromDropdown(element: string, value: string): Promise<void> {
        await this.fill(element, value);
        await this.page.getByRole('option', { name: value }).click();
    }

    async selectValueFromDropdown(element: string, value: string): Promise<void> {
        await this.click(element);
        await this.page.getByRole('option', { name: value }).click();
    }

    // State Checks

    async isVisible(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<boolean> {
        const element = await this.resolve(selector, options);
        return element ? element.isVisible() : false;
    }

    async isEnabled(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<boolean> {
        const element = await this.resolve(selector, options);
        return element ? element.isEnabled() : false;
    }

    async exists(selector: string | Locator): Promise<boolean> {
        const elementLocator = await this.locate(selector);
        return (await elementLocator.count()) > 0;
    }

    // Content Retrieval

    async getText(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<string | null> {
        const element = await this.resolve(selector, options);
        return element ? element.textContent() : null;
    }

    async getInputValue(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<string | null> {
        const element = await this.resolve(selector, options);
        return element ? element.inputValue() : null;
    }

    async getAttribute(selector: string | Locator, attribute: string, options: Partial<ResolverOptions> = {}): Promise<string | null> {
        const element = await this.resolve(selector, options);
        return element ? element.getAttribute(attribute) : null;
    }

    // Enhanced Assertions

    async expectVisible(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toBeVisible();
        }
    }

    async expectHidden(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toBeHidden();
        }
    }

    async expectEnabled(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toBeEnabled();
        }
    }

    async expectDisabled(selector: string | Locator, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toBeDisabled();
        }
    }

    async expectValue(selector: string | Locator, value: string | RegExp, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toHaveValue(value);
        }
    }

    async expectText(selector: string | Locator, text: string | RegExp, options: Partial<ResolverOptions> = {}): Promise<void> {
        const element = await this.resolve(selector, options);
        if (element) {
            await expect(element).toHaveText(text);
        }
    }

    // Legacy Assertion Methods (Maintained for backward compatibility)

    async assertElementIsVisible(element: string): Promise<void> {
        await this.expectVisible(element);
    }

    async assertElementIsEnabled(element: string): Promise<void> {
        await this.expectEnabled(element);
    }

    async assertElementIsHidden(element: string): Promise<void> {
        await this.expectHidden(element);
    }

    async assertElementTextEquals(element: string, expectedValue: string): Promise<void> {
        const elementText = await this.getText(element);
        expect(elementText).toBe(expectedValue);
    }

    async assertElementContainText(selector: string, expectedValue: string): Promise<void> {
        const resolvedElement = await this.resolve(selector);
        if (resolvedElement) {
            await expect(resolvedElement).toHaveText(new RegExp(expectedValue));
        }
    }

    async assertElementHaveValue(element: string, expectedValue: string): Promise<void> {
        await this.expectValue(element, expectedValue);
    }

    // Legacy Element State Getters (Maintained for backward compatibility)

    async textContent(element: string): Promise<string> {
        return (await this.getText(element)) || '';
    }

    async innerText(selector: string): Promise<string> {
        const resolvedElement = await this.resolve(selector);
        return resolvedElement ? await resolvedElement.innerText() : '';
    }

    async inputValue(element: string): Promise<string> {
        return (await this.getInputValue(element)) || '';
    }

    // File upload actions
    async uploadFile(element: string, filePath: string): Promise<void> {
        await this.retry(
            async () => {
                const fileChooserPromise = this.page.waitForEvent('filechooser');
                await this.click(element);
                const fileChooser = await fileChooserPromise;
                await fileChooser.setFiles(path.join(webConfig.ASSETS_FOLDER, filePath));
            },
            undefined,
            ErrorType.ELEMENT_NOT_FOUND,
            `${webConfig.ERROR_MESSAGES.ELEMENT_NOT_FOUND}${element}`
        );
    }

    async clickAndUpload(element: string, filePath: string): Promise<void> {
        const [fileChooser] = await Promise.all([
            this.page.waitForEvent('filechooser'),
            this.click(element)
        ]);
        await fileChooser.setFiles(filePath);
    }

    // Enhanced Form Actions

    /**
     * Fill a form field by label
     */
    async fillByLabel(label: string, value: string): Promise<void> {
        await this.retry(
            async () => {
                await this.fill(`label:has-text("${label}") >> input, textarea`, value);
            },
            undefined,
            ErrorType.ELEMENT_NOT_FOUND,
            `${webConfig.ERROR_MESSAGES.ELEMENT_NOT_FOUND}label "${label}"`
        );
    }

    /**
     * Fill a form field by placeholder
     */
    async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
        await this.fill(`[placeholder="${placeholder}"]`, value);
    }

    /**
     * Select an option from a dropdown by label
     */
    async selectOptionByLabel(label: string, value: string): Promise<void> {
        await this.selectOption(`label:has-text("${label}") >> select`, value);
    }

    /**
     * Check a checkbox by label
     */
    async checkBoxByLabel(label: string): Promise<void> {
        await this.check(`label:has-text("${label}") >> input[type="checkbox"]`);
    }

    // Enhanced Verification Actions

    /**
     * Verify page title
     */
    async verifyTitle(title: string | RegExp): Promise<void> {
        await this.page.waitForTimeout(1000); // Allow title to update
        const pageTitle = await this.page.title();
        if (title instanceof RegExp) {
            if (!title.test(pageTitle)) {
                throw new Error(`Page title "${pageTitle}" does not match pattern ${title}`);
            }
        } else if (pageTitle !== title) {
            throw new Error(`Page title "${pageTitle}" does not match "${title}"`);
        }
    }

    /**
     * Verify text is present on the page
     */
    async verifyText(text: string): Promise<void> {
        await this.expectText('body', new RegExp(text));
    }

    /**
     * Verify element is visible with self-healing support
     */
    async verifyVisible(selector: string | { selectors: string[] }): Promise<void> {
        if (typeof selector === 'string') {
            await this.expectVisible(selector);
        } else {
            // For self-healing locators, try each selector in order
            for (const sel of selector.selectors) {
                try {
                    await this.expectVisible(sel);
                    return;
                } catch (e) {
                    // Continue to next selector
                    continue;
                }
            }
            throw new Error(`Failed to verify visibility with any of the provided selectors`);
        }
    }
} 