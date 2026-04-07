import { describe, it, expect, afterEach } from 'vitest';
import { useActiveRole } from '~/composables/useActiveRole';

// globalRole is module-level — reset to the default 'employer' after every test
// to prevent state leaking between tests.
afterEach(() => {
  useActiveRole().setRole('employer');
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
  it('changes role to "worker"', () => {
    const { role, setRole } = useActiveRole();
    setRole('worker');
    expect(role.value).toBe('worker');
  });

  it('changes role back to "employer"', () => {
    const { role, setRole } = useActiveRole();
    setRole('worker');
    setRole('employer');
    expect(role.value).toBe('employer');
  });

  it('updates isEmployer reactively when switching to worker', () => {
    const { isEmployer, setRole } = useActiveRole();
    setRole('worker');
    expect(isEmployer.value).toBe(false);
  });

  it('updates isWorker reactively when switching to worker', () => {
    const { isWorker, setRole } = useActiveRole();
    setRole('worker');
    expect(isWorker.value).toBe(true);
  });

  it('updates isEmployer reactively when switching back to employer', () => {
    const { isEmployer, setRole } = useActiveRole();
    setRole('worker');
    setRole('employer');
    expect(isEmployer.value).toBe(true);
  });

  it('updates isWorker reactively when switching back to employer', () => {
    const { isWorker, setRole } = useActiveRole();
    setRole('worker');
    setRole('employer');
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

// ─── Global state sharing across instances ───────────────────────────────────

describe('global state — shared across separate useActiveRole() calls', () => {
  it('change made via one instance is visible in another', () => {
    const a = useActiveRole();
    const b = useActiveRole();

    a.setRole('worker');

    expect(b.role.value).toBe('worker');
  });

  it('isWorker on a second instance reflects change from the first', () => {
    const a = useActiveRole();
    const b = useActiveRole();

    a.setRole('worker');

    expect(b.isWorker.value).toBe(true);
    expect(b.isEmployer.value).toBe(false);
  });

  it('change via role.value setter on one instance is visible on another', () => {
    const a = useActiveRole();
    const b = useActiveRole();

    a.role.value = 'worker';

    expect(b.role.value).toBe('worker');
  });

  it('both instances agree after multiple switches', () => {
    const a = useActiveRole();
    const b = useActiveRole();

    a.setRole('worker');
    b.setRole('employer');
    a.setRole('worker');

    expect(a.role.value).toBe('worker');
    expect(b.role.value).toBe('worker');
  });
});

// ─── State persistence across sequential calls ────────────────────────────────

describe('state persistence', () => {
  it('role set in a previous call is visible in the next call (no reset)', () => {
    useActiveRole().setRole('worker');

    // New call — no reset in between
    const { role } = useActiveRole();
    expect(role.value).toBe('worker');
  });

  it('isWorker persists for a fresh instance after a previous setRole', () => {
    useActiveRole().setRole('worker');

    const { isWorker } = useActiveRole();
    expect(isWorker.value).toBe(true);
  });
});
