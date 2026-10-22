import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// La clave "anon" es pública por diseño: la seguridad real la dan las reglas RLS de la base de datos.
export const supabaseConfigurado = Boolean(url && anonKey);

// Dirección a la que Supabase regresa al maestro tras confirmar su correo, recuperar la contraseña
// o entrar con Google. Incluye la subcarpeta de GitHub Pages (BASE_URL), no solo el dominio.
export const urlDeRetorno = () => `${window.location.origin}${import.meta.env.BASE_URL}`;

export const supabase = supabaseConfigurado
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    })
  : null;
