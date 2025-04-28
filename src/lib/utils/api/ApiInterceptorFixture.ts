import { test as base, Page } from '@playwright/test';
import { ApiInterceptor, InterceptorOptions } from './ApiInterceptor';
import { env } from '../../../../env';

/**
 * Extended test fixture type with API interception capabilities
 */
export interface ApiInterceptorFixture {
  /**
   * API interceptor instance
   */
  apiInterceptor: ApiInterceptor;
  
  /**
   * Start intercepting API calls
   * @param options Configuration options for the interceptor
   */
  startApiInterception(options?: InterceptorOptions): Promise<void>;
  
  /**
   * Stop intercepting API calls
   */
  stopApiInterception(): Promise<void>;
  
  /**
   * Wait for a specific API call to occur
   * @param urlPattern Pattern to match the API URL
   * @param options Additional wait options
   */
  waitForApiCall(urlPattern: string | RegExp, options?: any): Promise<any>;
  
  /**
   * Mock a response for a specific API call
   * @param urlPattern Pattern to match the API URL
   * @param responseData Mock response data
   */
  mockApiResponse(urlPattern: string | RegExp, responseData: any): Promise<void>;
}

/**
 * Generate a unique test ID for tracking API interceptors
 */
function generateTestId(testInfo: any): string {
  return `${testInfo.project.name}-${testInfo.file}-${testInfo.title}-${Date.now()}`;
}

/**
 * Extended test fixture with API interception capabilities
 */
export const test = base.extend<{ apiInterception: ApiInterceptorFixture }>({
  apiInterception: async ({ page }, use, testInfo) => {
    // Create the API interceptor
    const interceptor = new ApiInterceptor(page);
    const testId = generateTestId(testInfo);
    
    // Create the fixture
    const fixture: ApiInterceptorFixture = {
      apiInterceptor: interceptor,
      
      startApiInterception: async (options?: InterceptorOptions) => {
        await interceptor.start();
      },
      
      stopApiInterception: async () => {
        await interceptor.stop();
      },
      
      waitForApiCall: async (urlPattern, options) => {
        return await interceptor.waitForApiCall(urlPattern, options);
      },
      
      mockApiResponse: async (urlPattern, responseData) => {
        await interceptor.mockResponse(urlPattern, responseData);
      }
    };
    
    // Make the fixture available to the test
    await use(fixture);
    
    // Clean up
    await interceptor.stop();
  }
});