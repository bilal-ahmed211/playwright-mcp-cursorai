import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Interface for API client with comprehensive API testing capabilities
 */
export interface IApiClient {
  /**
   * Perform a GET request
   * @param endpoint - The endpoint key or URL
   * @param queryParams - Optional query parameters
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  get(
    endpoint: string, 
    queryParams?: Record<string, string | number | boolean>, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Perform a GET request with path parameters
   * @param endpoint - The endpoint key or URL with path parameter placeholders
   * @param pathParams - Path parameters to substitute in the URL
   * @param queryParams - Optional query parameters
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  getWithPathParam(
    endpoint: string, 
    pathParams: Record<string, string>, 
    queryParams?: Record<string, string | number | boolean>, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Perform a POST request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  post(
    endpoint: string, 
    payload?: any, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Perform a PUT request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  put(
    endpoint: string, 
    payload?: any, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Perform a PATCH request
   * @param endpoint - The endpoint key or URL
   * @param payload - Request body
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  patch(
    endpoint: string, 
    payload?: any, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Perform a DELETE request
   * @param endpoint - The endpoint key or URL
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  delete(
    endpoint: string, 
    headers?: Record<string, string>
  ): Promise<APIResponse>;
  
  /**
   * Send a generic request
   * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
   * @param endpoint - The endpoint key or URL
   * @param payload - Optional request body
   * @param queryParams - Optional query parameters
   * @param headers - Optional headers
   * @returns Promise with the API response
   */
  sendRequest(
    method: string,
    endpoint: string,
    payload?: any,
    queryParams?: Record<string, string | number | boolean>,
    headers?: Record<string, string>
  ): Promise<{response: APIResponse, responseBody: any}>;
  
  /**
   * Parse an API response to JSON or text
   * @param response - API response to parse
   * @returns Parsed response body (JSON or text)
   */
  parseApiResponse(response: APIResponse): Promise<any>;
  
  /**
   * Get the base URL for an endpoint
   * @param endpoint - The endpoint to get base URL for
   * @returns Base URL for the endpoint
   */
  getBaseUrl(endpoint: string): Promise<string>;
  
  /**
   * Get common request headers
   * @param isAuthRequired - Whether authentication is required
   * @param additionalHeaders - Additional headers to include
   * @returns Headers object
   */
  getRequestHeaders(
    isAuthRequired: boolean,
    additionalHeaders?: Record<string, string>
  ): Promise<Record<string, string>>;
}