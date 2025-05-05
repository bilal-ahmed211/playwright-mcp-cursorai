import { join, isAbsolute } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';

export class CoreUtils {
    // Environment related utilities
    static getOsEnv(key: string): any {
        return process.env[key];
    }

    static getOsEnvObj(key: string): any {
        return JSON.parse(process.env[key] || '{}');
    }

    static getOsEnvArray(key: any, delimiter: string = ','): string[] {
        return process.env[key]?.split(delimiter) || [];
    }

    static getOsEnvRegex(key: string): any {
        return (process.env[key] && new RegExp(process.env[key].slice(1, -1))) || false;
    }

    // Path related utilities
    static getPath(path: string): string {
        return process.env.NODE_ENV === 'production'
            ? join(process.cwd(), path.replace('src/', 'dist/src/').slice(0, -3) + '.js')
            : join(process.cwd(), path);
    }
    static getPaths(paths: string[]): string[] {
        return paths.map((p: string): string => this.getPath(p));
    }

    static getOsPath(key: string): string {
        const path = this.getOsEnv(key);
        return path && this.getPath(path);
    }

    static getAbsolutePath(userProvidedPath: string): string {
        return isAbsolute(userProvidedPath) ? userProvidedPath : join(process.cwd(), userProvidedPath);
    }

    // File related utilities
    static findFilePath(fileName: string, startDir: string = process.cwd()): string | undefined {
        let currentDir = startDir;
        while (currentDir) {
            const filePath = path.join(currentDir, fileName);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
            const parentDir = path.dirname(currentDir);
            if (parentDir === currentDir) {
                break;
            }
            currentDir = parentDir;
        }
        return undefined;
    }

    static getValueFromFile(filePath: string, key: string): any | undefined {
        try {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            const properties: Record<string, string> = {};
            const lines = fileContent.split('\n');
            for (const line of lines) {
                if (line.trim() && !line.startsWith('#')) {
                    const [k, v] = line.split('=');
                    if (k && v) {
                        properties[k.trim()] = v.trim();
                    }
                }
            }
            return properties[key];
        } catch (error) {
            console.error(`Error reading file ::>> ${filePath}`, error);
            return undefined;
        }
    }

    static getJsonString(filePath: string): string {
        return fs.readFileSync(path.resolve(filePath), 'utf-8');
    }

    // Data manipulation utilities
    static normalizePort(port: string): number | string | boolean {
        const parsedPort = parseInt(port, 10);
        if (isNaN(parsedPort)) {
            return port;
        }
        if (parsedPort >= 0) {
            return parsedPort;
        }
        return false;
    }

    static toBool(value: string): boolean {
        return value === 'true';
    }

    static isEmpty(value: any): boolean {
        return (
            value === undefined ||
            value === null ||
            (typeof value === 'object' && Object.keys(value).length === 0) ||
            (typeof value === 'string' && value.trim().length === 0)
        );
    }

    static toCamelCase(key: string): string {
        return key
            .replace(/\s+(.)/g, (match, group): any => {
                return match ? group.toUpperCase() : group.toUpperCase();
            })
            ?.replace(' ', '');
    }

    static getCurrentTimeStamp(): string {
        const strDate = format(new Date(), "mmssSSSS");
        console.log(`Current time stamp is ::>> ${strDate}`);
        return strDate;
    }

    static getRandomNumber(digits: number): string {
        const start = Date.now();
        const randomFactor = Math.random();
        const combinedRandom = start * randomFactor;
        const randomString = combinedRandom.toString().replace('.', '');
        const randomNumber = randomString.substring(0, digits);
        return randomNumber;
    }
} 