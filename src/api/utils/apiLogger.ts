import { allure } from 'allure-playwright';

export interface ApiLogOptions {
  request: {
    method: string;
    url: string;
    headers?: Record<string, string>;
    body?: any;
    curlCommand?: string;
  };
  response: {
    status: number;
    headers?: Record<string, string>;
    body?: any;
    responseTime?: number;
  };
  stepName?: string;
}

export function logApiToAllure({ request, response, stepName }: ApiLogOptions) {
  try {
    // Create a single step for the entire API call
    const stepTitle = stepName || `${request.method} ${request.url}`;
    
    // Add attachments directly without nesting steps
    // This avoids potential issues with the Allure runtime
    allure.attachment(
      'Request Details', 
      JSON.stringify({
        method: request.method,
        url: request.url,
        headers: request.headers,
        body: request.body,
      }, null, 2), 
      'application/json'
    );
    
    // Log curl command if available
    if (request.curlCommand) {
      allure.attachment('cURL Command', request.curlCommand, 'text/plain');
    }
    
    // Log response details
    allure.attachment(
      'Response Details', 
      JSON.stringify({
        status: response.status,
        statusText: getStatusText(response.status),
        headers: response.headers,
        body: response.body,
        responseTime: response.responseTime ? `${response.responseTime}ms` : 'Not measured',
      }, null, 2), 
      'application/json'
    );
    
    // Add response time as a separate attachment for better visibility
    if (response.responseTime) {
      allure.attachment('Response Time', `${response.responseTime}ms`, 'text/plain');
    }
    
    // Add a formatted HTML representation of the response for better readability
    const htmlContent = generateHtmlReport(request, response);
    allure.attachment('API Call Summary', htmlContent, 'text/html');
  } catch (error) {
    console.warn(`Warning: Error logging to Allure report: ${error}`);
    // Don't rethrow the error - we don't want test failures due to reporting issues
  }
}

/**
 * Get a descriptive text for HTTP status codes
 */
function getStatusText(status: number): string {
  const statusMap: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    409: 'Conflict',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout'
  };
  
  return statusMap[status] || 'Unknown Status';
}

/**
 * Generate an HTML report for the API call
 */
function generateHtmlReport(request: ApiLogOptions['request'], response: ApiLogOptions['response']): string {
  const statusColor = response.status < 400 ? 'green' : 'red';
  
  return `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          .container { margin: 10px; }
          .section { margin-bottom: 20px; }
          .header { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
          .item { margin: 5px 0; }
          .status { display: inline-block; padding: 2px 6px; border-radius: 3px; }
          .key { color: #555; }
          .pre { font-family: monospace; white-space: pre-wrap; background-color: #f5f5f5; padding: 10px; border-radius: 5px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { text-align: left; padding: 8px; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="section">
            <div class="header">Request Details</div>
            <div class="item"><span class="key">Method:</span> ${request.method}</div>
            <div class="item"><span class="key">URL:</span> ${request.url}</div>
            ${request.body ? `<div class="item"><span class="key">Request Body:</span><div class="pre">${JSON.stringify(request.body, null, 2)}</div></div>` : ''}
          </div>
          
          ${request.curlCommand ? `
            <div class="section">
              <div class="header">cURL Command</div>
              <div class="pre">${request.curlCommand}</div>
            </div>
          ` : ''}
          
          <div class="section">
            <div class="header">Response Details</div>
            <div class="item">
              <span class="key">Status:</span> 
              <span class="status" style="background-color: ${statusColor}; color: white;">
                ${response.status} ${getStatusText(response.status)}
              </span>
            </div>
            ${response.responseTime ? `<div class="item"><span class="key">Response Time:</span> ${response.responseTime}ms</div>` : ''}
          </div>
          
          ${response.headers ? `
            <div class="section">
              <div class="header">Response Headers</div>
              <table>
                <tr>
                  <th>Header</th>
                  <th>Value</th>
                </tr>
                ${Object.entries(response.headers).map(([key, value]) => `
                  <tr>
                    <td>${key}</td>
                    <td>${value}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          ` : ''}
          
          ${response.body ? `
            <div class="section">
              <div class="header">Response Body</div>
              <div class="pre">${JSON.stringify(response.body, null, 2)}</div>
            </div>
          ` : ''}
        </div>
      </body>
    </html>
  `;
}