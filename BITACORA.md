# BITÁCORA DE USO DE INTELIGENCIA ARTIFICIAL – HACKATHON

*Registro de trazabilidad de herramientas generativas, prompts clave y validación técnica humana.*

| | |
| :--- | :--- |
| **Nombre del Proyecto:** (Escribe aquí el nombre de tu proyecto) | **Equipo:** Catlovers |
| **Integrantes:** Miguel Angel Aguilar Lagunas, Jesus Joel Hernandez Rivera, Jessica Reyes Muro, Odalys Melchor Rueda | **Fecha(s) del Evento:** (25/11/2026) |

<br>

| FECHA / HORA | FASE / ACTIVIDAD | HERRAMIENTA DE IA | PROMPT O INSTRUCCIÓN CLAVE | RESULTADO Y VALIDACIÓN HUMANA |
| :--- | :--- | :--- | :--- | :--- |
| Día 1<br>10:00 AM | **Prueba** | Antigravity | *"Prompt o instruccion que te di"* | Resultado escrito por el equipo |
| 25/11/2026<br>10:03 AM | **Consultoría / Arquitectura y Viabilidad** | Antigravity | *"Necesito que actues como un asesor que tiene años de experiencia en la industria elaborando sistemas para empresas de almacen y mercancia, necesito que me des asesoramiento acerca de que es lo que tengo que construir en este proyecto, no solo te enfoques a una app, ya que eso solo sera una parte de todo lo demas, tambien quiero que me asesores con la cotizacion y viabilidad"* | Definición del ecosistema WMS/YMS (4 módulos operativos), ingeniería de piso del CEDIS (32 racks, topología Wi-Fi industrial) y estructura financiera (CAPEX, OPEX y ROI). |
| 25/11/2026<br>10:46 AM | **Planificación de Equipo y Arquitectura Express (1 Día)** | Antigravity | *"Necesito que me ayudes a dividir la carga de trabajo para mi y mi equipo, somos 3 desarrolladores y una persona que se va a encargar de la cotizacion y viabilidad, quiero que para los sistemas me digas que es lo que se tiene que construir y como nos podemos dividir los roles, si es necesario una base de datos incluyelo, pero tomando en cuenta que solo tenemos el dia de hoy para implementar el sistema y tener un prototipo funcional"* | División estratégica de roles para 1 día (3 Devs + 1 Business/Finanzas), elección de base de datos ligera compartida (SQLite/Prisma o Supabase) sin fricción de DevOps, contrato de esquema de BD (5 tablas) y cronograma de integración. |
| 25/11/2026<br>11:08 AM | **Selección de Stack Tecnológico (Enfoque 100% Web + PWA)** | Antigravity | *"Ayudame a definir las tecnologias para el sistema. Dame opciones, pleno hacer la mayor parte web"* | Propuesta comparativa de 3 stacks tecnológicos orientados a web con `pnpm` (Opción 1: Next.js Full-Stack Monolith; Opción 2: React Vite + Supabase Serverless; Opción 3: React Vite + Node/Express API), más librerías clave para QR y PDF. |
| 25/11/2026<br>11:22 AM | **Estandarización de Stack en AGENTS.md** | Antigravity | *"Configura el archivo AGENTS.md para usar las tecnologias de la opcion 1"* | Actualización de `AGENTS.md` estableciendo Next.js (App Router + TypeScript + `pnpm`), Tailwind CSS, Prisma ORM (SQLite/PostgreSQL), `qrcode.react` y `html5-qrcode` como el stack oficial del proyecto, dividido por rutas modulares (`/proveedor`, `/handheld`, `/embarques`). |
