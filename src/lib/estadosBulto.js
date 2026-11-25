// Estados operativos de un bulto/caja, compartidos por el portal del proveedor y el handheld.
export const ESTADOS_BULTO = {
  PENDIENTE_RECIBO: { texto: "Pendiente", clases: "bg-amber-100 text-amber-900 ring-amber-300" },
  EN_RACK: { texto: "En rack", clases: "bg-emerald-100 text-emerald-900 ring-emerald-300" },
  RECHAZADO: { texto: "Rechazado", clases: "bg-red-100 text-red-900 ring-red-300" },
  EMBARCADO: { texto: "Embarcado", clases: "bg-sky-100 text-sky-900 ring-sky-300" },
};

export function etiquetaEstado(estado) {
  return ESTADOS_BULTO[estado]?.texto || estado || "Sin estado";
}

export function clasesEstado(estado) {
  return ESTADOS_BULTO[estado]?.clases || "bg-slate-100 text-slate-700 ring-slate-300";
}
