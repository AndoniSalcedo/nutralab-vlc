export async function getSupplementationCatalog() {
  const res = await fetch('/api/supplementation/catalog');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo cargar suplementación');
  return data;
}

export async function updateSupplementationCatalog(payload) {
  const res = await fetch('/api/supplementation/catalog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
  return data;
}

export async function getPlayerSupplementation(jugadorId) {
  const res = await fetch(`/api/supplementation?jugador_id=${jugadorId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo cargar suplementación');
  return data;
}

export async function postPlayerSupplementation(jugadorId, payload) {
  const res = await fetch('/api/supplementation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jugador_id: jugadorId, ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'No se pudo guardar suplementación');
  return data;
}
