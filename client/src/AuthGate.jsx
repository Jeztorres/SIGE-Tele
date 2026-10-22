import React, { createContext, useContext, useEffect, useState } from 'react';
import { Lock, Loader2, Database } from 'lucide-react';
import { supabase, supabaseConfigurado } from './supabase';
import Login from './components/Login';

const AuthContext = createContext({ user: null, cerrarSesion: async () => {} });
export const useAuth = () => useContext(AuthContext);

// Borra lo que la app guarda en el navegador para que otro maestro en la misma
// computadora no vea datos del anterior.
function limpiarAlmacenLocal() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sige_tele_'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

function Pantalla({ children }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4 text-[#050F1A]">
      <div className="cb-card p-6 sm:p-8 max-w-md w-full text-center">{children}</div>
    </div>
  );
}

function NuevaContrasena({ onListo }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const guardar = async (e) => {
    e.preventDefault();
    if (clave.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    setCargando(true);
    const { error: err } = await supabase.auth.updateUser({ password: clave });
    setCargando(false);
    if (err) setError(err.message);
    else onListo();
  };

  return (
    <Pantalla>
      <div className="w-12 h-12 rounded-xl bg-[#E8F0FF] text-[#0052FF] flex items-center justify-center mx-auto mb-3">
        <Lock className="w-6 h-6" />
      </div>
      <h2 className="font-bold text-lg">Crea tu nueva contraseña</h2>
      <p className="text-xs text-[#5B616E] mb-4">Elige una contraseña de al menos 8 caracteres.</p>
      <form onSubmit={guardar} className="space-y-3 text-left">
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder="Nueva contraseña"
          className="w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#D1D5DB] text-sm focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
        />
        {error && <p className="text-xs font-medium text-[#DF2935]">{error}</p>}
        <button type="submit" disabled={cargando} className="cb-btn-primary w-full text-sm flex items-center justify-center gap-2">
          {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Guardar contraseña</span>
        </button>
      </form>
    </Pantalla>
  );
}

export default function AuthGate({ children }) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [recuperando, setRecuperando] = useState(false);

  useEffect(() => {
    if (!supabaseConfigurado) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evento, nuevaSesion) => {
      if (evento === 'PASSWORD_RECOVERY') setRecuperando(true);
      if (evento === 'SIGNED_OUT') limpiarAlmacenLocal();
      setSesion(nuevaSesion);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    limpiarAlmacenLocal();
    await supabase.auth.signOut();
  };

  if (!supabaseConfigurado) {
    return (
      <Pantalla>
        <div className="w-12 h-12 rounded-xl bg-[#FEF6E7] text-[#B87514] flex items-center justify-center mx-auto mb-3">
          <Database className="w-6 h-6" />
        </div>
        <h2 className="font-bold text-lg">Falta conectar la base de datos</h2>
        <p className="text-sm text-[#5B616E] mt-2">
          Crea el archivo <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">client/.env.local</code> con
          las claves de tu proyecto de Supabase (mira <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">client/.env.example</code> y{' '}
          <code className="bg-[#F3F4F6] px-1.5 py-0.5 rounded text-xs">supabase/LEEME.md</code>) y reinicia la aplicación.
        </p>
      </Pantalla>
    );
  }

  if (cargando) {
    return (
      <Pantalla>
        <div className="w-10 h-10 border-[3px] border-[#0052FF] border-t-transparent rounded-full animate-spin mx-auto" />
      </Pantalla>
    );
  }

  if (recuperando && sesion) {
    return <NuevaContrasena onListo={() => setRecuperando(false)} />;
  }

  if (!sesion) return <Login />;

  return (
    <AuthContext.Provider value={{ user: sesion.user, cerrarSesion }}>
      {/* key: al cambiar de usuario se reinician todos los datos en pantalla */}
      <React.Fragment key={sesion.user.id}>{children}</React.Fragment>
    </AuthContext.Provider>
  );
}
