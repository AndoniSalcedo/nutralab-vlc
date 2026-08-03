export async function getFoods() {
  const response = await fetch('/api/alimentos', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error || 'No se pudieron cargar los alimentos.');
  return Array.isArray(data) ? data : [];
}
