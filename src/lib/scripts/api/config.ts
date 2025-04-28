/**
 * Configuration for API testing
 */
export const APIConfig = {
  baseUrl: 'https://fyi.ai/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Endpoints
  endpoints: {
    // Public endpoints
    press: '/press',
    pressReleases: '/press/releases',
    team: '/team/members',
    about: '/about',
    
    // Auth endpoints
    login: '/auth/login',
    register: '/auth/register',
    
    // User endpoints
    userProfile: '/user/profile',
    userSettings: '/user/settings',
    
    // Content endpoints
    content: '/content',
    contentById: (id: string) => `/content/${id}`,
    contentByCategory: (category: string) => `/content/category/${category}`,
    
    // Search endpoints
    search: '/search'
  },
  
  // Test user credentials
  testUser: {
    email: 'test.user@example.com',
    password: 'Password123!'
  }
}; 