# ⚽ Figus Tracker — Mundial 2026

App web (PWA instalable) para llevar el control de tu colección de figuritas del Mundial 2026.
Login con email/contraseña, datos guardados en la nube (sincroniza entre tu compu y tu iPhone),
estadísticas, lista de faltantes, repetidas para intercambios, búsqueda/filtros e import/export.

## Funcionalidades

- 🔐 **Login** con email + contraseña (Supabase Auth).
- ☁️ **Sync en la nube** + cache local: respuesta instantánea y uso offline.
- ➕➖ **Marcar colección**: 0 = falta, 1 = tengo, ≥2 = repetida (con badge de cantidad).
- 📊 **Estadísticas**: % completado, tengo/faltan/repes y progreso por equipo.
- 🔎 **Faltantes**: lista agrupada, lista para copiar/compartir.
- 🔁 **Repetidas**: para anotar intercambios.
- 🔍 **Búsqueda y filtros** por número, equipo, jugador y estado.
- 💾 **Import/Export** en JSON (backup completo) y CSV.
- 📱 **PWA**: instalable desde Safari/Chrome, funciona offline.

## Stack

React + Vite + TypeScript + **MUI (Material UI v9)** + Zustand · Supabase (Auth + Postgres) ·
deploy en Vercel. Interfaz con **menú lateral** (drawer) y tema oscuro de alto contraste.

## Puesta en marcha local

### Opción rápida: modo local (sin Supabase) 👈 para dev

No necesitás cuenta ni configurar nada. Saltea el login y guarda todo en `localStorage`:

```bash
npm install
npm run dev:local
```

Entrás directo a la app (header muestra **"Modo local"**). Ideal para iterar la UI.
Limitaciones: sin login y sin sync en la nube (los datos viven solo en ese navegador).
Internamente lo activa `VITE_LOCAL_MODE=true` (definido en `.env.localdev`).

### Modo completo (con Supabase)

```bash
npm install
cp .env.example .env.local   # y completá tus credenciales de Supabase (ver más abajo)
npm run dev
```

Otros scripts: `npm run build` (producción), `npm run preview` (sirve el build), `npm run test`.

## 1) Configurar Supabase

1. Creá un proyecto en <https://supabase.com> (free tier).
2. En **Project Settings → API**, copiá `Project URL` y la `anon public key` a tu `.env.local`:
   ```
   VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
   VITE_SUPABASE_ANON_KEY=tu-anon-public-key
   ```
3. En **SQL Editor → New query**, pegá y ejecutá el contenido de [`supabase/schema.sql`](supabase/schema.sql).
   Esto crea la tabla `collections` con Row Level Security (cada usuario solo ve sus datos).
4. En **Authentication → Providers → Email**, dejá habilitado Email.
   - Para probar rápido podés desactivar *"Confirm email"* (así entrás sin confirmar el mail).

## 2) Deploy en Vercel

1. Subí el proyecto a un repo de GitHub.
2. En <https://vercel.com> → **Add New → Project**, importá el repo (framework: Vite, detectado solo).
3. En **Environment Variables** agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Vas a obtener una URL `https://tu-app.vercel.app`.
5. En Supabase → **Authentication → URL Configuration**, agregá esa URL a *Site URL* / *Redirect URLs*.

## 3) Usar desde el iPhone

Abrí la URL de Vercel en Safari → botón **Compartir → "Agregar a inicio"**. Queda como una app.
Iniciá sesión con tu cuenta y vas a ver la misma colección que en la compu.

## El catálogo de figuritas

Usa el catálogo **real** del álbum *Panini FIFA World Cup 2026 (Standard Edition)*: 980 figuritas
(se excluyen las variantes foil), 48 selecciones (escudo + jugadores, numeradas 1..N por equipo)
agrupadas en los **12 grupos A–L** del Mundial ([`src/data/groups.ts`](src/data/groups.ts)), más una
sección **Especiales** numerada del **0 al 19** (logo Panini + emblemas, mascotas, sedes, historia).

- Datos en [`src/data/panini-wc-2026-catalog.json`](src/data/panini-wc-2026-catalog.json)
  (`{ code, name, team }`), transformados en [`src/data/catalog2026.ts`](src/data/catalog2026.ts).
- El `code` real de cada figurita (ej. `ARG10`) es el `id`, y es la clave que usa el backup JSON.
- Para actualizar el catálogo, reemplazá el JSON con el mismo formato; el resto se deriva solo.

## Estructura

```
src/
  lib/        supabase, stats, filters, importExport (+ tests)
  store/      useAuth, useCollection (sync nube/local)
  data/       catalog2026
  components/ Auth, Nav, Dashboard, AlbumGrid, StickerCell, SearchFilter,
              MissingList, DuplicatesList, ImportExportPanel
supabase/schema.sql
```
