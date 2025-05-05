/**
 * Common locators used across the application
 */
export const Locators = {
    common: {
        navigation: {
            homeLink: 'a[href="/"]',
            helpLink: 'a[href="/help"]',
            aboutUsLink: 'a[href="/about"]',
            teamLink: 'a[href="/team"]',
            pressLink: 'a[href="/press"]',
            termsLink: 'a[href="/terms"]',
            privacyLink: 'a[href="/privacy"]',
            downloadButton: 'button[data-testid="download-button"]'
        },
        footer: {
            container: 'footer',
            copyright: '.copyright'
        }
    }
};

/**
 * Self-healing locators with multiple strategies
 */
export const SelfHealingLocators = {
    common: {
        navigation: {
            homeLink: {
                selectors: [
                    'a[href="/"]',
                    'a:has-text("Home")',
                    '[data-testid="home-link"]'
                ]
            },
            helpLink: {
                selectors: [
                    'a[href="/help"]',
                    'a:has-text("Help")',
                    '[data-testid="help-link"]'
                ]
            },
            aboutUsLink: {
                selectors: [
                    'a[href="/about"]',
                    'a:has-text("About us")',
                    '[data-testid="about-link"]'
                ]
            },
            teamLink: {
                selectors: [
                    'a[href="/team"]',
                    'a:has-text("The Team")',
                    '[data-testid="team-link"]'
                ]
            },
            pressLink: {
                selectors: [
                    'a[href="/press"]',
                    'a:has-text("Press")',
                    '[data-testid="press-link"]'
                ]
            },
            termsLink: {
                selectors: [
                    'a[href="/terms"]',
                    'a:has-text("Terms of Service")',
                    '[data-testid="terms-link"]'
                ]
            },
            privacyLink: {
                selectors: [
                    'a[href="/privacy"]',
                    'a:has-text("Privacy Policy")',
                    '[data-testid="privacy-link"]'
                ]
            },
            downloadButton: {
                selectors: [
                    'button[data-testid="download-button"]',
                    'button:has-text("Download")',
                    '.download-button'
                ]
            }
        },
        footer: {
            container: {
                selectors: [
                    'footer',
                    '[data-testid="footer"]',
                    '.footer'
                ]
            },
            copyright: {
                selectors: [
                    '.copyright',
                    '[data-testid="copyright"]',
                    'footer p:has-text("Copyright")'
                ]
            }
        }
    }
};

// Magento-specific locators
export const MagentoLocators = {
    home: {
        mainBanner: 'section.hero, .home-main .hero, .page-main .block-promo',
        featuredProducts: '.block.widget.block-products-list, .products-grid',
        searchBar: 'input#search, input[name="q"]',
        footer: 'footer'
    }
};

export const MagentoSelfHealingLocators = {
    home: {
        mainBanner: {
            selectors: [
                'section.hero',
                '.home-main .hero',
                '.page-main .block-promo',
                'div[data-testid="main-banner"]'
            ]
        },
        featuredProducts: {
            selectors: [
                '.block.widget.block-products-list',
                '.products-grid',
                'div[data-testid="featured-products"]'
            ]
        },
        searchBar: {
            selectors: [
                'input#search',
                'input[name="q"]',
                'input[placeholder*="Search"]'
            ]
        },
        footer: {
            selectors: [
                'footer',
                '[data-testid="footer"]',
                '.footer'
            ]
        }
    }
}; 