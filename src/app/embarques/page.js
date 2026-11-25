"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function EmbarquesPage() {
  const [data, setData] = useState(null);
  const [sucursalActivaId, setSucursalActivaId] = useState(1);
  const [andenSalida, setAndenSalida] = useState(1);
  const [embarqueEmitido, setEmbarqueEmitido] = useState(null);
  const [error, setError] = useState(null);

  const cargarDatos = async () => {
    const res = await fetch("/api/cedis");
    const json = await res.json();
    setData(json);
    if (!embarqueEmitido && json.embarques?.length > 0) {
      setEmbarqueEmitido(json.embarques[0]);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  if (!data) {
    return <div className="p-6 text-sm text-slate-500">Cargando estado de los 32 Racks y Embarques...</div>;
  }

  const { rules, sucursales } = data;
  const sucursalSeleccionada = sucursales?.find((s) => s.id === sucursalActivaId) || sucursales?.[0];
  const bultosRack = sucursalSeleccionada?.bultos || [];

  const pesoAcumuladoKg = bultosRack.reduce((acc, b) => acc + b.pesoKg, 0);
  const volumenAcumuladoM3 = bultosRack.reduce((acc, b) => acc + b.volumenM3, 0);

  const pctPeso = (pesoAcumuladoKg / rules.TORTON_MAX_PESO_KG) * 100;
  const pctVolumen = (volumenAcumuladoM3 / rules.TORTON_MAX_VOLUMEN_M3) * 100;
  const cumpleRegla90 = pctPeso >= 90 && pctVolumen >= 90;

  const handleDespacharTorton = async () => {
    setError(null);
    const res = await fetch("/api/cedis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "DESPACHAR_EMBARQUE",
        sucursalId: sucursalSeleccionada.id,
        andenSalida,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
    } else {
      await cargarDatos();
      setEmbarqueEmitido({
        ...json.embarque,
        bultos: bultosRack,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Panel Consolidador de Camión Tortón (Regla del 90%) */}
      <div className="no-print bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase text-blue-700 bg-blue-100 px-2.5 py-1 rounded">
              DEV 3 · Momento 4 (32 Racks y Consolidador Tortón ≥90%)
            </span>
            <h1 className="text-2xl font-bold mt-2">
              Control de Almacenamiento Temporal (32 Racks) y Salida de Tortones
            </h1>
            <p className="text-sm text-slate-600">
              Capacidad Máxima Tortón (12 Tarimas): {rules.TORTON_MAX_PESO_KG.toLocaleString()} kg y{" "}
              {rules.TORTON_MAX_VOLUMEN_M3.toFixed(2)} m³ · Candado de salida: ≥ 90% en Peso y Volumen.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Detalle del Rack Seleccionado */}
        {sucursalSeleccionada && (
          <div className="bg-slate-900 text-white p-6 rounded-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase text-amber-400">
                  {sucursalSeleccionada.rackAsignado} · Capacidad: 32 Tarimas (4 niveles × 8)
                </span>
                <h2 className="text-xl font-extrabold">{sucursalSeleccionada.nombre}</h2>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={andenSalida}
                  onChange={(e) => setAndenSalida(Number(e.target.value))}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                >
                  {[1, 2, 3].map((a) => (
                    <option key={a} value={a}>
                      Andén de Embarque #{a}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!cumpleRegla90}
                  onClick={handleDespacharTorton}
                  className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition ${
                    cumpleRegla90
                      ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg"
                      : "bg-slate-700 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  {cumpleRegla90
                    ? "Liberar Tortón y Emitir Relación de Embarque"
                    : "Bloqueado: Requiere ≥90% Peso y Volumen"}
                </button>
              </div>
            </div>

            {/* Barras de progreso dobles: Peso y Volumen */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>
                    PESO ACUMULADO: {pesoAcumuladoKg.toLocaleString()} kg / {rules.TORTON_MAX_PESO_KG.toLocaleString()} kg
                  </span>
                  <span className={pctPeso >= 90 ? "text-emerald-400" : "text-amber-400"}>
                    {pctPeso.toFixed(1)}% (Meta ≥ 90% = 10,800 kg)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${pctPeso >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(pctPeso, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-lg">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>
                    VOLUMEN ACUMULADO: {volumenAcumuladoM3.toFixed(2)} m³ / {rules.TORTON_MAX_VOLUMEN_M3.toFixed(2)} m³
                  </span>
                  <span className={pctVolumen >= 90 ? "text-emerald-400" : "text-amber-400"}>
                    {pctVolumen.toFixed(1)}% (Meta ≥ 90% = 25.73 m³)
                  </span>
                </div>
                <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${pctVolumen >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={{ width: `${Math.min(pctVolumen, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mapa de los 32 Racks (1 por Sucursal) */}
        <div>
          <h3 className="text-sm font-bold uppercase text-slate-500 mb-3">
            Mapa de los 32 Racks en Bodega (Selecciona un Rack para inspeccionar su consolidación):
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
            {sucursales?.map((suc) => {
              const peso = suc.bultos.reduce((a, b) => a + b.pesoKg, 0);
              const vol = suc.bultos.reduce((a, b) => a + b.volumenM3, 0);
              const pPeso = (peso / rules.TORTON_MAX_PESO_KG) * 100;
              const pVol = (vol / rules.TORTON_MAX_VOLUMEN_M3) * 100;
              const listo = pPeso >= 90 && pVol >= 90;

              return (
                <button
                  key={suc.id}
                  onClick={() => setSucursalActivaId(suc.id)}
                  className={`p-2.5 rounded-lg border text-left transition ${
                    sucursalActivaId === suc.id ? "ring-2 ring-blue-600 " : ""
                  }${
                    listo
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                      : peso > 0
                      ? "bg-amber-50 border-amber-300 text-amber-950"
                      : "bg-slate-50 border-slate-200 text-slate-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-xs">{suc.rackAsignado}</span>
                    <span className="text-[10px] font-bold">{suc.bultos.length}/32</span>
                  </div>
                  <p className="text-[11px] font-semibold truncate mt-0.5">{suc.codigo}</p>
                  <p className="text-[10px] mt-1">
                    P: {pPeso.toFixed(0)}% · V: {pVol.toFixed(0)}%
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Relación de Embarque Imprimible (PDF / Impresora Láser con QR Maestro) */}
      {embarqueEmitido && (
        <div className="bg-white p-8 rounded-xl border-2 border-slate-900 shadow-sm">
          <div className="no-print flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
                Documento Oficial de Salida
              </span>
              <h2 className="text-lg font-bold mt-1">Relación de Embarque Lista para Impresión Láser / PDF</h2>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-lg text-xs"
            >
              Imprimir en Láser / Guardar PDF
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b-2 border-slate-900 pb-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                CEDIS CATLOVERS · RELACIÓN DE EMBARQUE A SUCURSAL
              </p>
              <h3 className="text-2xl font-black font-mono mt-1">{embarqueEmitido.idEmbarque}</h3>
              <p className="text-sm font-semibold mt-1">
                Sucursal Destino: {embarqueEmitido.sucursal?.nombre || `Sucursal #${embarqueEmitido.sucursalId}`} (
                {embarqueEmitido.sucursal?.rackAsignado})
              </p>
              <p className="text-xs text-slate-600">
                Andén de Embarque: #{embarqueEmitido.andenSalida} · Unidad: Camión Tortón (12 Tarimas / 12 Ton)
              </p>
            </div>

            <div className="flex items-center gap-4 border border-slate-300 p-3 rounded-lg">
              <div className="text-right text-xs">
                <p className="font-bold">QR MAESTRO DE RECEPCIÓN</p>
                <p className="text-slate-500">Escanear en Sucursal Destino</p>
                <p className="font-mono font-bold mt-1">
                  Peso: {embarqueEmitido.pesoTotalKg.toLocaleString()} kg ({embarqueEmitido.porcentajePeso.toFixed(1)}%)
                </p>
                <p className="font-mono font-bold">
                  Vol: {embarqueEmitido.volumenTotalM3.toFixed(2)} m³ ({embarqueEmitido.porcentajeVolumen.toFixed(1)}%)
                </p>
              </div>
              <QRCodeSVG
                value={JSON.stringify({
                  idEmbarque: embarqueEmitido.idEmbarque,
                  sucursalId: embarqueEmitido.sucursalId,
                  pesoTotalKg: embarqueEmitido.pesoTotalKg,
                  volumenTotalM3: embarqueEmitido.volumenTotalM3,
                  totalBultos: embarqueEmitido.bultos?.length || 0,
                })}
                size={96}
              />
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
              {embarqueEmitido.bultos?.map((b) => (
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
        </div>
      )}
    </div>
  );
}
