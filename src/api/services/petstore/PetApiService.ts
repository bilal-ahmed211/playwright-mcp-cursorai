import { APIRequestContext, APIResponse } from '@playwright/test';
import { ApiClient } from '../../core/apiClient';
import endpoints from '../../data/petstore/endpoints/endpoints.json';

/**
 * Page Object Model class for Pet API operations
 */
export class PetApiService {
    private apiClient: ApiClient;
    private endpoints = endpoints.pet;
    
    /**
     * Create a new PetApiPage instance
     * @param apiContext - Playwright API request context (optional)
     * @param baseUrl - Optional base URL override
     */
    constructor(apiContext?: APIRequestContext, baseUrl?: string) {
        // Pass apiContext as optional. If null/undefined, ApiClient will create its own
        this.apiClient = new ApiClient(apiContext, baseUrl);
        this.endpoints = endpoints.pet;
    }

    /**
     * Dispose the API client when no longer needed
     */
    async dispose(): Promise<void> {
        await this.apiClient.dispose();
    }

    /**
     * Add a new pet to the store
     * @param payload - Pet payload object or undefined for empty payload tests
     * @param headers - Optional custom headers
     * @returns API response
     */
    async addNewPet(payload?: any, headers?: Record<string, string>): Promise<APIResponse> {
        return this.apiClient.post(this.endpoints.create, payload, headers);
    }

    /**
     * Add a new pet with path parameter
     * @param petId - Pet ID to use in path
     * @param payload - Pet payload
     * @param headers - Optional custom headers
     * @returns API response
     */
    async addNewPetWithPathParam(petId: string, payload?: any, headers?: Record<string, string>): Promise<APIResponse> {
        return this.apiClient.post(`pet/${petId}`, payload, headers);
    }

    /**
     * Find pet by ID
     * @param petId - ID of pet to retrieve
     * @returns API response
     */
    async getPetById(petId: string): Promise<APIResponse> {
        return this.apiClient.getWithPathParam(this.endpoints.getById, { petId: petId });
    }

    /**
     * Update an existing pet
     * @param payload - Updated pet payload
     * @param headers - Optional custom headers
     * @returns API response
     */
    async updatePet(payload: any, headers?: Record<string, string>): Promise<APIResponse> {
        return this.apiClient.put(this.endpoints.create, payload, headers);
    }

    /**
     * Delete a pet
     * @param petId - ID of pet to delete
     * @returns API response
     */
    async deletePet(petId: string): Promise<APIResponse> {
        return this.apiClient.getWithPathParam(this.endpoints.delete, { petId: petId });
    }

    /**
     * Modify the payload by removing specific fields
     * @param payload - Original payload
     * @param fieldsToRemove - Array of field names to remove
     * @returns Modified payload
     */
    modifyPayloadWithMissingFields(payload: any, fieldsToRemove: string[]): any {
        const modifiedPayload = { ...payload };
        
        for (const field of fieldsToRemove) {
            delete modifiedPayload[field];
        }
        
        return modifiedPayload;
    }

    /**
     * Modify the payload by adding extra fields
     * @param payload - Original payload
     * @param extraFields - Object containing extra fields to add
     * @returns Modified payload
     */
    modifyPayloadWithExtraFields(payload: any, extraFields: Record<string, any>): any {
        return { ...payload, ...extraFields };
    }

    /**
     * Modify the payload by replacing values with special characters
     * @param payload - Original payload
     * @param fieldsToReplace - Array of field names to replace
     * @param replaceValue - Value to use for replacement
     * @returns Modified payload
     */
    modifyPayloadWithReplacedValues(payload: any, fieldsToReplace: string[], replaceValue: any): any {
        const modifiedPayload = { ...payload };
        
        for (const field of fieldsToReplace) {
            if (field.includes('.')) {
                // Handle nested fields (e.g., "category.name")
                const [parent, child] = field.split('.');
                if (modifiedPayload[parent]) {
                    modifiedPayload[parent][child] = replaceValue;
                }
            } else {
                // Handle top-level fields
                if (field in modifiedPayload) {
                    modifiedPayload[field] = replaceValue;
                }
            }
        }
        
        return modifiedPayload;
    }
}