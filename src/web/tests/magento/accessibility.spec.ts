import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/magento';

// Accessibility tests for Magento Home Page

test.describe('Magento Home Page - Accessibility Tests', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    test('should have no images without alt text', async ({ page }) => {
        const images = await page.$$('img');
        for (const img of images) {
            const alt = await img.getAttribute('alt');
            expect(alt).not.toBeNull();
            expect(alt?.trim()).not.toBe('');
        }
    });

    test('should have a search bar with accessible label', async ({ page }) => {
        const searchInput = await page.$('input#search, input[name="q"]');
        expect(searchInput).not.toBeNull();
        const ariaLabel = await searchInput?.getAttribute('aria-label');
        const label = await page.$(`label[for="search"]`);
        expect(ariaLabel || label).not.toBeNull();
    });

    test('should have a main landmark', async ({ page }) => {
        const main = await page.$('main, [role="main"]');
        expect(main).not.toBeNull();
    });

    test('should allow tab navigation to main elements', async ({ page }) => {
        // Try to tab to search bar
        await page.keyboard.press('Tab');
        let active = await page.evaluate(() => document.activeElement?.id);
        let found = false;
        for (let i = 0; i < 10; i++) {
            if (active === 'search') {
                found = true;
                break;
            }
            await page.keyboard.press('Tab');
            active = await page.evaluate(() => document.activeElement?.id);
        }
        expect(found).toBeTruthy();
    });

    test('should have no obvious accessibility violations in headings', async ({ page }) => {
        const h1s = await page.$$('h1');
        expect(h1s.length).toBeGreaterThan(0);
        for (const h1 of h1s) {
            const text = await h1.textContent();
            expect(text?.trim()).not.toBe('');
        }
    });

    // Add more accessibility tests as needed
}); 