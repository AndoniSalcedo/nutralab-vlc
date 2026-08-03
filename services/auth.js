export async function login(email, password, expectedRole = null) {
  const payload = { email: email.trim(), password: password.trim() };
  if (expectedRole) {
    payload.expectedRole = expectedRole;
  }
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Credenciales incorrectas');
  }
  return data;
}
