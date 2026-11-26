"use client";

import { useState } from "react";
import Link from "next/link";

const CUENTAS_DEMO = [
  {
    idEmpleado: "EMP-COMP-01",
    nombre: "Laura Méndez Ríos",
    area: "Compras",
    puesto: "Compradora de Papelería",
    correo: "compras@catlovers.mx",
    password: "Compras2026*",
  },
  {
    idEmpleado: "EMP-CEDIS-02",
    nombre: "Diego Salazar Nava",
    area: "CEDIS",
    puesto: "Coordinador de Almacén",
    correo: "cedis@catlovers.mx",
    password: "Cedis2026*",
  },
  {
    idEmpleado: "EMP-ALM-03",
    nombre: "Mariana Ortega Paz",
    area: "Almacén",
    puesto: "Jefa de Recepción",
    correo: "almacen@catlovers.mx",
    password: "Almacen2026*",
  },
];

export default function OrdenesLogin({ onLoginExitoso }) {
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
      const res = await fetch("/ordenes/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No fue posible iniciar sesión.");
      } else if (onLoginExitoso) {
        onLoginExitoso(json.empleado);
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
        {/* Formulario de acceso al portal de Órdenes */}
        <div className="md:col-span-7 p-8 space-y-6">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded">
              Acceso Interno · Portal de Órdenes
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-3">
              Órdenes · Simulador de OC con Catálogo
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Portal exclusivo para <strong>personal de Catlovers</strong>. Inicia sesión con tu
              cuenta corporativa para emitir Órdenes de Compra usando el catálogo del proveedor
              seleccionado, con cálculo automático de peso y volumen.
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
                Correo Corporativo
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="compras@catlovers.mx"
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm py-3 rounded-xl shadow transition disabled:opacity-50"
            >
              {cargando ? "Verificando credenciales..." : "Ingresar al Portal de Órdenes →"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>🔒 Sesión protegida mediante Cookie HttpOnly firmada</span>
            <Link href="/proveedor" className="font-bold text-blue-600 hover:text-blue-800">
              ¿Eres proveedor? Ir al Portal Proveedor →
            </Link>
          </div>
        </div>

        {/* Selector rápido de cuentas internas para la demo */}
        <div className="md:col-span-5 bg-slate-900 text-white p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-blue-300 px-2.5 py-1 rounded border border-slate-700">
                Personal Autorizado Catlovers
              </span>
              <h2 className="text-base font-bold mt-2">Acceso Rápido para Demo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Haz clic en cualquier cuenta interna para autocompletar sus credenciales:
              </p>
            </div>

            <div className="space-y-2.5">
              {CUENTAS_DEMO.map((cuenta) => {
                const activo = correo.toLowerCase() === cuenta.correo.toLowerCase();
                return (
                  <button
                    key={cuenta.idEmpleado}
                    type="button"
                    onClick={() => seleccionarCuentaDemo(cuenta)}
                    className={`w-full text-left p-3 rounded-xl border transition ${
                      activo
                        ? "bg-blue-500 text-white border-blue-400 font-bold"
                        : "bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-slate-950/30">
                        {cuenta.idEmpleado}
                      </span>
                      <span className="text-[10px] font-mono opacity-80">{cuenta.area}</span>
                    </div>
                    <p className="text-xs font-extrabold mt-1 truncate">{cuenta.nombre}</p>
                    <p className={`text-[11px] mt-0.5 ${activo ? "text-slate-100" : "text-slate-400"}`}>
                      {cuenta.puesto} · {cuenta.correo}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800">
            La sesión corporativa es independiente del acceso de proveedores. Cada proveedor
            conserva su propio catálogo en la tabla{" "}
            <code className="text-blue-300">Producto</code> y sus órdenes en{" "}
            <code className="text-blue-300">OrdenCompra</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
