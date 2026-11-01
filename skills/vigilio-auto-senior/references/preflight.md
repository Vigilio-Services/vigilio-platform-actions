# Servicios y E2E por proyecto

Usar plantilla portable `scripts/vigilio-services-check.sh` en el proyecto consumidor, con variables de entorno no secretas y credenciales gestionadas externamente. Verificar PG, Redis/Valkey, HTTP, AWS solo si están configurados, sin exponer secretos ni realizar mutaciones. Preflight favorable no equivale a ejecutar E2E; se deben ejecutar los tests reales y comprobar migraciones/fixtures del entorno de prueba. Fallos producen `FAIL/BLOCKED`, no aprobación.

Fuente: [preflight y E2E](../../.vigilio-docs/standards/testing/environment-preflight-and-e2e.md).


Si el usuario solicita E2E, `pg_isready` NO alcanza: exigir `VIGILIO_REQUIRE_PG_SQL=1` y PGDATABASE del sandbox; comprobar migraciones con procedimiento del proyecto. Si el script omite una comprobación obligatoria, marcar `BLOCKED`, no `PASS`. Rechazar el bootstrap en proyectos con symlinks en rutas destino y documentar que las protecciones de rama no se activan al extraer el ZIP.
