import { Page, expect } from '@playwright/test';
import { WebActions } from '../core/WebActions';
import { WebAssertions, createWebAssertions } from '../assertions';

/**
 * Example usage of WebAssertions class with a page object
 * This example demonstrates how to incorporate the assertions module in your tests
 */
export class MagentoAssertions {
    private webAssertions: WebAssertions;
    private page: Page;

    constructor(page: Page, webActions?: WebActions) {
        this.page = page;
        this.webAssertions = createWebAssertions(page, undefined, webActions);
    }

    /**
     * Assert product title matches expected value
     * @param productSelector - Selector for the product element
     * @param expectedTitle - Expected product title
     */
    async assertProductTitle(productSelector: string, expectedTitle: string): Promise<void> {
        const titleSelector = `${productSelector} .product-title`;
        await this.webAssertions.toHaveText(titleSelector, expectedTitle);
    }

    /**
     * Assert product price matches expected value
     * @param productSelector - Selector for the product element
     * @param expectedPrice - Expected product price
     */
    async assertProductPrice(productSelector: string, expectedPrice: string): Promise<void> {
        const priceSelector = `${productSelector} .price`;
        await this.webAssertions.toHaveText(priceSelector, expectedPrice);
    }

    /**
     * Assert product image is loaded correctly
     * @param productSelector - Selector for the product element
     */
    async assertProductImageLoaded(productSelector: string): Promise<void> {
        const imageSelector = `${productSelector} img`;
        await this.webAssertions.imageToBeLoaded(imageSelector);
    }

    /**
     * Assert cart contains specified number of items
     * @param expectedCount - Expected number of items in cart
     */
    async assertCartItemCount(expectedCount: number): Promise<void> {
        await this.webAssertions.toHaveText('.cart-count', expectedCount.toString());
    }

    /**
     * Assert that shopping cart contains a specific product
     * @param productName - Name of the product to check for
     */
    async assertCartContainsProduct(productName: string): Promise<void> {
        await this.webAssertions.toContainText('.cart-items', productName);
    }

    /**
     * Assert that a product can be added to cart
     * @param productSelector - Selector for the product element
     */
    async assertAddToCartButtonEnabled(productSelector: string): Promise<void> {
        const buttonSelector = `${productSelector} .add-to-cart-button`;
        await this.webAssertions.toBeVisible(buttonSelector);
        await this.webAssertions.toBeEnabled(buttonSelector);
    }

    /**
     * Assert that a product is available (in stock)
     * @param productSelector - Selector for the product element
     */
    async assertProductInStock(productSelector: string): Promise<void> {
        const stockSelector = `${productSelector} .stock-status`;
        await this.webAssertions.toBeVisible(stockSelector);
        await this.webAssertions.toContainText(stockSelector, 'In Stock');
    }

    /**
     * Assert that a product is not available (out of stock)
     * @param productSelector - Selector for the product element
     */
    async assertProductOutOfStock(productSelector: string): Promise<void> {
        const stockSelector = `${productSelector} .stock-status`;
        await this.webAssertions.toBeVisible(stockSelector);
        await this.webAssertions.toContainText(stockSelector, 'Out of Stock');
    }

    /**
     * Assert that product list contains at least a specified number of products
     * @param minCount - Minimum number of products expected
     */
    async assertProductListNotEmpty(minCount: number = 1): Promise<void> {
        await this.webAssertions.toHaveCountGreaterThan('.product-item', minCount - 1);
    }

    /**
     * Assert that product list is empty
     */
    async assertProductListEmpty(): Promise<void> {
        await this.webAssertions.toHaveCount('.product-item', 0);
    }

    /**
     * Assert that product search returned results
     * @param searchQuery - Search query that was used
     */
    async assertSearchResults(searchQuery: string): Promise<void> {
        // Updated to use 'search results' class pattern that matches the site structure
        await this.webAssertions.toBeVisible('.search.results');
        await this.webAssertions.toContainText('.search.results-heading, .search.results', searchQuery);
        await this.webAssertions.toHaveCountGreaterThan('.product-item', 0);
    }

    /**
     * Assert that product search returned no results
     * @param searchQuery - Search query that was used
     */
    async assertNoSearchResults(searchQuery: string): Promise<void> {
        await this.webAssertions.toBeVisible('.no-results-message');
        await this.webAssertions.toContainText('.no-results-message', searchQuery);
    }

    /**
     * Assert pagination is visible and working
     * @param totalPages - Expected number of total pages
     */
    async assertPaginationWorks(totalPages: number): Promise<void> {
        await this.webAssertions.toBeVisible('.pagination');
        
        // Check if pagination shows correct number of pages
        if (totalPages > 5) {
            // For many pages, there might be ellipsis
            await this.webAssertions.toBeVisible('.pagination .ellipsis');
        } else {
            // For fewer pages, check exact count of page links
            await this.webAssertions.toHaveCount('.pagination .page-link', totalPages);
        }
        
        // Check if "Next" button is available
        if (totalPages > 1) {
            await this.webAssertions.toBeVisible('.pagination .next-page');
            await this.webAssertions.toBeEnabled('.pagination .next-page');
        }
    }

    /**
     * Assert product category navigation is working
     * @param categoryName - Name of the category to check
     */
    async assertCategoryNavigation(categoryName: string): Promise<void> {
        // Check category exists in navigation
        await this.webAssertions.toContainText('.category-nav', categoryName);
        
        // Category should be clickable
        const categorySelector = `.category-nav .category-item:has-text("${categoryName}")`;
        await this.webAssertions.toBeVisible(categorySelector);
        await this.webAssertions.toBeEnabled(categorySelector);
    }

    /**
     * Assert order summary details in checkout
     * @param subtotal - Expected subtotal amount
     * @param tax - Expected tax amount
     * @param shipping - Expected shipping amount
     * @param total - Expected total amount
     */
    async assertOrderSummary(subtotal: string, tax: string, shipping: string, total: string): Promise<void> {
        await this.webAssertions.toBeVisible('.order-summary');
        await this.webAssertions.toContainText('.subtotal-value', subtotal);
        await this.webAssertions.toContainText('.tax-value', tax);
        await this.webAssertions.toContainText('.shipping-value', shipping);
        await this.webAssertions.toContainText('.total-value', total);
    }

    /**
     * Assert product details match expected values
     * @param productName - Expected product name
     * @param price - Expected product price
     * @param sku - Expected product SKU
     */
    async assertProductDetails(productName: string, price: string, sku: string): Promise<void> {
        await this.webAssertions.toHaveText('.product-name', productName);
        await this.webAssertions.toHaveText('.product-price', price);
        await this.webAssertions.toContainText('.product-sku', sku);
    }

    /**
     * Assert product table contains expected data
     * @param expectedData - 2D array of expected data
     */
    async assertProductTable(expectedData: string[][]): Promise<void> {
        await this.webAssertions.tableDataToMatch('.product-table', expectedData);
    }

    /**
     * Assert product review form validation
     */
    async assertReviewFormValidation(): Promise<void> {
        // Check for validation messages
        await this.webAssertions.toBeVisible('.review-form .error-message');
        await this.webAssertions.toContainText('.review-form .error-message', 'required');
    }

    /**
     * Assert checkout form fields are visible and required
     */
    async assertCheckoutFormFields(): Promise<void> {
        // Check all required fields are present
        const requiredFields = [
            '.checkout-form input[name="firstName"]',
            '.checkout-form input[name="lastName"]',
            '.checkout-form input[name="email"]',
            '.checkout-form input[name="address"]',
            '.checkout-form input[name="city"]',
            '.checkout-form select[name="country"]',
            '.checkout-form input[name="postalCode"]'
        ];
        
        for (const field of requiredFields) {
            await this.webAssertions.toBeVisible(field);
            await this.webAssertions.toHaveAttribute(field, 'required', 'true');
        }
    }

    /**
     * Assert that a notification/alert is displayed
     * @param type - Type of notification (success, error, info, warning)
     * @param message - Expected notification message
     */
    async assertNotification(type: 'success' | 'error' | 'info' | 'warning', message: string): Promise<void> {
        const notificationSelector = `.notification.${type}`;
        await this.webAssertions.toBeVisible(notificationSelector);
        await this.webAssertions.toContainText(notificationSelector, message);
    }

    /**
     * Assert that user menu contains expected items
     * @param expectedItems - Array of expected menu items
     */
    async assertUserMenuItems(expectedItems: string[]): Promise<void> {
        await this.webAssertions.toBeVisible('.user-menu');
        
        for (const item of expectedItems) {
            const menuItemSelector = `.user-menu-item:has-text("${item}")`;
            await this.webAssertions.toBeVisible(menuItemSelector);
        }
    }

    /**
     * Assert that filters are applied correctly
     * @param filterName - Name of the filter
     * @param filterValue - Value that was selected
     */
    async assertFilterApplied(filterName: string, filterValue: string): Promise<void> {
        const activeFilterSelector = `.active-filters .filter-item:has-text("${filterName}: ${filterValue}")`;
        await this.webAssertions.toBeVisible(activeFilterSelector);
        
        // Make sure clear filter button is present
        await this.webAssertions.toBeVisible(`${activeFilterSelector} .clear-filter`);
    }
    
    /**
     * Assert that product sorting works correctly
     * @param sortOption - Sort option that was selected
     */
    async assertSortingApplied(sortOption: string): Promise<void> {
        // Check that the sort dropdown shows the selected option
        await this.webAssertions.toHaveValue('.sort-select', sortOption);
    }

    /**
     * Assert product Add to Cart button is enabled
     * @param selector - Selector for the product element
     */
    async assertProductAddToCartButtonEnabled(selector: string): Promise<void> {
        const buttonLocator = this.page.locator(`${selector} #product-addtocart-button`);
        await expect(buttonLocator).toBeVisible();
        await expect(buttonLocator).toBeEnabled();
    }
}