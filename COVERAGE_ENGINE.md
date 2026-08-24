# Coverage Engine

Módulo desacoplado de verificación de cobertura (obra social / prepaga). Vive en `src/lib/coverage/`, se
integra con el turnero existente mediante dos puntos mínimos en `src/lib/actions/appointments.ts`, y no
reemplaza nada del sistema manual de obra social/coseguro que ya existía (`InsuranceProvider`,
`Patient`/`Appointment.insuranceProvider*`, `defaultCopayment`, el checkbox "Cobertura verificada") —
lo formaliza y lo audita.

## Por qué todo conector es un stub hoy

Ningún organismo argentino publica una API oficial, abierta y documentada para que una clínica privada
verifique cobertura por software:

| Organismo | Acceso | Mecanismo | Fuente |
|---|---|---|---|
| SSSalud (RNAS) | Sólo portal, sin API | Consulta web por CUIL/DNI; el nivel restringido (padrón completo) está limitado a "Agentes del Seguro" y hospitales públicos, no a prestadores privados | sssalud.gob.ar/?page=bus650, seguro.sssalud.gob.ar (instructivo RNOS) |
| PAMI | Sólo portal para afiliados; existe una API real pero sólo para autorización de farmacias | Portal `prestadores.pami.org.ar` (login); web service documentado es "Autorizaciones para Desarrolladores" con alcance exclusivo de farmacias | prestadores.pami.org.ar |
| IOMA | Sólo portal | "Portal Prestadores" con validación de credencial/token, sin API documentada para terceros | ioma.gba.gob.ar/index.php/acceso-prestadores |
| Prepagas (OSDE, Swiss Medical, Galeno, etc.) | Sin API pública documentada | Portales de prestador propios de cada una, acceso bajo convenio bilateral | — |

Por eso, **regla dura no negociable**: está prohibido crear endpoints, URLs, scraping, credenciales
ficticias o conectores que aparenten verificar cobertura real sin un mecanismo oficial autorizado
detrás. Un conector sólo puede pasar de `NOT_AVAILABLE` a `AVAILABLE` cuando exista un mecanismo oficial
documentado por el organismo y la clínica esté efectivamente habilitada como prestador para usarlo.

Hoy, `CONNECTOR_REGISTRY` (`src/lib/coverage/providers/registry.ts`) sólo contiene el conector genérico
`UnavailableOfficialProvider`, usado para toda obra social sin importar cuál sea.

## Arquitectura

```
src/lib/coverage/
  domain/           tipos puros (sin import de prisma), redacción, resolución de coseguro
  providers/         conector(es) + registry en código
  services/           orquestación: dedupe -> registry -> conector -> auditoría
  repositories/       wrappers finos de Prisma (única capa que toca la DB)
  index.ts            barrel: compone services + repositories reales, usado por server actions
```

`domain/` y `providers/unavailable-provider.ts` no importan Prisma, así que son testeables con Vitest sin
base de datos. `services/verify-coverage.ts` y `services/record-manual-verification.ts` reciben la función
de persistencia inyectada (`deps.record`) en vez de importar el repositorio directamente, así se testean
con un repo falso. La composición real (repo de verdad + servicio) vive sólo en `index.ts`, que es lo que
importan las server actions (`src/lib/actions/coverage.ts`, `src/lib/actions/appointments.ts`).

## Estados (`CoverageState`)

```
ACTIVE | INACTIVE | BLOCKED | SUSPENDED | NOT_FOUND | AUTHORIZATION_REQUIRED
| NOT_COVERED | SOURCE_UNAVAILABLE | UNKNOWN | MANUAL_VERIFICATION_REQUIRED
```

**Regla dura no negociable:** cuando `connectorStatus === "NOT_AVAILABLE"`, o el estado es
`SOURCE_UNAVAILABLE`/`UNKNOWN`/`MANUAL_VERIFICATION_REQUIRED`, ninguna UI debe mostrarlo como cobertura
activa/cubierta. La única excepción es la confirmación manual explícita del staff (el checkbox de
siempre): un humano tildando "ya lo confirmé por teléfono" registra `state: ACTIVE` con
`sourceId: "MANUAL_STAFF"`, que es una fuente distinta de cualquier intento automático de conector
(`sourceId: "UNAVAILABLE_OFFICIAL:*"`). `src/lib/coverage/domain/types.ts` expone
`isConfirmedActive(state, connectorStatus)` como única forma correcta de decidir si algo se puede mostrar
en verde, y `NON_CONFIRMING_STATES` para la lista de estados que nunca deben inflarse a "activo". Hay un
test (`unavailable-provider.test.ts`, `verify-coverage.test.ts`) que falla si algún conector stub llegara
a devolver algo que `isConfirmedActive` interprete como confirmado.

## Flujo de integración con el turnero

- **Reserva pública** (`createPublicAppointment`): después de que la reserva ya se confirmó (no toca el
  guard anti doble-reserva `activeSlotKey` ni el rate limiting), dispara `verifyCoverage(...)` sin esperar
  la respuesta (`.catch(() => {})`), sólo si el paciente eligió una cobertura. No cambia el payload de
  respuesta ni agrega latencia percibida. `insuranceVerified` en el turno sigue en `false` como siempre.
- **Carga/edición admin** (`upsertAdminAppointment`): el checkbox "Cobertura verificada" sigue guardando
  exactamente los mismos valores que antes. Además, tras guardar el turno, se llama (con `await`, para
  garantizar que la escritura de auditoría no se pierda en un entorno serverless, pero envuelta en
  `.catch(() => {})` para que un fallo de auditoría nunca haga fallar la carga del turno) a
  `recordManualVerification(...)`, que deja una fila en `CoverageVerification`.

## Coseguros (`CopayRule`)

`InsuranceProvider.defaultCopayment` (ya existente) sigue funcionando como antes. `CopayRule` agrega
reglas más finas (obra social + profesional/servicio opcionales). La resolución
(`src/lib/coverage/domain/copay-resolution.ts`, `resolveCopayAmount`) prioriza: regla exacta
profesional+servicio > regla sólo profesional > regla sólo servicio > regla general de la obra social >
`defaultCopayment` > sin coseguro conocido (`COPAY_UNKNOWN`, `amount: null`). Los montos se manejan como
`Decimal` (`@db.Decimal(10,2)`) en `CopayRule`/`CoverageVerification.suggestedCopaymentAmount`, nunca
`Float`, para evitar errores de precisión monetaria. **Nota de inconsistencia heredada**: los campos
preexistentes `InsuranceProvider.defaultCopayment` y `Appointment.copaymentAmount` ya eran `Float` en el
schema shippeado antes de esta entrega — no se tocaron acá para no forzar una migración de datos
destructiva; sería un buen candidato para una migración futura separada.

## Convenios (`ProviderAgreement`)

Separado a propósito de la relación M2M simple `Professional.insuranceProviders` (que sólo dice "la
acepto en el wizard de reserva"). `ProviderAgreement` registra el estado oficial de convenio/RNP entre un
profesional y una obra social (`ACTIVE`/`PENDING`/`SUSPENDED`/`TERMINATED`/`UNKNOWN`), con vigencia como
`DateTime` real (no string) para poder calcular vigente/vencido/futuro con comparaciones de fecha.

## Auditoría (`CoverageVerification`)

Cada verificación (manual o automática) deja una fila con: `patientId`/`appointmentId`/
`insuranceProviderId`, `state`, `connectorStatus`, `sourceId`, `source` (ONLINE/ADMIN), `durationMs`,
`message`, y `memberNumberMasked` (sólo últimos 4 dígitos, nunca el número completo). Nunca se persiste el
DNI, el número de afiliado completo, ni ningún token/credencial — ver
`src/lib/coverage/domain/redact.ts` (`maskMemberNumber`, `redactForLog`).

## Deduplicación de consultas

`src/lib/coverage/services/dedupe.ts` comparte una única promesa entre llamadas concurrentes con la misma
clave (obra social + afiliado + profesional + servicio). **Limitación documentada**: es un `Map` en
memoria del proceso, así que no dedupea entre invocaciones serverless separadas (mismo límite que ya tiene
`checkRateLimit` en `src/lib/rate-limit.ts`, resuelto ahí con una tabla en DB). Hoy no tiene efecto
práctico porque el único conector resuelve instantáneo; existe para que el mecanismo ya esté en su lugar
cuando un conector real sea más lento.

## Cómo agregar un conector real (cuando exista acceso oficial)

1. Confirmar que existe un mecanismo oficial documentado por el organismo/financiador y que la clínica
   está habilitada como prestador para usarlo (no alcanza con "parece que debería existir un endpoint").
2. Implementar `CoverageProvider` (`src/lib/coverage/domain/types.ts`) en un archivo nuevo dentro de
   `src/lib/coverage/providers/`, con las credenciales leídas desde variables de entorno del servidor
   (nunca `NEXT_PUBLIC_*`, nunca hardcodeadas).
3. Agregar una entrada a `CONNECTOR_REGISTRY` en `src/lib/coverage/providers/registry.ts`.
4. Taggear `InsuranceProvider.connectorKey` para las obras sociales/planes que correspondan (editable
   desde `/admin/coberturas`).
5. Ningún otro archivo cambia: `services/verify-coverage.ts` resuelve el conector por
   `connectorKey` sin saber qué implementación hay detrás.

## Variables de entorno

Ninguna nueva por ahora — no hay conectores reales, no hay credenciales que gestionar. Cuando se agregue
el primer conector real, sus credenciales van sólo en variables de entorno de servidor (nunca expuestas
al cliente) y se documentan acá.

## Testing

Vitest (`npm run test`), agregado en esta entrega — no existía ningún framework de test antes. Cobertura:
transiciones de estado, resolución de coseguro, comportamiento del conector stub, redacción de logs,
dedup de consultas concurrentes, y que ningún estado no confirmado se traduzca en una señal "activa".
`services/verify-coverage.ts` y `services/record-manual-verification.ts` se testean con un repositorio
falso inyectado — **no hay base de datos de test configurada en este repo**, así que no hay tests de
integración reales contra Postgres; eso queda como limitación explícita, no como omisión silenciosa.

## Panel de administración

`/admin/coberturas` (rol ADMIN u OWNER): estado de integraciones (siempre "🟡 Verificación no disponible —
manual" hoy, con la clave de conector editable por obra social), reglas de coseguro, y convenios por
profesional.
