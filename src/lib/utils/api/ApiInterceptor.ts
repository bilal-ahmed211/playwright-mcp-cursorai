import { Page, Route, Request, Response, APIResponse } from '@playwright/test';
import { env } from '../../../../env';

/**
 * Interface for intercepted request data
 */
export interface InterceptedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData?: string | null;
  timestamp: number;
  resourceType: string;
}

/**
 * Interface for intercepted response data
 */
export interface InterceptedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: string | null;
  timestamp: number;
  duration: number;
}

/**
 * Interface for the complete API call record
 */
export interface ApiCallRecord {
  id: string;
  request: InterceptedRequest;
  response?: InterceptedResponse;
  error?: string;
}

/**
 * Configuration options for the API interceptor
 */
export interface InterceptorOptions {
  includeUrls?: string[];
  excludeUrls?: string[];
  includeResourceTypes?: string[];
  excludeResourceTypes?: string[];
  captureRequestBody?: boolean;
  captureResponseBody?: boolean;
  logToConsole?: boolean;
  maxStoredCalls?: number;
}

/**
 * Default interceptor options
 */
const DEFAULT_OPTIONS: InterceptorOptions = {
  includeUrls: [],
  excludeUrls: [],
  includeResourceTypes: ['fetch', 'xhr'],
  excludeResourceTypes: [],
  captureRequestBody: true,
  captureResponseBody: true,
  logToConsole: env.playwright.logLevel === 'debug',
  maxStoredCalls: 100
};

/**
 * ApiInterceptor class for capturing and analyzing API traffic in Playwright tests
 */
export class ApiInterceptor {
  private page: Page;
  private options: InterceptorOptions;
  private apiCalls: Map<string, ApiCallRecord> = new Map();
  private isEnabled: boolean = false;
  private interceptPromise: Promise<void> | null = null;
  
  /**
   * Creates a new ApiInterceptor instance
   * @param page Playwright page object
   * @param options Interceptor configuration options
   */
  constructor(page: Page, options: InterceptorOptions = {}) {
    this.page = page;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }
  
  /**
   * Start intercepting API calls
   */
  public async start(): Promise<void> {
    if (this.isEnabled) {
      return;
    }
    
    this.isEnabled = true;
    
    // Clear previous data
    this.apiCalls.clear();
    
    // Set up request interception
    this.interceptPromise = this.page.route('**/*', async (route: Route) => {
      const request = route.request();
      
      if (!this.shouldInterceptRequest(request)) {
        return route.continue();
      }
      
      const requestId = this.generateRequestId(request);
      const startTime = Date.now();
      
      // Capture request data
      const requestData: InterceptedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: this.options.captureRequestBody ? (await request.postData()) : null,
        timestamp: startTime,
        resourceType: request.resourceType()
      };
      
      // Store initial request data
      this.apiCalls.set(requestId, {
        id: requestId,
        request: requestData
      });
      
      // Log request if needed
      if (this.options.logToConsole) {
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
      
      try {
        // Continue with the request and capture response
        const response = await route.fetch();
        const endTime = Date.now();
        
        // Capture response data
        const responseData: InterceptedResponse = {
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          body: this.options.captureResponseBody ? await this.safelyGetResponseBody(response) : null,
          timestamp: endTime,
          duration: endTime - startTime
        };
        
        // Update stored API call with response
        const existingRecord = this.apiCalls.get(requestId);
        if (existingRecord) {
          this.apiCalls.set(requestId, {
            ...existingRecord,
            response: responseData
          });
        }
        
        // Log response if needed
        if (this.options.logToConsole) {
          console.log(`📥 API Response: ${response.status()} ${request.method()} ${request.url()}`);
        }
        
        // Fulfill the route with the response
        await route.fulfill({
          status: response.status(),
          headers: response.headers(),
          body: await response.body()
        });
      } catch (error) {
        // Handle errors
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Update stored API call with error
        const existingRecord = this.apiCalls.get(requestId);
        if (existingRecord) {
          this.apiCalls.set(requestId, {
            ...existingRecord,
            error: errorMessage
          });
        }
        
        // Log error if needed
        if (this.options.logToConsole) {
          console.error(`❌ API Error: ${request.method()} ${request.url()} - ${errorMessage}`);
        }
        
        // Continue with the original request if there was an error
        return route.continue();
      }
      
      // Clean up old records if we exceed the maximum
      this.cleanupOldRecords();
    });
  }
  
  /**
   * Stop intercepting API calls
   */
  public async stop(): Promise<void> {
    if (!this.isEnabled) {
      return;
    }
    
    this.isEnabled = false;
    
    // Unroute all routes
    await this.page.unrouteAll();
    
    // Wait for any pending interception to complete
    if (this.interceptPromise) {
      await this.interceptPromise;
      this.interceptPromise = null;
    }
  }
  
  /**
   * Get all captured API calls
   */
  public getAllCalls(): ApiCallRecord[] {
    return Array.from(this.apiCalls.values());
  }
  
  /**
   * Get API calls filtered by URL pattern
   * @param urlPattern Regex or string pattern to match URLs
   */
  public getCallsByUrl(urlPattern: string | RegExp): ApiCallRecord[] {
    const pattern = typeof urlPattern === 'string' 
      ? new RegExp(urlPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : urlPattern;
      
    return this.getAllCalls().filter(call => pattern.test(call.request.url));
  }
  
  /**
   * Get API calls filtered by method
   * @param method HTTP method (GET, POST, etc.)
   */
  public getCallsByMethod(method: string): ApiCallRecord[] {
    const upperMethod = method.toUpperCase();
    return this.getAllCalls().filter(call => call.request.method.toUpperCase() === upperMethod);
  }
  
  /**
   * Get API calls that match specific status code
   * @param status HTTP status code
   */
  public getCallsByStatus(status: number): ApiCallRecord[] {
    return this.getAllCalls().filter(
      call => call.response && call.response.status === status
    );
  }
  
  /**
   * Get API calls that had errors
   */
  public getFailedCalls(): ApiCallRecord[] {
    return this.getAllCalls().filter(call => !!call.error);
  }
  
  /**
   * Wait for a specific API call matching the URL pattern
   * @param urlPattern URL pattern to match
   * @param options Wait options
   */
  public async waitForApiCall(
    urlPattern: string | RegExp,
    options: { timeout?: number; predicate?: (call: ApiCallRecord) => boolean } = {}
  ): Promise<ApiCallRecord | null> {
    const startTime = Date.now();
    const timeout = options.timeout || env.playwright.defaultTimeout;
    const predicate = options.predicate || (() => true);
    
    // Check if we already have a matching call
    let matches = this.getCallsByUrl(urlPattern).filter(predicate);
    if (matches.length > 0) {
      return matches[0];
    }
    
    // If not, wait for it
    while (Date.now() - startTime < timeout) {
      await this.page.waitForTimeout(100);
      matches = this.getCallsByUrl(urlPattern).filter(predicate);
      if (matches.length > 0) {
        return matches[0];
      }
    }
    
    // Timeout reached
    return null;
  }
  
  /**
   * Mock a response for specific API calls
   * @param urlPattern URL pattern to match
   * @param responseData Mock response data
   */
  public async mockResponse(
    urlPattern: string | RegExp,
    responseData: {
      status?: number;
      headers?: Record<string, string>;
      body?: string | object;
    }
  ): Promise<void> {
    // Unroute any existing routes for this pattern
    await this.page.unroute(urlPattern);
    
    // Create a new route with the mock response
    await this.page.route(urlPattern, async (route) => {
      const status = responseData.status || 200;
      const headers = responseData.headers || { 'Content-Type': 'application/json' };
      const body = typeof responseData.body === 'object'
        ? JSON.stringify(responseData.body)
        : (responseData.body || '');
        
      await route.fulfill({
        status,
        headers,
        body
      });
      
      // Log mocked response if needed
      if (this.options.logToConsole) {
        const request = route.request();
        console.log(`🔄 Mocked API Response: ${status} ${request.method()} ${request.url()}`);
      }
    });
  }
  
  // Private helper methods
  
  /**
   * Determine if a request should be intercepted based on configuration
   */
  private shouldInterceptRequest(request: Request): boolean {
    const url = request.url();
    const resourceType = request.resourceType();
    
    // Check URL include/exclude patterns
    if (this.options.includeUrls && this.options.includeUrls.length > 0) {
      if (!this.options.includeUrls.some(pattern => url.includes(pattern))) {
        return false;
      }
    }
    
    if (this.options.excludeUrls && this.options.excludeUrls.length > 0) {
      if (this.options.excludeUrls.some(pattern => url.includes(pattern))) {
        return false;
      }
    }
    
    // Check resource type include/exclude
    if (this.options.includeResourceTypes && this.options.includeResourceTypes.length > 0) {
      if (!this.options.includeResourceTypes.includes(resourceType)) {
        return false;
      }
    }
    
    if (this.options.excludeResourceTypes && this.options.excludeResourceTypes.length > 0) {
      if (this.options.excludeResourceTypes.includes(resourceType)) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Generate a unique ID for a request
   */
  private generateRequestId(request: Request): string {
    return `${Date.now()}-${request.method()}-${Math.random().toString(36).substring(2, 10)}`;
  }
  
  /**
   * Safely get response body, handling different content types
   */
  private async safelyGetResponseBody(response: APIResponse): Promise<string | null> {
    try {
      const contentType = response.headers()['content-type'] || '';
      
      // Don't try to parse binary data
      if (contentType.includes('image/') || 
          contentType.includes('video/') || 
          contentType.includes('audio/') ||
          contentType.includes('application/octet-stream')) {
        return '[Binary data]';
      }
      
      return await response.text();
    } catch (error) {
      console.error('Error extracting response body:', error);
      return null;
    }
  }
  
  /**
   * Remove sensitive information from headers
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'set-cookie', 'x-api-key'];
    
    for (const header of sensitiveHeaders) {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
  
  /**
   * Clean up old records to prevent memory issues
   */
  private cleanupOldRecords(): void {
    if (!this.options.maxStoredCalls || this.apiCalls.size <= this.options.maxStoredCalls) {
      return;
    }
    
    // Remove oldest records
    const records = Array.from(this.apiCalls.entries())
      .sort((a, b) => a[1].request.timestamp - b[1].request.timestamp);
      
    const recordsToRemove = records.slice(0, records.length - this.options.maxStoredCalls);
    for (const [key] of recordsToRemove) {
      this.apiCalls.delete(key);
    }
  }
}