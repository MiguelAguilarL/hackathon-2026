import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Constantes oficiales de reglas de negocio del CEDIS
export const CEDIS_RULES = {
  TORTON_MAX_TARIMAS: 12,
  TORTON_MAX_PESO_KG: 12000, // 12 toneladas máximo
  TORTON_MIN_PESO_90_KG: 10800, // 90% de 12,000 kg
  TARIMA_VOLUMEN_MAX_M3: 1.12 * 1.15 * 1.85, // 2.3828 m3 por tarima
  TORTON_MAX_VOLUMEN_M3: 12 * (1.12 * 1.15 * 1.85), // 28.5936 m3
  TORTON_MIN_VOLUMEN_90_M3: 0.9 * 12 * (1.12 * 1.15 * 1.85), // 25.7342 m3
  RACK_MAX_TARIMAS: 32, // 4 niveles x 8 tarimas
  ANDENES_RECIBO: [1, 2, 3, 4],
  ANDENES_EMBARQUE: [1, 2, 3],
  HORARIO_INICIO: 8,
  HORARIO_FIN: 18,
};
