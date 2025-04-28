import { APIResponse, expect } from '@playwright/test';

/**
 * Utility class to handle and validate API responses
 */
export class ResponseHandler {
  /**
   * Extract JSON data from response with type checking
   */
  static async getResponseData<T>(response: APIResponse): Promise<T> {
    try {
      return await response.json() as T;
    } catch (error) {
      throw new Error(`Failed to parse response body as JSON: ${error}`);
    }
  }

  /**
   * Validate success response with status code and schema validation
   */
  static async validateSuccessResponse<T>(
    response: APIResponse, 
    expectedStatus: number = 200,
    requiredProperties: string[] = []
  ): Promise<T> {
    // Validate status code
    expect(response.status(), 
      `Expected response status to be ${expectedStatus} but got ${response.status()}`
    ).toBe(expectedStatus);
    
    // Get JSON data
    const data = await this.getResponseData<T>(response);
    
    // Validate required properties if specified
    if (requiredProperties.length > 0) {
      for (const prop of requiredProperties) {
        expect(Object.prototype.hasOwnProperty.call(data as any, prop), 
               `Response is missing required property: ${prop}`).toBeTruthy();
      }
    }
    
    return data;
  }

  /**
   * Validate error response with status code and error message validation
   */
  static async validateErrorResponse(
    response: APIResponse, 
    expectedStatus: number, 
    expectedErrorMessage?: string | RegExp
  ): Promise<any> {
    // Validate status code
    expect(response.status(), 
      `Expected error response status to be ${expectedStatus} but got ${response.status()}`
    ).toBe(expectedStatus);
    
    // Get JSON data
    const data = await this.getResponseData<any>(response);
    
    // Validate error property exists
    expect(Object.prototype.hasOwnProperty.call(data, 'error'), 
           'Error response should have error property').toBeTruthy();
    
    // Validate specific error message if provided
    if (expectedErrorMessage) {
      if (expectedErrorMessage instanceof RegExp) {
        expect(data.error, 
          `Error message should match pattern ${expectedErrorMessage}`
        ).toMatch(expectedErrorMessage);
      } else {
        expect(data.error, 
          `Error message should be "${expectedErrorMessage}" but got "${data.error}"`
        ).toContain(expectedErrorMessage);
      }
    }
    
    return data;
  }
} 