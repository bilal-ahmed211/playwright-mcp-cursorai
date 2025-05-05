import { Page, BrowserContext, Locator } from '@playwright/test';
import { PlaywrightActions } from './PlaywrightActions';
import { ResolverOptions, WaitOptions } from '../core/types';
import { Locators, SelfHealingLocators } from '../locators/locators';

/**
 * WebActions provides a high-level API for common web interactions,
 * built on top of ElementInteractor with additional convenience methods
 * and self-healing capabilities.
 */
export class WebActions {
    private interactor: PlaywrightActions;
    private useSelfHealing: boolean;

    constructor(page: Page, context?: BrowserContext, useSelfHealing: boolean = false) {
        this.interactor = new PlaywrightActions(page, context, {}, useSelfHealing);
        this.useSelfHealing = useSelfHealing;
    }

    /**
     * Get the appropriate locator based on self-healing setting
     */
    private getLocator(key: string): string {
        const parts = key.split('.');
        let current: any = this.useSelfHealing ? SelfHealingLocators : Locators;
        
        for (const part of parts) {
            if (!current[part]) {
                throw new Error(`Invalid locator key: ${key}`);
            }
            current = current[part];
        }
        
        if (this.useSelfHealing && current.selectors) {
            // For self-healing locators, try each selector in order until one works
            return current.selectors[0]; // Start with the first selector
        }
        
        return current;
    }

    /**
     * Try all selectors for a self-healing locator
     */
    private async trySelfHealingSelectors(key: string): Promise<void> {
        if (!this.useSelfHealing) {
            return;
        }

        const parts = key.split('.');
        let current: any = SelfHealingLocators;
        
        for (const part of parts) {
            if (!current[part]) {
                return;
            }
            current = current[part];
        }

        if (current.selectors) {
            for (const selector of current.selectors) {
                try {
                    if (await this.interactor.exists(selector)) {
                        return;
                    }
                } catch (e) {
                    // Continue to next selector
                }
            }
            throw new Error(`None of the self-healing selectors worked for ${key}`);
        }
    }

    // Navigation Actions

    /**
     * Navigate to a URL
     */
    async navigate(url: string): Promise<void> {
        await this.interactor.page.goto(url);
    }

    /**
     * Click a navigation link by name
     */
    async clickNavLink(name: string): Promise<void> {
        const key = `common.navigation.${name}Link`;
        const locator = this.getLocator(key);
        try {
            await this.interactor.click(locator);
        } catch (e) {
            if (this.useSelfHealing) {
                await this.trySelfHealingSelectors(key);
            }
            throw e;
        }
    }

    /**
     * Click the download button
     */
    async clickDownloadButton(): Promise<void> {
        const key = 'common.navigation.downloadButton';
        const locator = this.getLocator(key);
        try {
            await this.interactor.click(locator);
        } catch (e) {
            if (this.useSelfHealing) {
                await this.trySelfHealingSelectors(key);
            }
            throw e;
        }
    }

    // Form Actions

    /**
     * Fill a form field by label
     */
    async fillField(label: string, value: string): Promise<void> {
        await this.interactor.fill(`label:has-text("${label}") >> input, textarea`, value);
    }

    /**
     * Fill a form field by placeholder
     */
    async fillByPlaceholder(placeholder: string, value: string): Promise<void> {
        await this.interactor.fill(`[placeholder="${placeholder}"]`, value);
    }

    /**
     * Select an option from a dropdown by label
     */
    async selectOption(label: string, value: string): Promise<void> {
        await this.interactor.selectOption(`label:has-text("${label}") >> select`, value);
    }

    /**
     * Check a checkbox by label
     */
    async checkBox(label: string): Promise<void> {
        await this.interactor.check(`label:has-text("${label}") >> input[type="checkbox"]`);
    }

    /**
     * Upload a file to an input
     */
    async uploadFile(selector: string, filePath: string): Promise<void> {
        await this.interactor.setInputFiles(selector, filePath);
    }

    // Verification Actions

    /**
     * Verify page title
     */
    async verifyTitle(title: string | RegExp): Promise<void> {
        await this.interactor.page.waitForTimeout(1000); // Allow title to update
        const pageTitle = await this.interactor.page.title();
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
        await this.interactor.expectText('body', new RegExp(text));
    }

    /**
     * Verify element is visible
     */
    async verifyVisible(selector: string): Promise<void> {
        await this.interactor.expectVisible(selector);
    }

    /**
     * Verify element contains text
     */
    async verifyElementText(selector: string, text: string): Promise<void> {
        await this.interactor.expectText(selector, text);
    }

    // Wait Actions

    /**
     * Wait for element to be visible
     */
    async waitForVisible(selector: string, options?: Partial<WaitOptions>): Promise<void> {
        await this.interactor.waitForElement(selector, { ...options, visible: true });
    }

    /**
     * Wait for element to be enabled
     */
    async waitForEnabled(selector: string, options?: Partial<WaitOptions>): Promise<void> {
        await this.interactor.waitForElement(selector, { ...options, enabled: true });
    }

    /**
     * Wait for a specific timeout
     */
    async wait(milliseconds: number): Promise<void> {
        await this.interactor.waitForTimeout(milliseconds);
    }

    // Tab Management

    /**
     * Switch to the next tab
     */
    async switchToNextTab(): Promise<void> {
        await this.interactor.switchToNextTab();
    }

    /**
     * Switch to the previous tab
     */
    async switchToPreviousTab(): Promise<void> {
        await this.interactor.switchToPreviousTab();
    }

    // Utility Methods

    /**
     * Get text content of an element
     */
    async getText(selector: string): Promise<string | null> {
        return await this.interactor.getText(selector);
    }

    /**
     * Get value of an input
     */
    async getValue(selector: string): Promise<string | null> {
        return await this.interactor.getInputValue(selector);
    }

    /**
     * Check if an element exists
     */
    async exists(selector: string): Promise<boolean> {
        return await this.interactor.exists(selector);
    }

    /**
     * Check if an element is visible
     */
    async isVisible(selector: string): Promise<boolean> {
        return await this.interactor.isVisible(selector);
    }

    /**
     * Check if an element is enabled
     */
    async isEnabled(selector: string): Promise<boolean> {
        return await this.interactor.isEnabled(selector);
    }

    /**
     * Locate an element on the page
     */
    async locate(selector: string): Promise<Locator> {
        return await this.interactor.locate(selector);
    }

    /**
     * Click an element by its text content
     */
    async clickByText(text: string): Promise<void> {
        await this.interactor.click(`text=${text}`);
    }

    /**
     * Public wrapper for getLocator to allow external usage
     */
    public resolveLocator(key: string): string {
        return this.getLocator(key);
    }

    /**
     * Public click method to allow external usage
     */
    public async click(selector: string): Promise<void> {
        await this.interactor.click(selector);
    }
} 