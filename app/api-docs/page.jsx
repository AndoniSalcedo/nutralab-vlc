'use client';

import { useEffect, useRef } from 'react';

export default function ApiDocsPage() {
  const containerRef = useRef(null);

  useEffect(() => {
    const cssId = 'swagger-ui-dist-css';
    if (!document.getElementById(cssId)) {
      const link = document.createElement('link');
      link.id = cssId;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css';
      document.head.appendChild(link);
    }

    const initSwagger = () => {
      if (window.SwaggerUIBundle && containerRef.current) {
        window.SwaggerUIBundle({
          url: '/api/openapi.json',
          domNode: containerRef.current,
          deepLinking: true,
          persistAuthorization: true,
          displayRequestDuration: true,
          defaultModelsExpandDepth: 1,
          presets: [
            window.SwaggerUIBundle.presets.apis,
            window.SwaggerUIStandalonePreset,
          ].filter(Boolean),
          layout: 'BaseLayout',
        });
      }
    };

    const bundleId = 'swagger-ui-dist-bundle';
    const existingScript = document.getElementById(bundleId);
    if (existingScript) {
      initSwagger();
      return;
    }

    const bundleScript = document.createElement('script');
    bundleScript.id = bundleId;
    bundleScript.src = 'https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js';
    bundleScript.async = true;
    bundleScript.onload = initSwagger;
    document.body.appendChild(bundleScript);
  }, []);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#fafafa', paddingBottom: 48 }}>
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
            Documentación interactiva OpenAPI 3.0 para la generación de planes nutricionales externos (Hybrid)
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
