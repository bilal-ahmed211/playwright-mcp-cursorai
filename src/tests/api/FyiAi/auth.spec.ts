import { test, expect } from '@playwright/test';
import {AuthService} from '../../../lib/scripts/api/services/AuthService';
import { APIConfig } from '../../../lib/scripts/api/config';

test.describe('Auth API Tests', () => {
  let authService: AuthService;

  test.beforeEach(async () => {
    authService = new AuthService();
    await authService.init();
  });

  test.afterEach(async () => {
    await authService.dispose();
  });

  test('Register - Positive: Should register a new user successfully', async () => {
    // Generate a unique email for testing
    const uniqueEmail = `test.user.${Date.now()}@example.com`;
    const userData = {
      email: uniqueEmail,
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await authService.register(userData);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.register}`, userData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('id');
    expect(responseData).toHaveProperty('email', userData.email);
  });

  test('Register - Negative: Should fail with existing email', async () => {
    const userData = {
      email: APIConfig.testUser.email, // Using existing test user email
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await authService.register(userData);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.register}`, userData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(409); // Conflict status
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('already exists');
  });

  test('Login - Positive: Should login with valid credentials', async () => {
    const response = await authService.loginUser(
      APIConfig.testUser.email,
      APIConfig.testUser.password
    );
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      email: APIConfig.testUser.email,
      password: '[REDACTED]'
    });
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('token');
    expect(responseData).toHaveProperty('user');
    expect(responseData.user).toHaveProperty('email', APIConfig.testUser.email);
  });

  test('Login - Negative: Should fail with invalid credentials', async () => {
    const response = await authService.loginUser(
      APIConfig.testUser.email,
      'WrongPassword123!'
    );
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      email: APIConfig.testUser.email,
      password: '[REDACTED]'
    });
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Invalid credentials');
  });

  test('User Profile - Positive: Should get user profile when authenticated', async () => {
    // Login first to set auth token
    const loggedIn = await authService.loginAsTestUser();
    expect(loggedIn).toBeTruthy();
    
    const response = await authService.getCurrentUserProfile();
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('email', APIConfig.testUser.email);
    expect(responseData).toHaveProperty('firstName');
    expect(responseData).toHaveProperty('lastName');
  });

  test('User Profile - Negative: Should not get profile when unauthenticated', async () => {
    // Intentionally not logging in
    const response = await authService.getCurrentUserProfile();
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
  });

  test('Update Profile - Positive: Should update user profile when authenticated', async () => {
    // Login first to set auth token
    const loggedIn = await authService.loginAsTestUser();
    expect(loggedIn).toBeTruthy();
    
    const profileData = {
      firstName: 'Updated',
      lastName: 'TestUser',
      bio: 'This is a test bio'
    };
    
    const response = await authService.updateCurrentUserProfile(profileData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`, profileData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('firstName', profileData.firstName);
    expect(responseData).toHaveProperty('lastName', profileData.lastName);
    expect(responseData).toHaveProperty('bio', profileData.bio);
  });

  test('Change Password - Positive: Should change password when authenticated', async () => {
    // Login first to set auth token
    const loggedIn = await authService.loginAsTestUser();
    expect(loggedIn).toBeTruthy();
    
    const passwordData = {
      currentPassword: APIConfig.testUser.password,
      newPassword: 'NewPassword123!'
    };
    
    const response = await authService.changePassword(passwordData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}/password`, {
      currentPassword: '[REDACTED]',
      newPassword: '[REDACTED]'
    });
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    // Reset the password back to original for future tests
    await authService.changePassword({
      currentPassword: 'NewPassword123!',
      newPassword: APIConfig.testUser.password
    });
  });

  test('Password Reset Request - Positive: Should request password reset', async () => {
    const response = await authService.requestPasswordReset(APIConfig.testUser.email);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}/auth/password-reset-request`, {
      email: APIConfig.testUser.email
    });
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(responseData).toHaveProperty('message');
    expect(responseData.message).toContain('reset link sent');
  });
}); 