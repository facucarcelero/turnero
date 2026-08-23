# Turnero Clínicas

Plataforma de turnos online completa: sitio público para que los pacientes reserven turnos las 24&nbsp;hs, y un panel de administración con control total sobre agenda, pacientes, servicios, profesionales, horarios y configuración. Pensada originalmente para un consultorio de ginecología, pero funciona para cualquier clínica con uno o varios profesionales.

Optimizada **mobile-first**: tanto el sitio de reservas como el panel admin están pensados primero para el celular (la forma en que la mayoría de los pacientes y del personal la va a usar) y se adaptan perfectamente a tablet y escritorio.

## Stack técnico

- **Next.js 16** (App Router, TypeScript) + **Tailwind CSS 4**
- **Prisma** + **PostgreSQL** (recomendado: [Neon](https://neon.tech), gratis y sin tarjeta — funciona en cualquier hosting, incluidos los serverless como Netlify o Vercel)
- **NextAuth v5** (login del panel con email + contraseña)
- **Server Actions** para toda la lógica de negocio (sin API REST intermedia)

## Puesta en marcha (primera vez)

Requisito: [Node.js](https://nodejs.org) 20 o superior, y una base Postgres gratis en [neon.tech](https://neon.tech):

1. Creá una cuenta en [neon.tech](https://neon.tech) (con GitHub o Google, sin tarjeta) y un proyecto nuevo.
2. En el dashboard del proyecto, andá a **Connect** y copiá las dos cadenas de conexión:
   - La que dice **Pooled connection** (el host tiene `-pooler` en el nombre) → pegala en `DATABASE_URL` en el archivo `.env`.
   - La conexión **directa** (sin `-pooler`) → pegala en `DIRECT_URL` en `.env`.
3. Instalá dependencias y aplicá el esquema:

```bash
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Esto deja el sitio corriendo en **http://localhost:2001**.

> Podés usar esta misma base de Neon tanto para desarrollo local como para producción — para un proyecto de este tamaño no hace falta tener bases separadas, aunque si preferís separarlas simplemente creá un segundo proyecto en Neon para producción.

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
- **`/mis-turnos`** — El paciente busca sus turnos por teléfono (y DNI opcional) y puede cancelarlos si todavía está dentro del plazo permitido. El dispositivo recuerda el teléfono usado (guardado sólo en el navegador del paciente) para no tener que volver a escribirlo en la próxima visita; hay un botón "Olvidar" para borrar ese dato del dispositivo en cualquier momento.

El asistente de reserva sólo muestra horarios realmente libres: cruza el horario laboral del profesional, los turnos ya ocupados y los bloqueos/feriados cargados, y revalida todo en el servidor al confirmar (para que dos personas no puedan reservar el mismo horario por casualidad).

### 2. Panel administrativo — control total

Entrá en **`/admin`** (te va a pedir login). En el celular vas a ver una barra de navegación abajo; en escritorio, un menú lateral. El menú y los permisos se ajustan automáticamente según el rol de quien inicia sesión (ver más abajo).

- **Inicio** — Resumen del día: turnos de hoy, próximos 7 días, pendientes de confirmar, pacientes totales y la agenda del día con acceso rápido.
- **Agenda** — Vista día por día (con selector rápido de fecha) por profesional. Desde acá cargás turnos "a mano", confirmás, marcás como atendido/no asistió, cancelás o editás cualquier turno.
- **Turnos** — Listado completo con buscador y filtros (por estado, profesional, rango de fechas). Mismas acciones rápidas que en Agenda.
- **Pacientes** — Alta, edición y ficha de cada paciente con su historial completo de turnos y notas/antecedentes. Tocando un paciente entrás a su detalle.
- **Servicios** — Los tipos de consulta que se pueden reservar (nombre, duración, precio, color, y qué profesional/es lo hacen). Se pueden activar/desactivar sin borrarlos. *(sólo Administrador/Dueño)*
- **Profesionales** — Alta de médicos/especialistas, cada uno con su color identificatorio. *(sólo Administrador/Dueño)*
- **Horarios** — Horario semanal de atención de cada profesional (podés cargar varias franjas por día, por ejemplo mañana y tarde, y copiar el horario a toda la semana con un clic).
- **Bloqueos** — Feriados, vacaciones o bloqueos puntuales (de un profesional o de toda la clínica), de día completo o de un rango horario específico.
- **Mi perfil** — *(sólo si tu usuario está vinculado a un profesional, ver abajo)* Editá tu propio nombre, especialidad, biografía, foto y color, y cambiá tu contraseña, sin depender de que un administrador lo haga por vos.
- **Configuración** — Nombre, logo, color de marca, datos de contacto (incluye WhatsApp flotante en el sitio), y las reglas del sistema de reservas: duración de cada franja horaria, anticipación mínima para reservar, hasta cuántos días a futuro se puede reservar, y si se permite cancelar online (y con cuánta anticipación). *(sólo Administrador/Dueño; la gestión de usuarios del panel es exclusiva del Dueño/a)*

Todos los cambios de Configuración se aplican al instante, sin reiniciar nada.

### 3. Roles y autogestión de cada profesional

Hay tres roles de usuario del panel:

| Rol | Alcance |
|---|---|
| **Dueño/a (OWNER)** | Control total: además de todo lo de Administrador, crea/edita/elimina usuarios del panel y decide quién se vincula a qué profesional. |
| **Administrador (ADMIN)** | Gestiona clínica, servicios, profesionales, horarios y agenda de todos. No puede tocar los usuarios del panel. |
| **Staff (STAFF)** | Ve y gestiona turnos/agenda/pacientes. Si además está **vinculado a un profesional**, su acceso queda automáticamente acotado a su propia agenda, sus propios turnos y su propio horario, y gana la sección "Mi perfil" para autogestionar sus datos y contraseña — sin ver ni tocar la configuración general de la clínica ni la agenda de otros profesionales. |

Para dar de alta el acceso de un profesional a la agenda, desde **Configuración → Usuarios del panel** (Dueño/a) creás su usuario con rol Staff y lo **vinculás al profesional correspondiente**: a partir de ahí esa persona entra con su propio email y contraseña, y el sistema le muestra únicamente lo suyo. Todos los permisos se validan también del lado del servidor (no sólo ocultando botones), así que aunque alguien intente forzar una acción fuera de su rol, el sistema la rechaza.

## Cómo adaptarla a tu clínica

1. Entrá a **Configuración** y cargá el nombre real, el color de marca, el WhatsApp y demás datos de contacto.
2. En **Profesionales**, borrá o editá la profesional de ejemplo y cargá los médicos reales.
3. En **Servicios**, ajustá los tipos de consulta, duración y precios.
4. En **Horarios**, cargá el horario real de atención de cada profesional.
5. En **Configuración → Usuarios del panel**, creá tu propio usuario y desactivá o eliminá el de ejemplo (`admin@clinica.com`).
6. Si querés arrancar sin los datos de muestra, corré `npm run db:reset` y despues editá directamente desde el panel (o adaptá `prisma/seed.ts` con tus propios datos reales antes de sembrar).

## Llevarla a producción (Netlify)

1. En **Netlify → Site settings → Environment variables** cargá:
   - `DATABASE_URL` → la cadena **pooled** de Neon.
   - `DIRECT_URL` → la cadena **directa** de Neon.
   - `AUTH_SECRET` → generá uno nuevo y distinto al de desarrollo, por ejemplo con `openssl rand -base64 32` (o `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`).
2. Comando de build: `npm run build` (ya configurado). El propio `npm install` genera el cliente de Prisma automáticamente.
3. La primera vez (y cada vez que cambies el esquema), aplicá las migraciones contra la base de producción desde tu máquina:
   ```bash
   DATABASE_URL="<la pooled de Neon>" DIRECT_URL="<la directa de Neon>" npx prisma migrate deploy
   ```
   (o simplemente corré `npx prisma migrate deploy` con esas variables ya cargadas en tu `.env` si usás la misma base para todo).
4. Redeploy en Netlify.

El middleware (`src/proxy.ts`) usa una configuración de auth separada y liviana (`src/lib/auth.config.ts`), sin Prisma ni bcrypt, para no romper el runtime restringido de Netlify — no lo modifiques para que no vuelva a importar Prisma ahí.

---

¿Dudas sobre alguna pantalla del panel? Cada sección tiene textos de ayuda breves debajo del título. Cualquier cambio adicional (nuevas funciones, otro idioma, reportes, recordatorios por email/WhatsApp, etc.) se puede sumar sobre esta misma base.
