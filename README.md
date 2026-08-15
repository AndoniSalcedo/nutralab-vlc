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


feat: en la pestaña de protocolos el texto es fijo lo que quiero haces es que se pueda editar esto Timeline prepartido

-3 / -4 h · Comida principal
Base alta en CHO: arroz, pasta o patata. Proteína fácil de digerir, 100-150 g.

-90 min · Snack
Plátano, gel o opción habitual ya testada. Evitar novedades.

-60 min · Cafeína
249-498 mg según tolerancia y rol esperado.

Medio tiempo
300-500 ml de isotónica y ajuste de CHO si hay alta carga.

+30 min · Recuperación
Proteína + CHO rápidos. Priorizar disponibilidad si hay viaje. tamnto cambiar el texto como los iconos como añadir mas como eliminar y q ue se pueda crear varios protocolos por ejemplo el que esta puesto es el prepartido pero digo yo quiero crear uno para cada tipo de día de los que hay en configuracion del eqipo sabes tipo que pueda haber un protocolo para dia de entrenamiento de descanso y no solo uno sino varios protocolos para cada tipo de dia por ejemplo en el de prepartido hacer un protocolo post partido esto quiero que sea a nivel del eqipo pero luego que se pueda editar a nivel persinal para ello en la configuración que se pueda añadir esta parte de protocolos para que se pueda configurar segun los tipos de dia y por ahi 