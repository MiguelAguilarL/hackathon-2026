import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /proveedor/api/oc -> Crea una nueva Orden de Compra simulando el ERP del CEDIS
export async function POST(request) {
  try {
    const body = await request.json();
    const { proveedor, lineas } = body;

    if (!proveedor || !Array.isArray(lineas) || lineas.length === 0) {
      return NextResponse.json(
        { error: "Debe indicar el proveedor y al menos una línea de producto para la Orden de Compra." },
        { status: 400 }
      );
    }

    // Obtener todas las OCs existentes para calcular el siguiente folio consecutivo real (OC-2026-XXX)
    const existentes = await prisma.ordenCompra.findMany({
      select: { idOc: true },
    });

    let maxConsecutivo = 0;
    for (const oc of existentes) {
      const match = oc.idOc.match(/OC-2026-(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxConsecutivo) maxConsecutivo = num;
      }
    }

    const siguienteNumero = String(maxConsecutivo + 1).padStart(3, "0");
    const nuevoIdOc = `OC-2026-${siguienteNumero}`;

    const nuevaOc = await prisma.ordenCompra.create({
      data: {
        idOc: nuevoIdOc,
        proveedor: proveedor.trim(),
        estado: "PENDIENTE",
        lineas: {
          create: lineas.map((l) => ({
            sku: l.sku.trim().toUpperCase(),
            descripcion: l.descripcion.trim(),
            sucursalId: Number(l.sucursalId),
            piezasPedidas: Number(l.piezasPedidas),
          })),
        },
      },
      include: {
        lineas: true,
        citaFactura: true,
      },
    });

    return NextResponse.json({ ok: true, ordenCompra: nuevaOc });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
