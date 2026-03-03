<template>
  <div class="container">
    <h1>Auth Test Page</h1>
    
    <div class="section">
      <h2>Sign Up</h2>
      <form @submit.prevent="handleSignup">
        <input v-model="signupForm.email" type="email" placeholder="Email" required />
        <input v-model="signupForm.password" type="password" placeholder="Password" required />
        <input v-model="signupForm.first_name" placeholder="First Name" required />
        <input v-model="signupForm.last_name" placeholder="Last Name" required />
        <input v-model="signupForm.phone" placeholder="Phone" />
        <select v-model="signupForm.role" required>
          <option value="worker">Worker</option>
          <option value="employer">Employer</option>
        </select>
        <button type="submit">Sign Up</button>
      </form>
    </div>

    <div class="section">
      <h2>Sign In</h2>
      <form @submit.prevent="handleSignin">
        <input v-model="signinForm.email" type="email" placeholder="Email" required />
        <input v-model="signinForm.password" type="password" placeholder="Password" required />
        <button type="submit">Sign In</button>
      </form>
    </div>

    <div class="section" v-if="user">
      <h2>Current User</h2>
      <pre>{{ user }}</pre>
      
      <h3>Add Role</h3>
      <select v-model="newRole">
        <option value="worker">Worker</option>
        <option value="employer">Employer</option>
      </select>
      <button @click="handleAddRole">Add Role</button>
      
      <button @click="handleSignout">Sign Out</button>
    </div>

    <div class="section">
      <h2>Reset Password</h2>
      <input v-model="resetEmail" type="email" placeholder="Email" />
      <button @click="handleResetPassword">Send Reset Email</button>
    </div>

    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Role } from '~/types/auth';

const { user, signup, signin, addRole, resetPassword, signout } = useAuth();

const signupForm = ref({
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'worker' as Role
});

const signinForm = ref({
  email: '',
  password: ''
});

const newRole = ref<Role>('employer');
const resetEmail = ref('');
const message = ref('');
const messageType = ref<'success' | 'error'>('success');

const showMessage = (msg: string, type: 'success' | 'error' = 'success') => {
  message.value = msg;
  messageType.value = type;
  setTimeout(() => { message.value = ''; }, 5000);
};

const handleSignup = async () => {
  try {
    await signup(signupForm.value);
    showMessage('Signup successful! Check your email to confirm.');
    signupForm.value = { email: '', password: '', first_name: '', last_name: '', phone: '', role: 'worker' };
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Signup failed', 'error');
  }
};

const handleSignin = async () => {
  try {
    await signin(signinForm.value);
    showMessage('Signed in successfully!');
    signinForm.value = { email: '', password: '' };
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Signin failed', 'error');
  }
};

const handleAddRole = async () => {
  try {
    const roles = await addRole(newRole.value);
    showMessage(`Roles updated: ${roles.join(', ')}`);
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Failed to add role', 'error');
  }
};

const handleResetPassword = async () => {
  try {
    await resetPassword(resetEmail.value);
    showMessage('Password reset email sent!');
    resetEmail.value = '';
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Failed to send reset email', 'error');
  }
};

const handleSignout = async () => {
  try {
    await signout();
    showMessage('Signed out successfully!');
  } catch (error: any) {
    showMessage(error.data?.statusMessage || 'Signout failed', 'error');
  }
};
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  color: #2c3e50;
  margin-bottom: 2rem;
}

.section {
  background: #f8f9fa;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-radius: 8px;
}

h2 {
  color: #34495e;
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.25rem;
}

h3 {
  color: #34495e;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-size: 1rem;
}

form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

input, select {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  padding: 0.75rem 1.5rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background 0.2s;
}

button:hover {
  background: #2980b9;
}

pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.875rem;
}

.message {
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-weight: 500;
}

.message.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.message.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}
</style>
