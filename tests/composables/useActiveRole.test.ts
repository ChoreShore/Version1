import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActiveRole } from '~/composables/useActiveRole';

beforeEach(() => {
  vi.clearAllMocks();
  (globalThis as any).$fetch = vi.fn().mockResolvedValue({ user: { roles: ['employer', 'worker'] } });
});

// ─── Initial state ────────────────────────────────────────────────────────────

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

// ─── setRole ──────────────────────────────────────────────────────────────────

describe('setRole', () => {
  it('changes role to "worker"', async () => {
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

  it('updates isEmployer reactively when switching back to employer', async () => {
    const { isEmployer, setRole } = useActiveRole();
    await setRole('worker');
    await setRole('employer');
    expect(isEmployer.value).toBe(true);
  });

  it('updates isWorker reactively when switching back to employer', async () => {
    const { isWorker, setRole } = useActiveRole();
    await setRole('worker');
    await setRole('employer');
    expect(isWorker.value).toBe(false);
  });
});

// ─── role writable computed ───────────────────────────────────────────────────

describe('role writable computed (role.value = ...)', () => {
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

