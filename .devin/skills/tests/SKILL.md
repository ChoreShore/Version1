---
name: tests
description: Testing strategies and patterns for JavaScript/TypeScript applications. Use when writing unit tests, integration tests, or when the user mentions testing, Jest, Vitest, React Testing Library, or test coverage.
---

# Testing

Write effective, maintainable tests.

## Test Structure

### AAA Pattern
```typescript
test('should calculate total with discount', () => {
  // Arrange
  const cart = new Cart();
  cart.addItem({ price: 100, quantity: 2 });

  // Act
  const total = cart.calculateTotal({ discountPercent: 10 });

  // Assert
  expect(total).toBe(180);
});
```

### Descriptive Names
```typescript
// Good - describes behavior
test('returns empty array when no users match filter')
test('throws ValidationError when email is invalid')

// Bad - vague
test('filter works')
test('handles error')
```

## Unit Tests

### Pure Functions
```typescript
// Function
function calculateDiscount(price: number, percent: number): number {
  return price * (1 - percent / 100);
}

// Tests
describe('calculateDiscount', () => {
  test('applies percentage discount correctly', () => {
    expect(calculateDiscount(100, 20)).toBe(80);
  });

  test('returns original price when discount is 0', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  test('returns 0 when discount is 100', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });
});
```

### Classes with Dependencies
```typescript
// Mock dependencies
const mockEmailService = {
  send: jest.fn().mockResolvedValue(true),
};

const mockUserRepo = {
  findById: jest.fn(),
  save: jest.fn(),
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService(mockUserRepo, mockEmailService);
  });

  test('sends welcome email after registration', async () => {
    mockUserRepo.save.mockResolvedValue({ id: '123', email: 'test@example.com' });

    await service.register({ email: 'test@example.com', password: 'secret' });

    expect(mockEmailService.send).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('Welcome')
    );
  });
});
```

## React Component Tests

### React Testing Library
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('LoginForm', () => {
  test('submits form with email and password', async () => {
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    // Use userEvent for realistic interactions
    await userEvent.type(screen.getByLabelText(/email/i), 'user@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'secret123',
    });
  });

  test('shows validation error for invalid email', async () => {
    render(<LoginForm onSubmit={jest.fn()} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'invalid');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });
});
```

### Async Operations
```typescript
test('displays user data after fetch', async () => {
  // Mock API
  jest.spyOn(api, 'fetchUser').mockResolvedValue({ name: 'John' });

  render(<UserProfile userId="123" />);

  // Wait for async content
  await waitFor(() => {
    expect(screen.getByText('John')).toBeInTheDocument();
  });
});

test('shows error state on fetch failure', async () => {
  jest.spyOn(api, 'fetchUser').mockRejectedValue(new Error('Not found'));

  render(<UserProfile userId="invalid" />);

  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## Integration Tests

```typescript
describe('Checkout Flow', () => {
  test('completes purchase with valid payment', async () => {
    // Setup test data
    const user = await createTestUser();
    const product = await createTestProduct({ price: 99.99 });

    // Simulate user journey
    render(<App />, { initialUser: user });

    // Add to cart
    await userEvent.click(screen.getByTestId(`add-${product.id}`));

    // Go to checkout
    await userEvent.click(screen.getByText(/checkout/i));

    // Fill payment
    await userEvent.type(screen.getByLabelText(/card/i), '4242424242424242');
    await userEvent.click(screen.getByText(/pay now/i));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking Patterns

### API Calls
```typescript
// Jest
jest.mock('../api/users');
const mockedApi = api as jest.Mocked<typeof api>;
mockedApi.fetchUsers.mockResolvedValue([{ id: 1, name: 'Test' }]);

// MSW (Mock Service Worker) - recommended for integration tests
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/users', (req, res, ctx) => {
    return res(ctx.json([{ id: 1, name: 'Test' }]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Timers
```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

test('debounces search input', async () => {
  render(<SearchInput onChange={mockOnChange} />);

  await userEvent.type(screen.getByRole('textbox'), 'test');

  // Callback not called yet
  expect(mockOnChange).not.toHaveBeenCalled();

  // Fast-forward debounce time
  jest.advanceTimersByTime(300);

  expect(mockOnChange).toHaveBeenCalledWith('test');
});
```

## Test Checklist

- [ ] Tests are independent (no shared state)
- [ ] Tests are deterministic (same result every run)
- [ ] Tests are fast (mock external dependencies)
- [ ] Tests describe behavior, not implementation
- [ ] Edge cases are covered
- [ ] Error cases are tested
- [ ] Async operations use proper waiting
- [ ] Mocks are reset between tests
