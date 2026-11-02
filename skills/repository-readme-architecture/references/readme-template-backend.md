# Plantilla de README para Backend (NestJS / bus-impl / Microservicios)

Esta plantilla está optimizada para servicios backend robustos. Adapta las secciones entre corchetes `[...]` al contexto de tu proyecto.

```markdown
# [Nombre del Servicio] (ej. Orders Service — bus-impl)

[![CI](https://github.com/empresa/repo/actions/workflows/ci.yml/badge.svg)](https://github.com/empresa/repo/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen.svg)](https://github.com/empresa/repo)
[![Node](https://img.shields.io/badge/node-20.x-blue.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Microservicio backend de gestión de órdenes y procesamiento asíncrono con arquitectura Hexagonal/DDD, persistencia transaccional y publicación de eventos.

---

## Tabla de Contenidos

1. [Características](#características)
2. [Tech Stack](#tech-stack)
3. [Arquitectura](#arquitectura)
4. [Estructura del Repositorio](#estructura-del-repositorio)
5. [Quick Start (<10 min)](#quick-start-10-min)
6. [Variables de Entorno](#variables-de-entorno)
7. [Contratos y API](#contratos-y-api)
8. [Testing](#testing)
9. [Despliegue y Docker](#despliegue-y-docker)
10. [Checklist del Desarrollador](#checklist-del-desarrollador)
11. [Pitfalls Comunes](#pitfalls-comunes)

---

## Características

- **Gestión de Órdenes**: Creación, validación, actualización y cancelación con idempotencia.
- **Outbox Pattern**: Publicación garantizada de eventos a colas RabbitMQ / Kafka sin inconsistencia con la BD.
- **Contratos Reutilizables**: Single Source of Truth para DTOs y schemas consumibles por clientes web y mobile.
- **Observabilidad**: Métricas Prometheus (`/metrics`), tracing OpenTelemetry y health checks (`/health/liveness`, `/health/readiness`).

---

## Tech Stack

- **Runtime & Lenguaje**: Node.js (fijado en `package.json#engines`) / TypeScript
- **Framework**: NestJS (Fastify adapter)
- **Validación**: Zod
- **Base de Datos & Caché**: PostgreSQL con Drizzle/Prisma; Redis/Valkey (versiones en `docker-compose.yml`)
- **Mensajería**: RabbitMQ / Redis Streams
- **Testing**: Vitest / Supertest
- **Línea Canónica de Plataforma**: Verificada en [vigilio-docs/technology/versions.md](../.vigilio-docs/technology/versions.md)

---

## Arquitectura

```
HTTP / Queue Events
        │
        ▼
┌────────────────────────────────────────────────────────┐
│ Presentation Layer (Controllers, DTOs, Event Handlers)  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Application Layer (Use Cases, Commands, Queries, Ports)│
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Domain Layer (Entities, Value Objects, Domain Events)  │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────────┐
│ Infrastructure Layer (DB Repositories, Adapters, Outbox)│
└────────────────────────────────────────────────────────┘
```

---

## Estructura del Repositorio

```
src/
├── orders/
│   ├── domain/               # Entidades, Value Objects, eventos y constantes de negocio
│   │   ├── entities/
│   │   ├── events/
│   │   └── constants/        # Reglas de negocio (ej. MAX_ITEMS, ORDER_TIMEOUT_MS)
│   ├── application/          # Casos de uso y puertos (interfaces)
│   │   ├── use-cases/
│   │   └── ports/
│   ├── infrastructure/       # Adaptadores de BD, clientes externos y repositorios
│   │   ├── persistence/
│   │   └── messaging/
│   └── presentation/         # Controladores HTTP y DTOs de entrada/salida
│       ├── http/
│       └── dto/
├── shared/                   # Utilidades de kernel transversal comprobado (Logger, Result)
└── main.ts                   # Bootstrap de la aplicación NestJS
```

---

## Quick Start (<10 min)

### Prerrequisitos
- **Node.js**: Definido en `package.json` (`"engines"`) o `.nvmrc` / `.node-version`.
- **Package Manager**: pnpm (definido en `package.json` (`"packageManager"`)).
- **Docker y Docker Compose**: Para infraestructura local contenerizada (servicios fijados en `docker-compose.yml`).

### 1. Clonar el repositorio
```bash
git clone https://github.com/empresa/orders-service.git
cd orders-service
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
```

### 3. Levantar servicios de infraestructura local
```bash
docker compose up -d postgres rabbitmq redis
```

### 4. Instalar dependencias y ejecutar migraciones
```bash
pnpm install
pnpm db:migrate
pnpm db:seed # opcional: carga datos de prueba
```

### 5. Iniciar en modo desarrollo
```bash
pnpm dev
```
Servicio activo en `http://localhost:3000`. Swagger disponible en `http://localhost:3000/docs`.

---

## Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `PORT` | No | `3000` | Puerto HTTP del microservicio |
| `NODE_ENV` | Sí | `development` | Entorno: `development`, `test`, `production` |
| `DATABASE_URL` | Sí | - | Connection string PostgreSQL |
| `RABBITMQ_URL` | Sí | - | Connection string AMQP |
| `JWT_SECRET` | Sí | - | Clave HMAC para validación de tokens Bearer |

---

## Contratos y API

### Si el Backend es NestJS (Single Source of Truth con Tree-Shaking)
Este servicio es dueño de los contratos canónicos. Para compilar y publicar el paquete consumido por frontend:
```bash
pnpm contracts:generate
pnpm contracts:build
```
Genera `packages/contracts` listo para ser importado por `apps/web-mfe` o `apps/mobile-mfe` mediante subpaths específicos por servicio (ej. `@empresa/orders-contracts/ecommerce-bus-impl`). El paquete declara `"sideEffects": false` para garantizar **Tree-Shaking total**, evitando que el frontend cargue esquemas de otros servicios no utilizados.

### Si el Backend NO es NestJS (ej. Laravel o Python)
Si este repositorio es un consumidor de un backend externo o no-TS:
- No inventar `packages/contracts`.
- Declarar DTOs e interfaces locales en `src/interfaces/` o generar tipos desde el archivo OpenAPI:
```bash
pnpm openapi:generate
```

---

## Testing

```bash
# Tests unitarios
pnpm test

# Tests con cobertura (mínimo 80%)
pnpm test:cov

# Tests de integración (requiere BD docker arriba)
pnpm test:e2e
```

---

## Despliegue y Docker

```bash
# Build de la imagen Docker de producción
docker build -t orders-service:latest -f Dockerfile .

# Levantar contenedor
docker run -p 3000:3000 --env-file .env orders-service:latest
```

---

## Checklist del Desarrollador (Pre-PR)

- [ ] `pnpm lint` sin warnings.
- [ ] `pnpm test` pasando al 100%.
- [ ] Migraciones reversibles probadas (`pnpm db:migrate` y `pnpm db:rollback`).
- [ ] Ningún secreto hardcodeado en el código ni en los commits.
- [ ] Constantes de negocio extraídas a `constants/` (no dentro del servicio).

---

## Pitfalls Comunes

1. **Error de conexión a PostgreSQL**: Asegúrate de ejecutar `docker compose up -d postgres` antes de `pnpm dev`.
2. **Schema Drift**: Si modificas el modelo Prisma/TypeORM, corre `pnpm db:migrate` antes de reiniciar.
```
