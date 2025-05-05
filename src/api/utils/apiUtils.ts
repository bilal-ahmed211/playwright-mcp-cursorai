import * as path from 'path';
import * as fs from 'fs';
import { apiConfig } from '../../lib/config/apiConfig';

/**
 * Helper class for API resource management
 */
export class ApiResourceHelper {
  private static resourceCache: Map<string, string> = new Map();
  
  /**
   * Get endpoint URL from resources file or return the raw endpoint if not found
   * @param resourceKey - Key or path to look up
   * @param resourceFile - Optional resource file path
   * @returns Resolved endpoint URL
   */
  static getEndpoint(resourceKey: string, resourceFile: string = 'resources.json'): string {
    // Direct URL pattern detection
    if (resourceKey.startsWith('/') || resourceKey.startsWith('http')) {
      return resourceKey;
    }
    
    // Check cache first
    const cacheKey = `${resourceFile}:${resourceKey}`;
    if (this.resourceCache.has(cacheKey)) {
      return this.resourceCache.get(cacheKey)!;
    }
    
    try {
      // Look for resource file in standard locations
      const possiblePaths = [
        path.resolve(process.cwd(), 'src/api/data', resourceFile),
        path.resolve(process.cwd(), 'src/api/resources', resourceFile),
        path.resolve(process.cwd(), 'src/api', resourceFile)
      ];
      
      let resourceFilePath = '';
      for (const filePath of possiblePaths) {
        if (fs.existsSync(filePath)) {
          resourceFilePath = filePath;
          break;
        }
      }
      
      if (!resourceFilePath) {
        console.warn(`Resource file ${resourceFile} not found. Using raw key as endpoint.`);
        return resourceKey;
      }
      
      const resources = JSON.parse(fs.readFileSync(resourceFilePath, 'utf8'));
      const endpoint = resources[resourceKey] || resourceKey;
      
      // Store in cache for future lookups
      this.resourceCache.set(cacheKey, endpoint);
      return endpoint;
    } catch (error) {
      console.warn(`Error loading endpoint from resources: ${error}`);
      return resourceKey;
    }
  }
  
  /**
   * Build a full URL with path parameters replaced
   * @param baseUrl - Base URL
   * @param endpoint - Endpoint with potential path params like /users/{userId}
   * @param pathParams - Object with path parameter values
   * @returns URL with path params substituted
   */
  static buildUrl(baseUrl: string, endpoint: string, pathParams?: Record<string, string>): string {
    // Safety check: ensure endpoint is a string
    if (!endpoint || typeof endpoint !== 'string') {
      console.warn(`Invalid endpoint provided: ${endpoint}. Using empty string.`);
      endpoint = '';
    }
    
    let url = endpoint;
    
    // Replace path parameters
    if (pathParams) {
      Object.entries(pathParams).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      });
    }
    
    // Handle both absolute and relative URLs - with safety check
    if (typeof url === 'string' && url.startsWith('http')) {
      return url;
    }
    
    // Ensure proper joining of URL parts
    if (!baseUrl.endsWith('/') && !url.startsWith('/')) {
      return `${baseUrl}/${url}`;
    } else if (baseUrl.endsWith('/') && url.startsWith('/')) {
      return `${baseUrl.slice(0, -1)}${url}`;
    }
    
    return `${baseUrl}${url}`;
  }
  
  /**
   * Convert object to query string
   * @param params - Query parameters object
   * @returns Formatted query string
   */
  static objectToQueryString(params?: Record<string, string | number | boolean>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }
    
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
  }

  /**
   * Check if value is empty (null, undefined, empty string, or empty object)
   * @param value - Value to check
   * @returns True if empty, false otherwise
   */
  static isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }

  /**
   * Generate curl command from request details
   * @param method - HTTP method
   * @param url - URL to call
   * @param headers - Request headers
   * @param data - Request body data
   * @returns Curl command string
   */
  static generateCurlCommand(
    method: string,
    url: string,
    headers?: Record<string, string>,
    data?: any
  ): string {
    let curlCommand = `curl -X ${method.toUpperCase()} "${url}"`;
    
    // Add headers
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        curlCommand += ` -H "${key}: ${value}"`;
      }
    }
    
    // Add request body
    if (data) {
      curlCommand += ` -d '${JSON.stringify(data)}'`;
    }
    
    return curlCommand;
  }
}