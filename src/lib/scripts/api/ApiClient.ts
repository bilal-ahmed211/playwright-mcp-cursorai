import { APIRequestContext, APIResponse, request } from '@playwright/test';
import { APIConfig } from './config';
import { RequestBuilder } from '../../utils/api/RequestBuilder';
import { TestLogger } from '../../utils/api/TestLogger';

/**
 * Base API client for making API requests
 */
export class ApiClient {
  protected context: APIRequestContext;
  protected requestBuilder: RequestBuilder;
  protected logger: TestLogger;
  
  /**
   * Initialize the API client
   */
  constructor() {
    // The request context will be initialized in the init method
    this.context = null as unknown as APIRequestContext;
    this.requestBuilder = null as unknown as RequestBuilder;
    this.logger = TestLogger.getInstance();
  }
  
  /**
   * Initialize the API request context
   */
  async init(): Promise<void> {
    this.context = await request.newContext({
      baseURL: APIConfig.baseUrl,
      extraHTTPHeaders: APIConfig.headers,
      timeout: APIConfig.timeout
    });
    
    this.requestBuilder = new RequestBuilder(this.context);
    this.logger.success(`API client initialized with base URL: ${APIConfig.baseUrl}`);
  }
  
  /**
   * Dispose of the API request context
   */
  async dispose(): Promise<void> {
    await this.context.dispose();
    this.logger.info(`API client disposed`);
  }
  
  /**
   * Set the authentication token for authorized requests
   * @param token Auth token
   */
  setAuthToken(token: string): void {
    this.requestBuilder.setAuthToken(token);
    this.logger.info(`Auth token set`);
  }
  
  /**
   * Clear the authentication token
   */
  clearAuthToken(): void {
    this.requestBuilder.clearAuthToken();
    this.logger.info(`Auth token cleared`);
  }
  
  /**
   * Make a GET request
   * @param endpoint API endpoint
   * @param params Query parameters
   */
  async get(endpoint: string, params?: Record<string, string | number | boolean>): Promise<APIResponse> {
    this.logger.info(`GET ${endpoint}`);
    const response = await this.requestBuilder.get(endpoint, { params });
    await this.logger.logResponse(response);
    return response;
  }
  
  /**
   * Make a POST request
   * @param endpoint API endpoint
   * @param data Request body data
   */
  async post(endpoint: string, data?: any): Promise<APIResponse> {
    this.logger.info(`POST ${endpoint}`);
    this.logger.debug(`Request payload: ${JSON.stringify(data || {})}`);
    
    const response = await this.requestBuilder.post(endpoint, { data });
    await this.logger.logResponse(response);
    return response;
  }
  
  /**
   * Make a PUT request
   * @param endpoint API endpoint
   * @param data Request body data
   */
  async put(endpoint: string, data?: any): Promise<APIResponse> {
    this.logger.info(`PUT ${endpoint}`);
    this.logger.debug(`Request payload: ${JSON.stringify(data || {})}`);
    
    const response = await this.requestBuilder.put(endpoint, { data });
    await this.logger.logResponse(response);
    return response;
  }
  
  /**
   * Make a DELETE request
   * @param endpoint API endpoint
   * @param data Request body data
   */
  async delete(endpoint: string, data?: any): Promise<APIResponse> {
    this.logger.info(`DELETE ${endpoint}`);
    if (data) {
      this.logger.debug(`Request payload: ${JSON.stringify(data)}`);
    }
    
    const response = await this.requestBuilder.delete(endpoint, { data });
    await this.logger.logResponse(response);
    return response;
  }
  
  /**
   * Make a PATCH request
   * @param endpoint API endpoint
   * @param data Request body data
   */
  async patch(endpoint: string, data?: any): Promise<APIResponse> {
    this.logger.info(`PATCH ${endpoint}`);
    this.logger.debug(`Request payload: ${JSON.stringify(data || {})}`);
    
    const response = await this.requestBuilder.patch(endpoint, { data });
    await this.logger.logResponse(response);
    return response;
  }
  
  /**
   * Authenticate with the API using username and password
   * @param email User email
   * @param password User password
   */
  async login(email: string, password: string): Promise<boolean> {
    this.logger.info(`Logging in with email: ${email}`);
    
    const response = await this.post(APIConfig.endpoints.login, {
      email,
      password
    });
    
    if (response.ok()) {
      const data = await response.json();
      if (data.token) {
        this.setAuthToken(data.token);
        this.logger.success('Login successful, auth token set');
        return true;
      }
    }
    
    this.logger.failure('Login failed');
    return false;
  }
} 