'use client';
import { useState, useRef } from 'react';

const DIAS_ORDEN = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];

function TarjetaDia({ dia }) {
  return (
    <div className='card stack' style={{ minWidth: 0 }}>
      <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{dia.dia}</h4>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#f59e0b', marginBottom: 4 }}>COMIDA</div>
        {dia.comida.primero && <p style={{ margin: '2px 0', fontSize: 13 }}>1º {dia.comida.primero}</p>}
        {dia.comida.segundo && <p style={{ margin: '2px 0', fontSize: 13 }}>2º {dia.comida.segundo}</p>}
        {dia.comida.postre && <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--muted)' }}>🍎 {dia.comida.postre}</p>}
      </div>
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#6366f1', marginBottom: 4 }}>CENA</div>
        {dia.cena.primero && <p style={{ margin: '2px 0', fontSize: 13 }}>1º {dia.cena.primero}</p>}
        {dia.cena.segundo && <p style={{ margin: '2px 0', fontSize: 13 }}>2º {dia.cena.segundo}</p>}
        {dia.cena.postre && <p style={{ margin: '2px 0', fontSize: 12, color: 'var(--muted)' }}>🍎 {dia.cena.postre}</p>}
      </div>
    </div>
  );
}

export default function MenuSemanal({ menusIniciales }) {
  const [menus, setMenus] = useState(menusIniciales);
  const [selected, setSelected] = useState(menusIniciales[0] || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [semana, setSemana] = useState(() => {
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    return lunes.toISOString().split('T')[0];
  });
  const fileRef = useRef(null);

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('semana', semana);
      const res = await fetch('/api/menu-semanal', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMenus(prev => {
        const filtered = prev.filter(m => m.semana !== data.menu.semana);
        return [data.menu, ...filtered].sort((a,b) => b.semana.localeCompare(a.semana));
      });
      setSelected(data.menu);
    } catch (e) { setError(e.message); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const diasOrdenados = selected ? [...selected.dias].sort((a,b) => DIAS_ORDEN.indexOf(a.dia) - DIAS_ORDEN.indexOf(b.dia)) : [];

  return (
    <div className='stack'>
      <div className='card stack'>
        <div className='between' style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>Subir menú semanal</h3>
            <p className='muted small'>Foto o PDF del menú del comedor · La IA extrae automáticamente los platos</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label className='muted small' style={{ display: 'block', marginBottom: 2 }}>Semana del:</label>
              <input type='date' value={semana} onChange={e => setSemana(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--fg)', fontSize: 13 }} />
            </div>
            <label style={{ padding: '8px 16px', borderRadius: 6, background: uploading ? 'var(--border)' : 'var(--fg)', color: uploading ? 'var(--muted)' : 'var(--bg)', fontSize: 13, fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', alignSelf: 'flex-end' }}>
              {uploading ? 'Procesando...' : 'Subir foto / PDF'}
              <input ref={fileRef} type='file' accept='image/*,.pdf' onChange={handleUpload} style={{ display: 'none' }} disabled={uploading} />
            </label>
          </div>
        </div>
        {error && <div style={{ padding: 10, background: '#fee2e2', borderRadius: 6, color: '#991b1b', fontSize: 13 }}>{error}</div>}
        {uploading && <div style={{ padding: 10, background: '#dbeafe', borderRadius: 6, color: '#1e40af', fontSize: 13 }}>La IA está leyendo el menú... puede tardar unos segundos.</div>}
      </div>

      {menus.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {menus.map(m => (
            <button key={m.semana} onClick={() => setSelected(m)}
              style={{ padding: '6px 14px', borderRadius: 99, border: '1px solid ' + (selected?.semana === m.semana ? 'var(--fg)' : 'var(--border)'), background: selected?.semana === m.semana ? 'var(--fg)' : 'transparent', color: selected?.semana === m.semana ? 'var(--bg)' : 'var(--fg)', fontSize: 13, cursor: 'pointer', fontWeight: selected?.semana === m.semana ? 600 : 400 }}>
              Semana {m.semana}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div>
          <p className='muted small' style={{ marginBottom: 12 }}>Semana del {selected.semana} · {selected.dias.length} días</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {diasOrdenados.map(dia => <TarjetaDia key={dia.dia} dia={dia} />)}
          </div>
        </div>
      ) : (
        <div className='card'><p className='muted'>No hay menús. Sube la foto o PDF del menú de esta semana.</p></div>
      )}
    </div>
  );
}