"use client";

import { useState } from "react";
import { resumenRack } from "./torton";
import { useEmbarques } from "./useEmbarques";
import { numeroDeRack, etiquetaRack, proximidadDeRack, PROXIMIDAD_INFO } from "./cedisLayout";
import EmbarquesHeader from "./components/EmbarquesHeader";
import CedisPlano from "./components/CedisPlano";
import RackResumen from "./components/RackResumen";
import RackVista from "./components/RackVista";
import RelacionEmbarque from "./components/RelacionEmbarque";

export default function EmbarquesPage() {
  const {
    data,
    loading,
    error,
    embarqueEmitido,
    sucursalActivaId,
    acomodarBultos,
    acomodando,
  } = useEmbarques();

  const [rackSeleccionadoNum, setRackSeleccionadoNum] = useState(null);

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Cargando plano de racks…</div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm font-semibold">
        {error}
      </div>
    );
  }

  const { rules, sucursales } = data;
  const sucursalAsignada = sucursales.find((s) => s.id === sucursalActivaId);

  if (!sucursalAsignada) {
    return (
      <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 text-sm font-semibold">
        No se encontró el rack asignado (id {sucursalActivaId}).
      </div>
    );
  }

  const sucursalInspectada =
    rackSeleccionadoNum != null
      ? sucursales.find((s) => numeroDeRack(s.rackAsignado) === rackSeleccionadoNum)
      : null;
  const resumenInspectada = sucursalInspectada
    ? resumenRack(sucursalInspectada, rules)
    : null;

  const bultosCandidatos = !sucursalInspectada
    ? []
    : (data.bultos || []).filter(
        (b) =>
          Number(b.sucursalId) === Number(sucursalInspectada.id) &&
          b.estado !== "EMBARCADO" &&
          b.estado !== "RECHAZADO"
      );

  return (
    <div className="space-y-8">
      <div className="no-print bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <EmbarquesHeader />

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-semibold">
            {error}
          </div>
        )}

        <CedisPlano
          rackAsignado={sucursalAsignada.rackAsignado}
          rackSeleccionadoNum={rackSeleccionadoNum}
          onSelectRack={setRackSeleccionadoNum}
        />

        {sucursalInspectada && resumenInspectada ? (
          <div className="space-y-4 border-t border-slate-200 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800">
                  {etiquetaRack(rackSeleccionadoNum)} · {sucursalInspectada.nombre}
                </h2>
                <p className="text-xs text-slate-500">
                  {PROXIMIDAD_INFO[proximidadDeRack(rackSeleccionadoNum)]?.nombre || ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRackSeleccionadoNum(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
              >
                Cerrar detalle
              </button>
            </div>
            <RackResumen sucursal={sucursalInspectada} resumen={resumenInspectada} />
            <RackVista
              sucursal={sucursalInspectada}
              bultosCandidatos={bultosCandidatos}
              onAcomodar={acomodarBultos}
              acomodando={acomodando}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-2">
            Selecciona un rack en el plano para ver sus tarimas.
          </p>
        )}
      </div>

      <RelacionEmbarque embarque={embarqueEmitido} />
    </div>
  );
}
