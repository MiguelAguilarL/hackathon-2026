import Link from "next/link";
import { CEDIS_RULES } from "@/lib/prisma";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
              Reto Logística · CEDIS (100m × 40m · 32 Sucursales)
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2 text-slate-900">
              Sistema Integral: De la Orden de Compra al Embarque
            </h1>
            <p className="text-slate-600 mt-1">
              Arquitectura modular en JavaScript lista para desarrollo paralelo por los 3 desarrolladores del equipo Catlovers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-semibold">Andenes</p>
            <p className="text-xl font-bold text-slate-900">4 Recibo / 3 Salida</p>
            <p className="text-xs text-slate-500 mt-1">Horario corrido 08:00 - 18:00</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-semibold">Almacenamiento</p>
            <p className="text-xl font-bold text-slate-900">32 Racks (1/Sucursal)</p>
            <p className="text-xs text-slate-500 mt-1">4 niveles × 8 tarimas = 32 tarimas</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
            <p className="text-xs text-slate-500 uppercase font-semibold">Capacidad Tortón (100%)</p>
            <p className="text-xl font-bold text-slate-900">12 Tarimas / 12 Ton</p>
            <p className="text-xs text-slate-500 mt-1">
              Máx {CEDIS_RULES.TORTON_MAX_PESO_KG.toLocaleString()} kg · {CEDIS_RULES.TORTON_MAX_VOLUMEN_M3.toFixed(2)} m³
            </p>
          </div>
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-xs text-amber-800 uppercase font-semibold">Candado Salida (≥90%)</p>
            <p className="text-xl font-bold text-amber-900">
              ≥ {CEDIS_RULES.TORTON_MIN_PESO_90_KG.toLocaleString()} kg
            </p>
            <p className="text-xs text-amber-800 mt-1">
              y ≥ {CEDIS_RULES.TORTON_MIN_VOLUMEN_90_M3.toFixed(2)} m³
            </p>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6">
        <Link
          href="/proveedor"
          className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-amber-500 transition flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded">
              DEV 1 · Momentos 1 y 2
            </span>
            <h2 className="text-xl font-bold mt-3 group-hover:text-amber-600 transition">
              Portal de Proveedores (Agendamiento y QR)
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Programación de citas en andenes 1-4 sin traslapes (08:00-18:00), registro de folio único de factura ligada a OC, desglose por bulto (1 SKU por bulto) e impresión de etiquetas QR.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-amber-600">Ir a /proveedor →</span>
        </Link>

        <Link
          href="/ordenes"
          className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-emerald-500 transition flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">
              DEV 2 · Órdenes
            </span>
            <h2 className="text-xl font-bold mt-3 group-hover:text-emerald-600 transition">
              Órdenes · Simulador de OC con Catálogo
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Emisión de Órdenes de Compra usando el catálogo de productos del proveedor, con cálculo automático de peso y volumen por partida y folio consecutivo oficial.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-emerald-600">Ir a /ordenes →</span>
        </Link>

        <Link
          href="/embarques"
          className="group bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-blue-500 transition flex flex-col justify-between"
        >
          <div>
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded">
              DEV 3 · Momento 4
            </span>
            <h2 className="text-xl font-bold mt-3 group-hover:text-blue-600 transition">
              Control de 32 Racks y Embarques Tortón
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              Visualización de ocupación de los 32 racks por sucursal, candado del ≥90% en peso y volumen para camión Tortón y emisión de Relación de Embarque en PDF/Láser con QR maestro.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-blue-600">Ir a /embarques →</span>
        </Link>
      </section>
    </div>
  );
}
