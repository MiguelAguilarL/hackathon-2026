"use client";

function Campo({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{etiqueta}</p>
      <p className="font-mono text-sm font-bold truncate">{valor}</p>
    </div>
  );
}

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

export default function ScanResultCard({ estado, resultado, payload, bulto, contenido }) {
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
            <BloqueContenido contenido={resultado?.contenido || contenido} />
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
          <div>
            <p className="text-sm font-extrabold text-sky-900">Validando bulto…</p>
            <p className="font-mono text-xs text-sky-800 truncate">{payload?.idBulto}</p>
          </div>
        </div>
      </div>
    );
  }

  const rechazado = estado === "RECHAZADO";
  const sucursal = bulto?.sucursal;

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
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2.5">
                <Campo etiqueta="SKU" valor={payload?.sku} />
                <Campo etiqueta="Piezas" valor={`${payload?.piezas ?? 0} pzas`} />
                <Campo etiqueta="Rack destino" valor={sucursal?.rackAsignado} />
                <Campo etiqueta="Sucursal" valor={sucursal?.nombre} />
                <Campo etiqueta="Orden de compra" valor={payload?.idOc} />
                <Campo etiqueta="Factura" valor={payload?.folioFactura} />
                <Campo etiqueta="Peso" valor={bulto?.pesoKg ? `${bulto.pesoKg} kg` : null} />
                <Campo etiqueta="Volumen" valor={bulto?.volumenM3 ? `${bulto.volumenM3} m³` : null} />
              </div>
              <BloqueContenido contenido={contenido} />
            </>
          )}

          {rechazado && (
            <>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="bg-white/80 ring-1 ring-red-200 rounded px-2 py-1 font-mono text-[11px] font-bold text-red-900">
                  {payload?.idBulto || "Bulto sin identificador"}
                </span>
                <span className="bg-white/80 ring-1 ring-red-200 rounded px-2 py-1 font-mono text-[11px] font-bold text-red-900">
                  {payload?.sku || "SKU no leído"}
                </span>
              </div>
              <BloqueContenido contenido={contenido} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
