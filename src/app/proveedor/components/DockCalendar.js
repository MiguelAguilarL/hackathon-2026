"use client";

import {
  aMinutos,
  desdeMinutos,
  formatearHora,
  formatearDuracion,
  conflictoHorario,
  hayTraslape,
  APERTURA_MIN,
  CIERRE_MIN,
} from "@/lib/horarios";

export default function DockCalendar({
  fecha,
  setFecha,
  anden,
  setAnden,
  horaInicio,
  setHoraInicio,
  duracionHoras,
  setDuracionHoras,
  citasFacturas = [],
}) {
  const andenes = [1, 2, 3, 4];
  const bloques = Array.from({ length: (CIERRE_MIN - APERTURA_MIN) / 30 }, (_, i) => APERTURA_MIN + i * 30);

  const citasDelDia = citasFacturas.filter((c) => c.fecha === fecha);

  const rangoDe = (cita) => {
    const inicio = aMinutos(cita.horaInicio);
    return [inicio, inicio + aMinutos(cita.duracionHoras)];
  };

  const obtenerCitaEnBloque = (numAnden, minuto) =>
    citasDelDia.find((cita) => {
      if (Number(cita.anden) !== numAnden) return false;
      const [inicio, fin] = rangoDe(cita);
      return hayTraslape(minuto, minuto + 30, inicio, fin);
    });

  const verificarConflictoSeleccion = (numAnden, inicio, duracion) => {
    const base = conflictoHorario(inicio, duracion);
    if (base) return base;
    const inicioMin = aMinutos(inicio);
    const finMin = inicioMin + aMinutos(duracion);
    const ocupada = citasDelDia.find((cita) => {
      if (Number(cita.anden) !== numAnden) return false;
      const [ini, fin] = rangoDe(cita);
      return hayTraslape(inicioMin, finMin, ini, fin);
    });
    if (ocupada) {
      const [ini, fin] = rangoDe(ocupada);
      return `El Andén ${numAnden} ya está reservado de ${formatearHora(desdeMinutos(ini))} a ${formatearHora(desdeMinutos(fin))}. Elige otro horario o andén.`;
    }
    return null;
  };

  const conflictoActual = verificarConflictoSeleccion(anden, horaInicio, duracionHoras);

  const seleccionarCelda = (numAnden, minuto) => {
    if (obtenerCitaEnBloque(numAnden, minuto)) return;
    setAnden(numAnden);
    setHoraInicio(desdeMinutos(minuto));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 h-full flex flex-col justify-between">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Fecha, Andén y Hora de Llegada</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Elige el día de tu entrega y haz clic en un horario disponible dentro de los 4 andenes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-600" htmlFor="fecha-cita">
              Fecha de entrega:
            </label>
            <input
              id="fecha-cita"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Estado de la reserva seleccionada */}
        <div
          className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            conflictoActual
              ? "bg-red-50 border-red-200 text-red-900"
              : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
          }`}
        >
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wide block opacity-75">
              {conflictoActual ? "Horario no disponible" : "Horario seleccionado"}
            </span>
            <p className="text-base font-extrabold mt-0.5">
              Andén #{anden} · {formatearHora(horaInicio)} a {formatearHora(horaInicio + duracionHoras)} hrs
            </p>
          </div>
          <span className="text-xs font-semibold">
            {conflictoActual ? conflictoActual : `Duración: ${formatearDuracion(duracionHoras)} hrs`}
          </span>
        </div>

        {/* Leyenda simple */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-5">
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded bg-white border border-slate-300 inline-block" />
              Disponible
            </span>
            <span className="flex items-center gap-2 font-semibold text-slate-900">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border border-amber-600 inline-block" />
              Tu cita
            </span>
            <span className="flex items-center gap-2 text-red-700">
              <span className="w-3.5 h-3.5 rounded bg-red-100 border border-red-300 inline-block" />
              Ocupado
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Horario de recepción: 08:00 a 18:00 hrs</span>
        </div>

        {/* Parrilla de horarios */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[920px]">
            <div className="grid grid-cols-[96px_repeat(20,minmax(0,1fr))] bg-slate-50 border-b border-slate-200 text-[10px] font-semibold text-slate-600">
              <div className="p-2.5 border-r border-slate-200">Andén</div>
              {bloques.map((minuto) => (
                <div key={minuto} className="py-2.5 px-1 text-center border-r border-slate-100 last:border-r-0 font-mono">
                  {minuto % 60 === 0 ? formatearHora(desdeMinutos(minuto)) : "·"}
                </div>
              ))}
            </div>

            {andenes.map((numAnden) => (
              <div
                key={numAnden}
                className="grid grid-cols-[96px_repeat(20,minmax(0,1fr))] border-b border-slate-100 last:border-b-0 items-stretch"
              >
                <div className="p-2.5 bg-slate-50/60 border-r border-slate-200 flex items-center">
                  <span className="font-bold text-xs text-slate-800">Andén #{numAnden}</span>
                </div>

                {bloques.map((minuto) => {
                  const cita = obtenerCitaEnBloque(numAnden, minuto);
                  const esSeleccionado =
                    anden === numAnden &&
                    hayTraslape(
                      minuto,
                      minuto + 30,
                      aMinutos(horaInicio),
                      aMinutos(horaInicio) + aMinutos(duracionHoras)
                    );

                  if (cita) {
                    const [ini, fin] = rangoDe(cita);
                    const detalle = `Reservado de ${formatearHora(desdeMinutos(ini))} a ${formatearHora(desdeMinutos(fin))}`;
                    return (
                      <div
                        key={minuto}
                        title={detalle}
                        className="h-10 bg-red-50 border-r border-slate-100 last:border-r-0 flex items-center justify-center cursor-not-allowed select-none"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-300" />
                      </div>
                    );
                  }

                  return (
                    <button
                      key={minuto}
                      type="button"
                      onClick={() => seleccionarCelda(numAnden, minuto)}
                      title={`Elegir ${formatearHora(desdeMinutos(minuto))} en Andén #${numAnden}`}
                      aria-label={`Elegir ${formatearHora(desdeMinutos(minuto))} en Andén ${numAnden}`}
                      aria-pressed={esSeleccionado}
                      className={`h-10 border-r border-slate-100 last:border-r-0 flex items-center justify-center text-xs transition focus:outline-none ${
                        esSeleccionado
                          ? "bg-amber-400 text-slate-950 font-black"
                          : "bg-white hover:bg-amber-50 text-slate-300"
                      }`}
                    >
                      {esSeleccionado ? "●" : ""}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 pt-2">
        Haz clic en cualquier casilla blanca para cambiar el andén o la hora de llegada.
      </p>
    </div>
  );
}
