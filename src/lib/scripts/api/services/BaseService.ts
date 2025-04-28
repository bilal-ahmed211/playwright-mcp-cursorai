import { APIResponse } from '@playwright/test';
import { ApiClient } from '../ApiClient';
import {ResponseHandler} from '../../../utils/api/ResponseHandler';

/**
 * Base service class that all API services extend
 */
export abstract class BaseService extends ApiClient {
  /**
   * Handle successful API response with validation
   * @param response API response
   * @param expectedStatus Expected HTTP status code
   * @param requiredProperties Properties that should exist in response
   */
  protected async handleSuccessResponse<T>(
    response: APIResponse, 
    expectedStatus: number = 200,
    requiredProperties: string[] = []
  ): Promise<T> {
    try {
      const data = await ResponseHandler.validateSuccessResponse<T>(
        response, 
        expectedStatus, 
        requiredProperties
      );
      this.logger.success(`Response validated successfully (Status: ${response.status()})`);
      return data;
    } catch (error) {
      this.logger.failure(`Response validation failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Handle error API response with validation
   * @param response API response
   * @param expectedStatus Expected HTTP status code
   * @param expectedErrorMessage Expected error message
   */
  protected async handleErrorResponse(
    response: APIResponse,
    expectedStatus: number,
    expectedErrorMessage?: string | RegExp
  ): Promise<any> {
    try {
      const data = await ResponseHandler.validateErrorResponse(
        response,
        expectedStatus,
        expectedErrorMessage
      );
      this.logger.success(`Error response validated successfully (Status: ${response.status()})`);
      return data;
    } catch (error) {
      this.logger.failure(`Error response validation failed: ${error}`);
      throw error;
    }
  }
  
  /**
   * Check if response is successful
   * @param response API response
   * @param successStatusCodes Array of status codes considered successful
   */
  protected isSuccessResponse(
    response: APIResponse, 
    successStatusCodes: number[] = [200, 201, 202, 204]
  ): boolean {
    const isSuccess = successStatusCodes.includes(response.status());
    if (isSuccess) {
      this.logger.success(`Response status ${response.status()} is considered successful`);
    } else {
      this.logger.failure(`Response status ${response.status()} is not considered successful`);
    }
    return isSuccess;
  }
  
  /**
   * Execute API request with validation
   * @param requestFn Function that executes the API request
   * @param expectedStatus Expected HTTP status code
   * @param requiredProperties Properties that should exist in response
   */
  protected async executeRequest<T>(
    requestFn: () => Promise<APIResponse>,
    expectedStatus: number = 200,
    requiredProperties: string[] = []
  ): Promise<T> {
    try {
      const response = await requestFn();
      const result = await this.handleSuccessResponse<T>(response, expectedStatus, requiredProperties);
      return result;
    } catch (error) {
      this.logger.error(`API request failed: ${error}`);
      throw error;
    }
  }
} 