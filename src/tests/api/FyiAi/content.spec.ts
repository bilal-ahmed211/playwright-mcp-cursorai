import { test, expect } from '@playwright/test';
import { ContentService } from '../../../lib/scripts/api/services/ContentService';
import { AuthService } from '../../../lib/scripts/api/services/AuthService';
import { APIConfig } from '../../../lib/scripts/api/config';

test.describe('Content API Tests', () => {
  let contentService: ContentService;
  let authService: AuthService;

  test.beforeEach(async () => {
    contentService = new ContentService();
    await contentService.init();
    
    // Init auth service for authentication tests
    authService = new AuthService();
    await authService.init();
  });

  test.afterEach(async () => {
    await contentService.dispose();
    await authService.dispose();
  });

  test('Get All Content - Positive: Should get all content with pagination', async () => {
    const limit = 5;
    const page = 1;
    
    const response = await contentService.getAllContent(limit, page);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.content}?limit=${limit}&page=${page}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(Array.isArray(responseData.items)).toBeTruthy();
    expect(responseData).toHaveProperty('total');
    expect(responseData).toHaveProperty('page', page);
    expect(responseData).toHaveProperty('limit', limit);
    
    // Verify content item structure if items exist
    if (responseData.items.length > 0) {
      const firstItem = responseData.items[0];
      expect(firstItem).toHaveProperty('id');
      expect(firstItem).toHaveProperty('title');
      expect(firstItem).toHaveProperty('content');
      expect(firstItem).toHaveProperty('category');
    }
  });

  test('Get Content By ID - Positive: Should get content by ID', async () => {
    // First get all content to get a valid ID
    const allContentResponse = await contentService.getAllContent();
    const allContent = await allContentResponse.json();
    
    // Skip test if no content exists
    test.skip(!allContent.items?.length, 'No content available for testing');
    
    if (allContent.items?.length > 0) {
      const contentId = allContent.items[0].id;
      
      const response = await contentService.getContentById(contentId);
      
      // Log request and response for debugging
      console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(contentId)}`);
      console.log(`Response status: ${response.status()}`);
      console.log(`Response body: ${await response.text()}`);
      
      expect(response.ok()).toBeTruthy();
      
      const content = await response.json();
      expect(content).toHaveProperty('id', contentId);
      expect(content).toHaveProperty('title');
      expect(content).toHaveProperty('content');
      expect(content).toHaveProperty('category');
    }
  });

  test('Get Content By ID - Negative: Should return 404 for non-existent ID', async () => {
    const nonExistentId = 'non-existent-id-999';
    const response = await contentService.getContentById(nonExistentId);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(nonExistentId)}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Get Content By Category - Positive: Should get content filtered by category', async () => {
    // Using a common category
    const category = 'news';
    const limit = 5;
    const page = 1;
    
    const response = await contentService.getContentByCategory(category, limit, page);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.contentByCategory(category)}?limit=${limit}&page=${page}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(Array.isArray(responseData.items)).toBeTruthy();
    
    // Verify all returned items have the specified category
    if (responseData.items.length > 0) {
      for (const item of responseData.items) {
        expect(item.category).toBe(category);
      }
    }
  });

  test('Search Content - Positive: Should search content with query', async () => {
    const query = 'test';
    const limit = 5;
    const page = 1;
    
    const response = await contentService.searchContent(query, limit, page);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.search}?q=${query}&limit=${limit}&page=${page}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(Array.isArray(responseData.items)).toBeTruthy();
    expect(responseData).toHaveProperty('total');
    expect(responseData).toHaveProperty('page', page);
    expect(responseData).toHaveProperty('limit', limit);
  });

  test('Create Content - Positive: Should create content when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to content service
    contentService.setAuthToken((authService as any).authToken);
    
    const newContent = {
      title: 'Test Content',
      content: 'This is test content created via API tests.',
      category: 'test',
      tags: ['test', 'api', 'automation'],
      isPublished: true
    };
    
    const response = await contentService.createContent(newContent);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.content}`, newContent);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201); // Created
    
    const createdContent = await response.json();
    expect(createdContent).toHaveProperty('id');
    expect(createdContent).toHaveProperty('title', newContent.title);
    expect(createdContent).toHaveProperty('content', newContent.content);
    expect(createdContent).toHaveProperty('category', newContent.category);
    expect(createdContent).toHaveProperty('tags');
    expect(createdContent).toHaveProperty('isPublished', newContent.isPublished);
    
    // Store created content ID for later cleanup
    return createdContent.id;
  });

  test('Create Content - Negative: Should not create content when unauthenticated', async () => {
    // Don't authenticate
    const newContent = {
      title: 'Test Content',
      content: 'This is test content.',
      category: 'test',
      isPublished: true
    };
    
    const response = await contentService.createContent(newContent);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.content}`, newContent);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
  });

  test('Create Content - Negative: Should fail with missing required fields', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to content service
    contentService.setAuthToken((authService as any).authToken);
    
    // Missing required 'content' field
    const incompleteContent = {
      title: 'Test Content',
      category: 'test'
    } as any; // Using any to bypass TypeScript validation
    
    const response = await contentService.createContent(incompleteContent);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.content}`, incompleteContent);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(400); // Bad Request
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('content is required');
  });

  test('Update Content - Positive: Should update content when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to content service
    contentService.setAuthToken((authService as any).authToken);
    
    // First create content to update
    const newContent = {
      title: 'Content to Update',
      content: 'Original content',
      category: 'test',
      isPublished: true
    };
    
    const createResponse = await contentService.createContent(newContent);
    const createdContent = await createResponse.json();
    const contentId = createdContent.id;
    
    // Update the content
    const updateData = {
      title: 'Updated Content Title',
      content: 'This content has been updated via API tests.',
      tags: ['updated', 'api']
    };
    
    const response = await contentService.updateContent(contentId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(contentId)}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const updatedContent = await response.json();
    expect(updatedContent).toHaveProperty('id', contentId);
    expect(updatedContent).toHaveProperty('title', updateData.title);
    expect(updatedContent).toHaveProperty('content', updateData.content);
    expect(updatedContent).toHaveProperty('category', newContent.category); // Category shouldn't change
    expect(updatedContent).toHaveProperty('tags', updateData.tags);
  });

  test('Update Content - Negative: Should fail to update non-existent content', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to content service
    contentService.setAuthToken((authService as any).authToken);
    
    const nonExistentId = 'non-existent-id-999';
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content'
    };
    
    const response = await contentService.updateContent(nonExistentId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(nonExistentId)}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Delete Content - Positive: Should delete content when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to content service
    contentService.setAuthToken((authService as any).authToken);
    
    // First create content to delete
    const newContent = {
      title: 'Content to Delete',
      content: 'This content will be deleted',
      category: 'test',
      isPublished: true
    };
    
    const createResponse = await contentService.createContent(newContent);
    const createdContent = await createResponse.json();
    const contentId = createdContent.id;
    
    // Delete the content
    const response = await contentService.deleteContent(contentId);
    
    // Log request and response for debugging
    console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(contentId)}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    // Verify deletion by trying to get the deleted content
    const verifyResponse = await contentService.getContentById(contentId);
    expect(verifyResponse.status()).toBe(404); // Not Found
  });

  test('Delete Content - Negative: Should not delete content when unauthenticated', async () => {
    // First get all content to get a valid ID
    const allContentResponse = await contentService.getAllContent();
    const allContent = await allContentResponse.json();
    
    // Skip test if no content exists
    test.skip(!allContent.items?.length, 'No content available for testing');
    
    if (allContent.items?.length > 0) {
      const contentId = allContent.items[0].id;
      
      // Attempt to delete without authentication
      const response = await contentService.deleteContent(contentId);
      
      // Log request and response for debugging
      console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.contentById(contentId)}`);
      console.log(`Response status: ${response.status()}`);
      console.log(`Response body: ${await response.text()}`);
      
      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401); // Unauthorized
    }
  });
});