import crypto from "crypto";

export const COOKIE_NAME = "cedis_proveedor_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "cedis-catlovers-secret-key-2026-wms";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas

export function createSessionToken(proveedor) {
  const payload = {
    idProveedor: proveedor.idProveedor,
    nombre: proveedor.nombre,
    correo: proveedor.correo,
    exp: Date.now() + SESSION_DURATION_MS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  try {
    const [payloadBase64, signature] = token.split(".");
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSig);

    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8"));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    return {
      idProveedor: payload.idProveedor,
      nombre: payload.nombre,
      correo: payload.correo,
    };
  } catch {
    return null;
  }
}
