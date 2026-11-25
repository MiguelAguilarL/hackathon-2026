"use client";

import { useMemo, useState } from "react";
import { RACK_NIVELES, RACK_COLUMNAS, listarPosicionesRack, ZONA_INFO } from "../rackRules";
import TarimaSlot from "./TarimaSlot";

function agruparBultosPorSlot(bultos = []) {
  const mapa = new Map();
  for (const b of bultos) {
    if (b.nivel == null || b.columna == null) continue;
    const key = `${b.nivel}-${b.columna}`;
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key).push(b);
  }
  return mapa;
}

export default function RackVista({ sucursal }) {
  const [slotActivo, setSlotActivo] = useState(null);
  const bultos = sucursal?.bultos || [];
  const porSlot = useMemo(() => agruparBultosPorSlot(bultos), [bultos]);
  const posiciones = useMemo(() => listarPosicionesRack(), []);

  const nivelesOrdenados = useMemo(
    () => Array.from({ length: RACK_NIVELES }, (_, i) => RACK_NIVELES - i),
    []
  );

  const detalle =
    slotActivo && porSlot.get(`${slotActivo.nivel}-${slotActivo.columna}`);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Vista del rack · {sucursal.rackAsignado}
          </h2>
        </div>
        <ul className="flex flex-wrap gap-3 text-[11px] text-slate-600">
          {Object.values(ZONA_INFO).map((z) => (
            <li key={z.id} className="flex items-center gap-1.5">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-sm border border-slate-300 ${
                  z.id === "A" ? "bg-blue-500" : z.id === "B" ? "bg-slate-400" : "bg-amber-500"
                }`}
              />
              {z.nombre}
            </li>
          ))}
        </ul>
      </div>

      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `2rem repeat(${RACK_COLUMNAS}, minmax(0, 1fr))` }}
      >
        <div />
        {Array.from({ length: RACK_COLUMNAS }, (_, i) => i + 1).map((col) => (
          <div key={col} className="text-center text-[10px] font-bold text-slate-500">
            C{col}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        {nivelesOrdenados.map((nivel) => (
          <div
            key={nivel}
            className="grid gap-1.5"
            style={{ gridTemplateColumns: `2rem repeat(${RACK_COLUMNAS}, minmax(0, 1fr))` }}
          >
            <div className="flex items-center justify-center text-[10px] font-bold text-slate-500">
              N{nivel}
            </div>
            {Array.from({ length: RACK_COLUMNAS }, (_, i) => i + 1).map((columna) => {
              const meta = posiciones.find((p) => p.nivel === nivel && p.columna === columna);
              const bultosSlot = porSlot.get(`${nivel}-${columna}`) || [];
              const seleccionado =
                slotActivo?.nivel === nivel && slotActivo?.columna === columna;

              return (
                <TarimaSlot
                  key={`${nivel}-${columna}`}
                  nivel={nivel}
                  columna={columna}
                  zona={meta?.zona || "B"}
                  bultos={bultosSlot}
                  seleccionado={seleccionado}
                  onSelect={setSlotActivo}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex justify-between text-[10px] text-slate-400 px-8">
        <span>← Más cerca de la puerta / salida</span>
        <span>Más al fondo →</span>
      </div>

      {slotActivo && (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="font-bold text-slate-800">
            Tarima N{slotActivo.nivel}-C{slotActivo.columna}
          </p>
          {detalle && detalle.length > 0 ? (
            <ul className="mt-2 space-y-1.5 text-xs text-slate-700">
              {detalle.map((b) => (
                <li key={b.idBulto} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <span className="font-mono font-semibold">{b.idBulto}</span>
                  <span>{b.sku}</span>
                  <span className="tabular-nums">
                    {b.pesoKg} kg · {b.volumenM3} m³
                    {b.altoM != null ? ` · alto ${b.altoM} m` : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 mt-1">Tarima vacía.</p>
          )}
        </div>
      )}
    </section>
  );
}
