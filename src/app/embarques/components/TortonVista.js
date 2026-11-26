"use client";

import { useMemo, useState } from "react";
import { listarSlotsTorton } from "../torton";
import TarimaSlot from "./TarimaSlot";
import TarimaPanel from "./TarimaPanel";

function agruparPorSlotTorton(bultos = []) {
  const mapa = new Map();
  for (const b of bultos) {
    if (b.columna == null) continue;
    const key = Number(b.columna);
    if (!mapa.has(key)) mapa.set(key, []);
    mapa.get(key).push(b);
  }
  return mapa;
}

/**
 * Dibujo del Tortón: 12 tarimas (mismas reglas de capacidad que en rack).
 * Reutiliza TarimaSlot + TarimaPanel; onAcomodar debe mapear a CARGAR_TORTON.
 */
export default function TortonVista({
  sucursal,
  bultosEnTorton = [],
  bultosCandidatos = [],
  todosLosBultos = [],
  sucursales = [],
  onCargarSlot,
  cargando = false,
}) {
  const [slotActivo, setSlotActivo] = useState(null);
  const porSlot = useMemo(
    () => agruparPorSlotTorton(bultosEnTorton),
    [bultosEnTorton]
  );
  const slots = useMemo(() => listarSlotsTorton(), []);

  const bultosEnSlotActivo = slotActivo
    ? porSlot.get(Number(slotActivo.columna)) || []
    : [];

  const handleAcomodar = async ({ sucursalId, columna, idBultos }) => {
    return onCargarSlot?.({
      sucursalId,
      slot: Number(columna),
      idBultos,
    });
  };

  return (
    <section className="space-y-3">
      {/* Cabina ← → caja: 3 filas × 4 tarimas */}
      <div className="rounded-xl border-2 border-slate-800 bg-slate-100 p-3 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-600">
          <span className="rounded bg-slate-800 text-white px-2 py-1">Cabina</span>
          <span className="flex-1 h-px bg-slate-400" />
          <span>Caja · 12 tarimas</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {slots.map(({ slot, etiqueta }) => {
            const bultosSlot = porSlot.get(slot) || [];
            const seleccionado = slotActivo?.columna === slot;
            return (
              <TarimaSlot
                key={slot}
                nivel={null}
                columna={slot}
                zona="B"
                etiqueta={etiqueta}
                bultos={bultosSlot}
                seleccionado={seleccionado}
                onSelect={setSlotActivo}
              />
            );
          })}
        </div>
      </div>

      {slotActivo && (
        <TarimaPanel
          nivel={null}
          columna={slotActivo.columna}
          etiquetaPosicion={`Tarima T${slotActivo.columna} del Tortón`}
          permitirSugerencia={false}
          bultosEnSlot={bultosEnSlotActivo}
          bultosEnRack={bultosEnTorton}
          bultosCandidatos={bultosCandidatos}
          todosLosBultos={todosLosBultos}
          sucursales={sucursales}
          sucursalId={sucursal.id}
          onAcomodar={handleAcomodar}
          ocupado={cargando}
          onCerrar={() => setSlotActivo(null)}
        />
      )}
    </section>
  );
}
