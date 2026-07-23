import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useActiveRole } from '~/composables/useActiveRole';

const mockFetch = vi.fn();

const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = String(value); }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { for (const k of Object.keys(store)) delete store[k]; }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    length: 0
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  (globalThis as any).localStorage = localStorageMock;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFetch.mockResolvedValue({ user: { roles: ['employer', 'worker'] } });
  (globalThis as any).$fetch = mockFetch;
  localStorage.clear();
  const { role } = useActiveRole();
  role.value = 'employer';
});

afterEach(() => {
  localStorage.clear();
});

describe('initial state', () => {
  it('defaults role to "employer"', () => {
    const { role } = useActiveRole();
    expect(role.value).toBe('employer');
  });

  it('isEmployer is true by default', () => {
    const { isEmployer } = useActiveRole();
    expect(isEmployer.value).toBe(true);
  });

  it('isWorker is false by default', () => {
    const { isWorker } = useActiveRole();
    expect(isWorker.value).toBe(false);
  });
});

describe('setRole', () => {
  it('changes role to "worker" when user has the role', async () => {
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    expect(role.value).toBe('worker');
  });

  it('changes role back to "employer"', async () => {
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    await setRole('employer');
    expect(role.value).toBe('employer');
  });

  it('updates isEmployer reactively when switching to worker', async () => {
    const { isEmployer, setRole } = useActiveRole();
    await setRole('worker');
    expect(isEmployer.value).toBe(false);
  });

  it('updates isWorker reactively when switching to worker', async () => {
    const { isWorker, setRole } = useActiveRole();
    await setRole('worker');
    expect(isWorker.value).toBe(true);
  });

  it('does not change role when user lacks the role', async () => {
    mockFetch.mockResolvedValue({ user: { roles: ['employer'] } });
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    expect(role.value).toBe('employer');
  });

  it('persists role to localStorage', async () => {
    const { setRole } = useActiveRole();
    await setRole('worker');
    expect(localStorage.getItem('active-role')).toBe('worker');
  });

  it('fetches user roles from /api/auth/me', async () => {
    const { setRole } = useActiveRole();
    await setRole('worker');
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/me');
  });
});

describe('setRole error handling', () => {
  it('does not change role when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('network'));
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    expect(role.value).toBe('employer');
  });

  it('does not change role when response has no roles', async () => {
    mockFetch.mockResolvedValue({ user: {} });
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    expect(role.value).toBe('employer');
  });

  it('does not change role when response is empty', async () => {
    mockFetch.mockResolvedValue({});
    const { role, setRole } = useActiveRole();
    await setRole('worker');
    expect(role.value).toBe('employer');
  });
});

describe('role writable ref', () => {
  it('setting role.value to "worker" updates the role', () => {
    const { role } = useActiveRole();
    role.value = 'worker';
    expect(role.value).toBe('worker');
  });

  it('setting role.value updates isWorker', () => {
    const { role, isWorker } = useActiveRole();
    role.value = 'worker';
    expect(isWorker.value).toBe(true);
  });

  it('setting role.value to "employer" updates isEmployer', () => {
    const { role, isEmployer } = useActiveRole();
    role.value = 'worker';
    role.value = 'employer';
    expect(isEmployer.value).toBe(true);
  });
});
