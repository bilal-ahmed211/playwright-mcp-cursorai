/**
 * Resolver strategy for choosing the correct element when multiple elements match a locator
 */
export enum ResolverStrategy {
    FIRST = 'first',
    LAST = 'last',
    MOST_VISIBLE = 'most-visible',
    CLOSEST_TO_CENTER = 'closest-to-center',
    CLOSEST_TO_ELEMENT = 'closest-to-element',
    CONTAINS_TEXT = 'contains-text',
    MATCHES_ATTRIBUTE = 'matches-attribute',
    INDEX = 'index'
}

/**
 * Options for element resolution
 */
export interface ResolverOptions {
    /** Strategy to use when multiple elements match */
    strategy: ResolverStrategy;
    /** Additional options for the chosen strategy */
    strategyOptions?: {
        /** Index to select when using INDEX strategy */
        index?: number;
        /** Text to match when using CONTAINS_TEXT strategy */
        text?: string;
        /** Attribute name to match when using MATCHES_ATTRIBUTE strategy */
        attributeName?: string;
        /** Attribute value to match when using MATCHES_ATTRIBUTE strategy */
        attributeValue?: string | RegExp;
        /** Reference locator when using CLOSEST_TO_ELEMENT strategy */
        referenceLocator?: string;
    };
    /** Timeout in milliseconds */
    timeout?: number;
    /** Whether to throw an error if no element is found */
    throwOnNotFound?: boolean;
}

/**
 * Options for wait operations
 */
export interface WaitOptions {
    /** Timeout in milliseconds */
    timeout?: number;
    /** Whether to wait for element to be visible */
    visible?: boolean;
    /** Whether to wait for element to be enabled */
    enabled?: boolean;
}

/**
 * Options for retry logic
 */
export interface RetryOptions {
    /** Maximum number of retry attempts */
    maxRetries: number;
    /** Delay between retries in milliseconds */
    delayMs: number;
}

/**
 * Default retry options
 */
export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
    maxRetries: 2,
    delayMs: 1000,
};

/**
 * Default wait options
 */
export const DEFAULT_WAIT_OPTIONS: WaitOptions = {
    timeout: 30000,
    visible: true,
    enabled: true,
};

/**
 * Default resolver options
 */
export const DEFAULT_RESOLVER_OPTIONS: ResolverOptions = {
    strategy: ResolverStrategy.FIRST,
    timeout: 5000,
    throwOnNotFound: true
};

/**
 * Options for performance monitoring and optimization
 */
export interface PerformanceOptions {
    /** Whether to wait for load state */
    waitForLoadState?: boolean;
    /** Whether to wait for network idle */
    waitForNetworkIdle?: boolean;
}

/**
 * Types of errors that can occur during Playwright actions
 */
export enum ErrorType {
    ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
    NAVIGATION_FAILED = 'NAVIGATION_FAILED',
    INVALID_SELECTOR = 'INVALID_SELECTOR',
    SELF_HEALING_FAILED = 'SELF_HEALING_FAILED',
    TIMEOUT = 'TIMEOUT',
    ASSERTION_FAILED = 'ASSERTION_FAILED'
}

/**
 * Custom error class for Playwright actions
 */
export class PlaywrightActionError extends Error {
    constructor(
        public type: ErrorType,
        message: string,
        public selector?: string,
        public cause?: Error
    ) {
        super(message);
        this.name = 'PlaywrightActionError';
    }
} 