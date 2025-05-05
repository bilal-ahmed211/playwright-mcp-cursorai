import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/magento';

// Performance tests for Magento Home Page

test.describe('Magento Home Page - Performance Tests', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
    });

    test('should load the home page within 3 seconds', async ({ page }) => {
        const start = Date.now();
        await homePage.goto();
        const duration = Date.now() - start;
        expect(duration).toBeLessThanOrEqual(5000);
    });

    test('main banner should be visible within 2 seconds', async ({ page }) => {
        await homePage.goto();
        const start = Date.now();
        await homePage.verifyMainBannerVisible();
        const duration = Date.now() - start;
        expect(duration).toBeLessThanOrEqual(2000);
    });

    test('featured products should be visible within 2 seconds', async ({ page }) => {
        await homePage.goto();
        const start = Date.now();
        await homePage.verifyFeaturedProductsVisible();
        const duration = Date.now() - start;
        expect(duration).toBeLessThanOrEqual(2000);
    });

    test('search bar should be visible within 1 second', async ({ page }) => {
        await homePage.goto();
        const start = Date.now();
        await homePage.verifySearchBarVisible();
        const duration = Date.now() - start;
        expect(duration).toBeLessThanOrEqual(1000);
    });

    test('footer should be visible within 2 seconds', async ({ page }) => {
        await homePage.goto();
        const start = Date.now();
        await homePage.verifyFooterVisible();
        const duration = Date.now() - start;
        expect(duration).toBeLessThanOrEqual(2000);
    });

    // Add more performance tests as needed
}); 