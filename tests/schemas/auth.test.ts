import { describe, it, expect } from 'vitest';
import {
  SignInSchema,
  SignUpSchema,
  SignUpFormSchema,
  PasswordResetSchema,
  AddRoleSchema,
  UpdatePasswordSchema,
  DeleteAccountSchema,
  validateSignIn,
  validateSignUpForm,
  validateSignUp,
  validatePasswordReset,
  validateAddRole
} from '~/schemas/auth';

// ─── SignInSchema ─────────────────────────────────────────────────────────────

describe('SignInSchema', () => {
  const valid = { email: 'user@example.com', password: 'Password1' };

  describe('email', () => {
    it('accepts a valid email', () => {
      expect(SignInSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects an invalid email format', () => {
      const result = SignInSchema.safeParse({ ...valid, email: 'not-an-email' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/valid email/i);
    });

    it('rejects an empty email', () => {
      const result = SignInSchema.safeParse({ ...valid, email: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });
  });

  describe('password', () => {
    it('accepts a password of at least 8 characters', () => {
      expect(SignInSchema.safeParse(valid).success).toBe(true);
    });

    it('rejects a password under 8 characters', () => {
      const result = SignInSchema.safeParse({ ...valid, password: 'short' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/at least 8 characters/i);
    });

    it('rejects a password over 128 characters', () => {
      const result = SignInSchema.safeParse({ ...valid, password: 'A'.repeat(129) });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/less than 128 characters/i);
    });
  });
});

// ─── SignUpFormSchema ─────────────────────────────────────────────────────────

describe('SignUpFormSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'worker' as const
  };

  it('accepts a fully valid sign-up form', () => {
    expect(SignUpFormSchema.safeParse(valid).success).toBe(true);
  });

  describe('password requirements', () => {
    it('rejects a password without an uppercase letter', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, password: 'password1', confirmPassword: 'password1' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/uppercase/i);
    });

    it('rejects a password without a lowercase letter', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, password: 'PASSWORD1', confirmPassword: 'PASSWORD1' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/lowercase/i);
    });

    it('rejects a password without a number', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, password: 'PasswordOnly', confirmPassword: 'PasswordOnly' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/number/i);
    });
  });

  describe('cross-field: password confirmation', () => {
    it('rejects when confirmPassword does not match password', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, confirmPassword: 'WrongPassword1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmIssue = result.error.issues.find(i => i.path.includes('confirmPassword'));
        expect(confirmIssue?.message).toMatch(/don't match/i);
      }
    });

    it('accepts when confirmPassword matches exactly', () => {
      expect(SignUpFormSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('role', () => {
    it('accepts "employer"', () => {
      expect(SignUpFormSchema.safeParse({ ...valid, role: 'employer' }).success).toBe(true);
    });

    it('accepts "worker"', () => {
      expect(SignUpFormSchema.safeParse({ ...valid, role: 'worker' }).success).toBe(true);
    });

    it('rejects an empty role via refine', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, role: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const roleIssue = result.error.issues.find(i => i.path.includes('role'));
        expect(roleIssue?.message).toMatch(/required/i);
      }
    });

    it('rejects an unknown role', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, role: 'admin' });
      expect(result.success).toBe(false);
    });
  });

  describe('name fields', () => {
    it('rejects an empty first_name', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, first_name: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });

    it('rejects a first_name over 50 characters', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, first_name: 'A'.repeat(51) });
      expect(result.success).toBe(false);
    });

    it('trims whitespace from first_name', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, first_name: '  Jane  ' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.first_name).toBe('Jane');
    });

    it('rejects an empty last_name', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, last_name: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('phone (optional)', () => {
    it('is valid when omitted', () => {
      const { phone: _p, ...withoutPhone } = { ...valid, phone: undefined };
      expect(SignUpFormSchema.safeParse(withoutPhone).success).toBe(true);
    });

    it('accepts a valid phone number', () => {
      expect(SignUpFormSchema.safeParse({ ...valid, phone: '07700900000' }).success).toBe(true);
    });

    it('rejects a phone over 20 characters', () => {
      const result = SignUpFormSchema.safeParse({ ...valid, phone: '1'.repeat(21) });
      expect(result.success).toBe(false);
    });
  });
});

// ─── SignUpSchema (API variant, no confirmPassword) ───────────────────────────

describe('SignUpSchema', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Password1',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'worker' as const
  };

  it('accepts a valid payload without confirmPassword', () => {
    expect(SignUpSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(SignUpSchema.safeParse({ ...valid, email: 'bad' }).success).toBe(false);
  });

  it('rejects a weak password', () => {
    const result = SignUpSchema.safeParse({ ...valid, password: 'weakpassword' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown role', () => {
    expect(SignUpSchema.safeParse({ ...valid, role: 'admin' }).success).toBe(false);
  });
});

// ─── PasswordResetSchema ──────────────────────────────────────────────────────

describe('PasswordResetSchema', () => {
  it('accepts a valid email', () => {
    expect(PasswordResetSchema.safeParse({ email: 'user@example.com' }).success).toBe(true);
  });

  it('rejects an invalid email', () => {
    expect(PasswordResetSchema.safeParse({ email: 'not-valid' }).success).toBe(false);
  });

  it('rejects an empty email', () => {
    expect(PasswordResetSchema.safeParse({ email: '' }).success).toBe(false);
  });
});

// ─── AddRoleSchema ────────────────────────────────────────────────────────────

describe('AddRoleSchema', () => {
  it('accepts "employer"', () => {
    expect(AddRoleSchema.safeParse({ role: 'employer' }).success).toBe(true);
  });

  it('accepts "worker"', () => {
    expect(AddRoleSchema.safeParse({ role: 'worker' }).success).toBe(true);
  });

  it('rejects an unknown role', () => {
    const result = AddRoleSchema.safeParse({ role: 'admin' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toMatch(/employer or worker/i);
  });

  it('rejects a missing role', () => {
    expect(AddRoleSchema.safeParse({}).success).toBe(false);
  });
});

// ─── UpdatePasswordSchema ─────────────────────────────────────────────────────

describe('UpdatePasswordSchema', () => {
  const valid = {
    currentPassword: 'OldPassword1',
    newPassword: 'NewPassword1',
    confirmPassword: 'NewPassword1'
  };

  it('accepts a fully valid payload', () => {
    expect(UpdatePasswordSchema.safeParse(valid).success).toBe(true);
  });

  describe('newPassword requirements', () => {
    it('rejects a new password under 8 characters', () => {
      const result = UpdatePasswordSchema.safeParse({ ...valid, newPassword: 'Short1', confirmPassword: 'Short1' });
      expect(result.success).toBe(false);
    });

    it('rejects a new password without uppercase', () => {
      const result = UpdatePasswordSchema.safeParse({ ...valid, newPassword: 'newpassword1', confirmPassword: 'newpassword1' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/uppercase/i);
    });

    it('rejects a new password without a number', () => {
      const result = UpdatePasswordSchema.safeParse({ ...valid, newPassword: 'NewPassword', confirmPassword: 'NewPassword' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/number/i);
    });
  });

  describe('cross-field: confirmPassword must match newPassword', () => {
    it('rejects when confirmPassword does not match newPassword', () => {
      const result = UpdatePasswordSchema.safeParse({ ...valid, confirmPassword: 'Different1' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('confirmPassword'));
        expect(issue?.message).toMatch(/don't match/i);
      }
    });

    it('accepts when confirmPassword matches newPassword', () => {
      expect(UpdatePasswordSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('cross-field: newPassword must differ from currentPassword', () => {
    it('rejects when newPassword equals currentPassword', () => {
      const result = UpdatePasswordSchema.safeParse({
        currentPassword: 'SamePassword1',
        newPassword: 'SamePassword1',
        confirmPassword: 'SamePassword1'
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(i => i.path.includes('newPassword'));
        expect(issue?.message).toMatch(/different from current/i);
      }
    });

    it('accepts when newPassword differs from currentPassword', () => {
      expect(UpdatePasswordSchema.safeParse(valid).success).toBe(true);
    });
  });

  describe('currentPassword', () => {
    it('rejects an empty currentPassword', () => {
      const result = UpdatePasswordSchema.safeParse({ ...valid, currentPassword: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });
  });
});

// ─── DeleteAccountSchema ──────────────────────────────────────────────────────

describe('DeleteAccountSchema', () => {
  const valid = { confirmation: 'DELETE', password: 'MyPassword1' };

  it('accepts the literal "DELETE" confirmation with a password', () => {
    expect(DeleteAccountSchema.safeParse(valid).success).toBe(true);
  });

  describe('confirmation field', () => {
    it('rejects "delete" (lowercase)', () => {
      const result = DeleteAccountSchema.safeParse({ ...valid, confirmation: 'delete' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/type DELETE/i);
    });

    it('rejects "Delete" (mixed case)', () => {
      const result = DeleteAccountSchema.safeParse({ ...valid, confirmation: 'Delete' });
      expect(result.success).toBe(false);
    });

    it('rejects an empty confirmation', () => {
      const result = DeleteAccountSchema.safeParse({ ...valid, confirmation: '' });
      expect(result.success).toBe(false);
    });

    it('rejects any other word', () => {
      const result = DeleteAccountSchema.safeParse({ ...valid, confirmation: 'REMOVE' });
      expect(result.success).toBe(false);
    });
  });

  describe('password field', () => {
    it('rejects an empty password', () => {
      const result = DeleteAccountSchema.safeParse({ ...valid, password: '' });
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toMatch(/required/i);
    });
  });
});

// ─── Validation helpers ───────────────────────────────────────────────────────

describe('validateSignIn', () => {
  it('returns success:true for valid credentials', () => {
    const result = validateSignIn({ email: 'a@b.com', password: 'Password1' });
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
  });

  it('returns success:false with field errors for invalid email', () => {
    const result = validateSignIn({ email: 'bad', password: 'Password1' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('email');
  });

  it('returns success:false with field errors for short password', () => {
    const result = validateSignIn({ email: 'a@b.com', password: 'short' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('password');
  });
});

describe('validateSignUpForm', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Password1',
    confirmPassword: 'Password1',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'worker'
  };

  it('returns success:true for a valid form', () => {
    const result = validateSignUpForm(valid);
    expect(result.success).toBe(true);
    expect(result.errors).toBeNull();
  });

  it('returns success:false with errors for mismatched passwords', () => {
    const result = validateSignUpForm({ ...valid, confirmPassword: 'Other1' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('confirmPassword');
  });

  it('returns success:false with errors for empty role', () => {
    const result = validateSignUpForm({ ...valid, role: '' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('role');
  });
});

describe('validateSignUp', () => {
  const valid = {
    email: 'user@example.com',
    password: 'Password1',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'worker'
  };

  it('returns success:true for a valid payload', () => {
    const result = validateSignUp(valid);
    expect(result.success).toBe(true);
  });

  it('returns success:false with errors for an invalid role', () => {
    const result = validateSignUp({ ...valid, role: 'admin' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('role');
  });
});

describe('validatePasswordReset', () => {
  it('returns success:true for a valid email', () => {
    const result = validatePasswordReset({ email: 'user@example.com' });
    expect(result.success).toBe(true);
  });

  it('returns success:false with errors for an invalid email', () => {
    const result = validatePasswordReset({ email: 'bad' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('email');
  });
});

describe('validateAddRole', () => {
  it('returns success:true for "employer"', () => {
    expect(validateAddRole({ role: 'employer' }).success).toBe(true);
  });

  it('returns success:false with errors for an unknown role', () => {
    const result = validateAddRole({ role: 'superuser' });
    expect(result.success).toBe(false);
    expect(result.errors).toHaveProperty('role');
  });
});
