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
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
            Seguimiento de Mercancía
          </span>
          <h2 className="text-lg font-bold mt-1">Estado actual de tus bultos / cajas por compra</h2>
          <p className="text-xs text-slate-400">
            El estado se actualiza cuando el CEDIS escanea cada etiqueta QR en el andén de recibo.
          </p>
        </div>
        <span className="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-extrabold text-amber-400">
          {recibidos} de {bultos.length} bultos recibidos
        </span>
      </div>

      {citas.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Aún no tienes facturas registradas. Agenda una cita para generar tus etiquetas QR y su seguimiento.
        </div>
      ) : (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0 flex-1 max-w-md">
              <label htmlFor="factura-estado" className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                Factura / Orden de Compra
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
                    {c.folioFactura} · {c.idOc}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={onVerEtiquetas}
              className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-4 py-2.5"
            >
              Ver etiquetas QR de esta factura →
            </button>
          </div>

          {cita && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-extrabold text-slate-900 font-mono">
                  {cita.idOc} · {cita.folioFactura}
                </p>
                <p className="text-slate-600 mt-0.5">
                  Andén #{cita.anden} · {cita.fecha} ({formatearHora(cita.horaInicio)} –{" "}
                  {formatearHora(cita.horaInicio + cita.duracionHoras)} · {formatearDuracion(cita.duracionHoras)}) ·{" "}
                  {piezasDeclaradas} piezas declaradas
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ESTADOS_BULTO).map(([estado, config]) => (
                  <span key={estado} className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${config.clases}`}>
                    {config.texto}: {conteo[estado] || 0}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead className="bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">ID de bulto</th>
                  <th className="px-3 py-2.5">SKU</th>
                  <th className="px-3 py-2.5 text-right">Piezas</th>
                  <th className="px-3 py-2.5">Sucursal / Rack</th>
                  <th className="px-3 py-2.5">Estado</th>
                  <th className="px-3 py-2.5">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bultos.map((bulto) => {
                  const sucursal = sucursalesPorId.get(Number(bulto.sucursalId));
                  return (
                    <tr key={bulto.idBulto} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">{bulto.idBulto}</td>
                      <td className="px-3 py-2.5 font-mono text-slate-700">{bulto.sku}</td>
                      <td className="px-3 py-2.5 text-right font-extrabold text-slate-900">{bulto.piezas}</td>
                      <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                        {sucursal?.codigo || `SUC-${String(bulto.sucursalId).padStart(2, "0")}`}
                        {sucursal?.rackAsignado ? ` · ${sucursal.rackAsignado}` : ""}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black ring-1 ${clasesEstado(bulto.estado)}`}>
                          {etiquetaEstado(bulto.estado)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">
                        {bulto.motivoRechazo || (bulto.estado === "EN_RACK" ? "Validado en andén" : "—")}
                      </td>
                    </tr>
                  );
                })}
                {bultos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-500">
                      Esta factura aún no tiene bultos registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <p>
              Pendiente = esperando escaneo · En rack = recibido y ubicado · Rechazado = discrepancia con la OC ·
              Embarcado = enviado a sucursal.
            </p>
            <span className="font-semibold text-slate-400">
              El estado se actualiza al validar cada bulto en el CEDIS.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
