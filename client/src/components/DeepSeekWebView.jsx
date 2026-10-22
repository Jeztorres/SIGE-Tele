import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Copy,
  Check,
  Send,
  Smartphone,
  FileText,
  BookOpen,
  Users,
  Zap,
  BrainCircuit,
  RotateCcw
} from 'lucide-react';

export default function DeepSeekWebView() {
  const [mensajes, setMensajes] = useState([
    {
      remitente: 'ia',
      texto: '👋 ¡Hola, Maestro(a)! Soy **DeepSeek** y habito directamente aquí dentro de tu sistema de Telesecundaria.\n\n* **Sin API Key ni cuentas requeridas.**\n* **Funciona en tu computadora y en tu celular.**\n* **Sin abrir ventanas extras ni salir de la app.**\n\n¿En qué te puedo ayudar hoy? Puedes pedirme una planeación de la NEM, un citatorio formal por inasistencias, o propuestas de acuerdos para el CTE.'
    }
  ]);
  const [inputMensaje, setInputMensaje] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [copiadoIdx, setCopiadoIdx] = useState(null);
  const [modelo, setModelo] = useState('deepseek-chat'); // 'deepseek-chat' (V3) o 'deepseek-reasoner' (R1)
  const chatEndRef = useRef(null);

  const promptsDocentes = [
    {
      titulo: '📋 Citatorio por 3 Faltas',
      tipo: 'citatorio',
      prompt: 'Redacta un citatorio escolar formal y urgente para el tutor del alumno que acumuló 3 faltas consecutivas en Telesecundaria, con fecha para mañana a la 1:30 pm y talón de firma de enterado.'
    },
    {
      titulo: '📘 Planeación NEM 1 Semana',
      tipo: 'planeacion',
      prompt: 'Diseña una planeación didáctica de 1 semana para 2° de Telesecundaria integrando los campos formativos de Lenguajes y Saberes con un proyecto comunitario de cuidado del agua en la comunidad.'
    },
    {
      titulo: '🤝 Acuerdos para el CTE',
      tipo: 'cte',
      prompt: 'Propón 3 acuerdos concretos y medibles para la sesión de CTE de Telesecundaria enfocados en rescatar a los alumnos en Semáforo Rojo (rezago en matemáticas y comprensión lectora).'
    },
    {
      titulo: '💡 Rescatar 3 Tareas Pendientes',
      tipo: 'tareas',
      prompt: 'Sugerencias pedagógicas prácticas para regularizar a un alumno de Telesecundaria que lleva 3 tareas seguidas sin entregar sin sobrecargarlo de trabajo.'
    }
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const handleEnviarMensaje = async (textoAEnviar, tipo = null) => {
    const text = (textoAEnviar || inputMensaje).trim();
    if (!text) return;

    const nuevoHistorial = [...mensajes, { remitente: 'docente', texto: text }];
    setMensajes(nuevoHistorial);
    setInputMensaje('');
    setCargandoIA(true);

    let respuestaObtenida = '';
    let fuenteRespuesta = 'DeepSeek AI';

    // 1. Intentar llamar al motor directo de DeepSeek en el navegador (Puter.js)
    if (typeof window !== 'undefined' && window.puter?.ai?.chat) {
      try {
        const respuestaPuter = await window.puter.ai.chat(
          `Eres un asesor pedagógico de la Secretaría de Educación Pública (SEP) especializado en Telesecundarias y la Nueva Escuela Mexicana (NEM). Responde de forma estructurada, profesional y lista para el trabajo docente:\n\n${text}`,
          { model: modelo }
        );

        if (typeof respuestaPuter === 'string') {
          respuestaObtenida = respuestaPuter;
        } else if (respuestaPuter && respuestaPuter.message?.content) {
          respuestaObtenida = respuestaPuter.message.content;
        } else if (respuestaPuter && respuestaPuter.text) {
          respuestaObtenida = respuestaPuter.text;
        }
        fuenteRespuesta = modelo === 'deepseek-reasoner' ? 'DeepSeek R1 (Razonamiento)' : 'DeepSeek V3 Oficial';
      } catch (errPuter) {
        console.warn('Fallo en conexión Puter, usando motor local de respaldo:', errPuter);
      }
    }

    // 2. Si no se obtuvo respuesta, recurrir al motor pedagógico local del servidor
    if (!respuestaObtenida) {
      try {
        const res = await fetch('/api/deepseek/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mensaje: text,
            tipoPrompt: tipo
          })
        });

        const data = await res.json();
        respuestaObtenida = data.respuesta || 'Sin respuesta disponible en este momento.';
        fuenteRespuesta = data.fuente || 'DeepSeek Telesecundaria';
      } catch (err) {
        respuestaObtenida = 'Hubo un error de conexión con el motor de DeepSeek. Por favor intenta de nuevo.';
      }
    }

    setMensajes(prev => [
      ...prev,
      {
        remitente: 'ia',
        texto: respuestaObtenida,
        fuente: fuenteRespuesta
      }
    ]);
    setCargandoIA(false);
  };

  const handleCopiarTexto = (texto, idx) => {
    navigator.clipboard.writeText(texto);
    setCopiadoIdx(idx);
    setTimeout(() => setCopiadoIdx(null), 2000);
  };

  const reiniciarChat = () => {
    if (window.confirm('¿Deseas reiniciar la conversación?')) {
      setMensajes([
        {
          remitente: 'ia',
          texto: 'Conversación reiniciada. ¿Qué tema o proyecto de Telesecundaria deseas trabajar ahora?'
        }
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] min-h-[560px] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* 1. ENCABEZADO: DEEPSEEK HABITANDO DIRECTAMENTE AQUÍ DENTRO */}
      <div className="bg-slate-950 p-3 sm:px-4 sm:py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 text-white flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow shrink-0 ring-2 ring-blue-500/30">
            <Bot className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                DeepSeek AI
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.2 rounded border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Incrustado Aquí Mismo (Sin API Key)
              </span>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Smartphone className="w-3 h-3 text-blue-400" />
              <span>Funciona en Celular y Computadora sin abrir ventanas extras</span>
            </span>
          </div>
        </div>

        {/* Selector de Modelo DeepSeek V3 vs R1 y Reiniciar */}
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-0.5 flex items-center text-[11px]">
            <button
              onClick={() => setModelo('deepseek-chat')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                modelo === 'deepseek-chat'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="DeepSeek V3: Respuestas rápidas y fluidas"
            >
              <Zap className="w-3 h-3 text-yellow-300" />
              <span>V3 Rápido</span>
            </button>

            <button
              onClick={() => setModelo('deepseek-reasoner')}
              className={`px-2.5 py-1 rounded-md font-bold transition flex items-center gap-1 ${
                modelo === 'deepseek-reasoner'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="DeepSeek R1: Razonamiento profundo paso a paso"
            >
              <BrainCircuit className="w-3 h-3 text-cyan-300" />
              <span>R1 Razonamiento</span>
            </button>
          </div>

          <button
            onClick={reiniciarChat}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
            title="Reiniciar chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. BARRA DE PROMPTS CON 1 CLIC (IDEAL PARA CELULAR Y PC) */}
      <div className="bg-slate-950/70 p-2 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none text-xs">
        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 shrink-0">
          <Sparkles className="w-3.5 h-3.5" />
          Preguntas rápidas:
        </span>
        {promptsDocentes.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleEnviarMensaje(p.prompt, p.tipo)}
            className="px-2.5 py-1 bg-slate-800/90 active:bg-blue-600 hover:bg-slate-700 text-slate-200 text-xs rounded-full border border-slate-700 transition flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <span>{p.titulo}</span>
          </button>
        ))}
      </div>

      {/* 3. HISTORIAL DE CHAT */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-900/95">
        {mensajes.map((m, idx) => {
          const esDocente = m.remitente === 'docente';
          return (
            <div
              key={idx}
              className={`flex gap-2.5 ${esDocente ? 'justify-end' : 'justify-start'}`}
            >
              {!esDocente && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow text-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[90%] sm:max-w-2xl rounded-2xl p-3.5 sm:p-4 shadow text-xs leading-relaxed ${
                esDocente
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-slate-800 border border-slate-700/80 text-slate-200 rounded-bl-none'
              }`}>
                <div className="whitespace-pre-wrap font-sans">
                  {m.texto}
                </div>

                {!esDocente && (
                  <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold text-blue-300">{m.fuente || 'DeepSeek'}</span>
                    <button
                      onClick={() => handleCopiarTexto(m.texto, idx)}
                      className="flex items-center gap-1 text-slate-400 hover:text-white shrink-0 ml-2"
                    >
                      {copiadoIdx === idx ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {cargandoIA && (
          <div className="flex items-center gap-2 text-xs text-blue-400 p-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>DeepSeek está generando la respuesta pedagógica...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* 4. BARRA DE ENTRADA DIRECTA (CHATEAS DESDE AQUÍ) */}
      <div className="p-2.5 sm:p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleEnviarMensaje();
          }}
          className="flex items-center gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            placeholder="Pregúntale a DeepSeek aquí (Ej. Redacta el acuerdo 1 del CTE sobre lectura)..."
            value={inputMensaje}
            onChange={(e) => setInputMensaje(e.target.value)}
            className="flex-1 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2 sm:py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={cargandoIA || !inputMensaje.trim()}
            className="p-2 sm:p-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl shadow transition shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
