import { APIRequestContext, APIResponse } from '@playwright/test';

/**
 * Utility class for API operations
 */
export class APIUtils {
  private baseURL: string;

  constructor(baseURL: string = 'https://petstore.swagger.io/v2') {
    this.baseURL = baseURL;
  }

  /**
   * Performs a GET request
   * @param context - API request context
   * @param endpoint - API endpoint
   * @returns API response
   */
  async get(context: APIRequestContext, endpoint: string): Promise<APIResponse> {
    console.log(`GET Request to: ${this.baseURL}/${endpoint}`);
    const response = await context.get(`${this.baseURL}/${endpoint}`);
    return response;
  }

  /**
   * Performs a GET request with path parameter
   * @param context - API request context
   * @param endpoint - API endpoint
   * @param pathParam - Path parameter
   * @returns API response
   */
  async getWithPathParam(context: APIRequestContext, endpoint: string, pathParam: string): Promise<APIResponse> {
    let url: string;
    
    if (endpoint === 'getPetById') {
      url = `${this.baseURL}/pet/${pathParam}`;
    } else {
      url = `${this.baseURL}/${endpoint}/${pathParam}`;
    }
    
    console.log(`GET Request with Path Param to: ${url}`);
    const response = await context.get(url);
    return response;
  }

  /**
   * Performs a GET request with query parameters
   * @param context - API request context
   * @param endpoint - API endpoint
   * @param queryParams - Query parameters
   * @returns API response
   */
  async getWithQueryParam(context: APIRequestContext, endpoint: string, queryParams: Record<string, string>): Promise<APIResponse> {
    const url = `${this.baseURL}/${endpoint}`;
    console.log(`GET Request with Query Params to: ${url}, params: ${JSON.stringify(queryParams)}`);
    const response = await context.get(url, { params: queryParams });
    return response;
  }

  /**
   * Performs a POST request
   * @param context - API request context
   * @param endpoint - API endpoint
   * @param payload - Request payload
   * @param options - Additional request options
   * @returns API response
   */
  async post(
    context: APIRequestContext, 
    endpoint: string, 
    options: { data?: any; headers?: Record<string, string> } = {}
  ): Promise<APIResponse> {
    let url: string;
    
    if (endpoint === 'addNewPet') {
      url = `${this.baseURL}/pet`;
    } else {
      url = `${this.baseURL}/${endpoint}`;
    }
    
    console.log(`POST Request to: ${url}`);
    
    const requestOptions: any = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    if (options.data) {
      if (typeof options.data === 'string') {
        // If data is already a string (for invalid JSON tests)
        requestOptions.data = options.data;
      } else {
        // If data is an object, stringify it
        requestOptions.data = JSON.stringify(options.data);
      }
      console.log('Request payload:', requestOptions.data);
    }
    
    const response = await context.post(url, requestOptions);
    return response;
  }

  /**
   * Parses API response to JSON
   * @param response - API response
   * @returns Parsed JSON response
   */
  async parseApiResponse(response: APIResponse): Promise<any> {
    try {
      return await response.json();
    } catch (error) {
      console.error('Error parsing API response:', error);
      return {}; // Return empty object if parsing fails
    }
  }

  /**
   * Logs warning for missing key in payload
   * @param key - Missing key
   */
  async logMissingKeyWarning(key: string): Promise<void> {
    console.warn(`Key "${key}" not found in payload!`);
  }
} 