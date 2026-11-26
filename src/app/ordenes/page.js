"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OcErpSimulator from "../proveedor/components/OcErpSimulator";

export default function OrdenesPage() {
  const router = useRouter();
  const [verificandoSesion, setVerificandoSesion] = useState(true);
  const [empleadoActivo, setEmpleadoActivo] = useState(null);
  const [proveedores, setProveedores] = useState([]);
  const [idProveedorSeleccionado, setIdProveedorSeleccionado] = useState(null);
  const [data, setData] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  const cargarDatos = async () => {
    setCargandoDatos(true);
    setError(null);
    try {
      const res = await fetch("/api/cedis");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "No fue posible cargar el catálogo.");
      setData(json);
      return json;
    } catch (e) {
      setError(e.message || "No fue posible cargar el catálogo y las órdenes de compra.");
      return null;
    } finally {
      setCargandoDatos(false);
    }
  };

  const verificarSesionInicial = async () => {
    setVerificandoSesion(true);
    try {
      const res = await fetch("/api/auth");
      const json = await res.json();

      if (!json.autenticado || json.perfil !== "ordenes") {
        router.replace("/");
        return;
      }

      setEmpleadoActivo(json.usuario);
      const lista = json.proveedoresPublicos || [];
      setProveedores(lista);

      if (lista.length > 0) {
        setIdProveedorSeleccionado((prev) => {
          const sigueDisponible = lista.some(
            (p) => Number(p.idProveedor) === Number(prev)
          );
          return sigueDisponible ? prev : lista[0].idProveedor;
        });
      }

      await cargarDatos();
    } catch {
      setError("No fue posible verificar la sesión del Portal de Órdenes.");
    } finally {
      setVerificandoSesion(false);
    }
  };

  useEffect(() => {
    verificarSesionInicial();
  }, []);

  const handleCerrarSesion = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/");
  };

  const proveedorActivo = useMemo(
    () =>
      proveedores.find(
        (p) => Number(p.idProveedor) === Number(idProveedorSeleccionado)
      ) || null,
    [proveedores, idProveedorSeleccionado]
  );

  const misProductos = useMemo(
    () =>
      (data?.productos || []).filter(
        (p) => Number(p.idProveedor) === Number(proveedorActivo?.idProveedor)
      ),
    [data, proveedorActivo]
  );

  const misOrdenes = useMemo(
    () =>
      (data?.ordenesCompra || []).filter(
        (oc) => Number(oc.idProveedor) === Number(proveedorActivo?.idProveedor)
      ),
    [data, proveedorActivo]
  );

  const handleOcCreada = async (nuevaOc) => {
    setMensaje(
      `Orden de Compra ${nuevaOc.idOc} emitida correctamente para ${proveedorActivo?.nombre}. El proveedor ya puede agendarla en su portal.`
    );
    await cargarDatos();
  };

  if (verificandoSesion) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 font-medium">
        Verificando sesión del Portal de Órdenes...
      </div>
    );
  }

  if (!empleadoActivo) {
    return (
      <div className="p-8 text-center text-sm text-slate-500 font-medium">
        Redirigiendo al inicio de sesión...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-[240px]">
          <span className="text-[11px] font-black uppercase tracking-wider bg-blue-600 text-white px-2.5 py-1 rounded">
            Órdenes · Personal Catlovers
          </span>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-2">
            Simulador de Orden de Compra con Catálogo
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sesión activa: <strong>{empleadoActivo.nombre}</strong> · {empleadoActivo.area} ·{" "}
            {empleadoActivo.puesto}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {proveedorActivo
              ? `${misProductos.length} productos en catálogo · ${misOrdenes.length} Órdenes de Compra de ${proveedorActivo.nombre}`
              : "Selecciona un proveedor para cargar su catálogo."}
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-lg">
            Proveedor actual: #{proveedorActivo?.idProveedor}
          </span>
          <button
            type="button"
            onClick={handleCerrarSesion}
            className="border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-extrabold px-3.5 py-2 rounded-lg"
          >
            Cerrar sesión
          </button>
        </div>
      </section>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border-2 border-red-400 text-red-900 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}
      {mensaje && (
        <div className="p-4 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 text-sm font-bold">
          ✅ {mensaje}
        </div>
      )}

      {cargandoDatos && !data ? (
        <div className="p-8 text-center text-sm text-slate-500 font-medium">
          Cargando catálogo y órdenes de compra...
        </div>
      ) : proveedorActivo ? (
        <OcErpSimulator
          proveedorActivo={proveedorActivo}
          proveedoresDisponibles={proveedores}
          onProveedorChange={(idProveedor) => {
            setIdProveedorSeleccionado(idProveedor);
            setMensaje(null);
          }}
          productosProveedor={misProductos}
          ordenesCompra={data?.ordenesCompra || []}
          sucursales={data?.sucursales || []}
          onOcCreada={handleOcCreada}
        />
      ) : (
        <div className="p-8 text-center text-sm text-slate-500 font-medium">
          No hay proveedores disponibles para emitir órdenes de compra.
        </div>
      )}
    </div>
  );
}
