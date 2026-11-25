import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de base de datos CEDIS Catlovers...");

  // 1. Crear las 32 sucursales (1 rack por sucursal: 4 niveles x 8 tarimas = 32 tarimas)
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
            // 11 tarimas/bultos consolidados ya en RACK-01 (10,100 kg y 24.5 m3 -> ~84.1% peso y ~85.7% volumen)
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
              estado: "EN_RACK",
            },
            // Bulto pendiente de escanear en andén que sube a RACK-01 por encima del 90% (suma +950 kg = 11,050 kg [92.1%] y +2.1 m3 = 26.6 m3 [93.0%])
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
              estado: "PENDIENTE_RECIBO",
            },
            // Bulto para Sucursal 02 pendiente de recibo
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
              estado: "PENDIENTE_RECIBO",
            },
          ],
        },
      },
    });
  }

  console.log("Seed completado: 32 Sucursales/Racks, 3 OCs y Bultos de prueba creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
