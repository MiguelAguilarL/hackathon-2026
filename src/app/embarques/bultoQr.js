/** Interpreta el QR (JSON de etiqueta) o el idBulto en texto plano. */
export function interpretarEntradaBulto(texto) {
  const raw = String(texto || "").trim();
  if (!raw) return { tipo: "vacio" };

  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && obj.idBulto) {
      return { tipo: "idBulto", idBulto: String(obj.idBulto).trim() };
    }
  } catch {
    // texto plano = id del bulto
  }

  return { tipo: "idBulto", idBulto: raw };
}
