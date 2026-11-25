# REGLAS DEL PROYECTO (HACKATHON) - EQUIPO CATLOVERS

Documento rector de lineamientos, reglas de negocio y directrices operativas para los agentes de Inteligencia Artificial y el equipo de desarrollo.

---

## 1. Directrices Generales para los Agentes de IA

1. **Idioma obligatorio:** Responder e interactuar siempre en **español**.
2. **Gestor de paquetes de Node.js:** En caso de utilizar Node.js / JavaScript / TypeScript, usar obligatoriamente **`pnpm`** en lugar de `npm` o `yarn`.
3. **Registro de Prompts en [BITACORA.md](file:///C:/Users/Dell%20Latitude%207420/Desktop/hackathon-2026/BITACORA.md):**
   - Cada instrucción, prompt clave, generación de arquitectura, código relevante o diseño técnico generado por o para la IA debe documentarse en la tabla de trazabilidad de `BITACORA.md`.
   - Registrar: Fecha/Hora, Fase/Actividad, Herramienta de IA, Prompt o instrucción clave y resultado/validación humana.
4. **Stack Tecnológico Oficial (Opción 1 - Monolito Full-Stack Web):**
   - **Framework Principal:** **Next.js (App Router)** con **React** y **JavaScript (ES6+)**, gestionado estrictamente con **`pnpm`**.
   - **Estilos e Interfaz de Usuario (UI):** **Tailwind CSS**, componentes **shadcn/ui** y **Lucide Icons** (incluyendo vistas responsivas tipo PWA/Terminal Industrial para `/handheld` y hojas de impresión `@media print` / `react-to-print` para PDF y láser).
   - **Base de Datos y ORM:** **Prisma ORM** con **SQLite** (`dev.db` para desarrollo local rápido sin fricción) o **PostgreSQL** (Supabase/Neon para sincronización en vivo entre dispositivos).
   - **Librerías Operativas Clave:** `qrcode.react` (generación de etiquetas QR de bultos y QR maestro de Relación de Embarque) y `html5-qrcode` / `@yudiel/react-qr-scanner` (lectura de QR por cámara en terminal portátil más soporte de entrada de escáner láser/simulador).
   - **Arquitectura Modular por Rutas (Vertical Slicing):**
     - `/proveedor`: Agendamiento de citas en andenes (1-4), registro de factura única ligada a OC, desglose de bultos y generación de etiquetas QR.
     - `/handheld`: Validación física en andén mediante escaneo QR, rechazo inmediato por discrepancias (SKU no solicitado o excedente) y reporte de faltantes.
     - `/embarques` (y `/dashboard`): Control de los 32 racks (1 por sucursal), consolidador de Tortón (candado del $\ge 90\%$ en peso $[10,800\text{ kg}]$ y volumen $[25.73\text{ m}^3]$ sobre capacidad máxima de $12\text{ tarimas} / 12,000\text{ kg}$) y emisión de Relación de Embarque (PDF/Impresión Láser).

---

## 2. Dominio y Reglas del Negocio (Logística · CEDIS)

Basado en la problemática descrita en [README.md](file:///C:/Users/Dell%20Latitude%207420/Desktop/hackathon-2026/README.md) (*"De la Orden de Compra al Embarque"*):

### A. Capacidad y Dimensiones del CEDIS
- **Bodega:** 100 m de largo × 40 m de fondo; altura máx. 9 m; racks metálicos de hasta 6 m.
- **Andenes:** 4 andenes de recibo (proveedores) y 3 andenes de embarque (hacia sucursales).
- **Operación Diaria:** Horario de atención corrido de 08:00 a 18:00 hrs. Recepción de ~35 camiones/día y salida de ~20 unidades/día.
- **Racks y Sucursales:** 32 sucursales destino. Cada sucursal cuenta con 1 rack asignado (4 niveles × 8 tarimas = capacidad de 32 tarimas por rack).
- **Especificaciones de Tarima:** Dimensiones 1.12 m × 1.15 m; altura máx. 1.85 m (incluida la tarima); capacidad máxima de 1,000 kg (1 tonelada) por tarima. Deben venir sujetas con film de seguridad y respetar la base sin rebasar altura permitida.
- **Transporte principal:** Camión Tortón (capacidad estándar: **12 tarimas** y capacidad máxima de carga: **12 toneladas / 12,000 kg**).

### B. Reglas de los 4 Momentos Operativos

#### 1. Agendamiento de Citas (Recibo)
- Las citas se programan por andén de recibo (1 a 4) dentro del horario de 08:00 a 18:00.
- La descarga toma un mínimo estimado de 1 hora (el proveedor define el tiempo estimado).
- **Restricción estricta:** No pueden traslaparse o agendarse dos entregas en el mismo andén al mismo tiempo.
- Toda cita / Orden de Compra (OC) debe ligarse a un folio único de factura (no repetible en el sistema).

#### 2. Identificación y Etiquetado (Bultos / Cajas)
- Cada factura se desglosa por bulto/caja con sus atributos: producto (SKU), piezas surtidas, peso y volumen.
- **Restricción de empaque:** No se mezclan productos diferentes (SKUs distintos) en un mismo bulto.
- **Etiqueta QR obligatoria por bulto:** Contiene:
  - Identificador de bulto
  - Número de Orden de Compra (OC)
  - Proveedor
  - Sucursal destino
  - SKU
  - Cantidad de piezas

#### 3. Recepción y Validación Física
- Validación en andén mediante escaneo de código QR usando terminales portátiles de uso rudo (Handhelds Android).
- Validación estricta contra la Orden de Compra:
  - **Cero tolerancia a discrepancias:** Mercancía no solicitada (SKU erróneo o excedentes) no se recibe; debe reportarse inmediatamente y rechazarse el bulto.
  - Validación de faltantes en tiempo real.

#### 4. Almacenamiento Temporal y Embarque
- **Acomodo:** Los bultos/tarimas recibidos deben ubicarse en el rack correspondiente a la sucursal de destino.
- **Regla de despacho / salida de camión:** Los camiones se envían por sucursal y **no pueden salir** hasta cubrir al menos el **90% de su capacidad** (tanto en volumen como en peso).
- **Documentación de salida:** Cada embarque debe emitir una **Relación de Embarque** (impresa en láser y en PDF) con los bultos agrupados por sucursal y con un código QR para facilitar la recepción y validación en la sucursal destino.

---

## 3. Requerimientos de Viabilidad Económica y Cotización

Toda propuesta de solución integral debe contemplar en su análisis de costos reales (inversión inicial y costos recurrentes):
1. **Infraestructura de Red Industrial:** Puntos de acceso (APs) para entorno hostil de bodega (racks metálicos, techos altos, interferencias).
2. **Terminales Portátiles (Handhelds):** Equipos Android uso rudo (resistencia a caídas 1.5 m, lectura 2D/QR).
3. **Impresoras:** Impresoras láser para emisión de Relaciones de Embarque.
4. **Consumibles:** Proyección mensual de papel, tóner y etiquetas acorde al volumen operativo (~35 camiones recibidos y ~20 embarcados al día).
