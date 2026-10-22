-- =====================================================================
--  SIGE-Tele · Esquema de base de datos para Supabase (Postgres)
--  Pégalo completo en: Supabase → SQL Editor → New query → Run
--  Es seguro ejecutarlo más de una vez.
--
--  Idea central: TODAS las tablas llevan user_id y una regla RLS
--  (Row Level Security) que hace que cada maestro solo pueda ver,
--  crear, editar o borrar SUS propias filas. Aunque alguien conozca
--  la URL y la clave pública, no puede leer datos de otro maestro.
-- =====================================================================

-- ---------- Tablas ----------

create table if not exists public.configuracion (
  user_id          uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  escuela          text not null default '',
  cct              text not null default '',
  zona             text not null default '',
  sector           text not null default '',
  grado            text not null default '1°',
  grupo            text not null default 'A',
  ciclo            text not null default '2026-2027',
  docente          text not null default '',
  periodo_activo   text not null default 'Trimestre 1',
  tipo_periodo     text not null default 'Trimestre',
  categorias_notas jsonb not null default '["Planeación Didáctica","Conducta e Incidencias","Acuerdos con Padres","Pendientes Administrativos","Observación Pedagógica"]'::jsonb,
  creado           timestamptz not null default now()
);

-- Membrete editable de los documentos (encabezado, lema, pie, logos y color)
alter table public.configuracion add column if not exists membrete jsonb not null default '{}'::jsonb;

create table if not exists public.periodos (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id      text not null,
  nombre  text not null,
  orden   int  not null default 0,
  primary key (user_id, id)
);

create table if not exists public.materias (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id      text not null,
  nombre  text not null,
  clave   text not null default '',
  orden   int  not null default 0,
  primary key (user_id, id)
);

create table if not exists public.alumnos (
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id       text not null,
  no_lista int  not null default 0,
  nombre   text not null,
  curp     text not null default '',
  tutor    text not null default '',
  telefono text not null default '',
  notas    text not null default '',
  extra    jsonb not null default '{}'::jsonb,
  creado   timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.asistencias (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  fecha     date not null,
  periodo   text not null default '',
  registros jsonb not null default '{}'::jsonb,
  primary key (user_id, fecha)
);

create table if not exists public.tareas (
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id          text not null,
  titulo      text not null default 'Nueva Tarea',
  materia_id  text not null default '',
  periodo     text not null default '',
  fecha       date not null default current_date,
  descripcion text not null default '',
  entregas    jsonb not null default '{}'::jsonb,
  creado      timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.calificaciones (
  user_id   uuid not null default auth.uid() references auth.users(id) on delete cascade,
  alumno_id text not null,
  periodo   text not null,
  notas     jsonb not null default '{}'::jsonb,
  primary key (user_id, alumno_id, periodo),
  foreign key (user_id, alumno_id) references public.alumnos(user_id, id) on delete cascade
);

create table if not exists public.acuerdos_cte (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id             text not null,
  sesion         text not null default 'Sesión Ordinaria CTE',
  fecha_registro text not null default '',
  acuerdo        text not null default '',
  responsable    text not null default '',
  fecha_limite   text not null default '',
  estatus        text not null default 'Pendiente',
  observaciones  text not null default '',
  creado         timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.evidencias (
  user_id         uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id              text not null,
  alumno_id       text not null default '',
  materia_id      text not null default '',
  periodo         text not null default '',
  titulo          text not null default '',
  tipo            text not null default '',
  fecha           text not null default '',
  descripcion     text not null default '',
  nombre_original text not null default '',
  mimetype        text not null default '',
  tamanio         bigint not null default 0,
  ruta            text,                       -- ruta del archivo en el almacenamiento (hoy Supabase Storage, luego Drive)
  creado          timestamptz not null default now(),
  primary key (user_id, id)
);

create table if not exists public.notas_docente (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  id             text not null,
  titulo         text not null default '',
  contenido      text not null default '',
  categoria      text not null default 'General',
  alumno_id      text not null default '',
  fecha          text not null default '',
  destacada      boolean not null default false,
  audio_data     text not null default '',
  audio_duracion numeric not null default 0,
  creado         timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists alumnos_orden_idx      on public.alumnos (user_id, no_lista);
create index if not exists asistencias_per_idx    on public.asistencias (user_id, periodo);
create index if not exists tareas_per_idx         on public.tareas (user_id, periodo);
create index if not exists evidencias_alumno_idx  on public.evidencias (user_id, alumno_id);
create index if not exists notas_docente_orden    on public.notas_docente (user_id, creado desc);

-- ---------- Google Drive (solo la función "drive" las usa) ----------
-- Guardan el id de la carpeta de Drive de cada maestro. Tienen RLS activado SIN políticas:
-- ningún maestro puede leerlas ni escribirlas; solo la función (service role).

create table if not exists public.drive_carpetas (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  folder_id text not null
);

create table if not exists public.drive_ajustes (
  clave text primary key,
  valor text not null
);

alter table public.drive_carpetas enable row level security;
alter table public.drive_ajustes  enable row level security;
revoke all on public.drive_carpetas from anon, authenticated;
revoke all on public.drive_ajustes  from anon, authenticated;

-- ---------- Seguridad: cada maestro solo ve lo suyo (RLS) ----------

do $$
declare t text;
begin
  foreach t in array array[
    'configuracion','periodos','materias','alumnos','asistencias',
    'tareas','calificaciones','acuerdos_cte','evidencias','notas_docente'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists propietario on public.%I', t);
    execute format(
      'create policy propietario on public.%I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))', t);
  end loop;
end $$;

-- ---------- Datos iniciales para cada maestro nuevo ----------

create or replace function public.sembrar_usuario(p_uid uuid, p_nombre text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.configuracion (user_id, docente)
  values (p_uid, coalesce(p_nombre, ''))
  on conflict (user_id) do nothing;

  insert into public.periodos (user_id, id, nombre, orden) values
    (p_uid, 'Trimestre 1', '1er Trimestre', 1),
    (p_uid, 'Trimestre 2', '2do Trimestre', 2),
    (p_uid, 'Trimestre 3', '3er Trimestre', 3)
  on conflict do nothing;

  insert into public.materias (user_id, id, nombre, clave, orden) values
    (p_uid, 'lenguajes', 'Lenguajes (Español)', 'LENG', 1),
    (p_uid, 'saberes',   'Saberes y Pensamiento Científico (Matemáticas y Ciencias)', 'SPC', 2),
    (p_uid, 'etica',     'Ética, Naturaleza y Sociedades (Historia y Formación Cívica)', 'ENS', 3),
    (p_uid, 'humano',    'De lo Humano y lo Comunitario (Tutoría y Ed. Física)', 'DHC', 4),
    (p_uid, 'ingles',    'Inglés', 'ING', 5)
  on conflict do nothing;
end;
$$;

-- Al registrarse un maestro nuevo se le crea su configuración, periodos y materias
create or replace function public.al_crear_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sembrar_usuario(new.id, coalesce(new.raw_user_meta_data->>'nombre', ''));
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.al_crear_usuario();

-- Para cuentas creadas antes de instalar el trigger: la app lo llama al iniciar sesión
create or replace function public.asegurar_perfil()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;
  perform public.sembrar_usuario(auth.uid(), '');
end;
$$;

-- ---------- Funciones de guardado (una sola llamada, sin pisar datos) ----------

create or replace function public.guardar_calificacion(p_alumno text, p_periodo text, p_notas jsonb)
returns void
language sql
set search_path = ''
as $$
  insert into public.calificaciones (user_id, alumno_id, periodo, notas)
  values (auth.uid(), p_alumno, p_periodo, coalesce(p_notas, '{}'::jsonb))
  on conflict (user_id, alumno_id, periodo)
  do update set notas = public.calificaciones.notas || excluded.notas;
$$;

create or replace function public.guardar_asistencia(p_fecha date, p_periodo text, p_registros jsonb)
returns void
language sql
set search_path = ''
as $$
  insert into public.asistencias (user_id, fecha, periodo, registros)
  values (auth.uid(), p_fecha, coalesce(p_periodo, ''), coalesce(p_registros, '{}'::jsonb))
  on conflict (user_id, fecha)
  do update set registros = public.asistencias.registros || excluded.registros,
                periodo = case when p_periodo is null or p_periodo = ''
                               then public.asistencias.periodo else p_periodo end;
$$;

create or replace function public.guardar_entregas(p_tarea text, p_entregas jsonb)
returns void
language sql
set search_path = ''
as $$
  update public.tareas
     set entregas = entregas || coalesce(p_entregas, '{}'::jsonb)
   where user_id = auth.uid() and id = p_tarea;
$$;

-- ---------- Restaurar respaldo (todo o nada, en una sola transacción) ----------
-- Acepta el mismo formato JSON del respaldo de la versión anterior (db.json).

create or replace function public.restaurar_respaldo(p jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'No autenticado';
  end if;
  if p->'config' is null or jsonb_typeof(p->'alumnos') is distinct from 'array' then
    raise exception 'Formato de respaldo inválido';
  end if;

  delete from public.calificaciones where user_id = uid;
  delete from public.asistencias   where user_id = uid;
  delete from public.tareas        where user_id = uid;
  delete from public.acuerdos_cte  where user_id = uid;
  delete from public.notas_docente where user_id = uid;
  delete from public.alumnos       where user_id = uid;
  delete from public.materias      where user_id = uid;
  delete from public.periodos      where user_id = uid;

  insert into public.configuracion (user_id, escuela, cct, zona, sector, grado, grupo, ciclo, docente, periodo_activo, tipo_periodo)
  values (
    uid,
    coalesce(p->'config'->>'escuela', ''),
    coalesce(p->'config'->>'cct', ''),
    coalesce(p->'config'->>'zona', ''),
    coalesce(p->'config'->>'sector', ''),
    coalesce(p->'config'->>'grado', '1°'),
    coalesce(p->'config'->>'grupo', 'A'),
    coalesce(p->'config'->>'ciclo', ''),
    coalesce(p->'config'->>'docente', ''),
    coalesce(p->'config'->>'periodoActivo', 'Trimestre 1'),
    coalesce(p->'config'->>'tipoPeriodo', 'Trimestre')
  )
  on conflict (user_id) do update set
    escuela = excluded.escuela, cct = excluded.cct, zona = excluded.zona, sector = excluded.sector,
    grado = excluded.grado, grupo = excluded.grupo, ciclo = excluded.ciclo, docente = excluded.docente,
    periodo_activo = excluded.periodo_activo, tipo_periodo = excluded.tipo_periodo;

  if jsonb_typeof(p->'config'->'membrete') = 'object' then
    update public.configuracion set membrete = p->'config'->'membrete' where user_id = uid;
  end if;

  if jsonb_typeof(p->'categoriasNotas') = 'array' then
    update public.configuracion set categorias_notas = p->'categoriasNotas' where user_id = uid;
  end if;

  insert into public.periodos (user_id, id, nombre, orden)
  select uid, e->>'id', coalesce(e->>'nombre', e->>'id'), o::int
    from jsonb_array_elements(coalesce(p->'periodos', '[]'::jsonb)) with ordinality as t(e, o);

  insert into public.materias (user_id, id, nombre, clave, orden)
  select uid, e->>'id', e->>'nombre', coalesce(e->>'clave', ''), o::int
    from jsonb_array_elements(coalesce(p->'materias', '[]'::jsonb)) with ordinality as t(e, o);

  insert into public.alumnos (user_id, id, no_lista, nombre, curp, tutor, telefono, notas)
  select uid, e->>'id', coalesce((e->>'noLista')::int, o::int), e->>'nombre',
         coalesce(e->>'curp', ''), coalesce(e->>'tutor', ''), coalesce(e->>'telefono', ''), coalesce(e->>'notas', '')
    from jsonb_array_elements(p->'alumnos') with ordinality as t(e, o);

  insert into public.asistencias (user_id, fecha, periodo, registros)
  select uid, (e->>'fecha')::date, coalesce(e->>'periodo', ''), coalesce(e->'registros', '{}'::jsonb)
    from jsonb_array_elements(coalesce(p->'asistencias', '[]'::jsonb)) as t(e)
  on conflict (user_id, fecha) do nothing;

  insert into public.tareas (user_id, id, titulo, materia_id, periodo, fecha, descripcion, entregas)
  select uid, e->>'id', coalesce(e->>'titulo', 'Tarea'), coalesce(e->>'materiaId', ''), coalesce(e->>'periodo', ''),
         coalesce((e->>'fecha')::date, current_date), coalesce(e->>'descripcion', ''), coalesce(e->'entregas', '{}'::jsonb)
    from jsonb_array_elements(coalesce(p->'tareas', '[]'::jsonb)) as t(e);

  insert into public.calificaciones (user_id, alumno_id, periodo, notas)
  select uid, e->>'alumnoId', e->>'periodo', coalesce(e->'notas', '{}'::jsonb)
    from jsonb_array_elements(coalesce(p->'calificaciones', '[]'::jsonb)) as t(e)
   where exists (select 1 from public.alumnos a where a.user_id = uid and a.id = e->>'alumnoId')
  on conflict (user_id, alumno_id, periodo) do update set notas = excluded.notas;

  insert into public.acuerdos_cte (user_id, id, sesion, fecha_registro, acuerdo, responsable, fecha_limite, estatus, observaciones, creado)
  select uid, e->>'id', coalesce(e->>'sesion', ''), coalesce(e->>'fechaRegistro', ''), coalesce(e->>'acuerdo', ''),
         coalesce(e->>'responsable', ''), coalesce(e->>'fechaLimite', ''), coalesce(e->>'estatus', 'Pendiente'),
         coalesce(e->>'observaciones', ''), now() - (o * interval '1 second')
    from jsonb_array_elements(coalesce(p->'acuerdosCTE', '[]'::jsonb)) with ordinality as t(e, o);

  insert into public.notas_docente (user_id, id, titulo, contenido, categoria, alumno_id, fecha, destacada, audio_data, audio_duracion, creado)
  select uid, e->>'id', coalesce(e->>'titulo', ''), coalesce(e->>'contenido', ''), coalesce(e->>'categoria', 'General'),
         coalesce(e->>'alumnoId', ''), coalesce(e->>'fecha', ''), coalesce((e->>'destacada')::boolean, false),
         coalesce(e->>'audioData', ''), coalesce((e->>'audioDuracion')::numeric, 0), now() - (o * interval '1 second')
    from jsonb_array_elements(coalesce(p->'notasDocente', '[]'::jsonb)) with ordinality as t(e, o);
end;
$$;

-- ---------- Almacenamiento de fotos (privado, máx. 3 MB por archivo) ----------
-- Es temporal: cuando conectemos Google Drive solo cambia este módulo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('evidencias', 'evidencias', false, 3145728,
        array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types,
      public = false;

drop policy if exists "evidencias_propias" on storage.objects;
create policy "evidencias_propias" on storage.objects
  for all to authenticated
  using (bucket_id = 'evidencias' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'evidencias' and (storage.foldername(name))[1] = (select auth.uid())::text);
