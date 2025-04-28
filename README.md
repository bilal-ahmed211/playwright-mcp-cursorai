# Playwright MCP CursorAI Automation Framework

## Overview

This project is a comprehensive test automation framework built with Playwright, designed for both API and web UI testing. It follows a modular architecture with support for:

- API testing with request/response handling and validation
- Web UI testing with page object pattern implementation
- Self-healing locator mechanism
- Test data management
- Allure reporting integration
- Cross-browser and responsive testing

## Project Structure

```
├── allure.config.ts                # Allure reporting configuration
├── env.ts                          # Environment variables and configuration
├── fixtures.ts                     # Test fixtures setup
├── global-setup.ts                 # Setup executed before all tests
├── global-teardown.ts              # Teardown executed after all tests
├── package.json                    # Project dependencies
├── playwright.config.ts            # Playwright test configuration
├── resource.properties             # Resource properties for the framework
└── src/                            # Source code directory
    ├── data/                       # Test data directory
    │   ├── api/                    # API test data
    │   │   └── PetStoreApi/        # PetStore API test data
    │   └── web/                    # Web test data
    │       └── locators/           # Web locators for UI testing
    ├── lib/                        # Library code
    │   ├── scripts/                # Scripts for API and web testing
    │   │   ├── api/                # API testing scripts and models
    │   │   └── web/                # Web testing pages and components
    │   └── utils/                  # Utility functions
    │       ├── api/                # API testing utilities
    │       ├── common/             # Common utilities
    │       └── web/                # Web testing utilities
    └── tests/                      # Test scripts
        ├── api/                    # API tests
        │   ├── FyiAi/              # FyiAi API tests
        │   └── PetStore/           # PetStore API tests
        └── web/                    # Web UI tests
            └── FyiAi/              # FyiAi web tests
```

## Key Components

### API Testing Framework

- `ApiClient.ts`: Base client for API interactions
- `RequestBuilder.ts`: Builder pattern for API request construction
- `ResponseHandler.ts`: Response validation and processing
- `ApiInterceptor.ts`: Intercepts API calls for monitoring and validation
- `McpServer.ts`: Model Context Protocol server implementation

### Web Testing Framework

- `BasePage.ts`: Base page object with common functionality
- `LocatorResolver.ts`: Dynamically resolves locators
- `SelfHealingHandler.ts`: Handles self-healing of broken locators
- `WebHelpers.ts`: Helper functions for web testing

### Common Utilities

- `AllureApiLogger.ts`: Logs API actions to Allure reports
- `ExcelFileReader.ts`: Reads test data from Excel files
- `TestDataGenerator.ts`: Generates dynamic test data
- `Hooks.ts`: Before/after test hooks
- `PlaywrightUtils.ts`: Playwright-specific utilities

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/playwright-mcp-cursorai.git
   cd playwright-mcp-cursorai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

### Environment Configuration

Configure environment variables in a `.env` file in the root directory or set them directly in your environment:

```
# Browser settings
BROWSER=chrome
BASE_URL=http://your-application-url.com

# Test execution settings
DEFAULT_TIMEOUT=30000
BROWSER_LOGS_ENABLED=false
PWVIDEO=false

# API settings
API_BASE_URL=http://your-api-url.com/api
AUTH_TOKEN=your-auth-token
```

## Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run API Tests

```bash
npx playwright test src/tests/api
```

### Run Web Tests

```bash
npx playwright test src/tests/web
```

### Run Tests in Specific Browser

```bash
npx playwright test --project=chromium
```

### Run Tests with Headed Mode

```bash
npx playwright test --headed
```

### Run Tests and Generate Allure Report

```bash
npx playwright test
npx allure generate ./allure-results -o ./allure-report --clean
npx allure open ./allure-report
```

## Framework Features

1. **Page Object Model**: Structured approach to UI test automation
2. **Self-Healing Locators**: Automatically adjust to UI changes
3. **API Request/Response Handling**: Streamlined API testing
4. **Cross-Browser Testing**: Test on multiple browsers
5. **Allure Reporting**: Detailed test reports
6. **Data-Driven Testing**: Support for data-driven tests
7. **Environment Configurations**: Test across multiple environments

## Best Practices for Writing Tests

1. Use Page Object Model for UI tests
2. Keep tests independent of each other
3. Use descriptive test names
4. Leverage fixtures for test setup
5. Prefer API setup for UI test prerequisites
6. Use data generators for dynamic test data
7. Add appropriate assertions
8. Include cleanup steps in teardown

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request