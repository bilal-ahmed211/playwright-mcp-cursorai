import * as fs from 'fs';
import * as path from 'path';
import { ApiResourceHelper } from './apiUtils';

/**
 * Load a JSON payload file from the specified directory
 * @param fileName - Name of the JSON file
 * @param directory - Directory containing the file (optional)
 * @returns Parsed JSON object
 */
export async function loadPayload(fileName: string, directory?: string): Promise<any> {
    try {
        // Determine the correct directory path
        const basePath = directory || path.resolve(__dirname, '../../api/data/petstore/payloads');
        const filePath = path.join(basePath, fileName);
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            throw new Error(`File not found: ${filePath}`);
        }
        
        // Read and parse the file
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const payload = JSON.parse(fileContent);
        
        // Add a dynamic ID if not present
        if (!payload.id) {
            payload.id = new Date().getTime();
            console.log(`Dynamic ID generated: ${payload.id}`);
        }
        
        return payload;
    } catch (error) {
        console.error(`Error loading payload: ${error}`);
        throw error;
    }
}

/**
 * Generate a modified payload with various test cases
 * @param basePayload - The base payload to modify
 * @param options - Modification options
 * @returns Modified payload
 */
export function generateTestPayload(
    basePayload: any, 
    options: {
        type: 'missing' | 'extra' | 'special' | 'blank' | 'null' | 'long' | 'emoji' | 'sql' | 'javascript' | 'command';
        fields: string[];
        extraFields?: Record<string, any>;
    }
): any {
    const payload = JSON.parse(JSON.stringify(basePayload)); // Deep clone
    
    switch (options.type) {
        case 'missing':
            // Remove fields
            options.fields.forEach(field => {
                delete payload[field];
            });
            break;
            
        case 'extra':
            // Add extra fields
            if (options.extraFields) {
                Object.assign(payload, options.extraFields);
            }
            break;
            
        case 'special':
            // Replace with special characters
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = '@#$%^&*()';
                }
            });
            break;
            
        case 'blank':
            // Replace with blank values
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = '';
                }
            });
            break;
            
        case 'null':
            // Replace with null values
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = null;
                }
            });
            break;
            
        case 'long':
            // Replace with long values
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = 'a'.repeat(200);
                }
            });
            break;
            
        case 'emoji':
            // Replace with emoji values
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = '😊🚀🌟🔥';
                }
            });
            break;
            
        case 'sql':
            // Replace with SQL injection
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = "'; DROP TABLE users; --";
                }
            });
            break;
            
        case 'javascript':
            // Replace with JavaScript injection
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = "<script>alert('Injected!');</script>";
                }
            });
            break;
            
        case 'command':
            // Replace with server command injection
            options.fields.forEach(field => {
                if (payload[field] !== undefined) {
                    payload[field] = "&& rm -rf /";
                }
            });
            break;
    }
    
    return payload;
}

/**
 * Check if API response structure matches the expected schema
 * @param response - API response body
 * @param expectedFields - Array of field names to verify
 * @returns Boolean indicating if all expected fields are present
 */
export function validateResponseSchema(response: any, expectedFields: string[]): boolean {
    for (const field of expectedFields) {
        if (ApiResourceHelper.isEmpty(response[field])) {
            return false;
        }
    }
    return true;
}

/**
 * Compare two objects excluding specified fields
 * @param actual - Actual object
 * @param expected - Expected object
 * @param excludeFields - Fields to exclude from comparison
 * @returns Boolean indicating if objects match
 */
export function compareExcludingFields(
    actual: any,
    expected: any,
    excludeFields: string[] = []
): boolean {
    const filteredActual = { ...actual };
    const filteredExpected = { ...expected };
    
    // Remove excluded fields
    for (const field of excludeFields) {
        delete filteredActual[field];
        delete filteredExpected[field];
    }
    
    return JSON.stringify(filteredActual) === JSON.stringify(filteredExpected);
}