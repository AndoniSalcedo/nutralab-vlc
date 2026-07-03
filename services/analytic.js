export async function uploadAnalitica(file, jugadorId, fecha) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('jugador_id', String(jugadorId));
  fd.append('fecha_extraccion', fecha);
  const res = await fetch('/api/upload-analitica', { method: 'POST', body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir analítica');
  return data;
}

export async function deleteAnalitica(id) {
  const res = await fetch(`/api/upload-analitica?id=${id}`, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al borrar analítica');
  return data;
}
