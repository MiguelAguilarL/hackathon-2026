"use client";

import { ANDENES_SALIDA, TORTON_TARIMAS, resumenTorton } from "../torton";

function tituloAnden(anden) {
  if (anden === 2 || anden === 3) {
    return `Andén de salida #${anden} · Embarque a sucursales`;
  }
  return `Andén de salida #${anden}`;
}

/**
 * Lista Tortones por andén de salida: qué sucursal espera carga en qué andén.
 */
export default function TortonLista({
  tortones = [],
  rules,
  andenPorSucursal,
  onAndenChange,
  tortonSeleccionadoId,
  onSelect,
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-bold text-slate-800">
          Tortones en andenes de salida
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Elige el Tortón (sucursal destino). Luego verás sus {TORTON_TARIMAS}{" "}
          tarimas para escanear y cargar.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {ANDENES_SALIDA.map((anden) => {
          const delAnden = tortones.filter(
            (t) => Number(andenPorSucursal[t.id] || 1) === anden
          );
          return (
            <section
              key={anden}
              className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 space-y-2"
            >
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                {tituloAnden(anden)}
              </p>
              {delAnden.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  Sin Tortón asignado
                </p>
              ) : (
                delAnden.map((suc) => {
                  const resumen = resumenTorton(suc.bultosEnTorton || [], rules);
                  const slotsUsados = new Set(
                    (suc.bultosEnTorton || [])
                      .filter((b) => b.columna != null)
                      .map((b) => b.columna)
                  ).size;
                  const activo = tortonSeleccionadoId === suc.id;
                  return (
                    <button
                      key={suc.id}
                      type="button"
                      onClick={() => onSelect?.(suc.id)}
                      className={`w-full text-left rounded-lg border bg-white p-3 space-y-1.5 transition ${
                        activo
                          ? "border-blue-600 ring-2 ring-blue-600/30"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-mono font-bold text-amber-700">
                            {suc.rackAsignado}
                          </p>
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {suc.nombre}
                          </p>
                        </div>
                        <label
                          className="text-[10px] text-slate-500"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Andén
                          <select
                            value={andenPorSucursal[suc.id] || 1}
                            onChange={(e) =>
                              onAndenChange?.(suc.id, Number(e.target.value))
                            }
                            className="ml-1 rounded border border-slate-300 text-[10px] px-1 py-0.5 bg-white"
                          >
                            {ANDENES_SALIDA.map((a) => (
                              <option key={a} value={a}>
                                #{a}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-600 tabular-nums">
                        Tarimas {slotsUsados}/{TORTON_TARIMAS} ·{" "}
                        {resumen.pesoKg.toFixed(0)} kg ·{" "}
                        {resumen.volumenM3.toFixed(2)} m³ ·{" "}
                        {resumen.listo ? "Listo ≥90%" : resumen.mensaje}
                      </p>
                    </button>
                  );
                })
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
