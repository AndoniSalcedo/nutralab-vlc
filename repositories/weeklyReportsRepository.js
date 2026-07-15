export async function getWeeklyReport(supabase, teamId, semana) {
  const { data, error } = await supabase
    .from('informes_semanales')
    .select('meta')
    .eq('equipo_id', teamId)
    .eq('semana', semana)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

export async function upsertWeeklyReport(supabase, teamId, semana, meta) {
  const { data, error } = await supabase
    .from('informes_semanales')
    .upsert(
      {
        equipo_id: teamId,
        semana,
        meta,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'equipo_id,semana' }
    )
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
