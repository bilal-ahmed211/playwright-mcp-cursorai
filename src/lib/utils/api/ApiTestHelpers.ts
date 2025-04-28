import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads a JSON file and returns its contents as an object
 * @param fileName - Name of the JSON file
 * @param folderPath - Path to the folder containing the file
 * @returns Parsed JSON object
 */
export async function readJsonFile(fileName: string, folderPath: string): Promise<any> {
  try {
    const filePath = path.join(folderPath, fileName);
    console.log(`Reading JSON file from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      return {};
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading JSON file ${fileName}:`, error);
    return {};
  }
}

/**
 * Compares two objects excluding certain fields
 * @param actual - Actual object
 * @param expected - Expected object
 * @param excludeFields - Fields to exclude from comparison
 * @returns Boolean indicating if objects match
 */
export function compareObjectsExcludingFields(
  actual: any,
  expected: any,
  excludeFields: string[] = []
): boolean {
  // Helper function to check if a path should be excluded
  const shouldExclude = (path: string): boolean => {
    return excludeFields.some(field => {
      // Check for direct field match or nested field match (e.g., "category.id")
      return field === path || path.startsWith(`${field}.`);
    });
  };

  // Helper function to recursively compare objects
  function compareRecursive(a: any, e: any, currentPath: string = ''): boolean {
    // If current path should be excluded, skip comparison
    if (shouldExclude(currentPath)) {
      return true;
    }

    // Check if types are different
    if (typeof a !== typeof e) {
      console.error(`Type mismatch at ${currentPath}: ${typeof a} vs ${typeof e}`);
      return false;
    }

    // Handle array comparison
    if (Array.isArray(a) && Array.isArray(e)) {
      if (a.length !== e.length) {
        console.error(`Array length mismatch at ${currentPath}: ${a.length} vs ${e.length}`);
        return false;
      }
      
      return a.every((item, index) => {
        const newPath = currentPath ? `${currentPath}[${index}]` : `[${index}]`;
        return compareRecursive(item, e[index], newPath);
      });
    }

    // Handle object comparison
    if (typeof a === 'object' && a !== null && e !== null) {
      const aKeys = Object.keys(a);
      const eKeys = Object.keys(e);
      
      // Check if keys match (excluding fields to ignore)
      const aFilteredKeys = aKeys.filter(key => !shouldExclude(currentPath ? `${currentPath}.${key}` : key));
      const eFilteredKeys = eKeys.filter(key => !shouldExclude(currentPath ? `${currentPath}.${key}` : key));
      
      if (aFilteredKeys.length !== eFilteredKeys.length) {
        console.error(`Object keys count mismatch at ${currentPath}: ${aFilteredKeys.length} vs ${eFilteredKeys.length}`);
        return false;
      }
      
      return aFilteredKeys.every(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        return eFilteredKeys.includes(key) && compareRecursive(a[key], e[key], newPath);
      });
    }

    // Handle primitive comparison
    if (a !== e) {
      console.error(`Value mismatch at ${currentPath}: ${a} vs ${e}`);
      return false;
    }

    return true;
  }

  return compareRecursive(actual, expected);
} 