import { test, expect } from '@playwright/test';
import { TeamService } from '../../../lib/scripts/api/services/TeamService';
import { AuthService } from '../../../lib/scripts/api/services/AuthService';
import { APIConfig } from '../../../lib/scripts/api/config';

test.describe('Team API Tests', () => {
  let teamService: TeamService;
  let authService: AuthService;
  
  test.beforeEach(async () => {
    teamService = new TeamService();
    await teamService.init();
    
    // Init auth service for authentication tests
    authService = new AuthService();
    await authService.init();
  });

  test.afterEach(async () => {
    await teamService.dispose();
    await authService.dispose();
  });

  test('Get All Team Members - Positive: Should get all team members', async () => {
    const response = await teamService.getAllTeamMembers();
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.team}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const responseData = await response.json();
    expect(Array.isArray(responseData)).toBeTruthy();
    expect(responseData.length).toBeGreaterThan(0);
    
    // Verify team member structure
    const firstMember = responseData[0];
    expect(firstMember).toHaveProperty('id');
    expect(firstMember).toHaveProperty('name');
    expect(firstMember).toHaveProperty('role');
  });

  test('Get Team Member By ID - Positive: Should get team member by ID', async () => {
    // First get all team members to get a valid ID
    const allMembersResponse = await teamService.getAllTeamMembers();
    const allMembers = await allMembersResponse.json();
    
    // Get the first member ID
    const memberId = allMembers[0].id;
    
    const response = await teamService.getTeamMemberById(memberId);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${memberId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const member = await response.json();
    expect(member).toHaveProperty('id', memberId);
    expect(member).toHaveProperty('name');
    expect(member).toHaveProperty('role');
  });

  test('Get Team Member By ID - Negative: Should return 404 for non-existent ID', async () => {
    const nonExistentId = 'non-existent-id-999';
    const response = await teamService.getTeamMemberById(nonExistentId);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${nonExistentId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Get Team Members By Role - Positive: Should get team members filtered by role', async () => {
    // Using a common role like 'Developer' or 'Engineer'
    const role = 'Engineer';
    const response = await teamService.getTeamMembersByRole(role);
    
    // Log request and response for debugging
    console.log(`Request: GET ${APIConfig.baseUrl}${APIConfig.endpoints.team}?role=${role}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const members = await response.json();
    expect(Array.isArray(members)).toBeTruthy();
    
    // If there are any members with this role, verify they all have the specified role
    if (members.length > 0) {
      for (const member of members) {
        expect(member.role).toContain(role);
      }
    }
  });

  test('Create Team Member - Positive: Should create a new team member when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to team service
    teamService.setAuthToken((authService as any).authToken);
    
    const newMember = {
      name: 'Test Team Member',
      role: 'QA Engineer',
      bio: 'This is a test team member',
      imageUrl: 'https://example.com/test-image.jpg',
      socialLinks: {
        linkedin: 'https://linkedin.com/in/testuser',
        twitter: 'https://twitter.com/testuser'
      }
    };
    
    const response = await teamService.createTeamMember(newMember);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.team}`, newMember);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201); // Created
    
    const createdMember = await response.json();
    expect(createdMember).toHaveProperty('id');
    expect(createdMember).toHaveProperty('name', newMember.name);
    expect(createdMember).toHaveProperty('role', newMember.role);
    expect(createdMember).toHaveProperty('bio', newMember.bio);
    
    // Store created member ID for cleanup in later tests
    return createdMember.id;
  });

  test('Create Team Member - Negative: Should not create team member when unauthenticated', async () => {
    // Don't authenticate
    const newMember = {
      name: 'Test Team Member',
      role: 'QA Engineer',
      bio: 'This is a test team member'
    };
    
    const response = await teamService.createTeamMember(newMember);
    
    // Log request and response for debugging
    console.log(`Request: POST ${APIConfig.baseUrl}${APIConfig.endpoints.team}`, newMember);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
  });

  test('Update Team Member - Positive: Should update a team member when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to team service
    teamService.setAuthToken((authService as any).authToken);
    
    // First create a team member
    const newMember = {
      name: 'Member To Update',
      role: 'Developer',
      bio: 'Original bio'
    };
    
    const createResponse = await teamService.createTeamMember(newMember);
    const createdMember = await createResponse.json();
    const memberId = createdMember.id;
    
    // Update the member
    const updateData = {
      role: 'Senior Developer',
      bio: 'Updated bio'
    };
    
    const response = await teamService.updateTeamMember(memberId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${memberId}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    const updatedMember = await response.json();
    expect(updatedMember).toHaveProperty('id', memberId);
    expect(updatedMember).toHaveProperty('name', newMember.name); // Name shouldn't change
    expect(updatedMember).toHaveProperty('role', updateData.role); // Role should be updated
    expect(updatedMember).toHaveProperty('bio', updateData.bio); // Bio should be updated
  });

  test('Update Team Member - Negative: Should fail to update non-existent team member', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to team service
    teamService.setAuthToken((authService as any).authToken);
    
    const nonExistentId = 'non-existent-id-999';
    const updateData = {
      role: 'Updated Role',
      bio: 'Updated bio'
    };
    
    const response = await teamService.updateTeamMember(nonExistentId, updateData);
    
    // Log request and response for debugging
    console.log(`Request: PUT ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${nonExistentId}`, updateData);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(404); // Not Found
  });

  test('Delete Team Member - Positive: Should delete a team member when authenticated', async () => {
    // Login as test user
    await authService.loginAsTestUser();
    
    // Copy auth token to team service
    teamService.setAuthToken((authService as any).authToken);
    
    // First create a team member to delete
    const newMember = {
      name: 'Member To Delete',
      role: 'Temporary Role',
      bio: 'Temporary bio'
    };
    
    const createResponse = await teamService.createTeamMember(newMember);
    const createdMember = await createResponse.json();
    const memberId = createdMember.id;
    
    // Delete the member
    const response = await teamService.deleteTeamMember(memberId);
    
    // Log request and response for debugging
    console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${memberId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeTruthy();
    
    // Verify deletion by trying to get the deleted member
    const verifyResponse = await teamService.getTeamMemberById(memberId);
    expect(verifyResponse.status()).toBe(404); // Not Found
  });

  test('Delete Team Member - Negative: Should not delete when unauthenticated', async () => {
    // First get all team members to get a valid ID
    const allMembersResponse = await teamService.getAllTeamMembers();
    const allMembers = await allMembersResponse.json();
    
    // Get the first member ID
    const memberId = allMembers[0].id;
    
    // Attempt to delete without authentication
    const response = await teamService.deleteTeamMember(memberId);
    
    // Log request and response for debugging
    console.log(`Request: DELETE ${APIConfig.baseUrl}${APIConfig.endpoints.team}/${memberId}`);
    console.log(`Response status: ${response.status()}`);
    console.log(`Response body: ${await response.text()}`);
    
    expect(response.ok()).toBeFalsy();
    expect(response.status()).toBe(401); // Unauthorized
  });
});