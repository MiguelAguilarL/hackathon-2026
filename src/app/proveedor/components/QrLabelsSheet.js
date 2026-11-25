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
  const [copiadoId, setCopiadoId] = useState(null);

  if (!citaSeleccionadaQR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-sm">
        No hay facturas registradas aún. Agenda una cita en el Paso 1 para generar sus etiquetas QR.
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

  const copiarPayloadParaHandheld = (payload, idBulto) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(payload);
      setCopiadoId(idBulto);
      setTimeout(() => setCopiadoId(null), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Barra de Herramientas (Oculta al imprimir en PDF / Láser) */}
      <div className="no-print bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded">
            Momento 2 · Identificación y Etiquetado QR por Bulto
          </span>
          <h2 className="text-lg font-bold mt-1">
            Plancha de Etiquetas QR · Factura{" "}
            <span className="font-mono text-amber-400">{citaSeleccionadaQR.folioFactura}</span> ({citaSeleccionadaQR.idOc})
          </h2>
          <p className="text-xs text-slate-400">
            El proveedor descarga, imprime y pega cada etiqueta en su caja correspondiente antes de llegar al Andén #{citaSeleccionadaQR.anden}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={citaSeleccionadaQR.folioFactura}
            onChange={(e) => {
              const encontrada = citasFacturas.find((c) => c.folioFactura === e.target.value);
              if (encontrada) setCitaSeleccionadaQR(encontrada);
            }}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-semibold"
          >
            {citasFacturas.map((c) => (
              <option key={c.folioFactura} value={c.folioFactura}>
                Factura: {c.folioFactura} ({c.idOc} · Andén #{c.anden} · {c.bultos?.length || 0} bultos)
              </option>
            ))}
          </select>

          <select
            value={filtroSucursal}
            onChange={(e) => setFiltroSucursal(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
          >
            <option value="TODAS">Todas las sucursales ({citaSeleccionadaQR.bultos?.length || 0})</option>
            {Array.from(new Set((citaSeleccionadaQR.bultos || []).map((b) => b.sucursalId))).map((sId) => (
              <option key={sId} value={sId}>
                Solo SUC-{String(sId).padStart(2, "0")} (RACK-{String(sId).padStart(2, "0")})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => window.print()}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-4 py-2 rounded-lg text-xs transition shadow"
          >
            🖨️ Imprimir / Descargar PDF de Etiquetas QR
          </button>
        </div>
      </div>

      {/* Cinta informativa de la cita asociada */}
      <div className="no-print bg-slate-50 px-6 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span>
            <strong>Proveedor:</strong> {citaSeleccionadaQR.proveedor}
          </span>
          <span>
            <strong>Cita:</strong> {citaSeleccionadaQR.fecha} en <strong>Andén #{citaSeleccionadaQR.anden}</strong> (
            {formatearHora(citaSeleccionadaQR.horaInicio)} a{" "}
            {formatearHora(citaSeleccionadaQR.horaInicio + citaSeleccionadaQR.duracionHoras)} hrs ·{" "}
            {formatearDuracion(citaSeleccionadaQR.duracionHoras)} de descarga)
          </span>
        </div>
        <span className="font-mono text-[11px] text-emerald-700 font-bold">
          ✓ Compatibilidad 100% con Escáner 2D en /handheld
        </span>
      </div>

      {/* Cuadrícula de Etiquetas Térmicas Tipo Zebra 4x6" */}
      <div className="p-6 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bultosFiltrados.map((bulto, idx) => {
          const sucNum = String(bulto.sucursalId).padStart(2, "0");
          // Payload exacto que lee /handheld y valida /api/cedis
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
              {/* Encabezado Industrial de Etiqueta */}
              <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 block">
                    CEDIS CATLOVERS · ETIQUETA DE BULTO
                  </span>
                  <span className="font-mono font-black text-sm tracking-tight">{bulto.idBulto}</span>
                </div>
                <div className="text-right">
                  <span className="bg-amber-400 text-slate-950 font-black font-mono text-xs px-2 py-0.5 rounded block">
                    RACK-{sucNum}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono">
                    Bulto {idx + 1} de {bultosFiltrados.length}
                  </span>
                </div>
              </div>

              {/* Cuerpo Principal con los 6 Datos Obligatorios + QR */}
              <div className="p-4 flex items-start justify-between gap-3 border-b border-dashed border-slate-300">
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">1. Sucursal Destino</span>
                    <span className="font-extrabold text-sm text-slate-900">
                      SUC-{sucNum} · {obtenerNombreSucursal(bulto.sucursalId)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">2. Orden Compra</span>
                      <span className="font-mono font-bold text-slate-900">{bulto.idOc}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Folio Factura</span>
                      <span className="font-mono font-bold text-slate-900">{bulto.folioFactura}</span>
                    </div>
                  </div>
                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">3. Proveedor</span>
                    <span className="font-semibold text-slate-800 line-clamp-1">{bulto.proveedor}</span>
                  </div>
                </div>

                <div className="p-2 border-2 border-slate-900 rounded-lg bg-white shrink-0">
                  <QRCodeSVG value={qrPayload} size={96} level="M" />
                </div>
              </div>

              {/* Detalle de SKU, Piezas, Peso y Volumen */}
              <div className="p-4 bg-slate-50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">4. Producto (SKU Único)</span>
                    <span className="font-mono font-black text-sm text-slate-900">{bulto.sku}</span>
                    <span className="block text-[11px] text-slate-600">{bulto.descripcion}</span>
                  </div>
                  <div className="text-right bg-white border border-slate-300 px-3 py-1.5 rounded-lg">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">5. Cantidad</span>
                    <span className="font-black text-base text-slate-900">{bulto.piezas} pzas</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                  <span>
                    <strong>Peso:</strong> {bulto.pesoKg} kg · <strong>Volumen:</strong> {bulto.volumenM3} m³
                  </span>
                  <span className="font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                    {bulto.estado}
                  </span>
                </div>

                <div className="no-print pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => copiarPayloadParaHandheld(qrPayload, bulto.idBulto)}
                    className="text-[11px] font-bold text-slate-700 hover:text-slate-950 underline"
                  >
                    {copiadoId === bulto.idBulto
                      ? "✓ JSON copiado para pegar en /handheld"
                      : "Copiar JSON del QR para prueba manual"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
