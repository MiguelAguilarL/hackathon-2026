"use client";

import { useState, useEffect } from "react";

export default function OcErpSimulator({
  proveedorActivo,
  productosProveedor = [],
  ordenesCompra = [],
  sucursales = [],
  onOcCreada,
}) {
  const [lineas, setLineas] = useState([]);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar con los productos del catálogo del proveedor activo
  useEffect(() => {
    if (productosProveedor.length > 0) {
      setLineas(
        productosProveedor.slice(0, 2).map((prod, idx) => ({
          sku: prod.sku,
          descripcion: prod.descripcion,
          sucursalId: idx === 0 ? 1 : 2,
          piezasPedidas: 35,
        }))
      );
    }
  }, [productosProveedor]);

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

  const agregarLinea = () => {
    const prodDefault = productosProveedor[lineas.length % Math.max(1, productosProveedor.length)];
    setLineas([
      ...lineas,
      {
        sku: prodDefault?.sku || "PAP-GEN-01",
        descripcion: prodDefault?.descripcion || "Artículo de Papelería",
        sucursalId: 1,
        piezasPedidas: 30,
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

    if (campo === "sku") {
      const prod = productosProveedor.find((p) => p.sku === valor);
      if (prod) {
        copia[idx].descripcion = prod.descripcion;
      }
    }
    setLineas(copia);
  };

  const handleEmitirOc = async (e) => {
    e.preventDefault();
    if (!proveedorActivo?.idProveedor) return;
    setError(null);
    setCreando(true);
    try {
      const res = await fetch("/proveedor/api/oc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idProveedor: proveedorActivo.idProveedor,
          lineas,
        }),
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
            Simulador ERP Compras Papelería · idProveedor #{proveedorActivo?.idProveedor}
          </span>
          <h2 className="text-lg font-bold mt-1">
            Generar Nueva Orden de Compra para {proveedorActivo?.nombre}
          </h2>
          <p className="text-xs text-slate-400">
            Selecciona productos del catálogo exclusivo de este proveedor (tabla <code className="text-amber-400">Producto</code>) con su peso y volumen unitario preconfigurado.
          </p>
        </div>
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
              Folio Oficial OC (Autogenerado · Solo Lectura)
            </label>
            <input
              type="text"
              readOnly
              value={proximoFolioOc}
              className="w-full bg-slate-200/80 border border-slate-300 text-slate-800 rounded-lg px-3 py-2 text-sm font-mono font-black cursor-not-allowed select-none"
            />
          </div>

          <div className="md:col-span-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
              Proveedor de Papelería Adjudicado (idProveedor #{proveedorActivo?.idProveedor})
            </label>
            <input
              type="text"
              readOnly
              value={`${proveedorActivo?.nombre} (${proveedorActivo?.correo})`}
              className="w-full bg-slate-200/80 border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 cursor-not-allowed select-none"
            />
          </div>
        </div>

        {/* Catálogo de Productos del Proveedor */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <p className="text-xs font-extrabold uppercase text-slate-700 mb-2">
            Catálogo Maestro de Productos registrados para {proveedorActivo?.nombre} ({productosProveedor.length} SKUs):
          </p>
          <div className="grid md:grid-cols-3 gap-2.5">
            {productosProveedor.map((p) => (
              <div key={p.sku} className="bg-white p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-mono font-black text-slate-900">{p.sku}</span>
                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{p.descripcion}</p>
                <p className="text-[10px] font-mono font-bold text-amber-700 mt-1.5">
                  Peso unitario: {p.pesoUnitarioKg} kg/pza · Vol unitario: {p.volumenUnitarioM3} m³/pza
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Líneas de productos solicitados en la OC */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase text-slate-700">
              Partidas Solicitadas en la Orden de Compra ({lineas.length})
            </h3>
            <button
              type="button"
              onClick={agregarLinea}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
            >
              + Agregar Partida del Catálogo
            </button>
          </div>

          {lineas.map((l, idx) => {
            const prod = productosProveedor.find((p) => p.sku === l.sku);
            const pesoEst = prod ? (prod.pesoUnitarioKg * Number(l.piezasPedidas || 0)).toFixed(1) : "0";
            const volEst = prod ? (prod.volumenUnitarioM3 * Number(l.piezasPedidas || 0)).toFixed(2) : "0";

            return (
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

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Producto del Catálogo (SKU)
                  </label>
                  <select
                    value={l.sku}
                    onChange={(e) => actualizarLinea(idx, "sku", e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold"
                  >
                    {productosProveedor.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.descripcion}
                      </option>
                    ))}
                  </select>
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

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                    Peso / Vol Calculado
                  </label>
                  <div className="bg-slate-200/80 border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold text-slate-800">
                    {pesoEst} kg · {volEst} m³
                  </div>
                </div>

                <div className="md:col-span-1 flex justify-end">
                  {lineas.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarLinea(idx)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-2"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Al emitir la OC, el peso y volumen de cada bulto se calcularán automáticamente a partir de la tabla Producto.
          </span>
          <button
            type="submit"
            disabled={creando}
            className="bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition"
          >
            {creando ? "Emitiendo OC..." : `Emitir Orden de Compra ${proximoFolioOc} →`}
          </button>
        </div>
      </form>
    </div>
  );
}
