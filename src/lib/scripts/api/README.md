# API Testing Framework

This folder contains the refactored API testing framework for Playwright tests. The structure has been designed to follow best practices and provide a scalable, maintainable approach to API testing.

## Directory Structure

```
api/
├── models/           # Type definitions for API data models
├── services/         # Service classes for different API domains
│   ├── BaseService.ts    # Base service class with common functionality
│   ├── AuthService.ts    # Authentication API methods
│   ├── UserService.ts    # User API methods
│   ├── ContentService.ts # Content API methods
│   ├── PressService.ts   # Press API methods
│   └── TeamService.ts    # Team API methods
├── ApiClient.ts      # Core API client with HTTP methods
├── config.ts         # API configuration
└── README.md         # This file
```

## Key Components

### ApiClient

The base class that handles HTTP requests using Playwright's API request context. It provides:

- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Authentication token management
- Request/response logging

### BaseService

Extends ApiClient and provides common functionality for all services:

- Response handling and validation
- Error handling
- Type-safe request execution

### Service Classes

Each service class extends BaseService and provides domain-specific API methods:

- `UserService`: User management (register, login, profile)
- `AuthService`: Authentication operations
- `ContentService`: Content management
- `PressService`: Press release operations
- `TeamService`: Team member management

### Models

Type definitions for API requests and responses to provide type safety and code completion.

## Utilities

Utility classes are located in the `/utils/api` directory:

- `RequestBuilder`: Flexible request construction
- `ResponseHandler`: Response validation and parsing
- `TestDataGenerator`: Generate test data for API tests
- `TestLogger`: Consistent logging for requests/responses
- `ApiFixture`: Custom test fixtures for API testing

## Usage Example

```typescript
import { apiTest } from '../utils/api/ApiFixture';
import { UserService } from '../api/services/UserService';
import { TestDataGenerator } from '../utils/api/TestDataGenerator';

apiTest.describe('User API', () => {
  let userService: UserService;

  apiTest.beforeEach(async () => {
    userService = new UserService();
    await userService.init();
  });

  apiTest.afterEach(async () => {
    await userService.dispose();
  });

  apiTest('should register a new user', async () => {
    // Generate test data
    const userData = TestDataGenerator.generateUserData();
    
    // Register user
    const user = await userService.registerUser(userData);
    
    // Validate response
    expect(user).toHaveProperty('id');
    expect(user.email).toBe(userData.email);
  });
});
```

## Benefits of the Refactored Framework

1. **Type Safety**: TypeScript interfaces for all API models
2. **Code Reuse**: Common functionality in base classes
3. **Maintainability**: Organized structure with clear separation of concerns
4. **Testability**: Easy to write both positive and negative test cases
5. **Logging**: Consistent logging for debugging and reporting
6. **Error Handling**: Centralized error handling and validation 