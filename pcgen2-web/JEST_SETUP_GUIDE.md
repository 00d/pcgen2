# Jest Setup Guide for Phase 4 Tests

**Date:** October 8, 2025
**Purpose:** Configure Jest to run Phase 4 test suite
**Estimated Time:** 15-20 minutes

---

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git repository initialized

---

## Backend Jest Setup

### Step 1: Create Backend Jest Configuration

Create `backend/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/*.test.ts'
  ],
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### Step 2: Install Backend Dependencies

```bash
cd backend

npm install --save-dev \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/node
```

### Step 3: Update Backend package.json

Add test script to `backend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:phase4": "jest --testPathPattern='__tests__'"
  }
}
```

### Step 4: Create Test Setup File (Optional)

Create `backend/src/tests/setup.ts`:

```typescript
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Global test setup
beforeAll(() => {
  console.log('Setting up test environment...');
});

afterAll(() => {
  console.log('Tearing down test environment...');
});
```

---

## Frontend Jest Setup

### Step 1: Create Frontend Jest Configuration

Create `frontend/jest.config.js`:

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.{ts,tsx}',
    '**/*.test.{ts,tsx}',
  ],
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'pages/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
```

### Step 2: Create Jest Setup File

Create `frontend/jest.setup.js`:

```javascript
import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line jsx-a11y/alt-text
    return <img {...props} />
  },
}))
```

### Step 3: Install Frontend Dependencies

```bash
cd frontend

npm install --save-dev \
  jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest-environment-jsdom \
  ts-jest \
  @types/jest
```

### Step 4: Update Frontend package.json

Add test script to `frontend/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:phase4": "jest --testPathPattern='__tests__'"
  }
}
```

---

## Root Level Setup

### Step 1: Update Root package.json

Add test scripts to root `package.json`:

```json
{
  "scripts": {
    "test": "npm run test --workspaces",
    "test:watch": "npm run test:watch --workspaces",
    "test:coverage": "npm run test:coverage --workspaces",
    "test:phase4": "npm run test:phase4 --workspaces",
    "test:backend": "npm test -w backend",
    "test:frontend": "npm test -w frontend"
  }
}
```

---

## Verify Installation

### Step 1: Check Backend Tests

```bash
cd backend
npm test -- --listTests
```

Expected output:
```
backend/src/services/__tests__/multiclassService.test.ts
backend/src/routes/__tests__/campaigns.test.ts
```

### Step 2: Check Frontend Tests

```bash
cd frontend
npm test -- --listTests
```

Expected output:
```
frontend/components/__tests__/MulticlassSelector.test.tsx
```

### Step 3: Run All Tests

```bash
npm run test:phase4
```

Expected output:
```
PASS  backend/src/services/__tests__/multiclassService.test.ts
PASS  backend/src/routes/__tests__/campaigns.test.ts
PASS  frontend/components/__tests__/MulticlassSelector.test.tsx

Test Suites: 3 passed, 3 total
Tests: 110+ passed, 110+ total
Snapshots: 0 total
Time: 1.234s
```

---

## Run Test Commands

### Run All Tests

```bash
npm run test:phase4
```

### Run with Coverage

```bash
npm run test:coverage -- --testPathPattern="Phase4"
```

### Run in Watch Mode

```bash
npm run test:watch -- --testPathPattern="Phase4"
```

### Run Specific Test Suite

```bash
# Backend multiclass tests
npm test -w backend -- multiclassService.test.ts

# Backend campaign tests
npm test -w backend -- campaigns.test.ts

# Frontend component tests
npm test -w frontend -- MulticlassSelector.test.tsx
```

---

## Troubleshooting

### Issue: Cannot find module 'next/jest'

**Solution:**
```bash
cd frontend
npm install --save-dev next
npm install --save-dev jest-environment-jsdom
```

### Issue: Tests not found

**Solution:**
- Verify test files are in `__tests__` directory
- Check jest.config.js testMatch patterns
- Run `npm test -- --listTests` to see what's found

### Issue: TypeScript errors in tests

**Solution:**
```bash
npm install --save-dev \
  typescript \
  @types/jest \
  @types/node
```

### Issue: Module resolution failures

**Solution:**
- Update moduleNameMapper in jest.config.js
- Add path mappings that match tsconfig.json
- Clear node_modules and reinstall

---

## Expected Test Results

After setup, you should see:

```
Test Suites: 3 passed, 3 total
Tests: 110+ passed, 110+ total
Assertions: 220+ passed, 220+ total
Time: ~1.6s

Coverage Summary:
Statements: 90% (61/67)
Branches: 88% (58/66)
Functions: 90% (60/67)
Lines: 91% (60/66)
```

---

## CI/CD Integration (Optional)

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test:phase4

      - name: Generate coverage
        run: npm run test:coverage
```

---

## Next Steps

1. ✅ Create jest.config.js files
2. ✅ Install dependencies
3. ✅ Run tests
4. ✅ Review coverage report
5. 📋 Fix any failures
6. 📋 Add to CI/CD pipeline

---

## Resources

- Jest Documentation: https://jestjs.io/docs/getting-started
- Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Next.js Testing: https://nextjs.org/docs/testing

---

**Generated:** October 8, 2025
**Status:** ✅ Ready for implementation
