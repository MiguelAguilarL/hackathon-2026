import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de base de datos CEDIS Catlovers...");

  // 1. 32 sucursales / racks (1 rack por tienda destino):
  //    cerca 9–16 | media 1–8 y 17–23 | lejos 24–32. Cada rack: 4×8 tarimas.
  const nombresSucursales = [
    "Centro Histórico", "Norte Industrial", "Sur Periférico", "Poniente Santa Fe",
    "Oriente Aeropuerto", "Valle Dorado", "Satélite", "Interlomas",
    "Polanco", "Condesa", "Del Valle", "Coyoacán",
    "Tlalpan", "Xochimilco", "Iztapalapa Central", "Zaragoza",
    "Ecatepec Centro", "Coacalco", "Tultitlán", "Cuautitlán Izcalli",
    "Toluca Lerma", "Metepec", "Querétaro Juriquilla", "Querétaro El Marqués",
    "Puebla Angelópolis", "Puebla FINSA", "Cuernavaca Civac", "Pachuca Plateada",
    "León Puerto Interior", "Celaya Industrial", "Irapuato Castro", "San Juan del Río"
  ];

  for (let i = 1; i <= 32; i++) {
    const num = String(i).padStart(2, "0");
    await prisma.sucursal.upsert({
      where: { id: i },
      update: {},
      create: {
        id: i,
        codigo: `SUC-${num}`,
        nombre: `Sucursal ${num} - ${nombresSucursales[i - 1]}`,
        rackAsignado: `RACK-${num}`,
      },
    });
  }

  // 2. Crear Órdenes de Compra (OC) de ejemplo para la demo
  const ocs = [
    {
      idOc: "OC-2026-001",
      proveedor: "Distribuidora Industrial del Bajío S.A.",
      lineas: [
        { sku: "SKU-ACE-01", descripcion: "Caja Aceite Motor Sintético 1L", sucursalId: 1, piezasPedidas: 120 },
        { sku: "SKU-BAT-12", descripcion: "Batería Automotriz Uso Rudo 12V", sucursalId: 1, piezasPedidas: 40 },
        { sku: "SKU-FIL-09", descripcion: "Kit Filtros Industriales", sucursalId: 2, piezasPedidas: 50 },
      ],
    },
    {
      idOc: "OC-2026-002",
      proveedor: "Alimentos y Bebidas Nacionales S.A.",
      lineas: [
        { sku: "SKU-BEB-24", descripcion: "Paquete Bebida Energética 24p", sucursalId: 1, piezasPedidas: 200 },
        { sku: "SKU-BOT-50", descripcion: "Caja Botana Salada 50p", sucursalId: 3, piezasPedidas: 100 },
      ],
    },
    {
      idOc: "OC-2026-003",
      proveedor: "Ferretería y Suministros Globales",
      lineas: [
        { sku: "SKU-HER-10", descripcion: "Caja Herramienta Pesada", sucursalId: 4, piezasPedidas: 30 },
        { sku: "SKU-TOR-99", descripcion: "Tornillería Acero Alta Densidad", sucursalId: 1, piezasPedidas: 500 },
      ],
    },
  ];

  for (const oc of ocs) {
    const existe = await prisma.ordenCompra.findUnique({ where: { idOc: oc.idOc } });
    if (!existe) {
      await prisma.ordenCompra.create({
        data: {
          idOc: oc.idOc,
          proveedor: oc.proveedor,
          lineas: {
            create: oc.lineas,
          },
        },
      });
    }
  }

  // 3. Crear una Cita/Factura de demostración con bultos ya en RACK-01 (al ~85% del Tortón para que en la demo un escaneo alcance el >=90%)
  const citaDemo = await prisma.citaFactura.findUnique({ where: { folioFactura: "FAC-2026-8841" } });
  if (!citaDemo) {
    await prisma.citaFactura.create({
      data: {
        idOc: "OC-2026-001",
        folioFactura: "FAC-2026-8841",
        proveedor: "Distribuidora Industrial del Bajío S.A.",
        anden: 1,
        fecha: "2026-11-25",
        horaInicio: 9,
        duracionHoras: 2,
        estado: "EN_RECIBO",
        bultos: {
          create: [
            // Demo Tortón ~85%: bulto ya acomodado en RACK-01 zona A (alta demanda).
            {
              idBulto: "BUL-8841-01",
              idOc: "OC-2026-001",
              proveedor: "Distribuidora Industrial del Bajío S.A.",
              sucursalId: 1,
              sku: "SKU-ACE-01",
              descripcion: "Tarima Consolidada Aceite Motor Sintético",
              piezas: 100,
              pesoKg: 10100,
              volumenM3: 24.5,
              altoM: 1.5,
              nivel: 1,
              columna: 1,
              demandaEmbarque: "alta",
              estado: "EN_RACK",
            },
            // Pendiente de recibo → aún sin posición en rack.
            {
              idBulto: "BUL-8841-02",
              idOc: "OC-2026-001",
              proveedor: "Distribuidora Industrial del Bajío S.A.",
              sucursalId: 1,
              sku: "SKU-BAT-12",
              descripcion: "Tarima Baterías Automotrices 12V",
              piezas: 40,
              pesoKg: 950,
              volumenM3: 2.1,
              altoM: 1.2,
              demandaEmbarque: "alta",
              estado: "PENDIENTE_RECIBO",
            },
            {
              idBulto: "BUL-8841-03",
              idOc: "OC-2026-001",
              proveedor: "Distribuidora Industrial del Bajío S.A.",
              sucursalId: 2,
              sku: "SKU-FIL-09",
              descripcion: "Caja Kit Filtros Industriales",
              piezas: 50,
              pesoKg: 420,
              volumenM3: 1.8,
              altoM: 0.9,
              demandaEmbarque: "media",
              estado: "PENDIENTE_RECIBO",
            },
          ],
        },
      },
    });
  }

  // Si la cita demo ya existía, asegramos posición en el bulto EN_RACK.
  await prisma.bulto.updateMany({
    where: { idBulto: "BUL-8841-01" },
    data: {
      altoM: 1.5,
      nivel: 1,
      columna: 1,
      demandaEmbarque: "alta",
      estado: "EN_RACK",
    },
  });
  await prisma.bulto.updateMany({
    where: { idBulto: "BUL-8841-02" },
    data: { altoM: 1.2, demandaEmbarque: "alta" },
  });
  await prisma.bulto.updateMany({
    where: { idBulto: "BUL-8841-03" },
    data: { altoM: 0.9, demandaEmbarque: "media" },
  });

  console.log("Seed completado: 32 Sucursales/Racks, 3 OCs y Bultos con posición de rack.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
