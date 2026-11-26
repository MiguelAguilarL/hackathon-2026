"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { formatearHora, formatearDuracion } from "@/lib/horarios";

export default function QrLabelsSheet({
  citasFacturas = [],
  citaSeleccionadaQR,
  setCitaSeleccionadaQR,
  sucursales = [],
}) {
  const [filtroSucursal, setFiltroSucursal] = useState("TODAS");

  if (!citaSeleccionadaQR) {
    return (
      <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
        Aún no tienes etiquetas generadas. Agenda primero tu cita de entrega para obtener las etiquetas QR de tus cajas.
      </div>
    );
  }

  const bultosFiltrados =
    filtroSucursal === "TODAS"
      ? citaSeleccionadaQR.bultos || []
      : (citaSeleccionadaQR.bultos || []).filter((b) => Number(b.sucursalId) === Number(filtroSucursal));

  const obtenerNombreSucursal = (id) => {
    const s = sucursales.find((suc) => Number(suc.id) === Number(id));
    return s ? s.nombre : `Sucursal ${String(id).padStart(2, "0")}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra superior limpia para elegir factura e imprimir */}
      <div className="no-print p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Etiquetas QR para tus Cajas · Factura{" "}
            <span className="font-mono text-amber-600">{citaSeleccionadaQR.folioFactura}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Imprime este documento y pega cada etiqueta en su caja correspondiente antes de acudir al Andén #{citaSeleccionadaQR.anden}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={citaSeleccionadaQR.folioFactura}
            onChange={(e) => {
              const encontrada = citasFacturas.find((c) => c.folioFactura === e.target.value);
              if (encontrada) setCitaSeleccionadaQR(encontrada);
            }}
            className="bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2 text-xs font-bold"
          >
            {citasFacturas.map((c) => (
              <option key={c.folioFactura} value={c.folioFactura}>
                {c.folioFactura} ({c.idOc} · {c.bultos?.length || 0} cajas)
              </option>
            ))}
          </select>

          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-700 rounded-xl px-3 py-2 text-xs font-medium"
          >
            <option value="TODAS">Todas las sucursales ({citaSeleccionadaQR.bultos?.length || 0})</option>
            {Array.from(new Set((citaSeleccionadaQR.bultos || []).map((b) => b.sucursalId))).map((sId) => (
              <option key={sId} value={sId}>
                Sucursal {String(sId).padStart(2, "0")}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm"
          >
            Imprimir / Guardar PDF
          </button>
        </div>
      </div>

      {/* Resumen de la cita asociada */}
      <div className="no-print bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <span>
          <strong>Orden de Compra:</strong> {citaSeleccionadaQR.idOc} · <strong>Proveedor:</strong>{" "}
          {citaSeleccionadaQR.proveedor}
        </span>
        <span>
          <strong>Cita programada:</strong> {citaSeleccionadaQR.fecha} · <strong>Andén #{citaSeleccionadaQR.anden}</strong> (
          {formatearHora(citaSeleccionadaQR.horaInicio)} a{" "}
          {formatearHora(citaSeleccionadaQR.horaInicio + citaSeleccionadaQR.duracionHoras)} hrs ·{" "}
          {formatearDuracion(citaSeleccionadaQR.duracionHoras)} hrs)
        </span>
      </div>

      {/* Plancha de etiquetas listas para impresión */}
      <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bultosFiltrados.map((bulto, idx) => {
          const sucNum = String(bulto.sucursalId).padStart(2, "0");
          const qrPayload = JSON.stringify({
            idBulto: bulto.idBulto,
            idOc: bulto.idOc,
            folioFactura: bulto.folioFactura,
            proveedor: bulto.proveedor,
            sucursalId: bulto.sucursalId,
            sku: bulto.sku,
            piezas: bulto.piezas,
          });

          return (
            <div
              key={bulto.idBulto}
              className="border-2 border-slate-900 rounded-xl overflow-hidden bg-white flex flex-col justify-between shadow-sm break-inside-avoid"
            >
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">
                    CEDIS MJJO · ETIQUETA DE BULTO
                  </span>
                  <span className="font-mono font-black text-sm">{bulto.idBulto}</span>
                </div>
                <div className="text-right">
                  <span className="bg-amber-400 text-slate-950 font-black font-mono text-xs px-2 py-0.5 rounded block">
                    SUC-{sucNum}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Caja {idx + 1} de {bultosFiltrados.length}
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-start justify-between gap-3 border-b border-dashed border-slate-300">
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Sucursal destino</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      {obtenerNombreSucursal(bulto.sucursalId)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Orden Compra</span>
                      <span className="font-mono font-bold text-slate-900">{bulto.idOc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Factura</span>
                      <span className="font-mono font-bold text-slate-900">{bulto.folioFactura}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Proveedor</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{bulto.proveedor}</span>
                  </div>
                </div>

                <div className="p-2 border border-slate-900 rounded-lg bg-white shrink-0">
                  <QRCodeSVG value={qrPayload} size={92} level="M" />
                </div>
              </div>

              <div className="p-4 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Producto</span>
                    <span className="font-mono font-black text-sm text-slate-900">{bulto.sku}</span>
                    <span className="block text-[11px] text-slate-600 line-clamp-1">{bulto.descripcion}</span>
                  </div>
                  <div className="text-right bg-white border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Piezas</span>
                    <span className="font-black text-base text-slate-900">{bulto.piezas}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-500">
                  <span>Peso: {bulto.pesoKg} kg</span>
                  <span>Volumen: {bulto.volumenM3} m³</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
