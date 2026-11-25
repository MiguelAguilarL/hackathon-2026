/**
 * Simula el login del operario en ESTE CEDIS (prototipo: un solo CEDIS).
 * sucursalId = tienda destino ↔ su rack (1 rack por tienda).
 *
 * Cambiar SUCURSAL_ASIGNADA_ID para probar otro rack/tienda en la demo.
 */
export const SUCURSAL_ASIGNADA_ID = 1;

export const OPERARIO_DEMO = {
  id: "op-embarques-01",
  nombre: "Operario Embarques",
  sucursalId: SUCURSAL_ASIGNADA_ID,
};

/** Id de tienda destino (y su rack) asociado al operario. */
export function sucursalDelOperario() {
  return OPERARIO_DEMO.sucursalId;
}
