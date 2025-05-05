import { test, expect, request } from '@playwright/test';
import { PetApiService } from '../../services/petstore/PetApiService';
import { loadPayload, generateTestPayload } from '../../utils/payloadUtils';
import { 
  assertSuccessfulPost, 
  assertInvalidPayloadFormat, 
  assertMissingRequiredFields,
  assertErrorResponse, 
  assertResponseTime,
  assertSchema,
  assertBody
} from '../../assertions/apiAssertions';
import { LocalStore } from '../../../lib/common/utils/LocalStore';

test.describe('Pet API - Add New Pet Endpoint Tests', () => {
  let petApiService: PetApiService;
  let basePayload: any;
  let createdPetId: number;
  let savedResponses: Record<string, any> = {};

  test.beforeAll(async () => {
    // Create a dedicated APIRequestContext that will be used for all tests
    const apiContext = await request.newContext();
    // Create petApiService with the manually created context
    petApiService = new PetApiService(apiContext);
    basePayload = await loadPayload('addNewPet.json');
  });

  test('Scenario 1: Add New Pet with valid payload data', async () => {
    // Arrange
    const startTime = Date.now();
    const payload = { ...basePayload, id: Date.now() };

    // Act
    const response = await petApiService.addNewPet(payload);
    const responseBody = await response.json();

    // Assert
    assertSuccessfulPost(
      { status: response.status(), body: responseBody, headers: response.headers() as Record<string, string> },
      200 // Petstore API returns 200 instead of the normal 201 for successful creation
    );
    // assertResponseTime(startTime);
    
    // Verify headers
    expect(response.headers()['content-type']).toContain('application/json');
    
    // Verify required fields exist in response
    const requiredFields = ['id', 'category', 'name', 'photoUrls', 'tags', 'status'];
    for (const field of requiredFields) {
      expect(responseBody).toHaveProperty(field);
    }

    // Save the response and ID for later use
    savedResponses['successfulPetCreationResponse'] = responseBody;
    createdPetId = responseBody.id;
    // Store the created pet ID for later retrieval across tests
    LocalStore.getInstance().setValue('createdPetId', createdPetId.toString());
    console.log(`Pet created with ID: ${createdPetId}, saved to LocalStore`);
  });

  test('Scenario 2: Add New Pet without passing payload', async () => {
    // Act
    const response = await petApiService.addNewPet();
    const responseBody = await response.json();

    // Assert
    assertErrorResponse(
      { status: response.status(), body: responseBody },
      405, // Method not allowed - this is what the API should return for no payload
      /no data/i
    );

    // Save response for later use
    savedResponses['ErrorWithoutPayloadResponse'] = responseBody;
  });

  test('Scenario 3: Add New Pet with Invalid payload JSON Format', async () => {
    // Arrange - Use a string instead of proper JSON
    const invalidPayload = '{ "invalidJson": }'; // Invalid JSON syntax

    // Act - Have to use direct API call since our helper expects valid objects
    const response = await petApiService.addNewPet(invalidPayload as any);
    const responseText = await response.text();
    let responseBody;
    try {
      responseBody = JSON.parse(responseText);
    } catch (e) {
      responseBody = responseText;
    }

    // Assert - Petstore API strangely returns 200 for invalid JSON
    expect(response.status()).toBe(200);

    // Save response for later reference
    savedResponses['ErrorInvalidJSONResponse'] = responseBody;
  });

  test('Scenario 4: Add New Pet with Missing Required Fields in the payload', async () => {
    // Arrange
    const fieldsToRemove = ['id', 'category', 'name', 'photoUrls', 'tags'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'missing',
      fields: fieldsToRemove
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    const responseBody = await response.json();

    // Assert
    expect(response.status()).toBe(200); // Petstore API returns 200 even with missing fields

    // Save response for later reference
    savedResponses['ErrorMissingRequiredFieldsResponse'] = responseBody;
  });

  test('Scenario 5: Add New Pet with Extra Fields in the payload', async () => {
    // Arrange
    const extraFields = {
      extraField1: 'ExtraValue1',
      extraField2: 'ExtraValue2',
      customNote: 'This is a note'
    };
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'extra',
      fields: [],
      extraFields
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    const responseBody = await response.json();

    // Assert - API should accept extra fields without issues
    expect(response.status()).toBe(200);
    
    // Save response for later reference
    savedResponses['ErrorExtraFieldsResponse'] = responseBody;
  });

  test('Scenario 6: Add New Pet with Special Characters for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'special',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for special characters
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorSpecialCharactersResponse'] = responseBody;
  });

  test('Scenario 7: Add New Pet with Blank Values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'blank',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for blank values
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorBlankValuesForRequiredFieldsResponse'] = responseBody;
  });

  test('Scenario 8: Add New Pet with NULL values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'null',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    const responseBody = await response.json();

    // Assert - Feature file expects 200 for null values
    expect(response.status()).toBe(200);

    // Save response for later reference
    savedResponses['ErrorNullValuesResponse'] = responseBody;
  });

  test('Scenario 9: Add New Pet with Long Values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'long',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for long values
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorLongValuesResponse'] = responseBody;
  });

  test('Scenario 10: Add New Pet with Emoji values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'emoji',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for emoji values
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorEmojiValuesResponse'] = responseBody;
  });

  test('Scenario 11: Add New Pet with SQL injection values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'sql',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for SQL injection
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorSQLInjectionResponse'] = responseBody;
  });

  test('Scenario 12: Add New Pet with JavaScript injection values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'javascript',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for JavaScript injection
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorJavaScriptInjectionResponse'] = responseBody;
  });

  test('Scenario 13: Add New Pet with Server Command Injection values for Required Fields', async () => {
    // Arrange
    const fieldsToModify = ['category', 'name', 'photoUrls', 'tags', 'status'];
    const modifiedPayload = generateTestPayload(basePayload, {
      type: 'command',
      fields: fieldsToModify
    });

    // Act
    const response = await petApiService.addNewPet(modifiedPayload);
    let responseBody;
    try {
      responseBody = await response.json();
    } catch (e) {
      responseBody = await response.text();
    }

    // Assert - Feature file expects 500 for command injection
    expect(response.status()).toBe(500);

    // Save response for later reference
    savedResponses['ErrorServerCommandInjectionResponse'] = responseBody;
  });

  test('Scenario 14: Add New Pet with Missing Required Headers', async () => {
    // Arrange
    const payload = { ...basePayload, id: Date.now() };
    // Empty headers object - no Content-Type
    const headers = {};

    // Act
    const response = await petApiService.addNewPet(payload, headers);
    const responseBody = await response.json();

    // Assert - API should work without required headers
    expect(response.status()).toBe(200);

    // Save response for later reference
    savedResponses['ErrorMissingHeadersResponse'] = responseBody;
  });

  test('Scenario 15: Add New Pet with Blank Values for Required Headers', async () => {
    // Arrange
    const payload = { ...basePayload, id: Date.now() };
    const headers = {
      'Content-Type': ''
    };

    // Act
    const response = await petApiService.addNewPet(payload, headers);
    const responseBody = await response.json();

    // Assert - API should still work with blank headers
    expect(response.status()).toBe(200);

    // Save response for later reference
    savedResponses['ErrorBlankHeadersResponse'] = responseBody;
  });

  test('Scenario 16: Add New Pet with Extra Keys in Headers', async () => {
    // Arrange
    const payload = { ...basePayload, id: Date.now() };
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': '',
      'ExtraHeaderKey': ''
    };

    // Act
    const response = await petApiService.addNewPet(payload, headers);
    const responseBody = await response.json();

    // Assert - API should accept extra headers
    expect(response.status()).toBe(200);

    // Save response for later reference
    savedResponses['ErrorExtraKeysInHeadersResponse'] = responseBody;
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