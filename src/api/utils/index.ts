// Export all utilities from this index file
// This allows importing from a single path like:
// import { ... } from '../../utils'

// API Core Utilities
export * from './apiUtils';
export * from './apiLogger';

// Pet API Specific Utilities 
// Use named imports to avoid ambiguity with duplicate exports
import { loadPayload, generateTestPayload, validateResponseSchema, compareExcludingFields } from './payloadUtils';
import { loadPayload as loadPayloadFromHelper, generateTestPayload as generateTestPayloadFromHelper, validateResponseSchema as validateResponseSchemaFromHelper, compareExcludingFields as compareExcludingFieldsFromHelper } from './petApiTestHelper';

// Re-export specific utility functions
export {
  loadPayload,
  generateTestPayload,
  validateResponseSchema,
  compareExcludingFields,
  
  // Re-export from petApiTestHelper with renamed exports
  loadPayloadFromHelper,
  generateTestPayloadFromHelper,
  validateResponseSchemaFromHelper,
  compareExcludingFieldsFromHelper
};

// Export everything else from petApiTestHelper that doesn't cause conflicts
export * from './petApiTestHelper';

// Global State Management
export * from './globalStore';