import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import SignInPage from '~/pages/auth/sign-in.vue';

const mockSignInWithPassword = vi.fn();
const mockFrom = vi.fn();
const mockAuthGetSession = vi.fn();
const mockUser = ref<any>(null);

vi.mock('#imports', () => ({
  useSupabaseUser: () => mockUser,
  useSupabaseClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      getSession: mockAuthGetSession
    },
    from: mockFrom
  }),
  definePageMeta: vi.fn()
}));

const mockNavigateTo = vi.fn();
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).navigateTo = mockNavigateTo;

const stubs = {
  LoadingSkeleton: true,
  NuxtLink: true
};

function createWrapper() {
  return mount(SignInPage, { global: { stubs } });
}

function setInputs(wrapper: any, email: string, password: string) {
  const inputs = wrapper.findAll('input');
  if (inputs[0]) { inputs[0].setValue(email); inputs[0].trigger('input'); }
  if (inputs[1]) { inputs[1].setValue(password); inputs[1].trigger('input'); }
}

describe('Sign-In Page – rendering', () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockFrom.mockReset();
    mockAuthGetSession.mockReset();
    mockNavigateTo.mockReset();
    mockUser.value = null;
  });

  it('renders the page heading and description', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('h1').text()).toBe('Sign in to HireBeHired');
    expect(wrapper.text()).toContain('Continue managing jobs');
  });

  it('renders email and password inputs', () => {
    const wrapper = createWrapper();
    const inputs = wrapper.findAll('input');
    expect(inputs).toHaveLength(2);
    expect(inputs[0].attributes('type')).toBe('email');
    expect(inputs[1].attributes('type')).toBe('password');
  });

  it('renders a submit button', () => {
    const wrapper = createWrapper();
    const btn = wrapper.find('button[type="submit"]');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Sign in');
  });

  it('renders reset-password and sign-up navigation links', () => {
    const wrapper = createWrapper();
    const links = wrapper.findAllComponents({ name: 'NuxtLink' });
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});

describe('Sign-In Page – form validation', () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockFrom.mockReset();
    mockNavigateTo.mockReset();
    mockUser.value = null;
  });

  it('shows error when email is invalid', async () => {
    const wrapper = createWrapper();
    const emailInput = wrapper.findAll('input')[0];
    emailInput.setValue('not-an-email');
    emailInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeTruthy();
  });

  it('clears email error when valid email is entered', async () => {
    const wrapper = createWrapper();
    const emailInput = wrapper.findAll('input')[0];
    emailInput.setValue('bad');
    emailInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeTruthy();
    emailInput.setValue('valid@example.com');
    emailInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeFalsy();
  });

  it('shows error when password is shorter than 8 characters', async () => {
    const wrapper = createWrapper();
    const pwdInput = wrapper.findAll('input')[1];
    pwdInput.setValue('short');
    pwdInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeTruthy();
  });

  it('clears password error when password is valid', async () => {
    const wrapper = createWrapper();
    const pwdInput = wrapper.findAll('input')[1];
    pwdInput.setValue('short');
    pwdInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeTruthy();
    pwdInput.setValue('password123');
    pwdInput.trigger('input');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeFalsy();
  });
});

describe('Sign-In Page – canSubmit', () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockFrom.mockReset();
    mockNavigateTo.mockReset();
    mockUser.value = null;
  });

  it('is false when fields are empty', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.canSubmit).toBeFalsy();
  });

  it('is false when password is less than 8 chars', async () => {
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'short');
    await nextTick();
    expect(wrapper.vm.canSubmit).toBe(false);
  });

  it('is true when email and password (>= 8) are valid', async () => {
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'password123');
    await nextTick();
    expect(wrapper.vm.canSubmit).toBe(true);
  });

  it('is false when validation errors exist', async () => {
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'password123');
    await nextTick();
    wrapper.vm.errors = { email: 'some error' };
    await nextTick();
    expect(wrapper.vm.canSubmit).toBe(false);
  });
});

describe('Sign-In Page – getFieldState', () => {
  beforeEach(() => {
    mockUser.value = null;
  });

  it('returns "error" when field has an error', () => {
    const wrapper = createWrapper();
    wrapper.vm.errors = { email: 'bad' };
    expect(wrapper.vm.getFieldState('email')).toBe('error');
  });

  it('returns "success" when field is touched and valid', async () => {
    const wrapper = createWrapper();
    wrapper.vm.touchedFields.add('email');
    wrapper.vm.email = 'valid@example.com';
    await nextTick();
    expect(wrapper.vm.getFieldState('email')).toBe('success');
  });

  it('returns "default" when field is untouched', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.getFieldState('email')).toBe('default');
  });
});

describe('Sign-In Page – handleSignIn', () => {
  beforeEach(() => {
    mockSignInWithPassword.mockReset();
    mockFrom.mockReset();
    mockAuthGetSession.mockReset();
    mockNavigateTo.mockReset();
    mockUser.value = null;
  });

  it('calls signInWithPassword with email and password', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    mockAuthGetSession.mockResolvedValue({});
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { photo_url: 'x', roles: ['employer'], onboarding_completed: true }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'password123');
    await nextTick();
    wrapper.vm.handleSignIn();
    await flushPromises();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: 'valid@example.com', password: 'password123' });
  });

  it('shows error message when sign-in fails', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } });
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'password123');
    await nextTick();
    await wrapper.vm.handleSignIn();
    expect(wrapper.vm.errorMessage).toBe('Invalid credentials');
  });

  it('does not call signInWithPassword when canSubmit is false', async () => {
    const wrapper = createWrapper();
    setInputs(wrapper, '', '');
    await nextTick();
    await wrapper.vm.handleSignIn();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('sets loading to true during submission and false after', async () => {
    let resolveFn: () => void;
    mockSignInWithPassword.mockReturnValue(new Promise(resolve => { resolveFn = () => resolve({ error: null }); }));
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { photo_url: 'x', roles: ['employer'], onboarding_completed: true }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    setInputs(wrapper, 'valid@example.com', 'password123');
    await nextTick();
    wrapper.vm.handleSignIn();
    await nextTick();
    expect(wrapper.vm.loading).toBe(true);
    resolveFn!();
    await flushPromises();
    expect(wrapper.vm.loading).toBe(false);
  });
});

describe('Sign-In Page – checkPhotoAndRedirect', () => {
  beforeEach(() => {
    mockFrom.mockReset();
    mockNavigateTo.mockReset();
    mockUser.value = { id: 'user-1' };
  });

  it('redirects to /auth/complete-profile when no photo_url', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { photo_url: null, roles: ['employer'], onboarding_completed: true }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await wrapper.vm.checkPhotoAndRedirect();
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/complete-profile');
  });

  it('redirects to /auth/onboarding when worker has not completed onboarding', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { photo_url: 'x', roles: ['worker'], onboarding_completed: false }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await wrapper.vm.checkPhotoAndRedirect();
    expect(mockNavigateTo).toHaveBeenCalledWith('/auth/onboarding');
  });

  it('redirects to /dashboard when photo exists and onboarding completed', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { photo_url: 'x', roles: ['worker'], onboarding_completed: true }, error: null })
        })
      })
    });
    const wrapper = createWrapper();
    await wrapper.vm.checkPhotoAndRedirect();
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to /dashboard when profile query errors', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'row not found' } })
        })
      })
    });
    const wrapper = createWrapper();
    await wrapper.vm.checkPhotoAndRedirect();
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects to /dashboard when user is null', async () => {
    mockUser.value = null;
    const wrapper = createWrapper();
    await wrapper.vm.checkPhotoAndRedirect();
    expect(mockNavigateTo).toHaveBeenCalledWith('/dashboard');
  });
});

describe('Sign-In Page – handleFormReset', () => {
  it('clears all form state', async () => {
    const wrapper = createWrapper();
    wrapper.vm.email = 'test@example.com';
    wrapper.vm.password = 'password123';
    wrapper.vm.errorMessage = 'some error';
    wrapper.vm.errors = { email: 'bad' };
    await nextTick();
    wrapper.vm.handleFormReset();
    await nextTick();
    expect(wrapper.vm.email).toBe('');
    expect(wrapper.vm.password).toBe('');
    expect(wrapper.vm.errorMessage).toBe('');
    expect(wrapper.vm.errors).toEqual({});
  });
});

describe('Sign-In Page – loading state', () => {
  beforeEach(() => {
    mockUser.value = null;
  });

  it('disables inputs when loading', async () => {
    const wrapper = createWrapper();
    wrapper.vm.loading = true;
    await nextTick();
    const inputs = wrapper.findAll('input');
    expect(inputs[0].attributes('disabled')).toBeDefined();
    expect(inputs[1].attributes('disabled')).toBeDefined();
  });

  it('disables submit button when loading', async () => {
    const wrapper = createWrapper();
    wrapper.vm.loading = true;
    await nextTick();
    const btn = wrapper.find('button[type="submit"]');
    expect(btn.attributes('disabled')).toBeDefined();
  });
});
