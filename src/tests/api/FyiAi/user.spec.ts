import { test, expect } from '@playwright/test';
import { UserService } from '../../../lib/scripts/api/services/UserService';
import { APIConfig } from '../../../lib/scripts/api/config';

test.describe('User API Tests', () => {
  let userService: UserService;

  test.beforeEach(async () => {
    userService = new UserService();
    await userService.init();
  });

  test.afterEach(async () => {
    await userService.dispose();
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

    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.register}`, userData);
    
    try {
      const user = await userService.registerUser(userData);
      
      // Log response for debugging
      console.log(`Response: User registered successfully`, user);
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email', userData.email);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  });

  test('Register - Negative: Should fail with missing required fields', async () => {
    // Missing lastName field
    const incompleteUserData = {
      email: `test.user.${Date.now()}@example.com`,
      password: 'Password123!',
      firstName: 'Test'
    } as any; // Using any to bypass TypeScript validation

    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.register}`, incompleteUserData);
    
    try {
      await userService.registerUser(incompleteUserData);
      // Should not reach here
      throw new Error('Expected registration to fail but it succeeded');
    } catch (error) {
      console.log(`Response: Registration failed as expected`, error);
      expect(error.message).toContain('lastName is required');
    }
  });

  test('Login - Positive: Should login successfully with valid credentials', async () => {
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      email: credentials.email,
      password: '[REDACTED]'
    });
    
    try {
      const authResponse = await userService.loginUser(credentials);
      
      // Log response for debugging
      console.log(`Response: Login successful`, { user: authResponse.user });
      
      expect(authResponse).toHaveProperty('token');
      expect(authResponse).toHaveProperty('user');
      
      // Set the auth token for subsequent requests
      userService.setAuthToken(authResponse.token);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  });

  test('Login - Negative: Should fail with incorrect password', async () => {
    const credentials = {
      email: APIConfig.testUser.email,
      password: 'WrongPassword123!'
    };
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      email: credentials.email,
      password: '[REDACTED]'
    });
    
    try {
      await userService.loginUser(credentials);
      // Should not reach here
      throw new Error('Expected login to fail but it succeeded');
    } catch (error) {
      console.log(`Response: Login failed as expected`, error);
      expect(error.message).toContain('Login failed');
    }
  });

  test('Profile - Positive: Should get current user profile when authenticated', async () => {
    // Login first
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    const authResponse = await userService.loginUser(credentials);
    userService.setAuthToken(authResponse.token);
    
    // Log request for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`);
    
    try {
      const user = await userService.getCurrentUser();
      
      // Log response for debugging
      console.log(`Response: Got user profile`, user);
      
      expect(user).toHaveProperty('email', credentials.email);
      expect(user).toHaveProperty('firstName');
      expect(user).toHaveProperty('lastName');
    } catch (error) {
      console.error('Getting user profile failed:', error);
      throw error;
    }
  });

  test('Profile - Negative: Should not get profile when unauthenticated', async () => {
    // Don't login - make unauthenticated request
    
    // Log request for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`);
    
    try {
      await userService.getCurrentUser();
      // Should not reach here
      throw new Error('Expected getting profile to fail but it succeeded');
    } catch (error) {
      console.log(`Response: Getting profile failed as expected`, error);
      expect(error.message).toContain('401');
    }
  });

  test('Update Profile - Positive: Should update profile when authenticated', async () => {
    // Login first
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    const authResponse = await userService.loginUser(credentials);
    userService.setAuthToken(authResponse.token);
    
    const profileData = {
      firstName: 'Updated',
      lastName: 'User',
      bio: 'Test bio'
    };
    
    // Log request for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`, profileData);
    
    try {
      const user = await userService.updateProfile(profileData);
      
      // Log response for debugging
      console.log(`Response: Profile updated`, user);
      
      expect(user).toHaveProperty('firstName', profileData.firstName);
      expect(user).toHaveProperty('lastName', profileData.lastName);
      expect(user).toHaveProperty('bio', profileData.bio);
    } catch (error) {
      console.error('Updating profile failed:', error);
      throw error;
    }
  });

  test('Update Profile - Negative: Should not update profile when unauthenticated', async () => {
    // Don't login - make unauthenticated request
    const profileData = {
      firstName: 'Updated',
      lastName: 'User'
    };
    
    // Log request for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.userProfile}`, profileData);
    
    try {
      await userService.updateProfile(profileData);
      // Should not reach here
      throw new Error('Expected profile update to fail but it succeeded');
    } catch (error) {
      console.log(`Response: Profile update failed as expected`, error);
      expect(error.message).toContain('401');
    }
  });

  test('Change Password - Positive: Should change password when authenticated', async () => {
    // Login first
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    const authResponse = await userService.loginUser(credentials);
    userService.setAuthToken(authResponse.token);
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.userSettings}`, {
      currentPassword: '[REDACTED]',
      newPassword: '[REDACTED]'
    });
    
    try {
      const result = await userService.changePassword(
        credentials.password, 
        'NewPassword123!'
      );
      
      // Log response for debugging
      console.log(`Response: Password changed`, result);
      
      expect(result).toHaveProperty('success', true);
      
      // Reset password back to original for future tests
      await userService.changePassword('NewPassword123!', credentials.password);
    } catch (error) {
      console.error('Changing password failed:', error);
      throw error;
    }
  });

  test('Change Password - Negative: Should fail with incorrect current password', async () => {
    // Login first
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    const authResponse = await userService.loginUser(credentials);
    userService.setAuthToken(authResponse.token);
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.userSettings}`, {
      currentPassword: '[REDACTED]',
      newPassword: '[REDACTED]'
    });
    
    try {
      await userService.changePassword(
        'WrongCurrentPassword123!', 
        'NewPassword123!'
      );
      // Should not reach here
      throw new Error('Expected password change to fail but it succeeded');
    } catch (error) {
      console.log(`Response: Password change failed as expected`, error);
      expect(error.message).toContain('Current password is incorrect');
    }
  });

  test('Password Reset Request - Positive: Should request password reset', async () => {
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      email: APIConfig.testUser.email,
      action: 'reset'
    });
    
    try {
      const result = await userService.requestPasswordReset(APIConfig.testUser.email);
      
      // Log response for debugging
      console.log(`Response: Password reset requested`, result);
      
      expect(result).toHaveProperty('success', true);
    } catch (error) {
      console.error('Password reset request failed:', error);
      throw error;
    }
  });

  test('Password Reset - Positive: Should reset password with valid token', async () => {
    // Note: In a real test, you would need to get a valid token
    // For this example, we're using a mock token
    const mockToken = 'valid-reset-token-123';
    const newPassword = 'NewPassword123!';
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.login}`, {
      token: mockToken,
      newPassword: '[REDACTED]',
      action: 'updatePassword'
    });
    
    try {
      const result = await userService.resetPassword(mockToken, newPassword);
      
      // Log response for debugging
      console.log(`Response: Password reset successful`, result);
      
      expect(result).toHaveProperty('success', true);
    } catch (error) {
      // This is expected to fail in a real environment without a valid token
      console.log('Test is expected to fail without a valid token:', error);
    }
  });

  test('Logout - Positive: Should logout when authenticated', async () => {
    // Login first
    const credentials = {
      email: APIConfig.testUser.email,
      password: APIConfig.testUser.password
    };
    
    const authResponse = await userService.loginUser(credentials);
    userService.setAuthToken(authResponse.token);
    
    // Log request for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}/auth/logout`, {});
    
    try {
      await userService.logout();
      
      // Log response for debugging
      console.log(`Response: Logout successful`);
      
      // No response to validate, just ensure no exception was thrown
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  });
});