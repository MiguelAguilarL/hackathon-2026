"use client";

import {
  listarModulosDobles,
  proximidadDeRack,
  PROXIMIDAD_INFO,
  numeroDeRack,
  etiquetaRack,
} from "../cedisLayout";

const COLOR_PROX = {
  cerca: "bg-emerald-100 border-emerald-500 text-emerald-950",
  media: "bg-sky-100 border-sky-400 text-sky-950",
  lejos: "bg-slate-100 border-slate-300 text-slate-700",
};

function CeldaX() {
  return (
    <div
      className="h-7 sm:h-8 w-full rounded border-2 border-slate-400 bg-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-black text-slate-600"
      title="Lado hacia puertas de embarque"
    >
      X
    </div>
  );
}

function CeldaRack({ numero, seleccionado, esTuRack, onSelect }) {
  const prox = proximidadDeRack(numero);
  const color = COLOR_PROX[prox] || COLOR_PROX.lejos;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(numero)}
      title={`${etiquetaRack(numero)} · ${PROXIMIDAD_INFO[prox]?.nombre || ""} — clic para ver tarimas`}
      className={`h-12 sm:h-14 w-full rounded border-2 text-[10px] sm:text-xs font-bold tabular-nums transition hover:brightness-95 ${color} ${
        seleccionado ? "ring-2 ring-blue-600 ring-offset-1" : ""
      } ${esTuRack ? "outline outline-2 outline-offset-1 outline-amber-500" : ""}`}
    >
      {String(numero).padStart(2, "0")}
    </button>
  );
}

function Modulo2x2({ modulo, rackSeleccionadoNum, rackAsignadoNum, onSelectRack }) {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-[3.25rem] sm:w-[3.75rem] shrink-0">
      <CeldaX />
      <CeldaX />
      <CeldaRack
        numero={modulo.rackA}
        seleccionado={rackSeleccionadoNum === modulo.rackA}
        esTuRack={rackAsignadoNum === modulo.rackA}
        onSelect={onSelectRack}
      />
      <CeldaRack
        numero={modulo.rackB}
        seleccionado={rackSeleccionadoNum === modulo.rackB}
        esTuRack={rackAsignadoNum === modulo.rackB}
        onSelect={onSelectRack}
      />
    </div>
  );
}

export default function CedisPlano({
  rackAsignado,
  rackSeleccionadoNum,
  onSelectRack,
}) {
  const rackAsignadoNum = numeroDeRack(rackAsignado);
  const todos = listarModulosDobles();
  const izquierda = todos.filter((m) => m.ala === "izquierda");
  const derecha = todos.filter((m) => m.ala === "derecha");

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-800">Plano CEDIS · racks por sucursal</h2>
        <ul className="flex flex-wrap gap-2 text-[10px]">
          {Object.values(PROXIMIDAD_INFO).map((p) => (
            <li
              key={p.id}
              className={`px-2 py-0.5 rounded border font-semibold ${COLOR_PROX[p.id]}`}
            >
              {p.nombre}
            </li>
          ))}
        </ul>
      </div>

      {/* 3 puertas arriba, frente a los racks */}
      <div className="rounded-lg border-2 border-slate-700 bg-slate-100 px-2 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-600 text-center mb-2">
          Área de embarque a sucursales
        </p>
        <div className="flex justify-center gap-10 sm:gap-16">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="w-8 sm:w-9 h-16 sm:h-[4.5rem] rounded-t-md border-2 border-b-[5px] border-slate-800 bg-white flex items-center justify-center shadow-sm"
              title={`Puerta ${n}`}
            >
              <span className="-rotate-90 whitespace-nowrap text-[10px] font-black text-slate-800">
                Puerta {n}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 16 módulos de 2×2 */}
      <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
        <div className="flex items-start gap-2 sm:gap-3 overflow-x-auto pb-1">
          <div className="flex gap-1 sm:gap-1.5 flex-1 justify-end min-w-0">
            {izquierda.map((m) => (
              <Modulo2x2
                key={m.id}
                modulo={m}
                rackSeleccionadoNum={rackSeleccionadoNum}
                rackAsignadoNum={rackAsignadoNum}
                onSelectRack={onSelectRack}
              />
            ))}
          </div>

          <div className="w-4 sm:w-6 shrink-0 self-stretch bg-slate-200 rounded flex items-center justify-center">
            <span className="text-[8px] font-bold text-slate-500 -rotate-90 whitespace-nowrap">
              Pasillo
            </span>
          </div>

          <div className="flex gap-1 sm:gap-1.5 flex-1 justify-start min-w-0">
            {derecha.map((m) => (
              <Modulo2x2
                key={m.id}
                modulo={m}
                rackSeleccionadoNum={rackSeleccionadoNum}
                rackAsignadoNum={rackAsignadoNum}
                onSelectRack={onSelectRack}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between text-[9px] text-slate-400 px-1">
          <span>Ala izquierda · 1 → 14</span>
          <span>Ala derecha · 15 → 32</span>
        </div>
      </div>

      <div className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
          Área de recibo · andenes de proveedor
        </p>
      </div>

      <p className="text-[10px] text-slate-500">
        Contorno ámbar = tu rack asignado · Anillo azul = rack seleccionado para ver tarimas
      </p>
    </section>
  );
}
