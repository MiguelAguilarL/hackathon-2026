"use client";

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
  const horas = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // 08:00 a 18:00

  // Filtra las citas que existen para la fecha seleccionada
  const citasDelDia = citasFacturas.filter((c) => c.fecha === fecha);

  // Busca si un andén y hora específica ya están ocupados por una cita registrada
  const obtenerCitaEnBloque = (numAnden, hora) => {
    return citasDelDia.find((c) => {
      const fin = c.horaInicio + c.duracionHoras;
      return Number(c.anden) === numAnden && hora >= c.horaInicio && hora < fin;
    });
  };

  // Verifica si la selección actual del usuario tiene algún conflicto (traslape o fuera de 18:00)
  const verificarConflictoSeleccion = (numAnden, inicio, duracion) => {
    if (inicio + duracion > 18) {
      return `El horario seleccionado (${inicio}:00 a ${inicio + duracion}:00) excede el cierre del CEDIS (18:00 hrs).`;
    }
    for (let h = inicio; h < inicio + duracion; h++) {
      const ocupada = obtenerCitaEnBloque(numAnden, h);
      if (ocupada) {
        return `Conflicto en Andén #${numAnden} a las ${h}:00 hrs con Factura ${ocupada.folioFactura} (${ocupada.proveedor}).`;
      }
    }
    return null;
  };

  const conflictoActual = verificarConflictoSeleccion(anden, horaInicio, duracionHoras);

  // Calcula estadísticas de saturación del día (4 andenes x 10h = 40 horas-andén disponibles)
  const horasOcupadasDia = citasDelDia.reduce((acc, c) => acc + c.duracionHoras, 0);
  const porcentajeSaturacion = Math.min(100, Math.round((horasOcupadasDia / 40) * 100));

  const seleccionarCelda = (numAnden, hora) => {
    const citaExistente = obtenerCitaEnBloque(numAnden, hora);
    if (citaExistente) return; // No permitir clic sobre celda ya reservada

    setAnden(numAnden);
    setHoraInicio(hora);

    // Si tenía 2 horas seleccionadas pero a las 17:00 o la hora siguiente está ocupada, ajustar automáticamente a 1 hora
    if (duracionHoras === 2) {
      const siguienteOcupada = hora + 1 >= 18 || obtenerCitaEnBloque(numAnden, hora + 1);
      if (siguienteOcupada) {
        setDuracionHoras(1);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
            Paso 2 · Programación de Andén (08:00 - 18:00 hrs)
          </span>
          <h2 className="text-lg font-bold mt-1">Parrilla Interactiva de Andenes de Recibo (1 al 4)</h2>
          <p className="text-xs text-slate-400">
            Haz clic en cualquier bloque disponible para reservar tu cita · Duración permitida: Mínimo 1h, Máximo 2h.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-xl border border-slate-700">
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold text-slate-400">Capacidad Diaria Andenes</p>
            <p className="text-sm font-extrabold text-amber-400">
              {horasOcupadasDia} / 40 hrs-andén ({porcentajeSaturacion}%)
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Controles rápidos: Fecha, Duración (1h o 2h) y Resumen de Selección */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
              1. Fecha de Arribo al CEDIS
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
              2. Duración Estimada de Descarga (1h - 2h máx)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[1, 2].map((h) => {
                const deshabilitado =
                  h === 2 && (horaInicio + 2 > 18 || Boolean(obtenerCitaEnBloque(anden, horaInicio + 1)));
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={deshabilitado}
                    onClick={() => setDuracionHoras(h)}
                    className={`py-2 px-3 rounded-lg text-xs font-extrabold border transition ${
                      duracionHoras === h
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : deshabilitado
                        ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-slate-700 border-slate-300 hover:border-slate-500"
                    }`}
                  >
                    {h} {h === 1 ? "Hora (Mínimo)" : "Horas (Máximo)"}
                  </button>
                );
              })}
            </div>
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
              Andén #{anden} · {String(horaInicio).padStart(2, "0")}:00 a{" "}
              {String(horaInicio + duracionHoras).padStart(2, "0")}:00 hrs ({duracionHoras}h)
            </p>
            <p className="text-xs mt-0.5">
              {conflictoActual ? conflictoActual : `Fecha: ${fecha} · Sin traslapes en Andén #${anden}`}
            </p>
          </div>
        </div>

        {/* Leyenda de colores de la matriz */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="w-3.5 h-3.5 rounded bg-white border-2 border-slate-300 inline-block" />
              Disponible (Clic para elegir)
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-800">
              <span className="w-3.5 h-3.5 rounded bg-amber-400 border-2 border-amber-600 inline-block" />
              Tu Cita Seleccionada ({duracionHoras}h)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-red-700">
              <span className="w-3.5 h-3.5 rounded bg-red-100 border-2 border-red-400 inline-block" />
              Ocupado / Bloqueado (Cero Traslapes)
            </span>
          </div>
          <span className="text-slate-500 font-mono">Horario continuo CEDIS: 08:00 - 18:00</span>
        </div>

        {/* Matriz Visual: 4 Andenes x 10 Bloques de 1 Hora */}
        <div className="overflow-x-auto">
          <div className="min-w-[760px] border border-slate-200 rounded-xl overflow-hidden">
            {/* Encabezado de Horas */}
            <div className="grid grid-cols-11 bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700">
              <div className="p-3 border-r border-slate-200">ANDÉN / HORA</div>
              {horas.map((h) => (
                <div key={h} className="p-3 text-center border-r border-slate-200 last:border-r-0 font-mono">
                  {String(h).padStart(2, "0")}:00
                  <span className="block text-[10px] font-normal text-slate-400">
                    a {String(h + 1).padStart(2, "0")}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Filas por Andén (1 a 4) */}
            {andenes.map((numAnden) => (
              <div
                key={numAnden}
                className="grid grid-cols-11 border-b border-slate-200 last:border-b-0 items-stretch"
              >
                <div className="p-3 bg-slate-50 border-r border-slate-200 flex flex-col justify-center">
                  <span className="font-extrabold text-xs text-slate-900">ANDÉN #{numAnden}</span>
                  <span className="text-[10px] text-slate-500">Recibo Proveedor</span>
                </div>

                {horas.map((h) => {
                  const citaOcupada = obtenerCitaEnBloque(numAnden, h);
                  const esSeleccionado =
                    anden === numAnden && h >= horaInicio && h < horaInicio + duracionHoras;

                  if (citaOcupada) {
                    return (
                      <div
                        key={h}
                        title={`Ocupado por Factura ${citaOcupada.folioFactura} (${citaOcupada.proveedor})`}
                        className="p-2 bg-red-50 border-r border-slate-200 last:border-r-0 flex flex-col justify-between cursor-not-allowed select-none"
                      >
                        <span className="text-[9px] font-black uppercase text-red-700 bg-red-200/80 px-1.5 py-0.5 rounded truncate">
                          OCUPADO
                        </span>
                        <span className="font-mono font-bold text-[10px] text-red-900 truncate mt-1">
                          {citaOcupada.folioFactura}
                        </span>
                        <span className="text-[9px] text-red-700 truncate">{citaOcupada.idOc}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => seleccionarCelda(numAnden, h)}
                      className={`p-2 border-r border-slate-200 last:border-r-0 flex flex-col justify-between text-left transition ${
                        esSeleccionado
                          ? "bg-amber-400 text-slate-950 font-bold ring-2 ring-inset ring-amber-600 shadow-inner"
                          : "bg-white hover:bg-amber-50/70 text-slate-600"
                      }`}
                    >
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded w-fit ${
                          esSeleccionado
                            ? "bg-slate-950 text-amber-400"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {esSeleccionado ? "TU CITA" : "LIBRE"}
                      </span>
                      <span className="text-[10px] font-mono mt-2">
                        {esSeleccionado
                          ? `${String(horaInicio).padStart(2, "0")}:00-${String(horaInicio + duracionHoras).padStart(2, "0")}:00`
                          : "Reservar"}
                      </span>
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
