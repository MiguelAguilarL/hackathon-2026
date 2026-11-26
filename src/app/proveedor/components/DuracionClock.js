"use client";

import { useState } from "react";
import {
  aMinutos,
  desdeMinutos,
  formatearDuracion,
  formatearHora,
  conflictoHorario,
  hayTraslape,
} from "@/lib/horarios";

const MARCAS_MINUTO = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function posicionMarca(indice, radio = 68) {
  const angulo = (indice / 12) * 2 * Math.PI - Math.PI / 2;
  return {
    left: `calc(50% + ${Math.cos(angulo) * radio}px)`,
    top: `calc(50% + ${Math.sin(angulo) * radio}px)`,
  };
}

export default function DuracionClock({
  duracionHoras,
  setDuracionHoras,
  horaInicio,
  anden,
  fecha,
  citasFacturas = [],
  proveedorNombre = "",
}) {
  const [paso, setPaso] = useState("HORAS");

  const totalMin = aMinutos(duracionHoras);
  const horas = Math.floor(totalMin / 60);
  const minutos = totalMin % 60;

  const cambiar = (horasNuevas, minutosNuevos) => {
    const total = Math.min(120, Math.max(60, horasNuevas * 60 + minutosNuevos));
    setDuracionHoras(desdeMinutos(total));
  };

  const elegirHoras = (h) => {
    cambiar(h, h === 2 ? 0 : minutos);
    setPaso("MINUTOS");
  };

  const elegirMinutos = (m) => {
    if (horas === 2 && m !== 0) return;
    cambiar(horas, m);
  };

  const ajustarMinutos = (delta) => elegirMinutos(Math.min(59, Math.max(0, minutos + delta)));

  const rangoDe = (cita) => {
    const inicio = aMinutos(cita.horaInicio);
    return [inicio, inicio + aMinutos(cita.duracionHoras)];
  };

  const inicioMin = aMinutos(horaInicio);
  const finMin = inicioMin + totalMin;
  const errorBase = conflictoHorario(horaInicio, duracionHoras);

  const traslape = errorBase
    ? null
    : (citasFacturas || []).find((cita) => {
        if (cita.fecha !== fecha) return false;
        const [inicio, fin] = rangoDe(cita);
        if (!hayTraslape(inicioMin, finMin, inicio, fin)) return false;
        return Number(cita.anden) === Number(anden) || cita.proveedor === proveedorNombre;
      });

  const error =
    errorBase ||
    (traslape
      ? `Horario ocupado de ${formatearHora(desdeMinutos(rangoDe(traslape)[0]))} a ${formatearHora(desdeMinutos(rangoDe(traslape)[1]))} en Andén #${traslape.anden}.`
      : null);

  const botonBase =
    "grid place-items-center rounded-full font-mono font-bold transition focus:outline-none";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Duración de Descarga</h3>
            <p className="text-xs text-slate-500 mt-0.5">Mínimo 1:00 hr · Máximo 2:00 hrs</p>
          </div>
          <div className="text-right bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <p className="font-mono text-xl font-black leading-none text-slate-900">
              {formatearDuracion(duracionHoras)} <span className="text-xs font-sans font-bold text-amber-800">hrs</span>
            </p>
          </div>
        </div>

        <div className="pt-5 flex flex-col items-center">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-1 rounded-xl" role="group" aria-label="Paso del reloj">
            {["HORAS", "MINUTOS"].map((etapa, idx) => (
              <button
                key={etapa}
                type="button"
                onClick={() => setPaso(etapa)}
                aria-pressed={paso === etapa}
                className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition ${
                  paso === etapa
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {idx + 1}. {etapa === "HORAS" ? "Horas" : "Minutos"}
              </button>
            ))}
          </div>

          <div className="relative h-44 w-44 rounded-full border-2 border-slate-200 bg-slate-50">
            {paso === "HORAS" ? (
              <>
                {[1, 2].map((h, idx) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => elegirHoras(h)}
                    aria-pressed={horas === h}
                    className={`${botonBase} absolute h-14 w-14 text-lg ${
                      idx === 0 ? "left-3 top-1/2 -translate-y-1/2" : "right-3 top-1/2 -translate-y-1/2"
                    } ${
                      horas === h
                        ? "bg-slate-900 text-white shadow"
                        : "bg-white text-slate-700 border border-slate-300 hover:border-slate-900"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </>
            ) : (
              <>
                {MARCAS_MINUTO.map((m, idx) => {
                  const deshabilitado = horas === 2 && m !== 0;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => elegirMinutos(m)}
                      disabled={deshabilitado}
                      aria-pressed={minutos === m}
                      style={posicionMarca(idx, 68)}
                      className={`${botonBase} absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 text-[10px] ${
                        minutos === m
                          ? "bg-amber-500 text-slate-950 font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-800"
                      } ${deshabilitado ? "opacity-30 cursor-not-allowed" : ""}`}
                    >
                      {String(m).padStart(2, "0")}
                    </button>
                  );
                })}
              </>
            )}

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-amber-400 text-slate-950 grid place-items-center shadow-sm">
              <span className="font-mono text-base font-black leading-none">{formatearDuracion(duracionHoras)}</span>
            </div>
          </div>

          {paso === "MINUTOS" && (
            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => ajustarMinutos(-1)}
                disabled={minutos === 0 || horas === 2}
                className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
                aria-label="Quitar un minuto"
              >
                −
              </button>
              <span className="text-xs text-slate-500 px-2">Ajuste fino (min)</span>
              <button
                type="button"
                onClick={() => ajustarMinutos(1)}
                disabled={minutos === 59 || horas === 2}
                className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-200"
                aria-label="Agregar un minuto"
              >
                +
              </button>
            </div>
          )}

          {error && (
            <p className="mt-4 text-center text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 w-full">
              {error}
            </p>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 text-center pt-3">
        Salida estimada del andén: <strong className="text-slate-700">{formatearHora(horaInicio + duracionHoras)} hrs</strong>
      </p>
    </div>
  );
}
