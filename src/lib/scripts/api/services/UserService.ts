import { APIResponse } from '@playwright/test';
import { BaseService } from './BaseService';
import { APIConfig } from '../config';
import { 
  User, 
  UserRegistrationRequest, 
  UserLoginRequest, 
  UserProfileUpdateRequest,
  AuthResponse,
  PasswordChangeRequest
} from '../models';

/**
 * Service for interacting with User API endpoints
 */
export class UserService extends BaseService {
  /**
   * Register a new user
   * @param userData User registration data
   */
  async registerUser(userData: UserRegistrationRequest): Promise<User> {
    return this.executeRequest<User>(
      () => this.post(APIConfig.endpoints.register, userData),
      201,
      ['id', 'email', 'firstName', 'lastName']
    );
  }
  
  /**
   * Login user and get auth token
   * @param credentials User credentials
   */
  async loginUser(credentials: UserLoginRequest): Promise<AuthResponse> {
    const response = await this.post(APIConfig.endpoints.login, credentials);
    
    if (this.isSuccessResponse(response)) {
      const data = await this.handleSuccessResponse<AuthResponse>(response, 200, ['token', 'user']);
      // Set auth token for subsequent requests
      this.setAuthToken(data.token);
      return data;
    }
    
    throw new Error(`Login failed with status ${response.status()}`);
  }
  
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns True if login was successful
   */
  override async login(email: string, password: string): Promise<boolean> {
    try {
      const authResponse = await this.loginUser({ email, password });
      return !!authResponse.token;
    } catch (error) {
      this.logger.error(`Login failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Get current user profile (requires authentication)
   */
  async getCurrentUser(): Promise<User> {
    return this.executeRequest<User>(
      () => this.get(APIConfig.endpoints.userProfile),
      200,
      ['id', 'email', 'firstName', 'lastName']
    );
  }
  
  /**
   * Update user profile (requires authentication)
   * @param profileData Updated profile data
   */
  async updateProfile(profileData: UserProfileUpdateRequest): Promise<User> {
    return this.executeRequest<User>(
      () => this.put(APIConfig.endpoints.userProfile, profileData),
      200,
      ['id', 'email', 'firstName', 'lastName']
    );
  }
  
  /**
   * Change user password (requires authentication)
   * @param passwordData Password change data
   */
  async changePassword(
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean }> {
    const passwordData: PasswordChangeRequest = {
      currentPassword,
      newPassword
    };
    
    return this.executeRequest<{ success: boolean }>(
      () => this.post(APIConfig.endpoints.userSettings, passwordData),
      200,
      ['success']
    );
  }
  
  /**
   * Request password reset
   * @param email User email
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean }> {
    return this.executeRequest<{ success: boolean }>(
      () => this.post(APIConfig.endpoints.login, { email, action: 'reset' }),
      200,
      ['success']
    );
  }
  
  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
    return this.executeRequest<{ success: boolean }>(
      () => this.post(APIConfig.endpoints.login, {
        token,
        newPassword,
        action: 'updatePassword'
      }),
      200,
      ['success']
    );
  }
  
  /**
   * Logout user (requires authentication)
   */
  async logout(): Promise<void> {
    await this.post('/auth/logout', {});
    // Clear the auth token
    this.clearAuthToken();
  }
} 