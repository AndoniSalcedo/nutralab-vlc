export async function importHydrationRecords(jugadorId, allImportRows) {
  const res = await fetch('/api/registros-hidratacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jugador_id: jugadorId, data: allImportRows }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error en importación');
  return data;
}

export async function refetchHydrationRecords(jugadorId) {
  const res = await fetch(`/api/registros-hidratacion?jugador_id=${jugadorId}`);
  return res;
}

export async function deleteHydrationRecord(id) {
  const res = await fetch(`/api/registros-hidratacion?id=${id}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al eliminar');
  return data;
}

export async function saveHydrationRecord(payload) {
  const res = await fetch('/api/registros-hidratacion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al guardar la toma');
  return data;
}
