import { TARIMA_PESO_MAX_KG } from "../rackRules";

const ZONA_BORDE = {
  A: "border-l-blue-500",
  B: "border-l-slate-400",
  C: "border-l-amber-500",
};

export default function TarimaSlot({
  nivel,
  columna,
  zona,
  bultos = [],
  seleccionado,
  onSelect,
  /** Etiqueta visible (ej. T3 en Tortón). Por defecto N?-C?. */
  etiqueta,
}) {
  const peso = bultos.reduce((acc, b) => acc + (b.pesoKg || 0), 0);
  const volumen = bultos.reduce((acc, b) => acc + (b.volumenM3 || 0), 0);
  const ocupada = bultos.length > 0;
  const pctPeso = Math.min(100, (peso / TARIMA_PESO_MAX_KG) * 100);
  const label =
    etiqueta ||
    (nivel != null ? `N${nivel}-C${columna}` : `T${columna}`);

  let fondo = "bg-white hover:bg-slate-50";
  if (ocupada && pctPeso >= 90) fondo = "bg-emerald-50 hover:bg-emerald-100/80";
  else if (ocupada) fondo = "bg-amber-50 hover:bg-amber-100/70";

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ nivel, columna, zona, bultos, etiqueta: label })}
      title={`${label}${ocupada ? ` · ${bultos.length} bulto(s)` : " · vacía"}`}
      className={`relative min-h-[4.5rem] rounded-md border border-slate-200 border-l-4 p-1.5 text-left transition ${ZONA_BORDE[zona] || "border-l-slate-300"} ${fondo} ${
        seleccionado ? "ring-2 ring-blue-600 ring-offset-1" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono text-[10px] font-bold text-slate-700">{label}</span>
      </div>

      {ocupada ? (
        <>
          <p className="text-[10px] font-semibold text-slate-800 mt-1 truncate">
            {bultos[0].sku}
            {bultos.length > 1 ? ` +${bultos.length - 1}` : ""}
          </p>
          <p className="text-[9px] text-slate-500 tabular-nums mt-0.5">
            {peso.toFixed(0)} kg · {volumen.toFixed(1)} m³
          </p>
          <div className="mt-1 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full ${pctPeso >= 90 ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${pctPeso}%` }}
            />
          </div>
        </>
      ) : (
        <p className="text-[10px] text-slate-400 mt-2">Vacía</p>
      )}
    </button>
  );
}
