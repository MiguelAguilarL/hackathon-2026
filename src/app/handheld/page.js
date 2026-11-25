"use client";

import { useEffect, useMemo, useState } from "react";
import HandheldShell from "./_components/HandheldShell";
import QrViewport from "./_components/QrViewport";
import ScanResultCard from "./_components/ScanResultCard";
import TruckProgressCard from "./_components/TruckProgressCard";
import ManualInputBar from "./_components/ManualInputBar";
import IncidentSheet from "./_components/IncidentSheet";
import EstadoBultosCard from "./_components/EstadoBultosCard";
import { useHandheldScan } from "./_hooks/useHandheldScan";

export default function HandheldPage() {
  const {
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
  } = useHandheldScan();

  const [incidenciaAbierta, setIncidenciaAbierta] = useState(false);

  const citas = data?.citasFacturas || [];
  const citaActiva = useMemo(() => {
    const porPayload = citas.find(
      (cita) =>
        (payload?.folioFactura && cita.folioFactura === payload.folioFactura) ||
        (payload?.idOc && cita.idOc === payload.idOc)
    );
    if (porPayload) return porPayload;
    return citas.find((cita) => cita.bultos?.some((bulto) => bulto.estado === "PENDIENTE_RECIBO")) || citas[0];
  }, [citas, payload]);

  const bultosPendientes = useMemo(
    () => (data?.bultos || []).filter((bulto) => bulto.estado === "PENDIENTE_RECIBO"),
    [data]
  );

  const bultoLeido = useMemo(() => {
    const id = payload?.idBulto;
    if (!id) return null;
    return (data?.bultos || []).find((bulto) => bulto.idBulto === id) || null;
  }, [data, payload]);

  const sucursalDestino = useMemo(() => {
    const porBultoLeido = bultoLeido
      ? bultoLeido.sucursal ||
        (data?.sucursales || []).find((sucursal) => sucursal.id === bultoLeido.sucursalId)
      : null;
    if (porBultoLeido) return porBultoLeido;

    const referencia = bultosPendientes[0];
    if (!referencia) return null;
    if (referencia.sucursal) return referencia.sucursal;
    return (data?.sucursales || []).find((sucursal) => sucursal.id === referencia.sucursalId) || null;
  }, [bultoLeido, bultosPendientes, data]);

  useEffect(() => {
    if (estado !== "OK" && estado !== "RECHAZADO") return;
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(estado === "OK" ? 80 : [120, 60, 120]);
    }
  }, [estado, resultado]);

  const camaraActiva = estado === "IDLE";

  const footer = (
    <footer className="shrink-0 px-5 py-3 bg-slate-50 border-t border-slate-200 grid grid-cols-2 gap-3 md:px-8 md:grid-cols-none md:flex md:justify-end md:gap-4">
      <button
        type="button"
        onClick={() => setIncidenciaAbierta(true)}
        className="min-h-[56px] rounded-xl bg-slate-200 text-slate-800 text-sm font-extrabold hover:bg-slate-300 flex items-center justify-center gap-2 md:w-56"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
          <path d="M12 9v4m0 4h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Incidencia
      </button>
      <button
        type="button"
        onClick={reiniciar}
        disabled={estado === "IDLE" || estado === "VALIDANDO"}
        className={`min-h-[56px] rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2 md:w-56 disabled:opacity-40 disabled:cursor-not-allowed ${
          estado === "RECHAZADO" ? "bg-red-700 hover:bg-red-800" : "bg-sky-700 hover:bg-sky-800"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-5 h-5">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {estado === "RECHAZADO"
          ? "Entendido, escanear otro"
          : estado === "LEIDO"
          ? "Escanear otro QR"
          : "Escanear otro bulto"}
      </button>
    </footer>
  );

  const overlay = (
    <IncidentSheet
      abierto={incidenciaAbierta}
      resultado={resultado}
      payload={payload}
      onCerrar={() => setIncidenciaAbierta(false)}
    />
  );

  return (
    <HandheldShell
      anden={citaActiva?.anden}
      folio={citaActiva?.folioFactura}
      estado={estado}
      cargado={Boolean(data) && !errorCarga}
      footer={footer}
      overlay={overlay}
    >
      {errorCarga && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-[11px] font-bold text-red-800 md:col-span-2">
          {errorCarga}
        </div>
      )}

      <QrViewport activo={camaraActiva} onDecode={procesarTextoQR} />

      <div className="md:col-start-2 md:row-start-2 md:h-full md:overflow-y-auto md:bg-slate-50 md:border-l md:border-slate-200">
        <ScanResultCard
          estado={estado}
          resultado={resultado}
          payload={payload}
          bulto={bultoLeido}
          contenido={contenidoQR}
          onEscanearOtro={reiniciar}
        />

        <EstadoBultosCard cita={citaActiva} bultos={data?.bultos || []} />

        <TruckProgressCard
          cita={citaActiva}
          sucursal={sucursalDestino}
          reporteFaltantes={reporteFaltantes}
          onAuditar={() => citaActiva && verificarFaltantesFactura(citaActiva)}
          onCerrarReporte={cerrarReporte}
        />

        <ManualInputBar
          onTexto={procesarTextoQR}
          onPayload={procesarPayloadQR}
          bultosPendientes={bultosPendientes}
          deshabilitado={estado === "VALIDANDO"}
        />
      </div>
    </HandheldShell>
  );
}
