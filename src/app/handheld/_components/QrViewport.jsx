"use client";

import { useEffect, useRef, useState } from "react";

const ESTADOS_CAMARA = {
  INICIANDO: { texto: "Activando cámara", tono: "text-slate-300" },
  LISTO: { texto: "Sensor activo · Enfoque continuo", tono: "text-slate-300" },
  PAUSA: { texto: "Cámara en pausa", tono: "text-slate-400" },
  PERMISO_DENEGADO: { texto: "Permiso de cámara denegado", tono: "text-red-300" },
  SIN_CAMARA: { texto: "No se encontró una cámara", tono: "text-red-300" },
  HTTPS_REQUERIDO: { texto: "Se requiere HTTPS para la cámara", tono: "text-red-300" },
  ERROR: { texto: "Error de cámara", tono: "text-red-300" },
};

function fallbackCamara(error) {
  if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") return "PERMISO_DENEGADO";
  if (error?.name === "NotFoundError" || error?.name === "DevicesNotFoundError") return "SIN_CAMARA";
  return "ERROR";
}

export default function QrViewport({ activo, onDecode }) {
  const [estadoCamara, setEstadoCamara] = useState("INICIANDO");
  const [detalleError, setDetalleError] = useState("");
  const [mensajeArchivo, setMensajeArchivo] = useState("");
  const [linternaActiva, setLinternaActiva] = useState(false);
  const [linternaDisponible, setLinternaDisponible] = useState(false);
  const scannerRef = useRef(null);
  const archivoRef = useRef(null);
  const onDecodeRef = useRef(onDecode);

  useEffect(() => {
    onDecodeRef.current = onDecode;
  }, [onDecode]);

  useEffect(() => {
    if (!activo) {
      setEstadoCamara("PAUSA");
      return undefined;
    }

    let cancelado = false;
    let scanner = null;

    const iniciar = async () => {
      if (typeof window !== "undefined" && !window.isSecureContext) {
        setEstadoCamara("HTTPS_REQUERIDO");
        return;
      }

      setEstadoCamara("INICIANDO");
      setDetalleError("");

      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelado) return;

        scanner = new Html5Qrcode("qr-reader", { verbose: false });
        scannerRef.current = scanner;

        const iniciarCon = (configuracion) =>
          scanner.start(
            configuracion,
            { fps: 12 },
            (texto) => onDecodeRef.current?.(texto),
            () => {}
          );

        let configuracion = { facingMode: "environment" };
        try {
          const camaras = await Html5Qrcode.getCameras();
          if (!cancelado && camaras?.length) {
            const trasera = camaras.find((camara) => /back|rear|environment/i.test(camara.label || ""));
            configuracion = { deviceId: { exact: (trasera || camaras[0]).id } };
          }
        } catch {
          // Algunos navegadores solo exponen la cámara vía constraints genéricos.
        }

        if (cancelado) return;

        try {
          await iniciarCon(configuracion);
        } catch (error) {
          if (!configuracion.deviceId) throw error;
          await iniciarCon({ facingMode: "environment" });
        }

        if (cancelado) {
          try {
            await scanner.stop();
          } catch {
            // El escáner aún no estaba escaneando; no hay track que detener.
          }
          try {
            scanner.clear();
          } catch {
            // El visor ya fue desmontado.
          }
          return;
        }
        setEstadoCamara("LISTO");

        try {
          const capacidades = scanner.getRunningTrackCameraCapabilities?.();
          const feature = capacidades?.torchFeature?.();
          setLinternaDisponible(Boolean(feature?.isSupported?.()));
        } catch {
          setLinternaDisponible(false);
        }
      } catch (error) {
        if (cancelado) return;
        setEstadoCamara(fallbackCamara(error));
        setDetalleError(error?.message || "");
      }
    };

    iniciar();

    return () => {
      cancelado = true;
      const actual = scannerRef.current;
      scannerRef.current = null;
      setLinternaActiva(false);
      setLinternaDisponible(false);
      if (actual) {
        Promise.resolve(actual.stop())
          .catch(() => {})
          .finally(() => {
            try {
              actual.clear();
            } catch {
              // El visor ya fue desmontado; no hay nada que limpiar.
            }
          });
      }
    };
  }, [activo]);

  const alternarLinterna = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      const siguiente = !linternaActiva;
      await scanner.applyVideoConstraints({ advanced: [{ torch: siguiente }] });
      setLinternaActiva(siguiente);
    } catch {
      setLinternaDisponible(false);
    }
  };

  const leerImagen = async (evento) => {
    const archivo = evento.target.files?.[0];
    if (!archivo) return;
    setMensajeArchivo("");
    let lector = null;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      lector = new Html5Qrcode("qr-file-reader", { verbose: false });
      const texto = await lector.scanFile(archivo, false);
      onDecodeRef.current?.(texto);
    } catch {
      setMensajeArchivo("No se encontró un QR legible en esa imagen.");
    } finally {
      if (lector) {
        try {
          lector.clear();
        } catch {
          // El lector temporal ya liberó el nodo.
        }
      }
      evento.target.value = "";
    }
  };

  const info = ESTADOS_CAMARA[estadoCamara] || ESTADOS_CAMARA.ERROR;
  const tieneError = !["INICIANDO", "LISTO", "PAUSA"].includes(estadoCamara);

  return (
    <section
      className="relative min-h-[230px] sm:min-h-[280px] md:min-h-0 md:h-full md:col-start-1 md:row-start-2 flex-1 bg-slate-950 overflow-hidden"
      aria-label="Visor de código QR"
    >
      <style>{`
        @keyframes qr-scan { 0% { top: 12%; opacity: .7; } 50% { top: 86%; opacity: 1; } 100% { top: 12%; opacity: .7; } }
        .qr-scan-line { animation: qr-scan 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .qr-scan-line { animation: none; top: 50%; } }
      `}</style>

      <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

      <div id="qr-reader" className="absolute inset-0 [&>video]:h-full [&>video]:w-full [&>video]:object-cover" />
      <div id="qr-file-reader" className="hidden" aria-hidden="true" />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
        <div className={`relative w-56 h-56 md:w-80 md:h-80 ${estadoCamara === "LISTO" ? "" : "opacity-40"}`}>
          <div className="absolute -top-px -left-px w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute -top-px -right-px w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute -bottom-px -left-px w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute -bottom-px -right-px w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg" />
          {estadoCamara === "LISTO" && (
            <div className="qr-scan-line absolute left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_14px_#ef4444]" />
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 top-3 flex justify-end px-4 pointer-events-none">
        <button
          type="button"
          onClick={alternarLinterna}
          disabled={!linternaDisponible || estadoCamara !== "LISTO"}
          aria-label={linternaDisponible ? "Apagar linterna" : "Linterna no disponible en este equipo"}
          className={`pointer-events-auto min-h-[44px] min-w-[44px] rounded-full grid place-items-center ring-1 transition-colors ${
            linternaActiva
              ? "bg-amber-400 text-slate-900 ring-amber-300"
              : "bg-slate-800/90 text-white ring-slate-600 hover:bg-slate-700"
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
            <path
              d="M9.75 3.1v5.7a2.25 2.25 0 0 1-.66 1.59L5 14.5m9.25-11.4v5.7a2.25 2.25 0 0 0 .66 1.59L19 14.5M6 14.5h12v4.25A2.25 2.25 0 0 1 15.75 21h-7.5A2.25 2.25 0 0 1 6 18.75V14.5Z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-5 pb-4 flex flex-col items-center gap-1.5 text-center">
        <button
          type="button"
          onClick={() => archivoRef.current?.click()}
          className="min-h-[44px] rounded-full bg-slate-800/90 px-4 text-[11px] font-bold text-white ring-1 ring-slate-600 hover:bg-slate-700"
        >
          Leer QR desde imagen
        </button>
        <input ref={archivoRef} type="file" accept="image/*" className="hidden" onChange={leerImagen} />
        {mensajeArchivo && (
          <p className="text-[11px] font-bold text-amber-300 max-w-[320px]">{mensajeArchivo}</p>
        )}
        <p className={`text-xs font-mono font-bold tracking-tight bg-slate-900/85 px-3 py-1.5 rounded-full ring-1 ring-slate-700 ${info.tono}`}>
          {info.texto}
        </p>
        {tieneError ? (
          <>
            {detalleError && (
              <p className="text-[11px] font-medium text-slate-300 max-w-[300px]">{detalleError}</p>
            )}
            <p className="text-[11px] font-bold text-slate-200 max-w-[320px]">
              Sube una imagen del QR, usa la pistola láser o pega su contenido para continuar.
            </p>
          </>
        ) : (
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Apunta a cualquier código QR</p>
        )}
      </div>
    </section>
  );
}
