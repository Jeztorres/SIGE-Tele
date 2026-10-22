import React, { useState } from 'react';
import { ImagePlus, Trash2, Save, RotateCcw, Check, FileText } from 'lucide-react';
import Membrete from './Membrete';
import { updateConfig } from '../api';
import { MEMBRETE_DEFAULT, COLORES_MEMBRETE, unirMembrete, procesarLogo } from '../membrete';

function CampoLogo({ etiqueta, src, onElegir, onQuitar, error }) {
  return (
    <div>
      <span className="text-xs font-bold text-[#050F1A]">{etiqueta}</span>
      <div className="mt-1.5 flex items-center gap-3">
        <div className="w-20 h-20 rounded-xl border border-dashed border-[#D1D5DB] bg-[#F9FAFB] flex items-center justify-center overflow-hidden shrink-0">
          {src ? (
            <img src={src} alt={etiqueta} className="max-w-full max-h-full object-contain" />
          ) : (
            <ImagePlus className="w-6 h-6 text-[#8A919E]" />
          )}
        </div>
        <div className="space-y-1.5">
          <label className="cb-btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer !min-h-[38px] !px-3">
            <ImagePlus className="w-3.5 h-3.5" />
            <span>{src ? 'Cambiar' : 'Subir logo'}</span>
            <input type="file" accept="image/*" className="hidden" onChange={onElegir} />
          </label>
          {src && (
            <button
              type="button"
              onClick={onQuitar}
              className="flex items-center gap-1 text-xs font-bold text-[#DF2935] hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" /> Quitar
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-[#DF2935] mt-1">{error}</p>}
    </div>
  );
}

export default function EditorMembrete({ config, onDataChange }) {
  const [m, setM] = useState(() => unirMembrete(config?.membrete));
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [errorIzq, setErrorIzq] = useState('');
  const [errorDer, setErrorDer] = useState('');
  const [errorGeneral, setErrorGeneral] = useState('');

  const cambiar = (campo, valor) => {
    setM((prev) => ({ ...prev, [campo]: valor }));
    setGuardado(false);
  };

  const elegirLogo = (lado) => async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const setError = lado === 'Izq' ? setErrorIzq : setErrorDer;
    setError('');
    try {
      const { src, ratio } = await procesarLogo(file);
      setM((prev) => ({ ...prev, [`logo${lado}`]: src, [`logo${lado}Ratio`]: ratio }));
      setGuardado(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const quitarLogo = (lado) => () => {
    setM((prev) => ({ ...prev, [`logo${lado}`]: '', [`logo${lado}Ratio`]: 1 }));
    setGuardado(false);
  };

  const restablecer = () => {
    if (!window.confirm('¿Volver al membrete original? Se quitarán tus logos y textos personalizados (hasta que guardes).')) return;
    setM({ ...MEMBRETE_DEFAULT });
    setGuardado(false);
  };

  const guardar = async () => {
    setGuardando(true);
    setErrorGeneral('');
    try {
      await updateConfig({ membrete: m });
      setGuardado(true);
      if (onDataChange) await onDataChange();
      setTimeout(() => setGuardado(false), 3500);
    } catch (err) {
      const falta = /membrete/i.test(err.message) ? ' Falta ejecutar la actualización del esquema SQL en Supabase (archivo supabase/esquema.sql).' : '';
      setErrorGeneral('No se pudo guardar: ' + err.message + falta);
    } finally {
      setGuardando(false);
    }
  };

  const inputClase =
    'w-full min-h-[44px] px-3 py-2 rounded-lg border border-[#D1D5DB] bg-white text-sm text-[#050F1A] placeholder:text-[#8A919E] focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]';

  const itemsMuestra = [
    { etiqueta: 'Escuela', valor: config?.escuela || 'Nombre de tu escuela' },
    { etiqueta: 'C.C.T.', valor: config?.cct || '00ETV0000X', tipo: 'mono' },
    { etiqueta: 'Zona', valor: config?.zona || '00', tipo: 'mono' },
    { etiqueta: 'Grado y Gpo', valor: `${config?.grado || '1°'} "${config?.grupo || 'A'}"`, tipo: 'azul' }
  ];

  return (
    <div data-tour="ajustes-membrete" className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
      {/* Formulario */}
      <div className="cb-card p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="font-bold text-base text-[#050F1A] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#0052FF]" />
            <span>Membrete de tus documentos</span>
          </h3>
          <p className="text-xs sm:text-sm text-[#5B616E] mt-1">
            Aparece en el reporte del CTE, en el expediente de cada alumno y en el Excel de calificaciones. El nombre de la
            escuela, C.C.T., zona y grupo salen de «Datos Escolares».
          </p>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-[#050F1A]">Encabezado superior</span>
          <input
            type="text"
            value={m.encabezado}
            onChange={(e) => cambiar('encabezado', e.target.value)}
            placeholder="Ej. Secretaría de Educación Pública • Subsistema de Telesecundarias"
            className={`${inputClase} mt-1`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-[#050F1A]">Lema o leyenda (opcional)</span>
          <input
            type="text"
            value={m.lema}
            onChange={(e) => cambiar('lema', e.target.value)}
            placeholder='Ej. "Educar para transformar"'
            className={`${inputClase} mt-1`}
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-[#050F1A]">Pie del encabezado (domicilio, teléfono, correo)</span>
          <textarea
            rows={2}
            value={m.pie}
            onChange={(e) => cambiar('pie', e.target.value)}
            placeholder="Ej. Calle Hidalgo s/n, Col. Centro • Tel. 555 123 4567 • escuela@correo.com"
            className={`${inputClase} mt-1 resize-none`}
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CampoLogo
            etiqueta="Logo izquierdo"
            src={m.logoIzq}
            onElegir={elegirLogo('Izq')}
            onQuitar={quitarLogo('Izq')}
            error={errorIzq}
          />
          <CampoLogo
            etiqueta="Logo derecho"
            src={m.logoDer}
            onElegir={elegirLogo('Der')}
            onQuitar={quitarLogo('Der')}
            error={errorDer}
          />
        </div>

        <div>
          <span className="text-xs font-bold text-[#050F1A]">Color de la línea</span>
          <div className="mt-1.5 flex items-center gap-2 flex-wrap">
            {COLORES_MEMBRETE.map((c) => (
              <button
                key={c.valor}
                type="button"
                onClick={() => cambiar('color', c.valor)}
                title={c.nombre}
                aria-label={`Color ${c.nombre}`}
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition ${
                  m.color === c.valor ? 'border-[#0052FF] scale-110' : 'border-[#D1D5DB]'
                }`}
                style={{ backgroundColor: c.valor }}
              >
                {m.color === c.valor && <Check className="w-4 h-4 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {errorGeneral && (
          <div className="text-xs font-medium text-[#DF2935] bg-[#FDECEE] border border-[#F5C2C7] rounded-lg px-3 py-2">
            {errorGeneral}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
          <button type="button" onClick={restablecer} className="cb-btn-secondary text-xs flex items-center justify-center gap-1.5">
            <RotateCcw className="w-4 h-4" />
            <span>Volver al original</span>
          </button>
          <button
            type="button"
            onClick={guardar}
            disabled={guardando}
            className="cb-btn-primary text-xs flex-1 flex items-center justify-center gap-2"
          >
            {guardado ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{guardando ? 'Guardando...' : guardado ? '¡Membrete guardado!' : 'Guardar membrete'}</span>
          </button>
        </div>
      </div>

      {/* Vista previa en vivo */}
      <div className="cb-card p-5 sm:p-6 xl:sticky xl:top-4">
        <span className="text-[11px] font-bold text-[#8A919E] tracking-wide">VISTA PREVIA</span>
        <div className="mt-3 rounded-xl border border-[#D1D5DB] bg-white p-4 sm:p-5">
          <Membrete titulo="Título del documento" membrete={m} items={itemsMuestra} />
          <div className="space-y-2">
            <div className="h-2.5 rounded bg-[#F3F4F6] w-11/12" />
            <div className="h-2.5 rounded bg-[#F3F4F6] w-10/12" />
            <div className="h-2.5 rounded bg-[#F3F4F6] w-8/12" />
          </div>
        </div>
        <p className="text-[11px] text-[#8A919E] mt-2.5">
          Los cambios se ven aquí al instante. Presiona «Guardar membrete» para aplicarlos a tus documentos.
        </p>
      </div>
    </div>
  );
}
