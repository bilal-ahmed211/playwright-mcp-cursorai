import { APIResponse } from '@playwright/test';
import { ApiClient } from '../ApiClient';
import { APIConfig } from '../config';

/**
 * Service for interacting with Content API endpoints
 */
export class ContentService extends ApiClient {
  /**
   * Get all content items
   * @param limit Number of items to return (default: 10)
   * @param page Page number for pagination (default: 1)
   */
  async getAllContent(limit: number = 10, page: number = 1): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.content, {
      limit: limit.toString(),
      page: page.toString()
    });
  }
  
  /**
   * Get content by ID
   * @param id Content ID
   */
  async getContentById(id: string): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.contentById(id));
  }
  
  /**
   * Get content by category
   * @param category Content category
   * @param limit Number of items to return (default: 10)
   * @param page Page number for pagination (default: 1)
   */
  async getContentByCategory(category: string, limit: number = 10, page: number = 1): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.contentByCategory(category), {
      limit: limit.toString(),
      page: page.toString()
    });
  }
  
  /**
   * Search content
   * @param query Search query
   * @param limit Number of items to return (default: 10)
   * @param page Page number for pagination (default: 1)
   */
  async searchContent(query: string, limit: number = 10, page: number = 1): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.search, {
      q: query,
      limit: limit.toString(),
      page: page.toString()
    });
  }
  
  /**
   * Create new content (requires authentication)
   * @param contentData Content data
   */
  async createContent(contentData: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
    isPublished?: boolean;
  }): Promise<APIResponse> {
    return await this.post(APIConfig.endpoints.content, contentData);
  }
  
  /**
   * Update existing content (requires authentication)
   * @param id Content ID
   * @param contentData Updated content data
   */
  async updateContent(id: string, contentData: {
    title?: string;
    content?: string;
    category?: string;
    tags?: string[];
    isPublished?: boolean;
  }): Promise<APIResponse> {
    return await this.put(APIConfig.endpoints.contentById(id), contentData);
  }
  
  /**
   * Delete content (requires authentication)
   * @param id Content ID
   */
  async deleteContent(id: string): Promise<APIResponse> {
    return await this.delete(APIConfig.endpoints.contentById(id));
  }
} 