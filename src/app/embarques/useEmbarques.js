"use client";

import { useCallback, useEffect, useState } from "react";
import { OPERARIO_DEMO, sucursalDelOperario } from "./operarioSesion";

/**
 * Carga el estado CEDIS y despacha embarques.
 * La sucursal queda fija según la sesión del operario (no puede cambiar de rack).
 */
export function useEmbarques() {
  const sucursalAsignadaId = sucursalDelOperario();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [embarqueEmitido, setEmbarqueEmitido] = useState(null);
  const [andenSalida, setAndenSalida] = useState(1);
  const [despachando, setDespachando] = useState(false);
  const [acomodando, setAcomodando] = useState(false);
  const [cargandoTorton, setCargandoTorton] = useState(false);

  const cargarDatos = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/cedis");
      const json = await res.json();

      if (!res.ok || !json.rules || !json.sucursales) {
        throw new Error(json.error || "No se pudo cargar el estado de racks.");
      }

      setData(json);
      setEmbarqueEmitido((actual) => {
        if (actual) return actual;
        const deMiSucursal = (json.embarques || []).find(
          (e) => e.sucursalId === sucursalAsignadaId
        );
        return deMiSucursal || null;
      });

      return json;
    } catch (err) {
      setData(null);
      setError(err.message || "Error de red al cargar embarques.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [sucursalAsignadaId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const cargarTorton = useCallback(
    async ({ sucursalId, idBultos, slot, soloVerificar = false }) => {
      setError(null);
      setCargandoTorton(true);
      try {
        const res = await fetch("/api/cedis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CARGAR_TORTON",
            sucursalId,
            idBultos,
            slot,
            soloVerificar,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          return {
            ok: false,
            error: json.motivo || json.error || "No se pudo cargar al Tortón.",
          };
        }
        if (!soloVerificar) {
          await cargarDatos();
        }
        return { ok: true, ...json };
      } catch (err) {
        return { ok: false, error: err.message || "Error de red al cargar Tortón." };
      } finally {
        setCargandoTorton(false);
      }
    },
    [cargarDatos]
  );

  const despacharTorton = useCallback(
    async ({ sucursalId }) => {
      setError(null);
      setDespachando(true);
      try {
        const res = await fetch("/api/cedis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "DESPACHAR_EMBARQUE",
            sucursalId,
            andenSalida,
          }),
        });
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "No se pudo despachar el Tortón.");
          return false;
        }

        await cargarDatos();
        setEmbarqueEmitido(json.embarque);
        return true;
      } catch (err) {
        setError(err.message || "Error de red al despachar.");
        return false;
      } finally {
        setDespachando(false);
      }
    },
    [andenSalida, cargarDatos]
  );

  const acomodarBultos = useCallback(
    async ({ sucursalId, nivel, columna, idBultos, soloVerificar = false }) => {
      setError(null);
      setAcomodando(true);
      try {
        const res = await fetch("/api/cedis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "ACOMODAR_BULTOS",
            sucursalId,
            nivel,
            columna,
            idBultos,
            soloVerificar,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          return { ok: false, error: json.motivo || json.error || "No se pudo acomodar." };
        }
        if (!soloVerificar) {
          await cargarDatos();
        }
        return { ok: true, ...json };
      } catch (err) {
        return { ok: false, error: err.message || "Error de red al acomodar." };
      } finally {
        setAcomodando(false);
      }
    },
    [cargarDatos]
  );

  return {
    data,
    loading,
    error,
    setError,
    embarqueEmitido,
    /** Rack/tienda destino del login simulado (1 rack = 1 tienda destino). */
    sucursalActivaId: sucursalAsignadaId,
    operario: OPERARIO_DEMO,
    andenSalida,
    setAndenSalida,
    despachando,
    acomodando,
    cargandoTorton,
    cargarDatos,
    despacharTorton,
    cargarTorton,
    acomodarBultos,
  };
}
