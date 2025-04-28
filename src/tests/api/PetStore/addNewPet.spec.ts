import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';
import { APIUtils } from '../../../lib/utils/api/APIUtils';
import { readJsonFile, compareObjectsExcludingFields } from '../../../lib/utils/api/ApiTestHelpers';
import * as path from 'path';

const apiUtils = new APIUtils();
const folderName = 'PetStoreApi';
const payloadFilePath = path.resolve(__dirname, `../../../data/api/${folderName}`);

// Helper function to prepare payload with dynamic ID
async function preparePayload(payloadFileName: string, modifications?: (payload: any) => void): Promise<any> {
  const payload = await readJsonFile(payloadFileName, payloadFilePath);
  const dynamicId = new Date().getTime();
  payload.id = dynamicId; // Add dynamic ID to the payload
  console.log(`Dynamic ID generated: ${dynamicId}`);
  if (modifications) {
    modifications(payload);
  }
  console.log('Modified payload:', JSON.stringify(payload, null, 2));
  return payload;
}

test.describe('API Tests for Add New Pet - POST Request', () => {
  let apiContext: APIRequestContext;
  let apiResponse: APIResponse;
  let apiResponseBody: any;
  let petId: string;
  
  test.beforeEach(async ({ request }) => {
    apiContext = request;
  });

  test('Add New Pet with valid payload data @AddNewPet_Positive', async () => {
    const payload = await preparePayload('addNewPet.json');
    
    const startTime = Date.now();
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
    
    // Verify response time is within expected range
    console.log(`Response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(2500);
    
    // Verify response format is JSON
    expect(apiResponse.headers()['content-type']).toContain('application/json');
    
    // Verify response headers
    expect(apiResponse.headers()['content-type']).toBe('application/json');
    
    // Verify response body contains the expected keys
    const expectedKeys = ['id', 'category', 'name', 'photoUrls', 'tags', 'status'];
    expectedKeys.forEach(key => {
      expect(apiResponseBody).toHaveProperty(key);
    });
    
    // Verify response matches expected JSON file excluding specific fields
    const expectedResponse = await readJsonFile('AddNewPetExpectedResponse.json', payloadFilePath);
    // Compare response excluding id and category.id fields
    const excludeFields = ['id', 'category.id'];
    const matches = compareObjectsExcludingFields(apiResponseBody, expectedResponse, excludeFields);
    expect(matches).toBeTruthy();
    
    // Save pet ID from response
    petId = apiResponseBody.id.toString();
    console.log(`Pet ID from response: ${petId}`);
  });

  test('Add New Pet without passing payload', async () => {
    apiResponse = await apiUtils.post(apiContext, 'addNewPet');
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(405);
    
    // Verify error message
    expect(apiResponseBody.message).toBe('no data');
  });

  test('Add New Pet with Invalid payload JSON Format', async () => {
    const invalidPayload = '{ "invalidJson": }'; // Invalid JSON
    console.log('Sending invalid JSON payload:', invalidPayload);
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: invalidPayload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with Missing Required Fields in the payload', async () => {
    const fieldsToRemove = ['id', 'category', 'name', 'photoUrls', 'tags'];
    const payload = await preparePayload('addNewPet.json', (payload) => {
      fieldsToRemove.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          delete payload[field];
          console.log(`Removed key "${field}" from the payload.`);
        } else {
          console.warn(`Key "${field}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
  });

  test('Add New Pet with Extra Fields in the payload', async () => {
    const extraFields = {
      extraField1: 'ExtraValue1',
      extraField2: 'ExtraValue2',
      customNote: 'This is a note'
    };
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      Object.assign(payload, extraFields);
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
  });

  test('Add New Pet with Special Characters for Required Fields in the payload', async () => {
    const keysToReplace = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const specialChars = '@#$%^&*()';
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      keysToReplace.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          payload[key] = specialChars;
        } else {
          console.warn(`Key "${key}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with Blank Values for Required Fields in the payload', async () => {
    const keysToBlank = ['category', 'name', 'photoUrls', 'tags', 'status'];
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      keysToBlank.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          payload[key] = "";
        } else {
          console.warn(`Key "${key}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with NULL values for Required Fields in the payload', async () => {
    const fieldsToNull = ['category', 'name', 'photoUrls', 'tags', 'status'];
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      fieldsToNull.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          payload[field] = null;
        } else {
          console.warn(`Key "${field}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
  });

  test('Add New Pet with Long Values for Required Fields in the payload', async () => {
    const keysToAssignLongValues = ['category', 'name', 'photoUrls', 'tags', 'status'];
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      keysToAssignLongValues.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          payload[key] = 'a'.repeat(200); // Generate a string with 200 'a' characters
        } else {
          console.warn(`Key "${key}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with Emoji values for Required Fields in the payload', async () => {
    const keysToReplaceWithEmojis = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const emojiValue = '😊🚀🌟🔥'; // Example emoji string
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      keysToReplaceWithEmojis.forEach(key => {
        if (Object.prototype.hasOwnProperty.call(payload, key)) {
          payload[key] = emojiValue;
        } else {
          console.warn(`Key "${key}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with SQL injection values for Required Fields in the payload', async () => {
    const fieldsToInject = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const sqlInjectionValue = "'; DROP TABLE users; --"; // Example SQL injection string
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      fieldsToInject.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          payload[field] = sqlInjectionValue;
        } else {
          console.warn(`Key "${field}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with JavaScript injection values for Required Fields in the payload', async () => {
    const fieldsToInject = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const jsInjectionValue = "<script>alert('Injected!');</script>"; // Example JavaScript injection string
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      fieldsToInject.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          payload[field] = jsInjectionValue;
        } else {
          console.warn(`Key "${field}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with Server Command Injection values for Required Fields in the payload', async () => {
    const fieldsToInject = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const serverCommandInjectionValue = "&& rm -rf /"; // Example server command injection string
    
    const payload = await preparePayload('addNewPet.json', (payload) => {
      fieldsToInject.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          payload[field] = serverCommandInjectionValue;
        } else {
          console.warn(`Key "${field}" not found in payload!`);
        }
      });
    });
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(500);
  });

  test('Add New Pet with Missing Required Headers', async () => {
    const payload = await preparePayload('addNewPet.json');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Remove the Content-Type header
    delete headers['Content-Type'];
    
    console.log("Final headers for request:", headers);
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload, headers });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
  });

  test('Add New Pet with Blank Values for Required Headers', async () => {
    const payload = await preparePayload('addNewPet.json');
    const headers: Record<string, string> = {
      'Content-Type': '',
    };
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload, headers });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(415);
  });

  test('Add New Pet with Extra Keys in Headers', async () => {
    const payload = await preparePayload('addNewPet.json');
    const additionalHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': '',
      'ExtraHeaderKey': ''
    };
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload, headers: additionalHeaders });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
  });
}); 