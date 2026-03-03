# Manisha - Nuxt 3 + Supabase Auth

## Setup

1. Copy `.env.example` to `.env` and fill in your Supabase credentials
2. Run `npm install`
3. Run SQL migrations in Supabase (see `supabase/schema.sql`)
4. Start dev server: `npm run dev`

## Features

- Email/password authentication
- Multi-role support (worker/employer)
- Profile management with RLS
- Password reset flow
- Password requirements: 12+ chars, uppercase, number, symbol
- Server-side validation
- TypeScript types

## Testing

Run tests with Vitest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

- `server/utils/*.test.ts` - Unit tests for server utilities
- `tests/server/*.test.ts` - Integration tests for API endpoints
- `tests/utils/*.test.ts` - Unit tests for shared utilities
