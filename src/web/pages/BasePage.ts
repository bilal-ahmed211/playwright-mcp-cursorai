import { Page, expect } from '@playwright/test';
import { WebActions } from '../core/WebActions';

export type NavigationLink = 'Home' | 'Help' | 'About us' | 'The Team' | 'Press' | 'Terms of Service' | 'Privacy Policy';

/**
 * Unified BasePage that combines self-healing capabilities and resolver strategies
 * for handling ambiguous locators in a single implementation
 */
export class BasePage {
    readonly page: Page;
    readonly baseUrl: string;
    readonly webActions: WebActions;
    readonly useSelfHealing: boolean;

    constructor(page: Page, useSelfHealing: boolean = false, baseUrl: string = 'https://fyi.ai') {
        this.page = page;
        this.webActions = new WebActions(page);
        this.baseUrl = baseUrl;
        this.useSelfHealing = useSelfHealing;
    }

    /**
     * Navigate to a specific path in the application
     * @param path Optional path to navigate to
     * @returns Promise that resolves when navigation is complete
     */
    async navigate(path: string = '') {
        try {
            // Normalize the path to ensure it doesn't start with a slash
            const normalizedPath = path.startsWith('/') ? path.substring(1) : path;
            await this.page.goto(`${this.baseUrl}/${normalizedPath}`);
        } catch (error) {
            console.error(`Navigation error to path "${path}": ${error}`);
            throw error;
        }
    }

    /**
     * Verify page title matches expected text
     * @param title Expected title text or pattern
     */
    async verifyTitle(title: string) {
        await this.page.waitForTimeout(3000);
        await expect(this.page).toHaveTitle(new RegExp(title));
    }

    /**
     * Verify page URL contains expected path
     * @param urlPath Expected URL path or pattern
     */
    async verifyUrl(urlPath: string) {
        await expect(this.page).toHaveURL(new RegExp(urlPath));
    }

    /**
     * Gets the appropriate selector for a navigation link
     * @param linkName Name of the navigation link
     * @returns Selector string for the link
     */
    private getNavLinkSelector(linkName: NavigationLink): string {
        const selectorMap: Record<NavigationLink, string> = {
            'Home': this.webActions.resolveLocator('common.navigation.homeLink'),
            'Help': this.webActions.resolveLocator('common.navigation.helpLink'),
            'About us': this.webActions.resolveLocator('common.navigation.aboutUsLink'),
            'The Team': this.webActions.resolveLocator('common.navigation.teamLink'),
            'Press': this.webActions.resolveLocator('common.navigation.pressLink'),
            'Terms of Service': this.webActions.resolveLocator('common.navigation.termsLink'),
            'Privacy Policy': this.webActions.resolveLocator('common.navigation.privacyLink')
        };

        return selectorMap[linkName];
    }

    /**
     * Click on a navigation link by name
     * @param linkName Name of the navigation link to click
     */
    async clickNavLink(linkName: NavigationLink) {
        try {
            if (this.useSelfHealing) {
                throw new Error('Self-healing not supported in this version');
            } else {
                // Use standard locator with safe element action
                const selector = this.getNavLinkSelector(linkName);

                // First try to locate the element
                const count = await this.safeElementAction(selector, 'count');

                if (count > 1) {
                    // Try to click the second instance (index 1) which is usually in the main navigation
                    const element = await this.safeElementAction(selector, 'nth', { index: 1 });
                    await element.click();
                } else if (count === 1) {
                    await this.safeElementAction(selector, 'click');
                } else {
                    throw new Error(`Navigation link '${linkName}' not found`);
                }
            }
        } catch (error) {
            console.error(`Error clicking navigation link '${linkName}': ${error}`);
            throw error;
        }
    }

    /**
     * Click on a navigation link by name with automatic resolution of ambiguity
     * @param linkName Name of the navigation link to click
     */
    async clickNavLinkSafe(linkName: NavigationLink) {
        try {
            if (this.useSelfHealing) {
                throw new Error('Self-healing not supported in this version');
            } else {
                const selector = this.getNavLinkSelector(linkName);
                await this.webActions.click(selector);
            }
        } catch (error) {
            console.error(`Error clicking navigation link '${linkName}' with resolver: ${error}`);
            // Attempt fallback to the original clickNavLink method
            console.log(`Falling back to original clickNavLink method for '${linkName}'`);
            await this.page.waitForTimeout(3000);
            await this.clickNavLink(linkName);
        }
    }

    /**
     * Verify all navigation links are visible
     */
    async verifyNavigationLinks() {
        if (this.useSelfHealing) {
            throw new Error('Self-healing not supported in this version');
        } else {
            // Use standard locators with safe verification
            const navigationLinks = [
                this.webActions.resolveLocator('common.navigation.homeLink'),
                this.webActions.resolveLocator('common.navigation.helpLink'),
                this.webActions.resolveLocator('common.navigation.aboutUsLink'),
                this.webActions.resolveLocator('common.navigation.teamLink'),
                this.webActions.resolveLocator('common.navigation.pressLink'),
                this.webActions.resolveLocator('common.navigation.termsLink'),
                this.webActions.resolveLocator('common.navigation.privacyLink')
            ];

            for (const link of navigationLinks) {
                await this.safeVerifyVisible(link);
            }
        }
    }

    /**
     * Click the Download button
     */
    async clickDownloadButton() {
        if (this.useSelfHealing) {
            throw new Error('Self-healing not supported in this version');
        } else {
            const downloadButton = await this.webActions.locate('common.navigation.downloadButton');
            await downloadButton.click();
        }
    }

    /**
     * Verify footer is present and contains expected elements
     */
    async verifyFooter() {
        if (this.useSelfHealing) {
            throw new Error('Self-healing not supported in this version');
        } else {
            // Use standard locators with safe verification
            await this.safeVerifyVisible(this.webActions.resolveLocator('common.footer.container'));
            await this.safeVerifyVisible(this.webActions.resolveLocator('common.footer.copyright'));
        }
    }

    /**
     * Set viewport to mobile dimensions
     */
    async setMobileViewport() {
        await this.page.setViewportSize({ width: 375, height: 667 });
    }

    // --- RESOLVER METHODS ---

    /**
     * Safely locate and interact with elements, handling strict mode violations
     * @param locator The locator to find the element
     * @param action The action to perform on the element (e.g., 'click', 'check', etc.)
     * @param options Additional options for the action
     * @returns Promise that resolves when action is complete
     */
    async safeElementAction(locator: any, action: 'click' | 'check' | 'fill' | 'isVisible' | 'count' | 'nth', options?: any): Promise<any> {
        try {
            // First try using the locator directly
            const element = await this.webActions.locate(locator);

            // Perform the requested action
            switch (action) {
                case 'click':
                    await element.click(options);
                    break;
                case 'check':
                    await element.check(options);
                    break;
                case 'fill':
                    await element.fill(options?.text || '', options);
                    break;
                case 'isVisible':
                    return await element.isVisible();
                case 'count':
                    return await element.count();
                case 'nth':
                    return element.nth(options?.index || 0);
                default:
                    throw new Error(`Unsupported action: ${action}`);
            }
        } catch (error: unknown) {
            if (error instanceof Error && error.message.includes('strict mode violation')) {
                console.log(`Handling strict mode violation for ${action} action`);

                // In case of strict mode violation, try to find the most appropriate element
                // by using more specific strategies
                const element = await this.webActions.locate(locator);

                // Get all matching elements
                const count = await element.count();

                if (count === 0) {
                    throw new Error(`No elements found for ${locator}`);
                }

                // Try to find the most visible element
                let selectedElement = element;
                if (count > 1) {
                    for (let i = 0; i < count; i++) {
                        const currentElement = element.nth(i);
                        const isVisible = await currentElement.isVisible();

                        if (isVisible) {
                            // If element is visible, use it
                            selectedElement = currentElement;
                            break;
                        }
                    }
                }

                // Perform the requested action on the selected element
                switch (action) {
                    case 'click':
                        await selectedElement.click(options);
                        break;
                    case 'check':
                        await selectedElement.check(options);
                        break;
                    case 'fill':
                        await selectedElement.fill(options?.text || '', options);
                        break;
                    case 'isVisible':
                        return await selectedElement.isVisible();
                    case 'count':
                        return count;
                    case 'nth':
                        return selectedElement;
                    default:
                        throw new Error(`Unsupported action: ${action}`);
                }
            } else {
                // If it's not a strict mode violation, rethrow the error
                throw error;
            }
        }
    }

    /**
     * Safely verify if an element is visible, handling strict mode violations
     * @param locator The locator to find the element
     * @returns Promise that resolves when verification is complete
     */
    async safeVerifyVisible(locator: any): Promise<void> {
        try {
            const element = await this.webActions.locate(locator);
            await expect(element).toBeVisible({ timeout: 10000 });
        } catch (error: unknown) {
            if ((error as Error).message.includes('strict mode violation')) {
                console.log(`Handling strict mode violation for visibility check`);

                // In case of strict mode violation, try each matching element
                const element = await this.webActions.locate(locator);

                const count = await element.count();

                if (count === 0) {
                    throw new Error(`No elements found for locator`);
                }

                // Check if at least one element is visible
                let anyVisible = false;
                for (let i = 0; i < count; i++) {
                    const isVisible = await element.nth(i).isVisible();
                    if (isVisible) {
                        anyVisible = true;
                        break;
                    }
                }

                if (!anyVisible) {
                    throw new Error('None of the matching elements are visible');
                }
            } else {
                // If it's not a strict mode violation, rethrow the error
                throw error;
            }
        }
    }
} 