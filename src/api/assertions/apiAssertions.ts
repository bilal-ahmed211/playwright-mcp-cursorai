import { expect } from '@playwright/test';

// Base assertion functions
export function assertStatus(response: { status: number }, expectedStatus: number | number[]) {
  if (Array.isArray(expectedStatus)) {
    expect(expectedStatus).toContain(response.status);
  } else {
    expect(response.status).toBe(expectedStatus);
  }
}

export function assertHeader(response: { headers: Record<string, string> }, header: string, expectedValue?: string | RegExp) {
  const value = response.headers[header.toLowerCase()];
  expect(value, `Header '${header}' should be present`).toBeDefined();
  if (expectedValue !== undefined) {
    if (expectedValue instanceof RegExp) {
      expect(value).toMatch(expectedValue);
    } else {
      expect(value).toBe(expectedValue);
    }
  }
}

export function assertBody<T = any>(body: T, expected: Partial<T>) {
  for (const key in expected) {
    expect((body as any)[key], `Body property '${key}'`).toEqual((expected as any)[key]);
  }
}

export function assertErrorResponse(response: { status: number; body: any }, expectedStatus: number, expectedErrorMessage?: string | RegExp) {
  expect(response.status).toBe(expectedStatus);
  if (expectedErrorMessage) {
    if (expectedErrorMessage instanceof RegExp) {
      expect(JSON.stringify(response.body)).toMatch(expectedErrorMessage);
    } else {
      expect(JSON.stringify(response.body)).toContain(expectedErrorMessage);
    }
  }
}

// Schema validation function
export function assertSchema(body: any, schema: Record<string, { type: string; required?: boolean }>) {
  for (const [key, definition] of Object.entries(schema)) {
    if (definition.required) {
      expect(body).toHaveProperty(key);
    }
    
    if (body[key] !== undefined) {
      const actualType = Array.isArray(body[key]) ? 'array' : typeof body[key];
      expect(actualType, `Property '${key}' should be of type '${definition.type}'`).toBe(definition.type);
    }
  }
}

// --------------------------------------------------
// GET request assertions (positive scenarios)
// --------------------------------------------------

/**
 * Assert that a GET request returns a successful response
 * @param response - The response object
 * @param expectedStatus - Expected success status (default: 200)
 * @param expectedBody - Optional expected response body properties
 */
export function assertSuccessfulGet(
  response: { status: number; body: any; headers: Record<string, string> },
  expectedStatus: number = 200,
  expectedBody?: Record<string, any>
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers['content-type']).toBeDefined();
  
  if (expectedBody) {
    assertBody(response.body, expectedBody);
  }
}

/**
 * Assert that a paginated GET response is valid
 * @param response - The response object
 * @param page - Expected page number
 * @param pageSize - Expected page size
 * @param totalItems - Expected total items (optional)
 */
export function assertPaginatedGet(
  response: { status: number; body: any },
  page: number,
  pageSize: number,
  totalItems?: number
) {
  assertStatus(response, 200);
  
  const body = response.body;
  expect(body).toHaveProperty('data');
  expect(Array.isArray(body.data)).toBeTruthy();
  
  if (body.pagination || body.meta || body.page_info) {
    const paginationInfo = body.pagination || body.meta || body.page_info;
    expect(paginationInfo.page || paginationInfo.current_page).toBe(page);
    expect(paginationInfo.per_page || paginationInfo.page_size).toBe(pageSize);
    
    if (totalItems !== undefined) {
      expect(paginationInfo.total || paginationInfo.total_count).toBe(totalItems);
    }
  }
  
  if (pageSize > 0) {
    expect(body.data.length).toBeLessThanOrEqual(pageSize);
  }
}

/**
 * Assert that a GET request with path parameter returns the expected resource
 * @param response - The response object
 * @param resourceId - Expected resource ID
 * @param idField - Name of the ID field in response (default: 'id')
 */
export function assertGetByIdSuccess(
  response: { status: number; body: any },
  resourceId: string | number,
  idField: string = 'id'
) {
  assertStatus(response, 200);
  expect(response.body).toHaveProperty(idField);
  expect(response.body[idField].toString()).toBe(resourceId.toString());
}

/**
 * Assert that a collection resource GET request returns valid data
 * @param response - The response object
 * @param minItems - Minimum number of items expected
 * @param itemSchema - Optional schema to validate items against
 */
export function assertCollectionGet(
  response: { status: number; body: any },
  minItems: number = 1,
  itemSchema?: Record<string, { type: string; required?: boolean }>
) {
  assertStatus(response, 200);
  
  // Handle different API response formats for collections
  const items = Array.isArray(response.body) ? response.body : (
    response.body.data || response.body.items || response.body.results || []
  );
  
  expect(Array.isArray(items)).toBeTruthy();
  expect(items.length).toBeGreaterThanOrEqual(minItems);
  
  // If schema provided, validate the first item
  if (itemSchema && items.length > 0) {
    assertSchema(items[0], itemSchema);
  }
}

// --------------------------------------------------
// GET request assertions (negative scenarios)
// --------------------------------------------------

/**
 * Assert that a GET request with invalid path parameter returns a not found error
 * @param response - The response object
 */
export function assertGetNotFound(response: { status: number; body: any }) {
  assertStatus(response, 404);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/not found|doesn't exist|could not be found/i);
}

/**
 * Assert that a GET request with invalid query parameters returns an appropriate error
 * @param response - The response object
 * @param expectedStatus - Expected error status (default: 400)
 */
export function assertInvalidQueryParams(
  response: { status: number; body: any },
  expectedStatus: number = 400
) {
  assertStatus(response, expectedStatus);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/invalid|parameter|value|query/i);
}

/**
 * Assert that a GET request with insufficient permissions returns a forbidden error
 * @param response - The response object
 */
export function assertGetForbidden(response: { status: number; body: any }) {
  assertStatus(response, 403);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/forbidden|permission|access denied/i);
}

/**
 * Assert that a GET request without authentication returns an unauthorized error
 * @param response - The response object
 */
export function assertGetUnauthorized(response: { status: number; body: any }) {
  assertStatus(response, 401);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/unauthorized|authentication|login|token/i);
}

// --------------------------------------------------
// POST request assertions (positive scenarios)
// --------------------------------------------------

/**
 * Assert that a POST request with valid data returns a successful response
 * @param response - The response object
 * @param expectedStatus - Expected success status (default: 201)
 * @param expectedBody - Optional expected response body properties
 */
export function assertSuccessfulPost(
  response: { status: number; body: any; headers: Record<string, string> },
  expectedStatus: number = 201,
  expectedBody?: Record<string, any>
) {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers['content-type']).toBeDefined();
  
  if (expectedBody) {
    assertBody(response.body, expectedBody);
  }
  
  // Most POST operations for creation return an ID field
  if (response.body && (response.body.id || response.body._id)) {
    const idField = response.body.id ? 'id' : '_id';
    expect(response.body[idField]).toBeTruthy();
  }
}

/**
 * Assert that a POST request for resource creation returns the created resource
 * @param response - The response object
 * @param requestPayload - The payload used in the POST request
 * @param ignoredFields - Fields to ignore in the comparison (timestamps, IDs, etc.)
 */
export function assertCreatedResource(
  response: { status: number; body: any },
  requestPayload: Record<string, any>,
  ignoredFields: string[] = ['id', '_id', 'createdAt', 'updatedAt', 'created_at', 'updated_at']
) {
  expect(response.status).toBe(201);
  
  // Check that all payload fields are in the response
  for (const [key, value] of Object.entries(requestPayload)) {
    if (!ignoredFields.includes(key)) {
      expect(response.body).toHaveProperty(key);
      expect(response.body[key]).toEqual(value);
    }
  }
  
  // Most APIs return an ID for created resources
  expect(response.body.id || response.body._id).toBeDefined();
}

// --------------------------------------------------
// POST request assertions (negative scenarios)
// --------------------------------------------------

/**
 * Assert that a POST request with invalid payload format returns an error
 * @param response - The response object
 */
export function assertInvalidPayloadFormat(response: { status: number; body: any }) {
  expect(response.status).toBe(400);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/invalid|format|json|unexpected|malformed/i);
}

/**
 * Assert that a POST request with missing required fields returns an error
 * @param response - The response object
 * @param missingFields - Names of fields that were missing (for better error messages)
 */
export function assertMissingRequiredFields(
  response: { status: number; body: any },
  missingFields: string[] = []
) {
  expect(response.status).toBe(400);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/missing|required|mandatory|field|parameter/i);
  
  // Check if the response mentions the missing fields
  for (const field of missingFields) {
    expect(responseText).toMatch(new RegExp(`.*${field.toLowerCase()}.*`));
  }
}

/**
 * Assert that a POST request with invalid field values returns an error
 * @param response - The response object
 */
export function assertInvalidFieldValues(response: { status: number; body: any }) {
  expect(response.status).toBe(400);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/invalid|value|format|type|validation/i);
}

/**
 * Assert that a POST request for a duplicate resource returns a conflict error
 * @param response - The response object
 */
export function assertConflict(response: { status: number; body: any }) {
  expect(response.status).toBe(409);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/conflict|duplicate|already exists|unique/i);
}

// --------------------------------------------------
// PUT request assertions (positive scenarios)
// --------------------------------------------------

/**
 * Assert that a PUT request with valid data returns a successful response
 * @param response - The response object
 * @param expectedStatus - Expected success status (default: 200)
 * @param expectedBody - Optional expected response body properties
 */
export function assertSuccessfulPut(
  response: { status: number; body: any; headers: Record<string, string> },
  expectedStatus: number = 200,
  expectedBody?: Record<string, any>
) {
  expect(response.status).toBe(expectedStatus);
  
  if (expectedBody) {
    assertBody(response.body, expectedBody);
  }
}

/**
 * Assert that a PUT request for resource update returns the updated resource
 * @param response - The response object
 * @param requestPayload - The payload used in the PUT request
 * @param ignoredFields - Fields to ignore in the comparison
 */
export function assertUpdatedResource(
  response: { status: number; body: any },
  requestPayload: Record<string, any>,
  ignoredFields: string[] = ['createdAt', 'updatedAt', 'created_at', 'updated_at']
) {
  expect(response.status).toBe(200);
  
  // Check that all payload fields are in the response
  for (const [key, value] of Object.entries(requestPayload)) {
    if (!ignoredFields.includes(key)) {
      expect(response.body).toHaveProperty(key);
      expect(response.body[key]).toEqual(value);
    }
  }
}

// --------------------------------------------------
// PUT request assertions (negative scenarios)
// --------------------------------------------------

/**
 * Assert that a PUT request for a non-existent resource returns a not found error
 * @param response - The response object
 */
export function assertPutNotFound(response: { status: number; body: any }) {
  expect(response.status).toBe(404);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/not found|doesn't exist|could not be found/i);
}

/**
 * Assert that a PUT request with invalid field values returns a validation error
 * @param response - The response object
 */
export function assertPutValidationError(response: { status: number; body: any }) {
  expect(response.status).toBe(400);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/validation|invalid|value|format/i);
}

// --------------------------------------------------
// PATCH request assertions (positive scenarios)
// --------------------------------------------------

/**
 * Assert that a PATCH request with valid data returns a successful response
 * @param response - The response object
 * @param expectedStatus - Expected success status (default: 200)
 * @param expectedBody - Optional expected response body properties
 */
export function assertSuccessfulPatch(
  response: { status: number; body: any; headers: Record<string, string> },
  expectedStatus: number = 200,
  expectedBody?: Record<string, any>
) {
  expect(response.status).toBe(expectedStatus);
  
  if (expectedBody) {
    assertBody(response.body, expectedBody);
  }
}

/**
 * Assert that a PATCH request for partial resource update returns the updated resource
 * @param response - The response object
 * @param requestPayload - The payload used in the PATCH request
 */
export function assertPartiallyUpdatedResource(
  response: { status: number; body: any },
  requestPayload: Record<string, any>
) {
  expect(response.status).toBe(200);
  
  // Check that all payload fields are in the response
  for (const [key, value] of Object.entries(requestPayload)) {
    expect(response.body).toHaveProperty(key);
    expect(response.body[key]).toEqual(value);
  }
}

// --------------------------------------------------
// PATCH request assertions (negative scenarios)
// --------------------------------------------------

/**
 * Assert that a PATCH request for a non-existent resource returns a not found error
 * @param response - The response object
 */
export function assertPatchNotFound(response: { status: number; body: any }) {
  expect(response.status).toBe(404);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/not found|doesn't exist|could not be found/i);
}

/**
 * Assert that a PATCH request with invalid field values returns a validation error
 * @param response - The response object
 */
export function assertPatchValidationError(response: { status: number; body: any }) {
  expect(response.status).toBe(400);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/validation|invalid|value|format/i);
}

// --------------------------------------------------
// DELETE request assertions (positive scenarios)
// --------------------------------------------------

/**
 * Assert that a DELETE request returns a successful response
 * @param response - The response object
 * @param expectedStatus - Expected success status (default: 204)
 */
export function assertSuccessfulDelete(
  response: { status: number; body?: any },
  expectedStatus: number = 204
) {
  expect(response.status).toBe(expectedStatus);
}

/**
 * Assert that a resource is deleted (by checking it can't be retrieved)
 * @param getResponse - The response from trying to GET the deleted resource
 */
export function assertResourceDeleted(getResponse: { status: number; body: any }) {
  expect(getResponse.status).toBe(404);
}

// --------------------------------------------------
// DELETE request assertions (negative scenarios)
// --------------------------------------------------

/**
 * Assert that a DELETE request for a non-existent resource returns a not found error
 * @param response - The response object
 */
export function assertDeleteNotFound(response: { status: number; body: any }) {
  expect(response.status).toBe(404);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/not found|doesn't exist|could not be found/i);
}

/**
 * Assert that a DELETE request for a resource with dependencies returns a conflict error
 * @param response - The response object
 */
export function assertDeleteConflict(response: { status: number; body: any }) {
  expect(response.status).toBe(409);
  const responseText = JSON.stringify(response.body).toLowerCase();
  expect(responseText).toMatch(/conflict|dependent|associated|cannot delete/i);
}

// --------------------------------------------------
// Common validation assertions
// --------------------------------------------------

/**
 * Assert that a response has a valid JSON structure
 * @param body - Response body
 */
export function assertValidJson(body: any) {
  expect(() => JSON.stringify(body)).not.toThrow();
}

/**
 * Utility function to validate response times
 * @param startTime - Start time in milliseconds
 * @param maxResponseTime - Maximum acceptable response time in milliseconds
 */
export function assertResponseTime(startTime: number, maxResponseTime: number = 4000) {
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  expect(responseTime).toBeLessThanOrEqual(maxResponseTime);
}

/**
 * Assert that a rate limit response is correctly structured
 * @param response - The response object
 */
export function assertRateLimitExceeded(response: { status: number; headers: Record<string, string>; body: any }) {
  expect(response.status).toBe(429);
  
  // Check for rate limit headers
  const hasRateLimitHeaders = [
    'x-ratelimit-limit',
    'x-ratelimit-remaining',
    'x-ratelimit-reset',
    'retry-after'
  ].some(header => !!response.headers[header.toLowerCase()]);
  
  expect(hasRateLimitHeaders).toBe(true);
}

/**
 * Comprehensive validation of a successful API response across multiple dimensions
 * @param response - The response object
 * @param options - Configuration options for the assertions
 */
export function assertComprehensive(
  response: { status: number; headers: Record<string, string>; body: any },
  options: {
    expectedStatus?: number;
    expectedBody?: Record<string, any>;
    requiredHeaders?: string[];
    schema?: Record<string, { type: string; required?: boolean }>;
    maxResponseTime?: number;
    startTime?: number;
  } = {}
) {
  // Status code validation
  if (options.expectedStatus) {
    expect(response.status).toBe(options.expectedStatus);
  } else {
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }
  
  // Content-type validation
  if (response.headers['content-type']) {
    expect(response.headers['content-type']).toMatch(/application\/json/i);
  }
  
  // Required headers validation
  if (options.requiredHeaders) {
    for (const header of options.requiredHeaders) {
      expect(response.headers[header.toLowerCase()]).toBeDefined();
    }
  }
  
  // Body validation
  if (options.expectedBody) {
    for (const key in options.expectedBody) {
      expect(response.body[key]).toEqual(options.expectedBody[key]);
    }
  }
  
  // Schema validation
  if (options.schema) {
    for (const [key, definition] of Object.entries(options.schema)) {
      if (definition.required) {
        expect(response.body).toHaveProperty(key);
      }
      
      if (response.body[key] !== undefined) {
        const actualType = Array.isArray(response.body[key]) ? 'array' : typeof response.body[key];
        expect(actualType).toBe(definition.type);
      }
    }
  }
  
  // Response time validation
  if (options.maxResponseTime && options.startTime) {
    const endTime = Date.now();
    const responseTime = endTime - options.startTime;
    expect(responseTime).toBeLessThanOrEqual(options.maxResponseTime);
  }
  
  // JSON validation
  expect(() => JSON.stringify(response.body)).not.toThrow();
}