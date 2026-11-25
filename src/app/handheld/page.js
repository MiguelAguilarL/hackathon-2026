"use client";

import { useState, useEffect } from "react";

export default function HandheldPage() {
  const [data, setData] = useState(null);
  const [qrInput, setQrInput] = useState("");
  const [resultadoEscaneo, setResultadoEscaneo] = useState(null);
  const [reporteFaltantes, setReporteFaltantes] = useState(null);

  const cargarDatos = async () => {
    const res = await fetch("/api/cedis");
    const json = await res.json();
    setData(json);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const procesarPayloadQR = async (payloadObj) => {
    setResultadoEscaneo(null);
    const res = await fetch("/api/cedis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "ESCANEAR_BULTO",
        ...payloadObj,
      }),
    });
    const json = await res.json();
    setResultadoEscaneo(json);
    cargarDatos();
  };

  const handleScanManual = (e) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(qrInput);
      procesarPayloadQR(parsed);
    } catch {
      setResultadoEscaneo({
        ok: false,
        rechazado: true,
        motivo: "El código QR escaneado no tiene un formato JSON válido de etiqueta CEDIS.",
      });
    }
  };

  const verificarFaltantesFactura = (cita) => {
    const faltantes = cita.bultos.filter((b) => b.estado === "PENDIENTE_RECIBO");
    setReporteFaltantes({
      folioFactura: cita.folioFactura,
      idOc: cita.idOc,
      faltantes,
    });
  };

  const bultosPendientes = data?.bultos?.filter((b) => b.estado === "PENDIENTE_RECIBO") || [];

  return (
    <div className="max-w-lg mx-auto bg-slate-900 text-white rounded-2xl p-6 shadow-xl border-4 border-slate-700 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-700 pb-3">
        <div>
          <span className="text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded">
            DEV 2 · TERMINAL INDUSTRIAL ANDROID 2D
          </span>
          <h1 className="text-xl font-extrabold mt-1">Recibo y Validación QR en Andén</h1>
        </div>
        <span className="text-xs font-mono text-emerald-400">Wi-Fi 6: -48 dBm</span>
      </div>

      {/* Estado de lectura inmediata (Verde OK / Rojo Rechazo Cero Tolerancia) */}
      {resultadoEscaneo && (
        <div
          className={`p-4 rounded-xl border-2 ${
            resultadoEscaneo.rechazado
              ? "bg-red-950 border-red-500 text-red-200"
              : "bg-emerald-950 border-emerald-400 text-emerald-200"
          }`}
        >
          <p className="text-xs font-black uppercase tracking-wider">
            {resultadoEscaneo.rechazado ? "ALERTA ROJA · BULTO RECHAZADO EN ANDÉN" : "VALIDACIÓN EXITOSA · ENVIAR A RACK"}
          </p>
          <p className="text-base font-bold mt-1">
            {resultadoEscaneo.rechazado ? resultadoEscaneo.motivo : resultadoEscaneo.mensaje}
          </p>
        </div>
      )}

      {/* Simulador rápido de escaneo con 1 clic para la demo frente a los jueces */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase text-slate-400">
          1. Bultos en Andén listos para escanear con Lector 2D:
        </p>
        {bultosPendientes.length === 0 ? (
          <p className="text-xs text-slate-400 bg-slate-800 p-3 rounded-lg">
            No hay bultos pendientes de escanear. Agenda una nueva cita en /proveedor.
          </p>
        ) : (
          bultosPendientes.map((b) => (
            <div
              key={b.idBulto}
              className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2"
            >
              <div className="text-xs">
                <p className="font-mono font-bold text-amber-400">
                  {b.idBulto} · {b.sku} ({b.piezas} pzas)
                </p>
                <p className="text-slate-400">
                  OC: {b.idOc} · Destino: SUC-{String(b.sucursalId).padStart(2, "0")} ({b.pesoKg} kg / {b.volumenM3} m³)
                </p>
              </div>
              <button
                onClick={() =>
                  procesarPayloadQR({
                    idBulto: b.idBulto,
                    idOc: b.idOc,
                    sku: b.sku,
                    piezas: b.piezas,
                    sucursalId: b.sucursalId,
                  })
                }
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3 py-2 rounded-lg shrink-0"
              >
                Escanear QR Válido
              </button>
            </div>
          ))
        )}

        {/* Botones de prueba para demostrar Cero Tolerancia a Discrepancias */}
        <p className="text-xs font-bold uppercase text-slate-400 pt-2">
          2. Pruebas de Discrepancia (Cero Tolerancia):
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() =>
              procesarPayloadQR({
                idBulto: "BUL-ERR-SKU",
                idOc: "OC-2026-001",
                sku: "SKU-NO-PEDIDO-999",
                piezas: 25,
                sucursalId: 1,
              })
            }
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs p-3 rounded-xl text-left"
          >
            Simular QR con SKU No Solicitado
          </button>
          <button
            onClick={() =>
              procesarPayloadQR({
                idBulto: "BUL-ERR-EXC",
                idOc: "OC-2026-001",
                sku: "SKU-ACE-01",
                piezas: 950,
                sucursalId: 1,
              })
            }
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs p-3 rounded-xl text-left"
          >
            Simular QR con Piezas Excedentes
          </button>
        </div>
      </div>

      {/* Entrada directa para Pistola Láser USB/Bluetooth o JSON QR */}
      <form onSubmit={handleScanManual} className="space-y-2 border-t border-slate-800 pt-4">
        <label className="block text-xs font-bold uppercase text-slate-400">
          Entrada Escáner Láser Hardware (JSON del QR):
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder='{"idBulto":"BUL-8841-02","idOc":"OC-2026-001",...}'
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-xs font-bold shrink-0"
          >
            Validar
          </button>
        </div>
      </form>

      {/* Cierre de Descarga y Detección de Faltantes */}
      <div className="border-t border-slate-800 pt-4 space-y-2">
        <p className="text-xs font-bold uppercase text-slate-400">3. Cierre de Camión y Reporte de Faltantes:</p>
        {data?.citasFacturas?.map((cita) => (
          <div key={cita.folioFactura} className="flex items-center justify-between bg-slate-800 p-2.5 rounded-lg text-xs">
            <span>
              Factura <strong>{cita.folioFactura}</strong> (Andén {cita.anden})
            </span>
            <button
              onClick={() => verificarFaltantesFactura(cita)}
              className="bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded font-semibold"
            >
              Auditar Faltantes
            </button>
          </div>
        ))}

        {reporteFaltantes && (
          <div className="p-3 rounded-xl bg-amber-950 border border-amber-500 text-amber-200 text-xs mt-2">
            <p className="font-bold uppercase">
              Auditoría Factura {reporteFaltantes.folioFactura} ({reporteFaltantes.idOc}):
            </p>
            {reporteFaltantes.faltantes.length === 0 ? (
              <p className="mt-1 text-emerald-300 font-semibold">
                Recepción 100% completa. Todos los bultos de la factura fueron escaneados y ubicados en rack.
              </p>
            ) : (
              <ul className="mt-1 list-disc list-inside space-y-1">
                {reporteFaltantes.faltantes.map((f) => (
                  <li key={f.idBulto}>
                    FALTANTE DETECTADO: <strong>{f.idBulto}</strong> · SKU {f.sku} ({f.piezas} pzas) para Sucursal{" "}
                    {f.sucursalId}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
