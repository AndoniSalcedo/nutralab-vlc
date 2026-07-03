export async function saveEvolution(payload) {
  const res = await fetch('/api/evoluciones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar medición');
  return data;
}

export async function deleteEvolution(id) {
  const res = await fetch(`/api/evoluciones?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al borrar medición');
  return data;
}
