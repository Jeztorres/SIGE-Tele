import React, { useState } from 'react';
import { School, Mail, Lock, User, Loader2, ShieldCheck, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase';
import SelectorTema from './SelectorTema';

// Traduce los errores más comunes de Supabase Auth
function traducirError(msg = '') {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Debes confirmar tu correo. Revisa tu bandeja de entrada (y el spam).';
  if (m.includes('user already registered')) return 'Ya existe una cuenta con ese correo. Inicia sesión.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  if (m.includes('signups not allowed')) return 'El registro de nuevas cuentas está desactivado por el administrador.';
  if (m.includes('failed to fetch') || m.includes('network')) return 'Sin conexión a internet. Revisa tu red.';
  return msg || 'Ocurrió un error. Inténtalo de nuevo.';
}

export default function Login() {
  const [modo, setModo] = useState('entrar'); // 'entrar' | 'registro' | 'recuperar'
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  // Google bloquea el inicio de sesión dentro de la app de escritorio (Electron)
  const permiteGoogle = !window.electron;

  const cambiarModo = (m) => {
    setModo(m);
    setError('');
    setAviso('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAviso('');
    setCargando(true);
    try {
      if (modo === 'entrar') {
        const { error: err } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: clave });
        if (err) throw err;
      } else if (modo === 'registro') {
        if (clave.length < 8) throw new Error('Password should be at least 8 characters');
        const { data, error: err } = await supabase.auth.signUp({
          email: correo.trim(),
          password: clave,
          options: { data: { nombre: nombre.trim() }, emailRedirectTo: window.location.origin }
        });
        if (err) throw err;
        // Con confirmación de correo activada no hay sesión todavía
        if (!data.session) {
          setAviso('¡Cuenta creada! Te enviamos un correo para confirmarla. Ábrelo y después inicia sesión.');
          setModo('entrar');
          setClave('');
        }
      } else {
        const { error: err } = await supabase.auth.resetPasswordForEmail(correo.trim(), {
          redirectTo: window.location.origin
        });
        if (err) throw err;
        setAviso('Si el correo está registrado, recibirás un enlace para crear una nueva contraseña.');
      }
    } catch (err) {
      setError(traducirError(err.message));
    } finally {
      setCargando(false);
    }
  };

  const entrarConGoogle = async () => {
    setError('');
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (err) setError(traducirError(err.message));
  };

  const titulos = {
    entrar: ['Bienvenido(a), maestro(a)', 'Inicia sesión para ver tu grupo'],
    registro: ['Crea tu cuenta', 'Gratis para docentes de telesecundaria'],
    recuperar: ['Recuperar contraseña', 'Te enviaremos un enlace a tu correo']
  };

  const inputBase =
    'w-full min-h-[44px] pl-10 pr-3 py-2 rounded-lg border border-[#D1D5DB] bg-white text-sm text-[#050F1A] placeholder:text-[#8A919E] focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]';

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 relative">
      <SelectorTema variante="icono" className="absolute top-3 right-3" />
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#0052FF] text-white flex items-center justify-center mx-auto mb-3 cb-shadow-level-2">
            <School className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-[#050F1A]">SIGE-Tele</h1>
          <p className="text-xs text-[#5B616E]">Sistema de Gestión Escolar para Telesecundaria</p>
        </div>

        <div className="cb-card p-5 sm:p-7">
          {modo === 'recuperar' && (
            <button
              type="button"
              onClick={() => cambiarModo('entrar')}
              className="flex items-center gap-1 text-xs font-semibold text-[#5B616E] hover:text-[#050F1A] mb-3"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Volver
            </button>
          )}

          <h2 className="font-bold text-lg text-[#050F1A]">{titulos[modo][0]}</h2>
          <p className="text-xs sm:text-sm text-[#5B616E] mb-5">{titulos[modo][1]}</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {modo === 'registro' && (
              <label className="block">
                <span className="text-xs font-bold text-[#050F1A]">Nombre del docente</span>
                <div className="relative mt-1">
                  <User className="w-4 h-4 text-[#8A919E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Mtra. Eva Torres"
                    autoComplete="name"
                    className={inputBase}
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-bold text-[#050F1A]">Correo electrónico</span>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-[#8A919E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  placeholder="tucorreo@ejemplo.com"
                  autoComplete="email"
                  className={inputBase}
                />
              </div>
            </label>

            {modo !== 'recuperar' && (
              <label className="block">
                <span className="text-xs font-bold text-[#050F1A]">Contraseña</span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-[#8A919E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={verClave ? 'text' : 'password'}
                    required
                    minLength={modo === 'registro' ? 8 : undefined}
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={modo === 'registro' ? 'Mínimo 8 caracteres' : 'Tu contraseña'}
                    autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
                    className={`${inputBase} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setVerClave(!verClave)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-[#8A919E] hover:text-[#050F1A]"
                    aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {verClave ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
            )}

            {modo === 'entrar' && (
              <div className="text-right -mt-1">
                <button
                  type="button"
                  onClick={() => cambiarModo('recuperar')}
                  className="text-xs font-semibold text-[#0052FF] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs font-medium text-[#DF2935] bg-[#FDECEE] border border-[#F5C2C7] rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            {aviso && (
              <div className="text-xs font-medium text-[#04784A] bg-[#E6F6EF] border border-[#A8E6C9] rounded-lg px-3 py-2">
                {aviso}
              </div>
            )}

            <button type="submit" disabled={cargando} className="cb-btn-primary w-full text-sm flex items-center justify-center gap-2">
              {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>
                {modo === 'entrar' ? 'Iniciar sesión' : modo === 'registro' ? 'Crear mi cuenta' : 'Enviar enlace'}
              </span>
            </button>
          </form>

          {modo !== 'recuperar' && permiteGoogle && (
            <>
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-[#D1D5DB]" />
                <span className="text-[11px] text-[#8A919E] font-semibold">O</span>
                <div className="flex-1 h-px bg-[#D1D5DB]" />
              </div>
              <button
                type="button"
                onClick={entrarConGoogle}
                className="cb-btn-secondary w-full text-sm flex items-center justify-center gap-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.4 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
                  <path fill="#FBBC05" d="M10.5 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.9-6.1z" />
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
                </svg>
                <span>Continuar con Google</span>
              </button>
            </>
          )}

          {modo !== 'recuperar' && (
            <p className="text-center text-xs text-[#5B616E] mt-5">
              {modo === 'entrar' ? '¿Aún no tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
              <button
                type="button"
                onClick={() => cambiarModo(modo === 'entrar' ? 'registro' : 'entrar')}
                className="font-bold text-[#0052FF] hover:underline"
              >
                {modo === 'entrar' ? 'Regístrate' : 'Inicia sesión'}
              </button>
            </p>
          )}
        </div>

        <p className="flex items-center justify-center gap-1.5 text-[11px] text-[#8A919E] mt-4">
          <ShieldCheck className="w-3.5 h-3.5 text-[#05B169]" />
          Tus datos y los de tus alumnos solo los ves tú.
        </p>
      </div>
    </div>
  );
}
