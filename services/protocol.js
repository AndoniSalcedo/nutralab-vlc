export async function transferProtocol(payload) {
  const res = await fetch('/api/teams/protocols/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al transferir el protocolo');
  return data;
}

export async function batchImportProtocols({ sourceTeamId, targetTeamId, protocols }) {
  const res = await fetch('/api/teams/protocols/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'batch_import',
      sourceTeamId,
      targetTeamId,
      protocols,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al importar protocolos');
  return data;
}
