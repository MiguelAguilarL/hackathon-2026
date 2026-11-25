"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DockCalendar from "./components/DockCalendar";
import PackingListBuilder from "./components/PackingListBuilder";
import QrLabelsSheet from "./components/QrLabelsSheet";
import OcErpSimulator from "./components/OcErpSimulator";

const PALABRAS_IGNORADAS = ["DE", "DEL", "LA", "LAS", "LOS", "EL", "Y", "E", "SA", "S.A.", "CV", "C.V.", "S.A"];

// Extrae un prefijo fiscal de 3 letras a partir de la razón social del proveedor (ej. "Alimentos y Bebidas Nacionales" -> "ABN")
function obtenerPrefijoFiscalProveedor(nombreProveedor = "PROVEEDOR GENERAL") {
  const palabras = nombreProveedor
    .toUpperCase()
    .replace(/[^A-ZÁÉÍÓÚÑ\s]/g, "")
    .split(/\s+/)
    .filter((p) => p.length > 0 && !PALABRAS_IGNORADAS.includes(p));

  if (palabras.length >= 3) {
    return `${palabras[0][0]}${palabras[1][0]}${palabras[2][0]}`;
  }
  if (palabras.length === 2) {
    return `${palabras[0].slice(0, 2)}${palabras[1][0]}`;
  }
  if (palabras.length === 1 && palabras[0].length >= 3) {
    return palabras[0].slice(0, 3);
  }
  return "PRV";
}

// Genera automáticamente un Folio Fiscal de Factura (CFDI) único e irrepetible siguiendo formato real:
// Formato oficial: CFDI-[PREFIJO_PROVEEDOR]-2026-[CONSECUTIVO_4_DIGITOS] (ej. CFDI-ABN-2026-0002)
function generarFolioFacturaRealUnico(oc, citasFacturas = []) {
  if (!oc) return "CFDI-PRV-2026-0001";

  // Si la OC ya tiene una factura registrada, mostrar su folio oficial asignado
  if (oc.citaFactura?.folioFactura) {
    return oc.citaFactura.folioFactura;
  }

  const prefijo = obtenerPrefijoFiscalProveedor(oc.proveedor);
  const matchOcNum = oc.idOc?.match(/(\d+)$/);
  let consecutivo = matchOcNum ? parseInt(matchOcNum[1], 10) : citasFacturas.length + 1;

  const foliosOcupados = new Set(citasFacturas.map((c) => c.folioFactura.toUpperCase()));
  let candidato = `CFDI-${prefijo}-2026-${String(consecutivo).padStart(4, "0")}`;

  // Garantizar que jamás se repita ningún folio existente en la base de datos
  while (foliosOcupados.has(candidato.toUpperCase())) {
    consecutivo += 1;
    candidato = `CFDI-${prefijo}-2026-${String(consecutivo).padStart(4, "0")}`;
  }

  return candidato;
}

export default function ProveedorPage() {
  const [data, setData] = useState(null);
  const [vistaActiva, setVistaActiva] = useState("AGENDAR"); // "AGENDAR" | "SIMULADOR_OC" | "ETIQUETAS" | "CITAS"

  // Estado del formulario de Momentos 1 y 2
  const [idOc, setIdOc] = useState("OC-2026-002");
  const [folioFactura, setFolioFactura] = useState("");
  const [anden, setAnden] = useState(2);
  const [fecha, setFecha] = useState("2026-11-25");
  const [horaInicio, setHoraInicio] = useState(11);
  const [duracionHoras, setDuracionHoras] = useState(1);
  const [bultosForm, setBultosForm] = useState([
    {
      sucursalId: 1,
      sku: "SKU-BEB-24",
      descripcion: "Paquete Bebida Energética 24p",
      piezas: 200,
      pesoKg: 750,
      volumenM3: 1.6,
    },
    {
      sucursalId: 3,
      sku: "SKU-BOT-50",
      descripcion: "Caja Botana Salada 50p",
      piezas: 100,
      pesoKg: 420,
      volumenM3: 1.2,
    },
  ]);

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [citaSeleccionadaQR, setCitaSeleccionadaQR] = useState(null);

  const sincronizarConOc = (ocSeleccionada, listaCitas = []) => {
    if (!ocSeleccionada) return;
    setIdOc(ocSeleccionada.idOc);
    const folioAuto = generarFolioFacturaRealUnico(ocSeleccionada, listaCitas);
    setFolioFactura(folioAuto);

    if (ocSeleccionada.lineas?.length > 0) {
      setBultosForm(
        ocSeleccionada.lineas.map((l) => ({
          sucursalId: l.sucursalId,
          sku: l.sku,
          descripcion: l.descripcion,
          piezas: l.piezasPedidas,
          pesoKg: Math.min(850, Math.max(40, l.piezasPedidas * 4)),
          volumenM3: 1.4,
        }))
      );
    }
  };

  const cargarDatos = async (idOcPreferida = null) => {
    const res = await fetch("/api/cedis");
    const json = await res.json();
    setData(json);

    if (!citaSeleccionadaQR && json.citasFacturas?.length > 0) {
      setCitaSeleccionadaQR(json.citasFacturas[0]);
    }

    // Seleccionar automáticamente la OC preferida o la primera OC disponible sin cita
    const targetId = idOcPreferida || idOc;
    let ocTarget = json.ordenesCompra?.find((o) => o.idOc === targetId);
    if (!idOcPreferida && ocTarget?.citaFactura) {
      const libre = json.ordenesCompra?.find((o) => !o.citaFactura);
      if (libre) ocTarget = libre;
    }

    if (ocTarget) {
      sincronizarConOc(ocTarget, json.citasFacturas || []);
    }
    return json;
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const ocActual = data?.ordenesCompra?.find((o) => o.idOc === idOc);

  // Cuando el proveedor cambia de Orden de Compra, autogenerar su folio único de factura y precargar sus líneas
  const handleCambiarOC = (nuevoIdOc) => {
    const nuevaOc = data?.ordenesCompra?.find((o) => o.idOc === nuevoIdOc);
    if (nuevaOc) {
      sincronizarConOc(nuevaOc, data?.citasFacturas || []);
    }
  };

  // Callback cuando se emite una nueva OC desde el Simulador ERP
  const handleOcNuevaCreada = async (nuevaOc) => {
    const json = await cargarDatos(nuevaOc.idOc);
    sincronizarConOc(nuevaOc, json?.citasFacturas || []);
    setMensaje(
      `Orden de Compra ${nuevaOc.idOc} (${nuevaOc.proveedor}) emitida exitosamente. Se le asignó automáticamente el Folio Fiscal único ${generarFolioFacturaRealUnico(
        nuevaOc,
        json?.citasFacturas || []
      )}.`
    );
    setVistaActiva("AGENDAR");
  };

  // Validaciones en tiempo real
  const folioDuplicado = data?.citasFacturas?.some(
    (c) => c.folioFactura.trim().toUpperCase() === folioFactura.trim().toUpperCase()
  );
  const ocYaTieneCita = Boolean(ocActual?.citaFactura);

  const citasDelDia = (data?.citasFacturas || []).filter((c) => c.fecha === fecha);
  const hayTraslapeAnden = citasDelDia.some((c) => {
    if (Number(c.anden) !== Number(anden)) return false;
    const finExistente = c.horaInicio + c.duracionHoras;
    const finNueva = Number(horaInicio) + Number(duracionHoras);
    return Number(horaInicio) < finExistente && finNueva > c.horaInicio;
  });

  const duracionInvalida = duracionHoras < 1 || duracionHoras > 2 || horaInicio + duracionHoras > 18;

  const handleAgendar = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (duracionHoras < 1 || duracionHoras > 2) {
      setError("La duración de la cita debe ser de mínimo 1 hora y máximo 2 horas.");
      return;
    }

    if (ocYaTieneCita) {
      setError(
        `La Orden de Compra ${idOc} ya tiene una factura asociada (${ocActual.citaFactura.folioFactura}). Selecciona otra OC disponible o emite una nueva en el Simulador ERP.`
      );
      return;
    }

    if (folioDuplicado) {
      setError(`El folio de factura "${folioFactura}" ya está registrado en el sistema y no se puede repetir.`);
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch("/api/cedis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "AGENDAR_CITA",
          idOc,
          folioFactura: folioFactura.trim().toUpperCase(),
          proveedor: ocActual?.proveedor || "Proveedor Externo",
          anden,
          fecha,
          horaInicio,
          duracionHoras,
          bultos: bultosForm,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error);
      } else {
        setMensaje(
          `¡Cita confirmada en Andén #${anden} (${horaInicio}:00 a ${horaInicio + duracionHoras}:00 hrs)! Se registró la Factura Fiscal ${json.cita.folioFactura} y se generaron ${json.cita.bultos.length} etiquetas QR listas para escanear en /handheld.`
        );
        setCitaSeleccionadaQR(json.cita);
        await cargarDatos();
        setVistaActiva("ETIQUETAS");
      }
    } finally {
      setEnviando(false);
    }
  };

  const ocsDisponiblesCount = (data?.ordenesCompra || []).filter((o) => !o.citaFactura).length;

  return (
    <div className="space-y-6">
      {/* Encabezado Industrial del Portal de Proveedores */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded">
                Módulo Proveedores · Momentos 1 y 2
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                4 Andenes de Recibo · Horario 08:00 a 18:00 hrs · Citas de 1h a 2h máx
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
              Portal de Agendamiento de Citas, Facturación CFDI y Etiquetado QR
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Emite o selecciona una Orden de Compra, obtén tu Folio Fiscal Único autogenerado (bloqueado contra edición y duplicados), reserva andén y genera las etiquetas QR por bulto.
            </p>
          </div>

          {/* Selector de Pestañas del Portal */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shrink-0">
            <button
              type="button"
              onClick={() => setVistaActiva("AGENDAR")}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                vistaActiva === "AGENDAR"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              1. Agendar Cita y Factura
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva("SIMULADOR_OC")}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                vistaActiva === "SIMULADOR_OC"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-blue-700 hover:bg-blue-50"
              }`}
            >
              <span>+ Simulador ERP: Emitir OC</span>
              <span className="bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {ocsDisponiblesCount} libres
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva("ETIQUETAS")}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                vistaActiva === "ETIQUETAS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>2. Plancha Etiquetas QR</span>
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
                {citaSeleccionadaQR?.bultos?.length || 0}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva("CITAS")}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition ${
                vistaActiva === "CITAS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              3. Bitácora ({data?.citasFacturas?.length || 0})
            </button>
          </div>
        </div>

        {/* Alertas Globales de Respuesta */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 text-sm font-bold flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)} className="text-xs underline ml-4">
              Cerrar
            </button>
          </div>
        )}
        {mensaje && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-sm font-bold flex flex-wrap items-center justify-between gap-3">
            <span>✅ {mensaje}</span>
            <div className="flex items-center gap-2">
              <Link
                href="/handheld"
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-lg"
              >
                Ir a Escanear en /handheld →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* VISTA SIMULADOR ERP: EMISIÓN DE NUEVAS ÓRDENES DE COMPRA */}
      {vistaActiva === "SIMULADOR_OC" && (
        <OcErpSimulator
          ordenesCompra={data?.ordenesCompra || []}
          sucursales={data?.sucursales || []}
          onOcCreada={handleOcNuevaCreada}
        />
      )}

      {/* VISTA 1: ASISTENTE DE AGENDAMIENTO + PARRILLA DE ANDENES + DESGLOSE DE BULTOS */}
      {vistaActiva === "AGENDAR" && (
        <form onSubmit={handleAgendar} className="space-y-6 no-print">
          {/* PASO 1: Orden de Compra y Folio Único de Factura Autogenerado (Solo Lectura) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
                  Paso 1 · Vinculación Automática OC ↔ Factura Fiscal (Relación 1 a 1)
                </span>
                <h2 className="text-lg font-bold mt-1">
                  Selección de Orden de Compra (OC) y Asignación Automática de Folio Fiscal CFDI
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVistaActiva("SIMULADOR_OC")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-lg transition shadow"
              >
                + Simular Nueva Orden de Compra (ERP CEDIS)
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Selector de OC */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase text-slate-600">
                  1. Orden de Compra Emitida por el CEDIS
                </label>
                <select
                  value={idOc}
                  onChange={(e) => handleCambiarOC(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {data?.ordenesCompra?.map((oc) => (
                    <option key={oc.idOc} value={oc.idOc}>
                      {oc.idOc} — {oc.proveedor}{" "}
                      {oc.citaFactura
                        ? `(Ya entregada con ${oc.citaFactura.folioFactura})`
                        : "(Disponible para Agendar)"}
                    </option>
                  ))}
                </select>

                {ocYaTieneCita ? (
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <span>
                      ⚠️ Esta OC ya tiene registrada la factura{" "}
                      <span className="font-mono">{ocActual.citaFactura.folioFactura}</span> en Andén #
                      {ocActual.citaFactura.anden}.
                    </span>
                    <button
                      type="button"
                      onClick={() => setVistaActiva("SIMULADOR_OC")}
                      className="bg-slate-900 text-white px-2.5 py-1 rounded text-[11px] font-extrabold"
                    >
                      Emitir Nueva OC →
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ OC disponible · Proveedor titular: <strong>{ocActual?.proveedor}</strong> (
                    {ocActual?.lineas?.length || 0} partidas solicitadas).
                  </p>
                )}
              </div>

              {/* Campo Folio Fiscal de Factura Autogenerado y Bloqueado contra Teclado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase text-slate-600">
                    2. Folio Fiscal de Factura (Autogenerado · No Editable)
                  </label>
                  <span className="text-[10px] font-black uppercase bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                    🔒 Bloqueado a Teclado
                  </span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={folioFactura}
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    title="Folio fiscal generado automáticamente por el sistema para garantizar unicidad y formato oficial CFDI"
                    className="w-full border-2 border-slate-300 bg-slate-100 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black cursor-not-allowed select-none focus:outline-none"
                  />
                </div>

                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-medium">
                  ✓ Formato fiscal real <strong>CFDI-[RFC]-[AÑO]-[CONSECUTIVO]</strong> asignado automáticamente a{" "}
                  <strong>{ocActual?.proveedor}</strong> sin posibilidad de duplicación ni alteración manual.
                </p>
              </div>
            </div>
          </div>

          {/* PASO 2: Calendario Visual de los 4 Andenes (08:00 a 18:00, 1h a 2h máx) */}
          <DockCalendar
            fecha={fecha}
            setFecha={setFecha}
            anden={anden}
            setAnden={setAnden}
            horaInicio={horaInicio}
            setHoraInicio={setHoraInicio}
            duracionHoras={duracionHoras}
            setDuracionHoras={setDuracionHoras}
            citasFacturas={data?.citasFacturas || []}
          />

          {/* PASO 3: Desglose de Factura por Bulto (Packing List) */}
          <PackingListBuilder
            ocActual={ocActual}
            sucursales={data?.sucursales || []}
            bultosForm={bultosForm}
            setBultosForm={setBultosForm}
            folioFactura={folioFactura}
          />

          {/* Botón de Confirmación Final */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900 text-sm">
                Resumen antes de confirmar: {idOc} → Factura Fiscal {folioFactura}
              </p>
              <p>
                Andén #{anden} · Fecha {fecha} de {String(horaInicio).padStart(2, "0")}:00 a{" "}
                {String(horaInicio + duracionHoras).padStart(2, "0")}:00 hrs ({duracionHoras}h) ·{" "}
                {bultosForm.length} etiquetas QR por generar.
              </p>
            </div>

            <button
              type="submit"
              disabled={enviando || folioDuplicado || ocYaTieneCita || hayTraslapeAnden || duracionInvalida}
              className={`px-6 py-3 rounded-xl font-extrabold text-sm transition shadow-md ${
                enviando || folioDuplicado || ocYaTieneCita || hayTraslapeAnden || duracionInvalida
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
              }`}
            >
              {enviando
                ? "Registrando Cita y Generando QRs..."
                : "Confirmar Cita en Andén y Generar Etiquetas QR →"}
            </button>
          </div>
        </form>
      )}

      {/* VISTA 2: PLANCHA DE IMPRESIÓN DE ETIQUETAS QR */}
      {vistaActiva === "ETIQUETAS" && (
        <QrLabelsSheet
          citasFacturas={data?.citasFacturas || []}
          citaSeleccionadaQR={citaSeleccionadaQR}
          setCitaSeleccionadaQR={setCitaSeleccionadaQR}
          sucursales={data?.sucursales || []}
        />
      )}

      {/* VISTA 3: BITÁCORA DE CITAS Y CONEXIÓN CON HANDHELD */}
      {vistaActiva === "CITAS" && (
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">Bitácora de Citas Programadas en los 4 Andenes de Recibo</h2>
              <p className="text-xs text-slate-400">
                Haz clic en cualquier cita para abrir e imprimir su plancha de etiquetas QR o enviarla a validación en /handheld.
              </p>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-2 gap-4">
            {data?.citasFacturas?.map((cita) => {
              const bultosRecibidos = (cita.bultos || []).filter(
                (b) => b.estado === "EN_RACK" || b.estado === "EMBARCADO"
              ).length;
              const bultosPendientes = (cita.bultos || []).filter((b) => b.estado === "PENDIENTE_RECIBO").length;

              return (
                <div
                  key={cita.folioFactura}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase bg-slate-900 text-amber-400 px-2.5 py-0.5 rounded">
                        ANDÉN #{cita.anden} · {cita.fecha} ({String(cita.horaInicio).padStart(2, "0")}:00 -{" "}
                        {String(cita.horaInicio + cita.duracionHoras).padStart(2, "0")}:00 hrs)
                      </span>
                      <h3 className="text-base font-extrabold font-mono text-slate-900 mt-1.5">
                        Factura: {cita.folioFactura} · {cita.idOc}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium">{cita.proveedor}</p>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded bg-emerald-100 text-emerald-800">
                      {cita.bultos?.length || 0} Bultos QR
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 text-xs">
                    <span className="text-slate-600">
                      Recibidos en Rack: <strong>{bultosRecibidos}</strong> · Pendientes en Andén:{" "}
                      <strong>{bultosPendientes}</strong>
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCitaSeleccionadaQR(cita);
                          setVistaActiva("ETIQUETAS");
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg"
                      >
                        Ver Etiquetas QR
                      </button>
                      <Link
                        href="/handheld"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                      >
                        Recibir en Handheld →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
