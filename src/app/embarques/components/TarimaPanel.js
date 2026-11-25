"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { TARIMA_PESO_MAX_KG, TARIMA_VOLUMEN_UTIL_M3 } from "../rackRules";
import { evaluarAcomodoEnSlot, sugerirTarimaEnRack } from "../rackCapacity";

function sumar(bultos, campo) {
  return bultos.reduce((acc, b) => acc + (Number(b[campo]) || 0), 0);
}

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

function BarraUso({ pct, ok }) {
  const ancho = Math.min(100, Math.max(0, pct));
  const color =
    pct >= 100 ? "bg-red-500" : pct >= 85 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden" title={ok ? undefined : "Sobre capacidad"}>
      <div className={`h-full ${color} transition-all`} style={{ width: `${ancho}%` }} />
    </div>
  );
}

/**
 * Panel bajo el rack: ocupación de la tarima + escanear / pegar id QR + guardar.
 */
export default function TarimaPanel({
  nivel,
  columna,
  bultosEnSlot = [],
  bultosEnRack = [],
  bultosCandidatos = [],
  todosLosBultos = [],
  sucursales = [],
  sucursalId,
  onAcomodar,
  ocupado = false,
  onCerrar,
}) {
  const [modoScan, setModoScan] = useState(false);
  const [qrPegado, setQrPegado] = useState("");
  const [bulto, setBulto] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [errorCamara, setErrorCamara] = useState("");
  const scannerRef = useRef(null);
  const ultimoQrRef = useRef("");
  const candidatosRef = useRef(bultosCandidatos);
  const todosRef = useRef(todosLosBultos);
  const sucursalesRef = useRef(sucursales);
  candidatosRef.current = bultosCandidatos;
  todosRef.current = todosLosBultos;
  sucursalesRef.current = sucursales;

  const ocupacion = useMemo(() => {
    const pesoUsado = sumar(bultosEnSlot, "pesoKg");
    const volUsado = sumar(bultosEnSlot, "volumenM3");
    return {
      pesoUsado,
      pesoLibre: Math.max(0, TARIMA_PESO_MAX_KG - pesoUsado),
      volUsado,
      volLibre: Math.max(0, TARIMA_VOLUMEN_UTIL_M3 - volUsado),
      pctPeso: (pesoUsado / TARIMA_PESO_MAX_KG) * 100,
      pctVol: (volUsado / TARIMA_VOLUMEN_UTIL_M3) * 100,
    };
  }, [bultosEnSlot]);

  const evaluacion = useMemo(() => {
    if (!bulto) return null;
    const yaEnSlot = bultosEnSlot.filter((b) => b.idBulto !== bulto.idBulto);
    return evaluarAcomodoEnSlot({
      bultosAAcomodar: [bulto],
      bultosYaEnSlot: yaEnSlot,
    });
  }, [bulto, bultosEnSlot]);

  const sugerenciaTarima = useMemo(() => {
    if (!bulto || evaluacion?.ok) return null;
    return sugerirTarimaEnRack({
      bultosAAcomodar: [bulto],
      bultosEnRack,
    });
  }, [bulto, evaluacion, bultosEnRack]);

  const yaEstaEnEstaTarima =
    bulto &&
    bultosEnSlot.some((b) => b.idBulto === bulto.idBulto);

  const puedeGuardar =
    Boolean(bulto) &&
    evaluacion?.ok &&
    !yaEstaEnEstaTarima &&
    !ocupado;

  const mensajeNoCabe = useMemo(() => {
    if (!bulto || evaluacion?.ok || yaEstaEnEstaTarima) return null;
    const motivo = evaluacion?.motivo || "sin capacidad.";
    if (sugerenciaTarima?.ok) {
      const misma =
        sugerenciaTarima.nivel === nivel && sugerenciaTarima.columna === columna;
      if (!misma) {
        return `No cabe aquí: ${motivo} Prueba N${sugerenciaTarima.nivel}-C${sugerenciaTarima.columna} (hay espacio).`;
      }
    }
    if (sugerenciaTarima && !sugerenciaTarima.ok) {
      return `No cabe aquí: ${motivo} ${sugerenciaTarima.motivo}`;
    }
    return `No cabe aquí: ${motivo}`;
  }, [bulto, evaluacion, sugerenciaTarima, yaEstaEnEstaTarima, nivel, columna]);

  const resolverBulto = (entrada) => {
    setMensaje(null);
    const parsed = interpretarEntradaBulto(entrada);
    const lista = candidatosRef.current || [];

    if (!parsed || parsed.tipo === "vacio" || !parsed.idBulto) {
      setBulto(null);
      setMensaje({ tipo: "error", texto: "Escanea o pega el id del QR del bulto." });
      return;
    }

    const encontrado = lista.find((b) => b.idBulto === parsed.idBulto);
    if (!encontrado) {
      setBulto(null);
      const enOtra = (todosRef.current || []).find((b) => b.idBulto === parsed.idBulto);
      if (enOtra) {
        if (enOtra.estado === "EMBARCADO" || enOtra.estado === "RECHAZADO") {
          setMensaje({
            tipo: "error",
            texto: `El bulto ${enOtra.idBulto} está ${enOtra.estado} y no se puede acomodar.`,
          });
          return;
        }
        const dest =
          (sucursalesRef.current || []).find(
            (s) => Number(s.id) === Number(enOtra.sucursalId)
          ) || enOtra.sucursal;
        const rack = dest?.rackAsignado || `sucursal ${enOtra.sucursalId}`;
        const nombre = dest?.nombre ? ` · ${dest.nombre}` : "";
        setMensaje({
          tipo: "error",
          texto: `Este bulto no es de este rack. Le corresponde ${rack}${nombre}. Ábrelo ahí.`,
        });
        return;
      }
      setMensaje({
        tipo: "error",
        texto: `No existe el bulto ${parsed.idBulto} en la base de datos de este CEDIS.`,
      });
      return;
    }

    setBulto(encontrado);
    setMensaje({
      tipo: "ok",
      texto: `Bulto ${encontrado.idBulto} leído. Revisa peso y espacio abajo.`,
    });
  };

  const resolverRef = useRef(resolverBulto);
  resolverRef.current = resolverBulto;

  // Cámara QR
  useEffect(() => {
    if (!modoScan) {
      const stop = async () => {
        const sc = scannerRef.current;
        scannerRef.current = null;
        if (!sc) return;
        try {
          if (sc.isScanning) await sc.stop();
        } catch {
          /* ignore */
        }
        try {
          sc.clear();
        } catch {
          /* ignore */
        }
      };
      stop();
      return undefined;
    }

    let cancelado = false;
    ultimoQrRef.current = "";

    const iniciar = async () => {
      setErrorCamara("");
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelado) return;
        const scanner = new Html5Qrcode("tarima-qr-reader", { verbose: false });
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (texto) => {
            if (texto === ultimoQrRef.current) return;
            ultimoQrRef.current = texto;
            resolverRef.current(texto);
            setModoScan(false);
          },
          () => {}
        );
      } catch (err) {
        setErrorCamara(
          err?.message ||
            "No se pudo abrir la cámara. Pega el id del QR abajo."
        );
      }
    };

    iniciar();

    return () => {
      cancelado = true;
      const sc = scannerRef.current;
      scannerRef.current = null;
      if (sc) {
        sc.stop().catch(() => {}).finally(() => {
          try {
            sc.clear();
          } catch {
            /* ignore */
          }
        });
      }
    };
  }, [modoScan]);

  // Al cambiar de celda, limpia lectura
  useEffect(() => {
    setBulto(null);
    setMensaje(null);
    setQrPegado("");
    setModoScan(false);
  }, [nivel, columna]);

  const guardar = async () => {
    if (!puedeGuardar || !bulto) return;
    setMensaje(null);
    const result = await onAcomodar({
      sucursalId,
      nivel,
      columna,
      idBultos: [bulto.idBulto],
    });
    if (result?.ok) {
      setBulto(null);
      setQrPegado("");
      setMensaje({
        tipo: "ok",
        texto: result.mensaje || `Bulto acomodado en N${nivel}-C${columna}.`,
      });
    } else {
      setMensaje({
        tipo: "error",
        texto: result?.error || "No se pudo guardar el acomodo.",
      });
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold text-slate-800">
            Tarima N{nivel}-C{columna}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {bultosEnSlot.length === 0
              ? "Sin bultos aún"
              : `${bultosEnSlot.length} bulto(s) en esta posición`}
          </p>
        </div>
        {onCerrar && (
          <button
            type="button"
            onClick={onCerrar}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Ocupación actual */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-md border border-slate-100 bg-slate-50 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
            Espacio (volumen)
          </p>
          <p className="text-lg font-bold tabular-nums text-slate-900">
            {ocupacion.volUsado.toFixed(2)}
            <span className="text-sm font-medium text-slate-500">
              {" "}
              / {TARIMA_VOLUMEN_UTIL_M3.toFixed(2)} m³
            </span>
          </p>
          <BarraUso pct={ocupacion.pctVol} ok={ocupacion.pctVol <= 100} />
          <p className="text-xs text-slate-600 tabular-nums">
            Libre: {ocupacion.volLibre.toFixed(2)} m³
          </p>
        </div>

        <div className="rounded-md border border-slate-100 bg-slate-50 p-3 space-y-2">
          <p className="text-[10px] uppercase tracking-wide font-semibold text-slate-500">
            Peso
          </p>
          <p className="text-lg font-bold tabular-nums text-slate-900">
            {ocupacion.pesoUsado.toFixed(1)}
            <span className="text-sm font-medium text-slate-500">
              {" "}
              / {TARIMA_PESO_MAX_KG} kg
            </span>
          </p>
          <BarraUso pct={ocupacion.pctPeso} ok={ocupacion.pctPeso <= 100} />
          <p className="text-xs text-slate-600 tabular-nums">
            Libre: {ocupacion.pesoLibre.toFixed(1)} kg
          </p>
        </div>
      </div>

      {bultosEnSlot.length > 0 && (
        <ul className="text-xs text-slate-600 space-y-1 border-t border-slate-100 pt-3">
          {bultosEnSlot.map((b) => (
            <li key={b.idBulto} className="flex flex-wrap gap-x-3">
              <span className="font-mono font-semibold text-slate-800">{b.idBulto}</span>
              <span>{b.sku}</span>
              <span className="tabular-nums">
                {b.pesoKg} kg · {b.volumenM3} m³
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Entrada: solo id del QR */}
      <div className="border-t border-slate-100 pt-3 space-y-3">
        <p className="text-xs font-semibold text-slate-700">Agregar bulto a esta tarima</p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModoScan((v) => !v)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border ${
              modoScan
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-800 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {modoScan ? "Cerrar cámara" : "Escanear QR"}
          </button>
        </div>

        {modoScan && (
          <div className="space-y-2">
            <div
              id="tarima-qr-reader"
              className="mx-auto max-w-xs overflow-hidden rounded-lg border border-slate-200 bg-black"
            />
            {errorCamara && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorCamara}
              </p>
            )}
          </div>
        )}

        <label className="block text-xs space-y-1">
          <span className="font-semibold text-slate-700">O pega el id del QR</span>
          <div className="flex gap-2">
            <input
              value={qrPegado}
              onChange={(e) => setQrPegado(e.target.value)}
              placeholder="BUL-CFDI-… o el JSON del QR"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => resolverBulto(qrPegado)}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100"
            >
              Leer
            </button>
          </div>
        </label>
      </div>

      {/* Preview del bulto leído */}
      {bulto && (
        <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3 space-y-2">
          <p className="text-xs font-bold text-blue-950">Bulto leído</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-950">
            <span className="font-mono font-semibold">{bulto.idBulto}</span>
            <span>SKU {bulto.sku}</span>
            <span className="tabular-nums font-semibold">{bulto.pesoKg} kg</span>
            <span className="tabular-nums font-semibold">{bulto.volumenM3} m³</span>
            {bulto.altoM != null && (
              <span className="tabular-nums">alto {bulto.altoM} m</span>
            )}
          </div>
          {yaEstaEnEstaTarima ? (
            <p className="text-xs font-semibold text-slate-600">
              Este bulto ya está en esta tarima.
            </p>
          ) : evaluacion?.ok ? (
            <p className="text-xs font-semibold text-emerald-800">
              Sí cabe. Libre después: {evaluacion.resumen.pesoLibreKg.toFixed(1)} kg ·{" "}
              {evaluacion.resumen.volumenLibreM3.toFixed(2)} m³
            </p>
          ) : (
            <p className="text-xs font-semibold text-red-800">{mensajeNoCabe}</p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={guardar}
        disabled={!puedeGuardar}
        className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-sm font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {ocupado ? "Guardando…" : "Guardar en esta tarima"}
      </button>

      {mensaje && (
        <p
          className={`text-xs font-semibold rounded-lg px-3 py-2 border ${
            mensaje.tipo === "ok"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {mensaje.texto}
        </p>
      )}
    </div>
  );
}
