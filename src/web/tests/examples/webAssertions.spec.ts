import { test, expect } from '@playwright/test';
import { WebAssertions, createWebAssertions } from '../../assertions';
import { MagentoAssertions } from '../../assertions/MagentoAssertions';
import { BasePage } from '../../pages/magento/BasePage';

test.describe('Magento Web Assertions Examples', () => {
  let webAssertions: WebAssertions;
  let magentoAssertions: MagentoAssertions;
  let basePage: BasePage;

  test.beforeEach(async ({ page }) => {
    // Initialize assertions and page objects
    webAssertions = createWebAssertions(page);
    magentoAssertions = new MagentoAssertions(page);
    basePage = new BasePage(page, false, 'https://magento.softwaretestingboard.com');

    // Navigate to the Magento demo store
    await basePage.navigate();
  });

  test('should verify homepage elements', async ({ page }) => {
    // Verify page title
    await webAssertions.toHaveTitle(/Home Page/);
    
    // Verify essential page elements are visible
    await webAssertions.toBeVisible('.logo');
    await webAssertions.toBeVisible('.navigation');
    await webAssertions.toBeVisible('.search-form');
    
    // Check page structure
    await webAssertions.toBeVisible('.page-header');
    await webAssertions.toBeVisible('.page-main');
    await webAssertions.toBeVisible('.page-footer');
    
    // Verify navigation links
    const navLinks = [
      'What\'s New',
      'Women',
      'Men',
      'Gear',
      'Training',
      'Sale'
    ];
    
    for (const link of navLinks) {
      await webAssertions.toBeVisible(`.navigation a:has-text("${link}")`);
    }
  });

  test('should search for a product and verify results', async ({ page }) => {
    // Search for a product
    await page.fill('#search', 'yoga');
    await page.press('#search', 'Enter');
    
    // Verify search results
    await webAssertions.toHaveTitle(/Search results for/);
    await webAssertions.toContainText('.search.results', 'yoga');
    
    // Verify product list
    await webAssertions.toBeVisible('.products-grid');
    await webAssertions.toHaveCountGreaterThan('.product-item', 0);
    
    // Use specific Magento assertions
    await magentoAssertions.assertSearchResults('yoga');
    
    // Verify a specific product exists
    await webAssertions.toContainText('.product-items', 'Yoga');
  });

  test('should verify product details page', async ({ page }) => {
    // Navigate to a product details page (using a direct URL for simplicity)
    await basePage.navigate('/breathe-easy-tank.html');
    
    // Verify product details page structure
    await webAssertions.toBeVisible('.product-info-main');
    await webAssertions.toBeVisible('.product-info-price');
    await webAssertions.toBeVisible('.product-info-stock-sku');
    await webAssertions.toBeVisible('.product.attribute.description');
    
    // Verify product name and price
    await webAssertions.toBeVisible('.page-title-wrapper .page-title');
    await webAssertions.toBeVisible('.price-box .price');
    
    // Use Magento assertions to verify product details
    await magentoAssertions.assertProductDetails(
      'Breathe-Easy Tank',
      '$34.00',
      'WT03'
    );
    
    // Verify that Add to Cart button is enabled
    await magentoAssertions.assertAddToCartButtonEnabled('.product-info-main');
    
    // Verify product image is loaded
    await magentoAssertions.assertProductImageLoaded('.product.media');
  });

  test('should verify shopping cart functionality', async ({ page }) => {
    // Navigate to a product and add it to cart
    await basePage.navigate('/radiant-tee.html');
    
    // Select product options (size and color)
    await page.click('.swatch-option.text[option-label="M"]');
    await page.click('.swatch-option.color[option-label="Blue"]');
    
    // Add to cart
    await page.click('#product-addtocart-button');
    
    // Wait for the success message
    await webAssertions.toBeVisible('.message-success');
    await webAssertions.toContainText('.message-success', 'You added Radiant Tee to your shopping cart.');
    
    // Go to shopping cart
    await page.click('.showcart');
    await page.click('a:has-text("View and Edit Cart")');
    
    // Verify cart page
    await webAssertions.toHaveTitle(/Shopping Cart/);
    await webAssertions.toBeVisible('.cart-container');
    
    // Check cart items
    await webAssertions.toBeVisible('.cart.item');
    await webAssertions.toContainText('.product-item-name', 'Radiant Tee');
    
    // Check subtotal and order total sections
    await webAssertions.toBeVisible('.cart-summary');
    await webAssertions.toBeVisible('.totals.sub');
    await webAssertions.toBeVisible('.grand.totals');
    
    // Assert cart contains the product
    await magentoAssertions.assertCartContainsProduct('Radiant Tee');
  });

  test('should verify category page and product filters', async ({ page }) => {
    // Navigate to Men's category
    await basePage.navigate('/men.html');
    
    // Verify category page
    await webAssertions.toHaveTitle(/Men/);
    await webAssertions.toBeVisible('.category-view');
    await webAssertions.toBeVisible('.products-grid');
    
    // Check filters are available
    await webAssertions.toBeVisible('.filter-options');
    
    // Check category navigation
    await magentoAssertions.assertCategoryNavigation('Tops');
    await magentoAssertions.assertCategoryNavigation('Bottoms');
    
    // Apply a filter (if available)
    const hasStyleFilter = await page.isVisible('.filter-options-title:has-text("Style")');
    
    if (hasStyleFilter) {
      await page.click('.filter-options-title:has-text("Style")');
      await page.click('.filter-options-content a:has-text("Athletic")');
      
      // Verify filter was applied
      await webAssertions.toBeVisible('.filter-current');
      await webAssertions.toContainText('.filter-current .filter-value', 'Athletic');
      
      // Assert filter using Magento assertions
      await magentoAssertions.assertFilterApplied('Style', 'Athletic');
    }
  });

  test('should verify table data in order history', async ({ page }) => {
    // This test would require a logged-in user with order history
    // Here's a simplified example of how to use table assertions
    
    // Mock example - assume we're on an order history page
    await basePage.navigate('/sales/order/history/');
    
    // For demonstration only - in real tests you'd need to log in first
    // Check if we're on the login page and skip if we can't proceed
    const isLoginPage = await page.isVisible('.login-container');
    test.skip(isLoginPage, 'Test requires user to be logged in');
    
    if (!isLoginPage) {
      // Verify order history table structure
      await webAssertions.toBeVisible('.orders-history');
      await webAssertions.tableToHaveColumnCount('.orders-history table', 4);
      
      // If there are orders, verify their data
      const hasOrders = await page.isVisible('.orders-history .data.item');
      
      if (hasOrders) {
        // Check order ID format in the first row
        await webAssertions.toContainText(
          '.orders-history .data.item:first-child .col.id', 
          "\\d+"
        );
        
        // Verify table row structure
        await webAssertions.toBeVisible('.orders-history .data.item:first-child .col.date');
        await webAssertions.toBeVisible('.orders-history .data.item:first-child .col.shipping');
        await webAssertions.toBeVisible('.orders-history .data.item:first-child .col.total');
        await webAssertions.toBeVisible('.orders-history .data.item:first-child .col.status');
        await webAssertions.toBeVisible('.orders-history .data.item:first-child .col.actions');
      }
    }
  });
});