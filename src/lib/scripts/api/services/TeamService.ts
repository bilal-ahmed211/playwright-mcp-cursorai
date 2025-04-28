import { APIResponse } from '@playwright/test';
import { ApiClient } from '../ApiClient';
import { APIConfig } from '../config';

/**
 * Service for interacting with Team API endpoints
 */
export class TeamService extends ApiClient {
  /**
   * Get all team members
   */
  async getAllTeamMembers(): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.team);
  }
  
  /**
   * Get a specific team member by ID
   * @param id Team member ID
   */
  async getTeamMemberById(id: string): Promise<APIResponse> {
    return await this.get(`${APIConfig.endpoints.team}/${id}`);
  }
  
  /**
   * Get team members by role
   * @param role Role to filter by
   */
  async getTeamMembersByRole(role: string): Promise<APIResponse> {
    return await this.get(APIConfig.endpoints.team, {
      role
    });
  }
  
  /**
   * Create a new team member (requires authentication)
   * @param teamMemberData Team member data
   */
  async createTeamMember(teamMemberData: {
    name: string;
    role: string;
    bio: string;
    imageUrl?: string;
    socialLinks?: Record<string, string>;
  }): Promise<APIResponse> {
    return await this.post(APIConfig.endpoints.team, teamMemberData);
  }
  
  /**
   * Update an existing team member (requires authentication)
   * @param id Team member ID
   * @param teamMemberData Updated team member data
   */
  async updateTeamMember(id: string, teamMemberData: {
    name?: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    socialLinks?: Record<string, string>;
  }): Promise<APIResponse> {
    return await this.put(`${APIConfig.endpoints.team}/${id}`, teamMemberData);
  }
  
  /**
   * Delete a team member (requires authentication)
   * @param id Team member ID
   */
  async deleteTeamMember(id: string): Promise<APIResponse> {
    return await this.delete(`${APIConfig.endpoints.team}/${id}`);
  }
} 