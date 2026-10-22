# SIGE-Tele

Sistema de Gestión Escolar para **Telesecundaria**: pase de lista, tareas, calificaciones, semáforo de riesgo de cada alumno, reporte para el Consejo Técnico Escolar (CTE), carpeta de evidencias y notas del docente. Pensado para usarse desde computadora o celular.

## Funciones

- **Pase de lista** diario con historial y alertas por 3 faltas seguidas.
- **Tareas** con control de entregas y alerta por 3 tareas sin entregar.
- **Calificaciones** por materia, comparativa contra el periodo anterior y **exportación a Excel interactivo** (fórmulas vivas, semáforo, estadísticas y boleta individual con lista desplegable).
- **Semáforo escolar** (verde / amarillo / rojo) calculado con asistencia, tareas y promedio.
- **Reporte del CTE** imprimible y bitácora de acuerdos.
- **Carpeta de evidencias** (fotos de hasta 3 MB; se comprimen automáticamente) y expediente por alumno.
- **Notas del docente** con categorías y notas de voz.
- **Membrete editable** (encabezado, lema, pie, logos y color) para reportes, expediente y Excel.
- **Modo claro / oscuro / automático.**
- **Guía de uso interactiva** que señala cada botón de cada módulo.
- Cuentas por maestro: **cada docente solo ve sus propios datos**.

## Tecnología

- Cliente: React + Vite + Tailwind CSS (carpeta `client/`).
- Cuentas y base de datos: [Supabase](https://supabase.com) (Auth + Postgres con Row Level Security). El esquema está en `supabase/esquema.sql`.
- Excel: ExcelJS.
- Escritorio (opcional): Electron.

## Puesta en marcha

1. Crea un proyecto gratuito en Supabase y ejecuta `supabase/esquema.sql` en el SQL Editor. Guía paso a paso en [`supabase/LEEME.md`](supabase/LEEME.md).
2. Configura las claves del cliente:
   ```bash
   cd client
   cp .env.example .env.local   # y pega tu Project URL y tu clave pública (anon / publishable)
   npm install
   npm run dev
   ```
3. Abre `http://localhost:3000`, crea tu cuenta y listo.

## Publicar en GitHub Pages

El flujo `.github/workflows/pages.yml` compila y publica la app en `https://TU-USUARIO.github.io/SIGE-Tele/` cada vez que se sube un cambio a `main`. Configuración única:

1. En GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → New repository secret**, y crea:
   - `VITE_SUPABASE_URL`: la Project URL de Supabase (sin `/rest/v1/`).
   - `VITE_SUPABASE_ANON_KEY`: **solo** la clave pública (anon / publishable). El flujo se detiene si detecta una clave secreta.
3. En Supabase: **Authentication → URL Configuration**: pon la dirección de Pages como *Site URL* y agrega `https://TU-USUARIO.github.io/SIGE-Tele/**` (y `http://localhost:3000/**` para desarrollo) en *Redirect URLs*.
4. Haz un `git push` o lanza el flujo manualmente desde la pestaña **Actions**.

> Las claves públicas quedan dentro del código publicado; es normal. Lo que protege los datos son las reglas RLS de `supabase/esquema.sql`.

## Seguridad y privacidad

- **Nunca subas `client/.env.local`** ni uses la clave `service_role` / `sb_secret_...` en el cliente. El archivo `.gitignore` ya excluye los `.env`.
- La clave pública (anon / publishable) es pública por diseño; la protección real son las reglas RLS de `supabase/esquema.sql`.
- Esta app maneja datos personales de menores (CURP, tutor, teléfono). Para uso real se necesita aviso de privacidad y consentimiento de los tutores (LFPDPPP).
- `server/` contiene el servidor Express de la versión anterior (datos en un archivo JSON local). Ya no es necesario para la versión con Supabase.

## Respaldo

En **Ajustes → Respaldo** se descarga un JSON con todos los datos y se puede restaurar después. Las fotos no forman parte del respaldo.
