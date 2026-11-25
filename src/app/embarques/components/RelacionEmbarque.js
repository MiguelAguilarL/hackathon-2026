"use client";

import { QRCodeSVG } from "qrcode.react";

export default function RelacionEmbarque({ embarque }) {
  if (!embarque) return null;

  const nombreSucursal =
    embarque.sucursal?.nombre || `Sucursal #${embarque.sucursalId}`;
  const rack = embarque.sucursal?.rackAsignado;
  const bultos = embarque.bultos || [];

  const qrPayload = JSON.stringify({
    idEmbarque: embarque.idEmbarque,
    sucursalId: embarque.sucursalId,
    pesoTotalKg: embarque.pesoTotalKg,
    volumenTotalM3: embarque.volumenTotalM3,
    totalBultos: bultos.length,
  });

  return (
    <section className="bg-white p-8 rounded-xl border-2 border-slate-900 shadow-sm">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
            Documento de salida
          </span>
          <h2 className="text-lg font-bold mt-1">Relación de Embarque</h2>
          <p className="text-xs text-slate-500">Lista para impresión láser o guardar como PDF.</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs"
        >
          Imprimir / Guardar PDF
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            CEDIS Catlovers · Relación de embarque a sucursal
          </p>
          <h3 className="text-2xl font-black font-mono mt-1">{embarque.idEmbarque}</h3>
          <p className="text-sm font-semibold mt-1">
            Destino: {nombreSucursal}
            {rack ? ` (${rack})` : ""}
          </p>
          <p className="text-xs text-slate-600">
            Andén #{embarque.andenSalida} · Unidad: Tortón (12 tarimas / 12 ton)
          </p>
        </div>

        <div className="flex items-center gap-4 border border-slate-300 p-3 rounded-lg">
          <div className="text-right text-xs">
            <p className="font-bold">QR maestro de recepción</p>
            <p className="text-slate-500">Escanear en sucursal destino</p>
            <p className="font-mono font-bold mt-1">
              Peso: {embarque.pesoTotalKg.toLocaleString()} kg (
              {embarque.porcentajePeso.toFixed(1)}%)
            </p>
            <p className="font-mono font-bold">
              Vol: {embarque.volumenTotalM3.toFixed(2)} m³ (
              {embarque.porcentajeVolumen.toFixed(1)}%)
            </p>
          </div>
          <QRCodeSVG value={qrPayload} size={96} />
        </div>
      </div>

      <table className="w-full text-left text-xs mt-6 border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-900 uppercase bg-slate-100">
            <th className="py-2 px-3">ID Bulto</th>
            <th className="py-2 px-3">Orden de Compra</th>
            <th className="py-2 px-3">Factura</th>
            <th className="py-2 px-3">SKU</th>
            <th className="py-2 px-3">Piezas</th>
            <th className="py-2 px-3">Peso (kg)</th>
            <th className="py-2 px-3">Volumen (m³)</th>
          </tr>
        </thead>
        <tbody>
          {bultos.map((b) => (
            <tr key={b.idBulto} className="border-b border-slate-200">
              <td className="py-2 px-3 font-mono font-bold">{b.idBulto}</td>
              <td className="py-2 px-3">{b.idOc}</td>
              <td className="py-2 px-3">{b.folioFactura}</td>
              <td className="py-2 px-3 font-mono">{b.sku}</td>
              <td className="py-2 px-3">{b.piezas}</td>
              <td className="py-2 px-3">{b.pesoKg.toLocaleString()} kg</td>
              <td className="py-2 px-3">{b.volumenM3.toFixed(2)} m³</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
