/**
 * Magento-specific locators - comprehensive set for Magento e-commerce platform
 */

// Regular locators with single strategy for simple usage
export const MagentoLocators = {

    // Home page elements
    home: {
        mainBanner: '.blocks-promo, .block-promo, section.hero',
        featuredProducts: '.products-grid, .widget.block-products-list',
        newProducts: '.widget.new-products',
        popularProducts: '.widget.popular-products',
        searchBar: 'input#search',
        footer: 'footer.page-footer',
        header: 'header.page-header',
        navigation: 'nav.navigation',
        welcomeMessage: '.greet.welcome',
        logo: '.logo',
        minicart: '.minicart-wrapper',
        accountMenu: '.customer-menu',
        signInLink: '.authorization-link a',
        createAccountLink: 'a[href*="customer/account/create"]',
        subscriptionInput: 'input#newsletter'
    },

    // Category page elements
    category: {
        title: 'h1.page-title',
        description: '.category-description',
        productGrid: '.products-grid',
        productList: '.products-list',
        filterOptions: '.filter-options',
        layeredNavigation: '.sidebar.sidebar-main',
        sortBy: '#sorter',
        pagination: '.pages',
        pageTitle: '.page-title-wrapper'
    },

    // Product detail page elements
    product: {
        title: '.page-title',
        price: '.price-box .price',
        regularPrice: '.price-box .regular-price .price',
        specialPrice: '.price-box .special-price .price',
        oldPrice: '.price-box .old-price .price',
        sku: '[itemprop="sku"]',
        stockStatus: '.stock.available, .stock.unavailable',
        description: '.product.attribute.description',
        shortDescription: '.product.attribute.overview',
        addToCartButton: '#product-addtocart-button',
        quantity: '#qty',
        gallery: '.gallery-placeholder',
        reviews: '.reviews-actions a',
        relatedProducts: '.block.related',
        upsellProducts: '.block.upsell',
        sizeOptions: '.swatch-attribute.size',
        colorOptions: '.swatch-attribute.color',
        configurableOptions: '.product-options-wrapper',
        customizableOptions: '.fieldset.customizable_options',
        addToWishlist: '.action.towishlist'
    },

    // Cart page elements
    cart: {
        container: '.cart-container',
        table: '#shopping-cart-table',
        items: '.cart.item',
        empty: '.cart-empty',
        summary: '.cart-summary',
        checkout: '.checkout-methods-items',
        updateCart: '.update',
        couponCode: '#coupon_code',
        applyCoupon: 'button.action.apply',
        subtotal: '.subtotal .price',
        tax: '.tax .price',
        shipping: '.shipping .price',
        grandTotal: '.grand.totals .price',
        proceedToCheckout: 'button.checkout',
        continueShopping: '.action.continue'
    },

    // Checkout page elements
    checkout: {
        container: '#checkout',
        shippingAddress: '.shipping-address-items',
        billingAddress: '.billing-address-details',
        shippingMethod: '.checkout-shipping-method',
        paymentMethod: '.checkout-payment-method',
        orderSummary: '.opc-block-summary',
        placeOrderButton: '.action.primary.checkout',
        emailField: '#customer-email',
        firstNameField: '[name="firstname"]',
        lastNameField: '[name="lastname"]',
        addressField: '[name="street[0]"]',
        cityField: '[name="city"]',
        stateField: '[name="region_id"]',
        zipField: '[name="postcode"]',
        countryField: '[name="country_id"]',
        phoneField: '[name="telephone"]'
    },

    // Account pages elements
    account: {
        dashboard: '.block-dashboard-info',
        orders: '.block-dashboard-orders',
        wishlist: '.block-dashboard-wishlist',
        addresses: '.block-dashboard-addresses',
        accountNavigation: '.block-collapsible-nav',
        welcomeText: '.block-dashboard-info .box-information .box-content',
        recentOrders: '.block-dashboard-orders .block-title',
        accountEdit: 'a[href*="customer/account/edit"]',
        changePassword: 'a[href*="customer/account/edit/changepass/1"]',
        myOrders: 'a[href*="sales/order/history"]',
        newsletters: 'a[href*="newsletter/manage"]',
        billingAgreements: 'a[href*="paypal/billing_agreement"]'
    },

    // Search results page elements
    search: {
        resultsContainer: '.search.results',
        resultsTitle: '.search.results .toolbar-amount',
        searchTerm: '.search.results .searchTerm',
        messageNoResults: '.message.notice',
        resultItems: '.products-grid .product-item',
        searchTools: '.search.found .search.tools',
        filterBy: '.toolbar-sorter.sorter'
    },

    // Common alerts & messages
    messages: {
        success: '.message.success',
        error: '.message.error',
        warning: '.message.warning',
        notice: '.message.notice',
        info: '.message.info',
        loading: '.loading-mask'
    }
};

// Self-healing locators with multiple strategies for increased reliability
export const MagentoSelfHealingLocators = {

    common: {
        navigation: {
            whatsNew: {
                selectors: [
                    'ul[role="menu"]:nth-child(1)',
                    'a[href="/"]',
                    '#ui-id-3'
                ]
            },
            women: {
                selectors: [],}
        },
        // Home page elements
        home: {
            mainBanner: {
                selectors: [
                    '.blocks-promo',
                    '.block-promo',
                    'section.hero',
                    '.home-main-slider',
                    '.main-banner',
                    '[data-testid="main-banner"]'
                ]
            },
            featuredProducts: {
                selectors: [
                    '.products-grid',
                    '.widget.block-products-list',
                    '.product-list-container',
                    'div[data-testid="featured-products"]',
                    '.catalog-product-list'
                ]
            },
            newProducts: {
                selectors: [
                    '.widget.new-products',
                    'div[data-testid="new-products"]',
                    '.new-products-container',
                    '.catalog-product-new'
                ]
            },
            popularProducts: {
                selectors: [
                    '.widget.popular-products',
                    'div[data-testid="popular-products"]',
                    '.popular-products-container',
                    '.catalog-product-popular'
                ]
            },
            searchBar: {
                selectors: [
                    'input#search',
                    'input[name="q"]',
                    'input[placeholder*="Search"]',
                    '.header-search input',
                    '[data-testid="search-bar"]'
                ]
            },
            footer: {
                selectors: [
                    'footer.page-footer',
                    'footer',
                    '.footer',
                    '[data-testid="footer"]'
                ]
            },
            header: {
                selectors: [
                    'header.page-header',
                    'header',
                    '.header',
                    '[data-testid="header"]'
                ]
            },
            navigation: {
                selectors: [
                    'nav.navigation',
                    '.navigation',
                    '.nav-sections',
                    '[data-testid="navigation"]'
                ]
            },
            welcomeMessage: {
                selectors: [
                    '.greet.welcome',
                    '.welcome-msg',
                    '[data-testid="welcome-message"]'
                ]
            },
            logo: {
                selectors: [
                    '.logo',
                    '.header-logo',
                    '[data-testid="logo"]'
                ]
            },
            minicart: {
                selectors: [
                    '.minicart-wrapper',
                    '.mini-cart',
                    '[data-testid="minicart"]',
                    '.showcart'
                ]
            }
        },

        // Category page elements
        category: {
            title: {
                selectors: [
                    'h1.page-title',
                    '.category-title',
                    '[data-testid="category-title"]'
                ]
            },
            description: {
                selectors: [
                    '.category-description',
                    '.category-content',
                    '[data-testid="category-description"]'
                ]
            },
            productGrid: {
                selectors: [
                    '.products-grid',
                    '.catalog-grid',
                    '[data-testid="product-grid"]'
                ]
            },
            filterOptions: {
                selectors: [
                    '.filter-options',
                    '.catalog-filters',
                    '[data-testid="filter-options"]'
                ]
            }
        },

        // Product detail page elements
        product: {
            title: {
                selectors: [
                    '.page-title',
                    '.product-name',
                    'h1[itemprop="name"]',
                    '[data-testid="product-title"]'
                ]
            },
            price: {
                selectors: [
                    '.price-box .price',
                    '.product-info-price .price',
                    '[data-testid="product-price"]'
                ]
            },
            addToCartButton: {
                selectors: [
                    '#product-addtocart-button',
                    'button.tocart',
                    '[data-testid="add-to-cart"]',
                    'button:has-text("Add to Cart")'
                ]
            },
            quantity: {
                selectors: [
                    '#qty',
                    'input.qty',
                    '[data-testid="qty-input"]',
                    'input[name="qty"]'
                ]
            }
        },

        // Cart page elements
        cart: {
            container: {
                selectors: [
                    '.cart-container',
                    '#shopping-cart-table',
                    '[data-testid="cart-container"]'
                ]
            },
            items: {
                selectors: [
                    '.cart.item',
                    '.cart-item',
                    '[data-testid="cart-item"]'
                ]
            },
            proceedToCheckout: {
                selectors: [
                    'button.checkout',
                    '.action.primary.checkout',
                    '[data-testid="proceed-to-checkout"]',
                    'button:has-text("Proceed to Checkout")'
                ]
            }
        },

        // Search results page elements
        search: {
            resultsContainer: {
                selectors: [
                    '.search.results',
                    '.search-results',
                    '[data-testid="search-results"]'
                ]
            },
            resultItems: {
                selectors: [
                    '.products-grid .product-item',
                    '.search-results .item',
                    '[data-testid="search-result-item"]'
                ]
            }
        },

        // Common alerts & messages
        messages: {
            success: {
                selectors: [
                    '.message.success',
                    '.success-msg',
                    '[data-testid="success-message"]'
                ]
            },
            error: {
                selectors: [
                    '.message.error',
                    '.error-msg',
                    '[data-testid="error-message"]'
                ]
            }
        }
    }
}