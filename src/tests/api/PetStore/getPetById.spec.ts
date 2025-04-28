import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';
import {APIUtils} from '../../../lib/utils/api/APIUtils';
import { LocalStore } from '../../../lib/utils/common/LocalStore';
import { readJsonFile, compareObjectsExcludingFields } from '../../../lib/utils/api/ApiTestHelpers';
import * as path from 'path';

const apiUtils = new APIUtils();
const folderName = 'PetStoreApi';
const payloadFilePath = path.resolve(__dirname, `../../../data/api/${folderName}`);

test.describe('API Tests for fetching Pet by ID - GET Request', () => {
  let apiContext: APIRequestContext;
  let apiResponse: APIResponse;
  let apiResponseBody: any;
  let petId: string;
  
  test.beforeEach(async ({ request }) => {
    apiContext = request;
  });

  test('Fetch PetId with valid path parameter @PetStoreApiE2EFlow', async () => {
    // Step 1: POST request to create a new pet
    const payload = await readJsonFile('addNewPet.json', payloadFilePath);
    const dynamicId = new Date().getTime();
    payload.id = dynamicId;
    console.log(`Dynamic ID generated: ${dynamicId}`);
    
    apiResponse = await apiUtils.post(apiContext, 'addNewPet', { data: payload });
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
    
    // Save pet ID from response
    petId = apiResponseBody.id.toString();
    LocalStore.getInstance().setValue('petId', petId);
    console.log(`Pet ID from response: ${petId}`);


  
    // Verify response matches expected JSON file excluding specific fields
    const expectedResponse = await readJsonFile('AddNewPetExpectedResponse.json', payloadFilePath);
    // Compare response excluding id and category.id fields
    const excludeFields = ['id', 'category.id'];
    const matches = compareObjectsExcludingFields(apiResponseBody, expectedResponse, excludeFields);
    expect(matches).toBeTruthy();
    
    // Wait for the data to be fully processed
    await new Promise(resolve => setTimeout(resolve, 17000));
    
    // Step 2: GET request to fetch the pet by ID
    const startTime = Date.now();
    apiResponse = await apiUtils.getWithPathParam(apiContext, 'getPetById', petId);
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(200);
    
    // Verify response time is within expected range
    console.log(`Response time: ${responseTime}ms`);
    expect(responseTime).toBeLessThan(1000);
    
    // Verify the API endpoint URL contains "/pet/"
    expect(apiResponse.url()).toContain('/pet/');
    
    // Verify response format is JSON
    expect(apiResponse.headers()['content-type']).toContain('application/json');
    
    // Verify response headers
    expect(apiResponse.headers()['content-type']).toBe('application/json');
  });

  test('Fetch PetId with invalid path parameter - Non-existing petId', async () => {
    // GET request with non-existing pet ID
    apiResponse = await apiUtils.getWithPathParam(apiContext, 'getPetById', '1321320');
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(404);
    
    // Verify error message
    expect(apiResponseBody.message).toBe('Pet not found');
  });

  test('Fetch PetId with special characters in path parameter value', async () => {
    // GET request with special characters in path parameter
    apiResponse = await apiUtils.getWithPathParam(apiContext, 'getPetById', '#$%^@');
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(405);
  });

  test('Fetch PetId with Blank value for path parameter', async () => {
    // GET request with blank path parameter
    apiResponse = await apiUtils.getWithPathParam(apiContext, 'getPetById', '');
    apiResponseBody = await apiUtils.parseApiResponse(apiResponse);
    
    // Verify response status code
    expect(apiResponse.status()).toBe(405);
  });
}); 