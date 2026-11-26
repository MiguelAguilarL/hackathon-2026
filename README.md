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

## Cómo ejecutar el prototipo (Paso a Paso con Node.js y `npm`)

Para correr este proyecto **solo necesitas tener instalado [Node.js](https://nodejs.org/)** (versión 18 o superior), el cual ya incluye **`npm`** por defecto. No necesitas instalar ningún servidor de base de datos externo (usa SQLite local autogenerado).

### Paso 1: Abrir la terminal en la carpeta del proyecto
Abre una terminal (PowerShell, CMD o Terminal) y asegúrate de ubicarte dentro de la carpeta `hackathon-2026` (donde se encuentra el archivo `package.json`):

```bash
cd hackathon-2026
```

### Paso 2: Instalar las dependencias del proyecto
Ejecuta el siguiente comando para descargar e instalar todas las librerías necesarias:

```bash
npm install
```

### Paso 3: Crear y poblar la Base de Datos (SQLite)
Ejecuta este comando para generar el cliente de Prisma, crear automáticamente el archivo de base de datos `prisma/dev.db` y cargar los datos iniciales (las 32 sucursales/racks, proveedores, catálogo de productos y órdenes de compra de prueba):

```bash
npm run db:setup
```
*(Nota: Si en algún momento deseas reiniciar la base de datos desde cero con los datos originales de fábrica, puedes ejecutar `npx prisma db push --force-reset && npm run db:seed`).*

### Paso 4: Iniciar el servidor de desarrollo
Levanta la aplicación con:

```bash
npm run dev
```

### Paso 5: Abrir la aplicación en el navegador
Abre tu navegador web y entra a:
👉 **[http://localhost:3000](http://localhost:3000)**

---

### Acceso y Perfiles de Prueba (Demo)

El sistema cuenta con un **Acceso Único en `/`** (`http://localhost:3000`). En la pantalla de login puedes hacer clic directamente sobre cualquiera de las **Cuentas Demo** del panel derecho para autocompletar su correo y contraseña con un clic:

1. **Perfil Proveedor (`/proveedor`):** Agendamiento de citas en los 4 andenes sin traslapes, generación automática de factura CFDI, cálculo automático de peso y volumen por caja, impresión de etiquetas QR y seguimiento de bultos.
   - `ventas@papeleranacional.mx` / `Papel2026*`
   - `logistica@escolardelcentro.mx` / `Escolar2026*`
   - `entregas@escrituraglobal.mx` / `Oficina2026*`
   - `cedis@arteydidacticos.mx` / `Arte2026*`
2. **Perfil Personal de Órdenes de Compra (`/ordenes`):** Emisión de nuevas Órdenes de Compra hacia los proveedores usando su catálogo de productos.
   - `compras@catlovers.mx` / `Compras2026*`
   - `cedis@catlovers.mx` / `Cedis2026*`
3. **Perfil Personal de Bodega (`/embarques`):** Mapa del CEDIS, acomodo en los 32 racks (1 por sucursal), consolidador de camión Tortón con candado del $\ge 90\%$ en peso y volumen, y emisión de Relación de Embarque en PDF/Láser con QR maestro.
   - `bodega@catlovers.mx` / `Bodega2026*`
   - `embarques@catlovers.mx` / `Embarques2026*`
4. **Terminal Portátil de Andén (`/handheld`):** Escáner de códigos QR por cámara o entrada manual con validación de cero tolerancia a discrepancias (rechazo inmediato de SKUs no pedidos o excedentes) y auditoría de faltantes.
   - URL directa: **[http://localhost:3000/handheld](http://localhost:3000/handheld)**

---

### Comandos útiles adicionales (Opcionales)

- **Ver la base de datos en tiempo real en el navegador (Prisma Studio):**
  ```bash
  npm run db:studio
  ```
  *(Abre un panel visual en `http://localhost:5555` para inspeccionar o editar las tablas).*
- **Solución de problemas comunes:**
  - Si al ejecutar `npm run db:setup` aparece un error `EPERM` en Windows, significa que el servidor `npm run dev` ya está corriendo y tiene bloqueado el cliente de Prisma. Detén primero el servidor con `Ctrl + C`, vuelve a correr `npm run db:setup` y luego inicia `npm run dev`.
  - Si el archivo `.env` no existiera al clonar, crea un archivo llamado `.env` en la raíz con esta única línea: `DATABASE_URL="file:./dev.db"`.