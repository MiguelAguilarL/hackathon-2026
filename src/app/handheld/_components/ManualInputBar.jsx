"use client";

import { useRef, useState } from "react";

export default function ManualInputBar({ onTexto, onPayload, bultosPendientes, deshabilitado }) {
  const [valor, setValor] = useState("");
  const inputRef = useRef(null);

  const enviar = (evento) => {
    evento.preventDefault();
    if (!valor.trim()) {
      inputRef.current?.focus();
      return;
    }
    onTexto(valor);
    setValor("");
  };

  const cargarEjemplo = () => {
    const bulto = bultosPendientes[0];
    if (!bulto) return;
    setValor(
      JSON.stringify({
        idBulto: bulto.idBulto,
        idOc: bulto.idOc,
        folioFactura: bulto.folioFactura,
        proveedor: bulto.proveedor,
        sucursalId: bulto.sucursalId,
        sku: bulto.sku,
        piezas: bulto.piezas,
      })
    );
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={enviar} className="px-5 py-2.5 bg-white border-b border-slate-200 space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-label="Enfocar entrada de pistola láser"
          className="min-h-[44px] min-w-[44px] shrink-0 rounded-lg bg-slate-900 text-white grid place-items-center hover:bg-slate-800"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path d="M4 7V5a2 2 0 0 1 2-2h2M16 3h2a2 2 0 0 1 2 2v2M20 17v2a2 2 0 0 1-2 2h-2M8 21H6a2 2 0 0 1-2-2v-2M7 12h10M7 8h6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          ref={inputRef}
          value={valor}
          onChange={(evento) => setValor(evento.target.value)}
          inputMode="none"
          autoComplete="off"
          placeholder="Pistola láser o contenido del QR"
          aria-label="Lectura de pistola láser o contenido del QR"
          className="min-h-[44px] w-full min-w-0 rounded-lg bg-slate-100 ring-1 ring-slate-300 px-3 font-mono text-xs text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          disabled={deshabilitado}
          className="min-h-[44px] shrink-0 rounded-lg bg-sky-700 px-4 text-xs font-extrabold text-white hover:bg-sky-800 disabled:opacity-50"
        >
          Validar
        </button>
      </div>

      <details className="text-[11px]">
        <summary className="cursor-pointer list-none font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600">
          Herramientas de prueba ▾
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-2 pb-1">
          <button
            type="button"
            onClick={cargarEjemplo}
            className="min-h-[44px] rounded-lg bg-slate-100 ring-1 ring-slate-300 text-slate-700 font-bold hover:bg-slate-200"
          >
            Usar QR válido
          </button>
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() =>
              onPayload({
                idBulto: "BUL-ERR-SKU",
                idOc: bultosPendientes[0]?.idOc || "OC-2026-001",
                sku: "SKU-NO-PEDIDO-999",
                piezas: 25,
                sucursalId: bultosPendientes[0]?.sucursalId || 1,
              })
            }
            className="min-h-[44px] rounded-lg bg-red-50 ring-1 ring-red-300 text-red-800 font-bold hover:bg-red-100 disabled:opacity-50"
          >
            SKU no pedido
          </button>
          <button
            type="button"
            disabled={deshabilitado}
            onClick={() =>
              onPayload({
                idBulto: "BUL-ERR-EXC",
                idOc: bultosPendientes[0]?.idOc || "OC-2026-001",
                sku: bultosPendientes[0]?.sku || "SKU-ACE-01",
                piezas: 950,
                sucursalId: bultosPendientes[0]?.sucursalId || 1,
              })
            }
            className="min-h-[44px] rounded-lg bg-amber-50 ring-1 ring-amber-300 text-amber-900 font-bold hover:bg-amber-100 disabled:opacity-50 col-span-2"
          >
            Piezas excedentes
          </button>
        </div>
      </details>
    </form>
  );
}
