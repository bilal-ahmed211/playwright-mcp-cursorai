/**
 * Utility for generating test data
 */
export class TestDataGenerator {
  /**
   * Generate a unique email address
   * @param prefix Optional prefix for the email
   */
  static generateUniqueEmail(prefix: string = 'test.user'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}.${timestamp}.${random}@example.com`;
  }

  /**
   * Generate a valid password that meets common requirements
   * - At least 8 characters
   * - Contains at least one uppercase letter
   * - Contains at least one lowercase letter
   * - Contains at least one number
   * - Contains at least one special character
   */
  static generateValidPassword(): string {
    return `Password${Math.floor(Math.random() * 1000)}!`;
  }

  /**
   * Generate user registration data
   * @param overrides Optional field overrides
   */
  static generateUserData(overrides: Partial<{
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }> = {}): {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } {
    return {
      email: overrides.email || this.generateUniqueEmail(),
      password: overrides.password || this.generateValidPassword(),
      firstName: overrides.firstName || 'Test',
      lastName: overrides.lastName || 'User'
    };
  }

  /**
   * Generate random text content
   * @param length Length of the text
   */
  static generateText(length: number = 50): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }
  
  /**
   * Generate a random date within the specified range
   * @param startDate Start of date range
   * @param endDate End of date range
   */
  static generateRandomDate(startDate?: Date, endDate?: Date): Date {
    const start = startDate || new Date(2000, 0, 1);
    const end = endDate || new Date();
    
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  }
} 