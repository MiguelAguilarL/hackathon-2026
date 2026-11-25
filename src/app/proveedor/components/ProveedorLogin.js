"use client";

import { useState } from "react";

const CUENTAS_DEMO = [
  {
    idProveedor: 1,
    nombre: "Papelera y Bobinas Nacionales S.A. de C.V.",
    correo: "ventas@papeleranacional.mx",
    password: "Papel2026*",
    detalle: "OC-2026-001 (Papel Bond Carta, Oficio y Cartulina Opalina)",
  },
  {
    idProveedor: 2,
    nombre: "Distribuidora Escolar y Cuadernos del Centro S.A.",
    correo: "logistica@escolardelcentro.mx",
    password: "Escolar2026*",
    detalle: "OC-2026-002 (Cuadernos Profesionales, Italianos y Libros Florete)",
  },
  {
    idProveedor: 3,
    nombre: "Artículos de Escritura y Oficina Globales S.A.",
    correo: "entregas@escrituraglobal.mx",
    password: "Oficina2026*",
    detalle: "OC-2026-003 (Bolígrafos, Registradores Lefort y Marcadores)",
  },
  {
    idProveedor: 4,
    nombre: "Suministros de Arte, Cartulinas y Didácticos S.A.",
    correo: "cedis@arteydidacticos.mx",
    password: "Arte2026*",
    detalle: "OC-2026-004 (Cartulina Bristol, Pinturas Acrílicas y Fomi)",
  },
];

export default function ProveedorLogin({ onLoginExitoso }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/proveedor/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No fue posible iniciar sesión.");
      } else if (onLoginExitoso) {
        onLoginExitoso(json.proveedor);
      }
    } catch {
      setError("Error de red al conectar con el servidor de autenticación.");
    } finally {
      setCargando(false);
    }
  };

  const seleccionarCuentaDemo = (cuenta) => {
    setCorreo(cuenta.correo);
    setPassword(cuenta.password);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden grid md:grid-cols-12">
        {/* Columna Izquierda: Formulario de Autenticación */}
        <div className="md:col-span-7 p-8 space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded">
              Acceso Seguro B2B · CEDIS Papelería Catlovers
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-3">
              Portal de Proveedores de Papelería
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Inicia sesión con tu cuenta de proveedor para visualizar tus Órdenes de Compra, calcular peso/volumen automático desde tu catálogo de productos y emitir tus etiquetas QR.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                Correo Electrónico del Proveedor
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="ventas@proveedorpapeleria.mx"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold uppercase text-slate-700">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                >
                  {mostrarPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                type={mostrarPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-3 rounded-xl shadow transition disabled:opacity-50"
            >
              {cargando ? "Verificando credenciales..." : "Ingresar al Portal del Proveedor →"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
            <span>🔒 Sesión protegida mediante Cookie HttpOnly firmada</span>
            <span>Catálogo Producto + OC por idProveedor</span>
          </div>
        </div>

        {/* Columna Derecha: Selector Rápido de Proveedores de Papelería */}
        <div className="md:col-span-5 bg-slate-900 text-white p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-amber-400 px-2.5 py-1 rounded border border-slate-700">
                Proveedores Oficiales de Papelería
              </span>
              <h2 className="text-base font-bold mt-2">
                Acceso Rápido para Demo
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en cualquier proveedor de papelería para autocompletar sus credenciales:
              </p>
            </div>

            <div className="space-y-2.5">
              {CUENTAS_DEMO.map((cuenta) => {
                const activo = correo.toLowerCase() === cuenta.correo.toLowerCase();
                return (
                  <button
                    key={cuenta.idProveedor}
                    type="button"
                    onClick={() => seleccionarCuentaDemo(cuenta)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      activo
                        ? "bg-amber-500 text-slate-950 border-amber-400 font-bold"
                        : "bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-slate-950/30">
                        idProveedor: #{cuenta.idProveedor}
                      </span>
                      <span className="text-[10px] font-mono opacity-80">{cuenta.correo}</span>
                    </div>
                    <p className="text-xs font-extrabold mt-1 truncate">{cuenta.nombre}</p>
                    <p className={`text-[11px] mt-0.5 ${activo ? "text-slate-900" : "text-slate-400"}`}>
                      {cuenta.detalle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
            Cada proveedor tiene su propio catálogo en la tabla <code className="text-amber-400">Producto</code> y sus órdenes en <code className="text-amber-400">OrdenCompra</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
