"use client";

import {
  META_PESO_90_KG,
  META_VOLUMEN_90_M3,
} from "../torton";
import CapacityBar from "./CapacityBar";
import TortonVista from "./TortonVista";

const BOTON_CLASE = {
  listo: "bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer shadow-lg",
  bloqueado: "bg-slate-700 text-slate-400 cursor-not-allowed",
};

/**
 * Detalle del Tortón elegido: barras de camión + dibujo 12 tarimas + despacho.
 */
export default function TortonPanel({
  sucursal,
  resumen,
  rules,
  bultosEnTorton = [],
  bultosDesdeRack = [],
  todosLosBultos = [],
  sucursales = [],
  onCargarSlot,
  onDespachar,
  cargando = false,
  despachando = false,
}) {
  if (!sucursal || !resumen || !rules) return null;

  const { listo, mensaje, pesoKg, volumenM3, pctPeso, pctVolumen, pesoLibreKg, volumenLibreM3 } =
    resumen;
  const botonClase = listo ? BOTON_CLASE.listo : BOTON_CLASE.bloqueado;
  const botonTexto = listo
    ? despachando
      ? "Despachando…"
      : "Despachar Tortón y emitir relación"
    : mensaje;

  return (
    <section className="space-y-4">
      <div className="bg-slate-900 text-white p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-mono uppercase text-amber-400">Tortón</p>
            <h2 className="text-lg font-extrabold mt-0.5">{sucursal.nombre}</h2>
            <p
              className={`text-sm mt-1 font-semibold ${
                listo ? "text-emerald-400" : "text-amber-300"
              }`}
            >
              {mensaje}
            </p>
            <p className="text-xs text-slate-400 mt-1 tabular-nums">
              Libre camión: {Number(pesoLibreKg).toFixed(1)} kg ·{" "}
              {Number(volumenLibreM3).toFixed(2)} m³
            </p>
          </div>
          <button
            type="button"
            disabled={!listo || despachando}
            onClick={onDespachar}
            className={`px-5 py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wide transition ${botonClase}`}
          >
            {botonTexto}
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <CapacityBar
            label="Peso en Tortón"
            valorTexto={`${pesoKg.toLocaleString()} kg`}
            maxTexto={`${rules.TORTON_MAX_PESO_KG.toLocaleString()} kg`}
            porcentaje={pctPeso}
            metaTexto={`${META_PESO_90_KG.toLocaleString()} kg`}
          />
          <CapacityBar
            label="Volumen en Tortón"
            valorTexto={`${volumenM3.toFixed(2)} m³`}
            maxTexto={`${rules.TORTON_MAX_VOLUMEN_M3.toFixed(2)} m³`}
            porcentaje={pctVolumen}
            metaTexto={`${META_VOLUMEN_90_M3.toFixed(2)} m³`}
          />
        </div>
      </div>

      <TortonVista
        sucursal={sucursal}
        bultosEnTorton={bultosEnTorton}
        bultosCandidatos={bultosDesdeRack}
        todosLosBultos={todosLosBultos}
        sucursales={sucursales}
        onCargarSlot={onCargarSlot}
        cargando={cargando}
      />
    </section>
  );
}
