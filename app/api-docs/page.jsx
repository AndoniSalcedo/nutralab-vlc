'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    // Swagger UI se empaqueta desde node_modules (mismo origen) para cumplir la CSP.
    import('swagger-ui-dist/swagger-ui-es-bundle.js').then(({ default: SwaggerUI }) => {
      if (cancelled || !containerRef.current) return;
      SwaggerUI({
        url: '/api/openapi.json',
        domNode: containerRef.current,
        deepLinking: true,
        persistAuthorization: true,
        displayRequestDuration: true,
        defaultModelsExpandDepth: 1,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: 48 }}>
      <link rel="stylesheet" href="/swagger-ui/swagger-ui.css" />
      <div
        style={{
          backgroundColor: '#1c1f1a',
          color: '#ffffff',
          padding: '20px 32px',
          borderBottom: '1px solid #2e332b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            Nutralab VLC · Swagger API Documentation
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#a5adcb' }}>
            Documentación interactiva OpenAPI 3.0 para la generación de planes nutricionales externos
          </p>
        </div>
        <a
          href="/api/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#fff',
            backgroundColor: '#2e332b',
            padding: '8px 14px',
            borderRadius: 999,
            fontSize: 12,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Ver /api/openapi.json
        </a>
      </div>

      <div
        ref={containerRef}
        style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 24px' }}
      />
    </div>
  );
}
