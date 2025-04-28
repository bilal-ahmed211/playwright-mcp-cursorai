import { Page, Locator, expect } from '@playwright/test';
import { WebHelpers } from './WebHelpers';
import { SelfHealingHandler } from './SelfHealingHandler';
import { SelfHealingLocators } from '../../data/web/locators/self-healing-locators';

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
  strategy: ResolverStrategy;
  strategyOptions?: {
    index?: number;
    text?: string;
    attributeName?: string;
    attributeValue?: string | RegExp;
    referenceLocator?: string | Locator | any;
  };
  timeout?: number;
  throwOnNotFound?: boolean;
}

/**
 * Default resolver options
 */
const DEFAULT_RESOLVER_OPTIONS: ResolverOptions = {
  strategy: ResolverStrategy.FIRST,
  timeout: 5000,
  throwOnNotFound: true
};

/**
 * LocatorResolver class for handling ambiguous locators
 * This class provides methods to select a specific element when multiple elements match a locator
 */
export class LocatorResolver {
  readonly page: Page;
  readonly webHelper: WebHelpers;
  readonly selfHealingHandler: SelfHealingHandler;
  
  /**
   * Create a new LocatorResolver
   * @param page Playwright page
   */
  constructor(page: Page) {
    this.page = page;
    this.webHelper = new WebHelpers(page);
    this.selfHealingHandler = new SelfHealingHandler(page);
  }
  
  /**
   * Resolve a locator that might return multiple elements
   * @param locator Traditional or self-healing locator
   * @param options Resolution options
   * @returns Resolved single locator or undefined if not found
   */
  async resolve(locator: string | Locator | any, options: Partial<ResolverOptions> = {}): Promise<Locator | undefined> {
    const resolvedOptions = { ...DEFAULT_RESOLVER_OPTIONS, ...options };
    
    // Get the base locator
    let elementLocator: Locator;
    if (typeof locator === 'string') {
      elementLocator = this.page.locator(locator);
    } else if (this.isPlaywrightLocator(locator)) {
      elementLocator = locator;
    } else if (locator.getLocator) {
      // Self-healing locator
      elementLocator = locator.getLocator(this.page);
    } else {
      throw new Error('Unsupported locator type');
    }
    
    // Check count of matching elements
    const count = await elementLocator.count();
    // if (count === 0) {
    //   if (resolvedOptions.throwOnNotFound) {
    //     throw new Error(`No elements found for the given locator`);
    //   }
    //   return undefined;
    // }
    
    if (count === 1) {
      // No ambiguity, return the single element
      return elementLocator.first();
    }
    
    // Multiple elements found, apply resolution strategy
    switch (resolvedOptions.strategy) {
      case ResolverStrategy.FIRST:
        return elementLocator.first();
        
      case ResolverStrategy.LAST:
        return elementLocator.last();
        
      case ResolverStrategy.INDEX:
        const index = resolvedOptions.strategyOptions?.index ?? 0;
        if (index >= count) {
          if (resolvedOptions.throwOnNotFound) {
            throw new Error(`Index ${index} out of bounds (count: ${count})`);
          }
          return undefined;
        }
        return elementLocator.nth(index);
        
      case ResolverStrategy.CONTAINS_TEXT:
        const text = resolvedOptions.strategyOptions?.text;
        if (!text) {
          throw new Error('Text option required for CONTAINS_TEXT strategy');
        }
        
        for (let i = 0; i < count; i++) {
          const el = elementLocator.nth(i);
          const textContent = await el.textContent();
          if (textContent && textContent.includes(text)) {
            return el;
          }
        }
        
        if (resolvedOptions.throwOnNotFound) {
          throw new Error(`No element containing text "${text}" found`);
        }
        return undefined;
        
      case ResolverStrategy.MATCHES_ATTRIBUTE:
        const attrName = resolvedOptions.strategyOptions?.attributeName;
        const attrValue = resolvedOptions.strategyOptions?.attributeValue;
        
        if (!attrName || !attrValue) {
          throw new Error('attributeName and attributeValue required for MATCHES_ATTRIBUTE strategy');
        }
        
        for (let i = 0; i < count; i++) {
          const el = elementLocator.nth(i);
          const attrActual = await el.getAttribute(attrName);
          
          if (attrActual !== null) {
            if (attrValue instanceof RegExp) {
              if (attrValue.test(attrActual)) {
                return el;
              }
            } else if (attrActual === attrValue) {
              return el;
            }
          }
        }
        
        if (resolvedOptions.throwOnNotFound) {
          throw new Error(`No element with attribute ${attrName}="${attrValue}" found`);
        }
        return undefined;
        
      case ResolverStrategy.MOST_VISIBLE:
        // Find the element with highest visibility based on viewport visibility
        let highestVisibility = 0;
        let mostVisibleIndex = 0;
        
        for (let i = 0; i < count; i++) {
          const el = elementLocator.nth(i);
          const isVisible = await el.isVisible();
          
          if (isVisible) {
            // Get element bounding box
            const bbox = await el.boundingBox();
            if (bbox) {
              // Calculate area and check if element is in viewport
              const area = bbox.width * bbox.height;
              const viewport = this.page.viewportSize();
              
              if (viewport && 
                  bbox.x >= 0 && bbox.y >= 0 && 
                  bbox.x + bbox.width <= viewport.width && 
                  bbox.y + bbox.height <= viewport.height) {
                // Element is fully in viewport
                if (area > highestVisibility) {
                  highestVisibility = area;
                  mostVisibleIndex = i;
                }
              }
            }
          }
        }
        
        return elementLocator.nth(mostVisibleIndex);
        
      case ResolverStrategy.CLOSEST_TO_CENTER:
        // Find element closest to viewport center
        let closestDistance = Number.MAX_VALUE;
        let closestIndex = 0;
        const viewport = this.page.viewportSize();
        
        if (!viewport) {
          throw new Error('Viewport size not available');
        }
        
        const centerX = viewport.width / 2;
        const centerY = viewport.height / 2;
        
        for (let i = 0; i < count; i++) {
          const el = elementLocator.nth(i);
          const bbox = await el.boundingBox();
          
          if (bbox) {
            const elementCenterX = bbox.x + (bbox.width / 2);
            const elementCenterY = bbox.y + (bbox.height / 2);
            
            // Calculate distance using Pythagorean theorem
            const distance = Math.sqrt(
              Math.pow(centerX - elementCenterX, 2) + 
              Math.pow(centerY - elementCenterY, 2)
            );
            
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = i;
            }
          }
        }
        
        return elementLocator.nth(closestIndex);
        
      case ResolverStrategy.CLOSEST_TO_ELEMENT:
        // Find element closest to reference element
        const referenceLocator = resolvedOptions.strategyOptions?.referenceLocator;
        if (!referenceLocator) {
          throw new Error('referenceLocator required for CLOSEST_TO_ELEMENT strategy');
        }
        
        let refElement: Locator;
        if (typeof referenceLocator === 'string') {
          refElement = this.page.locator(referenceLocator);
        } else if (this.isPlaywrightLocator(referenceLocator)) {
          refElement = referenceLocator;
        } else if (referenceLocator.getLocator) {
          refElement = referenceLocator.getLocator(this.page);
        } else {
          throw new Error('Unsupported reference locator type');
        }
        
        const refBbox = await refElement.boundingBox();
        if (!refBbox) {
          throw new Error('Reference element not visible or not found');
        }
        
        const refCenterX = refBbox.x + (refBbox.width / 2);
        const refCenterY = refBbox.y + (refBbox.height / 2);
        
        let minDistance = Number.MAX_VALUE;
        let nearestIndex = 0;
        
        for (let i = 0; i < count; i++) {
          const el = elementLocator.nth(i);
          const bbox = await el.boundingBox();
          
          if (bbox) {
            const elementCenterX = bbox.x + (bbox.width / 2);
            const elementCenterY = bbox.y + (bbox.height / 2);
            
            const distance = Math.sqrt(
              Math.pow(refCenterX - elementCenterX, 2) + 
              Math.pow(refCenterY - elementCenterY, 2)
            );
            
            if (distance < minDistance) {
              minDistance = distance;
              nearestIndex = i;
            }
          }
        }
        
        return elementLocator.nth(nearestIndex);
        
      default:
        throw new Error(`Unsupported resolution strategy: ${resolvedOptions.strategy}`);
    }
  }
  
  /**
   * Check if an object is a Playwright Locator
   * @param obj Object to check
   * @returns True if the object is a Playwright Locator
   */
  private isPlaywrightLocator(obj: any): boolean {
    return obj && 
           typeof obj === 'object' && 
           typeof obj.click === 'function' && 
           typeof obj.fill === 'function' && 
           typeof obj.count === 'function' &&
           typeof obj.first === 'function';
  }
  
  /**
   * Click on an element with resolution
   * @param locator Locator that might match multiple elements
   * @param options Resolution options
   */
  async click(locator: string | Locator | any, options: Partial<ResolverOptions> = {}): Promise<void> {
    const resolvedElement = await this.resolve(locator, options);
    if (resolvedElement) {
      await resolvedElement.click();
    }
  }
  
  /**
   * Fill an input after resolving the correct element
   * @param locator Locator that might match multiple elements
   * @param value Value to enter
   * @param options Resolution options
   */
  async fill(locator: string | Locator | any, value: string, options: Partial<ResolverOptions> = {}): Promise<void> {
    const resolvedElement = await this.resolve(locator, options);
    if (resolvedElement) {
      await resolvedElement.fill(value);
    }
  }
  
  /**
   * Check if resolved element is visible
   * @param locator Locator that might match multiple elements
   * @param options Resolution options
   * @returns Whether the resolved element is visible
   */
  async isVisible(locator: string | Locator | any, options: Partial<ResolverOptions> = {}): Promise<boolean> {
    options.throwOnNotFound = false;
    const resolvedElement = await this.resolve(locator, options);
    return resolvedElement ? await resolvedElement.isVisible() : false;
  }
  
  /**
   * Get text content of resolved element
   * @param locator Locator that might match multiple elements
   * @param options Resolution options
   * @returns Text content of resolved element
   */
  async getText(locator: string | Locator | any, options: Partial<ResolverOptions> = {}): Promise<string | null> {
    const resolvedElement = await this.resolve(locator, options);
    return resolvedElement ? await resolvedElement.textContent() : null;
  }
  
  /**
   * Expect resolved element to be visible
   * @param locator Locator that might match multiple elements
   * @param options Resolution options
   */
  async expectVisible(locator: string | Locator | any, options: Partial<ResolverOptions> = {}): Promise<void> {
    const resolvedElement = await this.resolve(locator, options);
    if (resolvedElement) {
      await expect(resolvedElement).toBeVisible();
    }
  }
} 