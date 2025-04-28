import { APIResponse } from '@playwright/test';
import { ApiClient } from '../ApiClient';
import { APIConfig } from '../config';

/**
 * Service for interacting with Press API endpoints
 */
export class PressService extends ApiClient {
  /**
   * Get all press releases
   */
  async getAllPressReleases(): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.pressReleases);
  }
  
  /**
   * Get a specific press release by ID
   * @param id Press release ID
   */
  async getPressReleaseById(id: string): Promise<APIResponse> {
    return await this.get(`${APIConfig.endpoints.pressReleases}/${id}`);
  }
  
  /**
   * Get latest press releases
   * @param limit Number of press releases to return (default: 5)
   */
  async getLatestPressReleases(limit: number = 5): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.pressReleases, {
      limit: limit.toString(),
      sort: 'date:desc'
    });
  }
  
  /**
   * Create a new press release (requires authentication)
   * @param pressData Press release data
   */
  async createPressRelease(pressData: {
    title: string;
    content: string;
    date: string;
    author?: string;
    tags?: string[];
  }): Promise<APIResponse> {
    return await this.post(APIConfig.endpoints.pressReleases, pressData);
  }
  
  /**
   * Update an existing press release (requires authentication)
   * @param id Press release ID
   * @param pressData Updated press release data
   */
  async updatePressRelease(id: string, pressData: {
    title?: string;
    content?: string;
    date?: string;
    author?: string;
    tags?: string[];
  }): Promise<APIResponse> {
    return await this.put(`${APIConfig.endpoints.pressReleases}/${id}`, pressData);
  }
  
  /**
   * Delete a press release (requires authentication)
   * @param id Press release ID
   */
  async deletePressRelease(id: string): Promise<APIResponse> {
    return await this.delete(`${APIConfig.endpoints.pressReleases}/${id}`);
  }
} 