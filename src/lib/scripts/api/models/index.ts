/**
 * Common API models used across services
 */

// User related types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserRegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Content related types
export interface ContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  authorId: string;
  author?: User;
  categories: string[];
  tags: string[];
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentCreateRequest {
  title: string;
  content: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
}

export interface ContentUpdateRequest {
  title?: string;
  content?: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
}

// Press release types
export interface PressRelease {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PressReleaseCreateRequest {
  title: string;
  content: string;
  publishedAt: string;
  link?: string;
}

// Team member types
export interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMemberCreateRequest {
  name: string;
  title: string;
  bio: string;
  avatar?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  order?: number;
}

// API error response
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string>;
}

// Pagination information
export interface PaginationInfo {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Search parameters
export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
  filters?: Record<string, string>;
}

// Search result
export interface SearchResult<T> {
  results: T[];
  pagination: PaginationInfo;
  query: string;
} 