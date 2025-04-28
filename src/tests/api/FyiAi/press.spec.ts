import { test, expect } from '@playwright/test';
import { PressService } from '../../../lib/scripts/api/services/PressService';
import { AuthService } from '../../../lib/scripts/api/services/AuthService';
import { APIConfig } from '../../../lib/scripts/api/config';

test.describe('Press API Tests', () => {
  let pressService: PressService;
  let authService: AuthService;

  test.beforeEach(async () => {
    pressService = new PressService();
    await pressService.init();
    
    // Init auth service for authentication tests
    authService = new AuthService();
    await authService.init();
  });

  test.afterEach(async () => {
    await pressService.dispose();
    await authService.dispose();
  });

  test('Get All Press Releases - Positive: Should get all press releases', async () => {
    const response = await pressService.getAllPressReleases();
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(Array.isArray(responseData)).toBeTruthy();
    
    // If there are press releases, verify their structure
    if (responseData.length > 0) {
      const firstRelease = responseData[0];
      expect(firstRelease).toHaveProperty('id');
      expect(firstRelease).toHaveProperty('title');
      expect(firstRelease).toHaveProperty('content');
      expect(firstRelease).toHaveProperty('date');
    }
  });

  test('Get Press Release By ID - Positive: Should get press release by ID', async () => {
    // First get all press releases to get a valid ID
    const allReleasesResponse = await pressService.getAllPressReleases();
    const allReleases = await allReleasesResponse.json();
    
    // Skip test if no press releases exist
    test.skip(!allReleases.length, 'No press releases available for testing');
    
    if (allReleases.length > 0) {
      const releaseId = allReleases[0].id;
      
      const response = await pressService.getPressReleaseById(releaseId);
      
      // Log request and response for debugging
      console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${releaseId}`);
      console.log(`Response status: ${response.status()}`);
      console.log(`Response body: ${await response.text()}`);
      
      expect(response.ok()).toBeTruthy();
      
      const pressRelease = await response.json();
      expect(pressRelease).toHaveProperty('id', releaseId);
      expect(pressRelease).toHaveProperty('title');
      expect(pressRelease).toHaveProperty('content');
      expect(pressRelease).toHaveProperty('date');
    }
  });

  test('Get Press Release By ID - Negative: Should return 404 for non-existent ID', async () => {
    const nonExistentId = 'non-existent-id-999';
    const response = await pressService.getPressReleaseById(nonExistentId);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${nonExistentId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Get Latest Press Releases - Positive: Should get latest press releases with limit', async () => {
    const limit = 3;
    const response = await pressService.getLatestPressReleases(limit);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}?limit=${limit}&sort=date:desc`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const releases = await response.json();
    expect(Array.isArray(releases)).toBeTruthy();
    
    // Verify the number of returned releases is less than or equal to the limit
    expect(releases.length).toBeLessThanOrEqual(limit);
    
    // Verify releases are sorted by date (newest first)
    if (releases.length >= 2) {
      const firstDate = new Date(releases[0].date);
      const secondDate = new Date(releases[1].date);
      expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
    }
  });

  test('Create Press Release - Positive: Should create a new press release when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to press service
    pressService.setAuthToken((authService as any).authToken);
    
    const newRelease = {
      title: 'Test Press Release',
      content: 'This is a test press release content.',
      date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      author: 'Test Author',
      tags: ['test', 'api', 'automation']
    };
    
    const response = await pressService.createPressRelease(newRelease);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}`, newRelease);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201); // Created
    
    const createdRelease = await response.json();
    expect(createdRelease).toHaveProperty('id');
    expect(createdRelease).toHaveProperty('title', newRelease.title);
    expect(createdRelease).toHaveProperty('content', newRelease.content);
    expect(createdRelease).toHaveProperty('date');
    expect(createdRelease).toHaveProperty('author', newRelease.author);
    
    // Store created press release ID for later cleanup
    return createdRelease.id;
  });

  test('Create Press Release - Negative: Should not create press release when unauthenticated', async () => {
    // Don't authenticate
    const newRelease = {
      title: 'Test Press Release',
      content: 'This is a test press release content.',
      date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
      author: 'Test Author'
    };
    
    const response = await pressService.createPressRelease(newRelease);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}`, newRelease);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
  });

  test('Update Press Release - Positive: Should update a press release when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to press service
    pressService.setAuthToken((authService as any).authToken);
    
    // First create a press release to update
    const newRelease = {
      title: 'Press Release to Update',
      content: 'Original content',
      date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
    };
    
    const createResponse = await pressService.createPressRelease(newRelease);
    const createdRelease = await createResponse.json();
    const releaseId = createdRelease.id;
    
    // Update the press release
    const updateData = {
      title: 'Updated Press Release Title',
      content: 'Updated content for this press release.'
    };
    
    const response = await pressService.updatePressRelease(releaseId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${releaseId}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const updatedRelease = await response.json();
    expect(updatedRelease).toHaveProperty('id', releaseId);
    expect(updatedRelease).toHaveProperty('title', updateData.title);
    expect(updatedRelease).toHaveProperty('content', updateData.content);
    expect(updatedRelease).toHaveProperty('date', createdRelease.date); // Date shouldn't change
  });

  test('Update Press Release - Negative: Should fail to update non-existent press release', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to press service
    pressService.setAuthToken((authService as any).authToken);
    
    const nonExistentId = 'non-existent-id-999';
    const updateData = {
      title: 'Updated Title',
      content: 'Updated content'
    };
    
    const response = await pressService.updatePressRelease(nonExistentId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${nonExistentId}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Delete Press Release - Positive: Should delete a press release when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to press service
    pressService.setAuthToken((authService as any).authToken);
    
    // First create a press release to delete
    const newRelease = {
      title: 'Press Release to Delete',
      content: 'This content will be deleted',
      date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
    };
    
    const createResponse = await pressService.createPressRelease(newRelease);
    const createdRelease = await createResponse.json();
    const releaseId = createdRelease.id;
    
    // Delete the press release
    const response = await pressService.deletePressRelease(releaseId);
    
    // Log request and response for debugging
    console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${releaseId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    // Verify deletion by trying to get the deleted press release
    const verifyResponse = await pressService.getPressReleaseById(releaseId);
    expect(verifyResponse.status()).toBe(404); // Not Found
  });

  test('Delete Press Release - Negative: Should not delete press release when unauthenticated', async () => {
    // First get all press releases to get a valid ID
    const allReleasesResponse = await pressService.getAllPressReleases();
    const allReleases = await allReleasesResponse.json();
    
    // Skip test if no press releases exist
    test.skip(!allReleases.length, 'No press releases available for testing');
    
    if (allReleases.length > 0) {
      const releaseId = allReleases[0].id;
      
      // Attempt to delete without authentication
      const response = await pressService.deletePressRelease(releaseId);
      
      // Log request and response for debugging
      console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.pressReleases}/${releaseId}`);
      console.log(`Response status: ${response.status()}`);
      console.log(`Response body: ${await response.text()}`);
      
      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401); // Unauthorized
    }
  });
});