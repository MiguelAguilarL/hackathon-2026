"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DockCalendar from "./components/DockCalendar";
import PackingListBuilder, { calcularDimensionesBulto } from "./components/PackingListBuilder";
import QrLabelsSheet from "./components/QrLabelsSheet";
import OcErpSimulator from "./components/OcErpSimulator";
import ProveedorLogin from "./components/ProveedorLogin";
import DuracionClock from "./components/DuracionClock";
import BultosStatusPanel from "./components/BultosStatusPanel";
import {
  aMinutos,
  formatearHora,
  formatearDuracion,
  conflictoHorario,
  hayTraslape,
  DURACION_MINIMA_MIN,
  DURACION_MAXIMA_MIN,
} from "@/lib/horarios";

const PALABRAS_IGNORADAS = ["DE", "DEL", "LA", "LAS", "LOS", "EL", "Y", "E", "SA", "S.A.", "CV", "C.V.", "S.A"];

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

function generarFolioFacturaRealUnico(oc, citasFacturas = []) {
  if (!oc) return "CFDI-PRV-2026-0001";

  if (oc.citaFactura?.folioFactura) {
    return oc.citaFactura.folioFactura;
  }

  const prefijo = obtenerPrefijoFiscalProveedor(oc.proveedor);
  const matchOcNum = oc.idOc?.match(/(\d+)$/);
  let consecutivo = matchOcNum ? parseInt(matchOcNum[1], 10) : citasFacturas.length + 1;

  const foliosOcupados = new Set(citasFacturas.map((c) => c.folioFactura.toUpperCase()));
  let candidato = `CFDI-${prefijo}-2026-${String(consecutivo).padStart(4, "0")}`;

  while (foliosOcupados.has(candidato.toUpperCase())) {
    consecutivo += 1;
    candidato = `CFDI-${prefijo}-2026-${String(consecutivo).padStart(4, "0")}`;
  }

  return candidato;
}

export default function ProveedorPage() {
  const [proveedorActivo, setProveedorActivo] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [data, setData] = useState(null);
  const [vistaActiva, setVistaActiva] = useState("AGENDAR"); // "AGENDAR" | "SIMULADOR_OC" | "ETIQUETAS" | "CITAS" | "BULTOS"

  const [idOc, setIdOc] = useState("");
  const [folioFactura, setFolioFactura] = useState("");
  const [anden, setAnden] = useState(2);
  const [fecha, setFecha] = useState("2026-11-25");
  const [horaInicio, setHoraInicio] = useState(11);
  const [duracionHoras, setDuracionHoras] = useState(1.5);
  const [bultosForm, setBultosForm] = useState([]);

  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [citaSeleccionadaQR, setCitaSeleccionadaQR] = useState(null);

  const sincronizarConOc = (ocSeleccionada, todasLasCitas = [], catalogoProductos = []) => {
    if (!ocSeleccionada) {
      setIdOc("");
      setFolioFactura("");
      setBultosForm([]);
      return;
    }
    setIdOc(ocSeleccionada.idOc);
    const folioAuto = generarFolioFacturaRealUnico(ocSeleccionada, todasLasCitas);
    setFolioFactura(folioAuto);

    if (ocSeleccionada.lineas?.length > 0) {
      setBultosForm(
        ocSeleccionada.lineas.map((l) => {
          const dims = calcularDimensionesBulto(l.sku, l.piezasPedidas, catalogoProductos);
          return {
            sucursalId: l.sucursalId,
            sku: l.sku,
            descripcion: l.descripcion,
            piezas: l.piezasPedidas,
            pesoKg: dims.pesoKg,
            volumenM3: dims.volumenM3,
          };
        })
      );
    }
  };

  const cargarDatos = async (prov = proveedorActivo, idOcPreferida = null) => {
    const res = await fetch("/api/cedis");
    const json = await res.json();
    setData(json);

    if (!prov) return json;

    const ocsDelProveedor = (json.ordenesCompra || []).filter(
      (oc) => Number(oc.idProveedor) === Number(prov.idProveedor)
    );
    const idsOcsProveedor = new Set(ocsDelProveedor.map((o) => o.idOc));
    const citasDelProveedor = (json.citasFacturas || []).filter((c) => idsOcsProveedor.has(c.idOc));

    if (citasDelProveedor.length > 0) {
      const citaActualValida = citasDelProveedor.find((c) => c.folioFactura === citaSeleccionadaQR?.folioFactura);
      setCitaSeleccionadaQR(citaActualValida || citasDelProveedor[0]);
    } else {
      setCitaSeleccionadaQR(null);
    }

    let ocTarget = idOcPreferida
      ? ocsDelProveedor.find((o) => o.idOc === idOcPreferida)
      : ocsDelProveedor.find((o) => !o.citaFactura) || ocsDelProveedor[0];

    sincronizarConOc(ocTarget || null, json.citasFacturas || [], json.productos || []);
    return json;
  };

  const verificarSesionInicial = async () => {
    setVerificandoSesion(true);
    try {
      const res = await fetch("/proveedor/api/auth");
      const json = await res.json();
      if (json.autenticado && json.proveedor) {
        setProveedorActivo(json.proveedor);
        await cargarDatos(json.proveedor);
      } else {
        setProveedorActivo(null);
      }
    } finally {
      setVerificandoSesion(false);
    }
  };

  useEffect(() => {
    verificarSesionInicial();
  }, []);

  const handleLoginExitoso = async (prov) => {
    setProveedorActivo(prov);
    setMensaje(null);
    setError(null);
    setVistaActiva("AGENDAR");
    await cargarDatos(prov);
  };

  const handleCerrarSesion = async () => {
    await fetch("/proveedor/api/auth", { method: "DELETE" });
    setProveedorActivo(null);
    setCitaSeleccionadaQR(null);
    setMensaje(null);
    setError(null);
  };

  if (verificandoSesion) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 font-medium">
        Verificando sesión segura del Portal de Proveedores de Papelería...
      </div>
    );
  }

  if (!proveedorActivo) {
    return <ProveedorLogin onLoginExitoso={handleLoginExitoso} />;
  }

  // Filtrar estrictamente las Órdenes de Compra, Productos y Citas de este proveedor (idProveedor)
  const misOrdenesCompra = (data?.ordenesCompra || []).filter(
    (oc) => Number(oc.idProveedor) === Number(proveedorActivo.idProveedor)
  );
  const misProductos = (data?.productos || []).filter(
    (p) => Number(p.idProveedor) === Number(proveedorActivo.idProveedor)
  );
  const misIdsOc = new Set(misOrdenesCompra.map((o) => o.idOc));
  const misCitasFacturas = (data?.citasFacturas || []).filter((c) => misIdsOc.has(c.idOc));

  const ocActual = misOrdenesCompra.find((o) => o.idOc === idOc);

  const handleCambiarOC = (nuevoIdOc) => {
    const nuevaOc = misOrdenesCompra.find((o) => o.idOc === nuevoIdOc);
    if (nuevaOc) {
      sincronizarConOc(nuevaOc, data?.citasFacturas || [], data?.productos || []);
    }
  };

  const handleOcNuevaCreada = async (nuevaOc) => {
    const json = await cargarDatos(proveedorActivo, nuevaOc.idOc);
    sincronizarConOc(nuevaOc, json?.citasFacturas || [], json?.productos || []);
    setMensaje(
      `Orden de Compra ${nuevaOc.idOc} emitida para tu cuenta (idProveedor #${proveedorActivo.idProveedor}). Folio Fiscal asignado: ${generarFolioFacturaRealUnico(
        nuevaOc,
        json?.citasFacturas || []
      )}.`
    );
    setVistaActiva("AGENDAR");
  };

  const folioDuplicado = data?.citasFacturas?.some(
    (c) => c.folioFactura.trim().toUpperCase() === folioFactura.trim().toUpperCase()
  );
  const ocYaTieneCita = Boolean(ocActual?.citaFactura);

  const inicioCitaMin = aMinutos(horaInicio);
  const finCitaMin = inicioCitaMin + aMinutos(duracionHoras);
  const citasDelDia = (data?.citasFacturas || []).filter((c) => c.fecha === fecha);
  const rangoCita = (cita) => {
    const inicio = aMinutos(cita.horaInicio);
    return [inicio, inicio + aMinutos(cita.duracionHoras)];
  };
  const traslapeAnden = citasDelDia.find((c) => {
    if (Number(c.anden) !== Number(anden)) return false;
    const [ini, fin] = rangoCita(c);
    return hayTraslape(inicioCitaMin, finCitaMin, ini, fin);
  });
  const traslapeProveedor = citasDelDia.find((c) => {
    if (c.proveedor !== proveedorActivo.nombre) return false;
    const [ini, fin] = rangoCita(c);
    return hayTraslape(inicioCitaMin, finCitaMin, ini, fin);
  });
  const errorAgenda = conflictoHorario(horaInicio, duracionHoras);

  const duracionInvalida = (() => {
    const minutos = aMinutos(duracionHoras);
    return minutos < DURACION_MINIMA_MIN || minutos > DURACION_MAXIMA_MIN || finCitaMin > 18 * 60;
  })();

  const handleAgendar = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);

    if (!ocActual) {
      setError("No tienes una Orden de Compra seleccionada.");
      return;
    }

    if (errorAgenda) {
      setError(errorAgenda);
      return;
    }

    if (traslapeAnden || traslapeProveedor) {
      const cita = traslapeAnden || traslapeProveedor;
      const [ini, fin] = rangoCita(cita);
      setError(
        traslapeAnden
          ? `Andén #${anden} ocupado: ${cita.folioFactura} (${cita.proveedor}) de ${formatearHora(ini / 60)} a ${formatearHora(fin / 60)} hrs.`
          : `${proveedorActivo.nombre} ya tiene una cita de ${formatearHora(ini / 60)} a ${formatearHora(fin / 60)} hrs en el Andén #${cita.anden}.`
      );
      return;
    }

    if (ocYaTieneCita) {
      setError(
        `La Orden de Compra ${idOc} ya tiene una factura asociada (${ocActual.citaFactura.folioFactura}). Selecciona otra OC o emite una nueva en el Simulador ERP.`
      );
      return;
    }

    if (folioDuplicado) {
      setError(`El folio de factura "${folioFactura}" ya está registrado en el sistema y no se puede repetir.`);
      return;
    }

    if (bultosForm.length === 0 || bultosForm.some((b) => !Number(b.piezas) || Number(b.piezas) <= 0)) {
      setError("Declara al menos un bulto con una cantidad de piezas válida antes de agendar.");
      return;
    }

    // Validación final en el cliente: ninguna partida (SKU + sucursal) puede exceder la OC.
    const piezasPorPartida = new Map();
    for (const b of bultosForm) {
      const clave = `${b.sku}::${Number(b.sucursalId)}`;
      piezasPorPartida.set(clave, (piezasPorPartida.get(clave) || 0) + Number(b.piezas || 0));
    }
    for (const [clave, declaradas] of piezasPorPartida) {
      const [sku, sucursalStr] = clave.split("::");
      const linea = (ocActual.lineas || []).find(
        (l) => l.sku === sku && Number(l.sucursalId) === Number(sucursalStr)
      );
      if (!linea) {
        setError(`El SKU ${sku} para la sucursal ${sucursalStr} no fue solicitado en la OC ${idOc}.`);
        return;
      }
      if (declaradas > linea.piezasPedidas) {
        setError(
          `Excedente no permitido: ${sku} (Sucursal ${sucursalStr}) tiene ${declaradas} pzas declaradas y la OC solo pide ${linea.piezasPedidas}.`
        );
        return;
      }
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
          proveedor: proveedorActivo.nombre,
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
          `¡Cita confirmada en Andén #${anden} (${formatearHora(horaInicio)} a ${formatearHora(horaInicio + duracionHoras)} hrs, ${formatearDuracion(duracionHoras)} de descarga)! Se registró tu Factura Fiscal ${json.cita.folioFactura} y se generaron ${json.cita.bultos.length} etiquetas QR.`
        );
        await cargarDatos(proveedorActivo, idOc);
        setCitaSeleccionadaQR(json.cita);
        setVistaActiva("ETIQUETAS");
      }
    } finally {
      setEnviando(false);
    }
  };

  const misOcsDisponiblesCount = misOrdenesCompra.filter((o) => !o.citaFactura).length;

  return (
    <div className="space-y-6">
      {/* Barra Superior de Sesión del Proveedor Autenticado */}
      <div className="no-print bg-slate-900 text-white rounded-2xl px-6 py-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="bg-emerald-500 text-slate-950 font-black font-mono text-xs px-2.5 py-1 rounded">
            SESIÓN ACTIVA · idProveedor #{proveedorActivo.idProveedor}
          </span>
          <div>
            <p className="text-sm font-extrabold text-white">{proveedorActivo.nombre}</p>
            <p className="text-xs text-slate-400 font-mono">
              {proveedorActivo.correo} · {misProductos.length} Productos en Catálogo · {misOrdenesCompra.length} Órdenes de Compra
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCerrarSesion}
          className="bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-700 font-extrabold text-xs px-4 py-2 rounded-xl transition"
        >
          Cerrar Sesión / Cambiar Proveedor
        </button>
      </div>

      {/* Encabezado Industrial del Portal de Proveedores de Papelería */}
      <div className="no-print bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded">
                CEDIS Papelería · Momentos 1 y 2
              </span>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
                4 Andenes de Recibo · Horario 08:00 a 18:00 hrs · Descarga de 1:00 a 2:00 hrs
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-2">
              Portal de Proveedores: Citas, Facturación CFDI y Cubicación Automática
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Visualiza únicamente las Órdenes de Compra de <strong>{proveedorActivo.nombre}</strong>, con cálculo automático de peso y volumen desde tu catálogo de productos de papelería.
            </p>
          </div>

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
              1. Agendar Cita y Factura ({misOcsDisponiblesCount} libres)
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
              <span>2. Mis Etiquetas QR</span>
              <span className="bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
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
              3. Mis Citas ({misCitasFacturas.length})
            </button>
            <button
              type="button"
              onClick={() => setVistaActiva("BULTOS")}
              className={`px-3.5 py-2 rounded-lg text-xs font-extrabold transition flex items-center gap-1.5 ${
                vistaActiva === "BULTOS"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <span>4. Estado de Bultos</span>
              <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded-full text-[10px] font-black">
                {misCitasFacturas.reduce((total, cita) => total + (cita.bultos?.length || 0), 0)}
              </span>
            </button>
          </div>
        </div>

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

      {/* VISTA SIMULADOR ERP: EMISIÓN DE NUEVAS ÓRDENES DE COMPRA USANDO LA TABLA PRODUCTO */}
      {vistaActiva === "SIMULADOR_OC" && (
        <OcErpSimulator
          proveedorActivo={proveedorActivo}
          productosProveedor={misProductos}
          ordenesCompra={data?.ordenesCompra || []}
          sucursales={data?.sucursales || []}
          onOcCreada={handleOcNuevaCreada}
        />
      )}

      {/* VISTA 1: ASISTENTE DE AGENDAMIENTO + PARRILLA DE ANDENES + DESGLOSE DE BULTOS */}
      {vistaActiva === "AGENDAR" && (
        <form onSubmit={handleAgendar} className="space-y-6 no-print">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded">
                  Paso 1 · Mis Órdenes de Compra (Filtradas por idProveedor = {proveedorActivo.idProveedor})
                </span>
                <h2 className="text-lg font-bold mt-1">
                  Selección de Orden de Compra y Asignación Automática de Folio Fiscal CFDI
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setVistaActiva("SIMULADOR_OC")}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-3.5 py-2 rounded-lg transition shadow"
              >
                + Simular Nueva OC con mi Catálogo
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase text-slate-600">
                  1. Mis Órdenes de Compra Emitidas por el CEDIS ({misOrdenesCompra.length})
                </label>
                <select
                  value={idOc}
                  onChange={(e) => handleCambiarOC(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  {misOrdenesCompra.map((oc) => (
                    <option key={oc.idOc} value={oc.idOc}>
                      {oc.idOc} — {oc.proveedor}{" "}
                      {oc.citaFactura
                        ? `(Ya agendada con ${oc.citaFactura.folioFactura})`
                        : "(Disponible para Agendar)"}
                    </option>
                  ))}
                </select>

                {ocYaTieneCita ? (
                  <div className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 p-3 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <span>
                      ⚠️ Tu orden <span className="font-mono">{idOc}</span> ya tiene registrada la factura{" "}
                      <span className="font-mono">{ocActual.citaFactura.folioFactura}</span> en Andén #
                      {ocActual.citaFactura.anden}.
                    </span>
                    <button
                      type="button"
                      onClick={() => setVistaActiva("SIMULADOR_OC")}
                      className="bg-slate-900 text-white px-2.5 py-1 rounded text-[11px] font-extrabold"
                    >
                      Simular Nueva OC →
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 font-semibold">
                    ✓ OC adjudicada a <strong>{proveedorActivo.nombre}</strong> (idProveedor #{proveedorActivo.idProveedor}) ·{" "}
                    {ocActual?.lineas?.length || 0} partidas solicitadas.
                  </p>
                )}
              </div>

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
                    className="w-full border-2 border-slate-300 bg-slate-100 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black cursor-not-allowed select-none focus:outline-none"
                  />
                </div>

                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg font-medium">
                  ✓ Formato fiscal real <strong>CFDI-[RFC]-[AÑO]-[CONSECUTIVO]</strong> asignado automáticamente a{" "}
                  <strong>{proveedorActivo.nombre}</strong>.
                </p>
              </div>
            </div>
          </div>

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

          <div className="max-w-md">
            <DuracionClock
              duracionHoras={duracionHoras}
              setDuracionHoras={setDuracionHoras}
              horaInicio={horaInicio}
              anden={anden}
              fecha={fecha}
              citasFacturas={data?.citasFacturas || []}
              proveedorNombre={proveedorActivo.nombre}
            />
          </div>

          <PackingListBuilder
            ocActual={ocActual}
            productosProveedor={misProductos}
            sucursales={data?.sucursales || []}
            bultosForm={bultosForm}
            setBultosForm={setBultosForm}
            folioFactura={folioFactura}
          />

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-600">
              <p className="font-bold text-slate-900 text-sm">
                Resumen antes de confirmar: {idOc} ({proveedorActivo.nombre}) → Factura Fiscal {folioFactura}
              </p>
              <p>
                Andén #{anden} · Fecha {fecha} de {formatearHora(horaInicio)} a{" "}
                {formatearHora(horaInicio + duracionHoras)} hrs ({formatearDuracion(duracionHoras)} de descarga) ·{" "}
                {bultosForm.length} etiquetas QR por generar.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                enviando ||
                !ocActual ||
                folioDuplicado ||
                ocYaTieneCita ||
                Boolean(errorAgenda) ||
                Boolean(traslapeAnden) ||
                Boolean(traslapeProveedor) ||
                duracionInvalida
              }
              className={`px-6 py-3 rounded-xl font-extrabold text-sm transition shadow-md ${
                enviando ||
                !ocActual ||
                folioDuplicado ||
                ocYaTieneCita ||
                errorAgenda ||
                traslapeAnden ||
                traslapeProveedor ||
                duracionInvalida
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

      {vistaActiva === "ETIQUETAS" && (
        <QrLabelsSheet
          citasFacturas={misCitasFacturas}
          citaSeleccionadaQR={citaSeleccionadaQR}
          setCitaSeleccionadaQR={setCitaSeleccionadaQR}
          sucursales={data?.sucursales || []}
        />
      )}

      {vistaActiva === "CITAS" && (
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold">
                Mis Citas Programadas · {proveedorActivo.nombre} (idProveedor #{proveedorActivo.idProveedor})
              </h2>
              <p className="text-xs text-slate-400">
                Mostrando exclusivamente las entregas programadas por tu empresa en los 4 andenes del CEDIS.
              </p>
            </div>
          </div>

          {misCitasFacturas.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Aún no tienes citas programadas para tus Órdenes de Compra. Ve a la pestaña 1 para agendar tu primera entrega.
            </div>
          ) : (
            <div className="p-6 grid md:grid-cols-2 gap-4">
              {misCitasFacturas.map((cita) => {
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
                          ANDÉN #{cita.anden} · {cita.fecha} ({formatearHora(cita.horaInicio)} –{" "}
                          {formatearHora(cita.horaInicio + cita.duracionHoras)} · {formatearDuracion(cita.duracionHoras)})
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
                        <button
                          type="button"
                          onClick={() => {
                            setCitaSeleccionadaQR(cita);
                            setVistaActiva("BULTOS");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg"
                        >
                          Ver estado de bultos
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
          )}
        </div>
      )}

      {vistaActiva === "BULTOS" && (
        <BultosStatusPanel
          citas={misCitasFacturas}
          sucursales={data?.sucursales || []}
          citaSeleccionada={citaSeleccionadaQR}
          onSeleccionarCita={setCitaSeleccionadaQR}
          onVerEtiquetas={() => setVistaActiva("ETIQUETAS")}
        />
      )}
    </div>
  );
}
