"use client";

const ESTADOS = {
  IDLE: { texto: "Listo para leer", color: "bg-amber-400", textoColor: "text-amber-300" },
  VALIDANDO: { texto: "Validando", color: "bg-sky-400", textoColor: "text-sky-300" },
  LEIDO: { texto: "QR leído", color: "bg-sky-400", textoColor: "text-sky-300" },
  OK: { texto: "Bulto aceptado", color: "bg-emerald-400", textoColor: "text-emerald-300" },
  RECHAZADO: { texto: "Bulto rechazado", color: "bg-red-500", textoColor: "text-red-400" },
};

export default function HandheldShell({ anden, folio, estado, cargado, children, footer, overlay }) {
  const indicator = ESTADOS[estado] || ESTADOS.IDLE;

  return (
    <div className="min-h-[100dvh] w-full bg-slate-200 flex justify-center sm:p-4 md:p-0">
      <main className="relative w-full max-w-md h-[100dvh] sm:h-[844px] bg-white sm:rounded-[28px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-slate-300 md:max-w-none md:h-[100dvh] md:rounded-none md:shadow-none md:ring-0">
        <header className="shrink-0 px-5 pt-4 pb-3 bg-white border-b border-slate-200 md:px-8 md:pt-5 md:pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${indicator.color} ${
                    estado === "VALIDANDO" ? "animate-pulse" : ""
                  }`}
                />
                <p className={`text-[10px] font-black uppercase tracking-[0.14em] ${indicator.textoColor}`}>
                  {indicator.texto}
                </p>
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 truncate">
                Andén {String(anden ?? "–").padStart(2, "0")} · Recibo
              </h1>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {cargado ? "Sincronizado" : "Cargando…"}
              </p>
              <p className="font-mono text-xs font-bold text-slate-700 truncate max-w-[130px]">
                {folio || "SIN FACTURA"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain md:overflow-hidden">
          <div className="md:h-full md:grid md:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)] md:grid-rows-[auto_minmax(0,1fr)]">
            {children}
          </div>
        </div>

        {footer}
        {overlay}
      </main>
    </div>
  );
}
