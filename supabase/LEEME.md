# Configurar Supabase para SIGE-Tele (todo gratis)

## 1. Crear el proyecto
1. Entra a <https://supabase.com> → **Start your project** → inicia sesión (con GitHub o correo).
2. **New project**: nombre `sige-tele`, elige una contraseña de base de datos (guárdala), región **East US** o la más cercana a México.
3. Espera 1–2 minutos a que termine de crearse.

## 2. Crear las tablas y la seguridad
1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abre el archivo `supabase/esquema.sql`, copia **todo** su contenido, pégalo y presiona **Run**.
3. Debe decir *Success*. Es seguro volver a correrlo.

## 3. Conectar la app
1. En Supabase: **Project Settings → API**. Copia **Project URL** y la clave **anon public**.
2. En la carpeta `client`, copia `.env.example` como `.env.local` y pega los dos valores.
   (Nunca uses la clave `service_role` en la app.)
3. Reinicia la app (`iniciar.bat`).

## 4. Configurar el acceso (Authentication)
- **Authentication → Sign In / Providers → Email**:
  - Para **probar**: desactiva *Confirm email* (el correo gratis de Supabase solo envía unos pocos mensajes por hora).
  - Para **producción**: actívalo y configura un SMTP propio (Resend tiene plan gratis).
- **Authentication → URL Configuration**: en *Site URL* pon la dirección donde usas la app
  (`http://localhost:3000` por ahora) y agrégala también en *Redirect URLs*.
- Si **no** quieres que cualquiera cree cuentas: en *Sign In / Providers* desactiva **Allow new users to sign up**
  y crea los usuarios a mano en **Authentication → Users → Add user**.

### Entrar con Google (opcional)
1. Google Cloud Console → proyecto nuevo `SIGE-Tele` → **APIs y servicios → Pantalla de consentimiento OAuth** → Externo.
2. **Credenciales → Crear credenciales → ID de cliente OAuth → Aplicación web**.
   En *URI de redireccionamiento autorizados* pon: `https://TU-PROYECTO.supabase.co/auth/v1/callback`.
3. En Supabase: **Authentication → Providers → Google** → activa y pega *Client ID* y *Client Secret*.
4. El botón de Google **no aparece en la app de escritorio (Electron)**: Google bloquea ese tipo de ventanas.

## 5. Pasar tus datos actuales
1. Abre la app, regístrate o inicia sesión.
2. **Ajustes y Materias → Restaurar respaldo** y elige el archivo `server/data/db.json`.
3. Se cargan alumnos, asistencias, tareas, calificaciones y acuerdos del CTE.
   (Las fotos de la carpeta `server/uploads` no se migran; hay que subirlas de nuevo.)

## Qué se guarda dónde
| Dato | Dónde |
|---|---|
| Usuarios y contraseñas | Supabase Auth (las contraseñas nunca las ve la app) |
| Alumnos, asistencia, tareas, calificaciones, CTE, notas | Postgres, cada fila con el `user_id` de su maestro |
| Fotos de evidencias | Bucket privado `evidencias` (máx. 3 MB; la app comprime las fotos más grandes). Después se cambia a Google Drive |

## Límites del plan gratis (revisa los actuales en supabase.com/pricing)
- 500 MB de base de datos y 1 GB de archivos.
- El proyecto **se pausa tras ~7 días sin uso**; se reactiva desde el panel con un clic.
- Sin respaldos automáticos: usa **Ajustes → Descargar respaldo** de vez en cuando.
