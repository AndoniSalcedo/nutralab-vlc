export async function login(email, password) {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password: password.trim() }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Credenciales incorrectas');
  }
  return data;
}
