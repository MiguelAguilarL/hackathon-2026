import { META_PESO_90_KG, META_VOLUMEN_90_M3, RACK_MAX_TARIMAS } from "../torton";
import CapacityBar from "./CapacityBar";

const BOTON_CLASE = {
  listo: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg",
  bloqueado: "bg-slate-700 text-slate-400 cursor-not-allowed",
};

export default function TortonPanel({
  sucursal,
  resumen,
  rules,
  andenSalida,
  onAndenChange,
  onDespachar,
  despachando,
}) {
  if (!sucursal) return null;

  const { listo, mensaje, pesoKg, volumenM3, pctPeso, pctVolumen } = resumen;
  const botonClase = listo ? BOTON_CLASE.listo : BOTON_CLASE.bloqueado;
  const botonTexto = listo
    ? despachando
      ? "Despachando…"
      : "Despachar Tortón y emitir relación"
    : mensaje;

  return (
    <section className="bg-slate-900 text-white p-6 rounded-xl space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-mono uppercase text-amber-400">
            {sucursal.rackAsignado} · {RACK_MAX_TARIMAS} tarimas (4 × 8)
          </p>
          <h2 className="text-xl font-extrabold mt-0.5">{sucursal.nombre}</h2>
          <p
            className={`text-sm mt-2 font-semibold ${
              listo ? "text-emerald-400" : "text-amber-300"
            }`}
          >
            {mensaje}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="sr-only" htmlFor="anden-salida">
            Andén de embarque
          </label>
          <select
            id="anden-salida"
            value={andenSalida}
            onChange={(e) => onAndenChange(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white"
          >
            {[1, 2, 3].map((a) => (
              <option key={a} value={a}>
                Andén de salida #{a}
              </option>
            ))}
          </select>

          <button
            type="button"
            disabled={!listo || despachando}
            onClick={onDespachar}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition ${botonClase}`}
          >
            {botonTexto}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 pt-1">
        <CapacityBar
          label="Peso acumulado"
          valorTexto={`${pesoKg.toLocaleString()} kg`}
          maxTexto={`${rules.TORTON_MAX_PESO_KG.toLocaleString()} kg`}
          porcentaje={pctPeso}
          metaTexto={`${META_PESO_90_KG.toLocaleString()} kg`}
        />
        <CapacityBar
          label="Volumen acumulado"
          valorTexto={`${volumenM3.toFixed(2)} m³`}
          maxTexto={`${rules.TORTON_MAX_VOLUMEN_M3.toFixed(2)} m³`}
          porcentaje={pctVolumen}
          metaTexto={`${META_VOLUMEN_90_M3.toFixed(2)} m³`}
        />
      </div>
    </section>
  );
}
