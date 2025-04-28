# API Testing Utilities

This directory contains utilities for the API testing framework. These utilities are designed to be reused across different API tests and provide common functionality.

## Available Utilities

### RequestBuilder

A flexible builder pattern implementation for creating API requests with various options.

```typescript
// Example usage
const builder = new RequestBuilder(apiContext);
const response = await builder
  .setAuthToken(token)
  .get('/users', { params: { page: 1 } });
```

### ResponseHandler

Utilities for handling and validating API responses.

```typescript
// Example usage
const data = await ResponseHandler.validateSuccessResponse<User>(
  response, 
  200, 
  ['id', 'email']
);
```

### TestDataGenerator

Utilities for generating test data for API tests.

```typescript
// Example usage
const userData = TestDataGenerator.generateUserData();
const email = TestDataGenerator.generateUniqueEmail();
const password = TestDataGenerator.generateValidPassword();
```

### TestLogger

A centralized logging utility for API tests with different log levels.

```typescript
// Example usage
const logger = TestLogger.getInstance();
logger.setLogLevel(LogLevel.DEBUG);
logger.info('Starting test');
await logger.logResponse(response);
```

### ApiFixture

Custom test fixtures for API testing that provide additional capabilities to tests.

```typescript
// Example usage
import { apiTest } from '../utils/api/ApiFixture';

apiTest('should make API request', async ({ apiRequest, setAuthToken }) => {
  setAuthToken('my-token');
  const response = await apiRequest.get('/protected-resource');
  expect(response.ok()).toBeTruthy();
});
```

## Key Features

1. **Type Safety**: All utilities are strongly typed with TypeScript
2. **Reusability**: Designed to be reused across different tests
3. **Flexibility**: Configurable options for different testing scenarios
4. **Error Handling**: Robust error handling and reporting
5. **Logging**: Comprehensive logging for debugging

## Integration with API Framework

These utilities are designed to work with the API framework in the `/api` directory. Service classes in the API framework use these utilities to provide higher-level API operations.

## Best Practices

1. Always use the appropriate utility for the task
2. Leverage type safety for better code completion and error checking
3. Use the TestLogger for consistent logging across tests
4. Use the ApiFixture for tests that need additional capabilities
5. Generate test data using TestDataGenerator for consistent test data

# API Interception & MCP Server

This module provides API call interception capabilities for Playwright tests along with a Model Context Protocol (MCP) server that makes API context available to AI assistants.

## Features

- **API Interception**: Capture all API requests and responses during test execution
- **MCP Server**: Implement the Model Context Protocol to provide API context to AI assistants
- **Request/Response Mocking**: Mock API responses for more reliable testing
- **Flexible Filtering**: Filter API calls by URL, method, status code, etc.
- **Integration with AI Tools**: Provide rich context to AI assistants for test analysis

## Quick Start

### Enable MCP Server

Set the following environment variables before running your tests:

```bash
ENABLE_MCP_SERVER=true
MCP_AUTO_START=true
MCP_SERVER_PORT=3690 # Optional, defaults to 3690
```

### Use API Interception in Tests

```typescript
import { test } from '../../lib/utils/api/ApiInterceptorFixture';

test('should intercept API calls', async ({ page, apiInterception }) => {
  // Start API interception
  await apiInterception.startApiInterception();
  
  // Navigate to your page
  await page.goto('https://example.com');
  
  // Interact with the page to trigger API calls
  // ...
  
  // Get all captured API calls
  const allCalls = apiInterception.apiInterceptor.getAllCalls();
  console.log(`Total API calls: ${allCalls.length}`);
  
  // Filter calls by URL pattern
  const specificApiCalls = apiInterception.apiInterceptor.getCallsByUrl('/api/users');
  
  // Stop API interception
  await apiInterception.stopApiInterception();
});
```

### Mock API Responses

```typescript
test('should mock API responses', async ({ page, apiInterception }) => {
  await apiInterception.startApiInterception();
  
  // Mock an API response
  await apiInterception.mockApiResponse('/api/users', {
    status: 200,
    body: {
      users: [
        { id: 1, name: 'Test User' }
      ]
    }
  });
  
  // Now when the page calls /api/users, it will get our mocked response
  await page.goto('https://example.com/users');
  
  // Verify that our mock is working
  await expect(page.locator('.user-name')).toContainText('Test User');
  
  await apiInterception.stopApiInterception();
});
```

## API Reference

### ApiInterceptor

The main class for intercepting API calls:

- `start()` - Start intercepting API calls
- `stop()` - Stop intercepting API calls
- `getAllCalls()` - Get all captured API calls
- `getCallsByUrl(pattern)` - Get calls matching a URL pattern
- `getCallsByMethod(method)` - Get calls with a specific HTTP method
- `getCallsByStatus(status)` - Get calls with a specific status code
- `getFailedCalls()` - Get calls that resulted in errors
- `waitForApiCall(urlPattern, options)` - Wait for a specific API call to occur
- `mockResponse(urlPattern, responseData)` - Mock a response for matching URLs
- `getMcpData()` - Get API call data in MCP format

### McpServer

The Model Context Protocol server implementation:

- `start()` - Start the MCP server
- `stop()` - Stop the MCP server
- `registerApiInterceptor(id, interceptor)` - Register an API interceptor
- `unregisterApiInterceptor(id)` - Unregister an API interceptor
- `getUrl()` - Get the MCP server URL

### MCP Server Endpoints

The MCP server provides the following endpoints:

- `GET /health` - Health check endpoint
- `POST /context` - Get current test context including API calls
- `POST /search` - Search for specific API calls
- `GET /api-calls` - Get all API calls
- `GET /api-calls/by-url?pattern=...` - Get API calls by URL pattern
- `GET /api-calls/by-method?method=...` - Get API calls by HTTP method
- `GET /api-calls/failed` - Get failed API calls
- `POST /api-calls/mock` - Mock an API response

## Integration with AI Tools

The MCP server provides API context to AI assistants through standard MCP endpoints:

1. The AI assistant connects to the MCP server at `http://localhost:3690`
2. It requests context via the `/context` endpoint
3. The server returns API call data that the assistant can analyze
4. The assistant provides insights, debugging help, and suggestions

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_MCP_SERVER` | Enable the MCP server | `false` |
| `MCP_AUTO_START` | Auto-start the server during global setup | `false` |
| `MCP_SERVER_PORT` | Port for the MCP server | `3690` |
| `ENABLE_API_INTERCEPTION` | Enable API interception globally | `false` |
| `API_INTERCEPTION_LOG` | Log API calls to console | `false` |
| `API_CAPTURE_REQUEST_BODY` | Capture request bodies | `true` |
| `API_CAPTURE_RESPONSE_BODY` | Capture response bodies | `true` |

## Example Workflow

1. Start the MCP server (automatically via global setup)
2. Run your tests with API interception enabled
3. The tests interact with web pages, triggering API calls
4. API calls are captured by the ApiInterceptor
5. The MCP server provides this context to AI assistants
6. AI tools use this context to help with test analysis and debugging