"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  resumenRack,
  resumenTorton,
  bultosEnRackDeSucursal,
  bultosEnTortonDeSucursal,
} from "./torton";
import { useEmbarques } from "./useEmbarques";
import { numeroDeRack, etiquetaRack } from "./cedisLayout";
import EmbarquesHeader from "./components/EmbarquesHeader";
import CedisPlano from "./components/CedisPlano";
import RackResumen from "./components/RackResumen";
import RackVista from "./components/RackVista";
import TortonLista from "./components/TortonLista";
import TortonPanel from "./components/TortonPanel";
import RelacionEmbarque from "./components/RelacionEmbarque";

export default function EmbarquesPage() {
  const router = useRouter();
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
    cargarTorton,
    cargandoTorton,
  } = useEmbarques();

  const [tab, setTab] = useState("racks");
  const [rackSeleccionadoNum, setRackSeleccionadoNum] = useState(null);
  const [tortonSucursalId, setTortonSucursalId] = useState(null);
  const [andenPorSucursal, setAndenPorSucursal] = useState({});
  const [usuarioBodega, setUsuarioBodega] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  useEffect(() => {
    let activo = true;

    const verificarSesion = async () => {
      try {
        const res = await fetch("/api/auth");
        const json = await res.json();
        if (!activo) return;
        if (!json.autenticado || json.perfil !== "bodega") {
          router.replace("/");
          return;
        }
        setUsuarioBodega(json.usuario);
      } catch {
        if (activo) router.replace("/");
      } finally {
        if (activo) setVerificandoSesion(false);
      }
    };

    verificarSesion();
    return () => {
      activo = false;
    };
  }, [router]);

  const handleCerrarSesion = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/");
  };

  useEffect(() => {
    if (!data?.sucursales || rackSeleccionadoNum != null) return;
    const asignada = data.sucursales.find((s) => s.id === sucursalActivaId);
    const num = numeroDeRack(asignada?.rackAsignado);
    if (num) setRackSeleccionadoNum(num);
  }, [data, sucursalActivaId, rackSeleccionadoNum]);

  // Usa sucursales ya existentes (papelería 01, 02, 03…): andén por defecto 1→1, 2→2, 3→3…
  useEffect(() => {
    if (!data?.sucursales?.length) return;
    setAndenPorSucursal((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const s of data.sucursales) {
        if (next[s.id] == null) {
          next[s.id] = ((Number(s.id) - 1) % 3) + 1;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [data?.sucursales]);

  const todosLosBultos = data?.bultos || [];

  const tortones = useMemo(() => {
    if (!data?.sucursales) return [];
    const mapped = data.sucursales.map((s) => {
      const bultosDesdeRack = bultosEnRackDeSucursal(todosLosBultos, s.id);
      const bultosEnTorton = bultosEnTortonDeSucursal(todosLosBultos, s.id);
      return {
        ...s,
        bultosDesdeRack,
        bultosEnTorton,
      };
    });

    const conCarga = mapped.filter(
      (s) => s.bultosDesdeRack.length > 0 || s.bultosEnTorton.length > 0
    );

    // Andenes 2 y 3: embarque a sucursales existentes (02, 03…) aunque aún no tengan carga
    const paraAndenes23 = mapped.filter((s) => s.id === 2 || s.id === 3);
    const byId = new Map(conCarga.map((s) => [s.id, s]));
    for (const s of paraAndenes23) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return Array.from(byId.values()).sort((a, b) => a.id - b.id);
  }, [data?.sucursales, todosLosBultos]);

  useEffect(() => {
    if (tab !== "salida" || tortonSucursalId != null) return;
    if (tortones.length >= 1) setTortonSucursalId(tortones[0].id);
  }, [tab, tortones, tortonSucursalId]);

  if (verificandoSesion) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 font-medium">
        Verificando sesión de Personal de Bodega...
      </div>
    );
  }

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

  const bultosCandidatosRack = !sucursalInspectada
    ? []
    : todosLosBultos.filter(
        (b) =>
          Number(b.sucursalId) === Number(sucursalInspectada.id) &&
          b.estado !== "EMBARCADO" &&
          b.estado !== "RECHAZADO" &&
          b.estado !== "EN_TORTON"
      );

  const tortonActivo =
    tortones.find((t) => t.id === tortonSucursalId) ||
    sucursales.find((s) => s.id === tortonSucursalId);
  const bultosEnTorton = tortonActivo
    ? bultosEnTortonDeSucursal(todosLosBultos, tortonActivo.id)
    : [];
  const bultosDesdeRack = tortonActivo
    ? bultosEnRackDeSucursal(todosLosBultos, tortonActivo.id)
    : [];
  const resumenSalida = tortonActivo
    ? resumenTorton(bultosEnTorton, rules)
    : null;

  const handleAndenCard = (sucursalId, anden) => {
    setAndenPorSucursal((prev) => ({ ...prev, [sucursalId]: anden }));
    if (sucursalId === tortonSucursalId) setAndenSalida(anden);
  };

  const handleSelectTorton = (sucursalId) => {
    setTortonSucursalId(sucursalId);
    setAndenSalida(andenPorSucursal[sucursalId] || ((Number(sucursalId) - 1) % 3) + 1);
  };

  const handleDespachar = () => {
    if (!tortonActivo) return;
    despacharTorton({ sucursalId: tortonActivo.id });
  };

  return (
    <div className="space-y-8">
      {/* Barra Superior de Sesión del Personal de Bodega Autenticado */}
      <div className="no-print bg-slate-900 text-white rounded-2xl px-6 py-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-blue-500 text-white font-black text-xs px-2.5 py-1 rounded">
            SESIÓN ACTIVA · Personal de Bodega
          </span>
          <div>
            <p className="text-sm font-extrabold text-white">{usuarioBodega?.nombre}</p>
            <p className="text-xs text-slate-400 font-mono">
              {usuarioBodega?.correo} · {usuarioBodega?.area} · {usuarioBodega?.puesto}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCerrarSesion}
          className="bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition"
        >
          Cerrar sesión
        </button>
      </div>

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
                    {etiquetaRack(
                      rackSeleccionadoNum ||
                        numeroDeRack(sucursalInspectada.rackAsignado)
                    )}{" "}
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
                  bultosCandidatos={bultosCandidatosRack}
                  todosLosBultos={todosLosBultos}
                  sucursales={sucursales}
                  onAcomodar={acomodarBultos}
                  acomodando={acomodando}
                />
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">
                Selecciona un rack en el plano para acomodar bultos.
              </p>
            )}
          </div>
        )}

        {tab === "salida" && (
          <div className="space-y-6">
            {tortones.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6 rounded-lg border border-dashed border-slate-200">
                No hay Tortones esperando carga. Primero acomoda bultos en racks
                (quedan EN_RACK) y vuelve aquí.
              </p>
            ) : (
              <TortonLista
                tortones={tortones}
                rules={rules}
                andenPorSucursal={andenPorSucursal}
                onAndenChange={handleAndenCard}
                tortonSeleccionadoId={tortonSucursalId}
                onSelect={handleSelectTorton}
              />
            )}

            {tortonActivo && resumenSalida && (
              <div className="border-t border-slate-200 pt-6">
                <TortonPanel
                  sucursal={tortonActivo}
                  resumen={resumenSalida}
                  rules={rules}
                  bultosEnTorton={bultosEnTorton}
                  bultosDesdeRack={bultosDesdeRack}
                  todosLosBultos={todosLosBultos}
                  sucursales={sucursales}
                  onCargarSlot={cargarTorton}
                  onDespachar={handleDespachar}
                  cargando={cargandoTorton}
                  despachando={despachando}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {tab === "salida" && <RelacionEmbarque embarque={embarqueEmitido} />}
    </div>
  );
}
