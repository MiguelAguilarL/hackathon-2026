"use client";

import { useEffect, useRef } from "react";

export default function IncidentSheet({ abierto, resultado, payload, onCerrar }) {
  const cerrarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;
    cerrarRef.current?.focus();
    const manejarTecla = (evento) => {
      if (evento.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className="absolute inset-0 z-20 flex items-end" role="dialog" aria-modal="true" aria-label="Detalle de incidencia">
      <button
        type="button"
        aria-label="Cerrar detalle de incidencia"
        onClick={onCerrar}
        className="absolute inset-0 bg-slate-950/70"
      />
      <div className="relative w-full rounded-t-2xl bg-white p-5 pb-7 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-red-700">Incidencia registrada</p>
            <h2 className="text-lg font-extrabold text-slate-900">Bulto apartado en andén</h2>
          </div>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] rounded-full bg-slate-100 text-slate-700 grid place-items-center hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-3">
          <p className="text-xs font-bold text-red-950 leading-snug">
            {resultado?.motivo || "El servidor no devolvió un motivo de rechazo."}
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Bulto</dt>
            <dd className="font-mono font-bold text-slate-800">{payload?.idBulto || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">SKU</dt>
            <dd className="font-mono font-bold text-slate-800">{payload?.sku || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Orden de compra</dt>
            <dd className="font-mono font-bold text-slate-800">{payload?.idOc || "—"}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-bold uppercase text-slate-400">Piezas</dt>
            <dd className="font-mono font-bold text-slate-800">{payload?.piezas ?? "—"}</dd>
          </div>
        </dl>

        <p className="text-xs text-slate-600 leading-relaxed">
          El rechazo quedó registrado en el sistema. Aparta el bulto, informa al proveedor y no lo ubiques en Rack.
          Si el SKU o la cantidad son correctos, corrige la etiqueta y vuelve a escanear.
        </p>

        <button
          type="button"
          onClick={onCerrar}
          className="w-full min-h-[56px] rounded-xl bg-slate-900 text-white text-sm font-extrabold hover:bg-slate-800"
        >
          Volver al escáner
        </button>
      </div>
    </div>
  );
}
