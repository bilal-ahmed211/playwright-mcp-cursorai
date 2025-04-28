// Ensure the correct path to the fixtures file
import { test as baseTest, APIRequestContext } from '@playwright/test';
import { APIResponse, APIRequest } from '@playwright/test';

// Store API request/response information
export interface ApiCallInfo {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload?: any;
  response?: APIResponse;
  statusCode?: number;
  responseBody?: any;
}

// Define the type for our API tracker fixture
type ApiTestFixtures = {
  apiCallTracker: {
    trackApiCall: (
      method: string,
      url: string,
      headers: Record<string, string>,
      payload?: any,
      response?: APIResponse
    ) => Promise<ApiCallInfo>;
    get: (url: string, headers?: Record<string, string>) => Promise<APIResponse>;
    post: (url: string, data: any, headers?: Record<string, string>) => Promise<APIResponse>;
    put: (url: string, data: any, headers?: Record<string, string>) => Promise<APIResponse>;
    delete: (url: string, headers?: Record<string, string>) => Promise<APIResponse>;
    getCalls: () => ApiCallInfo[];
  };
};

// Extended test for API tests with tracking capabilities
export const apiTest = baseTest.extend<ApiTestFixtures>({
  // Track API calls for reporting/debugging
  apiCallTracker: async ({ request: apiContext }, use, testInfo) => {
    const apiCalls: ApiCallInfo[] = [];
    
    const tracker = {
      // Log API request/response details
      trackApiCall: async (
        method: string,
        url: string, 
        headers: Record<string, string>,
        payload?: any,
        response?: APIResponse
      ) => {
        const callInfo: ApiCallInfo = {
          url,
          method,
          headers,
          payload
        };
        
        if (response) {
          callInfo.response = response;
          callInfo.statusCode = response.status();
          try {
            // Try to parse response as JSON if possible
            callInfo.responseBody = await response.json();
          } catch {
            // If not JSON, get text
            callInfo.responseBody = await response.text();
          }
        }
        
        apiCalls.push(callInfo);
        
        // Attach to test report for failed tests
        if (testInfo.status !== 'passed' && response) {
          await testInfo.attach('api-call', {
            body: JSON.stringify({
              request: {
                url,
                method,
                headers,
                payload
              },
              response: {
                status: response.status(),
                statusText: response.statusText(),
                headers: response.headers(),
                body: callInfo.responseBody
              }
            }, null, 2),
            contentType: 'application/json'
          });
        }
        
        return callInfo;
      },
      
      // Helper for GET requests with tracking
      get: async (url: string, headers: Record<string, string> = {}) => {
        const response = await apiContext.get(url, { headers });
        await tracker.trackApiCall('GET', url, headers, undefined, response);
        return response;
      },
      
      // Helper for POST requests with tracking
      post: async (url: string, data: any, headers: Record<string, string> = {}) => {
        const response = await apiContext.post(url, { data, headers });
        await tracker.trackApiCall('POST', url, headers, data, response);
        return response;
      },
      
      // Helper for PUT requests with tracking
      put: async (url: string, data: any, headers: Record<string, string> = {}) => {
        const response = await apiContext.put(url, { data, headers });
        await tracker.trackApiCall('PUT', url, headers, data, response);
        return response;
      },
      
      // Helper for DELETE requests with tracking
      delete: async (url: string, headers: Record<string, string> = {}) => {
        const response = await apiContext.delete(url, { headers });
        await tracker.trackApiCall('DELETE', url, headers, undefined, response);
        return response;
      },
      
      // Access all tracked API calls
      getCalls: () => apiCalls
    };
    
    await use(tracker);
  }
}); 