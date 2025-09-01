# Poll Actions Test Suite

This directory contains comprehensive tests for all poll-related server actions.

## Test Structure

```
__tests__/
├── actions/
│   ├── create-poll.test.ts    # Tests for poll creation
│   ├── update-poll.test.ts    # Tests for poll updates
│   ├── delete-poll.test.ts    # Tests for poll deletion
│   ├── submit-vote.test.ts    # Tests for vote submission
│   └── index.test.ts          # Test suite runner
├── utils/
│   └── test-utils.ts          # Test utilities and mocks
└── README.md                  # This file
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test create-poll.test.ts
```

## Test Coverage

The test suite covers:

### Create Poll Action
- ✅ Input validation (question length, options count, uniqueness)
- ✅ Authentication checks
- ✅ Successful poll creation
- ✅ Database error handling
- ✅ Redirect functionality

### Update Poll Action
- ✅ Input validation
- ✅ Authentication checks
- ✅ Poll ownership validation
- ✅ Successful poll updates
- ✅ Database error handling
- ✅ Redirect functionality

### Delete Poll Action
- ✅ Authentication checks
- ✅ Poll ownership validation
- ✅ Successful poll deletion
- ✅ Database error handling
- ✅ Redirect functionality

### Submit Vote Action
- ✅ Poll existence validation
- ✅ Poll expiration checks
- ✅ Option index validation
- ✅ Duplicate vote prevention
- ✅ Anonymous voting support
- ✅ Authenticated user voting
- ✅ Database error handling

## Test Utilities

### Mock Data
- `mockUser`: Sample user data
- `mockPoll`: Sample poll data
- `mockVote`: Sample vote data
- `mockSupabaseResponses`: Predefined Supabase responses

### Helper Functions
- `setupSupabaseMock()`: Configure Supabase mocks
- `createValidPollInput()`: Generate valid poll input
- `createInvalidPollInput()`: Generate invalid poll input

## Mocking Strategy

### Supabase Client
- All Supabase operations are mocked
- Different response scenarios are supported
- Authentication state can be controlled

### Next.js Functions
- `revalidatePath()` is mocked
- `redirect()` is mocked
- Router functions are mocked

## Test Patterns

### Success Cases
- Valid input with authenticated user
- Proper database responses
- Correct revalidation calls

### Error Cases
- Invalid input validation
- Unauthenticated users
- Database errors
- Permission violations

### Edge Cases
- Expired polls
- Duplicate votes
- Anonymous voting
- Missing data

## Adding New Tests

1. Create test file in appropriate directory
2. Import test utilities from `../utils/test-utils`
3. Follow existing patterns for mocking
4. Test both success and error scenarios
5. Include edge cases and validation tests

## Coverage Goals

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

Current coverage is tracked in the Jest configuration and can be viewed by running `npm run test:coverage`.
