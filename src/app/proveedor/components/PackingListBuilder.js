"use client";

import { useState } from "react";

// Límites físicos por tarima según reglas del CEDIS
const TARIMA_MAX_PESO_KG = 1000; // 1 tonelada máxima por tarima
const TARIMA_MAX_VOLUMEN_M3 = Number((1.12 * 1.15 * 1.85).toFixed(2)); // 2.38 m3 por tarima

export default function PackingListBuilder({
  ocActual,
  sucursales = [],
  bultosForm,
  setBultosForm,
  folioFactura,
}) {
  const [cajasPorLinea, setCajasPorLinea] = useState(2);

  // Importa todas las líneas de la Orden de Compra seleccionada con 1 clic
  const importarLineasDeOC = () => {
    if (!ocActual?.lineas?.length) return;
    const nuevosBultos = ocActual.lineas.map((linea) => ({
      sucursalId: linea.sucursalId,
      sku: linea.sku,
      descripcion: linea.descripcion,
      piezas: linea.piezasPedidas,
      pesoKg: Math.min(850, Math.max(50, linea.piezasPedidas * 5)),
      volumenM3: 1.4,
    }));
    setBultosForm(nuevosBultos);
  };

  // Divide una línea de la OC en N bultos/cajas del mismo SKU (respetando la regla de 1 solo SKU por bulto)
  const dividirLineaEnBultos = (linea, numBultos) => {
    const n = Math.max(1, Number(numBultos) || 1);
    const piezasBase = Math.floor(linea.piezasPedidas / n);
    const resto = linea.piezasPedidas % n;

    const generados = Array.from({ length: n }, (_, i) => {
      const pzas = i === n - 1 ? piezasBase + resto : piezasBase;
      return {
        sucursalId: linea.sucursalId,
        sku: linea.sku,
        descripcion: linea.descripcion,
        piezas: Math.max(1, pzas),
        pesoKg: Number(Math.min(900, Math.max(25, pzas * 4.5)).toFixed(1)),
        volumenM3: Number(Math.min(2.2, Math.max(0.25, (1.8 / n))).toFixed(2)),
      };
    });

    setBultosForm([...bultosForm, ...generados]);
  };

  const agregarBultoIndividual = () => {
    const primeraLinea = ocActual?.lineas?.[0];
    setBultosForm([
      ...bultosForm,
      {
        sucursalId: primeraLinea?.sucursalId || 1,
        sku: primeraLinea?.sku || "SKU-GEN-01",
        descripcion: primeraLinea?.descripcion || "Mercancía General",
        piezas: 25,
        pesoKg: 250,
        volumenM3: 0.85,
      },
    ]);
  };

  const eliminarBulto = (index) => {
    if (bultosForm.length <= 1) return;
    setBultosForm(bultosForm.filter((_, idx) => idx !== index));
  };

  const actualizarBulto = (index, campo, valor) => {
    const copia = [...bultosForm];
    copia[index] = { ...copia[index], [campo]: valor };

    // Si cambia el SKU y existe en la OC, autocompletar su descripción y sucursal sugerida
    if (campo === "sku" && ocActual?.lineas) {
      const lineaMatch = ocActual.lineas.find((l) => l.sku === valor);
      if (lineaMatch) {
        copia[index].descripcion = lineaMatch.descripcion;
        copia[index].sucursalId = lineaMatch.sucursalId;
      }
    }
    setBultosForm(copia);
  };

  // Totales de la factura
  const totalPiezas = bultosForm.reduce((acc, b) => acc + Number(b.piezas || 0), 0);
  const totalPesoKg = bultosForm.reduce((acc, b) => acc + Number(b.pesoKg || 0), 0);
  const totalVolumenM3 = bultosForm.reduce((acc, b) => acc + Number(b.volumenM3 || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
            Paso 3 · Desglose de Factura por Bulto (Packing List / ASN)
          </span>
          <h2 className="text-lg font-bold mt-1">
            Identificación de Bultos / Tarimas · Factura <span className="font-mono text-amber-400">{folioFactura || "SIN-FOLIO"}</span>
          </h2>
          <p className="text-xs text-slate-400">
            Regla estricta: No se mezclan SKUs distintos en un mismo bulto · Base tarima 1.12 × 1.15 m, altura máx 1.85 m con film (máx 1,000 kg / 2.38 m³).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={importarLineasDeOC}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg transition"
          >
            Autocompletar desde Líneas de la OC
          </button>
          <button
            type="button"
            onClick={agregarBultoIndividual}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-lg border border-slate-700 transition"
          >
            + Agregar Bulto / Caja
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Espejo de la Orden de Compra para comparar piezas pedidas vs piezas empacadas en bultos */}
        {ocActual?.lineas?.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-700">
                  Conciliación contra Orden de Compra {ocActual.idOc} ({ocActual.proveedor})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Verifica que la suma de piezas en tus bultos coincida con la OC. En andén hay Cero Tolerancia a SKUs no solicitados o excedentes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">Dividir línea en:</span>
                <select
                  value={cajasPorLinea}
                  onChange={(e) => setCajasPorLinea(Number(e.target.value))}
                  className="border border-slate-300 rounded px-2 py-1 text-xs font-bold bg-white"
                >
                  {[2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} bultos
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {ocActual.lineas.map((linea) => {
                const piezasDeclaradas = bultosForm
                  .filter((b) => b.sku === linea.sku && Number(b.sucursalId) === Number(linea.sucursalId))
                  .reduce((acc, b) => acc + Number(b.piezas || 0), 0);

                const excedido = piezasDeclaradas > linea.piezasPedidas;
                const completo = piezasDeclaradas === linea.piezasPedidas;

                return (
                  <div
                    key={linea.id}
                    className={`p-3 rounded-lg border text-xs flex flex-col justify-between ${
                      excedido
                        ? "bg-red-50 border-red-300 text-red-900"
                        : completo
                        ? "bg-emerald-50 border-emerald-300 text-emerald-950"
                        : "bg-white border-slate-200 text-slate-800"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-extrabold">{linea.sku}</span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-900 text-white">
                          SUC-{String(linea.sucursalId).padStart(2, "0")}
                        </span>
                      </div>
                      <p className="text-[11px] opacity-80 mt-0.5">{linea.descripcion}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold block opacity-75">Empacado vs Pedido</span>
                        <span className="font-extrabold text-sm">
                          {piezasDeclaradas} / {linea.piezasPedidas} pzas
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => dividirLineaEnBultos(linea, cajasPorLinea)}
                        className="text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1 rounded transition"
                      >
                        + Dividir en {cajasPorLinea} cajas
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla de Bultos de la Factura */}
        <div className="space-y-3">
          {bultosForm.map((bulto, idx) => {
            const idBultoPreview = `BUL-${folioFactura || "FAC"}-${String(idx + 1).padStart(2, "0")}`;
            const excedePesoTarima = Number(bulto.pesoKg) > TARIMA_MAX_PESO_KG;
            const excedeVolumenTarima = Number(bulto.volumenM3) > TARIMA_MAX_VOLUMEN_M3;

            // Verificar si el SKU pertenece a la OC seleccionada
            const skuEnOC = ocActual?.lineas?.some(
              (l) => l.sku === bulto.sku && Number(l.sucursalId) === Number(bulto.sucursalId)
            );

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition ${
                  excedePesoTarima || excedeVolumenTarima
                    ? "bg-amber-50/70 border-amber-400"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-900 text-amber-400 font-mono font-extrabold text-xs px-2.5 py-1 rounded">
                      Bulto #{idx + 1}: {idBultoPreview}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      1 solo SKU por caja/tarima · Con etiqueta QR individual
                    </span>
                    {!skuEnOC && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        Aviso: SKU/Sucursal no figura en la OC (Será rechazado en Handheld)
                      </span>
                    )}
                  </div>

                  {bultosForm.length > 1 && (
                    <button
                      type="button"
                      onClick={() => eliminarBulto(idx)}
                      className="text-xs font-bold text-red-600 hover:text-red-800 px-2 py-1"
                    >
                      Eliminar Bulto ✕
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Sucursal Destino (Rack)
                    </label>
                    <select
                      value={bulto.sucursalId}
                      onChange={(e) => actualizarBulto(idx, "sucursalId", Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold"
                    >
                      {sucursales.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.codigo} → {s.rackAsignado}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      SKU Único del Bulto
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="text"
                        required
                        list={`skus-oc-${idx}`}
                        value={bulto.sku}
                        onChange={(e) => actualizarBulto(idx, "sku", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold"
                      />
                      <datalist id={`skus-oc-${idx}`}>
                        {ocActual?.lineas?.map((l) => (
                          <option key={l.id} value={l.sku}>
                            {l.descripcion} (SUC-{String(l.sucursalId).padStart(2, "0")})
                          </option>
                        ))}
                      </datalist>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Descripción del Producto
                    </label>
                    <input
                      type="text"
                      required
                      value={bulto.descripcion}
                      onChange={(e) => actualizarBulto(idx, "descripcion", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Piezas Surtidas
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={bulto.piezas}
                      onChange={(e) => actualizarBulto(idx, "piezas", Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Peso (kg)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min={0.1}
                        required
                        value={bulto.pesoKg}
                        onChange={(e) => actualizarBulto(idx, "pesoKg", Number(e.target.value))}
                        className={`w-full bg-white border rounded-lg px-2 py-2 text-xs font-bold ${
                          excedePesoTarima ? "border-red-500 text-red-700" : "border-slate-300"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        Vol (m³)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={0.01}
                        required
                        value={bulto.volumenM3}
                        onChange={(e) => actualizarBulto(idx, "volumenM3", Number(e.target.value))}
                        className={`w-full bg-white border rounded-lg px-2 py-2 text-xs font-bold ${
                          excedeVolumenTarima ? "border-red-500 text-red-700" : "border-slate-300"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {(excedePesoTarima || excedeVolumenTarima) && (
                  <p className="text-[11px] font-bold text-amber-900 mt-2">
                    ⚠️ Especificación de Tarima: Una tarima individual (1.12 × 1.15 × 1.85 m) soporta hasta{" "}
                    {TARIMA_MAX_PESO_KG} kg y {TARIMA_MAX_VOLUMEN_M3} m³. Si este registro representa varias tarimas o un lote consolidado, divídelo o verifica su cubicación.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Barra de Resumen Total de la Factura */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Total Bultos / Etiquetas QR</span>
              <span className="text-lg font-extrabold text-amber-400">{bultosForm.length} bultos</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Total Piezas Declaradas</span>
              <span className="text-lg font-extrabold">{totalPiezas.toLocaleString()} pzas</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Peso Total Factura</span>
              <span className="text-lg font-extrabold">{totalPesoKg.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Volumen Total Factura</span>
              <span className="text-lg font-extrabold">{totalVolumenM3.toFixed(2)} m³</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-300">
            <span className="inline-block bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full font-bold">
              ✓ Film de Seguridad y Base de Tarima 1.12 × 1.15 m
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
