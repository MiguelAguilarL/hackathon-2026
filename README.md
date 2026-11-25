# RETO HACKATHON

## Enunciado del reto

### De la Orden de Compra al Embarque

Reto de logística · CEDIS

### El problema
En este reto, los proveedores entregan mercancía destinada a varias sucursales. El CEDIS (Centro de Distribución) recibe al proveedor, separa y acomoda la mercancía por sucursal en un almacenamiento temporal y, después, la envía a cada sucursal. El reto es lograr que todo este flujo sea eficiente.

Un CEDIS mediano recibe cerca de 35 camiones al día y surte a 32 sucursales, pero la información y la mercancía no van al mismo ritmo. Llegan proveedores sin una cita ordenada, los bultos no se identifican con claridad, los faltantes y excedentes se detectan tarde, el espacio de almacenamiento se aprovecha mal y algunos camiones salen a medio llenar. El resultado: demoras, errores de surtido, subutilización del transporte y costos ocultos.

**Para quién**: proveedores, operadores de recibo y almacén, jefes de embarque, sucursales receptoras y la gerencia del CEDIS.

### Lo que buscamos
Una solución integral que digitalice y optimice el proceso de punta a punta, desde que la empresa emite una Orden de Compra (OC) hasta que la mercancía sale en embarque a la sucursal. Debe cubrir cuatro momentos de la operación:

**Agendamiento**: cómo los proveedores externos programan la entrega de su OC en los andenes del CEDIS.
Identificación: cómo se identifica cada bulto que se entrega.
Recepción: cómo se valida físicamente lo que llega contra lo que se pidió.
Almacenamiento y embarque: cómo se acomoda la mercancía por sucursal y cómo se arman los embarques hacia ellas.
Qué debes entregar
Un prototipo funcional y un análisis de costo y viabilidad económica que justifique su implementación. Se vale cualquier tecnología.

### Cotización y viabilidad
Cotiza en el mercado real los equipos y/o servicios que tu solución requiera, considerando las dimensiones del CEDIS, y presenta inversión inicial y costos recurrentes. Como mínimo:

- Infraestructura de red: puntos de acceso (APs) industriales con cobertura Wi-Fi total en un entorno con racks metálicos, techos altos y alta interferencia.
- Terminales de captura (handhelds): escáneres portátiles Android de uso rudo, resistentes a caídas de 1.5 m y con lectura óptima de códigos 2D (QR).
- Impresión: impresoras láser para emitir las Relaciones de Embarque.
- Consumibles: costo mensual de papel y tóner proyectado al volumen de la operación.
### Datos y reglas de la operación
Datos clave del CEDIS
- Bodega: 100 m de largo × 40 m de fondo; altura máxima 9 m; racks metálicos de hasta 6 m.
Andenes: 4 de recibo y 3 de embarque a sucursales.
- Operación diaria: ~35 camiones recibidos y ~20 unidades embarcadas por día; atención de 8:00 a 18:00.
- Racks: 32 sucursales, 1 rack por sucursal (1 lado): 4 niveles × 8 tarimas = 32 tarimas por rack.
- Tarima: 1.12 × 1.15 m, altura máxima 1.85 m incluyendo tarima, capacidad máxima 1,000 kg.
- Unidad más usada: Tortón, se llena con 12 tarimas.
Reglas
- Las citas se agendan por andén en horario corrido de 8:00 a 18:00. La descarga toma mínimo 1 hora (el proveedor estima el tiempo total) y no puede haber dos entregas en el mismo andén y horario.
- Cada OC debe tener relacionado un folio de factura, y el folio no se puede repetir.
- Cada factura se desglosa por bulto (caja): producto, piezas surtidas, peso y volumen. No se mezclan productos en un mismo bulto.
- Cada bulto lleva una etiqueta con código QR que identifica: bulto, OC, proveedor, sucursal destino, SKU y cantidad de piezas. El proveedor la descarga y la pega.
- Al descargar, el operador escanea los bultos con una terminal portátil. No se recibe mercancía no solicitada (otro SKU o excedente): se reporta y el bulto no se recibe.
- La mercancía mantiene la base de la tarima, viene sujeta con film de seguridad y no rebasa la altura máxima.
- Los camiones se envían por sucursal y no salen hasta cubrir al menos 90% de su capacidad (peso y volumen).
- Cada embarque genera una Relación de Embarque impresa (también en PDF), con los bultos agrupados por sucursal e identificada con un código QR para recibir la mercancía en destino.

---

## Cómo ejecutar el prototipo

Requisitos: Node.js 20+ con Corepack. **Trabaja siempre dentro de la carpeta `hackathon-2026`** (el `package.json` está ahí; ejecutar los comandos desde la carpeta padre falla con `ENOENT`).

```bash
cd hackathon-2026
corepack enable          # solo si "pnpm" no está en PATH
corepack pnpm install    # instala dependencias y genera el Prisma Client
corepack pnpm db:setup   # crea prisma/dev.db, aplica el esquema y carga el seed
corepack pnpm dev        # abre http://localhost:3000
```

No uses `npm install` ni `npm run dev`: el proyecto usa **`pnpm` de forma obligatoria** (ver `AGENTS.md`). `prisma/dev.db`, `.next/` y `node_modules/` están en `.gitignore`, así que cada persona genera su propia base de datos con `db:setup`. El archivo `.env` sí se versiona y solo contiene `DATABASE_URL="file:./dev.db"`.

### Rutas

- `/` — panel general.
- `/proveedor` — portal del proveedor: agendamiento, etiquetas QR y estado actual de bultos. Credenciales de ejemplo en `prisma/seed.mjs` (p. ej. `ventas@papeleranacional.mx` / `Papel2026*`).
- `/handheld` — terminal de escaneo QR (muestra los 7 campos de la etiqueta, valida contra la OC y permite escanear otro QR).
- `/embarques` — acomodo en racks y control de embarques.
- `/api/cedis` — API JSON del CEDIS.

### Solución de problemas

- Si `pnpm` no existe: `corepack enable` y usa siempre `corepack pnpm ...`.
- Si Prisma reporta campos desconocidos (`nivel`, `columna`) o el cliente está desactualizado, con el servidor detenido ejecuta `corepack pnpm exec prisma generate` y `corepack pnpm exec prisma db push`.
- Si el puerto 3000 está ocupado, detén la instancia anterior de `next dev` antes de levantar otra.