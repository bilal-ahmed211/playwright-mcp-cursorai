import { Page } from '@playwright/test';
import { BasePage } from './BasePage';
import { MagentoLocators, MagentoSelfHealingLocators } from '../../locators/magento-locators';

export class HomePage extends BasePage {
    // Store locators based on self-healing preference
    private locators: any;

    constructor(page: Page, useSelfHealing: boolean = false, baseUrl: string = 'https://magento.softwaretestingboard.com') {
        super(page, useSelfHealing, baseUrl);
        // Select appropriate locators based on self-healing preference
        this.locators = useSelfHealing ? MagentoSelfHealingLocators : MagentoLocators;
    }

    /**
     * Navigate to the home page
     */
    async goto() {
        await this.navigate('');
    }

    /**
     * Verify the home page has loaded correctly
     */
    async verifyHomePageLoaded() {
        await this.verifyTitle('Home Page');
        await this.webActions.verifyVisible(this.locators.common.navigation.whatsNew);
        await this.webActions.verifyVisible(this.locators.home.header);
        await this.webActions.verifyVisible(this.locators.home.logo);
    }

    /**
     * Verify the main banner is visible
     */
    async verifyMainBannerVisible() {
        await this.webActions.verifyVisible(this.locators.home.mainBanner);
    }

    /**
     * Verify featured products section is visible
     */
    async verifyFeaturedProductsVisible() {
        await this.webActions.verifyVisible(this.locators.home.featuredProducts);
    }

    /**
     * Verify navigation menu is visible
     */
    async verifyNavigationVisible() {
        await this.webActions.verifyVisible(this.locators.home.navigation);
    }

    /**
     * Verify search bar is visible
     */
    async verifySearchBarVisible() {
        await this.webActions.verifyVisible(this.locators.home.searchBar);
    }

    /**
     * Search for a product
     * @param product - Product name to search for
     */
    async searchForProduct(product: string) {
        await this.page.fill(this.locators.home.searchBar, product);
        await this.page.keyboard.press('Enter');
    }

    /**
     * Verify mini cart is visible
     */
    async verifyMiniCartVisible() {
        await this.webActions.verifyVisible(this.locators.home.minicart);
    }

    /**
     * Open mini cart
     */
    async openMiniCart() {
        await this.page.click(this.locators.home.minicart);
        // Wait for mini cart to open
        await this.page.waitForTimeout(500);
    }

    /**
     * Verify footer is visible
     */
    async verifyFooterVisible() {
        await this.webActions.verifyVisible(this.locators.home.footer);
    }

    /**
     * Navigate to sign in page
     */
    async navigateToSignIn() {
        await this.page.click(this.locators.home.signInLink);
    }

    /**
     * Navigate to create account page
     */
    async navigateToCreateAccount() {
        await this.page.click(this.locators.home.createAccountLink);
    }

    /**
     * Subscribe to newsletter
     * @param email - Email to subscribe
     */
    async subscribeToNewsletter(email: string) {
        await this.page.fill(this.locators.home.subscriptionInput, email);
        await this.page.keyboard.press('Enter');
    }

    /**
     * Verify success message is displayed
     */
    async verifySuccessMessage() {
        await this.webActions.verifyVisible(this.locators.messages.success);
    }

    /**
     * Verify error message is displayed
     */
    async verifyErrorMessage() {
        await this.webActions.verifyVisible(this.locators.messages.error);
    }
}