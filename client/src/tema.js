import { useCallback, useEffect, useState } from 'react';

// Modo claro / oscuro / automático (sigue al sistema). Se guarda en este dispositivo.
// La clave no empieza con "sige_tele_" a propósito: así no se borra al cerrar sesión.
const CLAVE = 'sige_tema_modo';

export function leerModo() {
  try {
    const m = localStorage.getItem(CLAVE);
    return m === 'claro' || m === 'oscuro' ? m : 'auto';
  } catch {
    return 'auto';
  }
}

export function esOscuro(modo) {
  if (modo === 'oscuro') return true;
  if (modo === 'claro') return false;
  return Boolean(window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

export function aplicarTema(modo = leerModo()) {
  const oscuro = esOscuro(modo);
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', oscuro);
  raiz.style.colorScheme = oscuro ? 'dark' : 'light';
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', oscuro ? '#0A101D' : '#0052FF');
}

export function guardarModo(modo) {
  try {
    localStorage.setItem(CLAVE, modo);
  } catch {
    // sin almacenamiento: el cambio vale solo para esta sesión
  }
  aplicarTema(modo);
  window.dispatchEvent(new CustomEvent('sige:tema', { detail: modo }));
}

export function useTema() {
  const [modo, setModo] = useState(leerModo);

  useEffect(() => {
    const alCambiar = (e) => setModo(e.detail || leerModo());
    window.addEventListener('sige:tema', alCambiar);

    // En modo automático se reacciona cuando el sistema cambia de claro a oscuro
    const consulta = window.matchMedia?.('(prefers-color-scheme: dark)');
    const alCambiarSistema = () => {
      if (leerModo() === 'auto') aplicarTema('auto');
    };
    consulta?.addEventListener?.('change', alCambiarSistema);
    return () => {
      window.removeEventListener('sige:tema', alCambiar);
      consulta?.removeEventListener?.('change', alCambiarSistema);
    };
  }, []);

  const elegir = useCallback((nuevo) => {
    guardarModo(nuevo);
    setModo(nuevo);
  }, []);

  return { modo, oscuro: esOscuro(modo), elegir };
}
