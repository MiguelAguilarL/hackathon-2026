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

  // Un bloque de 30 min se marca ocupado si traslapa aunque sea un minuto con una cita.
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
      return `Andén #${numAnden} ocupado por ${ocupada.proveedor} (${formatearHora(desdeMinutos(ini))}–${formatearHora(desdeMinutos(fin))}).`;
    }
    return null;
  };

  const conflictoActual = verificarConflictoSeleccion(anden, horaInicio, duracionHoras);

  const minutosOcupados = citasDelDia.reduce((acc, cita) => acc + aMinutos(cita.duracionHoras), 0);
  const porcentajeSaturacion = Math.min(100, Math.round((minutosOcupados / (andenes.length * 600)) * 100));

  const seleccionarCelda = (numAnden, minuto) => {
    if (obtenerCitaEnBloque(numAnden, minuto)) return;
    setAnden(numAnden);
    setHoraInicio(desdeMinutos(minuto));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
            Paso 2 · Programación de Andén (08:00 - 18:00 hrs)
          </span>
          <h2 className="text-lg font-bold mt-1">Parrilla de Andenes de Recibo (1 al 4)</h2>
          <p className="text-xs text-slate-300">
            Cada bloque equivale a 30 minutos. Haz clic en uno libre para fijar la llegada; ajusta la duración en el reloj.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Capacidad Diaria Andenes</p>
            <p className="text-sm font-extrabold text-amber-400">
              {(minutosOcupados / 60).toFixed(2).replace(".00", "")} / 40 hrs-andén ({porcentajeSaturacion}%)
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5" htmlFor="fecha-cita">
              1. Fecha de Arribo al CEDIS
            </label>
            <input
              id="fecha-cita"
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase text-slate-600 mb-1">2. Hora de llegada elegida</p>
            <p className="font-mono text-xl font-black text-slate-900">{formatearHora(horaInicio)}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Selecciona el bloque en la parrilla ↓</p>
          </div>

          <div
            className={`p-3.5 rounded-xl border flex flex-col justify-center ${
              conflictoActual
                ? "bg-red-50 border-red-300 text-red-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-950"
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-wider">
              {conflictoActual ? "Horario con Conflicto" : "Reserva Seleccionada"}
            </span>
            <p className="text-base font-extrabold mt-0.5">
              Andén #{anden} · {formatearHora(horaInicio)} a {formatearHora(horaInicio + duracionHoras)} (
              {formatearDuracion(duracionHoras)}h)
            </p>
            <p className="text-xs mt-0.5">
              {conflictoActual ? conflictoActual : `Fecha: ${fecha} · Sin traslapes en Andén #${anden}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300 inline-block" />
              Disponible
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-800">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border-2 border-amber-600 inline-block" />
              Tu llegada
            </span>
            <span className="flex items-center gap-1.5 font-medium text-red-700">
              <span className="w-3.5 h-3.5 rounded bg-red-100 border-2 border-red-400 inline-block" />
              Ocupado (bloqueado)
            </span>
          </div>
          <span className="text-slate-500 font-mono">Desliza → para ver las 10 hrs</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <div className="min-w-[1240px]">
            <div className="grid grid-cols-[110px_repeat(20,minmax(0,1fr))] bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700">
              <div className="p-2 border-r border-slate-200">ANDÉN / HORA</div>
              {bloques.map((minuto) => (
                <div key={minuto} className="p-1.5 text-center border-r border-slate-200 last:border-r-0 font-mono">
                  {formatearHora(desdeMinutos(minuto))}
                </div>
              ))}
            </div>

            {andenes.map((numAnden) => (
              <div
                key={numAnden}
                className="grid grid-cols-[110px_repeat(20,minmax(0,1fr))] border-b border-slate-200 last:border-b-0 items-stretch"
              >
                <div className="p-2 bg-slate-50 border-r border-slate-200 flex flex-col justify-center">
                  <span className="font-extrabold text-xs text-slate-900">ANDÉN #{numAnden}</span>
                  <span className="text-[9px] text-slate-500">Recibo</span>
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
                    const detalle = `${formatearHora(desdeMinutos(ini))}–${formatearHora(desdeMinutos(fin))} · ${cita.folioFactura} · ${cita.proveedor}`;
                    return (
                      <div
                        key={minuto}
                        title={detalle}
                        className="p-1 bg-red-50/80 border-r border-slate-200 last:border-r-0 flex items-center justify-center cursor-not-allowed select-none bg-[repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(220,38,38,.08)_6px,rgba(220,38,38,.08)_12px)]"
                      >
                        <span className="text-[9px] font-black text-red-700 truncate">OCUP</span>
                        <span className="sr-only">{detalle}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={minuto}
                      type="button"
                      onClick={() => seleccionarCelda(numAnden, minuto)}
                      title={`Reservar ${formatearHora(desdeMinutos(minuto))} en Andén #${numAnden}`}
                      aria-label={`Reservar ${formatearHora(desdeMinutos(minuto))} en Andén ${numAnden}`}
                      aria-pressed={esSeleccionado}
                      className={`p-1 border-r border-slate-200 last:border-r-0 flex items-center justify-center text-[9px] font-mono transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-600 ${
                        esSeleccionado
                          ? "bg-amber-400 text-slate-950 font-black ring-2 ring-inset ring-amber-600"
                          : "bg-white hover:bg-amber-50 text-slate-400"
                      }`}
                    >
                      {esSeleccionado ? "●" : "·"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
