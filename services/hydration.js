import {
  importHydrationRecordsAction,
  getHydrationRecordsAction,
  deleteHydrationRecordAction,
  saveHydrationRecordAction,
  importTeamOsmolarityAction,
} from '@/actions/hydrationActions';

export async function importHydrationRecords(jugadorId, allImportRows) {
  return await importHydrationRecordsAction(jugadorId, allImportRows);
}

export async function refetchHydrationRecords(jugadorId) {
  const data = await getHydrationRecordsAction(jugadorId);
  return {
    ok: true,
    records: data.records,
    json: async () => data,
  };
}

export async function deleteHydrationRecord(id) {
  return await deleteHydrationRecordAction(id);
}

export async function saveHydrationRecord(payload) {
  return await saveHydrationRecordAction(payload);
}

export async function previewTeamOsmolarity(file, teamId) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('team_id', teamId);
  formData.append('mode', 'preview');

  return await importTeamOsmolarityAction(formData);
}

export async function importTeamOsmolarity(file, teamId, decisiones) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('team_id', teamId);
  formData.append('mode', 'importar');
  formData.append('decisiones', JSON.stringify(decisiones));

  return await importTeamOsmolarityAction(formData);
}
