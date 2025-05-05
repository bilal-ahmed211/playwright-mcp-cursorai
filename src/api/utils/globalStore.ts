/**
 * Utility for storing and retrieving global values across test files
 * This allows sharing data like IDs between different test files and test runs
 */

// A simple key-value store for global values
const globalStore: Record<string, any> = {};

/**
 * Set a value in the global store
 * @param key - Unique identifier for the stored value
 * @param value - Value to store
 */
export function setGlobalValue<T>(key: string, value: T): void {
  globalStore[key] = value;
  console.log(`[GlobalStore] Set '${key}' to:`, value);
}

/**
 * Get a value from the global store
 * @param key - Key to retrieve
 * @param defaultValue - Optional default value if key doesn't exist
 * @returns The stored value, or defaultValue if not found
 */
export function getGlobalValue<T>(key: string, defaultValue?: T): T | undefined {
  const value = key in globalStore ? globalStore[key] : defaultValue;
  console.log(`[GlobalStore] Retrieved '${key}':`, value);
  return value;
}

/**
 * Check if a key exists in the global store
 * @param key - Key to check
 * @returns True if the key exists in the store
 */
export function hasGlobalValue(key: string): boolean {
  return key in globalStore;
}

/**
 * Remove a value from the global store
 * @param key - Key to remove
 */
export function removeGlobalValue(key: string): void {
  if (key in globalStore) {
    delete globalStore[key];
    console.log(`[GlobalStore] Removed '${key}'`);
  }
}

/**
 * Clear all values from the global store
 */
export function clearGlobalStore(): void {
  Object.keys(globalStore).forEach(key => {
    delete globalStore[key];
  });
  console.log('[GlobalStore] Cleared all values');
}

// Pet API specific constants
export const GLOBAL_KEYS = {
  PET_ID: 'currentPetId',
  PET_DETAILS: 'currentPetDetails'
};