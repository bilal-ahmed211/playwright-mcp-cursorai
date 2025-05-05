import { test, expect } from '@playwright/test';
import { PetApiService } from '../../services/petstore/PetApiService';
import { loadPayload, generateTestPayload } from '../../utils/payloadUtils';
import { 
  assertSuccessfulPost, 
  assertGetByIdSuccess,
  assertSuccessfulPut,
  assertUpdatedResource,
  assertSuccessfulDelete,
  assertResourceDeleted,
  assertResponseTime,
  assertComprehensive
} from '../../assertions/apiAssertions';
import {
  setGlobalValue,
  getGlobalValue,
  GLOBAL_KEYS
} from '../../utils/globalStore';

// Define a PetDetails interface for better type safety
interface PetDetails {
  id: number;
  name: string;
  status: string;
  category: {
    id: number;
    name: string;
  };
  photoUrls: string[];
  tags: Array<{
    id: number;
    name: string;
  }>;
}

test.describe('Pet API - Complete E2E Lifecycle Test', () => {
  let petApiService: PetApiService;
  let basePayload: any;
  let createdPetId: number;
  let testData: {
    originalPet: PetDetails | null;
    updatedPet: PetDetails | null;
  } = {
    originalPet: null,
    updatedPet: null
  };

  test.beforeAll(async ({ request }) => {
    petApiService = new PetApiService(request);
    basePayload = await loadPayload('addNewPet.json');
    
    // Ensure we have a unique ID for our test
    basePayload.id = Date.now();
    
    // Create unique identifiers for the pet to ensure test isolation
    basePayload.name = `Test Pet ${basePayload.id}`;
    basePayload.tags[0].name = `test-tag-${basePayload.id}`;
    
    // Check if we have a globally stored petId that we can use
    const globalPetId = getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    if (globalPetId) {
      console.log(`Found globally stored petId: ${globalPetId}`);
      // We could use this ID instead of creating a new one if needed
    }
  });

  test('Step 1: Create a new pet', async () => {
    // Arrange
    const startTime = Date.now();
    const payload = { ...basePayload };
    console.log('Creating pet with payload:', JSON.stringify(payload, null, 2));

    // Act
    const response = await petApiService.addNewPet(payload);
    const responseBody = await response.json();
    testData.originalPet = responseBody as PetDetails;
    createdPetId = responseBody.id;
    
    // Store the pet ID globally for reuse across all tests
    setGlobalValue<number>(GLOBAL_KEYS.PET_ID, createdPetId);
    setGlobalValue<PetDetails>(GLOBAL_KEYS.PET_DETAILS, responseBody as PetDetails);

    // Assert
    assertComprehensive(
      { 
        status: response.status(), 
        body: responseBody, 
        headers: response.headers() as Record<string, string> 
      },
      {
        expectedStatus: 200, // Petstore API returns 200 for creation
        schema: {
          id: { type: 'number', required: true },
          name: { type: 'string', required: true },
          category: { type: 'object', required: true },
          photoUrls: { type: 'array', required: true },
          tags: { type: 'array', required: true },
          status: { type: 'string', required: true }
        },
        startTime,
        maxResponseTime: 2000
      }
    );

    // Verify specific data in the response
    expect(responseBody.id).toBe(payload.id);
    expect(responseBody.name).toBe(payload.name);
    expect(responseBody.status).toBe(payload.status);
    
    console.log(`Successfully created pet with ID: ${createdPetId}`);
  });

  test('Step 2: Retrieve the created pet', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Get the pet ID - either from the previous step or from global store
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    
    // Skip if we don't have a pet ID from the creation step or global store
    test.skip(!petId, 'No pet ID available from creation step or global store');
    
    // Safe guard to ensure petId is defined before using it
    if (!petId) return;
    
    console.log(`Retrieving pet with ID: ${petId}`);

    // Act
    const response = await petApiService.getPetById(petId.toString());
    const responseBody = await response.json();

    // Assert
    assertResponseTime(startTime, 2000);
    assertGetByIdSuccess(
      { status: response.status(), body: responseBody },
      petId
    );
    
    // Store the details if this is the first time we're seeing them
    if (!testData.originalPet) {
      testData.originalPet = responseBody as PetDetails;
    }
    
    console.log(`Successfully retrieved pet with name: ${responseBody.name}`);
  });

  test('Step 3: Update the pet', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Get the pet ID - either from the previous step or from global store
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    
    // Skip if we don't have a pet ID
    test.skip(!petId, 'No pet ID available from creation step or global store');
    
    // Safe guard to ensure petId is defined before using it
    if (!petId) return;
    
    // If we don't have the original pet details, try to get them from global store
    if (!testData.originalPet) {
      const storedDetails = getGlobalValue<PetDetails>(GLOBAL_KEYS.PET_DETAILS);
      if (storedDetails) {
        testData.originalPet = storedDetails;
      }
    }
    
    // Skip if we don't have pet details to update
    test.skip(!testData.originalPet, 'No pet details available to update');
    if (!testData.originalPet) return;
    
    // Now we're sure testData.originalPet is defined
    const updatedPayload = { ...testData.originalPet };
    updatedPayload.name = `Updated ${updatedPayload.name}`;
    updatedPayload.status = 'sold'; // Change status from available to sold
    
    // Make sure category exists before trying to access its properties
    if (updatedPayload.category) {
      updatedPayload.category.name = 'Updated Category';
    }
    
    // Make sure tags exists before trying to access its properties
    if (updatedPayload.tags && updatedPayload.tags.length > 0) {
      updatedPayload.tags[0].name = `updated-tag-${updatedPayload.id}`;
    }
    
    console.log('Updating pet with payload:', JSON.stringify(updatedPayload, null, 2));

    // Act
    const response = await petApiService.updatePet(updatedPayload);
    const responseBody = await response.json();
    testData.updatedPet = responseBody as PetDetails;
    
    // Update the global store with the latest pet details
    setGlobalValue<PetDetails>(GLOBAL_KEYS.PET_DETAILS, responseBody as PetDetails);

    // Assert
    assertSuccessfulPut(
      { 
        status: response.status(), 
        body: responseBody, 
        headers: response.headers() as Record<string, string> 
      }
    );
    
    assertUpdatedResource(
      { status: response.status(), body: responseBody },
      updatedPayload
    );
    
    assertResponseTime(startTime, 2000);
    
    // Verify specific updates
    expect(responseBody.name).toBe(updatedPayload.name);
    expect(responseBody.status).toBe('sold');
    
    if (responseBody.category && updatedPayload.category) {
      expect(responseBody.category.name).toBe(updatedPayload.category.name);
    }
    
    console.log(`Successfully updated pet. New name: ${responseBody.name}, New status: ${responseBody.status}`);
  });

  test('Step 4: Verify the update was successful', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Get the pet ID - either from the previous step or from global store
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    
    // Skip if we don't have a pet ID
    test.skip(!petId, 'No pet ID available from creation step or global store');
    
    // Safe guard to ensure petId is defined before using it
    if (!petId) return;
    
    console.log(`Verifying pet update with ID: ${petId}`);

    // Act
    const response = await petApiService.getPetById(petId.toString());
    const responseBody = await response.json();

    // Assert
    assertResponseTime(startTime, 2000);
    assertGetByIdSuccess(
      { status: response.status(), body: responseBody },
      petId
    );
    
    // Verify the pet was updated properly by comparing with the update response
    if (testData.updatedPet) {
      expect(responseBody).toEqual(testData.updatedPet);
      expect(responseBody.status).toBe('sold');
    }
    
    console.log(`Verified pet update. Current status: ${responseBody.status}`);
  });

  test('Step 5: Delete the pet', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Get the pet ID - either from the previous step or from global store
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    
    // Skip if we don't have a pet ID
    test.skip(!petId, 'No pet ID available from creation step or global store');
    
    // Safe guard to ensure petId is defined before using it
    if (!petId) return;
    
    console.log(`Deleting pet with ID: ${petId}`);

    // Act
    const response = await petApiService.deletePet(petId.toString());

    // Assert
    assertSuccessfulDelete(
      { status: response.status(), body: await response.text() },
      200  // Petstore API returns 200 for successful deletion instead of the standard 204
    );
    assertResponseTime(startTime, 2000);
    
    console.log(`Successfully deleted pet with ID: ${petId}`);
  });

  test('Step 6: Verify the deletion was successful', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Get the pet ID - either from the previous step or from global store
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    
    // Skip if we don't have a pet ID
    test.skip(!petId, 'No pet ID available from creation step or global store');
    
    // Safe guard to ensure petId is defined before using it
    if (!petId) return;
    
    console.log(`Verifying pet deletion with ID: ${petId}`);

    // Act
    const response = await petApiService.getPetById(petId.toString());
    const responseText = await response.text();
    
    // Parse response if it's JSON, otherwise leave as text
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch (e) {
      responseBody = responseText;
    }

    // Assert - Pet should not be found (404)
    expect(response.status()).toBe(404);
    assertResponseTime(startTime, 2000);
    
    console.log(`Verified pet deletion. Pet with ID ${petId} no longer exists.`);
  });

  test.afterAll(async () => {
    // Cleanup - Try to delete the pet if any previous test failed
    // This ensures we don't leave test data behind
    const petId = createdPetId || getGlobalValue<number>(GLOBAL_KEYS.PET_ID);
    if (petId) {
      try {
        await petApiService.deletePet(petId.toString());
        console.log(`Test cleanup: Ensured pet with ID ${petId} is deleted`);
      } catch (err: any) {
        console.log(`Pet with ID ${petId} may have already been deleted: ${err.message}`);
      }
    }
  });
});