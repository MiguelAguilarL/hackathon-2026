"use client";

import { ESTADOS_BULTO, etiquetaEstado, clasesEstado } from "@/lib/estadosBulto";

export default function EstadoBultosCard({ cita, bultos = [] }) {
  const bultosDeCita = cita?.bultos || [];
  const porId = new Map(bultos.map((b) => [b.idBulto, b]));

  const conteo = bultosDeCita.reduce((acc, b) => {
    acc[b.estado] = (acc[b.estado] || 0) + 1;
    return acc;
  }, {});
  const recibidos = (conteo.EN_RACK || 0) + (conteo.EMBARCADO || 0);
  const total = bultosDeCita.length;

  return (
    <section
      aria-label="Estado de los bultos de la compra"
      className="px-5 py-3.5 bg-white border-b border-slate-200 md:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Estado actual de los bultos de la compra
          </p>
          <p className="text-xs font-extrabold text-slate-900 mt-0.5 truncate">
            {cita?.folioFactura || "Sin factura"} · {cita?.idOc || "Sin OC"}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-black text-amber-400">
          {recibidos}/{total} recibidos
        </span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold">
        {Object.entries(ESTADOS_BULTO).map(([estado, config]) => (
          <span key={estado} className={`rounded-full px-2 py-0.5 ring-1 ${config.clases}`}>
            {config.texto}: {conteo[estado] || 0}
          </span>
        ))}
      </div>

      {total === 0 ? (
        <p className="mt-2 text-[11px] text-slate-500">Esta factura aún no tiene bultos registrados.</p>
      ) : (
        <ul className="mt-2 max-h-44 overflow-y-auto rounded-lg ring-1 ring-slate-200 divide-y divide-slate-100">
          {bultosDeCita.map((bulto) => {
            const detalle = porId.get(bulto.idBulto);
            const sucursal = detalle?.sucursal;
            return (
              <li key={bulto.idBulto} className="flex items-center justify-between gap-2 px-2.5 py-1.5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-bold text-slate-800 truncate">{bulto.idBulto}</p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {bulto.sku} · {bulto.piezas} pzas ·{" "}
                    {sucursal?.codigo || `SUC-${String(bulto.sucursalId).padStart(2, "0")}`}
                    {sucursal?.rackAsignado ? ` (${sucursal.rackAsignado})` : ""}
                  </p>
                  {bulto.estado === "RECHAZADO" && bulto.motivoRechazo && (
                    <p className="text-[10px] font-semibold text-red-700 truncate">{bulto.motivoRechazo}</p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${clasesEstado(bulto.estado)}`}>
                  {etiquetaEstado(bulto.estado)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
