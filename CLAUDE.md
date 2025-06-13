# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

IBPI (Korean Interpersonal Balance Psychology Test) React application - a multi-tenant psychological assessment platform with test management, report generation, and organization management capabilities.

## Key Commands

### Development
```bash
# Install dependencies
npm install

# Start development server (port 5175)
npm run dev

# Start both dev server and SMS proxy
npm run dev:all

# Start SMS proxy server only
npm run sms-proxy
```

### Build & Production
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Testing
```bash
# Run tests in watch mode
npm test

# Run all tests once
npm run test:run

# Run with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Test specific components
npm run test:components
npm run test:report
npm run test:integration
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 with Vite
- **Routing**: React Router v7
- **State Management**: Zustand (local) + React Query (server)
- **Database**: Supabase (PostgreSQL with real-time)
- **Authentication**: Supabase Auth with custom AuthContext
- **Testing**: Vitest with React Testing Library

### Core Architecture Patterns

1. **Multi-tenant System**: Organizations manage their own test codes, customers, and results with row-level security.

2. **State Management Strategy**:
   - Server state handled by React Query with caching
   - Local state in Zustand stores (`useTestStore`, `useOrganizationStore`)
   - Auth state in AuthContext

3. **Test Flow**:
   - Organizations generate test codes → Send via SMS/email → Customers use codes → Take tests → Generate scores → View/download reports

4. **Service Layer Pattern**: All API calls go through service modules in `/src/core/services/`:
   - `supabase.js` - Database client and helpers
   - `organizationService.js` - Organization CRUD
   - `testCodeService.js` - Test code management
   - `smsService.js` - SMS integration

### Key Database Tables
- `organizations` - Test institutions
- `customers_info` - Test taker data
- `test_codes` - Access codes
- `test_results` - Raw responses
- `test_scores` - Processed scores
- `final_scores` - Categorized results

### Important Implementation Details

1. **Authentication Flow**: Protected routes use `ProtectedRoute` component that checks Supabase session. Organization users see different UI than customers.

2. **Test Types**: Support for Adult, Youth, and Child versions with different question sets in `/src/data/questions/`.

3. **Report Generation**: PDF reports generated using React PDF with custom components in `/src/components/reports/`.

4. **SMS Proxy**: Local proxy server (`sms-proxy-server.cjs`) handles SMS sending to avoid CORS issues.

5. **Environment Variables**: Required in `.env`:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Known Issues

- CustomerInfoForm: Next button remains disabled after filling all required fields - requires investigation in `/src/pages/customer/CustomerInfoForm.jsx`

## Development Guidelines

1. **API Calls**: Always use service modules, never call Supabase directly from components
2. **Error Handling**: Use React Query's error states for API errors
3. **Testing**: Write tests for new features, mock Supabase calls using existing patterns
4. **Korean Text**: Maintain Korean language support throughout the application