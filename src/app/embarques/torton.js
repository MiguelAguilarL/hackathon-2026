/** Cálculos y estados del consolidador Tortón (regla ≥90%). Sin React. */

export const META_PESO_90_KG = 10800;
export const META_VOLUMEN_90_M3 = 25.73;
export const RACK_MAX_TARIMAS = 32;

export function sumarPeso(bultos = []) {
  return bultos.reduce((acc, b) => acc + (b.pesoKg || 0), 0);
}

export function sumarVolumen(bultos = []) {
  return bultos.reduce((acc, b) => acc + (b.volumenM3 || 0), 0);
}

export function porcentaje(valor, maximo) {
  if (!maximo) return 0;
  return (valor / maximo) * 100;
}

export function cumpleRegla90(pctPeso, pctVolumen) {
  return pctPeso >= 90 && pctVolumen >= 90;
}

/** vacio | parcial | listo */
export function estadoConsolidacion({ pctPeso, pctVolumen, tieneCarga }) {
  if (cumpleRegla90(pctPeso, pctVolumen)) return "listo";
  if (tieneCarga) return "parcial";
  return "vacio";
}

export function mensajeCandado({ pctPeso, pctVolumen }) {
  const faltaPeso = pctPeso < 90;
  const faltaVolumen = pctVolumen < 90;

  if (!faltaPeso && !faltaVolumen) return "Listo para despachar";
  if (faltaPeso && faltaVolumen) return "Falta peso y volumen";
  if (faltaPeso) return "Falta peso";
  return "Falta volumen";
}

export const ESTILO_RACK = {
  vacio: "bg-slate-50 border-slate-200 text-slate-600",
  parcial: "bg-amber-50 border-amber-300 text-amber-950",
  listo: "bg-emerald-50 border-emerald-400 text-emerald-950",
};

export const ESTILO_BARRA = {
  ok: "bg-emerald-500",
  pendiente: "bg-amber-500",
};

export const TEXTO_META = {
  ok: "text-emerald-400",
  pendiente: "text-amber-400",
};

export function resumenRack(sucursal, rules) {
  const bultos = sucursal?.bultos || [];
  const pesoKg = sumarPeso(bultos);
  const volumenM3 = sumarVolumen(bultos);
  const pctPeso = porcentaje(pesoKg, rules.TORTON_MAX_PESO_KG);
  const pctVolumen = porcentaje(volumenM3, rules.TORTON_MAX_VOLUMEN_M3);
  const estado = estadoConsolidacion({
    pctPeso,
    pctVolumen,
    tieneCarga: bultos.length > 0 || pesoKg > 0,
  });

  return {
    bultos,
    pesoKg,
    volumenM3,
    pctPeso,
    pctVolumen,
    estado,
    listo: estado === "listo",
    mensaje: mensajeCandado({ pctPeso, pctVolumen }),
  };
}
