export const apiConfig = {
  baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
  petstoreUrl: process.env.PETSTORE_API_URL || 'https://petstore.swagger.io',
  authToken: process.env.AUTH_TOKEN || '',
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  interception: {
    enabled: process.env.ENABLE_API_INTERCEPTION === 'true',
    logToConsole: process.env.API_INTERCEPTION_LOG === 'true',
    captureRequestBody: process.env.API_CAPTURE_REQUEST_BODY !== 'false',
    captureResponseBody: process.env.API_CAPTURE_RESPONSE_BODY !== 'false',
  },
  timeout: 30000,
  // Add more API-specific settings as needed
};