const { test, expect } = require('@playwright/test');

test.describe('FYI.ai Website Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('https://www.fyi.ai/index.html');
  });

  test('Should verify homepage elements are visible', async ({ page }) => {
    // Check main heading is visible
    await expect(page.locator('h1', { hasText: 'FYI is the ultimate productivity tool for creatives' })).toBeVisible();
    
    // Check download button is visible
    await expect(page.getByRole('link', { name: 'download' })).toBeVisible();
    
    // Check copyright info in the footer
    await expect(page.locator('footer p', { hasText: '©2024 FYI.FYI, Inc.' })).toBeVisible();
  });

  test('Should open and close hamburger menu', async ({ page }) => {
    // Click on hamburger menu to open it
    await page.locator('.u-button-style').first().click();
    
    // Verify menu is visible
    await expect(page.locator('header ul[role="listbox"]')).toBeVisible();
    
    // Verify all navigation links are present
    const navItems = ['Home', 'Help', 'About us', 'The Team', 'Press', 'Terms of Service', 'Privacy Policy'];
    for (const item of navItems) {
      await expect(page.getByRole('link', { name: item, exact: true })).toBeVisible();
    }
    
    // Close the menu by clicking the X
    await page.getByText('✕').click();
    
    // Verify menu is closed (not visible)
    await expect(page.locator('header ul[role="listbox"]')).not.toBeVisible();
  });

  test('Should navigate to About Us page and verify content', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Click on About us link
    await page.getByRole('link', { name: 'About us' }).click();
    
    // Verify we are on the right page
    await expect(page).toHaveURL(/.*aboutus/);
    
    // Check for main heading
    await expect(page.locator('h1', { hasText: 'About Us' })).toBeVisible();
    
    // Verify some of the content
    await expect(page.getByText('The FYI app is the first productivity tool')).toBeVisible();
    await expect(page.getByText('FYI is a communication platform')).toBeVisible();
  });

  test('Should navigate to Team page and verify content', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Click on Team link
    await page.getByRole('link', { name: 'The Team' }).click();
    
    // Verify we are on the right page
    await expect(page).toHaveURL(/.*team/);
    
    // Check for main heading
    await expect(page.locator('h1', { hasText: 'The Team' })).toBeVisible();
    
    // Verify team members are displayed
    await expect(page.getByText('will.i.am')).toBeVisible();
    await expect(page.getByText('Founder and CEO')).toBeVisible();
    await expect(page.getByText('Sunil Reddy')).toBeVisible();
    await expect(page.getByText('Co-Founder and CTO')).toBeVisible();
  });

  test('Should navigate to Terms of Service page and verify content', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Click on Terms link
    await page.getByRole('link', { name: 'Terms of Service' }).click();
    
    // Verify we are on the right page
    await expect(page).toHaveURL(/.*terms.html/);
    
    // Check for main heading
    await expect(page.locator('h1', { hasText: 'Terms of Service' })).toBeVisible();
    
    // Verify some of the terms content
    await expect(page.getByText('WELCOME TO FYI! PLEASE READ THIS TERMS')).toBeVisible();
    await expect(page.getByText('How Our Services Work')).toBeVisible();
  });

  test('Should verify Privacy Policy page content', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Click on Privacy Policy link
    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    
    // Verify we are on the right page
    await expect(page).toHaveURL(/.*Privacy-Policy.html/);
    
    // Check for main heading
    await expect(page.locator('h1')).toBeVisible();
  });

  test('Should verify external Help link', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Get Help link URL
    const helpLinkHref = await page.getByRole('link', { name: 'Help' }).getAttribute('href');
    
    // Verify it points to the expected external URL
    expect(helpLinkHref).toBe('https://help.fyi.me/');
  });

  test('Should verify download app link', async ({ page }) => {
    // Get download link URL
    const downloadLinkHref = await page.getByRole('link', { name: 'download' }).getAttribute('href');
    
    // Verify it points to the expected URL
    expect(downloadLinkHref).toBe('https://fyi.me/app');
  });

  // Negative test cases
  test('Should handle non-existent page gracefully', async ({ page }) => {
    // Try to navigate to a non-existent page
    await page.goto('https://www.fyi.ai/nonexistent-page.html');
    
    // Check if there's an error message or redirect
    // This will depend on how the site handles 404s
    // Could be checking for a specific 404 page element or URL
  });

  test('Should verify footer navigation links match header links', async ({ page }) => {
    // Open the menu
    await page.locator('.u-button-style').first().click();
    
    // Get all header navigation links
    const headerLinks = await page.locator('header ul[role="listbox"] a').allTextContents();
    
    // Get all footer navigation links
    const footerLinks = await page.locator('footer ul a').allTextContents();
    
    // Compare links (might need some filtering/processing)
    // There is a small discrepancy with "Terms of Service" vs "Terms of Services"
    expect(headerLinks.length).toBe(footerLinks.length);
    
    // Check if the Home link exists in both header and footer
    expect(headerLinks).toContain('Home');
    expect(footerLinks).toContain('Home');
  });

  test('Should handle browser resize responsively', async ({ page }) => {
    // Test on mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Verify hamburger menu is still accessible
    await expect(page.locator('.u-button-style').first()).toBeVisible();
    
    // Test on tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Verify that key elements are still visible
    await expect(page.locator('h1', { hasText: 'FYI is the ultimate' })).toBeVisible();
    
    // Return to desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
  });

  test('Should check accessibility of hamburger menu with keyboard navigation', async ({ page }) => {
    // Try to navigate to hamburger menu with keyboard
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // May need additional tabs depending on DOM structure
    
    // Press Enter to open menu
    await page.keyboard.press('Enter');
    
    // Verify menu is visible
    await expect(page.locator('header ul[role="listbox"]')).toBeVisible();
  });
});