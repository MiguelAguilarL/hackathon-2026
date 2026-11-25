import { NextResponse } from "next/server";
import { prisma, CEDIS_RULES } from "@/lib/prisma";

// GET /api/cedis -> Obtiene estado general (OCs con relación a Proveedor, Citas/Facturas, Sucursales con Bultos en Rack y Embarques)
export async function GET() {
  try {
    const [sucursales, proveedores, ordenesCompraRaw, citasFacturas, bultos, embarques] = await Promise.all([
      prisma.sucursal.findMany({
        orderBy: { id: "asc" },
        include: {
          bultos: {
            where: { estado: "EN_RACK" },
          },
        },
      }),
      prisma.proveedor.findMany({
        orderBy: { idProveedor: "asc" },
        select: {
          idProveedor: true,
          nombre: true,
          correo: true,
        },
      }),
      prisma.ordenCompra.findMany({
        include: {
          lineas: true,
          citaFactura: true,
          proveedorRel: {
            select: {
              idProveedor: true,
              nombre: true,
              correo: true,
            },
          },
        },
      }),
      prisma.citaFactura.findMany({
        include: { bultos: true },
        orderBy: [{ fecha: "asc" }, { horaInicio: "asc" }],
      }),
      prisma.bulto.findMany({
        include: { sucursal: true },
      }),
      prisma.embarque.findMany({
        include: { sucursal: true, bultos: true },
        orderBy: { fechaSalida: "desc" },
      }),
    ]);

    // Mapear ordenesCompra incluyendo el nombre del proveedor desde proveedorRel para compatibilidad completa
    const ordenesCompra = ordenesCompraRaw.map((oc) => ({
      ...oc,
      proveedor: oc.proveedorRel?.nombre || `Proveedor #${oc.idProveedor}`,
    }));

    return NextResponse.json({
      rules: CEDIS_RULES,
      sucursales,
      proveedores,
      ordenesCompra,
      citasFacturas,
      bultos,
      embarques,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/cedis -> Acciones operativas de los 4 momentos
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;

    // MOMENTO 1 y 2: Agendar cita + Registrar Factura Única + Desglose de Bultos
    if (action === "AGENDAR_CITA") {
      const { idOc, folioFactura, proveedor, anden, fecha, horaInicio, duracionHoras, bultos } = body;

      if (anden < 1 || anden > 4) {
        return NextResponse.json({ error: "El andén de recibo debe ser entre 1 y 4." }, { status: 400 });
      }
      if (duracionHoras < 1 || horaInicio < 8 || horaInicio + duracionHoras > 18) {
        return NextResponse.json(
          { error: "Horario inválido. Las citas son de 08:00 a 18:00 hrs con duración mínima de 1 hora." },
          { status: 400 }
        );
      }

      // Validar que no se repita el folio de factura
      const facturaExistente = await prisma.citaFactura.findUnique({ where: { folioFactura } });
      if (facturaExistente) {
        return NextResponse.json(
          { error: `El folio de factura ${folioFactura} ya está registrado. No se puede repetir.` },
          { status: 400 }
        );
      }

      // Validar que no exista traslape en el mismo andén y fecha
      const citasAnden = await prisma.citaFactura.findMany({
        where: { anden: Number(anden), fecha },
      });
      const finNueva = Number(horaInicio) + Number(duracionHoras);
      const traslape = citasAnden.find((c) => {
        const finExistente = c.horaInicio + c.duracionHoras;
        return Number(horaInicio) < finExistente && finNueva > c.horaInicio;
      });

      if (traslape) {
        return NextResponse.json(
          {
            error: `Traslape detectado en Andén ${anden}: ya existe la cita de ${traslape.folioFactura} de ${traslape.horaInicio}:00 a ${traslape.horaInicio + traslape.duracionHoras}:00.`,
          },
          { status: 400 }
        );
      }

      // Resolver el nombre oficial del proveedor desde la OC si está disponible
      const ocDB = await prisma.ordenCompra.findUnique({
        where: { idOc },
        include: { proveedorRel: true },
      });
      const nombreProveedorOficial = ocDB?.proveedorRel?.nombre || proveedor || "Proveedor Externo";

      const nuevaCita = await prisma.citaFactura.create({
        data: {
          idOc,
          folioFactura,
          proveedor: nombreProveedorOficial,
          anden: Number(anden),
          fecha,
          horaInicio: Number(horaInicio),
          duracionHoras: Number(duracionHoras),
          bultos: {
            create: (bultos || []).map((b, idx) => ({
              idBulto: b.idBulto || `BUL-${folioFactura}-${String(idx + 1).padStart(2, "0")}`,
              idOc,
              proveedor: nombreProveedorOficial,
              sucursalId: Number(b.sucursalId),
              sku: b.sku,
              descripcion: b.descripcion || b.sku,
              piezas: Number(b.piezas),
              pesoKg: Number(b.pesoKg),
              volumenM3: Number(b.volumenM3),
            })),
          },
        },
        include: { bultos: true },
      });

      return NextResponse.json({ ok: true, cita: nuevaCita });
    }

    // MOMENTO 3: Escaneo y validación QR en Handheld (Cero tolerancia a discrepancias)
    if (action === "ESCANEAR_BULTO") {
      const { idBulto, idOc, sku, piezas, sucursalId } = body;

      const oc = await prisma.ordenCompra.findUnique({
        where: { idOc },
        include: { lineas: true, bultos: true },
      });

      if (!oc) {
        return NextResponse.json(
          { ok: false, rechazado: true, motivo: `Orden de Compra ${idOc} no existe en el sistema.` },
          { status: 200 }
        );
      }

      const lineaSolicitada = oc.lineas.find(
        (l) => l.sku === sku && l.sucursalId === Number(sucursalId)
      );

      if (!lineaSolicitada) {
        if (idBulto) {
          await prisma.bulto.updateMany({
            where: { idBulto },
            data: { estado: "RECHAZADO", motivoRechazo: `SKU ${sku} no solicitado para Sucursal ${sucursalId} en ${idOc}` },
          });
        }
        return NextResponse.json({
          ok: false,
          rechazado: true,
          motivo: `RECHAZO INMEDIATO: El SKU "${sku}" para la Sucursal ${sucursalId} NO fue solicitado en la OC ${idOc}. No se recibe el bulto.`,
        });
      }

      const piezasYaRecibidas = oc.bultos
        .filter((b) => b.sku === sku && b.sucursalId === Number(sucursalId) && b.estado === "EN_RACK" && b.idBulto !== idBulto)
        .reduce((acc, b) => acc + b.piezas, 0);

      if (piezasYaRecibidas + Number(piezas) > lineaSolicitada.piezasPedidas) {
        if (idBulto) {
          await prisma.bulto.updateMany({
            where: { idBulto },
            data: {
              estado: "RECHAZADO",
              motivoRechazo: `Excedente: Pedido ${lineaSolicitada.piezasPedidas} pzas, intenta ingresar ${piezasYaRecibidas + Number(piezas)} pzas`,
            },
          });
        }
        return NextResponse.json({
          ok: false,
          rechazado: true,
          motivo: `RECHAZO POR EXCEDENTE: La OC pidió ${lineaSolicitada.piezasPedidas} pzas de ${sku} y con este bulto sumarían ${piezasYaRecibidas + Number(piezas)} pzas. No se recibe el bulto.`,
        });
      }

      const bultoActualizado = await prisma.bulto.update({
        where: { idBulto },
        data: { estado: "EN_RACK", motivoRechazo: null },
        include: { sucursal: true },
      });

      return NextResponse.json({
        ok: true,
        rechazado: false,
        bulto: bultoActualizado,
        mensaje: `Bulto ${idBulto} validado correctamente. Ubicar en ${bultoActualizado.sucursal.rackAsignado} (${bultoActualizado.sucursal.nombre}).`,
      });
    }

    // MOMENTO 4: Liberar Embarque en Camión Tortón (Regla del >= 90% en Peso y Volumen)
    if (action === "DESPACHAR_EMBARQUE") {
      const { sucursalId, andenSalida } = body;

      const bultosEnRack = await prisma.bulto.findMany({
        where: { sucursalId: Number(sucursalId), estado: "EN_RACK" },
      });

      const pesoTotalKg = bultosEnRack.reduce((acc, b) => acc + b.pesoKg, 0);
      const volumenTotalM3 = bultosEnRack.reduce((acc, b) => acc + b.volumenM3, 0);

      const porcentajePeso = (pesoTotalKg / CEDIS_RULES.TORTON_MAX_PESO_KG) * 100;
      const porcentajeVolumen = (volumenTotalM3 / CEDIS_RULES.TORTON_MAX_VOLUMEN_M3) * 100;

      if (porcentajePeso < 90 || porcentajeVolumen < 90) {
        return NextResponse.json(
          {
            error: `Bloqueo de Regla del 90%: El camión Tortón tiene ${porcentajePeso.toFixed(1)}% en peso y ${porcentajeVolumen.toFixed(1)}% en volumen. Ambos deben ser >= 90%.`,
          },
          { status: 400 }
        );
      }

      const idEmbarque = `EMB-${Date.now().toString().slice(-6)}-SUC${String(sucursalId).padStart(2, "0")}`;

      const embarque = await prisma.embarque.create({
        data: {
          idEmbarque,
          sucursalId: Number(sucursalId),
          andenSalida: Number(andenSalida || 1),
          pesoTotalKg,
          volumenTotalM3,
          porcentajePeso,
          porcentajeVolumen,
        },
        include: { sucursal: true },
      });

      await prisma.bulto.updateMany({
        where: { sucursalId: Number(sucursalId), estado: "EN_RACK" },
        data: { estado: "EMBARCADO", embarqueId: idEmbarque },
      });

      return NextResponse.json({ ok: true, embarque });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
