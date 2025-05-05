import { faker } from '@faker-js/faker';
import { format } from 'date-fns';
import * as crypto from 'crypto';

export class TestDataGenerator {
    static generateRandomEmail(domain: string = 'example.com'): string {
        return faker.internet.email().toLowerCase();
    }

    static generateRandomName(): string {
        return faker.person.fullName();
    }

    static generateRandomPhoneNumber(): string {
        return faker.phone.number();
    }

    static generateRandomAddress(): {
        street: string;
    city: string;
    state: string;
    zipCode: string;
        country: string;
    } {
        return {
            street: faker.location.streetAddress(),
            city: faker.location.city(),
            state: faker.location.state(),
            zipCode: faker.location.zipCode(),
            country: faker.location.country()
        };
    }

    static generateRandomCompanyInfo(): {
        name: string;
        catchPhrase: string;
        description: string;
    } {
    return {
            name: faker.company.name(),
            catchPhrase: faker.company.catchPhrase(),
            description: faker.company.buzzPhrase()
        };
    }

    static generateRandomDate(start: Date = new Date(2000, 0, 1), end: Date = new Date()): Date {
        return faker.date.between({ from: start, to: end });
    }

    static generateFormattedDate(date: Date = new Date(), formatStr: string = 'yyyy-MM-dd'): string {
        return format(date, formatStr);
    }

    static generateRandomNumber(min: number = 0, max: number = 100): number {
        return faker.number.int({ min, max });
    }

    static generateRandomBoolean(): boolean {
        return faker.datatype.boolean();
    }

    static generateRandomString(length: number = 10): string {
        return faker.string.alphanumeric(length);
    }

    static generateRandomPassword(length: number = 12): string {
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        const allChars = lowercase + uppercase + numbers + symbols;
        let password = '';
        
        // Ensure at least one of each type
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];
        
        // Fill the rest randomly
        for (let i = password.length; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }
        
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }

    static generateUUID(): string {
        return crypto.randomUUID();
    }

    static generateRandomColor(): string {
        return faker.color.rgb();
    }

    static generateRandomUrl(): string {
        return faker.internet.url();
    }

    static generateRandomIPAddress(): string {
        return faker.internet.ip();
    }

    static generateRandomUserAgent(): string {
        return faker.internet.userAgent();
    }

    static generateRandomCreditCard(): {
        number: string;
        cvv: string;
        expiry: string;
    } {
        return {
            number: faker.finance.creditCardNumber(),
            cvv: faker.finance.creditCardCVV(),
            expiry: faker.date.future().toISOString().slice(0, 7).replace('-', '/')
        };
    }

    static generateRandomProduct(): {
        name: string;
        price: number;
        description: string;
        category: string;
    } {
        return {
            name: faker.commerce.productName(),
            price: parseFloat(faker.commerce.price()),
            description: faker.commerce.productDescription(),
            category: faker.commerce.department()
        };
    }

    static generateRandomFileInfo(): {
        name: string;
        extension: string;
        type: string;
        size: number;
    } {
        const extensions = ['.pdf', '.doc', '.txt', '.jpg', '.png'];
        const types = ['application/pdf', 'application/msword', 'text/plain', 'image/jpeg', 'image/png'];
        const index = Math.floor(Math.random() * extensions.length);
        
        return {
            name: faker.system.fileName(),
            extension: extensions[index],
            type: types[index],
            size: faker.number.int({ min: 1024, max: 10485760 }) // 1KB to 10MB
        };
    }
}

