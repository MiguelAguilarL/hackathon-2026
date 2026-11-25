"use client";

import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function ProveedorPage() {
  const [data, setData] = useState(null);
  const [idOc, setIdOc] = useState("OC-2026-002");
  const [folioFactura, setFolioFactura] = useState("FAC-2026-9901");
  const [anden, setAnden] = useState(2);
  const [fecha, setFecha] = useState("2026-11-25");
  const [horaInicio, setHoraInicio] = useState(11);
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [bultosForm, setBultosForm] = useState([
    { sucursalId: 1, sku: "SKU-BEB-24", descripcion: "Paquete Bebida Energética 24p", piezas: 100, pesoKg: 600, volumenM3: 1.5 },
    { sucursalId: 3, sku: "SKU-BOT-50", descripcion: "Caja Botana Salada 50p", piezas: 50, pesoKg: 350, volumenM3: 1.2 },
  ]);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [citaSeleccionadaQR, setCitaSeleccionadaQR] = useState(null);

  const cargarDatos = async () => {
    const res = await fetch("/api/cedis");
    const json = await res.json();
    setData(json);
    if (!citaSeleccionadaQR && json.citasFacturas?.length > 0) {
      setCitaSeleccionadaQR(json.citasFacturas[0]);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const ocActual = data?.ordenesCompra?.find((o) => o.idOc === idOc);

  const agregarRenglonBulto = () => {
    const primeraLinea = ocActual?.lineas?.[0];
    setBultosForm([
      ...bultosForm,
      {
        sucursalId: primeraLinea?.sucursalId || 1,
        sku: primeraLinea?.sku || "SKU-GEN-01",
        descripcion: primeraLinea?.descripcion || "Producto de OC",
        piezas: 20,
        pesoKg: 250,
        volumenM3: 0.8,
      },
    ]);
  };

  const handleAgendar = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    const res = await fetch("/api/cedis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "AGENDAR_CITA",
        idOc,
        folioFactura,
        proveedor: ocActual?.proveedor || "Proveedor Externo",
        anden,
        fecha,
        horaInicio,
        duracionHoras,
        bultos: bultosForm,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error);
    } else {
      setMensaje(`Cita agendada en Andén ${anden} y Factura ${folioFactura} registrada con ${json.cita.bultos.length} etiquetas QR.`);
      setCitaSeleccionadaQR(json.cita);
      cargarDatos();
    }
  };

  return (
    <div className="space-y-8">
      <div className="no-print bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold uppercase text-amber-700 bg-amber-100 px-2.5 py-1 rounded">
          DEV 1 · Momentos 1 y 2 (Agendamiento e Identificación QR)
        </span>
        <h1 className="text-2xl font-bold mt-2">Portal de Proveedores: Cita en Andén, Factura Única y Etiquetas QR</h1>
        <p className="text-sm text-slate-600 mt-1">
          Horario corrido 08:00 a 18:00 · Mínimo 1h por descarga · Sin traslapes de andén · 1 SKU por bulto.
        </p>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-medium">
            {error}
          </div>
        )}
        {mensaje && (
          <div className="mt-4 p-4 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-medium">
            {mensaje}
          </div>
        )}

        <form onSubmit={handleAgendar} className="mt-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Orden de Compra (OC)</label>
              <select
                value={idOc}
                onChange={(e) => setIdOc(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {data?.ordenesCompra?.map((oc) => (
                  <option key={oc.idOc} value={oc.idOc}>
                    {oc.idOc} - {oc.proveedor}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Folio de Factura (Único e Irrepetible)
              </label>
              <input
                type="text"
                required
                value={folioFactura}
                onChange={(e) => setFolioFactura(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono"
                placeholder="FAC-2026-XXXX"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Andén de Recibo (1 al 4)</label>
              <select
                value={anden}
                onChange={(e) => setAnden(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                {[1, 2, 3, 4].map((a) => (
                  <option key={a} value={a}>
                    Andén de Recibo #{a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Fecha de Entrega</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Hora Inicio (08:00 a 17:00)
              </label>
              <input
                type="number"
                min={8}
                max={17}
                value={horaInicio}
                onChange={(e) => setHoraInicio(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Tiempo Estimado Descarga (Mín. 1 hr)
              </label>
              <input
                type="number"
                min={1}
                max={6}
                value={duracionHoras}
                onChange={(e) => setDuracionHoras(Number(e.target.value))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-slate-800">Desglose de la Factura por Bulto (Caja / Tarima)</h2>
                <p className="text-xs text-slate-500">Regla: No se mezclan SKUs distintos en un mismo bulto.</p>
              </div>
              <button
                type="button"
                onClick={agregarRenglonBulto}
                className="text-xs font-semibold bg-slate-800 text-white px-3 py-1.5 rounded-md hover:bg-slate-700"
              >
                + Agregar Bulto a la Factura
              </button>
            </div>

            <div className="space-y-2">
              {bultosForm.map((b, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-50 p-3 rounded-lg border">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Sucursal Destino</label>
                    <select
                      value={b.sucursalId}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].sucursalId = Number(e.target.value);
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs"
                    >
                      {data?.sucursales?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codigo} ({s.rackAsignado})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">SKU Único</label>
                    <input
                      type="text"
                      value={b.sku}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].sku = e.target.value;
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Descripción</label>
                    <input
                      type="text"
                      value={b.descripcion}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].descripcion = e.target.value;
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Piezas</label>
                    <input
                      type="number"
                      value={b.piezas}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].piezas = Number(e.target.value);
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Peso (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={b.pesoKg}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].pesoKg = Number(e.target.value);
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500">Volumen (m³)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={b.volumenM3}
                      onChange={(e) => {
                        const copia = [...bultosForm];
                        copia[idx].volumenM3 = Number(e.target.value);
                        setBultosForm(copia);
                      }}
                      className="w-full border rounded px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-lg text-sm transition"
          >
            Confirmar Cita en Andén y Generar Etiquetas QR
          </button>
        </form>
      </div>

      {/* Etiquetas QR listas para descargar / imprimir */}
      {citaSeleccionadaQR && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="no-print flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">
                Etiquetas QR de Bultos · Factura {citaSeleccionadaQR.folioFactura} ({citaSeleccionadaQR.idOc})
              </h2>
              <p className="text-xs text-slate-500">
                Cada etiqueta contiene: Bulto, OC, Proveedor, Sucursal Destino, SKU y Cantidad de Piezas.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  const encontrada = data?.citasFacturas?.find((c) => c.folioFactura === e.target.value);
                  if (encontrada) setCitaSeleccionadaQR(encontrada);
                }}
                value={citaSeleccionadaQR.folioFactura}
                className="border rounded-lg px-3 py-1.5 text-xs"
              >
                {data?.citasFacturas?.map((c) => (
                  <option key={c.folioFactura} value={c.folioFactura}>
                    Ver Factura: {c.folioFactura} (Andén {c.anden} · {c.horaInicio}:00h)
                  </option>
                ))}
              </select>
              <button
                onClick={() => window.print()}
                className="bg-slate-900 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Imprimir / Descargar PDF de Etiquetas QR
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {citaSeleccionadaQR.bultos?.map((bulto) => {
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
                  className="border-2 border-slate-900 rounded-xl p-4 flex flex-col justify-between bg-white"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-300 pb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded">
                        DESTINO: SUC-{String(bulto.sucursalId).padStart(2, "0")} (RACK-{String(bulto.sucursalId).padStart(2, "0")})
                      </span>
                      <p className="font-mono font-extrabold text-base mt-1">{bulto.idBulto}</p>
                      <p className="text-xs text-slate-600">OC: {bulto.idOc} · Factura: {bulto.folioFactura}</p>
                    </div>
                    <QRCodeSVG value={qrPayload} size={88} />
                  </div>
                  <div className="mt-3 text-xs space-y-1">
                    <p>
                      <strong>Proveedor:</strong> {bulto.proveedor}
                    </p>
                    <p>
                      <strong>SKU:</strong> <span className="font-mono font-bold">{bulto.sku}</span> ({bulto.descripcion})
                    </p>
                    <p>
                      <strong>Piezas Surtidas:</strong> {bulto.piezas} pzas · <strong>Peso:</strong> {bulto.pesoKg} kg ·{" "}
                      <strong>Vol:</strong> {bulto.volumenM3} m³
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
