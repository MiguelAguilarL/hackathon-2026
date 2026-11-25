"use client";

import { useMemo, useState } from "react";
import {
  sugerirTarimaEnRack,
  notaProximidadOpcional,
  evaluarAcomodoEnSlot,
} from "../rackCapacity";
import { RACK_NIVELES, RACK_COLUMNAS } from "../rackRules";

/**
 * Formulario de acomodo: elige bulto(s), ve sugerencia opcional, verifica y guarda.
 */
export default function AcomodoForm({
  sucursal,
  bultosCandidatos,
  onAcomodar,
  ocupado,
}) {
  const bultosEnRack = sucursal?.bultos || [];
  const [idBultoSel, setIdBultoSel] = useState("");
  const [nivel, setNivel] = useState(1);
  const [columna, setColumna] = useState(1);
  const [mensaje, setMensaje] = useState(null);
  const [verificacion, setVerificacion] = useState(null);

  const bulto = useMemo(
    () => bultosCandidatos.find((b) => b.idBulto === idBultoSel) || null,
    [bultosCandidatos, idBultoSel]
  );

  const notaRack = bulto
    ? notaProximidadOpcional(bulto.demandaEmbarque, sucursal.rackAsignado)
    : null;

  const aplicarSugerencia = () => {
    setMensaje(null);
    setVerificacion(null);
    if (!bulto) {
      setMensaje({ tipo: "error", texto: "Elige un bulto primero." });
      return;
    }
    const sug = sugerirTarimaEnRack({
      bultosAAcomodar: [bulto],
      bultosEnRack,
    });
    if (!sug.ok) {
      setMensaje({ tipo: "error", texto: sug.motivo });
      return;
    }
    setNivel(sug.nivel);
    setColumna(sug.columna);
    setMensaje({ tipo: "ok", texto: sug.mensaje });
  };

  const verificar = () => {
    setMensaje(null);
    if (!bulto) {
      setMensaje({ tipo: "error", texto: "Elige un bulto." });
      return;
    }
    const yaEnSlot = bultosEnRack.filter(
      (b) => b.nivel === Number(nivel) && b.columna === Number(columna) && b.idBulto !== bulto.idBulto
    );
    const ev = evaluarAcomodoEnSlot({
      bultosAAcomodar: [bulto],
      bultosYaEnSlot: yaEnSlot,
    });
    setVerificacion(ev);
    if (ev.ok) {
      setMensaje({
        tipo: "ok",
        texto: `Cabe en N${nivel}-C${columna}.`,
      });
    } else {
      setMensaje({ tipo: "error", texto: ev.motivo });
    }
  };

  const guardar = async () => {
    setMensaje(null);
    if (!bulto) {
      setMensaje({ tipo: "error", texto: "Elige un bulto." });
      return;
    }
    const result = await onAcomodar({
      sucursalId: sucursal.id,
      nivel: Number(nivel),
      columna: Number(columna),
      idBultos: [bulto.idBulto],
    });
    if (result?.ok) {
      setIdBultoSel("");
      setVerificacion(null);
      setMensaje({ tipo: "ok", texto: result.mensaje || "Bulto acomodado." });
    } else {
      setMensaje({ tipo: "error", texto: result?.error || "No se pudo acomodar." });
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-800">Acomodar bulto en este rack</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tienda destino: {sucursal.nombre}. La sugerencia de tarima es opcional; tú decides.
        </p>
      </div>

      {bultosCandidatos.length === 0 ? (
        <p className="text-sm text-slate-500">
          No hay bultos pendientes de acomodar para esta tienda destino.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block text-xs space-y-1">
              <span className="font-semibold text-slate-700">Bulto / producto</span>
              <select
                value={idBultoSel}
                onChange={(e) => {
                  setIdBultoSel(e.target.value);
                  setVerificacion(null);
                  setMensaje(null);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                <option value="">Selecciona…</option>
                {bultosCandidatos.map((b) => (
                  <option key={b.idBulto} value={b.idBulto}>
                    {b.idBulto} · {b.sku} · {b.pesoKg} kg · demanda {b.demandaEmbarque || "media"}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-2">
              <label className="block text-xs space-y-1">
                <span className="font-semibold text-slate-700">Nivel (1–{RACK_NIVELES})</span>
                <select
                  value={nivel}
                  onChange={(e) => setNivel(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {Array.from({ length: RACK_NIVELES }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      N{n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs space-y-1">
                <span className="font-semibold text-slate-700">Columna (1–{RACK_COLUMNAS})</span>
                <select
                  value={columna}
                  onChange={(e) => setColumna(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {Array.from({ length: RACK_COLUMNAS }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      C{c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {notaRack && (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              {notaRack}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={aplicarSugerencia}
              disabled={!bulto || ocupado}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 bg-slate-50 hover:bg-slate-100 disabled:opacity-50"
            >
              Usar sugerencia de tarima
            </button>
            <button
              type="button"
              onClick={verificar}
              disabled={!bulto || ocupado}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100 disabled:opacity-50"
            >
              Verificar si cabe
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!bulto || ocupado}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {ocupado ? "Guardando…" : "Guardar acomodo"}
            </button>
          </div>

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

          {verificacion?.ok && verificacion.resumen && (
            <p className="text-[11px] text-slate-500 tabular-nums">
              Tras acomodar: {verificacion.resumen.pesoTotalKg.toFixed(0)} kg ·{" "}
              {verificacion.resumen.volumenTotalM3.toFixed(2)} m³ en esa tarima
            </p>
          )}
        </>
      )}
    </section>
  );
}
