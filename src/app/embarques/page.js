"use client";

import { useEffect, useState } from "react";
import { resumenRack } from "./torton";
import { useEmbarques } from "./useEmbarques";
import { numeroDeRack, etiquetaRack } from "./cedisLayout";
import EmbarquesHeader from "./components/EmbarquesHeader";
import CedisPlano from "./components/CedisPlano";
import RackResumen from "./components/RackResumen";
import RackVista from "./components/RackVista";
import TortonPanel from "./components/TortonPanel";
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
    andenSalida,
    setAndenSalida,
    despacharTorton,
    despachando,
  } = useEmbarques();

  const [tab, setTab] = useState("racks");
  const [rackSeleccionadoNum, setRackSeleccionadoNum] = useState(null);

  useEffect(() => {
    if (!data?.sucursales || rackSeleccionadoNum != null) return;
    const asignada = data.sucursales.find((s) => s.id === sucursalActivaId);
    const num = numeroDeRack(asignada?.rackAsignado);
    if (num) setRackSeleccionadoNum(num);
  }, [data, sucursalActivaId, rackSeleccionadoNum]);

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
      : sucursalAsignada;
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

  const handleDespachar = () => {
    if (!sucursalInspectada) return;
    despacharTorton({
      sucursalId: sucursalInspectada.id,
      bultosRack: sucursalInspectada.bultos || [],
    });
  };

  return (
    <div className="space-y-8">
      <div className="no-print bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <EmbarquesHeader tab={tab} onTabChange={setTab} />

        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-300 text-red-800 text-sm font-semibold">
            {error}
          </div>
        )}

        {tab === "racks" && (
          <div className="space-y-6">
            <CedisPlano
              rackAsignado={sucursalAsignada.rackAsignado}
              rackSeleccionadoNum={rackSeleccionadoNum}
              onSelectRack={setRackSeleccionadoNum}
            />

            {sucursalInspectada && resumenInspectada ? (
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-800">
                    {etiquetaRack(rackSeleccionadoNum || numeroDeRack(sucursalInspectada.rackAsignado))}{" "}
                    · {sucursalInspectada.nombre}
                  </h2>
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
                  todosLosBultos={data.bultos || []}
                  sucursales={sucursales}
                  onAcomodar={acomodarBultos}
                  acomodando={acomodando}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">
                Selecciona un rack en el plano para acomodar bultos (mismo QR que generó el proveedor).
              </p>
            )}
          </div>
        )}

        {tab === "salida" && sucursalInspectada && resumenInspectada && (
          <div className="space-y-6">
            <CedisPlano
              rackAsignado={sucursalAsignada.rackAsignado}
              rackSeleccionadoNum={
                rackSeleccionadoNum ?? numeroDeRack(sucursalInspectada.rackAsignado)
              }
              onSelectRack={setRackSeleccionadoNum}
            />

            <p className="text-xs text-slate-500">
              El Tortón suma los bultos{" "}
              <span className="font-semibold text-slate-700">EN_RACK</span> de la
              sucursal elegida (los mismos que acomodaste con el QR). Candado: ≥90%
              peso y volumen.
            </p>

            <TortonPanel
              sucursal={sucursalInspectada}
              resumen={resumenInspectada}
              rules={rules}
              andenSalida={andenSalida}
              onAndenChange={setAndenSalida}
              onDespachar={handleDespachar}
              despachando={despachando}
            />
          </div>
        )}
      </div>

      {tab === "salida" && <RelacionEmbarque embarque={embarqueEmitido} />}
    </div>
  );
}
