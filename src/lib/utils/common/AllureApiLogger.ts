import { APIResponse, request, TestInfo } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ResponseDetails {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    body: any;
}

export class AllureApiLogger {
    /**
     * Generates cURL command from request details
     */
    public static generateCurlCommand(
        method: string,
        url: string,
        headers: Record<string, string>,
        payload?: any
    ): string {
        let curl = `curl -X ${method.toUpperCase()} "${url}"`;
        
        // Add headers
        for (const [key, value] of Object.entries(headers)) {
            curl += ` -H "${key}: ${value}"`;
        }
        
        // Add payload if exists
        if (payload) {
            curl += ` -d '${JSON.stringify(payload)}'`;
        }
        
        return curl;
    }

    /**
     * Formats response details for logging
     */
    public static async getResponseDetails(response: APIResponse): Promise<ResponseDetails> {
        let body: any;
        try {
            body = await response.json();
        } catch {
            body = await response.text();
        }

        return {
            status: response.status(),
            statusText: response.statusText(),
            headers: Object.fromEntries(Object.entries(response.headers())),
            body
        };
    }

    /**
     * Attaches API call details to Allure report via Playwright's TestInfo
     */
    public static async attachApiCallDetails(
        testInfo: TestInfo,
        method: string,
        url: string,
        headers: Record<string, string>,
        payload?: any,
        response?: APIResponse
    ): Promise<void> {
        try {
            // Generate cURL command
            const curlCommand = this.generateCurlCommand(method, url, headers, payload);
            
            // Get response details if response exists
            let responseDetails: ResponseDetails | undefined;
            if (response) {
                responseDetails = await this.getResponseDetails(response);
            }

            // Create combined report
            const report = {
                request: {
                    method,
                    url,
                    curl: curlCommand,
                    headers,
                    body: payload
                },
                response: responseDetails
            };

            // Create attachment for Allure
            const attachmentPath = path.join(testInfo.outputDir, `api-log-${Date.now()}.json`);
            fs.writeFileSync(attachmentPath, JSON.stringify(report, null, 2));
            
            // Attach to test info
            await testInfo.attach('API Request/Response', {
                path: attachmentPath,
                contentType: 'application/json'
            });
            
            // Also log to console in a readable format
            console.log(`\n=== API CALL ===`);
            console.log(`Method: ${method}`);
            console.log(`URL: ${url}`);
            console.log(`cURL: ${curlCommand}`);
            
            if (response && responseDetails) {
                console.log(`\n=== API RESPONSE ===`);
                console.log(`Status: ${response.status()} ${response.statusText()}`);
                console.log(`Body: ${JSON.stringify(responseDetails.body, null, 2)}`);
            }
            console.log(`\n`);
            
        } catch (error) {
            console.error('Failed to attach API details:', error);
        }
    }

    /**
     * Logs API call details to console
     */
    public static async logApiCall(
        method: string,
        url: string,
        headers: Record<string, string>,
        payload: any,
        response: APIResponse
    ): Promise<ResponseDetails | null> {
        try {
            // Generate cURL command
            const curlCommand = this.generateCurlCommand(method, url, headers, payload);

            // Get response details
            const responseDetails = await this.getResponseDetails(response);

            // Log to console
            console.log(`\n=== API CALL ===`);
            console.log(`Method: ${method}`);
            console.log(`URL: ${url}`);
            console.log(`cURL: ${curlCommand}`);
            console.log(`\n=== API RESPONSE ===`);
            console.log(`Status: ${response.status()} ${response.statusText()}`);
            console.log(`Body: ${JSON.stringify(responseDetails.body, null, 2)}\n`);
            
            return responseDetails;
        } catch (error) {
            console.error('Failed to log API details:', error);
            return null;
        }
    }
}