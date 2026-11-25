"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Los 7 campos que genera la hoja de etiquetas QR del portal de proveedores.
export const CAMPOS_ETIQUETA = [
  "idBulto",
  "idOc",
  "folioFactura",
  "proveedor",
  "sucursalId",
  "sku",
  "piezas",
];

const CAMPOS_REQUERIDOS = ["idBulto", "idOc", "sku", "piezas", "sucursalId"];

// Conserva literalmente los campos que traiga el QR, incluso si la etiqueta está incompleta,
// para que el operador pueda ver en pantalla todo lo que se leyó.
export function extraerCampos(payload) {
  const campos = {};
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return campos;

  for (const campo of CAMPOS_ETIQUETA) {
    const valor = payload[campo];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      campos[campo] = valor;
    }
  }
  return campos;
}

export function normalizarPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { valido: false, error: "El QR no contiene un objeto JSON de etiqueta CEDIS." };
  }

  const faltante = CAMPOS_REQUERIDOS.find((campo) => {
    const valor = payload[campo];
    return valor === undefined || valor === null || String(valor).trim() === "";
  });

  if (faltante) {
    return {
      valido: false,
      error: `Falta el campo "${faltante}" en el QR.`,
      campos: extraerCampos(payload),
    };
  }

  const piezas = Number(payload.piezas);
  const sucursalId = Number(payload.sucursalId);

  if (!Number.isFinite(piezas) || piezas <= 0) {
    return {
      valido: false,
      error: 'El campo "piezas" del QR no es un número válido.',
      campos: extraerCampos(payload),
    };
  }

  if (!Number.isInteger(sucursalId) || sucursalId <= 0) {
    return {
      valido: false,
      error: 'El campo "sucursalId" del QR no es válido.',
      campos: extraerCampos(payload),
    };
  }

  return {
    valido: true,
    campos: extraerCampos(payload),
    payload: {
      idBulto: String(payload.idBulto).trim(),
      idOc: String(payload.idOc).trim(),
      folioFactura: payload.folioFactura ? String(payload.folioFactura).trim() : undefined,
      proveedor: payload.proveedor ? String(payload.proveedor).trim() : undefined,
      sucursalId,
      sku: String(payload.sku).trim(),
      piezas,
    },
  };
}

export function useHandheldScan() {
  const [data, setData] = useState(null);
  const [estado, setEstado] = useState("IDLE");
  const [resultado, setResultado] = useState(null);
  const [payload, setPayload] = useState(null);
  const [contenidoQR, setContenidoQR] = useState(null);
  const [reporteFaltantes, setReporteFaltantes] = useState(null);
  const [errorCarga, setErrorCarga] = useState(null);
  const ultimoEscaneo = useRef({ idBulto: null, timestamp: 0 });
  const procesandoRef = useRef(false);
  const dataRef = useRef(null);
  const contenidoRef = useRef(null);

  const cargarDatos = useCallback(async () => {
    try {
      const res = await fetch("/api/cedis");
      if (!res.ok) throw new Error(`Error ${res.status} al cargar el estado del CEDIS.`);
      const json = await res.json();
      dataRef.current = json;
      setData(json);
      setErrorCarga(null);
    } catch (error) {
      setErrorCarga(error.message);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const procesarPayloadQR = useCallback(
    async (payloadObj) => {
      if (procesandoRef.current) return;

      const normalizado = normalizarPayload(payloadObj);

      if (!normalizado.valido) {
        setPayload(null);
        setResultado({
          contenido: contenidoRef.current,
          esGenerico: true,
          motivo: normalizado.error,
          campos: normalizado.campos,
        });
        setEstado("LEIDO");
        return;
      }

      const { payload: valido } = normalizado;
      const ahora = Date.now();
      const esDuplicado =
        ultimoEscaneo.current.idBulto === valido.idBulto &&
        ahora - ultimoEscaneo.current.timestamp < 2000;
      const yaEnRack = dataRef.current?.bultos?.some(
        (bulto) => bulto.idBulto === valido.idBulto && bulto.estado === "EN_RACK"
      );

      if (esDuplicado || yaEnRack) {
        setPayload(valido);
        setResultado({
          ok: true,
          rechazado: false,
          mensaje: `El bulto ${valido.idBulto} ya fue validado y está ubicado en rack. No es necesario escanearlo de nuevo.`,
        });
        setEstado("OK");
        return;
      }

      procesandoRef.current = true;
      ultimoEscaneo.current = { idBulto: valido.idBulto, timestamp: ahora };
      setPayload(valido);
      setResultado(null);
      setEstado("VALIDANDO");

      try {
        const res = await fetch("/api/cedis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "ESCANEAR_BULTO", ...valido }),
        });
        const json = await res.json();

        if (!res.ok && !json.rechazado) {
          setResultado({
            ok: false,
            rechazado: true,
            motivo: json.error || `El servidor respondió con error ${res.status}.`,
            local: true,
          });
          setEstado("RECHAZADO");
          return;
        }

        setResultado(json);
        setEstado(json.ok ? "OK" : "RECHAZADO");
        await cargarDatos();
      } catch (error) {
        setResultado({
          ok: false,
          rechazado: true,
          motivo: `No se pudo validar en el servidor: ${error.message}. Revisa la conexión y vuelve a escanear.`,
          local: true,
        });
        setEstado("RECHAZADO");
      } finally {
        procesandoRef.current = false;
      }
    },
    [cargarDatos]
  );

  const procesarTextoQR = useCallback(
    (texto) => {
      contenidoRef.current = texto;
      setContenidoQR(texto);
      try {
        procesarPayloadQR(JSON.parse(texto));
      } catch {
        setPayload(null);
        setResultado({ contenido: texto, esGenerico: true });
        setEstado("LEIDO");
      }
    },
    [procesarPayloadQR]
  );

  const reiniciar = useCallback(() => {
    setEstado("IDLE");
    setResultado(null);
    setPayload(null);
    setContenidoQR(null);
  }, []);

  const verificarFaltantesFactura = useCallback((cita) => {
    if (!cita) return;
    setReporteFaltantes({ folioFactura: cita.folioFactura, idOc: cita.idOc });
  }, []);

  const cerrarReporte = useCallback(() => setReporteFaltantes(null), []);

  return {
    data,
    estado,
    resultado,
    payload,
    contenidoQR,
    reporteFaltantes,
    errorCarga,
    procesarPayloadQR,
    procesarTextoQR,
    reiniciar,
    verificarFaltantesFactura,
    cerrarReporte,
    cargarDatos,
  };
}
