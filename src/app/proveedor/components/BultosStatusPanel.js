"use client";

import { useEffect, useState } from "react";
import { formatearHora, formatearDuracion } from "@/lib/horarios";
import { ESTADOS_BULTO, etiquetaEstado, clasesEstado } from "@/lib/estadosBulto";

export default function BultosStatusPanel({
  citas = [],
  sucursales = [],
  citaSeleccionada,
  onSeleccionarCita,
  onVerEtiquetas,
}) {
  const [folio, setFolio] = useState(citaSeleccionada?.folioFactura || citas[0]?.folioFactura || "");

  useEffect(() => {
    if (citaSeleccionada?.folioFactura) setFolio(citaSeleccionada.folioFactura);
  }, [citaSeleccionada?.folioFactura]);

  const cita = citas.find((c) => c.folioFactura === folio) || citas[0];
  const bultos = cita?.bultos || [];
  const sucursalesPorId = new Map(sucursales.map((s) => [s.id, s]));

  const conteo = bultos.reduce((acc, b) => {
    acc[b.estado] = (acc[b.estado] || 0) + 1;
    return acc;
  }, {});
  const recibidos = (conteo.EN_RACK || 0) + (conteo.EMBARCADO || 0);
  const piezasDeclaradas = bultos.reduce((acc, b) => acc + Number(b.piezas || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Seguimiento de Entrega por Caja</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Consulta en tiempo real qué cajas ya fueron recibidas y validadas en el andén del CEDIS.
          </p>
        </div>
        <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-extrabold text-emerald-900">
          {recibidos} de {bultos.length} cajas recibidas
        </span>
      </div>

      {citas.length === 0 ? (
        <div className="p-10 text-center text-sm text-slate-500">
          Aún no tienes entregas registradas. Agenda primero tu cita para dar seguimiento a tus cajas.
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1 max-w-md">
              <label htmlFor="factura-estado" className="block text-xs font-semibold text-slate-600 mb-1.5">
                Selecciona tu Factura / Orden de Compra
              </label>
              <select
                id="factura-estado"
                value={folio}
                onChange={(e) => {
                  setFolio(e.target.value);
                  const nueva = citas.find((c) => c.folioFactura === e.target.value);
                  if (nueva) onSeleccionarCita?.(nueva);
                }}
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {citas.map((c) => (
                  <option key={c.folioFactura} value={c.folioFactura}>
                    {c.folioFactura} — {c.idOc}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onVerEtiquetas}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5"
            >
              Ver etiquetas QR de esta entrega →
            </button>
          </div>

          {cita && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-extrabold text-slate-900">
                  Orden {cita.idOc} · Factura {cita.folioFactura}
                </p>
                <p className="text-slate-500 mt-0.5">
                  Andén #{cita.anden} · Fecha {cita.fecha} ({formatearHora(cita.horaInicio)} a{" "}
                  {formatearHora(cita.horaInicio + cita.duracionHoras)} hrs · {formatearDuracion(cita.duracionHoras)} hrs) ·{" "}
                  {piezasDeclaradas} piezas en total
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ESTADOS_BULTO).map(([estado, config]) => (
                  <span key={estado} className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${config.clases}`}>
                    {config.texto}: {conteo[estado] || 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Folio de Caja</th>
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3 text-right">Piezas</th>
                  <th className="px-4 py-3">Sucursal Destino</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bultos.map((bulto) => {
                  const sucursal = sucursalesPorId.get(Number(bulto.sucursalId));
                  return (
                    <tr key={bulto.idBulto} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">{bulto.idBulto}</td>
                      <td className="px-4 py-3 text-slate-700">
                        <span className="font-mono font-semibold">{bulto.sku}</span>
                        {bulto.descripcion ? <span className="block text-[11px] text-slate-400">{bulto.descripcion}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-900">{bulto.piezas}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {sucursal?.nombre || `Sucursal ${String(bulto.sucursalId).padStart(2, "0")}`}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${clasesEstado(bulto.estado)}`}>
                          {etiquetaEstado(bulto.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {bulto.motivoRechazo || (bulto.estado === "EN_RACK" ? "Recibido sin incidencias" : "En espera de recepción")}
                      </td>
                    </tr>
                  );
                })}
                {bultos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      Esta factura no tiene cajas registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
