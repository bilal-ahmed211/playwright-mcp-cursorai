import { test as base, APIRequestContext, request } from '@playwright/test';
import { APIConfig } from '../../scripts/api/config';
import { RequestBuilder } from './RequestBuilder';
import { TestLogger, LogLevel } from './TestLogger';

/**
 * Track API call information
 */
export interface ApiCallInfo {
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestData?: any;
  statusCode?: number;
  responseHeaders?: Record<string, string>;
  responseBody?: any;
  timestamp: Date;
}

/**
 * API test fixtures
 */
export interface ApiFixtures {
  apiContext: APIRequestContext;
  apiRequest: RequestBuilder;
  apiConfig: typeof APIConfig;
  apiCalls: ApiCallInfo[];
  logApiCall: (call: ApiCallInfo) => void;
  setAuthToken: (token: string) => void;
}

/**
 * Extended test object with API testing capabilities
 */
export const apiTest = base.extend<ApiFixtures>({
  // Create API request context
  apiContext: async ({}, use) => {
    const context = await request.newContext({
      baseURL: APIConfig.baseUrl,
      extraHTTPHeaders: APIConfig.headers,
      timeout: APIConfig.timeout
    });
    
    await use(context);
    
    await context.dispose();
  },
  
  // Create request builder
  apiRequest: async ({ apiContext }, use) => {
    const builder = new RequestBuilder(apiContext);
    await use(builder);
  },
  
  // Provide API configuration
  apiConfig: async ({}, use) => {
    await use(APIConfig);
  },
  
  // Track API calls
  apiCalls: async ({}, use) => {
    const calls: ApiCallInfo[] = [];
    await use(calls);
  },
  
  // Function to log API calls
  logApiCall: async ({ apiCalls }, use) => {
    const logger = TestLogger.getInstance();
    logger.setLogLevel(LogLevel.DEBUG);
    
    const logCall = (call: ApiCallInfo) => {
      apiCalls.push(call);
      logger.info(`${call.method} ${call.url} - ${call.statusCode}`);
      logger.debug(`Request: ${JSON.stringify(call.requestData || {})}`);
      logger.debug(`Response: ${JSON.stringify(call.responseBody || {})}`);
    };
    
    await use(logCall);
  },
  
  // Set auth token for all requests
  setAuthToken: async ({ apiRequest }, use) => {
    const setToken = (token: string) => {
      apiRequest.setAuthToken(token);
    };
    
    await use(setToken);
  }
}); 