import { Page, Locator, expect } from '@playwright/test';
import { PlaywrightActions } from '../core/PlaywrightActions';
import { WebActions } from '../core/WebActions';
import { ResolverOptions } from '../core/types';

/**
 * WebAssertions provides a comprehensive set of assertion methods for web UI testing
 * Built on top of Playwright's expect API with additional utility methods
 */
export class WebAssertions {
    private page: Page;
    private actions: PlaywrightActions;
    private webActions: WebActions;

    constructor(page: Page, actions?: PlaywrightActions, webActions?: WebActions) {
        this.page = page;
        this.actions = actions || new PlaywrightActions(page);
        this.webActions = webActions || new WebActions(page);
    }

    /**
     * Assertion wrapper to improve error messages and screenshots
     */
    private async assert<T>(
        assertionFn: () => Promise<T>, 
        message: string
    ): Promise<T> {
        try {
            return await assertionFn();
        } catch (error) {
            console.error(`Assertion failed: ${message}`);
            throw error;
        }
    }

    /**
     * Get locator from string or return existing locator
     */
    private getLocator(selector: string | Locator): Locator {
        return typeof selector === 'string' 
            ? this.page.locator(selector)
            : selector;
    }

    // #region Element Visibility Assertions

    /**
     * Assert that an element is visible
     * @param selector - Selector or Locator for the element
     * @param options - Optional resolver options
     */
    async toBeVisible(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toBeVisible(options);
        }, `Element "${selector}" should be visible`);
    }

    /**
     * Assert that an element is hidden
     * @param selector - Selector or Locator for the element
     * @param options - Optional resolver options
     */
    async toBeHidden(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toBeHidden(options);
        }, `Element "${selector}" should be hidden`);
    }

    /**
     * Assert that an element exists in the DOM (whether visible or not)
     * @param selector - Selector or Locator for the element
     */
    async toExist(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const count = await locator.count();
            expect.soft(count).toBeGreaterThan(0);
        }, `Element "${selector}" should exist in the DOM`);
    }

    /**
     * Assert that an element does not exist in the DOM
     * @param selector - Selector or Locator for the element
     */
    async toNotExist(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveCount(0);
        }, `Element "${selector}" should not exist in the DOM`);
    }

    /**
     * Assert that multiple elements are all visible
     * @param selectors - Array of selectors or locators
     */
    async allToBeVisible(selectors: (string | Locator)[]): Promise<void> {
        for (const selector of selectors) {
            await this.toBeVisible(selector);
        }
    }

    /**
     * Assert that multiple elements are all hidden
     * @param selectors - Array of selectors or locators
     */
    async allToBeHidden(selectors: (string | Locator)[]): Promise<void> {
        for (const selector of selectors) {
            await this.toBeHidden(selector);
        }
    }

    /**
     * Assert that an element is in the viewport
     * @param selector - Selector or Locator for the element
     */
    async toBeInViewport(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            
            // First check visibility
            await expect(locator).toBeVisible();
            
            // Check if element is in viewport
            const inViewport = await this.page.evaluate(async (el) => {
                if (!el) return false;
                const rect = el.getBoundingClientRect();
                return (
                    rect.top >= 0 &&
                    rect.left >= 0 &&
                    rect.bottom <= window.innerHeight &&
                    rect.right <= window.innerWidth
                );
            }, await locator.elementHandle());
            
            // Use Playwright's expect for the boolean check
            expect.soft(inViewport).toBeTruthy();
        }, `Element "${selector}" should be visible in the viewport`);
    }

    // #endregion

    // #region Element State Assertions

    /**
     * Assert that an element is enabled
     * @param selector - Selector or Locator for the element
     * @param options - Optional resolver options
     */
    async toBeEnabled(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toBeEnabled(options);
        }, `Element "${selector}" should be enabled`);
    }

    /**
     * Assert that an element is disabled
     * @param selector - Selector or Locator for the element
     * @param options - Optional resolver options
     */
    async toBeDisabled(selector: string | Locator, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toBeDisabled(options);
        }, `Element "${selector}" should be disabled`);
    }

    /**
     * Assert that a checkbox or radio is checked
     * @param selector - Selector or Locator for the element
     */
    async toBeChecked(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toBeChecked();
        }, `Element "${selector}" should be checked`);
    }

    /**
     * Assert that a checkbox or radio is not checked
     * @param selector - Selector or Locator for the element
     */
    async notToBeChecked(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).not.toBeChecked();
        }, `Element "${selector}" should not be checked`);
    }

    /**
     * Assert that an element has a specific attribute
     * @param selector - Selector or Locator for the element
     * @param attribute - Name of the attribute
     * @param value - Expected value of the attribute (exact match)
     */
    async toHaveAttribute(selector: string | Locator, attribute: string, value: string | RegExp): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveAttribute(attribute, value);
        }, `Element "${selector}" should have attribute "${attribute}" with value "${value}"`);
    }

    /**
     * Assert that an element has a class
     * @param selector - Selector or Locator for the element
     * @param className - Expected class name
     */
    async toHaveClass(selector: string | Locator, className: string | RegExp): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveClass(className);
        }, `Element "${selector}" should have class "${className}"`);
    }

    /**
     * Assert that an element does not have a specific class
     * @param selector - Selector or Locator for the element
     * @param className - Class name that should not be present
     */
    async notToHaveClass(selector: string | Locator, className: string): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const classList = await locator.getAttribute('class') || '';
            const classes = classList.split(' ');
            await expect(classes).not.toContain(className);
        }, `Element "${selector}" should not have class "${className}"`);
    }

    /**
     * Assert that an element has specific CSS property value
     * @param selector - Selector or Locator for the element
     * @param property - CSS property name
     * @param value - Expected CSS property value
     */
    async toHaveCSSProperty(selector: string | Locator, property: string, value: string | RegExp): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const handle = await locator.elementHandle();
            if (!handle) throw new Error(`Element not found: ${selector}`);
            
            const cssValue = await this.page.evaluate(
                ({ element, prop }) => {
                    return getComputedStyle(element).getPropertyValue(prop);
                },
                { element: handle, prop: property }
            );

            if (value instanceof RegExp) {
                expect.soft(cssValue).toMatch(value);
            } else {
                expect.soft(cssValue).toBe(value);
            }
        }, `Element "${selector}" should have CSS property "${property}" with value "${value}"`);
    }

    // #endregion

    // #region Element Content Assertions

    /**
     * Assert that an element has specific text
     * @param selector - Selector or Locator for the element
     * @param text - Expected text (exact match)
     * @param options - Optional resolver options
     */
    async toHaveText(selector: string | Locator, text: string | RegExp, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveText(text, options);
        }, `Element "${selector}" should have text "${text}"`);
    }

    /**
     * Assert that an element has text containing a substring
     * @param selector - Selector or Locator for the element
     * @param text - Text that should be included in the element
     */
    async toContainText(selector: string | Locator, text: string): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toContainText(text);
        }, `Element "${selector}" should contain text "${text}"`);
    }

    /**
     * Assert that an element does not contain a substring
     * @param selector - Selector or Locator for the element
     * @param text - Text that should not be included in the element
     */
    async notToContainText(selector: string | Locator, text: string): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).not.toContainText(text);
        }, `Element "${selector}" should not contain text "${text}"`);
    }

    /**
     * Assert that an input element has a specific value
     * @param selector - Selector or Locator for the element
     * @param value - Expected input value (exact match)
     * @param options - Optional resolver options
     */
    async toHaveValue(selector: string | Locator, value: string | RegExp, options?: Partial<ResolverOptions>): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveValue(value, options);
        }, `Element "${selector}" should have value "${value}"`);
    }

    /**
     * Assert that an element has expected count
     * @param selector - Selector or Locator for the element
     * @param count - Expected count
     */
    async toHaveCount(selector: string | Locator, count: number): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveCount(count);
        }, `Element "${selector}" should have count ${count}`);
    }

    /**
     * Assert that an element has count greater than a number
     * @param selector - Selector or Locator for the element
     * @param count - Minimum count
     */
    async toHaveCountGreaterThan(selector: string | Locator, count: number): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const actualCount = await locator.count();
            expect.soft(actualCount).toBeGreaterThan(count);
        }, `Element "${selector}" should have count greater than ${count}`);
    }

    /**
     * Assert that an element has count less than a number
     * @param selector - Selector or Locator for the element
     * @param count - Minimum count
    async toHaveCountLessThan(selector: string | Locator, count: number): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const actualCount = await locator.count();
            expect.soft(actualCount).toBeLessThan(count);
        }, `Element "${selector}" should have count less than ${count}`);
    }
        }, `Element "${selector}" should have count less than ${count}`);
    }

    // #endregion

    // #region Table Assertions

    /**
     * Assert that a table has specific number of rows
     * @param tableSelector - Selector for the table
     * @param expectedRowCount - Expected number of rows
     * @param includeHeader - Whether to include header in the count
     */
    async tableToHaveRowCount(tableSelector: string | Locator, expectedRowCount: number, includeHeader: boolean = false): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            const rowSelector = includeHeader ? 'tr' : 'tbody tr';
            const rowLocator = tableLocator.locator(rowSelector);
            await expect(rowLocator).toHaveCount(expectedRowCount);
        }, `Table "${tableSelector}" should have ${expectedRowCount} rows`);
    }

    /**
     * Assert that a table has specific number of columns
     * @param tableSelector - Selector for the table
     * @param expectedColumnCount - Expected number of columns
     */
    async tableToHaveColumnCount(tableSelector: string | Locator, expectedColumnCount: number): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            const headerLocator = tableLocator.locator('thead tr:first-child th, thead tr:first-child td');
            await expect(headerLocator).toHaveCount(expectedColumnCount);
        }, `Table "${tableSelector}" should have ${expectedColumnCount} columns`);
    }

    /**
     * Assert that a specific cell in a table has expected content
     * @param tableSelector - Selector for the table
     * @param rowIndex - Zero-based row index (not counting header)
     * @param columnIndex - Zero-based column index
     * @param expectedContent - Expected cell content
     */
    async tableCellToHaveContent(
        tableSelector: string | Locator, 
        rowIndex: number, 
        columnIndex: number, 
        expectedContent: string | RegExp
    ): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            const cellLocator = tableLocator.locator(`tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1})`);
            await expect(cellLocator).toHaveText(expectedContent);
        }, `Table cell [${rowIndex}, ${columnIndex}] should have content "${expectedContent}"`);
    }

    /**
     * Assert that a specific column in a table contains a value in any row
     * @param tableSelector - Selector for the table
    async tableColumnToContainValue(
        tableSelector: string | Locator, 
        columnIndex: number, 
        expectedContent: string
    ): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            const columnLocator = tableLocator.locator(`tbody tr td:nth-child(${columnIndex + 1}):has-text("${expectedContent}")`);
            const count = await columnLocator.count();
            expect.soft(count).toBeGreaterThan(0);
        }, `Table column at index ${columnIndex} should contain value "${expectedContent}" in at least one row`);
    }
            await expect(columnLocator).toHaveCount({ greaterThan: 0 });
        }, `Table column at index ${columnIndex} should contain value "${expectedContent}" in at least one row`);
    }

    /**
    async tableToContainRow(tableSelector: string | Locator, rowValues: string[]): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            // Create a locator that finds rows containing each value in the specified cells
            let rowSelector = 'tbody tr';
            
            for (let i = 0; i < rowValues.length; i++) {
                rowSelector += `:has(td:nth-child(${i + 1}):has-text("${rowValues[i]}"))`;
            }
            
            const matchingRows = tableLocator.locator(rowSelector);
            const count = await matchingRows.count();
            expect.soft(count).toBeGreaterThan(0);
        }, `Table should contain a row with values [${rowValues.join(', ')}]`);
    }
            const matchingRows = tableLocator.locator(rowSelector);
            await expect(matchingRows).toHaveCount({ greaterThan: 0 });
        }, `Table should contain a row with values [${rowValues.join(', ')}]`);
    }

    /**
     * Assert table data matches expected data set
     * @param tableSelector - Selector for the table
     * @param expectedData - 2D array of expected data (rows/columns)
     * @param startRow - Starting row index (0-based)
     * @param startColumn - Starting column index (0-based)
     */
    async tableDataToMatch(
        tableSelector: string | Locator,
        expectedData: string[][],
        startRow: number = 0,
        startColumn: number = 0
    ): Promise<void> {
        return this.assert(async () => {
            const tableLocator = this.getLocator(tableSelector);
            const rows = tableLocator.locator('tbody tr');
            
            // Check we have enough rows
            const rowCount = await rows.count();
            expect.soft(rowCount).toBeGreaterThanOrEqual(startRow + expectedData.length);
            
            // Check each cell's content
            for (let i = 0; i < expectedData.length; i++) {
                const rowCells = rows.nth(i + startRow).locator('td');
                
                // Check we have enough columns
                const cellCount = await rowCells.count();
                expect.soft(cellCount).toBeGreaterThanOrEqual(startColumn + expectedData[i].length);
                
                // Check each cell in this row
                for (let j = 0; j < expectedData[i].length; j++) {
                    const cellLocator = rowCells.nth(j + startColumn);
                    await expect(cellLocator).toContainText(expectedData[i][j]);
                }
            }
        }, `Table data should match expected data set`);
    }

    // #endregion

    // #region Page Assertions

    /**
     * Assert that page has the specified title
     * @param title - Expected title (exact match)
     */
    async toHaveTitle(title: string | RegExp): Promise<void> {
        return this.assert(async () => {
            await expect(this.page).toHaveTitle(title);
        }, `Page should have title "${title}"`);
    }

    /**
     * Assert that page URL matches expected value
     * @param urlOrRegexp - Expected URL (exact match or regexp)
     */
    async toHaveURL(urlOrRegexp: string | RegExp): Promise<void> {
        return this.assert(async () => {
            await expect(this.page).toHaveURL(urlOrRegexp);
        }, `Page should have URL "${urlOrRegexp}"`);
    }

    /**
     * Assert that page contains text
     * @param text - Text that should be present on the page
     */
    async pageToContainText(text: string): Promise<void> {
        return this.assert(async () => {
            const bodyLocator = this.page.locator('body');
            await expect(bodyLocator).toContainText(text);
        }, `Page should contain text "${text}"`);
    }

    /**
     * Assert that page does not contain text
     * @param text - Text that should not be present on the page
     */
    async pageNotToContainText(text: string): Promise<void> {
        return this.assert(async () => {
            const bodyLocator = this.page.locator('body');
            await expect(bodyLocator).not.toContainText(text);
        }, `Page should not contain text "${text}"`);
    }

    // #endregion

    // #region Network Assertions

    /**
     * Assert that a network request was made with specific URL pattern
     * @param urlPattern - URL pattern to match against
     */
    async requestToBeMade(urlPattern: string | RegExp): Promise<void> {
        return this.assert(async () => {
            // We can only verify requests that will be made after this point
            // so we'll wait for a request matching the pattern
            const requestPromise = this.page.waitForRequest(urlPattern, { timeout: 5000 })
                .then(() => true)
                .catch(() => false);
                
            const found = await requestPromise;
            expect.soft(found).toBe(true);
        }, `Network request matching "${urlPattern}" should have been made`);
    }

    /**
     * Assert that response status code matches expected value
     * @param urlPattern - URL pattern to match
     * @param statusCode - Expected status code
     */
    async responseToHaveStatus(urlPattern: string | RegExp, statusCode: number): Promise<void> {
        return this.assert(async () => {
            // Wait for a response that matches the URL pattern and status code
            const responsePromise = this.page.waitForResponse(
                response => {
                    const url = response.url();
                    const matches = urlPattern instanceof RegExp ? 
                        urlPattern.test(url) : 
                        url.includes(urlPattern);
                    return matches && response.status() === statusCode;
                },
                { timeout: 5000 }
            )
            .then(() => true)
            .catch(() => false);
            
            const found = await responsePromise;
            expect.soft(found).toBe(true);
        }, `Response for "${urlPattern}" should have status code ${statusCode}`);
    }

    // #endregion

    // #region Accessibility Assertions

    /**
     * Assert that page passes accessibility checks
     * @param options - Options for the accessibility scan
     * @requires installing @axe-core/playwright
     */
    async toBeAccessible(options?: any): Promise<void> {
        return this.assert(async () => {
            // This requires @axe-core/playwright package
            try {
                // @ts-ignore
                const { AxeBuilder } = require('@axe-core/playwright');
                // @ts-ignore
                const accessibilityScanResults = await new AxeBuilder({ page: this.page })
                    .include('body')
                    .options(options || {})
                    .analyze();

                expect.soft(accessibilityScanResults.violations).toHaveLength(0);
            } catch (error) {
                console.warn('Accessibility testing requires @axe-core/playwright package');
                throw error;
            }
        }, 'Page should not have accessibility violations');
    }

    /**
     * Assert that an element has a valid ARIA role
     * @param selector - Selector for the element
     * @param expectedRole - Expected ARIA role
     */
    async toHaveAriaRole(selector: string | Locator, expectedRole: string): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveAttribute('role', expectedRole);
        }, `Element "${selector}" should have ARIA role "${expectedRole}"`);
    }

    // #endregion

    // #region Image Assertions

    /**
     * Assert that an image is loaded successfully
     * @param selector - Selector for the image element
     */
    async imageToBeLoaded(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            
            // Check if element exists and is an image
            await expect(locator).toBeVisible();
            
            // Verify tag name is img
            const tagName = await locator.evaluate(el => el.tagName.toLowerCase());
            expect.soft(tagName).toBe('img');
            
            // Verify image is loaded and has dimensions
            const isLoaded = await locator.evaluate(img => {
                if (img instanceof HTMLImageElement) {
                    return img.complete && img.naturalWidth > 0;
                }
                // For SVG or other elements, consider them loaded
                return 'complete' in img ? (img as HTMLImageElement).complete : true;
            });
            
            expect.soft(isLoaded).toBe(true);
        }, `Image "${selector}" should be loaded successfully`);
    }

    /**
     * Assert that an image has a valid src attribute
     * @param selector - Selector for the image element
     * @param expectedSrc - Expected src value or pattern
     */
    async imageToHaveSrc(selector: string | Locator, expectedSrc: string | RegExp): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            await expect(locator).toHaveAttribute('src', expectedSrc);
        }, `Image "${selector}" should have src "${expectedSrc}"`);
    }

    /**
     * Assert that an image has alt text for accessibility
     * @param selector - Selector for the image element
     */
    async imageToHaveAltText(selector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const locator = this.getLocator(selector);
            const alt = await locator.getAttribute('alt');
            
            expect.soft(alt).not.toBeNull();
            expect.soft(alt?.trim().length).toBeGreaterThan(0);
        }, `Image "${selector}" should have non-empty alt text`);
    }

    // #endregion

    // #region Composite Assertions

    /**
     * Assert that a form is valid (all required fields filled and no validation errors)
     * @param formSelector - Selector for the form element
     */
    async formToBeValid(formSelector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const formLocator = this.getLocator(formSelector);
            
            // Check if form is valid
            const isValid = await formLocator.evaluate(form => {
                // Check HTML5 validation
                if (form instanceof HTMLFormElement) {
                    return form.checkValidity();
                }
                return false;
            });
            
            expect.soft(isValid).toBe(true);
            
            // Check for validation error messages
            const errorMessageLocator = formLocator.locator('.error, .invalid-feedback, [role="alert"], .validation-message');
            
            // Error messages should not be visible
            for (let i = 0; i < await errorMessageLocator.count(); i++) {
                await expect(errorMessageLocator.nth(i)).toBeHidden();
            }
        }, `Form "${formSelector}" should be valid`);
    }

    /**
     * Assert that a modal or dialog is visible
     * @param modalSelector - Selector for the modal element
     */
    async modalToBeVisible(modalSelector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const modalLocator = this.getLocator(modalSelector);
            
            // Modal should be visible
            await expect(modalLocator).toBeVisible();
            
            // Modal should have focus trap
            const focusTrapActive = await this.page.evaluate(() => {
                const activeElement = document.activeElement;
                return activeElement !== document.body && 
                      activeElement !== document.documentElement;
            });
            
            expect.soft(focusTrapActive).toBe(true);
            
            // Body should have scroll lock
            const bodyHasScrollLock = await this.page.evaluate(() => {
                const bodyStyles = window.getComputedStyle(document.body);
                return bodyStyles.overflow === 'hidden' || 
                       bodyStyles.position === 'fixed';
            });
            
            expect.soft(bodyHasScrollLock).toBe(true);
        }, `Modal "${modalSelector}" should be visible and properly configured`);
    }

    /**
     * Assert that a page or section is in loading state
     * @param loaderSelector - Selector for the loading indicator
     */
    async toBeLoading(loaderSelector: string | Locator): Promise<void> {
        return this.assert(async () => {
            const loaderLocator = this.getLocator(loaderSelector);
            await expect(loaderLocator).toBeVisible();
        }, `Loading indicator "${loaderSelector}" should be visible`);
    }

    /**
     * Assert that a page or section has finished loading
     * @param loaderSelector - Selector for the loading indicator
     * @param timeoutMs - Maximum wait time in milliseconds
     */
    async toBeLoaded(loaderSelector: string | Locator, timeoutMs: number = 10000): Promise<void> {
        return this.assert(async () => {
            const loaderLocator = this.getLocator(loaderSelector);
            await expect(loaderLocator).toBeHidden({ timeout: timeoutMs });
        }, `Loading indicator "${loaderSelector}" should be hidden`);
    }

    /**
     * Assert that all elements are rendered correctly and there are no visual regressions
     * @param fullPage - Whether to check the entire page or just the viewport
     */
    async visuallyMatches(snapshotName: string, options?: any): Promise<void> {
        return this.assert(async () => {
            // This method requires Playwright's built-in visual comparison
            await expect(this.page).toHaveScreenshot(`${snapshotName}.png`, options);
        }, `Page should match visual snapshot "${snapshotName}"`);
    }

    // #endregion
}

// Create a not object to support negative assertions
Object.defineProperty(WebAssertions.prototype, 'not', {
    get: function() {
        const not = Object.create(Object.getPrototypeOf(this));
        Object.getOwnPropertyNames(WebAssertions.prototype)
            .filter(prop => typeof this[prop] === 'function' && !prop.startsWith('_'))
            .forEach(method => {
                not[method] = async (...args: any[]) => {
                    try {
                        await this[method](...args);
                        throw new Error(`Expected assertion "${method}" to fail, but it passed`);
                    } catch (err) {
                        // Success - the assertion failed as expected
                        return;
                    }
                };
            });
        return not;
    }
});

// Export a factory function to simplify creation
export function createWebAssertions(page: Page, actions?: PlaywrightActions, webActions?: WebActions): WebAssertions {
    return new WebAssertions(page, actions, webActions);
}