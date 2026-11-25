import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed de base de datos CEDIS Papelería Catlovers...");

  // 1. Crear las 32 sucursales de la cadena de papelerías (1 rack por sucursal: 4 niveles x 8 tarimas = 32 tarimas)
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
        nombre: `Papelería Sucursal ${num} - ${nombresSucursales[i - 1]}`,
        rackAsignado: `RACK-${num}`,
      },
    });
  }

  // 2. Crear Proveedores del giro de Papelería con sus credenciales de acceso al portal /proveedor
  const proveedoresSeed = [
    {
      idProveedor: 1,
      nombre: "Papelera y Bobinas Nacionales S.A. de C.V.",
      correo: "ventas@papeleranacional.mx",
      password: "Papel2026*",
    },
    {
      idProveedor: 2,
      nombre: "Distribuidora Escolar y Cuadernos del Centro S.A.",
      correo: "logistica@escolardelcentro.mx",
      password: "Escolar2026*",
    },
    {
      idProveedor: 3,
      nombre: "Artículos de Escritura y Oficina Globales S.A.",
      correo: "entregas@escrituraglobal.mx",
      password: "Oficina2026*",
    },
    {
      idProveedor: 4,
      nombre: "Suministros de Arte, Cartulinas y Didácticos S.A.",
      correo: "cedis@arteydidacticos.mx",
      password: "Arte2026*",
    },
  ];

  for (const prov of proveedoresSeed) {
    await prisma.proveedor.upsert({
      where: { idProveedor: prov.idProveedor },
      update: {
        nombre: prov.nombre,
        correo: prov.correo,
        password: prov.password,
      },
      create: prov,
    });
  }

  // 3. Crear Catálogo Maestro de Productos de Papelería por Proveedor (con peso y volumen por pieza/paquete)
  const productosSeed = [
    // Proveedor 1: Papelera y Bobinas Nacionales S.A. de C.V.
    {
      sku: "PAP-BOND-CARTA",
      idProveedor: 1,
      descripcion: "Caja Papel Bond Blancura 99 Tamaño Carta (10 resmas de 500 hojas)",
      pesoUnitarioKg: 23.5,
      volumenUnitarioM3: 0.055,
    },
    {
      sku: "PAP-BOND-OFICIO",
      idProveedor: 1,
      descripcion: "Caja Papel Bond Tamaño Oficio (10 resmas de 500 hojas)",
      pesoUnitarioKg: 28.0,
      volumenUnitarioM3: 0.065,
    },
    {
      sku: "PAP-OPALINA-100",
      idProveedor: 1,
      descripcion: "Caja Cartulina Opalina Blanca 225g (20 paquetes de 100 hojas)",
      pesoUnitarioKg: 16.0,
      volumenUnitarioM3: 0.042,
    },

    // Proveedor 2: Distribuidora Escolar y Cuadernos del Centro S.A.
    {
      sku: "CUA-PROF-100C",
      idProveedor: 2,
      descripcion: "Caja Cuaderno Profesional Espiral Doble Cuadro Grande 100 Hojas (40 pzas)",
      pesoUnitarioKg: 18.0,
      volumenUnitarioM3: 0.048,
    },
    {
      sku: "CUA-ITAL-RAYA",
      idProveedor: 2,
      descripcion: "Caja Cuaderno Italiano Cosido Raya 100 Hojas (50 pzas)",
      pesoUnitarioKg: 15.5,
      volumenUnitarioM3: 0.04,
    },
    {
      sku: "LIB-CONT-3COL",
      idProveedor: 2,
      descripcion: "Paquete Libros Florete y Contabilidad Pasta Dura (20 pzas)",
      pesoUnitarioKg: 14.0,
      volumenUnitarioM3: 0.036,
    },

    // Proveedor 3: Artículos de Escritura y Oficina Globales S.A.
    {
      sku: "ESC-BOL-NEGRO",
      idProveedor: 3,
      descripcion: "Caja Master Bolígrafo Punto Mediano Tinta Negra (100 exhibidores de 12 pzas)",
      pesoUnitarioKg: 12.0,
      volumenUnitarioM3: 0.035,
    },
    {
      sku: "OFI-CARP-LEF",
      idProveedor: 3,
      descripcion: "Caja Registrador Lefort Tamaño Carta con Herraje (30 carpetas)",
      pesoUnitarioKg: 14.5,
      volumenUnitarioM3: 0.068,
    },
    {
      sku: "ESC-MARC-PIZ",
      idProveedor: 3,
      descripcion: "Caja Master Marcadores para Pizarrón Blanco 4 Colores (80 estuches)",
      pesoUnitarioKg: 9.8,
      volumenUnitarioM3: 0.03,
    },

    // Proveedor 4: Suministros de Arte, Cartulinas y Didácticos S.A.
    {
      sku: "ART-CART-BRIS",
      idProveedor: 4,
      descripcion: "Paquete Industrial Cartulina Bristol Colores Pastel (250 pliegos)",
      pesoUnitarioKg: 19.5,
      volumenUnitarioM3: 0.052,
    },
    {
      sku: "ART-PINT-ACR",
      idProveedor: 4,
      descripcion: "Caja Kits de Pintura Acrílica Escolar y Pinceles (36 sets)",
      pesoUnitarioKg: 16.8,
      volumenUnitarioM3: 0.044,
    },
    {
      sku: "ART-FOAMI-CARTA",
      idProveedor: 4,
      descripcion: "Caja Fomi Escolar Tamaño Carta Surtido (100 paquetes de 24 pliegos)",
      pesoUnitarioKg: 11.2,
      volumenUnitarioM3: 0.062,
    },
  ];

  for (const prod of productosSeed) {
    await prisma.producto.upsert({
      where: { sku: prod.sku },
      update: {
        idProveedor: prod.idProveedor,
        descripcion: prod.descripcion,
        pesoUnitarioKg: prod.pesoUnitarioKg,
        volumenUnitarioM3: prod.volumenUnitarioM3,
      },
      create: prod,
    });
  }

  // 4. Crear Órdenes de Compra (OC) de Papelería relacionadas con Proveedor mediante idProveedor
  const ocs = [
    {
      idOc: "OC-2026-001",
      idProveedor: 1,
      lineas: [
        { sku: "PAP-BOND-CARTA", descripcion: "Caja Papel Bond Blancura 99 Tamaño Carta (10 resmas de 500 hojas)", sucursalId: 1, piezasPedidas: 430 },
        { sku: "PAP-BOND-OFICIO", descripcion: "Caja Papel Bond Tamaño Oficio (10 resmas de 500 hojas)", sucursalId: 1, piezasPedidas: 30 },
        { sku: "PAP-OPALINA-100", descripcion: "Caja Cartulina Opalina Blanca 225g (20 paquetes de 100 hojas)", sucursalId: 2, piezasPedidas: 30 },
      ],
    },
    {
      idOc: "OC-2026-002",
      idProveedor: 2,
      lineas: [
        { sku: "CUA-PROF-100C", descripcion: "Caja Cuaderno Profesional Espiral Doble Cuadro Grande 100 Hojas (40 pzas)", sucursalId: 1, piezasPedidas: 40 },
        { sku: "CUA-ITAL-RAYA", descripcion: "Caja Cuaderno Italiano Cosido Raya 100 Hojas (50 pzas)", sucursalId: 3, piezasPedidas: 30 },
      ],
    },
    {
      idOc: "OC-2026-003",
      idProveedor: 3,
      lineas: [
        { sku: "ESC-BOL-NEGRO", descripcion: "Caja Master Bolígrafo Punto Mediano Tinta Negra (100 exhibidores de 12 pzas)", sucursalId: 4, piezasPedidas: 25 },
        { sku: "OFI-CARP-LEF", descripcion: "Caja Registrador Lefort Tamaño Carta con Herraje (30 carpetas)", sucursalId: 1, piezasPedidas: 30 },
      ],
    },
    {
      idOc: "OC-2026-004",
      idProveedor: 4,
      lineas: [
        { sku: "ART-CART-BRIS", descripcion: "Paquete Industrial Cartulina Bristol Colores Pastel (250 pliegos)", sucursalId: 1, piezasPedidas: 35 },
        { sku: "ART-PINT-ACR", descripcion: "Caja Kits de Pintura Acrílica Escolar y Pinceles (36 sets)", sucursalId: 2, piezasPedidas: 20 },
      ],
    },
  ];

  for (const oc of ocs) {
    const existe = await prisma.ordenCompra.findUnique({ where: { idOc: oc.idOc } });
    if (!existe) {
      await prisma.ordenCompra.create({
        data: {
          idOc: oc.idOc,
          idProveedor: oc.idProveedor,
          lineas: {
            create: oc.lineas,
          },
        },
      });
    }
  }

  // 5. Crear una Cita/Factura de demostración de Papelería con bultos ya en RACK-01 (al ~84% del Tortón para que en la demo 1 escaneo alcance el >=90%)
  const citaDemo = await prisma.citaFactura.findUnique({ where: { folioFactura: "CFDI-PBN-2026-0001" } });
  if (!citaDemo) {
    await prisma.citaFactura.create({
      data: {
        idOc: "OC-2026-001",
        folioFactura: "CFDI-PBN-2026-0001",
        proveedor: "Papelera y Bobinas Nacionales S.A. de C.V.",
        anden: 1,
        fecha: "2026-11-25",
        horaInicio: 9,
        duracionHoras: 2,
        estado: "EN_RECIBO",
        bultos: {
          create: [
            // 430 cajas de Papel Bond Carta (430 * 23.5 kg = 10,105 kg; 430 * 0.055 m3 = 23.65 m3) -> Ya en RACK-01
            {
              idBulto: "BUL-CFDI-PBN-2026-0001-01",
              idOc: "OC-2026-001",
              proveedor: "Papelera y Bobinas Nacionales S.A. de C.V.",
              sucursalId: 1,
              sku: "PAP-BOND-CARTA",
              descripcion: "Caja Papel Bond Blancura 99 Tamaño Carta (10 resmas de 500 hojas)",
              piezas: 430,
              pesoKg: 10105,
              volumenM3: 23.65,
              estado: "EN_RACK",
            },
            // Bulto pendiente: 30 cajas Oficio (30 * 28 kg = 840 kg; 30 * 0.065 m3 = 1.95 m3) — cabe en 1 tarima (≤1000 kg / ≤2.13 m³)
            {
              idBulto: "BUL-CFDI-PBN-2026-0001-02",
              idOc: "OC-2026-001",
              proveedor: "Papelera y Bobinas Nacionales S.A. de C.V.",
              sucursalId: 1,
              sku: "PAP-BOND-OFICIO",
              descripcion: "Caja Papel Bond Tamaño Oficio (10 resmas de 500 hojas)",
              piezas: 30,
              pesoKg: 840,
              volumenM3: 1.95,
              estado: "PENDIENTE_RECIBO",
            },
            // Bulto para Sucursal 02: 30 cajas de Cartulina Opalina (30 * 16 kg = 480 kg; 30 * 0.042 m3 = 1.26 m3)
            {
              idBulto: "BUL-CFDI-PBN-2026-0001-03",
              idOc: "OC-2026-001",
              proveedor: "Papelera y Bobinas Nacionales S.A. de C.V.",
              sucursalId: 2,
              sku: "PAP-OPALINA-100",
              descripcion: "Caja Cartulina Opalina Blanca 225g (20 paquetes de 100 hojas)",
              piezas: 30,
              pesoKg: 480,
              volumenM3: 1.26,
              estado: "PENDIENTE_RECIBO",
            },
          ],
        },
      },
    });
  }

  console.log("Seed completado: 32 Sucursales de Papelería, 4 Proveedores, 12 Productos en Catálogo, 4 OCs y Bultos creados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
