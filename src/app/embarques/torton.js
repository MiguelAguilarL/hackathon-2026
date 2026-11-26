/** Cálculos y estados del consolidador Tortón (regla ≥90%). Sin React. */

export const META_PESO_90_KG = 10800;
export const META_VOLUMEN_90_M3 = 25.73;
export const RACK_MAX_TARIMAS = 32;
/** Capacidad física del Tortón: 12 tarimas (mismas reglas de peso/volumen que en rack). */
export const TORTON_TARIMAS = 12;
export const ANDENES_SALIDA = [1, 2, 3];
export const ESTADO_EN_TORTON = "EN_TORTON";
export const ESTADO_EN_RACK = "EN_RACK";

/** Slots 1–12 del Tortón. Usamos `columna` = slot y `nivel` = null en bultos EN_TORTON. */
export function listarSlotsTorton() {
  return Array.from({ length: TORTON_TARIMAS }, (_, i) => ({
    slot: i + 1,
    etiqueta: `T${i + 1}`,
  }));
}

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

function armarResumenCarga(bultos, rules) {
  const pesoKg = sumarPeso(bultos);
  const volumenM3 = sumarVolumen(bultos);
  const maxPeso = rules.TORTON_MAX_PESO_KG;
  const maxVol = rules.TORTON_MAX_VOLUMEN_M3;
  const pctPeso = porcentaje(pesoKg, maxPeso);
  const pctVolumen = porcentaje(volumenM3, maxVol);
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
    pesoLibreKg: Math.max(0, maxPeso - pesoKg),
    volumenLibreM3: Math.max(0, maxVol - volumenM3),
    estado,
    listo: estado === "listo",
    mensaje: mensajeCandado({ pctPeso, pctVolumen }),
  };
}

/** Resumen del rack (bultos aún EN_RACK en tarimas). */
export function resumenRack(sucursal, rules) {
  return armarResumenCarga(sucursal?.bultos || [], rules);
}

/** Resumen del Tortón (bultos ya cargados EN_TORTON). */
export function resumenTorton(bultosEnTorton, rules) {
  return armarResumenCarga(bultosEnTorton || [], rules);
}

/**
 * ¿Cabe este bulto en el Tortón sin pasar la capacidad máxima?
 * @returns {{ ok: boolean, motivo?: string, resumen?: object }}
 */
export function evaluarCargaEnTorton({ bultosACargar, bultosYaEnTorton, rules }) {
  const pesoActual = sumarPeso(bultosYaEnTorton);
  const volActual = sumarVolumen(bultosYaEnTorton);
  const pesoNuevo = sumarPeso(bultosACargar);
  const volNuevo = sumarVolumen(bultosACargar);
  const pesoTotal = pesoActual + pesoNuevo;
  const volTotal = volActual + volNuevo;
  const maxPeso = rules.TORTON_MAX_PESO_KG;
  const maxVol = rules.TORTON_MAX_VOLUMEN_M3;

  if (pesoTotal > maxPeso) {
    return {
      ok: false,
      motivo: `No cabe por peso: ${pesoTotal.toFixed(1)} kg > ${maxPeso} kg máx del Tortón.`,
    };
  }
  if (volTotal > maxVol) {
    return {
      ok: false,
      motivo: `No cabe por volumen: ${volTotal.toFixed(2)} m³ > ${maxVol.toFixed(2)} m³ máx del Tortón.`,
    };
  }

  return {
    ok: true,
    resumen: {
      pesoTotalKg: pesoTotal,
      volumenTotalM3: volTotal,
      pesoLibreKg: maxPeso - pesoTotal,
      volumenLibreM3: maxVol - volTotal,
      pctPeso: porcentaje(pesoTotal, maxPeso),
      pctVolumen: porcentaje(volTotal, maxVol),
    },
  };
}

/** Bultos de una sucursal listos para subir al Tortón (en rack/tarima). */
export function bultosEnRackDeSucursal(todosLosBultos, sucursalId) {
  return (todosLosBultos || []).filter(
    (b) =>
      Number(b.sucursalId) === Number(sucursalId) &&
      b.estado === ESTADO_EN_RACK
  );
}

/** Bultos ya cargados en el Tortón de esa sucursal. */
export function bultosEnTortonDeSucursal(todosLosBultos, sucursalId) {
  return (todosLosBultos || []).filter(
    (b) =>
      Number(b.sucursalId) === Number(sucursalId) &&
      b.estado === ESTADO_EN_TORTON
  );
}
