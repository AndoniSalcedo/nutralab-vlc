'use client'; // Error boundaries must be Client Components

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const REDIRECT_SECONDS = 10;

// Último recurso: sustituye al layout raíz, así que no hay Mantine ni providers; solo estilos inline.
export default function GlobalError({ error, retry }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    console.error(error);
  }, [error]);

  useEffect(() => {
    if (secondsLeft <= 0) {
      router.replace('/');
      return;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft, router]);

  const button = {
    border: 'none',
    borderRadius: 999,
    padding: '11px 20px',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
  };

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 16px',
          boxSizing: 'border-box',
          background: 'radial-gradient(ellipse at 50% 15%, #ffffff 0%, #faf7f2 55%, #f1ede3 100%)',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
          color: '#373a2e',
        }}
      >
        <title>Algo ha salido mal · Nutralab</title>
        <main
          style={{
            width: '100%',
            maxWidth: 420,
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid rgba(141, 145, 122, 0.18)',
            borderRadius: 24,
            padding: 28,
            boxSizing: 'border-box',
            boxShadow: '0 12px 40px rgba(60, 58, 48, 0.06), 0 2px 8px rgba(60, 58, 48, 0.03)',
            textAlign: 'center',
          }}
        >
          <img src="/logo.png" alt="Nutralab" width={120} style={{ display: 'block', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 48, marginBottom: 4 }}>🥑</div>
          <h1 style={{ fontSize: 20, margin: '0 0 8px' }}>Algo ha salido mal</h1>
          <p style={{ fontSize: 14, color: '#7a7d68', margin: '0 0 20px', lineHeight: 1.5 }}>
            Hemos tenido un problema inesperado. Puedes reintentar o volver al inicio.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => router.replace('/')}
              style={{ ...button, background: '#5c6049', color: '#fff' }}
            >
              Ir al inicio
            </button>
            <button type="button" onClick={() => retry()} style={{ ...button, background: '#f1ede3', color: '#5c6049' }}>
              Reintentar
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#8d917a', margin: '20px 0 0' }}>
            Te llevamos al inicio en <b>{Math.max(secondsLeft, 0)}s</b>
          </p>
        </main>
      </body>
    </html>
  );
}
