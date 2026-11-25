

// --- Geometría del rack ---
export const RACK_NIVELES = 4;
export const RACK_COLUMNAS = 8;
export const RACK_MAX_TARIMAS = RACK_NIVELES * RACK_COLUMNAS; // 32

// --- Tarima (README) ---
export const TARIMA_LARGO_M = 1.12;
export const TARIMA_ANCHO_M = 1.15;
export const TARIMA_ALTURA_TOTAL_MAX_M = 1.85; // incluye la tarima
export const TARIMA_ALTURA_BASE_M = 0.2; // acuerdo del equipo: base de 20 cm
export const TARIMA_ALTURA_UTIL_M = TARIMA_ALTURA_TOTAL_MAX_M - TARIMA_ALTURA_BASE_M; // 1.65 m
export const TARIMA_PESO_MAX_KG = 1000;

/** Volumen útil aproximado por posición de tarima (m³). */
export const TARIMA_VOLUMEN_UTIL_M3 =
  TARIMA_LARGO_M * TARIMA_ANCHO_M * TARIMA_ALTURA_UTIL_M;

// --- Zonas DENTRO de un rack (columnas hacia el pasillo local) ---
// La cercanía a las 3 puertas del CEDIS está en cedisLayout.js (9–22 cerca, etc.).
// Columna 1 = más cerca del pasillo/salida local; 8 = fondo del rack.
export const ZONA_A_COLUMNAS = [1, 2, 3]; // alta demanda de salida
export const ZONA_B_COLUMNAS = [4, 5, 6]; // demanda media
export const ZONA_C_COLUMNAS = [7, 8]; // baja demanda de salida

export const ZONA_INFO = {
  A: {
    id: "A",
    nombre: "Salida",
    descripcion: "Cerca del andén: artículos con más demanda de embarque",
    columnas: ZONA_A_COLUMNAS,
  },
  B: {
    id: "B",
    nombre: "Media",
    descripcion: "Zona intermedia: demanda de salida normal",
    columnas: ZONA_B_COLUMNAS,
  },
  C: {
    id: "C",
    nombre: "Fondo",
    descripcion: "Más lejos del andén: artículos que salen poco",
    columnas: ZONA_C_COLUMNAS,
  },
};

/** Devuelve "A" | "B" | "C" según la columna (1–8). */
export function zonaPorColumna(columna) {
  if (ZONA_A_COLUMNAS.includes(columna)) return "A";
  if (ZONA_B_COLUMNAS.includes(columna)) return "B";
  if (ZONA_C_COLUMNAS.includes(columna)) return "C";
  return null;
}

/**
 * Lista las 32 posiciones del rack.
 * nivel 1 = piso (abajo); nivel 4 = más alto.
 * columna 1 = más cerca de la salida.
 */
export function listarPosicionesRack() {
  const posiciones = [];
  for (let nivel = 1; nivel <= RACK_NIVELES; nivel += 1) {
    for (let columna = 1; columna <= RACK_COLUMNAS; columna += 1) {
      posiciones.push({
        nivel,
        columna,
        zona: zonaPorColumna(columna),
        etiqueta: `N${nivel}-C${columna}`,
      });
    }
  }
  return posiciones;
}
