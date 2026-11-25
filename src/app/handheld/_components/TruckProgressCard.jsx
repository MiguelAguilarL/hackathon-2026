"use client";

export default function TruckProgressCard({ cita, sucursal, reporteFaltantes, onAuditar, onCerrarReporte }) {
  if (!cita) {
    return (
      <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500">
          No hay citas activas. Agenda una entrega en el portal de proveedores para comenzar.
        </p>
      </div>
    );
  }

  const bultos = cita.bultos || [];
  const recibidos = bultos.filter((bulto) => bulto.estado === "EN_RACK").length;
  const total = bultos.length;
  const progreso = total ? Math.round((recibidos / total) * 100) : 0;
  const restantes = Math.max(total - recibidos, 0);
  const faltantes = reporteFaltantes ? bultos.filter((bulto) => bulto.estado === "PENDIENTE_RECIBO") : [];

  return (
    <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Descarga en curso</p>
          <p className="font-mono text-sm font-extrabold text-slate-900 truncate">{cita.folioFactura}</p>
          <p className="text-[11px] font-medium text-slate-500 truncate">
            {cita.proveedor} · Andén {String(cita.anden).padStart(2, "0")}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-2xl font-black leading-none text-sky-700">{restantes}</p>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">bultos por recibir</p>
        </div>
      </div>

      <div>
        <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full bg-sky-600 rounded-full transition-[width] duration-300" style={{ width: `${progreso}%` }} />
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500 mt-1">
          <span>{recibidos} de {total} bultos en rack</span>
          <span>{progreso}%</span>
        </div>
      </div>

      {sucursal && (
        <div className="flex items-center gap-2 rounded-lg bg-white ring-1 ring-slate-200 px-2.5 py-1.5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-sky-700 shrink-0">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-[11px] font-semibold text-slate-700 truncate">
            Próximo destino: <strong className="font-mono">{sucursal.rackAsignado}</strong> · {sucursal.nombre}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onAuditar}
        className="w-full min-h-[40px] rounded-lg bg-white ring-1 ring-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
      >
        Auditar faltantes de esta factura
      </button>

      {reporteFaltantes && (
        <div className="rounded-lg bg-amber-50 ring-1 ring-amber-300 px-3 py-2 text-[11px] text-amber-950">
          <div className="flex items-start justify-between gap-2">
            <p className="font-black uppercase tracking-wide">
              Auditoría {reporteFaltantes.folioFactura}
            </p>
            <button
              type="button"
              onClick={onCerrarReporte}
              className="min-h-[44px] min-w-[44px] font-bold text-amber-800 hover:text-amber-950"
              aria-label="Cerrar auditoría"
            >
              ✕
            </button>
          </div>
          {faltantes.length === 0 ? (
            <p className="mt-1 font-semibold text-emerald-800">Recepción completa. Todos los bultos están en rack.</p>
          ) : (
            <ul className="mt-1 space-y-0.5 list-disc list-inside">
              {faltantes.map((bulto) => (
                <li key={bulto.idBulto}>
                  <span className="font-mono font-bold">{bulto.idBulto}</span> · {bulto.sku} ({bulto.piezas} pzas)
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
