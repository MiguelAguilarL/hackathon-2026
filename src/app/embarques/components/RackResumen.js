import { RACK_MAX_TARIMAS } from "../rackRules";
import { proximidadDeRack, PROXIMIDAD_INFO } from "../cedisLayout";

const ESTADO_TORTON = {
  vacio: { label: "Rack vacío", clase: "bg-slate-100 text-slate-700 border-slate-200" },
  parcial: { label: "En consolidación", clase: "bg-amber-50 text-amber-900 border-amber-200" },
  listo: { label: "Listo para despachar ≥90%", clase: "bg-emerald-50 text-emerald-900 border-emerald-200" },
};

function contarSlotsOcupados(bultos = []) {
  const keys = new Set();
  for (const b of bultos) {
    if (b.nivel != null && b.columna != null) {
      keys.add(`${b.nivel}-${b.columna}`);
    }
  }
  return keys.size;
}

export default function RackResumen({ sucursal, resumen }) {
  const bultos = sucursal?.bultos || [];
  const slotsOcupados = contarSlotsOcupados(bultos);
  const slotsLibres = RACK_MAX_TARIMAS - slotsOcupados;
  const estadoUi = ESTADO_TORTON[resumen.estado] || ESTADO_TORTON.vacio;
  const proximidad = proximidadDeRack(sucursal.rackAsignado);
  const infoProx = proximidad ? PROXIMIDAD_INFO[proximidad] : null;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-sm font-bold text-slate-800">{sucursal.rackAsignado}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${estadoUi.clase}`}>
          {estadoUi.label}
        </span>
      </div>

      {infoProx && (
        <div className="rounded-lg bg-white border border-slate-200 px-3 py-2.5 text-xs">
          <p className="font-bold text-slate-800">{infoProx.nombre}</p>
          <p className="text-slate-500 mt-0.5">{infoProx.descripcion}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Tarimas usadas</p>
          <p className="text-xl font-bold tabular-nums text-slate-900 mt-1">
            {slotsOcupados}
            <span className="text-sm font-medium text-slate-500">/{RACK_MAX_TARIMAS}</span>
          </p>
        </div>
        <div className="rounded-lg bg-white border border-slate-200 p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">Libres</p>
          <p className="text-xl font-bold tabular-nums text-slate-900 mt-1">{slotsLibres}</p>
        </div>
      </div>
    </section>
  );
}
