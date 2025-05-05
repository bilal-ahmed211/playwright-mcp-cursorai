import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/magento';

// Functional tests for Magento Home Page

test.describe('Magento Home Page - Functional Tests', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    test('should load the home page', async () => {
        await homePage.verifyHomePageLoaded();
    });

    test('should display the main banner', async () => {
        await homePage.verifyMainBannerVisible();
    });

    test('should display featured products', async () => {
        await homePage.verifyFeaturedProductsVisible();
    });

    test('should display the search bar', async () => {
        await homePage.verifySearchBarVisible();
    });

    test('should allow searching for a product', async () => {
        await homePage.searchForProduct('shirt');
        // Optionally verify search results page loaded
        await expect(homePage.page).toHaveURL(/q=shirt/);
    });

    test('should display the footer', async () => {
        await homePage.verifyFooterVisible();
    });

    // Add more functional tests as needed (e.g., navigation links, promo blocks)
}); 