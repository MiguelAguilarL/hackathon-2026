"use client";

function Icono({ tipo }) {
  const comun = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.4, className: "w-7 h-7" };
  if (tipo === "ok") {
    return (
      <svg {...comun}>
        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tipo === "error") {
    return (
      <svg {...comun}>
        <path d="M12 8v5m0 3.5h.01M10.3 3.9 2.6 17.2A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg {...comun} className="w-7 h-7 animate-spin">
      <path d="M21 12a9 9 0 1 1-6.2-8.6" strokeLinecap="round" />
    </svg>
  );
}

function BloqueContenido({ contenido }) {
  if (!contenido) return null;
  return (
    <div className="mt-2">
      <p className="text-[10px] font-black uppercase tracking-wider opacity-70">Contenido del QR</p>
      <pre className="mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-white/80 ring-1 ring-current/20 p-2 font-mono text-[11px] leading-snug text-slate-800">
        {contenido}
      </pre>
    </div>
  );
}

function BotonEscanearOtro({ onClick, rechazado = false }) {
  if (typeof onClick !== "function") return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3.5 text-xs font-extrabold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
        rechazado
          ? "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-500"
          : "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-4 h-4">
        <path
          d="M4 7V5a2 2 0 0 1 2-2h2M16 3h2a2 2 0 0 1 2 2v2M20 17v2a2 2 0 0 1-2 2h-2M8 21H6a2 2 0 0 1-2-2v-2M7 12h10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Escanear otro QR
    </button>
  );
}

// Muestra literalmente los campos de la etiqueta CEDIS (idBulto, idOc, folioFactura,
// proveedor, sucursalId, sku y piezas) y, cuando existe, la información enriquecida
// que devuelve la API (rack, nombre de sucursal, peso y volumen).
function DatosEtiquetaQR({ datos, bulto }) {
  const piezas = datos?.piezas === undefined || datos?.piezas === null ? null : `${datos.piezas} pzas`;
  const campos = [
    ["ID de bulto", datos?.idBulto],
    ["Orden de compra", datos?.idOc],
    ["Folio de factura", datos?.folioFactura],
    ["Proveedor", datos?.proveedor],
    ["Sucursal destino (ID)", datos?.sucursalId],
    ["SKU", datos?.sku],
    ["Piezas", piezas],
  ];
  const visibles = campos.filter(([, valor]) => valor !== undefined && valor !== null && valor !== "");
  if (visibles.length === 0) return null;

  const extras = [
    ["Rack destino", bulto?.sucursal?.rackAsignado],
    ["Sucursal", bulto?.sucursal?.nombre],
    ["Peso", bulto?.pesoKg ? `${bulto.pesoKg} kg` : null],
    ["Volumen", bulto?.volumenM3 ? `${bulto.volumenM3} m³` : null],
  ].filter(([, valor]) => valor);

  return (
    <div className="mt-2.5 rounded-lg bg-white/70 ring-1 ring-current/15 p-2.5">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-black uppercase tracking-wider opacity-75">
          Datos leídos de la etiqueta QR
        </p>
        <span className="text-[9px] font-bold uppercase opacity-60">{visibles.length}/7 campos</span>
      </div>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {visibles.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="min-w-0">
            <dt className="text-[9px] font-bold uppercase tracking-wide opacity-60">{etiqueta}</dt>
            <dd className="font-mono text-[11px] font-bold break-words leading-tight">{valor}</dd>
          </div>
        ))}
      </dl>
      {extras.length > 0 && (
        <div className="mt-2 pt-2 border-t border-current/15 grid grid-cols-2 gap-x-3 gap-y-1.5">
          {extras.map(([etiqueta, valor]) => (
            <div key={etiqueta} className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-wide opacity-60">{etiqueta}</p>
              <p className="font-mono text-[11px] font-bold break-words leading-tight">{valor}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ScanResultCard({ estado, resultado, payload, bulto, contenido, onEscanearOtro }) {
  if (estado === "IDLE") {
    return (
      <div className="px-5 py-3 bg-white border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500">
          Apunta la cámara a cualquier código QR. Si es una etiqueta CEDIS se valida contra la orden de compra; si no,
          verás su contenido exacto.
        </p>
      </div>
    );
  }

  if (estado === "LEIDO") {
    return (
      <div role="status" aria-live="polite" className="px-5 py-3.5 bg-sky-50 border-b border-sky-200">
        <div className="flex items-start gap-3">
          <span className="shrink-0 mt-0.5 text-sky-700">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="w-7 h-7">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-700">QR leído correctamente</p>
            <p className="text-sm font-bold text-sky-950 mt-0.5">
              {resultado?.motivo || "Este QR no es una etiqueta CEDIS. Aquí está lo que contiene:"}
            </p>
            <DatosEtiquetaQR datos={resultado?.campos} />
            <BloqueContenido contenido={resultado?.contenido || contenido} />
            <BotonEscanearOtro onClick={onEscanearOtro} />
          </div>
        </div>
      </div>
    );
  }

  if (estado === "VALIDANDO") {
    return (
      <div role="status" aria-live="polite" className="px-5 py-4 bg-sky-50 border-b border-sky-200">
        <div className="flex items-center gap-3">
          <span className="text-sky-700">
            <Icono tipo="cargando" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-sky-900">Validando bulto…</p>
            <p className="font-mono text-xs text-sky-800 truncate">{payload?.idBulto}</p>
            <DatosEtiquetaQR datos={payload} />
          </div>
        </div>
      </div>
    );
  }

  const rechazado = estado === "RECHAZADO";

  return (
    <div
      role={rechazado ? "alert" : "status"}
      aria-live={rechazado ? "assertive" : "polite"}
      className={`px-5 py-3.5 border-b ${
        rechazado ? "bg-red-50 border-red-200" : "bg-emerald-50 border-emerald-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`shrink-0 mt-0.5 ${rechazado ? "text-red-600" : "text-emerald-600"}`}>
          <Icono tipo={rechazado ? "error" : "ok"} />
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${rechazado ? "text-red-700" : "text-emerald-700"}`}>
            {rechazado ? "Cero tolerancia · Bulto rechazado" : "Validación exitosa"}
          </p>
          <p className={`text-sm font-bold leading-snug mt-0.5 ${rechazado ? "text-red-950" : "text-emerald-950"}`}>
            {resultado?.motivo || resultado?.mensaje || "Resultado procesado."}
          </p>

          {!rechazado && (
            <>
              <span className="inline-flex items-center gap-1 mt-1.5 rounded-full bg-emerald-100 ring-1 ring-emerald-300 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-emerald-800">
                ✓ En orden de compra
              </span>
              <DatosEtiquetaQR datos={payload} bulto={bulto} />
              <BloqueContenido contenido={contenido} />
            </>
          )}

          {rechazado && (
            <>
              <DatosEtiquetaQR datos={payload || resultado?.campos} />
              <BloqueContenido contenido={contenido} />
            </>
          )}

          <BotonEscanearOtro onClick={onEscanearOtro} rechazado={rechazado} />
        </div>
      </div>
    </div>
  );
}
