import { NextResponse } from "next/server";
import { prisma, CEDIS_RULES } from "@/lib/prisma";
import {
  RACK_NIVELES,
  RACK_COLUMNAS,
  TARIMA_PESO_MAX_KG,
  TARIMA_VOLUMEN_UTIL_M3,
  TARIMA_ALTURA_UTIL_M,
  TARIMA_ALTURA_BASE_M,
  ZONA_INFO,
  listarPosicionesRack,
  zonaPorColumna,
} from "@/app/embarques/rackRules";
import { evaluarAcomodoEnSlot } from "@/app/embarques/rackCapacity";
import {
  PROXIMIDAD_INFO,
  listarModulosDobles,
  RACKS_CERCA,
  RACKS_MEDIA,
  RACKS_LEJOS,
} from "@/app/embarques/cedisLayout";
import {
  aMinutos,
  desdeMinutos,
  formatearHora,
  formatearDuracion,
  conflictoHorario,
  hayTraslape,
} from "@/lib/horarios";

function metaRack() {
  return {
    niveles: RACK_NIVELES,
    columnas: RACK_COLUMNAS,
    tarima: {
      pesoMaxKg: TARIMA_PESO_MAX_KG,
      volumenUtilM3: TARIMA_VOLUMEN_UTIL_M3,
      alturaUtilM: TARIMA_ALTURA_UTIL_M,
      alturaBaseM: TARIMA_ALTURA_BASE_M,
    },
    zonas: ZONA_INFO,
    posiciones: listarPosicionesRack(),
    planoCedis: {
      proximidad: PROXIMIDAD_INFO,
      racksCerca: RACKS_CERCA,
      racksMedia: RACKS_MEDIA,
      racksLejos: RACKS_LEJOS,
      modulosDobles: listarModulosDobles(),
    },
  };
}

class ErrorValidacion extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.status = 400;
  }
}

// GET /api/cedis -> Obtiene estado general (OCs con Proveedor, Catálogo de Productos, Citas/Facturas, Sucursales y Embarques)
export async function GET() {
  try {
    const [sucursales, proveedores, productos, ordenesCompraRaw, citasFacturas, bultos, embarques] = await Promise.all([
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
          productos: true,
        },
      }),
      prisma.producto.findMany({
        orderBy: { sku: "asc" },
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

    const ordenesCompra = ordenesCompraRaw.map((oc) => ({
      ...oc,
      proveedor: oc.proveedorRel?.nombre || `Proveedor #${oc.idProveedor}`,
    }));

    return NextResponse.json({
      rules: CEDIS_RULES,
      rack: metaRack(),
      sucursales,
      proveedores,
      productos,
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

    // MOMENTO 1 y 2: Agendar cita + Registrar Factura Única + Desglose de Bultos (con cálculo automático de peso y volumen desde Producto)
    if (action === "AGENDAR_CITA") {
      const { idOc, folioFactura, proveedor, anden, fecha, horaInicio, duracionHoras, bultos } = body;
      const numeroAnden = Number(anden);

      if (!CEDIS_RULES.ANDENES_RECIBO.includes(numeroAnden)) {
        throw new ErrorValidacion("El andén de recibo debe ser entre 1 y 4.");
      }

      const errorHorario = conflictoHorario(horaInicio, duracionHoras);
      if (errorHorario) {
        throw new ErrorValidacion(errorHorario);
      }

      const inicioMin = aMinutos(horaInicio);
      const finMin = inicioMin + aMinutos(duracionHoras);

      const [ocDB, catalogoProductos] = await Promise.all([
        prisma.ordenCompra.findUnique({
          where: { idOc },
          include: { proveedorRel: true, lineas: true },
        }),
        prisma.producto.findMany(),
      ]);

      if (!ocDB) {
        throw new ErrorValidacion(`La Orden de Compra ${idOc} no existe en el sistema.`);
      }

      const mapaProductos = new Map(catalogoProductos.map((p) => [p.sku, p]));
      const nombreProveedorOficial = ocDB.proveedorRel?.nombre || proveedor || "Proveedor Externo";

      // Cero tolerancia: agrupa los bultos por SKU + sucursal y verifica que la suma
      // de piezas declaradas nunca supere lo solicitado en la Orden de Compra.
      const piezasPorPartida = new Map();
      for (const bulto of bultos || []) {
        const sku = String(bulto.sku || "").trim();
        const sucursalId = Number(bulto.sucursalId);
        const piezas = Number(bulto.piezas);
        if (!sku || !Number.isInteger(sucursalId) || !Number.isInteger(piezas) || piezas <= 0) {
          throw new ErrorValidacion(
            "Cada bulto debe indicar un SKU, una sucursal y una cantidad entera de piezas mayor a cero."
          );
        }
        const clave = `${sku}::${sucursalId}`;
        piezasPorPartida.set(clave, (piezasPorPartida.get(clave) || 0) + piezas);
      }

      for (const [clave, piezasDeclaradas] of piezasPorPartida) {
        const [sku, sucursalStr] = clave.split("::");
        const sucursalId = Number(sucursalStr);
        const linea = ocDB.lineas.find(
          (l) => l.sku === sku && Number(l.sucursalId) === sucursalId
        );
        if (!linea) {
          throw new ErrorValidacion(
            `El SKU ${sku} para la sucursal ${sucursalId} no fue solicitado en la OC ${idOc}.`
          );
        }
        if (piezasDeclaradas > linea.piezasPedidas) {
          throw new ErrorValidacion(
            `Excedente no permitido en ${sku} (Sucursal ${sucursalId}): la OC pide ${linea.piezasPedidas} piezas y declaraste ${piezasDeclaradas}. Reduce la cantidad antes de agendar.`
          );
        }
      }

      // Validación y escritura en una sola transacción: dos proveedores no pueden
      // tomar el mismo andén (ni el mismo proveedor dos andenes) en el mismo rango.
      const nuevaCita = await prisma.$transaction(async (tx) => {
        const facturaExistente = await tx.citaFactura.findUnique({ where: { folioFactura } });
        if (facturaExistente) {
          throw new ErrorValidacion(
            `El folio de factura ${folioFactura} ya está registrado. No se puede repetir.`
          );
        }

        const citasDelDia = await tx.citaFactura.findMany({ where: { fecha } });
        const rangoDe = (cita) => {
          const inicio = aMinutos(cita.horaInicio);
          return [inicio, inicio + aMinutos(cita.duracionHoras)];
        };

        const traslapeAnden = citasDelDia.find((cita) => {
          if (Number(cita.anden) !== numeroAnden) return false;
          const [inicio, fin] = rangoDe(cita);
          return hayTraslape(inicioMin, finMin, inicio, fin);
        });
        if (traslapeAnden) {
          const [inicio, fin] = rangoDe(traslapeAnden);
          throw new ErrorValidacion(
            `Andén ${numeroAnden} ocupado: ${traslapeAnden.folioFactura} (${traslapeAnden.proveedor}) de ${formatearHora(desdeMinutos(inicio))} a ${formatearHora(desdeMinutos(fin))}.`
          );
        }

        const traslapeProveedor = citasDelDia.find((cita) => {
          if (cita.proveedor !== nombreProveedorOficial) return false;
          const [inicio, fin] = rangoDe(cita);
          return hayTraslape(inicioMin, finMin, inicio, fin);
        });
        if (traslapeProveedor) {
          const [inicio, fin] = rangoDe(traslapeProveedor);
          throw new ErrorValidacion(
            `${nombreProveedorOficial} ya tiene una cita de ${formatearHora(desdeMinutos(inicio))} a ${formatearHora(desdeMinutos(fin))} en el Andén #${traslapeProveedor.anden}.`
          );
        }

        return tx.citaFactura.create({
          data: {
            idOc,
            folioFactura,
            proveedor: nombreProveedorOficial,
            anden: numeroAnden,
            fecha,
            horaInicio: desdeMinutos(inicioMin),
            duracionHoras: desdeMinutos(finMin - inicioMin),
          bultos: {
            create: (bultos || []).map((b, idx) => {
              const prod = mapaProductos.get(b.sku);
              const piezas = Number(b.piezas);
              const pesoCalculado = prod
                ? Number((piezas * prod.pesoUnitarioKg).toFixed(2))
                : Number(b.pesoKg || 0);
              const volumenCalculado = prod
                ? Number((piezas * prod.volumenUnitarioM3).toFixed(3))
                : Number(b.volumenM3 || 0);

              return {
                idBulto: b.idBulto || `BUL-${folioFactura}-${String(idx + 1).padStart(2, "0")}`,
                idOc,
                proveedor: nombreProveedorOficial,
                sucursalId: Number(b.sucursalId),
                sku: b.sku,
                descripcion: prod?.descripcion || b.descripcion || b.sku,
                piezas,
                pesoKg: pesoCalculado,
                volumenM3: volumenCalculado,
              };
            }),
          },
        },
        include: { bultos: true },
        });
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

    // MOMENTO 4 (acomodo): asignar bultos a una tarima del rack (nivel + columna)
    if (action === "ACOMODAR_BULTOS") {
      const { sucursalId, nivel, columna, idBultos, soloVerificar } = body;
      const nivelN = Number(nivel);
      const columnaN = Number(columna);
      const ids = Array.isArray(idBultos) ? idBultos : [];

      if (!sucursalId || ids.length === 0) {
        return NextResponse.json(
          { error: "Faltan sucursalId o idBultos para acomodar." },
          { status: 400 }
        );
      }
      if (nivelN < 1 || nivelN > RACK_NIVELES || columnaN < 1 || columnaN > RACK_COLUMNAS) {
        return NextResponse.json(
          {
            error: `Posición inválida. Nivel 1–${RACK_NIVELES}, columna 1–${RACK_COLUMNAS}.`,
          },
          { status: 400 }
        );
      }

      const bultosAAcomodar = await prisma.bulto.findMany({
        where: { idBulto: { in: ids } },
      });

      if (bultosAAcomodar.length !== ids.length) {
        return NextResponse.json(
          { error: "Uno o más bultos no existen en la base de datos." },
          { status: 404 }
        );
      }

      const deOtraSucursal = bultosAAcomodar.find((b) => b.sucursalId !== Number(sucursalId));
      if (deOtraSucursal) {
        return NextResponse.json(
          {
            error: `El bulto ${deOtraSucursal.idBulto} pertenece a otra sucursal/rack.`,
          },
          { status: 400 }
        );
      }

      const noAcomodables = bultosAAcomodar.filter(
        (b) => b.estado === "EMBARCADO" || b.estado === "RECHAZADO"
      );
      if (noAcomodables.length > 0) {
        return NextResponse.json(
          {
            error: `No se pueden acomodar bultos en estado ${noAcomodables[0].estado}.`,
          },
          { status: 400 }
        );
      }

      const bultosYaEnSlot = await prisma.bulto.findMany({
        where: {
          sucursalId: Number(sucursalId),
          estado: "EN_RACK",
          nivel: nivelN,
          columna: columnaN,
          idBulto: { notIn: ids },
        },
      });

      const evaluacion = evaluarAcomodoEnSlot({ bultosAAcomodar, bultosYaEnSlot });
      const zona = zonaPorColumna(columnaN);

      if (!evaluacion.ok) {
        return NextResponse.json(
          {
            ok: false,
            cabe: false,
            motivo: evaluacion.motivo,
            zona,
            posicion: { nivel: nivelN, columna: columnaN },
          },
          { status: 400 }
        );
      }

      if (soloVerificar) {
        return NextResponse.json({
          ok: true,
          cabe: true,
          zona,
          posicion: { nivel: nivelN, columna: columnaN },
          resumen: evaluacion.resumen,
          mensaje: `Caben en N${nivelN}-C${columnaN} (zona ${zona}).`,
        });
      }

      await prisma.bulto.updateMany({
        where: { idBulto: { in: ids } },
        data: {
          estado: "EN_RACK",
          nivel: nivelN,
          columna: columnaN,
          motivoRechazo: null,
        },
      });

      const bultosActualizados = await prisma.bulto.findMany({
        where: { idBulto: { in: ids } },
        include: { sucursal: true },
      });

      return NextResponse.json({
        ok: true,
        cabe: true,
        zona,
        posicion: { nivel: nivelN, columna: columnaN },
        resumen: evaluacion.resumen,
        bultos: bultosActualizados,
        mensaje: `Acomodados ${bultosActualizados.length} bulto(s) en N${nivelN}-C${columnaN} (zona ${zona}).`,
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
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
