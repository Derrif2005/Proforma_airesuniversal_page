# Cotizaciones - Aires Universal

Proyecto basado directamente en el `index.html` entregado.

## CRUD en la misma página

La sección **Administrar cotizaciones** está dentro de `index.html`.

Incluye:
- Nueva cotización
- Lista de cotizaciones
- Buscar por número o cliente
- Ver
- Editar
- Eliminar
- Generar PDF

## Supabase

1. Crea un proyecto en Supabase.
2. Ejecuta `supabase.sql` en SQL Editor.
3. Abre `js/supabase.js`.
4. Reemplaza `SUPABASE_URL` y `SUPABASE_ANON_KEY` por los datos de tu proyecto.

Usa únicamente la clave pública/anon/publishable. Nunca coloques una service_role/secret key en el frontend.

## Archivos

index.html
supabase.sql
js/supabase.js
js/app.js
js/pdf.js

El número de cotización se genera automáticamente en Supabase.
