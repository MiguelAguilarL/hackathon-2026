// Utilidades de horario del CEDIS. La hora se guarda como número decimal
// (11.5 = 11:30) para poder expresar citas de 1:30 con precisión.

export const APERTURA_MIN = 8 * 60;
export const CIERRE_MIN = 18 * 60;
export const DURACION_MINIMA_MIN = 60;
export const DURACION_MAXIMA_MIN = 120;

export function aMinutos(horasDecimal) {
  const numero = Number(horasDecimal);
  return Number.isFinite(numero) ? Math.round(numero * 60) : 0;
}

export function desdeMinutos(minutos) {
  return Number(minutos) / 60;
}

export function formatearHora(horasDecimal) {
  const total = aMinutos(horasDecimal);
  const horas = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export function formatearDuracion(horasDecimal) {
  const total = aMinutos(horasDecimal);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function formatearRango(inicioHoras, duracionHoras) {
  return `${formatearHora(inicioHoras)} – ${formatearHora(Number(inicioHoras) + Number(duracionHoras))}`;
}

export function hayTraslape(inicioA, finA, inicioB, finB) {
  return inicioA < finB && finA > inicioB;
}

export function conflictoHorario(horaInicio, duracionHoras) {
  const inicio = aMinutos(horaInicio);
  const fin = inicio + aMinutos(duracionHoras);
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return "Selecciona una fecha, hora y duración válidas.";
  if (inicio < APERTURA_MIN) return "El CEDIS abre a las 08:00 hrs.";
  if (fin > CIERRE_MIN) return "La cita debe terminar a más tardar a las 18:00 hrs.";
  const duracion = fin - inicio;
  if (duracion < DURACION_MINIMA_MIN || duracion > DURACION_MAXIMA_MIN) {
    return "La descarga debe durar entre 1:00 y 2:00 horas.";
  }
  return null;
}
