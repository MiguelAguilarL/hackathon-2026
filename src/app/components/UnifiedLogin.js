"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CUENTAS_DEMO,
  PERFILES,
  PERFILES_DEMO,
  RUTA_POR_PERFIL,
} from "@/lib/cuentasDemo";

export default function UnifiedLogin() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(PERFILES.PROVEEDOR);
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const res = await fetch("/api/auth");
        const json = await res.json();
        if (json.autenticado && json.ruta) {
          router.replace(json.ruta);
          return;
        }
      } catch {
        // Sin sesión: se muestra el formulario de acceso.
      } finally {
        setVerificando(false);
      }
    };

    verificarSesion();
  }, [router]);

  const cambiarPerfil = (nuevoPerfil) => {
    setPerfil(nuevoPerfil);
    setCorreo("");
    setPassword("");
    setError(null);
  };

  const seleccionarCuenta = (cuenta) => {
    setCorreo(cuenta.correo);
    setPassword(cuenta.password);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ perfil, correo, password }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No fue posible iniciar sesión.");
        return;
      }

      router.replace(json.ruta || RUTA_POR_PERFIL[perfil]);
    } catch {
      setError("Error de red al conectar con el servidor de autenticación.");
    } finally {
      setCargando(false);
    }
  };

  const cuentas = CUENTAS_DEMO[perfil] || [];
  const perfilActivo = PERFILES_DEMO.find((p) => p.id === perfil);

  if (verificando) {
    return (
      <div className="p-10 text-center text-sm text-slate-500 font-medium">
        Verificando sesión...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <span className="text-[11px] font-black uppercase tracking-wider bg-amber-500 text-slate-950 px-2.5 py-1 rounded">
          CEDIS MJJO · Acceso único
        </span>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mt-3">
          Inicia sesión para continuar
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Selecciona tu perfil. Cada perfil solo podrá acceder a su módulo autorizado.
        </p>

        <div className="grid md:grid-cols-3 gap-3 mt-5">
          {PERFILES_DEMO.map((opcion) => {
            const activo = perfil === opcion.id;
            return (
              <button
                key={opcion.id}
                type="button"
                onClick={() => cambiarPerfil(opcion.id)}
                className={`text-left p-4 rounded-xl border-2 transition ${
                  activo
                    ? "border-blue-600 bg-blue-50 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    activo ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {activo ? "Perfil seleccionado" : "Seleccionar"}
                </span>
                <p className="text-sm font-extrabold text-slate-900 mt-2">{opcion.titulo}</p>
                <p className="text-xs text-slate-500 mt-0.5">{opcion.descripcion}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid md:grid-cols-12 gap-6">
        <section className="md:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
          <h2 className="text-lg font-extrabold text-slate-900">
            Acceso como {perfilActivo?.titulo}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Serás redirigido a <code className="font-bold">{perfilActivo?.ruta}</code> al iniciar sesión.
          </p>

          {error && (
            <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs font-bold">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 mb-1.5">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                autoComplete="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="nombre@correo.com"
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
              {cargando ? "Verificando credenciales..." : `Ingresar como ${perfilActivo?.titulo} →`}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 mt-5 pt-4 border-t border-slate-200">
            🔒 Sesión única protegida con Cookie HttpOnly firmada. El acceso queda restringido al módulo de tu perfil.
          </p>
        </section>

        <aside className="md:col-span-5 bg-slate-900 text-white rounded-2xl shadow-lg p-6">
          <span className="text-[10px] font-black uppercase tracking-wider bg-slate-800 text-blue-300 px-2.5 py-1 rounded border border-slate-700">
            Cuentas demo · {perfilActivo?.titulo}
          </span>
          <h2 className="text-base font-bold mt-2">Acceso rápido para la demo</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Haz clic en una cuenta para autocompletar credenciales:
          </p>

          <div className="mt-4 space-y-2.5">
            {cuentas.map((cuenta) => (
              <button
                key={cuenta.correo}
                type="button"
                onClick={() => seleccionarCuenta(cuenta)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  correo.toLowerCase() === cuenta.correo.toLowerCase()
                    ? "bg-blue-500 text-white border-blue-400 font-bold"
                    : "bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700"
                }`}
              >
                <p className="text-xs font-extrabold truncate">{cuenta.nombre}</p>
                <p className="text-[11px] mt-0.5 opacity-80">{cuenta.correo}</p>
                <p className={`text-[10px] mt-0.5 ${correo === cuenta.correo ? "text-slate-100" : "text-slate-400"}`}>
                  {cuenta.detalle || `${cuenta.area || "Bodega"} · ${cuenta.puesto || "Operación"}`}
                </p>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
