import { ESTILO_RACK, RACK_MAX_TARIMAS } from "../torton";

export default function RackCard({ rack, resumen, seleccionado, onSelect }) {
  const estilo = ESTILO_RACK[resumen.estado];

  return (
    <button
      type="button"
      onClick={() => onSelect(rack.id)}
      className={`p-3 rounded-xl border text-left transition hover:brightness-[0.98] ${estilo} ${
        seleccionado ? "ring-2 ring-blue-600 ring-offset-1" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-black text-xs">{rack.rackAsignado}</span>
        <span className="text-[10px] font-bold tabular-nums">
          {rack.bultos.length}/{RACK_MAX_TARIMAS}
        </span>
      </div>
      <p className="text-[11px] font-semibold truncate mt-1">{rack.codigo}</p>
      <p className="text-[10px] mt-1.5 tabular-nums opacity-80">
        Peso {resumen.pctPeso.toFixed(0)}% · Vol {resumen.pctVolumen.toFixed(0)}%
      </p>
    </button>
  );
}
