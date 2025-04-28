import { APIResponse } from '@playwright/test';
import { ApiClient } from '../ApiClient';
import { APIConfig } from '../config';

/**
 * Service for interacting with Auth API endpoints
 */
export class AuthService extends ApiClient {
  /**
   * Register a new user
   * @param userData User registration data
   */
  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<APIResponse> {
    return await this.post(APIConfig.endpoints.register, userData);
  }
  
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   */
  async loginUser(email: string, password: string): Promise<APIResponse> {
    return await this.post(APIConfig.endpoints.login, {
      email,
      password
    });
  }
  
  /**
   * Log in as test user and set auth token
   */
  async loginAsTestUser(): Promise<boolean> {
    const response = await this.loginUser(
      APIConfig.testUser.email, 
      APIConfig.testUser.password
    );
    
    if (response.ok()) {
      const data = await response.json();
      if (data.token) {
        this.setAuthToken(data.token);
        return true;
      }
    }
    return false;
  }
  
  /**
   * Get current user profile (requires authentication)
   */
  async getCurrentUserProfile(): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.userProfile);
  }
  
  /**
   * Update current user profile (requires authentication)
   * @param profileData Updated profile data
   */
  async updateCurrentUserProfile(profileData: {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<APIResponse> {
    return await this.put(APIConfig.endpoints.userProfile, profileData);
  }
  
  /**
   * Change user password (requires authentication)
   * @param passwordData Password change data
   */
  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<APIResponse> {
    return await this.put(`${APIConfig.endpoints.userProfile}/password`, passwordData);
  }
  
  /**
   * Request password reset for a user
   * @param email User email
   */
  async requestPasswordReset(email: string): Promise<APIResponse> {
    return await this.post('/auth/password-reset-request', {
      email
    });
  }
} 