/**
 * Calculadora de acomodo en tarima (sin React).
 * Usa las reglas de rackRules.js.
 */

import {
  TARIMA_PESO_MAX_KG,
  TARIMA_VOLUMEN_UTIL_M3,
  TARIMA_ALTURA_UTIL_M,
  TARIMA_ALTURA_BASE_M,
  RACK_NIVELES,
  RACK_COLUMNAS,
  ZONA_A_COLUMNAS,
  ZONA_B_COLUMNAS,
  ZONA_C_COLUMNAS,
  zonaPorColumna,
} from "./rackRules";
import { proximidadDeRack, PROXIMIDAD_INFO } from "./cedisLayout";

function sumar(bultos, campo) {
  return bultos.reduce((acc, b) => acc + (b[campo] || 0), 0);
}

/**
 * ¿Caben estos bultos en un slot que ya tiene otros?
 * @returns {{ ok: boolean, motivo?: string, resumen?: object }}
 */
export function evaluarAcomodoEnSlot({ bultosAAcomodar, bultosYaEnSlot }) {
  const pesoActual = sumar(bultosYaEnSlot, "pesoKg");
  const volActual = sumar(bultosYaEnSlot, "volumenM3");
  const altoActual = sumar(bultosYaEnSlot, "altoM");

  const pesoNuevo = sumar(bultosAAcomodar, "pesoKg");
  const volNuevo = sumar(bultosAAcomodar, "volumenM3");
  const altoNuevo = sumar(bultosAAcomodar, "altoM");

  const pesoTotal = pesoActual + pesoNuevo;
  const volTotal = volActual + volNuevo;
  const altoTotal = altoActual + altoNuevo;

  if (pesoTotal > TARIMA_PESO_MAX_KG) {
    return {
      ok: false,
      motivo: `No cabe por peso: ${pesoTotal.toFixed(1)} kg > ${TARIMA_PESO_MAX_KG} kg máx por tarima.`,
    };
  }
  if (volTotal > TARIMA_VOLUMEN_UTIL_M3) {
    return {
      ok: false,
      motivo: `No cabe por volumen: ${volTotal.toFixed(2)} m³ > ${TARIMA_VOLUMEN_UTIL_M3.toFixed(2)} m³ útiles.`,
    };
  }
  if (altoTotal > TARIMA_ALTURA_UTIL_M) {
    return {
      ok: false,
      motivo: `No cabe por altura: ${altoTotal.toFixed(2)} m > ${TARIMA_ALTURA_UTIL_M} m útiles (base tarima ${TARIMA_ALTURA_BASE_M} m).`,
    };
  }

  return {
    ok: true,
    resumen: {
      pesoTotalKg: pesoTotal,
      volumenTotalM3: volTotal,
      altoTotalM: altoTotal,
      pesoLibreKg: TARIMA_PESO_MAX_KG - pesoTotal,
      volumenLibreM3: TARIMA_VOLUMEN_UTIL_M3 - volTotal,
    },
  };
}

/**
 * Según demanda, zona DENTRO del rack (columnas hacia el pasillo/salida local).
 * alta → A, media → B, baja → C.
 */
export function zonaPorDemanda(demandaEmbarque = "media") {
  if (demandaEmbarque === "alta") return "A";
  if (demandaEmbarque === "baja") return "C";
  return "B";
}

/**
 * Según demanda, qué proximidad de RACK conviene respecto a las 3 puertas.
 * alta → cerca (9–22), media → media (5–8 y 23–26), baja → lejos (1–4 y 27–32).
 * Solo es sugerencia; el operario puede ignorarla.
 */
export function proximidadPorDemanda(demandaEmbarque = "media") {
  if (demandaEmbarque === "alta") return "cerca";
  if (demandaEmbarque === "baja") return "lejos";
  return "media";
}

/** Columnas preferidas para una zona A/B/C. */
export function columnasDeZona(zona) {
  if (zona === "A") return ZONA_A_COLUMNAS;
  if (zona === "C") return ZONA_C_COLUMNAS;
  return ZONA_B_COLUMNAS;
}

function ordenColumnasPreferidas(zonaPref) {
  const preferidas = columnasDeZona(zonaPref);
  const resto = [];
  for (let c = 1; c <= RACK_COLUMNAS; c += 1) {
    if (!preferidas.includes(c)) resto.push(c);
  }
  return [...preferidas, ...resto];
}

/**
 * Sugiere una tarima (nivel+columna) DENTRO del rack actual.
 * Prioriza zona por demanda, pero no obliga.
 */
export function sugerirTarimaEnRack({ bultosAAcomodar, bultosEnRack }) {
  const demanda = bultosAAcomodar[0]?.demandaEmbarque || "media";
  const zonaPref = zonaPorDemanda(demanda);
  const columnas = ordenColumnasPreferidas(zonaPref);

  for (const columna of columnas) {
    for (let nivel = 1; nivel <= RACK_NIVELES; nivel += 1) {
      const bultosYaEnSlot = (bultosEnRack || []).filter(
        (b) =>
          b.nivel === nivel &&
          b.columna === columna &&
          !bultosAAcomodar.some((x) => x.idBulto === b.idBulto)
      );
      const evaluacion = evaluarAcomodoEnSlot({ bultosAAcomodar, bultosYaEnSlot });
      if (evaluacion.ok) {
        return {
          ok: true,
          nivel,
          columna,
          zona: zonaPorColumna(columna),
          demanda,
          resumen: evaluacion.resumen,
          mensaje: `Sugerido N${nivel}-C${columna} (zona ${zonaPorColumna(columna)}, demanda ${demanda}). Es opcional.`,
        };
      }
    }
  }

  return {
    ok: false,
    motivo: "No hay tarima libre con capacidad suficiente en este rack.",
  };
}

/**
 * Aviso suave si el rack actual no coincide con la proximidad ideal.
 * Nunca bloquea el acomodo.
 */
export function notaProximidadOpcional(demandaEmbarque, rackAsignado) {
  const ideal = proximidadPorDemanda(demandaEmbarque || "media");
  const actual = proximidadDeRack(rackAsignado);
  if (!actual || ideal === actual) return null;
  return `Sugerencia opcional: por demanda "${demandaEmbarque || "media"}" conviene un rack ${PROXIMIDAD_INFO[ideal].nombre.toLowerCase()}. Puedes guardar aquí igual.`;
}
