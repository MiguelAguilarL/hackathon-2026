const SESSION_SECRET = process.env.SESSION_SECRET || "cedis-catlovers-secret-key-2026-wms";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas

export const COOKIE_NAME = "cedis_session";

function aBase64Url(texto) {
  const bytes = new TextEncoder().encode(texto);
  let binario = "";
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function bytesDesdeBase64Url(valor) {
  const base64 = valor.replace(/-/g, "+").replace(/_/g, "/");
  const binario = atob(base64);
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0));
}

function textoDesdeBase64Url(valor) {
  return new TextDecoder().decode(bytesDesdeBase64Url(valor));
}

async function claveHmac() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(usuario) {
  const payload = { ...usuario, exp: Date.now() + SESSION_DURATION_MS };
  const payloadBase64 = aBase64Url(JSON.stringify(payload));
  const clave = await claveHmac();
  const firma = await crypto.subtle.sign(
    "HMAC",
    clave,
    new TextEncoder().encode(payloadBase64)
  );

  let binario = "";
  for (const byte of new Uint8Array(firma)) binario += String.fromCharCode(byte);
  const firmaBase64 = btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  return `${payloadBase64}.${firmaBase64}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  try {
    const [payloadBase64, firmaBase64] = token.split(".");
    const clave = await claveHmac();
    const firmaValida = await crypto.subtle.verify(
      "HMAC",
      clave,
      bytesDesdeBase64Url(firmaBase64),
      new TextEncoder().encode(payloadBase64)
    );

    if (!firmaValida) return null;

    const payload = JSON.parse(textoDesdeBase64Url(payloadBase64));
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    const { exp, ...usuario } = payload;
    return usuario;
  } catch {
    return null;
  }
}
