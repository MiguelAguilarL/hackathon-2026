"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DockCalendar from "./components/DockCalendar";
import PackingListBuilder, { calcularDimensionesBulto } from "./components/PackingListBuilder";
import QrLabelsSheet from "./components/QrLabelsSheet";
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
  const router = useRouter();
  const [proveedorActivo, setProveedorActivo] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const [data, setData] = useState(null);
  const [vistaActiva, setVistaActiva] = useState("AGENDAR"); // "AGENDAR" | "ETIQUETAS" | "CITAS" | "BULTOS"
  const [pasoWizard, setPasoWizard] = useState(1); // 1: Orden y Factura | 2: Fecha y Horario | 3: Desglose de Cajas

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
      const res = await fetch("/api/auth");
      const json = await res.json();
      if (json.autenticado && json.perfil === "proveedor") {
        setProveedorActivo(json.usuario);
        await cargarDatos(json.usuario);
      } else {
        router.replace("/");
      }
    } finally {
      setVerificandoSesion(false);
    }
  };

  useEffect(() => {
    verificarSesionInicial();
  }, []);

  const handleCerrarSesion = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    setProveedorActivo(null);
    setCitaSeleccionadaQR(null);
    setMensaje(null);
    setError(null);
    router.replace("/");
  };

  if (verificandoSesion) {
    return (
      <div className="p-10 text-center text-sm text-slate-500 font-medium">
        Cargando tu portal de proveedor...
      </div>
    );
  }

  if (!proveedorActivo) {
    return (
      <div className="p-10 text-center text-sm text-slate-500 font-medium">
        Redirigiendo al inicio de sesión...
      </div>
    );
  }

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
      setError("Selecciona una Orden de Compra.");
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
          ? `El Andén #${anden} ya está ocupado de ${formatearHora(ini / 60)} a ${formatearHora(fin / 60)} hrs. Elige otro horario o andén.`
          : `Ya tienes una cita registrada de ${formatearHora(ini / 60)} a ${formatearHora(fin / 60)} hrs en el Andén #${cita.anden}.`
      );
      return;
    }

    if (ocYaTieneCita) {
      setError(
        `La Orden de Compra ${idOc} ya fue agendada con la factura ${ocActual.citaFactura.folioFactura}. Selecciona otra orden disponible.`
      );
      return;
    }

    if (folioDuplicado) {
      setError(`El folio de factura "${folioFactura}" ya está registrado.`);
      return;
    }

    if (bultosForm.length === 0 || bultosForm.some((b) => !Number(b.piezas) || Number(b.piezas) <= 0)) {
      setError("Registra al menos una caja con una cantidad de piezas válida.");
      return;
    }

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
        setError(`El producto ${sku} para la sucursal ${sucursalStr} no forma parte de esta Orden de Compra.`);
        return;
      }
      if (declaradas > linea.piezasPedidas) {
        setError(
          `La cantidad de ${sku} (Sucursal ${sucursalStr}) supera lo solicitado en la orden (${declaradas} de ${linea.piezasPedidas} piezas).`
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
          `Cita confirmada en el Andén #${anden} (${formatearHora(horaInicio)} a ${formatearHora(horaInicio + duracionHoras)} hrs). Tus ${json.cita.bultos.length} etiquetas QR están listas para imprimir.`
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
  const totalBultosRegistrados = misCitasFacturas.reduce((total, cita) => total + (cita.bultos?.length || 0), 0);

  // Motivo claro por el cual el botón de confirmar estaría deshabilitado
  const motivoBloqueoConfirmar = !ocActual
    ? "No tienes ninguna Orden de Compra seleccionada en el Paso 1."
    : ocYaTieneCita
    ? `La orden ${ocActual.idOc} ya fue agendada anteriormente (Factura ${ocActual.citaFactura.folioFactura}). Elige otra orden pendiente en el Paso 1 o inicia sesión con otro proveedor.`
    : folioDuplicado
    ? `El folio de factura ${folioFactura} ya está registrado.`
    : errorAgenda
    ? errorAgenda
    : traslapeAnden
    ? `El Andén #${anden} ya está ocupado en el horario elegido (${formatearHora(horaInicio)} a ${formatearHora(horaInicio + duracionHoras)}). Cambia la hora o el andén en el Paso 2.`
    : traslapeProveedor
    ? `Tu empresa ya tiene otra cita registrada en ese mismo horario (Andén #${traslapeProveedor.anden}). Elige otra hora o fecha en el Paso 2.`
    : duracionInvalida
    ? "La duración de descarga debe ser de entre 1:00 y 2:00 hrs y terminar antes de las 18:00 hrs."
    : null;

  return (
    <div className="space-y-6">
      {/* Encabezado Único, Limpio y Claro para el Proveedor */}
      <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Portal de Proveedores · CEDIS MJJO
            </span>
            <h1 className="text-lg md:text-xl font-extrabold text-white mt-0.5">
              {proveedorActivo.nombre}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden sm:inline text-xs text-slate-300">{proveedorActivo.correo}</span>
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs px-3.5 py-2 rounded-xl transition"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Navegación Principal del Proveedor */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setVistaActiva("AGENDAR")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                vistaActiva === "AGENDAR"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Agendar Entrega {misOcsDisponiblesCount > 0 ? `(${misOcsDisponiblesCount})` : ""}
            </button>

            <button
              type="button"
              onClick={() => setVistaActiva("ETIQUETAS")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                vistaActiva === "ETIQUETAS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <span>Etiquetas QR</span>
              {citaSeleccionadaQR?.bultos?.length > 0 && (
                <span className="bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full text-[10px] font-black">
                  {citaSeleccionadaQR.bultos.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setVistaActiva("CITAS")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                vistaActiva === "CITAS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              Mis Citas ({misCitasFacturas.length})
            </button>

            <button
              type="button"
              onClick={() => setVistaActiva("BULTOS")}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                vistaActiva === "BULTOS"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <span>Seguimiento de Cajas</span>
              {totalBultosRegistrados > 0 && (
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.2 rounded-full text-[10px] font-black">
                  {totalBultosRegistrados}
                </span>
              )}
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden lg:inline">
            Horario de recepción en CEDIS: 08:00 a 18:00 hrs
          </span>
        </div>
      </div>

      {/* Avisos de error o confirmación */}
      {error && (
        <div className="no-print p-4 rounded-xl bg-red-50 border border-red-300 text-red-900 text-sm font-semibold flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline ml-4">
            Cerrar
          </button>
        </div>
      )}
      {mensaje && (
        <div className="no-print p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-sm font-semibold flex flex-wrap items-center justify-between gap-3">
          <span>{mensaje}</span>
          <button
            type="button"
            onClick={() => setVistaActiva("BULTOS")}
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg"
          >
            Ver seguimiento de cajas →
          </button>
        </div>
      )}

      {/* SECCIÓN 1: AGENDAR ENTREGA (ORGANIZADA PASO A PASO SIN AMONTONAR COMPONENTES) */}
      {vistaActiva === "AGENDAR" && (
        <form onSubmit={handleAgendar} className="space-y-6 no-print">
          {/* Barra de Progreso de los 3 Pasos */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                num: 1,
                titulo: "1. Orden de Compra y Factura",
                resumen: ocActual ? `${ocActual.idOc} · ${folioFactura}` : "Selecciona una orden",
              },
              {
                num: 2,
                titulo: "2. Fecha, Andén y Horario",
                resumen: `Andén #${anden} · ${fecha} (${formatearHora(horaInicio)} - ${formatearHora(horaInicio + duracionHoras)})`,
              },
              {
                num: 3,
                titulo: "3. Desglose de Cajas y Confirmación",
                resumen: `${bultosForm.length} cajas listas para etiquetar`,
              },
            ].map((p) => {
              const activo = pasoWizard === p.num;
              return (
                <button
                  key={p.num}
                  type="button"
                  onClick={() => setPasoWizard(p.num)}
                  className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between gap-3 ${
                    activo
                      ? "bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/40"
                      : "bg-slate-50/70 hover:bg-slate-100 border-slate-200"
                  }`}
                >
                  <div>
                    <p className={`text-xs font-extrabold ${activo ? "text-slate-900" : "text-slate-600"}`}>
                      {p.titulo}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.resumen}</p>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full text-xs font-black grid place-items-center shrink-0 ${
                      activo ? "bg-amber-500 text-slate-950" : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {p.num}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CONTENIDO DEL PASO 1: ORDEN DE COMPRA Y FACTURA */}
          {pasoWizard === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">
                  Paso 1: Selecciona tu Orden de Compra
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Elige la Orden de Compra que vas a entregar. El sistema asignará automáticamente el folio único de tu factura.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Orden de Compra a entregar
                  </label>
                  <select
                    value={idOc}
                    onChange={(e) => handleCambiarOC(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-bold bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {misOrdenesCompra.map((oc) => (
                      <option key={oc.idOc} value={oc.idOc}>
                        {oc.idOc} {oc.citaFactura ? `— Ya agendada (${oc.citaFactura.folioFactura})` : "— Pendiente de entrega"}
                      </option>
                    ))}
                  </select>

                  {ocYaTieneCita ? (
                    <div className="text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-200 p-3 rounded-xl">
                      Esta Orden de Compra ya tiene una cita programada en el Andén #{ocActual.citaFactura.anden} con la factura{" "}
                      <span className="font-mono font-bold">{ocActual.citaFactura.folioFactura}</span>.
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700 font-medium">
                      ✓ Orden disponible para programar entrega ({ocActual?.lineas?.length || 0} productos solicitados).
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Folio de Factura asignado
                  </label>
                  <input
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={folioFactura}
                    onKeyDown={(e) => e.preventDefault()}
                    onPaste={(e) => e.preventDefault()}
                    className="w-full border border-slate-200 bg-slate-100 text-slate-900 rounded-xl px-3.5 py-2.5 text-sm font-mono font-black cursor-default select-none focus:outline-none"
                  />
                  <p className="text-xs text-slate-500">
                    Folio único vinculado a esta Orden de Compra.
                  </p>
                </div>
              </div>

              {/* Resumen limpio de lo que pidió el CEDIS en esta OC */}
              {ocActual?.lineas?.length > 0 && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700">
                    Productos solicitados en la orden {ocActual.idOc}:
                  </h3>
                  <div className="grid md:grid-cols-3 gap-3">
                    {ocActual.lineas.map((l) => (
                      <div key={l.id} className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{l.sku}</span>
                          <span className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            Sucursal {String(l.sucursalId).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="text-slate-500 mt-1 line-clamp-2">{l.descripcion}</p>
                        <p className="text-sm font-extrabold text-slate-900 mt-2">
                          {l.piezasPedidas} piezas solicitadas
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setPasoWizard(2)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                >
                  Siguiente: Elegir Fecha y Andén →
                </button>
              </div>
            </div>
          )}

          {/* CONTENIDO DEL PASO 2: FECHA, ANDÉN Y RELOJ DE DURACIÓN (LADO A LADO, ORDENADOS) */}
          {pasoWizard === 2 && (
            <div className="space-y-4">
              <div className="grid lg:grid-cols-12 gap-6 items-stretch">
                <div className="lg:col-span-8">
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
                </div>
                <div className="lg:col-span-4">
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
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setPasoWizard(1)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2"
                >
                  ← Volver al Paso 1
                </button>
                <button
                  type="button"
                  onClick={() => setPasoWizard(3)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
                >
                  Siguiente: Desglose de Cajas →
                </button>
              </div>
            </div>
          )}

          {/* CONTENIDO DEL PASO 3: DESGLOSE DE CAJAS Y CONFIRMACIÓN FINAL */}
          {pasoWizard === 3 && (
            <div className="space-y-6">
              <PackingListBuilder
                ocActual={ocActual}
                productosProveedor={misProductos}
                sucursales={data?.sucursales || []}
                bultosForm={bultosForm}
                setBultosForm={setBultosForm}
                folioFactura={folioFactura}
              />

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                {motivoBloqueoConfirmar && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
                    <span>⚠️ Para activar el botón: {motivoBloqueoConfirmar}</span>
                    {ocYaTieneCita && (
                      <button
                        type="button"
                        onClick={() => setVistaActiva("ETIQUETAS")}
                        className="bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold"
                      >
                        Ver sus etiquetas QR ya generadas →
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setPasoWizard(2)}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-2"
                    >
                      ← Cambiar Horario
                    </button>
                    <div className="text-xs text-slate-600 border-l border-slate-200 pl-4">
                      <p className="font-bold text-slate-900 text-sm">
                        Orden {idOc} · Factura {folioFactura}
                      </p>
                      <p>
                        Andén #{anden} · {fecha} de {formatearHora(horaInicio)} a{" "}
                        {formatearHora(horaInicio + duracionHoras)} hrs ({formatearDuracion(duracionHoras)} hrs) ·{" "}
                        {bultosForm.length} cajas por etiquetar.
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={enviando || Boolean(motivoBloqueoConfirmar)}
                    className={`px-6 py-3 rounded-xl font-extrabold text-sm transition shadow-sm ${
                      enviando || motivoBloqueoConfirmar
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer"
                    }`}
                  >
                    {enviando
                      ? "Confirmando cita..."
                      : "Confirmar Cita y Generar Etiquetas QR →"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {/* SECCIÓN 2: ETIQUETAS QR */}
      {vistaActiva === "ETIQUETAS" && (
        <QrLabelsSheet
          citasFacturas={misCitasFacturas}
          citaSeleccionadaQR={citaSeleccionadaQR}
          setCitaSeleccionadaQR={setCitaSeleccionadaQR}
          sucursales={data?.sucursales || []}
        />
      )}

      {/* SECCIÓN 3: MIS CITAS PROGRAMADAS */}
      {vistaActiva === "CITAS" && (
        <div className="no-print bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-lg font-extrabold text-slate-900">Mis Citas Programadas</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulta tus entregas agendadas, descarga tus etiquetas QR o revisa el avance de recepción de tus cajas.
            </p>
          </div>

          {misCitasFacturas.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Aún no tienes citas programadas. Ve a &quot;Agendar Entrega&quot; para registrar tu primera cita.
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
                    className="p-5 rounded-xl border border-slate-200 bg-white flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-md">
                          Andén #{cita.anden} · {cita.fecha} ({formatearHora(cita.horaInicio)} a{" "}
                          {formatearHora(cita.horaInicio + cita.duracionHoras)} hrs)
                        </span>
                        <h3 className="text-base font-extrabold text-slate-900 mt-2">
                          Orden {cita.idOc} · Factura <span className="font-mono">{cita.folioFactura}</span>
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                        {cita.bultos?.length || 0} cajas
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-xs">
                      <span className="text-slate-500">
                        Recibidas: <strong className="text-slate-800">{bultosRecibidos}</strong> · En espera:{" "}
                        <strong className="text-slate-800">{bultosPendientes}</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCitaSeleccionadaQR(cita);
                            setVistaActiva("ETIQUETAS");
                          }}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3.5 py-1.5 rounded-lg"
                        >
                          Etiquetas QR
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCitaSeleccionadaQR(cita);
                            setVistaActiva("BULTOS");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3.5 py-1.5 rounded-lg"
                        >
                          Seguimiento
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 4: SEGUIMIENTO DE BULTOS */}
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
