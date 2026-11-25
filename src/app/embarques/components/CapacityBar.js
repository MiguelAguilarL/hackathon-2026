import { ESTILO_BARRA, TEXTO_META } from "../torton";

export default function CapacityBar({
  label,
  valorTexto,
  maxTexto,
  porcentaje,
  metaTexto,
}) {
  const ok = porcentaje >= 90;
  const tono = ok ? "ok" : "pendiente";

  return (
    <div className="bg-slate-800 p-4 rounded-lg">
      <div className="flex flex-wrap justify-between gap-2 text-xs font-bold mb-2">
        <span>
          {label}: {valorTexto} / {maxTexto}
        </span>
        <span className={TEXTO_META[tono]}>
          {porcentaje.toFixed(1)}% · Meta ≥ 90% ({metaTexto})
        </span>
      </div>
      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${ESTILO_BARRA[tono]}`}
          style={{ width: `${Math.min(porcentaje, 100)}%` }}
        />
      </div>
    </div>
  );
}
