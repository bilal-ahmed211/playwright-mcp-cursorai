import { APIResponse } from '@playwright/test';

/**
 * Log levels for test logging
 */
export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

/**
 * A centralized logging utility for API tests
 */
export class TestLogger {
  private static instance: TestLogger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enabledInProduction: boolean = false;

  /**
   * Private constructor to enforce singleton
   */
  private constructor() { }

  /**
   * Get the singleton instance
   */
  static getInstance(): TestLogger {
    if (!TestLogger.instance) {
      TestLogger.instance = new TestLogger();
    }
    return TestLogger.instance;
  }

  /**
   * Set the log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable or disable logging in production
   */
  setProductionLogging(enabled: boolean): void {
    this.enabledInProduction = enabled;
  }

  /**
   * Check if logging is enabled based on environment and level
   */
  private shouldLog(level: LogLevel): boolean {
    // Don't log in production unless explicitly enabled
    if (process.env.NODE_ENV === 'production' && !this.enabledInProduction) {
      return false;
    }

    // Only log messages at or above the current log level
    const levels = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.SUCCESS]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.FAILURE]: 2,
      [LogLevel.ERROR]: 3
    };

    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Format the log message
   */
  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();

    // Add emoji indicators for success and failure
    let emoji = '';
    if (level === LogLevel.SUCCESS) emoji = '✅ ';
    if (level === LogLevel.FAILURE) emoji = '❌ ';
    if (level === LogLevel.ERROR) emoji = '❌ ';
    if (level === LogLevel.WARN) emoji = '⚠️ ';

    return `[${timestamp}] [${level}] ${emoji}${message}`;
  }

  /**
   * Log an informational message
   */
  info(message: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.log(this.formatMessage(LogLevel.INFO, message));
    }
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    if (this.shouldLog(LogLevel.SUCCESS)) {
      console.log(this.formatMessage(LogLevel.SUCCESS, message));
    }
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message));
    }
  }

  /**
   * Log a failure message
   */
  failure(message: string): void {
    if (this.shouldLog(LogLevel.FAILURE)) {
      console.error(this.formatMessage(LogLevel.FAILURE, message));
    }
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message));
    }
  }

  /**
   * Log a debug message
   */
  debug(message: string): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message));
    }
  }

  /**
   * Log API request details
   */
  logRequest(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    data?: any
  ): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const headersStr = JSON.stringify(this.sanitizeHeaders(headers), null, 2);
      const dataStr = data ? JSON.stringify(data, null, 2) : 'none';

      this.debug(`API Request: ${method} ${url}
Headers: ${headersStr}
Payload: ${dataStr}`);
    }
  }

  /**
   * Log API response details
   */
  async logResponse(response: APIResponse): Promise<void> {
    const status = response.status();
    const statusText = response.statusText();

    // Determine if successful response
    const isSuccess = status >= 200 && status < 300;
    const level = isSuccess ? LogLevel.SUCCESS : LogLevel.FAILURE;

    if (this.shouldLog(level)) {
      const responseBody = await this.getResponseBody(response);
      const headers = response.headers();

      const message = `API Response: ${status} ${statusText}
Headers: ${JSON.stringify(headers, null, 2)}
Body: ${responseBody}`;

      if (isSuccess) {
        this.success(message);
      } else {
        this.failure(message);
      }
    }
  }

  /**
   * Remove sensitive information from headers (e.g., auth tokens)
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };

    // Replace sensitive headers with placeholders
    if (sanitized['Authorization']) {
      sanitized['Authorization'] = '[REDACTED]';
    }

    if (sanitized['Cookie']) {
      sanitized['Cookie'] = '[REDACTED]';
    }

    return sanitized;
  }

  /**
   * Try to extract response body as text or JSON
   */
  private async getResponseBody(response: APIResponse): Promise<string> {
    try {
      const responseBody = await response.json();
      return JSON.stringify(responseBody, null, 2);
    } catch {
      try {
        return await response.text();
      } catch {
        return '[Unable to extract response body]';
      }
    }
  }
} 