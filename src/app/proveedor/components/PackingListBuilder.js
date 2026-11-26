"use client";

import { useState } from "react";

const TARIMA_MAX_PESO_KG = 1000;
const TARIMA_MAX_VOLUMEN_M3 = Number((1.12 * 1.15 * 1.85).toFixed(2));

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

  const etiquetaPartida = (sku, sucursalId) => `${sku} (Sucursal ${String(sucursalId).padStart(2, "0")})`;

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

  const dividirLineaEnBultos = (linea, numBultos) => {
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

    const otrosBultos = bultosForm.filter(
      (b) => !(b.sku === linea.sku && Number(b.sucursalId) === Number(linea.sucursalId))
    );
    setBultosForm([...otrosBultos, ...generados]);
  };

  const agregarBultoIndividual = () => {
    const lineaDisponible = lineasOC.find((l) => disponiblesPara(l.sku, l.sucursalId) > 0);
    if (!lineaDisponible) {
      setAviso(
        ocActual?.idOc
          ? `Todos los productos de la orden ${ocActual.idOc} ya están empacados. Para dividir un producto en más cajas, reduce primero la cantidad en las cajas actuales.`
          : "Selecciona una Orden de Compra para agregar cajas."
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

    if (campo === "piezas") {
      const cantidad = Math.max(1, Math.floor(Number(valor) || 1));
      const disponibles = disponiblesPara(actual.sku, actual.sucursalId, index);
      if (disponibles === null) {
        setAviso(
          `${etiquetaPartida(actual.sku, actual.sucursalId)} no forma parte de esta Orden de Compra.`
        );
        actual.piezas = cantidad;
      } else if (cantidad > disponibles) {
        if (disponibles < 1) {
          setAviso(
            `Ya completaste todas las piezas solicitadas para ${etiquetaPartida(actual.sku, actual.sucursalId)}.`
          );
          return;
        }
        setAviso(
          `La cantidad máxima restante para ${etiquetaPartida(actual.sku, actual.sucursalId)} es de ${disponibles} piezas.`
        );
        actual.piezas = disponibles;
      } else {
        setAviso(null);
        actual.piezas = cantidad;
      }
    }

    if (campo === "sku" || campo === "sucursalId") {
      const disponibles = disponiblesPara(actual.sku, actual.sucursalId, index);
      if (disponibles !== null) {
        if (Number(actual.piezas) > disponibles) {
          setAviso(
            `Solo quedan ${disponibles} piezas por empacar para ${etiquetaPartida(actual.sku, actual.sucursalId)}.`
          );
          return;
        }
        setAviso(null);
      } else {
        setAviso(
          `${etiquetaPartida(actual.sku, actual.sucursalId)} no fue solicitado en esta Orden de Compra.`
        );
      }
    }

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Encabezado limpio */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Desglose de Bultos / Cajas a Entregar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Indica cuántas cajas o tarimas vas a entregar. Recuerda no mezclar distintos productos en una misma caja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={importarLineasDeOC}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition"
          >
            Restablecer cantidades
          </button>
          <button
            type="button"
            onClick={agregarBultoIndividual}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
          >
            + Agregar otra caja
          </button>
        </div>
      </div>

      {aviso && (
        <div role="alert" className="bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold px-4 py-3 rounded-xl">
          {aviso}
        </div>
      )}

      {/* Resumen de productos solicitados en la OC (para dividir fácilmente en cajas) */}
      {ocActual?.lineas?.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700">
              Productos solicitados en tu Orden de Compra ({ocActual.idOc})
            </span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Repartir producto en:</span>
              <select
                value={cajasPorLinea}
                onChange={(e) => setCajasPorLinea(Number(e.target.value))}
                className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold bg-white"
              >
                {[2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} cajas iguales
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
                  className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between ${
                    excedido
                      ? "bg-red-50 border-red-200 text-red-900"
                      : completo
                      ? "bg-white border-emerald-300 text-slate-900"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-slate-900">{linea.sku}</span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        Sucursal {String(linea.sucursalId).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{linea.descripcion}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold">
                      {piezasDeclaradas} / {linea.piezasPedidas} pzas
                    </span>
                    <button
                      type="button"
                      onClick={() => dividirLineaEnBultos(linea, cajasPorLinea)}
                      className="text-[11px] font-semibold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition"
                    >
                      Dividir en {cajasPorLinea} cajas
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista limpia de Cajas / Bultos */}
      <div className="space-y-3">
        {bultosForm.map((bulto, idx) => {
          const dims = calcularDimensionesBulto(bulto.sku, bulto.piezas, productosProveedor);
          const excedePesoTarima = dims.pesoKg > TARIMA_MAX_PESO_KG;
          const excedeVolumenTarima = dims.volumenM3 > TARIMA_MAX_VOLUMEN_M3;
          const disponiblesBulto = disponiblesPara(bulto.sku, bulto.sucursalId, idx);

          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition ${
                excedePesoTarima || excedeVolumenTarima
                  ? "bg-amber-50/40 border-amber-300"
                  : "bg-white border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-900 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                    Caja #{idx + 1}
                  </span>
                  <span className="text-xs text-slate-500 font-medium truncate max-w-md">
                    {bulto.descripcion}
                  </span>
                </div>

                {bultosForm.length > 1 && (
                  <button
                    type="button"
                    onClick={() => eliminarBulto(idx)}
                    className="text-xs font-semibold text-slate-400 hover:text-red-600 px-2 py-1 transition"
                  >
                    Quitar caja
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Sucursal destino
                  </label>
                  <select
                    value={bulto.sucursalId}
                    onChange={(e) => actualizarBulto(idx, "sucursalId", Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {sucursales.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Producto a empacar
                  </label>
                  <select
                    value={bulto.sku}
                    onChange={(e) => actualizarBulto(idx, "sku", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900"
                  >
                    {productosProveedor.map((p) => (
                      <option key={p.sku} value={p.sku}>
                        {p.sku} — {p.descripcion}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Piezas en esta caja
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={disponiblesBulto !== null ? Math.max(1, disponiblesBulto) : undefined}
                    required
                    value={bulto.piezas}
                    onChange={(e) => actualizarBulto(idx, "piezas", Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Peso
                    </label>
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-700">
                      {dims.pesoKg} kg
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Volumen
                    </label>
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-mono font-bold text-slate-700">
                      {dims.volumenM3} m³
                    </div>
                  </div>
                </div>
              </div>

              {(excedePesoTarima || excedeVolumenTarima) && (
                <p className="text-xs font-medium text-amber-800 mt-2.5">
                  Nota: Esta caja supera la capacidad de una tarima individual ({TARIMA_MAX_PESO_KG} kg / {TARIMA_MAX_VOLUMEN_M3} m³). Te sugerimos dividirla en 2 o más cajas con el botón superior.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Totales de la entrega */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-slate-500 block">Total de cajas</span>
            <span className="text-base font-extrabold text-slate-900">{bultosForm.length}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Total de piezas</span>
            <span className="text-base font-extrabold text-slate-900">{totalPiezas.toLocaleString()} pzas</span>
          </div>
          <div>
            <span className="text-slate-500 block">Peso total</span>
            <span className="text-base font-extrabold text-slate-900">{totalPesoKg.toFixed(2)} kg</span>
          </div>
          <div>
            <span className="text-slate-500 block">Volumen total</span>
            <span className="text-base font-extrabold text-slate-900">{totalVolumenM3.toFixed(3)} m³</span>
          </div>
        </div>

        <span
          className={`text-xs font-bold px-3 py-1.5 rounded-full ${
            hayExcedente
              ? "bg-red-100 text-red-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {hayExcedente ? "Revisa las cantidades declaradas" : "✓ Cantidades listas para confirmar"}
        </span>
      </div>
    </div>
  );
}
