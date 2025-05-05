import { Page, BrowserContext, Locator } from '@playwright/test';
import { ResolverOptions, WaitOptions } from './types';

/**
 * Interface defining the contract for web element interactions
 */
export interface IWebInteractor {
    readonly page: Page;
    readonly context?: BrowserContext;

    // Core Element Operations
    locate(selector: string | Locator): Promise<Locator>;
    click(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    fill(selector: string | Locator, value: string, options?: Partial<ResolverOptions>): Promise<void>;
    hover(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    doubleClick(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    
    // Form Operations
    selectOption(selector: string | Locator, value: string | string[], options?: Partial<ResolverOptions>): Promise<void>;
    check(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    uncheck(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    setInputFiles(selector: string | Locator, filePath: string | string[], options?: Partial<ResolverOptions>): Promise<void>;
    
    // State Checks
    isVisible(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<boolean>;
    isEnabled(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<boolean>;
    exists(selector: string | Locator): Promise<boolean>;
    
    // Content Retrieval
    getText(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<string | null>;
    getInputValue(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<string | null>;
    getAttribute(selector: string | Locator, attribute: string, options?: Partial<ResolverOptions>): Promise<string | null>;
    
    // Assertions
    expectVisible(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    expectHidden(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    expectEnabled(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void>;
    expectText(selector: string | Locator, text: string | RegExp, options?: Partial<ResolverOptions>): Promise<void>;
    expectValue(selector: string | Locator, value: string | RegExp, options?: Partial<ResolverOptions>): Promise<void>;
    
    // Wait Operations
    waitForElement(selector: string | Locator, options?: Partial<WaitOptions>): Promise<Locator>;
    waitForTimeout(waitTime?: number): Promise<void>;
    
    // Tab Management
    switchToNextTab(): Promise<void>;
    switchToPreviousTab(): Promise<void>;
} 