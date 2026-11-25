/**
 * Plano del CEDIS: módulos 2×2 (X arriba, 2 racks abajo).
 *
 * Pasillo hacia las 3 puertas: entre racks 14 y 15.
 * Ala izq 1–14 · Pasillo · Ala der 15–32
 *
 * Proximidad (colores):
 * - cerca (verde) → 9–22
 * - media (azul)  → 5–8 y 23–26
 * - lejos (gris)  → 1–4 y 27–32
 */

export const RACKS_CERCA = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
export const RACKS_MEDIA = [5, 6, 7, 8, 23, 24, 25, 26];
export const RACKS_LEJOS = [1, 2, 3, 4, 27, 28, 29, 30, 31, 32];

export const PROXIMIDAD_INFO = {
  cerca: {
    id: "cerca",
    nombre: "Cerca de puertas",
    descripcion: "Racks 9–22. Alta demanda de embarque.",
    racks: RACKS_CERCA,
  },
  media: {
    id: "media",
    nombre: "Medianamente cerca",
    descripcion: "Racks 5–8 y 23–26. Demanda media.",
    racks: RACKS_MEDIA,
  },
  lejos: {
    id: "lejos",
    nombre: "Lejos de puertas",
    descripcion: "Racks 1–4 y 27–32. Baja demanda de embarque.",
    racks: RACKS_LEJOS,
  },
};

export function numeroDeRack(rackAsignado) {
  if (typeof rackAsignado === "number") return rackAsignado;
  const match = String(rackAsignado || "").match(/(\d+)/);
  return match ? Number(match[1]) : null;
}

export function proximidadDeRack(rackAsignado) {
  const n = numeroDeRack(rackAsignado);
  if (n == null) return null;
  if (RACKS_CERCA.includes(n)) return "cerca";
  if (RACKS_MEDIA.includes(n)) return "media";
  if (RACKS_LEJOS.includes(n)) return "lejos";
  return null;
}

export function etiquetaRack(n) {
  return `RACK-${String(n).padStart(2, "0")}`;
}

/**
 * Pares corridos. Pasillo entre 14 y 15 (hacia puertas 1–3).
 */
export function listarModulosDobles() {
  const modulos = [];
  for (let n = 1; n <= 31; n += 2) {
    const ala = n <= 13 ? "izquierda" : "derecha";
    modulos.push({
      id: `${ala}-${n}`,
      ala,
      orden: Math.ceil(n / 2),
      rackA: n,
      rackB: n + 1,
    });
  }
  return modulos;
}
