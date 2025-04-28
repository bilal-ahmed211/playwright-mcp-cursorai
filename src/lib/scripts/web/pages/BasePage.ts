import { Page, expect } from '@playwright/test';
import { Locators } from '../../../../data/web/locators/fyi-locators';
import { WebHelpers } from '../utils/web/WebHelpers';
import { SelfHealingHandler } from '../utils/web/SelfHealingHandler';
import { SelfHealingLocators } from '../../../../data/web/locators/self-healing-locators';
import { LocatorResolver, ResolverOptions, ResolverStrategy } from '../utils/web/LocatorResolver';

export type NavigationLink = 'Home' | 'Help' | 'About us' | 'The Team' | 'Press' | 'Terms of Service' | 'Privacy Policy';

/**
 * Unified BasePage that combines self-healing capabilities and resolver strategies
 * for handling ambiguous locators in a single implementation
 */
export class BasePage {
    readonly page: Page;
    readonly baseUrl: string;
    readonly webHelper: WebHelpers;
    readonly selfHealingHandler: SelfHealingHandler;
    readonly resolver: LocatorResolver;
    readonly useSelfHealing: boolean;

    constructor(page: Page, useSelfHealing: boolean = false) {
        this.page = page;
        this.webHelper = new WebHelpers(page);
        this.selfHealingHandler = new SelfHealingHandler(page);
        this.resolver = new LocatorResolver(page);
        this.baseUrl = 'https://fyi.ai';
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
            'Home': Locators.common.navigation.homeLink,
            'Help': Locators.common.navigation.helpLink,
            'About us': Locators.common.navigation.aboutUsLink,
            'The Team': Locators.common.navigation.teamLink,
            'Press': Locators.common.navigation.pressLink,
            'Terms of Service': Locators.common.navigation.termsLink,
            'Privacy Policy': Locators.common.navigation.privacyLink
        };

        return selectorMap[linkName];
    }

    /**
     * Gets the appropriate self-healing locator for a navigation link
     * @param linkName Name of the navigation link
     * @returns Self-healing locator for the link
     */
    private getNavLinkSelfHealingLocator(linkName: NavigationLink): any {
        const locatorMap: Record<NavigationLink, any> = {
            'Home': SelfHealingLocators.common.navigation.homeLink,
            'Help': SelfHealingLocators.common.navigation.helpLink,
            'About us': SelfHealingLocators.common.navigation.aboutUsLink,
            'The Team': SelfHealingLocators.common.navigation.teamLink,
            'Press': SelfHealingLocators.common.navigation.pressLink,
            'Terms of Service': SelfHealingLocators.common.navigation.termsLink,
            'Privacy Policy': SelfHealingLocators.common.navigation.privacyLink
        };

        return locatorMap[linkName];
    }

    /**
     * Click on a navigation link by name
     * @param linkName Name of the navigation link to click
     */
    async clickNavLink(linkName: NavigationLink) {
        try {
            if (this.useSelfHealing) {
                
                // Use self-healing locator with safe element action
                const locator = this.getNavLinkSelfHealingLocator(linkName);

                // First try to locate the element
                const count = await this.safeElementAction(locator, 'count');

                if (count > 1) {
                    // Try to click the second instance (index 1) which is usually in the main navigation
                    const element = await this.safeElementAction(locator, 'nth', { index: 1 });
                    await element.waitFor({ state: 'visible' , timeout: 10000});
                    await this.webHelper.clickByText(linkName);
                } else if (count === 1) {
                    await this.safeElementAction(locator, 'click');
                } else {
                    throw new Error(`Navigation link '${linkName}' not found`);
                }
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

            // Fallback mechanism - if the normal method fails, try the alternative method
            if (!this.useSelfHealing) {
                console.log(`Trying self-healing method as fallback for clicking '${linkName}'`);
                try {
                    const locator = this.getNavLinkSelfHealingLocator(linkName);

                    // Use safe element action for fallback
                    const count = await this.safeElementAction(locator, 'count');

                    if (count > 1) {
                        const element = await this.safeElementAction(locator, 'nth', { index: 1 });
                        await element.click();
                    } else if (count === 1) {
                        await this.safeElementAction(locator, 'click');
                    } else {
                        throw error; // Re-throw original error if fallback also fails
                    }
                    return; // Exit if fallback succeeds
                } catch (fallbackError) {
                    console.error(`Fallback also failed: ${fallbackError}`);
                    throw error; // Throw original error
                }
            }

            throw error;
        }
    }

    /**
     * Click on a navigation link by name with automatic resolution of ambiguity
     * @param linkName Name of the navigation link to click
     * @param resolverOptions Optional options for element resolution
     */
    async clickNavLinkSafe(linkName: NavigationLink, resolverOptions: Partial<ResolverOptions> = {}) {
        try {
            const defaultOptions: Partial<ResolverOptions> = {
                // By default, look for the main navigation link, not footer links
                strategy: ResolverStrategy.CONTAINS_TEXT,
                strategyOptions: {
                    text: linkName
                }
            };

            // Merge default options with user-provided options
            const options = { ...defaultOptions, ...resolverOptions };

            if (this.useSelfHealing) {
                // Use self-healing locator with resolver
                const locator = this.getNavLinkSelfHealingLocator(linkName);
                await this.resolver.click(locator, options);
            } else {
                // Use standard locator with resolver
                const selector = this.getNavLinkSelector(linkName);
                await this.resolver.click(selector, options);
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
            // Use self-healing locators with safe verification
            const navigationLinks = [
                SelfHealingLocators.common.navigation.homeLink,
                SelfHealingLocators.common.navigation.helpLink,
                SelfHealingLocators.common.navigation.aboutUsLink,
                SelfHealingLocators.common.navigation.teamLink,
                SelfHealingLocators.common.navigation.pressLink,
                SelfHealingLocators.common.navigation.termsLink,
                SelfHealingLocators.common.navigation.privacyLink
            ];

            for (const linkLocator of navigationLinks) {
                await this.safeVerifyVisible(linkLocator);
            }
        } else {
            // Use standard locators with safe verification
            const navigationLinks = [
                Locators.common.navigation.homeLink,
                Locators.common.navigation.helpLink,
                Locators.common.navigation.aboutUsLink,
                Locators.common.navigation.teamLink,
                Locators.common.navigation.pressLink,
                Locators.common.navigation.termsLink,
                Locators.common.navigation.privacyLink
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
            await this.selfHealingHandler.click(SelfHealingLocators.common.navigation.downloadButton);
        } else {
            const downloadButton = await this.webHelper.locate(Locators.common.navigation.downloadButton);
            await downloadButton.click();
        }
    }

    /**
     * Verify footer is present and contains expected elements
     */
    async verifyFooter() {
        if (this.useSelfHealing) {
            // Use self-healing locators with safe verification
            await this.safeVerifyVisible(SelfHealingLocators.common.footer.container);
            await this.safeVerifyVisible(SelfHealingLocators.common.footer.copyright);
        } else {
            // Use standard locators with safe verification
            await this.safeVerifyVisible(Locators.common.footer.container);
            await this.safeVerifyVisible(Locators.common.footer.copyright);
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
     * Resolve and click any locator, handling the case of multiple matching elements
     * @param locator Locator (string, Playwright Locator, or self-healing locator)
     * @param options Resolution options
     */
    async clickSafe(locator: any, options: Partial<ResolverOptions> = {}): Promise<void> {
        await this.resolver.click(locator, options);
    }

    /**
     * Resolve and fill any locator, handling the case of multiple matching elements
     * @param locator Locator (string, Playwright Locator, or self-healing locator)
     * @param value Value to fill
     * @param options Resolution options
     */
    async fillSafe(locator: any, value: string, options: Partial<ResolverOptions> = {}): Promise<void> {
        await this.resolver.fill(locator, value, options);
    }

    /**
     * Verify element is visible after resolving any ambiguity
     * @param locator Locator (string, Playwright Locator, or self-healing locator)
     * @param options Resolution options
     */
    async verifyVisibleSafe(locator: any, options: Partial<ResolverOptions> = {}): Promise<void> {
        await this.resolver.expectVisible(locator, options);
    }

    /**
     * Verify text content matches expected value after resolving any ambiguity
     * @param locator Locator (string, Playwright Locator, or self-healing locator)
     * @param expectedText Expected text content
     * @param options Resolution options
     */
    async verifyTextSafe(locator: any, expectedText: string | RegExp, options: Partial<ResolverOptions> = {}): Promise<void> {
        const resolvedElement = await this.resolver.resolve(locator, options);
        if (resolvedElement) {
            await expect(resolvedElement).toHaveText(expectedText);
        }
    }

    /**
     * Verify text is contained in element after resolving any ambiguity
     * @param locator Locator (string, Playwright Locator, or self-healing locator)
     * @param expectedText Expected text to be contained
     * @param options Resolution options
     */
    async verifyContainsTextSafe(locator: any, expectedText: string, options: Partial<ResolverOptions> = {}): Promise<void> {
        const resolvedElement = await this.resolver.resolve(locator, options);
        if (resolvedElement) {
            await expect(resolvedElement).toContainText(expectedText);
        }
    }

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
            const element = this.useSelfHealing ?
                await this.selfHealingHandler.locate(locator) :
                await this.webHelper.locate(locator);

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
        } catch (error) {
            if (error.message.includes('strict mode violation')) {
                console.log(`Handling strict mode violation for ${action} action`);

                // In case of strict mode violation, try to find the most appropriate element
                // by using more specific strategies
                const element = this.useSelfHealing ?
                    await this.selfHealingHandler.locate(locator) :
                    await this.webHelper.locate(locator);

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
            const element = this.useSelfHealing ?
                await this.selfHealingHandler.locate(locator) :
                await this.webHelper.locate(locator);
            await expect(element).toBeVisible({ timeout: 10000 });
        } catch (error) {
            if (error.message.includes('strict mode violation')) {
                console.log(`Handling strict mode violation for visibility check`);

                // In case of strict mode violation, try each matching element
                const element = this.useSelfHealing ?
                    await this.selfHealingHandler.locate(locator) :
                    await this.webHelper.locate(locator);

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