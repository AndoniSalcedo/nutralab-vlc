# VCF Nutrición App Starter

Base real para desplegar en Vercel con Supabase.

## Qué incluye
- Login privado solo staff
- Dashboard con jugadores de la tabla `jugadores`
- Formulario de alta / edición / borrado
- Cálculo automático con Cunningham
- Calculadora rápida de alimentos
- Vista previa de importación Excel

## Antes de desplegar
1. Copia `.env.example` a `.env.local`
2. Rellena las variables de Supabase
3. Aplica las migraciones de base de datos. Por defecto usan el schema `teams`:
   ```bash
   npm run db:migrate
   ```
   También puedes ver el estado con:
   ```bash
   npm run db:migrate:status
   ```
   Para que `supabase-js` pueda consultar ese schema, debes poner `SUPABASE_SCHEMA=teams` y exponer `teams` en Supabase: Project Settings -> API -> Exposed schemas. `SUPABASE_DB_URL` solo lo usa el runner de migraciones para conectar a Postgres; no expone el schema a la API REST de Supabase.
4. Comprueba que tu tabla `jugadores` tiene estas columnas:
   - nombre, apellidos, posicion
   - altura_cm, peso_kg, porcentaje_grasa, masa_magra_kg
   - factor_actividad
   - gustos_preferencias, contexto_clinico, objetivo
   - kcal_objetivo, cho_objetivo_g, proteina_objetivo_g, grasa_objetivo_g, agua_objetivo_ml

## Desarrollo local
```bash
npm install
npm run dev
```

## Migraciones de Supabase
Las migraciones viven en `supabase/migrations` y son SQL versionado compatible con el flujo nativo de Supabase.

Comandos útiles:
```bash
npm run db:migrate
npm run db:migrate:status
npm run db:teams
```

Para añadir un cambio de base de datos, crea un archivo nuevo con formato:
```txt
supabase/migrations/YYYYMMDDHHMMSS_nombre_del_cambio.sql
```

El runner guarda el historial en `teams.schema_migrations`, ejecuta solo las pendientes y recarga la caché de PostgREST con `notify pgrst, 'reload schema';`.

## Despliegue en Vercel
- Sube esta carpeta a un repositorio privado de GitHub
- En Vercel: Add New Project -> importa el repo
- Añade las variables de entorno de `.env.example`
- Deploy

## Siguiente fase recomendada
1. Importador real de tu Excel de composición corporal
2. Subida de PDFs a Supabase Storage + extracción IA
3. Generación de planes con Claude desde rutas API seguras
4. Registro de tomas y comparación diaria vs objetivo
