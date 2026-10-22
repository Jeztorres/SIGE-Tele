# Guardar las fotos de evidencias en Google Drive

Las fotos se guardan en **tu** Google Drive. Los maestros nunca entran a Drive ni ven tus carpetas: ven sus fotos dentro de SIGE-Tele, y cada maestro solo ve las suyas.

```
App  ──(sesión del maestro)──▶  Función "drive" de Supabase  ──(permiso guardado como secreto)──▶  Tu Google Drive
```

- Las claves de Google viven **solo** en los secretos de Supabase. La app y el repositorio nunca las tienen.
- En tu Drive se crea `SIGE-Tele-Evidencias / maestro-xxxxxxxx /` y dentro los archivos con nombres al azar (sin nombres de alumnos).
- Se aceptan fotos JPG, PNG, WebP y PDF de **máximo 3 MB** (la app comprime sola las fotos más pesadas).
- Las fotos se ven con enlaces temporales que vencen en 1 hora.

## Parte A · Google Cloud (5 minutos)

> Crea un proyecto **nuevo** para este sistema; no uses el de tu otro software.

1. Entra a <https://console.cloud.google.com> y crea un proyecto llamado `SIGE-Tele`.
2. **APIs y servicios → Biblioteca** → busca **Google Drive API** → **Habilitar**.
3. **Pantalla de consentimiento de OAuth** (en la versión nueva: *Google Auth Platform*):
   - Nombre de la app: `SIGE-Tele`, tu correo como contacto.
   - Tipo de usuario: **Externo**.
   - Permisos (Scopes / Acceso a los datos): agrega **`.../auth/drive.file`**. Este permiso solo da acceso a los archivos que crea esta app, no al resto de tu Drive.
   - **Estado de publicación: pasa la app a "En producción"** (botón *Publicar app*). Si se queda en "Pruebas", Google invalida el permiso cada 7 días y las subidas dejan de funcionar.
4. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo: **Aplicación web**, nombre `SIGE-Tele Drive`.
   - En **URI de redireccionamiento autorizados** agrega exactamente: `https://developers.google.com/oauthplayground`
   - Al crear, copia el **ID de cliente** y el **Secreto de cliente**. Guárdalos en un lugar privado; **no los pegues en el chat ni en el repositorio**.

## Parte B · Obtener el permiso permanente (refresh token)

1. Abre <https://developers.google.com/oauthplayground>
2. Engrane ⚙ (arriba a la derecha) → marca **Use your own OAuth credentials** → pega tu ID de cliente y tu secreto. Deja *Access type* en **Offline**.
3. En el cuadro **"Input your own scopes"** escribe `https://www.googleapis.com/auth/drive.file` y presiona **Authorize APIs**.
4. Elige la cuenta de Google donde están tus **5 TB** y acepta. Si aparece *"Google no verificó esta app"*, presiona *Avanzado → Ir a SIGE-Tele*: es tu propia app.
5. En el paso 2 presiona **Exchange authorization code for tokens** y copia el **Refresh token** (empieza con `1//`).

> Trata ese refresh token como una contraseña. Si alguna vez se filtra, revócalo en <https://myaccount.google.com/permissions> y genera otro.

## Parte C · Supabase

1. **Edge Functions → Secrets** (o *Project Settings → Edge Functions*) → agrega:

   | Nombre | Valor |
   |---|---|
   | `GOOGLE_CLIENT_ID` | tu ID de cliente |
   | `GOOGLE_CLIENT_SECRET` | tu secreto de cliente |
   | `GOOGLE_REFRESH_TOKEN` | el refresh token |
   | `LINK_SECRET` *(opcional)* | cualquier texto largo y aleatorio |

2. **SQL Editor:** vuelve a ejecutar `supabase/esquema.sql` completo (es seguro repetirlo). Crea dos tablas internas que ningún maestro puede leer.
3. **Publicar la función**, con cualquiera de estas dos formas:

   **Opción A · Terminal** (desde la carpeta del proyecto):
   ```bash
   npx supabase login
   npx supabase functions deploy drive --project-ref TU-REFERENCIA --no-verify-jwt
   ```
   `TU-REFERENCIA` es la parte inicial de tu URL de Supabase (`https://`**`abcdefgh`**`.supabase.co`).

   **Opción B · Panel de Supabase:** *Edge Functions → Deploy a new function → Via Editor*, nombre **`drive`**, pega el contenido de `supabase/functions/drive/index.ts` y publica. Después, en los ajustes de esa función, **desactiva "Verify JWT"** (la propia función ya valida la sesión del maestro).

## Parte D · Activarlo en la app

- **En tu computadora:** en `client/.env.local` cambia a `VITE_USAR_DRIVE=true` y reinicia.
- **En GitHub Pages:** repositorio → *Settings → Secrets and variables → Actions → pestaña **Variables*** → **New repository variable**: nombre `VITE_USAR_DRIVE`, valor `true`. Luego relanza el flujo "Publicar en GitHub Pages".

## Probar

1. Entra a la app → **Carpeta de Evidencias → Subir Archivo / Foto** y sube una foto.
2. En tu Drive debe aparecer `SIGE-Tele-Evidencias → maestro-xxxxxxxx → evi_….jpg`.
3. La foto se ve en la galería de la app. Bórrala desde la app y desaparece de Drive.

## Si algo falla

| Mensaje en la app | Qué pasó |
|---|---|
| *No se pudo conectar con el servicio de fotos* | La función `drive` no está publicada, o el nombre no es exactamente `drive`. |
| *Faltan los secretos de Google* | Falta alguno de los 3 secretos del paso C1. |
| *Google rechazó las credenciales* | El refresh token venció o es incorrecto. Revisa que la app esté **En producción** y genera otro token. |
| *Tu sesión expiró* | Cierra sesión y vuelve a entrar. |
| *Solo se permiten fotos...* | El archivo no es JPG/PNG/WebP/PDF. |

Los registros de la función se ven en *Edge Functions → drive → Logs*.

## Seguridad: qué está protegido

- Nadie, salvo tú, tiene acceso a la carpeta de Drive. **No la compartas** ni actives "cualquier persona con el enlace".
- Un maestro no puede pedir fotos de otro: la función le da enlaces solo de las filas que sus reglas RLS le dejan ver.
- La función revisa el contenido real del archivo (no solo su extensión) y rechaza HTML, ejecutables, etc.
- Un enlace copiado deja de funcionar en 1 hora.
- Pruebas automáticas de la función: `node --test supabase/functions/drive/index.test.ts` (Node 23 o superior).
