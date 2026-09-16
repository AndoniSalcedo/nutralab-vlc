import { loginAction, logoutAction } from '@/actions/authActions';

export async function login(email, password, expectedRole = null) {
  const payload = { email: email.trim(), password: password.trim() };
  if (expectedRole) {
    payload.expectedRole = expectedRole;
  }
  return await loginAction(payload);
}

export async function logout() {
  return await logoutAction();
}
