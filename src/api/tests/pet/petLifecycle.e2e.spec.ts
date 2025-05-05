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

test.describe('Pet API - Complete E2E Lifecycle Test', () => {
  let petApiPage: PetApiService;
  let basePayload: any;
  let createdPetId: number;
  let testData: {
    originalPet: any,
    updatedPet: any
  } = {
    originalPet: null,
    updatedPet: null
  };

  test.beforeAll(async ({ request }) => {
    petApiPage = new PetApiService(request);
    basePayload = await loadPayload('addNewPet.json');
    
    // Ensure we have a unique ID for our test
    basePayload.id = Date.now();
    
    // Create unique identifiers for the pet to ensure test isolation
    basePayload.name = `Test Pet ${basePayload.id}`;
    basePayload.tags[0].name = `test-tag-${basePayload.id}`;
  });

  test('Step 1: Create a new pet', async () => {
    // Arrange
    const startTime = Date.now();
    const payload = { ...basePayload };
    console.log('Creating pet with payload:', JSON.stringify(payload, null, 2));

    // Act
    const response = await petApiPage.addNewPet(payload);
    const responseBody = await response.json();
    testData.originalPet = responseBody;
    createdPetId = responseBody.id;

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
    
    // Skip if we don't have a pet ID from the creation step
    test.skip(!createdPetId, 'Pet was not created in the previous step');
    console.log(`Retrieving pet with ID: ${createdPetId}`);

    // Act
    const response = await petApiPage.getPetById(createdPetId.toString());
    const responseBody = await response.json();

    // Assert
    assertResponseTime(startTime, 2000);
    assertGetByIdSuccess(
      { status: response.status(), body: responseBody },
      createdPetId
    );
    
    // Deep comparison of retrieved pet with the one we created
    expect(responseBody).toEqual(testData.originalPet);
    
    console.log(`Successfully retrieved pet with name: ${responseBody.name}`);
  });

  test('Step 3: Update the pet', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Skip if we don't have a pet ID from the creation step
    test.skip(!createdPetId, 'Pet was not created in the previous step');
    
    // Prepare updated data
    const updatedPayload = { ...testData.originalPet };
    updatedPayload.name = `Updated ${updatedPayload.name}`;
    updatedPayload.status = 'sold'; // Change status from available to sold
    updatedPayload.category.name = 'Updated Category';
    updatedPayload.tags[0].name = `updated-${updatedPayload.tags[0].name}`;
    
    console.log('Updating pet with payload:', JSON.stringify(updatedPayload, null, 2));

    // Act
    const response = await petApiPage.updatePet(updatedPayload);
    const responseBody = await response.json();
    testData.updatedPet = responseBody;

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
    expect(responseBody.category.name).toBe('Updated Category');
    
    console.log(`Successfully updated pet. New name: ${responseBody.name}, New status: ${responseBody.status}`);
  });

  test('Step 4: Verify the update was successful', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Skip if we don't have a pet ID from the creation step
    test.skip(!createdPetId, 'Pet was not created in the previous step');
    console.log(`Verifying pet update with ID: ${createdPetId}`);

    // Act
    const response = await petApiPage.getPetById(createdPetId.toString());
    const responseBody = await response.json();

    // Assert
    assertResponseTime(startTime, 2000);
    assertGetByIdSuccess(
      { status: response.status(), body: responseBody },
      createdPetId
    );
    
    // Verify the pet was updated properly by comparing with the update response
    expect(responseBody).toEqual(testData.updatedPet);
    expect(responseBody.status).toBe('sold');
    
    console.log(`Verified pet update. Current status: ${responseBody.status}`);
  });

  test('Step 5: Delete the pet', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Skip if we don't have a pet ID from the creation step
    test.skip(!createdPetId, 'Pet was not created in the previous step');
    console.log(`Deleting pet with ID: ${createdPetId}`);

    // Act
    const response = await petApiPage.deletePet(createdPetId.toString());

    // Assert
    assertSuccessfulDelete(
      { status: response.status(), body: await response.text() },
      200  // Petstore API returns 200 for successful deletion instead of the standard 204
    );
    assertResponseTime(startTime, 2000);
    
    console.log(`Successfully deleted pet with ID: ${createdPetId}`);
  });

  test('Step 6: Verify the deletion was successful', async () => {
    // Arrange
    const startTime = Date.now();
    
    // Skip if we don't have a pet ID from the creation step
    test.skip(!createdPetId, 'Pet was not created in the previous step');
    console.log(`Verifying pet deletion with ID: ${createdPetId}`);

    // Act
    const response = await petApiPage.getPetById(createdPetId.toString());
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
    
    console.log(`Verified pet deletion. Pet with ID ${createdPetId} no longer exists.`);
  });

  test.afterAll(async () => {
    // Cleanup - Try to delete the pet if any previous test failed
    // This ensures we don't leave test data behind
    if (createdPetId) {
      try {
        await petApiPage.deletePet(createdPetId.toString());
        console.log(`Test cleanup: Ensured pet with ID ${createdPetId} is deleted`);
      } catch (err: any) {
        console.log(`Pet with ID ${createdPetId} may have already been deleted: ${err.message}`);
      }
    }
  });
});