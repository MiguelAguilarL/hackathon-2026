import { resumenRack } from "../torton";
import RackCard from "./RackCard";

const LEYENDA = [
  { key: "vacio", label: "Vacío", clase: "bg-slate-200 border-slate-300" },
  { key: "parcial", label: "En consolidación", clase: "bg-amber-200 border-amber-400" },
  { key: "listo", label: "Listo ≥90%", clase: "bg-emerald-200 border-emerald-500" },
];

export default function RackMap({ sucursales, rules, sucursalActivaId, onSelect }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Mapa de racks</h2>
          <p className="text-xs text-slate-500">Toca un rack para ver su consolidación en el panel.</p>
        </div>
        <ul className="flex flex-wrap gap-3 text-[11px] text-slate-600">
          {LEYENDA.map((item) => (
            <li key={item.key} className="flex items-center gap-1.5">
              <span className={`inline-block w-3 h-3 rounded border ${item.clase}`} />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5">
        {sucursales.map((suc) => (
          <RackCard
            key={suc.id}
            rack={suc}
            resumen={resumenRack(suc, rules)}
            seleccionado={sucursalActivaId === suc.id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}
