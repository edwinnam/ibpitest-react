# IBPI React Test Setup

This directory contains the test setup for the IBPI React application, with a focus on testing the report generation functionality.

## Test Structure

```
src/test/
├── setup.js                    # Test environment setup
├── mocks/                      # Mock data and utilities
│   ├── reportData.js          # Mock report data
│   └── supabase.js            # Mock Supabase client
├── integration/                # Integration tests
│   └── reportGeneration.test.js
└── debug/                      # Debug and diagnostic tests
    └── databaseConnection.test.js
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Specific Test Suites

```bash
# Test report data service
npm run test:report

# Test report components
npm run test:components

# Test integration flows
npm run test:integration
```

## Test Categories

### 1. Unit Tests

**Location**: `src/services/__tests__/`, `src/components/reports/__tests__/`

These tests focus on individual functions and components in isolation:
- `reportDataService.test.js` - Tests the report data fetching and processing
- `IBPIReport.test.jsx` - Tests the main report component

### 2. Integration Tests

**Location**: `src/test/integration/`

These tests verify complete workflows:
- `reportGeneration.test.js` - Tests the full report generation flow

### 3. Debug Tests

**Location**: `src/test/debug/`

These tests help diagnose issues:
- `databaseConnection.test.js` - Verifies database connectivity and configuration

## Mock Data

The `mocks/reportData.js` file contains comprehensive mock data for:
- Customer information
- Test results
- Final scores
- Statistical calculations
- Group data
- Interpretations

## Debugging Failed Tests

### Database Connection Issues

If tests fail due to database connection:

1. Run the debug test:
   ```bash
   npx vitest run src/test/debug/databaseConnection.test.js
   ```

2. Check your `.env` file has correct values:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Verify the Supabase instance is running and accessible

### Component Rendering Issues

If component tests fail:

1. Check console output for React errors
2. Verify all required props are provided in tests
3. Check for missing mock implementations

## Writing New Tests

### Service Test Template

```javascript
import { describe, it, expect, vi } from 'vitest'
import { yourService } from '../yourService'

describe('YourService', () => {
  it('should do something', async () => {
    // Arrange
    const mockData = { /* ... */ }
    
    // Act
    const result = await yourService.someMethod(mockData)
    
    // Assert
    expect(result).toBeDefined()
    expect(result.someProperty).toBe('expected value')
  })
})
```

### Component Test Template

```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop1="value1" />)
    
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Continuous Integration

The test suite is designed to run in CI environments:

```bash
# Run for CI
npm run test:run
```

This will:
- Run all tests once
- Exit with appropriate code
- Generate coverage reports

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   - Check import paths
   - Verify all dependencies are installed

2. **"ReferenceError: window is not defined"**
   - Ensure test is using jsdom environment
   - Check that setup.js is loaded

3. **Async test timeouts**
   - Increase timeout for slow operations
   - Mock external API calls

### Getting Help

If tests continue to fail:
1. Check the console output for detailed errors
2. Run tests in watch mode for faster debugging
3. Use the test UI for visual debugging