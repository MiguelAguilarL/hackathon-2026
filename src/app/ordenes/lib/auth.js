import crypto from "crypto";

export const COOKIE_NAME = "cedis_empresa_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "cedis-catlovers-secret-key-2026-wms";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12 horas

// Cuentas demo de personal interno de Catlovers (Compras / CEDIS / Almacén).
// No son cuentas de proveedor: el portal de Órdenes es de uso corporativo.
export const EMPLEADOS_DEMO = [
  {
    idEmpleado: "EMP-COMP-01",
    nombre: "Laura Méndez Ríos",
    correo: "compras@catlovers.mx",
    password: "Compras2026*",
    area: "Compras",
    puesto: "Compradora de Papelería",
  },
  {
    idEmpleado: "EMP-CEDIS-02",
    nombre: "Diego Salazar Nava",
    correo: "cedis@catlovers.mx",
    password: "Cedis2026*",
    area: "CEDIS",
    puesto: "Coordinador de Almacén",
  },
  {
    idEmpleado: "EMP-ALM-03",
    nombre: "Mariana Ortega Paz",
    correo: "almacen@catlovers.mx",
    password: "Almacen2026*",
    area: "Almacén",
    puesto: "Jefa de Recepción",
  },
];

export function buscarEmpleado(correo, password) {
  const correoLimpio = (correo || "").trim().toLowerCase();
  const empleado = EMPLEADOS_DEMO.find((e) => e.correo === correoLimpio);
  if (!empleado || empleado.password !== password) {
    return null;
  }

  const { password: _password, ...datosPublicos } = empleado;
  return datosPublicos;
}

export function createSessionToken(empleado) {
  const payload = {
    idEmpleado: empleado.idEmpleado,
    nombre: empleado.nombre,
    correo: empleado.correo,
    area: empleado.area,
    puesto: empleado.puesto,
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
      idEmpleado: payload.idEmpleado,
      nombre: payload.nombre,
      correo: payload.correo,
      area: payload.area,
      puesto: payload.puesto,
    };
  } catch {
    return null;
  }
}
