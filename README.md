# Turnero Clínicas

Plataforma de turnos online completa: sitio público para que los pacientes reserven turnos las 24&nbsp;hs, y un panel de administración con control total sobre agenda, pacientes, servicios, profesionales, horarios y configuración. Pensada originalmente para un consultorio de ginecología, pero funciona para cualquier clínica con uno o varios profesionales.

Optimizada **mobile-first**: tanto el sitio de reservas como el panel admin están pensados primero para el celular (la forma en que la mayoría de los pacientes y del personal la va a usar) y se adaptan perfectamente a tablet y escritorio.

## Stack técnico

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Prisma** + **SQLite** (base de datos en un solo archivo, sin servidor externo que instalar)
- **NextAuth v5** (login del panel con email + contraseña)
- **Server Actions** para toda la lógica de negocio (sin API REST intermedia)

## Puesta en marcha (primera vez)

Requisito: [Node.js](https://nodejs.org) 20 o superior instalado.

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Esto deja el sitio corriendo en **http://localhost:2001**.

El comando `db:seed` carga datos de ejemplo para que puedas ver la plataforma funcionando de inmediato:

- Una clínica de ejemplo ("Clínica Vitalis") con una profesional, 6 servicios y horarios ya cargados.
- Tres pacientes y algunos turnos de muestra.
- Un usuario administrador:

  ```
  Email:      admin@clinica.com
  Contraseña: Admin123!
  ```

  **Cambiá esta contraseña (o creá tu propio usuario y borrá este) apenas entres a producción.**

### Volver a empezar de cero

Si querés borrar todos los datos y volver a sembrar la base:

```bash
npm run db:reset
```

## Comandos disponibles

| Comando | Qué hace |
|---|---|
| `npm run dev` | Levanta el servidor de desarrollo |
| `npm run build` | Compila la app para producción |
| `npm run start` | Corre la versión compilada (después de `build`) |
| `npm run lint` | Corre el linter |
| `npm run db:seed` | Carga los datos de ejemplo |
| `npm run db:reset` | Borra la base y la vuelve a sembrar |
| `npx prisma studio` | Abre un explorador visual de la base de datos |

## Cómo está organizada la plataforma

### 1. Sitio público (lo que ve el paciente)

- **`/`** — Portada con los datos de la clínica, profesionales y servicios.
- **`/reservar`** — Asistente de reserva en 4 pasos: servicio → profesional (si hay más de uno) → día y horario → datos del paciente → confirmación.
- **`/mis-turnos`** — El paciente busca sus turnos por teléfono (y DNI opcional) y puede cancelarlos si todavía está dentro del plazo permitido.

El asistente de reserva sólo muestra horarios realmente libres: cruza el horario laboral del profesional, los turnos ya ocupados y los bloqueos/feriados cargados, y revalida todo en el servidor al confirmar (para que dos personas no puedan reservar el mismo horario por casualidad).

### 2. Panel administrativo — control total

Entrá en **`/admin`** (te va a pedir login). En el celular vas a ver una barra de navegación abajo; en escritorio, un menú lateral.

- **Inicio** — Resumen del día: turnos de hoy, próximos 7 días, pendientes de confirmar, pacientes totales y la agenda del día con acceso rápido.
- **Agenda** — Vista día por día (con selector rápido de fecha) por profesional. Desde acá cargás turnos "a mano", confirmás, marcás como atendido/no asistió, cancelás o editás cualquier turno.
- **Turnos** — Listado completo con buscador y filtros (por estado, profesional, rango de fechas). Mismas acciones rápidas que en Agenda.
- **Pacientes** — Alta, edición y ficha de cada paciente con su historial completo de turnos y notas/antecedentes. Tocando un paciente entrás a su detalle.
- **Servicios** — Los tipos de consulta que se pueden reservar (nombre, duración, precio, color, y qué profesional/es lo hacen). Se pueden activar/desactivar sin borrarlos.
- **Profesionales** — Alta de médicos/especialistas, cada uno con su color identificatorio.
- **Horarios** — Horario semanal de atención de cada profesional (podés cargar varias franjas por día, por ejemplo mañana y tarde, y copiar el horario a toda la semana con un clic).
- **Bloqueos** — Feriados, vacaciones o bloqueos puntuales (de un profesional o de toda la clínica), de día completo o de un rango horario específico.
- **Configuración** — Nombre, logo, color de marca, datos de contacto (incluye WhatsApp flotante en el sitio), y las reglas del sistema de reservas: duración de cada franja horaria, anticipación mínima para reservar, hasta cuántos días a futuro se puede reservar, y si se permite cancelar online (y con cuánta anticipación). También administrás los usuarios que acceden al panel (dueño/a, administrador o staff).

Todos los cambios de Configuración se aplican al instante, sin reiniciar nada.

## Cómo adaptarla a tu clínica

1. Entrá a **Configuración** y cargá el nombre real, el color de marca, el WhatsApp y demás datos de contacto.
2. En **Profesionales**, borrá o editá la profesional de ejemplo y cargá los médicos reales.
3. En **Servicios**, ajustá los tipos de consulta, duración y precios.
4. En **Horarios**, cargá el horario real de atención de cada profesional.
5. En **Configuración → Usuarios del panel**, creá tu propio usuario y desactivá o eliminá el de ejemplo (`admin@clinica.com`).
6. Si querés arrancar sin los datos de muestra, corré `npm run db:reset` y despues editá directamente desde el panel (o adaptá `prisma/seed.ts` con tus propios datos reales antes de sembrar).

## Llevarla a producción

La base SQLite funciona perfecto para un servidor propio o una VPS (Railway, Render, un VPS con PM2, etc.) donde el archivo `prisma/dev.db` persiste en disco. Pasos generales:

1. `npm run build` y `npm run start` (o el proceso equivalente de tu hosting).
2. Definí las variables de entorno `DATABASE_URL` y `AUTH_SECRET` (generá un secreto nuevo y único para producción, no reutilices el de desarrollo — podés generar uno con `openssl rand -base64 32`).
3. Corré `npx prisma migrate deploy` para aplicar las migraciones en el servidor.

Si vas a desplegar en una plataforma *serverless* (Vercel, etc.) donde el disco no persiste entre invocaciones, cambiá el datasource de Prisma a Postgres (por ejemplo con [Neon](https://neon.tech) o [Supabase](https://supabase.com), ambos con plan gratuito) en vez de SQLite — el resto del código no necesita cambios, solo `prisma/schema.prisma` (`provider = "postgresql"`) y la variable `DATABASE_URL`.

---

¿Dudas sobre alguna pantalla del panel? Cada sección tiene textos de ayuda breves debajo del título. Cualquier cambio adicional (nuevas funciones, otro idioma, reportes, recordatorios por email/WhatsApp, etc.) se puede sumar sobre esta misma base.
