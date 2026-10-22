import React from 'react';
import { Sparkles, MessageSquare, Columns2, Maximize2 } from 'lucide-react';

const META_AI_URL = 'https://www.meta.ai/';

// Abre Meta AI en una ventana emergente pegada a la derecha de la pantalla
// (queda como pantalla dividida: el sistema a la izquierda, Meta AI a la derecha).
export function abrirMetaAI() {
  const sw = window.screen.availWidth;
  const sh = window.screen.availHeight;
  const ancho = Math.round(sw * 0.42);
  const left = (window.screen.availLeft || 0) + sw - ancho;
  const top = window.screen.availTop || 0;

  const popup = window.open(
    META_AI_URL,
    'meta_ai_chat',
    `popup=yes,width=${ancho},height=${sh},left=${left},top=${top}`
  );
  if (popup) {
    popup.focus();
    return true;
  }
  return false;
}

export default function MetaAIView({ onCloseFullScreen }) {
  const [bloqueada, setBloqueada] = React.useState(false);

  return (
    <div className="cb-card flex flex-col items-center justify-center text-center p-6 sm:p-12 min-h-[420px] relative">
      <div className="w-16 h-16 rounded-2xl bg-[#0052FF]/10 text-[#0052FF] flex items-center justify-center mb-5 border border-[#0052FF]/20">
        <Sparkles className="w-8 h-8" />
      </div>
      <h2 className="text-xl sm:text-2xl font-bold text-[#050F1A]">Asistente Pedagógico Meta AI</h2>
      <p className="text-xs sm:text-sm text-[#5B616E] mt-2 max-w-md">
        Se abre en una ventana lateral a la derecha de tu pantalla para que sigas trabajando en tu sistema simultáneamente. Si cierras este módulo para ver pantalla completa, te quedará una burbuja flotante de <b>Meta AI</b> en la esquina.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
        <button
          onClick={() => setBloqueada(!abrirMetaAI())}
          className="cb-btn-primary flex items-center justify-center gap-2.5 w-full sm:w-auto"
        >
          <MessageSquare className="w-5 h-5" />
          <span>Abrir Ventana Meta AI</span>
        </button>

        {onCloseFullScreen && (
          <button
            onClick={onCloseFullScreen}
            className="cb-btn-secondary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Maximize2 className="w-4 h-4 text-[#0052FF]" />
            <span>Cerrar para ver Pantalla Completa (Activar Burbuja)</span>
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center gap-1.5 text-xs text-[#8A919E]">
        <Columns2 className="w-4 h-4 shrink-0" />
        <span>Pantalla dividida en escritorio • Burbuja flotante siempre disponible</span>
      </div>

      {bloqueada && (
        <div className="mt-4 p-3 rounded-lg bg-[#FEF6E7] border border-[#F0AD4E] text-xs text-[#B87514] max-w-md">
          Tu navegador bloqueó la ventana emergente. Permite las ventanas emergentes para este sitio y vuelve a pulsar el botón.
        </div>
      )}
    </div>
  );
}
