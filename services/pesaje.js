export async function savePesaje(payload) {
  const res = await fetch('/api/pesajes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar peso');
  return data;
}

export async function deletePesaje(id) {
  const res = await fetch(`/api/pesajes?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al borrar peso');
  return data;
}
