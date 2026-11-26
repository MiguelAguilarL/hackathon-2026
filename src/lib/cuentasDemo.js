export const PERFILES = {
  PROVEEDOR: "proveedor",
  ORDENES: "ordenes",
  BODEGA: "bodega",
};

export const RUTA_POR_PERFIL = {
  [PERFILES.PROVEEDOR]: "/proveedor",
  [PERFILES.ORDENES]: "/ordenes",
  [PERFILES.BODEGA]: "/embarques",
};

export const PERFILES_DEMO = [
  {
    id: PERFILES.PROVEEDOR,
    titulo: "Soy proveedor",
    descripcion: "Citas, facturación CFDI y etiquetas QR",
    ruta: "/proveedor",
  },
  {
    id: PERFILES.ORDENES,
    titulo: "Personal de Órdenes de Compra",
    descripcion: "Simulador de OC con catálogo",
    ruta: "/ordenes",
  },
  {
    id: PERFILES.BODEGA,
    titulo: "Personal de Bodega",
    descripcion: "Racks y Embarques",
    ruta: "/embarques",
  },
];

// Cuentas precargadas para la demo del login único.
export const CUENTAS_DEMO = {
  proveedor: [
    {
      idProveedor: 1,
      nombre: "Papelera y Bobinas Nacionales S.A. de C.V.",
      correo: "ventas@papeleranacional.mx",
      password: "Papel2026*",
      detalle: "Papel Bond Carta, Oficio y Cartulina Opalina",
    },
    {
      idProveedor: 2,
      nombre: "Distribuidora Escolar y Cuadernos del Centro S.A.",
      correo: "logistica@escolardelcentro.mx",
      password: "Escolar2026*",
      detalle: "Cuadernos Profesionales, Italianos y Libros Florete",
    },
    {
      idProveedor: 3,
      nombre: "Artículos de Escritura y Oficina Globales S.A.",
      correo: "entregas@escrituraglobal.mx",
      password: "Oficina2026*",
      detalle: "Bolígrafos, Registradores Lefort y Marcadores",
    },
    {
      idProveedor: 4,
      nombre: "Suministros de Arte, Cartulinas y Didácticos S.A.",
      correo: "cedis@arteydidacticos.mx",
      password: "Arte2026*",
      detalle: "Cartulina Bristol, Pinturas Acrílicas y Fomi",
    },
  ],
  ordenes: [
    {
      idEmpleado: "EMP-COMP-01",
      nombre: "Laura Méndez Ríos",
      correo: "compras@catlovers.mx",
      password: "Compras2026*",
      area: "Compras",
      puesto: "Compradora de Papelería",
    },
    {
      idEmpleado: "EMP-CEDIS-02",
      nombre: "Diego Salazar Nava",
      correo: "cedis@catlovers.mx",
      password: "Cedis2026*",
      area: "CEDIS",
      puesto: "Coordinador de Almacén",
    },
    {
      idEmpleado: "EMP-ALM-03",
      nombre: "Mariana Ortega Paz",
      correo: "almacen@catlovers.mx",
      password: "Almacen2026*",
      area: "Almacén",
      puesto: "Jefa de Recepción",
    },
  ],
  bodega: [
    {
      idEmpleado: "EMP-BOD-01",
      nombre: "Carlos Ramírez Herrera",
      correo: "bodega@catlovers.mx",
      password: "Bodega2026*",
      area: "Bodega",
      puesto: "Jefe del CEDIS",
    },
    {
      idEmpleado: "EMP-BOD-02",
      nombre: "Ana Torres Villanueva",
      correo: "rack@catlovers.mx",
      password: "Rack2026*",
      area: "Bodega",
      puesto: "Responsable de Racks",
    },
    {
      idEmpleado: "EMP-BOD-03",
      nombre: "Luis Herrera Domínguez",
      correo: "embarques@catlovers.mx",
      password: "Embarques2026*",
      area: "Bodega",
      puesto: "Coordinador de Embarques",
    },
  ],
};
