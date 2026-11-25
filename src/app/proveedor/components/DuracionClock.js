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

function posicionMarca(indice, radio = 74) {
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
      ? `${traslape.proveedor} ya ocupa ${formatearHora(desdeMinutos(rangoDe(traslape)[0]))}–${formatearHora(desdeMinutos(rangoDe(traslape)[1]))} en el Andén #${traslape.anden}.`
      : null);

  const botonBase =
    "grid place-items-center rounded-full font-mono font-black transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/60";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden h-full flex flex-col">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">
            Tiempo estimado de descarga
          </p>
          <p className="text-xs text-slate-300">Reloj de 1:00 a 2:00 hrs</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-black leading-none text-white">
            {formatearDuracion(duracionHoras)}
            <span className="text-xs text-amber-400 ml-1">hrs</span>
          </p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">
            {formatearHora(horaInicio)} → {formatearHora(horaInicio + duracionHoras)}
          </p>
        </div>
      </div>

      <div className="p-4 flex flex-col items-center flex-1">
        <div className="flex items-center gap-2 mb-3" role="group" aria-label="Paso del reloj">
          {["HORAS", "MINUTOS"].map((etapa, idx) => (
            <button
              key={etapa}
              type="button"
              onClick={() => setPaso(etapa)}
              aria-pressed={paso === etapa}
              className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full transition ${
                paso === etapa
                  ? "bg-amber-500 text-slate-950"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {idx + 1}/2 {etapa.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative h-44 w-44 rounded-full border-4 border-slate-900 bg-slate-50 shadow-inner">
          <div className="absolute inset-3 rounded-full border border-dashed border-slate-300" />

          {paso === "HORAS" ? (
            <>
              {[1, 2].map((h, idx) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => elegirHoras(h)}
                  aria-pressed={horas === h}
                  className={`${botonBase} absolute h-14 w-14 text-xl ${
                    idx === 0 ? "left-2 top-1/2 -translate-y-1/2" : "right-2 top-1/2 -translate-y-1/2"
                  } ${
                    horas === h
                      ? "bg-slate-900 text-white ring-4 ring-amber-500/40"
                      : "bg-white text-slate-800 border-2 border-slate-300 hover:border-slate-900"
                  }`}
                >
                  {h}h
                </button>
              ))}
              <p className="absolute inset-x-0 bottom-3 text-center text-[10px] font-bold text-slate-500">
                Elige horas →
              </p>
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
                        ? "bg-amber-500 text-slate-950 ring-2 ring-slate-900"
                        : "bg-white text-slate-600 border border-slate-300 hover:border-slate-900"
                    } ${deshabilitado ? "opacity-30 cursor-not-allowed" : ""}`}
                  >
                    {String(m).padStart(2, "0")}
                  </button>
                );
              })}
              {horas === 2 && (
                <p className="absolute inset-x-0 bottom-2 text-center text-[9px] font-black text-red-700">
                  Máx. 2:00
                </p>
              )}
            </>
          )}

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full bg-amber-500 text-slate-950 grid place-items-center shadow-md ring-4 ring-white">
            <span className="font-mono text-lg font-black leading-none">{formatearDuracion(duracionHoras)}</span>
          </div>
        </div>

        {paso === "MINUTOS" && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => ajustarMinutos(-1)}
              disabled={minutos === 0 || horas === 2}
              className="h-8 w-9 rounded-lg bg-slate-100 border border-slate-300 font-black text-slate-700 disabled:opacity-40 hover:bg-slate-200"
              aria-label="Quitar un minuto"
            >
              −
            </button>
            <span className="text-[11px] font-bold text-slate-600 w-24 text-center">minuto a minuto</span>
            <button
              type="button"
              onClick={() => ajustarMinutos(1)}
              disabled={minutos === 59 || horas === 2}
              className="h-8 w-9 rounded-lg bg-slate-100 border border-slate-300 font-black text-slate-700 disabled:opacity-40 hover:bg-slate-200"
              aria-label="Agregar un minuto"
            >
              +
            </button>
          </div>
        )}

        {error && (
          <p className="mt-3 text-center text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5">
            {error}
          </p>
        )}

        <p className="mt-auto pt-3 text-[10px] text-slate-500 text-center font-medium">
          El rango seleccionado queda bloqueado en la agenda para ese día y andén.
        </p>
      </div>
    </div>
  );
}
