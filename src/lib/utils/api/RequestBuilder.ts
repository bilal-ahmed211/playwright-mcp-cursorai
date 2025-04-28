import { APIRequestContext, APIResponse } from '@playwright/test';
// import { APIConfig } from './config';

/**
 * Options for API requests
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean>;
  data?: any;
  timeout?: number;
  failOnStatusCode?: boolean;
}

/**
 * A builder for constructing API requests
 */
export class RequestBuilder {
  private context: APIRequestContext;
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private authToken: string | null = null;

  /**
   * Create a new RequestBuilder
   */
  constructor(
    context: APIRequestContext,
    baseUrl: string = APIConfig.baseUrl,
    defaultHeaders: Record<string, string> = APIConfig.headers
  ) {
    this.context = context;
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
  }

  /**
   * Set authentication token for requests
   */
  setAuthToken(token: string): RequestBuilder {
    this.authToken = token;
    return this;
  }

  /**
   * Clear authentication token
   */
  clearAuthToken(): RequestBuilder {
    this.authToken = null;
    return this;
  }

  /**
   * Get full URL for the endpoint
   */
  private getFullUrl(endpoint: string): string {
    // Handle case where endpoint already contains full URL
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    
    // Ensure endpoint starts with slash
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseUrl}${normalizedEndpoint}`;
  }

  /**
   * Get headers with auth token if available
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };
    
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }
    
    return headers;
  }

  /**
   * Send a GET request
   */
  async get(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    const url = this.getFullUrl(endpoint);
    const headers = this.getHeaders(options.headers);
    
    return await this.context.get(url, {
      headers,
      params: options.params,
      timeout: options.timeout || APIConfig.timeout,
      failOnStatusCode: options.failOnStatusCode
    });
  }

  /**
   * Send a POST request
   */
  async post(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    const url = this.getFullUrl(endpoint);
    const headers = this.getHeaders(options.headers);
    
    return await this.context.post(url, {
      headers,
      data: options.data,
      params: options.params,
      timeout: options.timeout || APIConfig.timeout,
      failOnStatusCode: options.failOnStatusCode
    });
  }

  /**
   * Send a PUT request
   */
  async put(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    const url = this.getFullUrl(endpoint);
    const headers = this.getHeaders(options.headers);
    
    return await this.context.put(url, {
      headers,
      data: options.data,
      params: options.params,
      timeout: options.timeout || APIConfig.timeout,
      failOnStatusCode: options.failOnStatusCode
    });
  }

  /**
   * Send a DELETE request
   */
  async delete(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    const url = this.getFullUrl(endpoint);
    const headers = this.getHeaders(options.headers);
    
    return await this.context.delete(url, {
      headers,
      data: options.data,
      params: options.params,
      timeout: options.timeout || APIConfig.timeout,
      failOnStatusCode: options.failOnStatusCode
    });
  }

  /**
   * Send a PATCH request
   */
  async patch(endpoint: string, options: RequestOptions = {}): Promise<APIResponse> {
    const url = this.getFullUrl(endpoint);
    const headers = this.getHeaders(options.headers);
    
    return await this.context.patch(url, {
      headers,
      data: options.data,
      params: options.params,
      timeout: options.timeout || APIConfig.timeout,
      failOnStatusCode: options.failOnStatusCode
    });
  }
} 