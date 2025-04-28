// import _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import { format } from 'date-fns';
import { APIResponse } from "@playwright/test";
import { Page } from "@playwright/test";
import { LocalStore } from "./LocalStore";

export class Helpers {
    public response: APIResponse;
    readonly page: Page;;
    public localStore: LocalStore;
    testData: Map<string, any>;

    public constructor(page: Page, options: { healingEnabled?: boolean, logging?: boolean } = {}){
        this.page = page;
        this.localStore = LocalStore.getInstance();
        this.testData = new Map([
            ['key1', 'value1'],
            ['key2', 'value2'],
        ])

    }

    getCurrentTimeStamp(): string {
        const strDate = format(new Date(), "mmssSSSS");
        console.log(`Current time stamp is ::>> ${strDate}`);
        return strDate;
    }

    getRandomNumber(digits: number): string {
        const start = Date.now();
        const randomFactor = Math.random();
        const combinedRandom = start * randomFactor;
        const randomString = combinedRandom.toString().replace('.', '');
        const randomNumber = randomString.substring(0, digits);
        return randomNumber;
    }

    findFilePath(fileName: string, startDir: string = process.cwd()): string | undefined {
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

    getValueFromFile(filePath: string, key: string): any | undefined {
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

    // Function to read properties file
    getEndpointProperty(key) {
        const properties = fs.readFileSync(path.resolve(__dirname, 'resource.properties'), 'utf-8');
        const lines = properties.split('\n');
        for (let line of lines) {
            const [k, v] = line.split('=');
            if (k.trim() === key) {
                return v.trim();
            }
        }
        return null;
    }

    findFileAndGetValue(fileName: string, key: string): any {
        const filePath = this.findFilePath(fileName);
        if (filePath) {
            const keyToRetrieve = key;
            const value = JSON.stringify(this.getValueFromFile(filePath, keyToRetrieve))
            if (value) {
                console.log(`Value Retrieved for ${key} is ::>> ${JSON.stringify(value)}`);
                return value.replace(/['"]+/g, '');
                // return value;
            } else {
                console.log(`Key ${key} not found in the file`);

            }
        } else {
            console.log(`File ${fileName} not found`);
        }
    }

    public findFileAndGetValueUpdated(fileName: string, key: string): string {
        const filePath = path.resolve(process.cwd(), fileName);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const regex = new RegExp(`^${key}=([^\\n\\r]*)`, 'm');
        const match = fileContent.match(regex);
        if (match) {
            return match[1];
        } else {
            throw new Error(`Key not found: ${key}`);
        }
    }

    getJsonString(filePath: string): string{
        return fs.readFileSync(path.resolve(filePath), 'utf-8');
    }

    // replaceJsonData(responseBody: string): string {
    //     //this.localStore.setValue('id', 'value')
    //     let id = this.localStore.getValue('id');
    //     var responseBody = responseBody
    //     .replaceAll('%key', 'value')
    //     .replaceAll('%id', 'id')
    //     return responseBody;
    // }

    // public async setSessionStorageFromJsonFile(): Promise<void>{
    //     console.log('Set Json data into session storage');
    //     await this.page.evaluate(()=>{
    //         window.sessionStorage.setItem('key', 'value')
    //     });
    //     const chipData: any = await this.replaceJsonData(
    //         await this.getJsonString('./src/data/json/chipData.json')
    //     );

    //     await this.page.evaluate(
    //         (chipData) => window.sessionStorage.setItem('key', chipData),
    //         chipData,
    //     )
    // }


}