import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { IApiClient } from './IApiClient';
import { ApiResourceHelper } from '../utils/apiUtils';
import { apiConfig } from '../../lib/config/apiConfig';

/**
 * Enhanced API client implementation using Playwright's APIRequestContext
 */
export class ApiClient implements IApiClient {
  private apiContext: APIRequestContext | null = null;
  private defaultBaseUrl: string;
  private shouldDisposeContext: boolean = false;

  /**
   * Create a new API client
   * @param apiContext - Playwright API request context or null for auto-creation
   * @param defaultBaseUrl - Default base URL for requests (optional)
   */
  constructor(apiContext?: APIRequestContext | null, defaultBaseUrl: string = apiConfig.baseUrl) {
    if (apiContext) {
      this.apiContext = apiContext;
      this.shouldDisposeContext = false;
    } else {
      // We'll initialize the context in the first request
      this.shouldDisposeContext = true;
    }
    this.defaultBaseUrl = defaultBaseUrl;
  }

  /**
   * Create a new API request context if needed
   */
  private async ensureContext(): Promise<void> {
    if (!this.apiContext) {
      this.apiContext = await request.newContext({
        // Add any default options here
        ignoreHTTPSErrors: true
      });
    }
  }

  /**
   * Dispose of the API context if it was created by this class
   */
  async dispose(): Promise<void> {
    if (this.shouldDisposeContext && this.apiContext) {
      await this.apiContext.dispose();
      this.apiContext = null;
    }
  }

  /**
   * Get the base URL for an endpoint based on endpoint characteristics
   * @param endpoint - The endpoint to analyze
   * @returns The appropriate base URL
   */
  async getBaseUrl(endpoint: string): Promise<string> {
    // Check if endpoint matches specific API patterns
    if (endpoint.includes('/pet') || endpoint.includes('/store') || endpoint.includes('/user')) {
      return apiConfig.petstoreUrl;
    }
    
    return this.defaultBaseUrl;
  }

  /**
   * Generate common request headers
   * @param isAuthRequired - Whether authentication is required
   * @returns Object with common headers
   */
  async generateHeaders(isAuthRequired: boolean): Promise<Record<string, string>> {
    const headers: Record<string, string> = { ...apiConfig.defaultHeaders };
    
    // Add authentication headers if required
    if (isAuthRequired && apiConfig.authToken) {
      headers['Authorization'] = `Bearer ${apiConfig.authToken}`;
    }
    
    return headers;
  }

  /**
   * Get request headers with optional additional headers
   * @param isAuthRequired - Whether authentication is required
   * @param additionalHeaders - Additional headers to include
   * @returns Combined headers object
   */
  async getRequestHeaders(
    isAuthRequired: boolean,
    additionalHeaders?: Record<string, string>
  ): Promise<Record<string, string>> {
    const commonHeaders = await this.generateHeaders(isAuthRequired);
    
    if (additionalHeaders) {
      return { ...commonHeaders, ...additionalHeaders };
    }
    
    return commonHeaders;
  }

  /**
   * Resolve an endpoint key to a full URL
   * @param endpoint - Endpoint key or path
   * @returns Full URL for the endpoint
   */
  async getCompleteUrl(endpoint: string): Promise<string> {
    const baseUrl = await this.getBaseUrl(endpoint);
    
    // Check if endpoint is a resource key or direct path
    let endpointPath = endpoint;
    if (!endpoint.startsWith('/') && !endpoint.startsWith('http')) {
      endpointPath = ApiResourceHelper.getEndpoint(endpoint);
    }
    
    return ApiResourceHelper.buildUrl(baseUrl, endpointPath);
  }

  /**
   * Parse API response to JSON or text
   * @param response - API response to parse
   * @returns Parsed response (JSON or text)
   */
  async parseApiResponse(response: APIResponse): Promise<any> {
    try {
      return await response.json();
    } catch (error) {
      return await response.text();
    }
  }
  
  /**
   * Perform a GET request
   * @param endpoint - The endpoint key or URL
   * @param queryParams - Optional query parameters
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async get(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const url = await this.getCompleteUrl(endpoint);
    const requestHeaders = await this.getRequestHeaders(true, headers);
    
    // Build URL with query params
    const queryString = ApiResourceHelper.objectToQueryString(queryParams);
    const fullUrl = `${url}${queryString}`;
    
    const { response } = await this.sendRequest('get', endpoint, undefined, queryParams, requestHeaders);
    return response;
  }
  
  /**
   * Perform a GET request with path parameters
   * @param endpoint - The endpoint key or URL with path parameter placeholders
   * @param pathParams - Path parameters to substitute in the URL
   * @param queryParams - Optional query parameters
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async getWithPathParam(
    endpoint: string,
    pathParams: Record<string, string>,
    queryParams?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const baseUrl = await this.getBaseUrl(endpoint);
    
    // Resolve endpoint if it's a resource key
    let endpointPath = endpoint;
    if (!endpoint.startsWith('/') && !endpoint.startsWith('http')) {
      endpointPath = ApiResourceHelper.getEndpoint(endpoint);
    }
    
    // Replace path parameters
    const urlWithPathParams = ApiResourceHelper.buildUrl(baseUrl, endpointPath, pathParams);
    
    // Add query parameters
    const queryString = ApiResourceHelper.objectToQueryString(queryParams);
    const fullUrl = `${urlWithPathParams}${queryString}`;
    
    const requestHeaders = await this.getRequestHeaders(true, headers);
    const { response } = await this.sendRequest('get', fullUrl, undefined, undefined, requestHeaders);
    
    return response;
  }
  
  /**
   * Perform a POST request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async post(
    endpoint: string,
    payload?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const { response } = await this.sendRequest('post', endpoint, payload, undefined, headers);
    // Wait for 10 seconds after POST request
    // This allows time for backend processing to complete
    console.log('Waiting 10 seconds after POST request...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    console.log('Wait completed');
    return response;
  }
  
  /**
   * Perform a PUT request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async put(
    endpoint: string,
    payload?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const { response } = await this.sendRequest('put', endpoint, payload, undefined, headers);
    return response;
  }
  
  /**
   * Perform a PATCH request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async patch(
    endpoint: string,
    payload?: any,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const { response } = await this.sendRequest('patch', endpoint, payload, undefined, headers);
    return response;
  }
  
  /**
   * Perform a DELETE request
   * @param endpoint - The endpoint key or URL
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  async delete(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<APIResponse> {
    await this.ensureContext();
    const { response } = await this.sendRequest('delete', endpoint, undefined, undefined, headers);
    return response;
  }
  
  /**
   * Send a generic request with comprehensive options
   * @param method - HTTP method
   * @param endpoint - Endpoint key or URL
   * @param payload - Optional request payload
   * @param queryParams - Optional query parameters
   * @param headers - Optional request headers
   * @returns API response and parsed body
   */
  async sendRequest(
    method: string,
    endpoint: string,
    payload?: any,
    queryParams?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<{ response: APIResponse; responseBody: any }> {
    await this.ensureContext();
    // Get complete URL
    const url = await this.getCompleteUrl(endpoint);
    
    // Get proper headers
    const isAuthRequired = true;
    const requestHeaders = await this.getRequestHeaders(isAuthRequired, headers);
    
    // Add query parameters if needed
    const queryString = ApiResourceHelper.objectToQueryString(queryParams);
    const fullUrl = `${url}${queryString}`;
    
    // Generate curl command for logging
    const curlCommand = ApiResourceHelper.generateCurlCommand(
      method,
      fullUrl,
      requestHeaders,
      payload
    );
    
    console.log(`Request: ${method.toUpperCase()} ${fullUrl}`);
    console.log(`cURL Command: ${curlCommand}`);
    
    let response: APIResponse;
    let responseBody: any;
    let responseHeaders: Record<string, string> = {};
    let responseTime: number;
    
    if (!this.apiContext) {
      throw new Error('API context is not initialized');
    }
    
    try {
      // Start timing the request
      const startTime = Date.now();
      
      switch (method.toLowerCase()) {
        case 'get':
          response = await this.apiContext.get(fullUrl, { headers: requestHeaders });
          break;
        case 'post':
          response = await this.apiContext.post(fullUrl, { 
            headers: requestHeaders, 
            data: payload 
          });
          break;
        case 'put':
          response = await this.apiContext.put(fullUrl, { 
            headers: requestHeaders, 
            data: payload 
          });
          break;
        case 'patch':
          response = await this.apiContext.patch(fullUrl, { 
            headers: requestHeaders, 
            data: payload 
          });
          break;
        case 'delete':
          response = await this.apiContext.delete(fullUrl, { 
            headers: requestHeaders 
          });
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
      
      // Calculate response time
      responseTime = Date.now() - startTime;
      
      // Get response headers
      responseHeaders = response.headers() as Record<string, string>;
      
      // Parse response body
      responseBody = await this.parseApiResponse(response);
      
      // Log response details
      console.log(`Response Status: ${response.status()}`);
      console.log(`Response Time: ${responseTime}ms`);
      console.log(`Response Body: ${typeof responseBody === 'object' ? JSON.stringify(responseBody, null, 2) : responseBody}`);
      
      // Log API call details to Allure report - using require instead of dynamic import
      try {
        // Use require instead of dynamic import to avoid ES module issues
        const apiLogger = require('../utils/apiLogger');
        
        apiLogger.logApiToAllure({
          request: {
            method: method.toUpperCase(),
            url: fullUrl,
            headers: requestHeaders,
            body: payload,
            curlCommand
          },
          response: {
            status: response.status(),
            headers: responseHeaders,
            body: responseBody,
            responseTime
          },
          stepName: `${method.toUpperCase()} ${endpoint}`
        });
      } catch (logError) {
        console.warn(`Warning: Could not log to Allure report: ${logError}`);
      }
      
      return { response, responseBody };
    } catch (error) {
      console.error(`❌ Error during API call: ${error}`);
      throw error;
    }
  }
}