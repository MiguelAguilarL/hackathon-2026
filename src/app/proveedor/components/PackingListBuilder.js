"use client";

import { useState } from "react";

// Límites físicos por tarima según reglas del CEDIS
const TARIMA_MAX_PESO_KG = 1000; // 1 tonelada máxima por tarima
const TARIMA_MAX_VOLUMEN_M3 = Number((1.12 * 1.15 * 1.85).toFixed(2)); // 2.38 m3 por tarima

// Función auxiliar para calcular peso y volumen exactos desde el catálogo Producto
export function calcularDimensionesBulto(sku, piezas, catalogoProductos = []) {
  const prod = catalogoProductos.find((p) => p.sku === sku);
  const cantidad = Math.max(0, Number(piezas) || 0);
  if (!prod) {
    return {
      pesoUnitarioKg: 10,
      volumenUnitarioM3: 0.04,
      pesoKg: Number((cantidad * 10).toFixed(2)),
      volumenM3: Number((cantidad * 0.04).toFixed(3)),
    };
  }
  return {
    pesoUnitarioKg: prod.pesoUnitarioKg,
    volumenUnitarioM3: prod.volumenUnitarioM3,
    pesoKg: Number((cantidad * prod.pesoUnitarioKg).toFixed(2)),
    volumenM3: Number((cantidad * prod.volumenUnitarioM3).toFixed(3)),
  };
}

export default function PackingListBuilder({
  ocActual,
  productosProveedor = [],
  sucursales = [],
  bultosForm,
  setBultosForm,
  folioFactura,
}) {
  const [cajasPorLinea, setCajasPorLinea] = useState(2);
  const [aviso, setAviso] = useState(null);

  const lineasOC = ocActual?.lineas || [];
  const buscarLinea = (sku, sucursalId) =>
    lineasOC.find((l) => l.sku === sku && Number(l.sucursalId) === Number(sucursalId));

  // Piezas ya declaradas para una misma partida (SKU + sucursal), excluyendo un bulto
  // cuando se está validando su propio valor.
  const declaradasEn = (sku, sucursalId, excluirIdx = -1) =>
    bultosForm.reduce(
      (acc, b, idx) =>
        idx !== excluirIdx && b.sku === sku && Number(b.sucursalId) === Number(sucursalId)
          ? acc + Number(b.piezas || 0)
          : acc,
      0
    );

  const disponiblesPara = (sku, sucursalId, excluirIdx = -1) => {
    const linea = buscarLinea(sku, sucursalId);
    return linea ? Math.max(0, linea.piezasPedidas - declaradasEn(sku, sucursalId, excluirIdx)) : null;
  };

  const etiquetaPartida = (sku, sucursalId) => `${sku} / SUC-${String(sucursalId).padStart(2, "0")}`;

  // Importa todas las líneas de la Orden de Compra calculando peso y volumen desde la tabla Producto
  const importarLineasDeOC = () => {
    if (!ocActual?.lineas?.length) return;
    setAviso(null);
    const nuevosBultos = ocActual.lineas.map((linea) => {
      const dims = calcularDimensionesBulto(linea.sku, linea.piezasPedidas, productosProveedor);
      return {
        sucursalId: linea.sucursalId,
        sku: linea.sku,
        descripcion: linea.descripcion,
        piezas: linea.piezasPedidas,
        pesoKg: dims.pesoKg,
        volumenM3: dims.volumenM3,
      };
    });
    setBultosForm(nuevosBultos);
  };

  // Divide una línea de la OC en N bultos del mismo SKU recalculando automáticamente el peso y volumen
  const dividirLineaEnBultos = (linea, numBultos) => {
    // Nunca se pueden generar más bultos que piezas pedidas (evita piezas de 0 o fantasma).
    const n = Math.min(linea.piezasPedidas, Math.max(1, Number(numBultos) || 1));
    setAviso(null);
    const piezasBase = Math.floor(linea.piezasPedidas / n);
    const resto = linea.piezasPedidas % n;

    const generados = Array.from({ length: n }, (_, i) => {
      const pzas = Math.max(1, i === n - 1 ? piezasBase + resto : piezasBase);
      const dims = calcularDimensionesBulto(linea.sku, pzas, productosProveedor);
      return {
        sucursalId: linea.sucursalId,
        sku: linea.sku,
        descripcion: linea.descripcion,
        piezas: pzas,
        pesoKg: dims.pesoKg,
        volumenM3: dims.volumenM3,
      };
    });

    // Reemplaza los bultos previos de esa misma línea/sucursal por los nuevos bultos divididos
    const otrosBultos = bultosForm.filter(
      (b) => !(b.sku === linea.sku && Number(b.sucursalId) === Number(linea.sucursalId))
    );
    setBultosForm([...otrosBultos, ...generados]);
  };

  const agregarBultoIndividual = () => {
    const primeraLinea = lineasOC[0];
    // Se agrega el bulto a la primera partida que aún tenga piezas disponibles.
    const lineaDisponible = lineasOC.find((l) => disponiblesPara(l.sku, l.sucursalId) > 0);
    if (!lineaDisponible) {
      setAviso(
        ocActual?.idOc
          ? `Todas las partidas de la OC ${ocActual.idOc} ya están completas. No puedes declarar más piezas de las solicitadas.`
          : "Selecciona una Orden de Compra para agregar bultos."
      );
      return;
    }

    const disponibles = disponiblesPara(lineaDisponible.sku, lineaDisponible.sucursalId);
    const piezasIniciales = Math.min(20, disponibles);
    const prodDefault = productosProveedor.find((p) => p.sku === lineaDisponible.sku) || productosProveedor[0];
    const dims = calcularDimensionesBulto(lineaDisponible.sku, piezasIniciales, productosProveedor);

    setAviso(null);
    setBultosForm([
      ...bultosForm,
      {
        sucursalId: lineaDisponible.sucursalId,
        sku: lineaDisponible.sku,
        descripcion: lineaDisponible.descripcion || prodDefault?.descripcion || "Artículo de Papelería",
        piezas: piezasIniciales,
        pesoKg: dims.pesoKg,
        volumenM3: dims.volumenM3,
      },
    ]);
  };

  const eliminarBulto = (index) => {
    if (bultosForm.length <= 1) return;
    setBultosForm(bultosForm.filter((_, idx) => idx !== index));
  };

  const actualizarBulto = (index, campo, valor) => {
    const copia = [...bultosForm];
    const actual = { ...copia[index], [campo]: valor };

    // Si cambia el SKU, actualizar descripción desde catálogo Producto o línea OC
    if (campo === "sku") {
      const prodCatalogo = productosProveedor.find((p) => p.sku === valor);
      const lineaMatch = buscarLinea(valor, copia[index].sucursalId) || lineasOC.find((l) => l.sku === valor);
      if (prodCatalogo) {
        actual.descripcion = prodCatalogo.descripcion;
      } else if (lineaMatch) {
        actual.descripcion = lineaMatch.descripcion;
      }
      if (lineaMatch) {
        actual.sucursalId = lineaMatch.sucursalId;
      }
    }

    // Regla de oro: la suma de piezas por SKU + sucursal nunca puede superar lo pedido en la OC.
    if (campo === "piezas") {
      const cantidad = Math.max(1, Math.floor(Number(valor) || 1));
      const disponibles = disponiblesPara(actual.sku, actual.sucursalId, index);
      if (disponibles === null) {
        setAviso(
          `${etiquetaPartida(actual.sku, actual.sucursalId)} no está solicitado en la OC; este bulto será rechazado en el handheld.`
        );
        actual.piezas = cantidad;
      } else if (cantidad > disponibles) {
        if (disponibles < 1) {
          setAviso(
            `No quedan piezas disponibles para ${etiquetaPartida(actual.sku, actual.sucursalId)}. Reduce la cantidad en otros bultos de la misma partida.`
          );
          return;
        }
        const pedidas = buscarLinea(actual.sku, actual.sucursalId).piezasPedidas;
        setAviso(
          `Máximo ${disponibles} pzas para ${etiquetaPartida(actual.sku, actual.sucursalId)} ` +
            `(OC pide ${pedidas}, ya declaradas ${pedidas - disponibles}). Se ajustó a ${disponibles}.`
        );
        actual.piezas = disponibles;
      } else {
        setAviso(null);
        actual.piezas = cantidad;
      }
    }

    // Mover un bulto a otra partida también debe respetar el tope de esa partida.
    if (campo === "sku" || campo === "sucursalId") {
      const disponibles = disponiblesPara(actual.sku, actual.sucursalId, index);
      if (disponibles !== null) {
        if (Number(actual.piezas) > disponibles) {
          setAviso(
            `No puedes mover ${actual.piezas} pzas a ${etiquetaPartida(actual.sku, actual.sucursalId)}: solo quedan ${disponibles} disponibles.`
          );
          return;
        }
        setAviso(null);
      } else {
        setAviso(
          `${etiquetaPartida(actual.sku, actual.sucursalId)} no está solicitado en la OC; este bulto será rechazado en el handheld.`
        );
      }
    }

    // Recalcular peso y volumen automáticamente cada vez que cambie el SKU o la cantidad de piezas
    if (campo === "sku" || campo === "piezas") {
      const dims = calcularDimensionesBulto(actual.sku, actual.piezas, productosProveedor);
      actual.pesoKg = dims.pesoKg;
      actual.volumenM3 = dims.volumenM3;
    }

    copia[index] = actual;
    setBultosForm(copia);
  };

  const totalPiezas = bultosForm.reduce((acc, b) => acc + Number(b.piezas || 0), 0);
  const hayExcedente = lineasOC.some(
    (linea) => declaradasEn(linea.sku, linea.sucursalId) > linea.piezasPedidas
  );
  const totalPesoKg = bultosForm.reduce((acc, b) => acc + Number(b.pesoKg || 0), 0);
  const totalVolumenM3 = bultosForm.reduce((acc, b) => acc + Number(b.volumenM3 || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
            Paso 3 · Desglose de Factura por Bulto (Cálculo Automático desde Tabla Producto)
          </span>
          <h2 className="text-lg font-bold mt-1">
            Identificación de Bultos de Papelería · Factura{" "}
            <span className="font-mono text-amber-400">{folioFactura || "SIN-FOLIO"}</span>
          </h2>
          <p className="text-xs text-slate-400">
            El Peso (kg) y Volumen (m³) se calculan automáticamente multiplicando las piezas por el peso/volumen unitario del producto en la base de datos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={importarLineasDeOC}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-lg transition"
          >
            Restaurar Bultos desde la OC
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
        {aviso && (
          <div role="alert" className="bg-red-50 border border-red-300 text-red-900 text-xs font-bold px-3.5 py-2.5 rounded-xl">
            ⚠️ {aviso}
          </div>
        )}

        {/* Espejo de la Orden de Compra */}
        {ocActual?.lineas?.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-extrabold uppercase text-slate-700">
                  Conciliación contra Orden de Compra {ocActual.idOc} ({ocActual.proveedor})
                </h3>
                <p className="text-[11px] text-slate-500">
                  Puedes dividir cualquier partida en varias tarimas/bultos si una sola supera los 1,000 kg o 2.38 m³.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 font-medium">Dividir partida en:</span>
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

                const dimsUnit = calcularDimensionesBulto(linea.sku, 1, productosProveedor);
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
                      <p className="text-[10px] font-mono font-bold text-slate-600 mt-1">
                        Catálogo: {dimsUnit.pesoUnitarioKg} kg/pza · {dimsUnit.volumenUnitarioM3} m³/pza
                      </p>
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
                        Dividir en {cajasPorLinea} bultos
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de Bultos con Peso y Volumen Autocalculados (Solo Lectura) */}
        <div className="space-y-3">
          {bultosForm.map((bulto, idx) => {
            const idBultoPreview = `BUL-${folioFactura || "FAC"}-${String(idx + 1).padStart(2, "0")}`;
            const dims = calcularDimensionesBulto(bulto.sku, bulto.piezas, productosProveedor);
            const excedePesoTarima = dims.pesoKg > TARIMA_MAX_PESO_KG;
            const excedeVolumenTarima = dims.volumenM3 > TARIMA_MAX_VOLUMEN_M3;

            const skuEnOC = ocActual?.lineas?.some(
              (l) => l.sku === bulto.sku && Number(l.sucursalId) === Number(bulto.sucursalId)
            );
            const disponiblesBulto = disponiblesPara(bulto.sku, bulto.sucursalId, idx);
            const sinDisponibilidad = disponiblesBulto !== null && disponiblesBulto < 1;

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
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="bg-slate-900 text-amber-400 font-mono font-extrabold text-xs px-2.5 py-1 rounded">
                      Bulto #{idx + 1}: {idBultoPreview}
                    </span>
                    <span className="text-xs font-mono text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                      Fórmula: {bulto.piezas} pzas × ({dims.pesoUnitarioKg} kg | {dims.volumenUnitarioM3} m³)
                    </span>
                    {!skuEnOC && (
                      <span className="text-[10px] font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded">
                        Aviso: SKU/Sucursal no solicitado en esta OC (Será rechazado en Handheld)
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
                      Producto del Catálogo (SKU)
                    </label>
                    <select
                      value={bulto.sku}
                      onChange={(e) => actualizarBulto(idx, "sku", e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-mono font-bold"
                    >
                      {productosProveedor.map((p) => (
                        <option key={p.sku} value={p.sku}>
                          {p.sku}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Descripción Oficial (Tabla Producto)
                    </label>
                    <input
                      type="text"
                      readOnly
                      tabIndex={-1}
                      value={bulto.descripcion}
                      className="w-full bg-slate-200/70 border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-700 cursor-not-allowed select-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                      Cantidad de Piezas
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={disponiblesBulto !== null ? Math.max(1, disponiblesBulto) : undefined}
                      required
                      value={bulto.piezas}
                      onChange={(e) => actualizarBulto(idx, "piezas", Number(e.target.value))}
                      aria-label={`Piezas del bulto ${idx + 1} de ${etiquetaPartida(bulto.sku, bulto.sucursalId)}`}
                      className={`w-full bg-white border-2 rounded-lg px-2.5 py-2 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        sinDisponibilidad ? "border-red-500 text-red-800" : "border-amber-400"
                      }`}
                    />
                    {disponiblesBulto !== null && (
                      <p className={`text-[9px] font-bold mt-1 ${sinDisponibilidad ? "text-red-700" : "text-slate-500"}`}>
                        Tope OC: {disponiblesBulto} pzas disponibles
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        🔒 Peso Auto (kg)
                      </label>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={`${dims.pesoKg} kg`}
                        className={`w-full bg-slate-200/80 border rounded-lg px-2 py-2 text-xs font-mono font-black cursor-not-allowed select-none ${
                          excedePesoTarima ? "border-red-500 text-red-700" : "border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">
                        🔒 Vol Auto (m³)
                      </label>
                      <input
                        type="text"
                        readOnly
                        tabIndex={-1}
                        value={`${dims.volumenM3} m³`}
                        className={`w-full bg-slate-200/80 border rounded-lg px-2 py-2 text-xs font-mono font-black cursor-not-allowed select-none ${
                          excedeVolumenTarima ? "border-red-500 text-red-700" : "border-slate-300 text-slate-900"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {(excedePesoTarima || excedeVolumenTarima) && (
                  <p className="text-[11px] font-bold text-amber-900 mt-2">
                    ⚠️ Límite físico de Tarima: Una tarima estándar (1.12 × 1.15 × 1.85 m) soporta máximo{" "}
                    {TARIMA_MAX_PESO_KG} kg y {TARIMA_MAX_VOLUMEN_M3} m³. Usa el botón &quot;Dividir en bultos&quot; arriba para repartir estas piezas en varias tarimas.
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
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Peso Total Calculado</span>
              <span className="text-lg font-extrabold text-emerald-400">{totalPesoKg.toFixed(2)} kg</span>
            </div>
            <div>
              <span className="text-slate-400 block uppercase font-bold text-[10px]">Volumen Total Calculado</span>
              <span className="text-lg font-extrabold text-emerald-400">{totalVolumenM3.toFixed(3)} m³</span>
            </div>
          </div>

          <div className="text-right text-xs text-slate-300 flex flex-wrap justify-end gap-2">
            {hayExcedente ? (
              <span className="inline-block bg-red-500/20 border border-red-500/40 text-red-300 px-3 py-1 rounded-full font-bold">
                ✕ Excedente vs OC · ajusta las piezas antes de agendar
              </span>
            ) : (
              <span className="inline-block bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1 rounded-full font-bold">
                ✓ Piezas dentro de lo solicitado en la OC
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
