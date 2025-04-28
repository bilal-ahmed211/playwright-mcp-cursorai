import * as pkg from './package.json';
import { getOsEnv, toBool} from './src/lib/utils/common/Utilities';


export const env = {

    app: {
        name: getOsEnv('APP_NAME') || (pkg as any).name,
        version: getOsEnv('APP_VERSION') || (pkg as any).version,
    },
    imgThreshold: {threshold: 0.4 },
    channelId: getOsEnv('CHANNEL_ID') || '',
    // datasetPath: getOsEnv('DATASET_PATH') || '',

    playwright: {
        // Browser settings
        browser: process.env.BROWSER || 'chrome',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        
        // Test execution settings
        defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
        isBrowserLogsEnabled: process.env.BROWSER_LOGS_ENABLED === 'true',
        isVideoEnabled: process.env.PWVIDEO === 'true',
        isToUseSameBrowser: process.env.USE_SAME_BROWSER === 'true',
        closeBrowser: process.env.CLOSE_BROWSER !== 'false',
        
        // Screenshot and trace settings
        screenshotOnFailure: true,
        traceOnFailure: true,
        
        // Reporting settings
        allureReportEnabled: true,
        
        // Custom environment variables
        // Add any additional environment variables needed for your tests
        logLevel: process.env.LOG_LEVEL || 'info',
    },

    db: {
        connectionString: String(getOsEnv('MONGODB_URL')),
        name: String(getOsEnv('MONGODB_NAME')),
        enableMongodbConnection: toBool(getOsEnv('ENABLE_MONGODB_CONNECTION')) || false,
        mongodbDetails: getOsEnv('MONGODB_Details') || {},
    },

    // API settings
    api: {
        baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
        authToken: process.env.AUTH_TOKEN || '',
        defaultHeaders: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        // API interception settings
        interception: {
            enabled: process.env.ENABLE_API_INTERCEPTION === 'true',
            logToConsole: process.env.API_INTERCEPTION_LOG === 'true',
            captureRequestBody: process.env.API_CAPTURE_REQUEST_BODY !== 'false',
            captureResponseBody: process.env.API_CAPTURE_RESPONSE_BODY !== 'false',
        }
    },

    // Test data settings
    testData: {
        // Add any test data configurations needed
        userEmail: process.env.TEST_USER_EMAIL || 'test@example.com',
        userPassword: process.env.TEST_USER_PASSWORD || 'password123',
    }
}