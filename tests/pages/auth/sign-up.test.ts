import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { ref, nextTick } from 'vue';
import SignUpPage from '~/pages/auth/sign-up.vue';

const mockRouterPush = vi.fn();
const mockSignup = vi.fn();

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockRouterPush })
}));

vi.mock('~/composables/useAuth', () => ({
  useAuth: () => ({
    user: ref(null),
    signup: mockSignup
  })
}));

vi.mock('~/composables/useDirtyForm', () => ({
  useDirtyForm: () => ({
    isDirty: ref(false),
    resetDirty: vi.fn()
  })
}));

const mockFetch = vi.fn();
(globalThis as any).definePageMeta = vi.fn();
(globalThis as any).$fetch = mockFetch;

const stubs = {
  LoadingSkeleton: true,
  ConfirmDialog: true
};

function createWrapper() {
  return mount(SignUpPage, { global: { stubs } });
}

function fillStep1(wrapper: any, overrides: Record<string, any> = {}) {
  const form = wrapper.vm.form;
  form.email = overrides.email ?? 'valid@example.com';
  form.password = overrides.password ?? 'Password1';
  form.confirmPassword = overrides.confirmPassword ?? 'Password1';
  form.role = overrides.role ?? 'worker';
}

function fillStep2(wrapper: any, overrides: Record<string, any> = {}) {
  const form = wrapper.vm.form;
  form.first_name = overrides.first_name ?? 'John';
  form.last_name = overrides.last_name ?? 'Doe';
  form.username = overrides.username ?? 'johndoe';
  form.postcode = overrides.postcode ?? 'SW1A 1AA';
  form.age_confirmation = overrides.age_confirmation ?? true;
  form.terms_agreement = overrides.terms_agreement ?? true;
  form.tax_responsibility = overrides.tax_responsibility ?? true;
}

describe('Sign-Up Page – rendering', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockSignup.mockReset();
    mockFetch.mockReset();
  });

  it('renders the page title and subtitle', () => {
    const wrapper = createWrapper();
    expect(wrapper.find('h1').text()).toBe('Create Account');
    expect(wrapper.text()).toContain('Join HireBeHired');
  });

  it('starts on step 1 with email and password fields', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.currentStep).toBe(1);
    expect(wrapper.find('input[type="email"]').exists()).toBe(true);
    expect(wrapper.find('input[type="password"]').exists()).toBe(true);
  });

  it('renders role select with employer and worker options', () => {
    const wrapper = createWrapper();
    const select = wrapper.find('select');
    expect(select.exists()).toBe(true);
    const options = select.findAll('option');
    expect(options.length).toBeGreaterThanOrEqual(3);
  });

  it('renders Continue button on step 1', () => {
    const wrapper = createWrapper();
    const btn = wrapper.find('.auth-form__submit');
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toContain('Continue');
  });
});

describe('Sign-Up Page – step 1 validation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('shows error for invalid email', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.email = 'not-an-email';
    wrapper.vm.validateField('email');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeTruthy();
  });

  it('clears error for valid email', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.email = 'bad';
    wrapper.vm.validateField('email');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeTruthy();
    wrapper.vm.form.email = 'valid@example.com';
    wrapper.vm.validateField('email');
    await nextTick();
    expect(wrapper.vm.errors.email).toBeFalsy();
  });

  it('shows error for password shorter than 8 chars', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.password = 'short';
    wrapper.vm.validateField('password');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeTruthy();
  });

  it('shows error for password missing uppercase', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.password = 'password1';
    wrapper.vm.validateField('password');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeTruthy();
  });

  it('clears error for valid password', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.password = 'Password1';
    wrapper.vm.validateField('password');
    await nextTick();
    expect(wrapper.vm.errors.password).toBeFalsy();
  });

  it('shows error when passwords do not match', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.password = 'Password1';
    wrapper.vm.form.confirmPassword = 'Password2';
    wrapper.vm.validateConfirmPassword();
    await nextTick();
    expect(wrapper.vm.errors.confirmPassword).toContain("don't match");
  });

  it('clears error when passwords match', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.password = 'Password1';
    wrapper.vm.form.confirmPassword = 'Password2';
    wrapper.vm.validateConfirmPassword();
    await nextTick();
    expect(wrapper.vm.errors.confirmPassword).toBeTruthy();
    wrapper.vm.form.confirmPassword = 'Password1';
    wrapper.vm.validateConfirmPassword();
    await nextTick();
    expect(wrapper.vm.errors.confirmPassword).toBeFalsy();
  });

  it('shows error when role is empty', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.role = '';
    wrapper.vm.validateField('role');
    await nextTick();
    expect(wrapper.vm.errors.role).toBeTruthy();
  });
});

describe('Sign-Up Page – canGoToStep2', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('is false when step 1 fields are empty', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.canGoToStep2).toBeFalsy();
  });

  it('is false when passwords do not match', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper, { confirmPassword: 'Different1' });
    await nextTick();
    expect(wrapper.vm.canGoToStep2).toBeFalsy();
  });

  it('is false when validation errors exist', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper, { email: 'bad' });
    await nextTick();
    wrapper.vm.validateField('email');
    await nextTick();
    expect(wrapper.vm.canGoToStep2).toBeFalsy();
  });

  it('is true when all step 1 fields are valid and passwords match', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper);
    await nextTick();
    expect(wrapper.vm.canGoToStep2).toBe(true);
  });
});

describe('Sign-Up Page – step navigation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('goToStep2 moves to step 2 when valid', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper);
    await nextTick();
    wrapper.vm.goToStep2();
    await nextTick();
    expect(wrapper.vm.currentStep).toBe(2);
  });

  it('goToStep2 stays on step 1 when invalid', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.email = 'bad';
    wrapper.vm.goToStep2();
    await nextTick();
    expect(wrapper.vm.currentStep).toBe(1);
  });

  it('goBackToStep1 returns to step 1', async () => {
    const wrapper = createWrapper();
    wrapper.vm.currentStep = 2;
    wrapper.vm.goBackToStep1();
    await nextTick();
    expect(wrapper.vm.currentStep).toBe(1);
  });
});

describe('Sign-Up Page – step 2 validation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('shows error for empty first_name', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.first_name = '';
    wrapper.vm.validateField('first_name');
    await nextTick();
    expect(wrapper.vm.errors.first_name).toBeTruthy();
  });

  it('shows error for empty last_name', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.last_name = '';
    wrapper.vm.validateField('last_name');
    await nextTick();
    expect(wrapper.vm.errors.last_name).toBeTruthy();
  });

  it('shows error for empty username', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.username = '';
    wrapper.vm.validateField('username');
    await nextTick();
    expect(wrapper.vm.errors.username).toBeTruthy();
  });

  it('shows error for invalid username format', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.username = 'invalid@user';
    wrapper.vm.validateField('username');
    await nextTick();
    expect(wrapper.vm.errors.username).toBeTruthy();
  });

  it('shows error for postcode shorter than 4 chars', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.postcode = 'SW1';
    wrapper.vm.validateField('postcode');
    await nextTick();
    expect(wrapper.vm.errors.postcode).toBeTruthy();
  });

  it('shows error when age_confirmation is false', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.age_confirmation = false;
    wrapper.vm.validateField('age_confirmation');
    await nextTick();
    expect(wrapper.vm.errors.age_confirmation).toBeTruthy();
  });

  it('shows error when terms_agreement is false', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.terms_agreement = false;
    wrapper.vm.validateField('terms_agreement');
    await nextTick();
    expect(wrapper.vm.errors.terms_agreement).toBeTruthy();
  });

  it('shows error when tax_responsibility is false', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.tax_responsibility = false;
    wrapper.vm.validateField('tax_responsibility');
    await nextTick();
    expect(wrapper.vm.errors.tax_responsibility).toBeTruthy();
  });
});

describe('Sign-Up Page – username availability', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sets usernameAvailable to true when available', async () => {
    mockFetch.mockResolvedValue({ available: true, username: 'johndoe' });
    const wrapper = createWrapper();
    wrapper.vm.form.username = 'johndoe';
    wrapper.vm.handleUsernameInput();
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(wrapper.vm.usernameAvailable).toBe(true);
  });

  it('sets usernameAvailable to false when taken', async () => {
    mockFetch.mockResolvedValue({ available: false, username: 'taken' });
    const wrapper = createWrapper();
    wrapper.vm.form.username = 'taken';
    wrapper.vm.handleUsernameInput();
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(wrapper.vm.usernameAvailable).toBe(false);
  });

  it('does not check availability for invalid format', async () => {
    mockFetch.mockResolvedValue({ available: true });
    const wrapper = createWrapper();
    wrapper.vm.form.username = 'invalid@user';
    wrapper.vm.handleUsernameInput();
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('resets usernameAvailable to null on new input', async () => {
    const wrapper = createWrapper();
    wrapper.vm.usernameAvailable = true;
    wrapper.vm.form.username = 'newuser';
    wrapper.vm.handleUsernameInput();
    expect(wrapper.vm.usernameAvailable).toBeNull();
  });
});

describe('Sign-Up Page – canSubmit', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('is false when step 2 fields are empty', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.canSubmit).toBeFalsy();
  });

  it('is false when checkboxes are unchecked', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper, { age_confirmation: false });
    await nextTick();
    expect(wrapper.vm.canSubmit).toBeFalsy();
  });

  it('is true when all fields are valid and checkboxes checked', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    expect(wrapper.vm.canSubmit).toBe(true);
  });
});

describe('Sign-Up Page – handleSubmit', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockSignup.mockReset();
    mockFetch.mockReset();
  });

  it('calls auth.signup with correct data on success', async () => {
    mockSignup.mockResolvedValue({});
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    wrapper.vm.handleSubmit();
    await flushPromises();
    expect(mockSignup).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'valid@example.com',
        password: 'Password1',
        username: 'johndoe',
        first_name: 'John',
        last_name: 'Doe',
        postcode: 'SW1A 1AA',
        role: 'worker'
      })
    );
  });

  it('sets success to true after successful signup', async () => {
    mockSignup.mockResolvedValue({});
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    await wrapper.vm.handleSubmit();
    expect(wrapper.vm.success).toBe(true);
  });

  it('sets loading to false after successful signup', async () => {
    mockSignup.mockResolvedValue({});
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    await wrapper.vm.handleSubmit();
    expect(wrapper.vm.loading).toBe(false);
  });

  it('sets submitError when signup fails', async () => {
    mockSignup.mockRejectedValue({ data: { statusMessage: 'Email already exists' } });
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    await wrapper.vm.handleSubmit();
    expect(wrapper.vm.submitError).toBe('Email already exists');
  });

  it('sets default error message when signup fails without statusMessage', async () => {
    mockSignup.mockRejectedValue(new Error('network'));
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    await nextTick();
    await wrapper.vm.handleSubmit();
    expect(wrapper.vm.submitError).toContain('Failed to create account');
  });

  it('does not call signup when form is invalid', async () => {
    const wrapper = createWrapper();
    wrapper.vm.form.email = 'bad';
    await nextTick();
    await wrapper.vm.handleSubmit();
    expect(mockSignup).not.toHaveBeenCalled();
  });
});

describe('Sign-Up Page – handleFormReset', () => {
  it('clears all form state and returns to step 1', async () => {
    const wrapper = createWrapper();
    fillStep1(wrapper);
    fillStep2(wrapper);
    wrapper.vm.currentStep = 2;
    wrapper.vm.submitError = 'some error';
    wrapper.vm.success = true;
    await nextTick();
    wrapper.vm.handleFormReset();
    await nextTick();
    expect(wrapper.vm.form.email).toBe('');
    expect(wrapper.vm.form.password).toBe('');
    expect(wrapper.vm.form.first_name).toBe('');
    expect(wrapper.vm.form.role).toBe('');
    expect(wrapper.vm.form.age_confirmation).toBe(false);
    expect(wrapper.vm.submitError).toBe('');
    expect(wrapper.vm.success).toBe(false);
    expect(wrapper.vm.currentStep).toBe(1);
  });
});

describe('Sign-Up Page – handleSignInClick', () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
  });

  it('shows confirm dialog when isDirty is a ref (truthy object)', async () => {
    const wrapper = createWrapper();
    wrapper.vm.handleSignInClick();
    await nextTick();
    expect(wrapper.vm.showConfirmDialog).toBe(true);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

describe('Sign-Up Page – dialog handlers', () => {
  it('handleDialogConfirm closes dialog and navigates to sign-in', async () => {
    const wrapper = createWrapper();
    wrapper.vm.showConfirmDialog = true;
    wrapper.vm.handleDialogConfirm();
    await nextTick();
    expect(wrapper.vm.showConfirmDialog).toBe(false);
    expect(mockRouterPush).toHaveBeenCalledWith('/auth/sign-in');
  });

  it('handleDialogCancel closes dialog without navigating', async () => {
    const wrapper = createWrapper();
    wrapper.vm.showConfirmDialog = true;
    wrapper.vm.handleDialogCancel();
    await nextTick();
    expect(wrapper.vm.showConfirmDialog).toBe(false);
  });
});

describe('Sign-Up Page – password toggle', () => {
  it('toggles showPassword', async () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.showPassword).toBe(false);
    wrapper.vm.showPassword = true;
    await nextTick();
    expect(wrapper.vm.showPassword).toBe(true);
  });

  it('toggles showConfirmPassword', async () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.showConfirmPassword).toBe(false);
    wrapper.vm.showConfirmPassword = true;
    await nextTick();
    expect(wrapper.vm.showConfirmPassword).toBe(true);
  });
});

describe('Sign-Up Page – getFieldState', () => {
  it('returns "error" when field has error', () => {
    const wrapper = createWrapper();
    wrapper.vm.errors.email = 'bad';
    expect(wrapper.vm.getFieldState('email')).toBe('error');
  });

  it('returns "success" when touched and valid', async () => {
    const wrapper = createWrapper();
    wrapper.vm.touchedFields.add('email');
    wrapper.vm.form.email = 'valid@example.com';
    await nextTick();
    expect(wrapper.vm.getFieldState('email')).toBe('success');
  });

  it('returns "default" when untouched', () => {
    const wrapper = createWrapper();
    expect(wrapper.vm.getFieldState('email')).toBe('default');
  });

  it('returns "error" for confirmPassword when it does not match password', async () => {
    const wrapper = createWrapper();
    wrapper.vm.touchedFields.add('confirmPassword');
    wrapper.vm.form.confirmPassword = 'Password2';
    wrapper.vm.form.password = 'Password1';
    await nextTick();
    expect(wrapper.vm.getFieldState('confirmPassword')).toBe('error');
  });
});
