import { test, expect, request } from '@playwright/test';
import { PetApiService } from '../../services/petstore/PetApiService';
import { loadPayload } from '../../utils/payloadUtils';
import {
  assertSuccessfulGet,
  assertGetByIdSuccess,
  assertGetNotFound,
  assertErrorResponse,
  assertResponseTime,
  assertHeader
} from '../../assertions/apiAssertions';
import { LocalStore } from '../../../lib/common/utils/LocalStore';

test.describe('Pet API - Get Pet By ID Endpoint Tests', () => {
  let petApiService: PetApiService;
  let createdPetId: number;
  let basePayload: any;
  let savedResponses: Record<string, any> = {};

  test.beforeAll(async () => {
    // Create a dedicated APIRequestContext that will be used for all tests
    const apiContext = await request.newContext();
    // Create petApiService with the manually created context
    petApiService = new PetApiService(apiContext);
    basePayload = await loadPayload('addNewPet.json');
  });

  test('Scenario 1: Fetch Pet with valid path parameter', async () => {
    // Arrange - First create a new pet
    const createPayload = { ...basePayload, id: Date.now() };
    const createResponse = await petApiService.addNewPet(createPayload);
    const createResponseBody = await createResponse.json();

    // Save the pet ID for the test and later cleanup
    createdPetId = createResponseBody.id;
    LocalStore.getInstance().setValue('createdPetId', createdPetId.toString());
    console.log(`Pet created with ID: ${createdPetId}, saved to LocalStore`);
    savedResponses['successfulPetCreationResponse'] = createResponseBody;

    // Verify creation was successful
    expect(createResponse.status()).toBe(200);

    // Wait to ensure the pet is properly created in the system
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Act - Get the pet by ID
    const startTime = Date.now();
    const response = await petApiService.getPetById(createdPetId.toString());
    const responseBody = await response.json();

    // Assert
    assertGetByIdSuccess(
      { status: response.status(), body: responseBody },
      createdPetId
    );
    assertResponseTime(startTime);

    // Verify specific details
    expect(response.url()).toContain('/pet/');
    assertHeader(
      { headers: response.headers() as Record<string, string> },
      'Content-Type',
      /application\/json/
    );

    // Compare with original payload (excluding system-generated fields)
    expect(responseBody.name).toBe(createPayload.name);
    expect(responseBody.status).toBe(createPayload.status);

    // Save response for later reference
    savedResponses['successfulGetPetByIdResponse'] = responseBody;
  });

  test('Scenario 2: Fetch Pet with invalid path parameter - Non-existing petId', async () => {
    // Arrange
    const nonExistingPetId = '1321320';

    // Act
    const response = await petApiService.getPetById(nonExistingPetId);
    const responseBody = await response.json();

    // Assert
    assertGetNotFound({ status: response.status(), body: responseBody });
    expect(responseBody.message).toContain('Pet not found');

    // Save response for later reference
    savedResponses['GETResponseForInvalidPathParamValue'] = responseBody;
  });

  test('Scenario 3: Fetch Pet with special characters in path parameter value', async () => {
    // Arrange
    const specialCharacterId = '#$%^@';

    // Act
    let response;
    let responseBody;
    
    try {
      response = await petApiService.getPetById(specialCharacterId);
      responseBody = await response.json();
    } catch (error) {
      // Log the actual error from the API call
      console.error('Error during API call with special characters:', error instanceof Error ? error.message : String(error));
      // Re-throw the error to fail the test with the actual error
      throw error;
    }

    // Assert
    expect(response.status()).toBe(404);

    // Save response for later reference
    savedResponses['GETResponseForSpecialCharPathParamValue'] = responseBody;
  });

  test('Scenario 4: Fetch Pet with Blank value for path parameter', async () => {
    // Arrange
    const blankId = '';

    // Act
    let response;
    let responseBody;
    
    try {
      response = await petApiService.getPetById(blankId);
      responseBody = await response.json();
    } catch (error) {
      // Log the actual error from the API call
      console.error('Error during API call:', error instanceof Error ? error.message : String(error));
      // Re-throw the error to fail the test with the actual error
      throw error;
    }

    // Assert
    expect(response.status()).toBe(405);

    // Save response for later reference
    savedResponses['GETResponseForBlankPathParamValue'] = responseBody;
  });

  test.afterAll(async () => {
    // Cleanup - Delete the test pet if it was created
    if (createdPetId) {
      await petApiService.deletePet(createdPetId.toString());
      console.log(`Test cleanup: Deleted pet with ID ${createdPetId}`);
    }

    // Dispose the API client's resources
    await petApiService.dispose();
  });
});