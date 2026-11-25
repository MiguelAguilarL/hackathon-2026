"use client";

import { useState } from "react";

const PLANTILLAS_PROVEEDORES = [
  {
    proveedor: "Corporativo Industrial Automotriz S.A. de C.V.",
    lineas: [
      { sku: "SKU-LUB-20W50", descripcion: "Caja Lubricante Multigrado 20W50 (12x946ml)", sucursalId: 1, piezasPedidas: 150 },
      { sku: "SKU-BAL-DEL", descripcion: "Juego Balatas Cerámicas Delanteras", sucursalId: 2, piezasPedidas: 80 },
      { sku: "SKU-ACU-AGM", descripcion: "Acumulador Alta Capacidad AGM 12V", sucursalId: 5, piezasPedidas: 40 },
    ],
  },
  {
    proveedor: "Grupo Alimenticio del Centro S.A. de C.V.",
    lineas: [
      { sku: "SKU-CER-500G", descripcion: "Caja Cereal Integral 500g (24 paquetes)", sucursalId: 1, piezasPedidas: 180 },
      { sku: "SKU-LEC-UHT", descripcion: "Tarima Leche Entera UHT 1L (12 pack)", sucursalId: 4, piezasPedidas: 240 },
    ],
  },
  {
    proveedor: "Suministros Eléctricos y Ferreteros del Norte S.A.",
    lineas: [
      { sku: "SKU-CAB-THW12", descripcion: "Carrete Cable Cobre THW Calibre 12 (100m)", sucursalId: 1, piezasPedidas: 120 },
      { sku: "SKU-INT-TERM", descripcion: "Interruptor Termomagnético Industrial 2x30A", sucursalId: 6, piezasPedidas: 90 },
      { sku: "SKU-LUM-LED50", descripcion: "Luminaria Industrial UFO LED 150W", sucursalId: 3, piezasPedidas: 60 },
    ],
  },
  {
    proveedor: "Química y Limpieza Institucional S.A. de C.V.",
    lineas: [
      { sku: "SKU-DET-IND20", descripcion: "Bidón Detergente Biodegradable Industrial 20L", sucursalId: 1, piezasPedidas: 100 },
      { sku: "SKU-PAP-JUMBO", descripcion: "Caja Bobina Papel Higiénico Jumbo (6 rollos)", sucursalId: 7, piezasPedidas: 160 },
    ],
  },
];

export default function OcErpSimulator({
  ordenesCompra = [],
  sucursales = [],
  onOcCreada,
}) {
  const [proveedor, setProveedor] = useState(PLANTILLAS_PROVEEDORES[0].proveedor);
  const [lineas, setLineas] = useState(PLANTILLAS_PROVEEDORES[0].lineas);
  const [indicePlantilla, setIndicePlantilla] = useState(0);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);

  // Calcula cuál será el próximo folio consecutivo oficial de OC del CEDIS
  const calcularSiguienteFolioOc = () => {
    let maxNum = 0;
    for (const oc of ordenesCompra) {
      const match = oc.idOc.match(/OC-2026-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    }
    return `OC-2026-${String(maxNum + 1).padStart(3, "0")}`;
  };

  const cargarSiguientePlantilla = () => {
    const nextIdx = (indicePlantilla + 1) % PLANTILLAS_PROVEEDORES.length;
    setIndicePlantilla(nextIdx);
    setProveedor(PLANTILLAS_PROVEEDORES[nextIdx].proveedor);
    setLineas(PLANTILLAS_PROVEEDORES[nextIdx].lineas);
  };

  const agregarLinea = () => {
    setLineas([
      ...lineas,
      {
        sku: `SKU-PROD-${String(lineas.length + 1).padStart(2, "0")}`,
        descripcion: "Producto Comercial de Reabasto Sucursal",
        sucursalId: 1,
        piezasPedidas: 100,
      },
    ]);
  };

  const eliminarLinea = (idx) => {
    if (lineas.length <= 1) return;
    setLineas(lineas.filter((_, i) => i !== idx));
  };

  const actualizarLinea = (idx, campo, valor) => {
    const copia = [...lineas];
    copia[idx] = { ...copia[idx], [campo]: valor };
    setLineas(copia);
  };

  const handleEmitirOc = async (e) => {
    e.preventDefault();
    setError(null);
    setCreando(true);
    try {
      const res = await fetch("/proveedor/api/oc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proveedor, lineas }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
      } else if (onOcCreada) {
        onOcCreada(json.ordenCompra);
      }
    } finally {
      setCreando(false);
    }
  };

  const proximoFolioOc = calcularSiguienteFolioOc();

  return (
    <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-blue-400 text-slate-950 px-2.5 py-0.5 rounded">
            Simulador ERP Compras CEDIS · Emisión de Órdenes de Compra (OC)
          </span>
          <h2 className="text-lg font-bold mt-1">
            Generador Oficial de Órdenes de Compra hacia Proveedores
          </h2>
          <p className="text-xs text-slate-400">
            Simula el área de Compras del CEDIS emitiendo una nueva OC para abastecer a las 32 sucursales. Al emitirla, se selecciona automáticamente en el portal del proveedor con su folio de factura fiscal autogenerado.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarSiguientePlantilla}
          className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition"
        >
          ⚡ Cargar Plantilla de Reabasto Realista
        </button>
      </div>

      <form onSubmit={handleEmitirOc} className="p-6 space-y-6">
        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold">
            ⚠️ {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Folio Oficial OC (Autogenerado por ERP CEDIS · Solo Lectura)
            </label>
            <input
              type="text"
              readOnly
              value={proximoFolioOc}
              className="w-full bg-slate-200/80 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-black cursor-not-allowed select-none"
            />
            <span className="text-[10px] text-emerald-700 font-bold block mt-1">
              🔒 Consecutivo único institucional garantizado
            </span>
          </div>

          <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Razón Social del Proveedor Adjudicado
            </label>
            <input
              type="text"
              required
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-900"
              placeholder="Nombre o Razón Social del Proveedor"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              El folio fiscal de la factura se generará automáticamente con el prefijo fiscal de esta razón social.
            </span>
          </div>
        </div>

        {/* Líneas de productos solicitados en la OC */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold uppercase text-slate-700">
                Partidas / Líneas Solicitadas por el CEDIS ({lineas.length})
              </h3>
              <p className="text-[11px] text-slate-500">
                Define qué SKUs, cuántas piezas y para qué sucursal destino solicita la empresa en esta Orden de Compra.
              </p>
            </div>
            <button
              type="button"
              onClick={agregarLinea}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
            >
              + Agregar Línea a la OC
            </button>
          </div>

          {lineas.map((l, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 items-end"
            >
              <div className="md:col-span-3">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Sucursal Destino
                </label>
                <select
                  value={l.sucursalId}
                  onChange={(e) => actualizarLinea(idx, "sucursalId", Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                >
                  {sucursales.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} ({s.rackAsignado}) - {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Código SKU
                </label>
                <input
                  type="text"
                  required
                  value={l.sku}
                  onChange={(e) => actualizarLinea(idx, "sku", e.target.value.toUpperCase())}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Descripción Comercial del Artículo
                </label>
                <input
                  type="text"
                  required
                  value={l.descripcion}
                  onChange={(e) => actualizarLinea(idx, "descripcion", e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                  Piezas Solicitadas
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={l.piezasPedidas}
                  onChange={(e) => actualizarLinea(idx, "piezasPedidas", Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold"
                />
              </div>

              <div className="md:col-span-1 flex justify-end">
                {lineas.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarLinea(idx)}
                    className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-2"
                    title="Eliminar partida"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Al emitir la OC, se guardará en SQLite y podrás agendar su cita y factura inmediatamente.
          </span>
          <button
            type="submit"
            disabled={creando}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition"
          >
            {creando ? "Emitiendo OC en ERP..." : `Emitir Orden de Compra ${proximoFolioOc} y Pasar a Agendamiento →`}
          </button>
        </div>
      </form>
    </div>
  );
}
