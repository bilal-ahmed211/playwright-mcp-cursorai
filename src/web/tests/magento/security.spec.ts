import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/magento';

// Security tests for Magento Home Page

test.describe('Magento Home Page - Security Tests', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    test('should not expose sensitive information in page source', async ({ page }) => {
        const content = await page.content();
        expect(content).not.toMatch(/api[_-]?key|secret|password|token/i);
    });

    test('should use HTTPS', async ({ page }) => {
        expect(page.url().startsWith('https://')).toBeTruthy();
    });

    test('should not have inline script tags', async ({ page }) => {
        const scripts = await page.$$('script:not([src])');
        expect(scripts.length).toBe(0);
    });

    test('should have security headers', async ({ page, request }) => {
        const response = await page.goto(page.url());
        expect(response).not.toBeNull();
        if (response) {
            expect(response.headers()['content-security-policy']).toBeDefined();
            expect(response.headers()['x-frame-options']).toBeDefined();
            expect(response.headers()['x-content-type-options']).toBeDefined();
        }
    });

    test('should not have forms with autocomplete enabled for sensitive fields', async ({ page }) => {
        const forms = await page.$$('form');
        for (const form of forms) {
            const autocomplete = await form.getAttribute('autocomplete');
            if (autocomplete) {
                expect(autocomplete).not.toMatch(/on/i);
            }
        }
    });

    // Add more security tests as needed
}); 