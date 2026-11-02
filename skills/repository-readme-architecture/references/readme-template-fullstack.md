# Plantilla de README para Monorepo / Fullstack E-Commerce

Esta plantilla está optimizada para proyectos fullstack (Backend + Frontend + UI Kit, sin carpetas `contracts/` globales) administrados con pnpm workspaces.

```markdown
# [Nombre de la Plataforma] (ej. Vigilio Commerce Platform)

[![CI](https://github.com/empresa/commerce/actions/workflows/ci.yml/badge.svg)](https://github.com/empresa/commerce/actions)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](docker-compose.yml)
[![Node](https://img.shields.io/badge/node-20.x-blue.svg)](https://nodejs.org)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io)

> Plataforma de comercio electrónico fullstack de alto rendimiento con backend NestJS Hexagonal, frontend React MFE, contratos compartidos y despliegue local contenerizado con Docker.

---

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Tech Stack Unificado](#tech-stack-unificado)
3. [Estructura del Workspace](#estructura-del-workspace)
4. [Flujo Canónico de Contratos](#flujo-canónico-de-contratos)
5. [Quick Start (<10 min)](#quick-start-10-min)
6. [Variables de Entorno](#variables-de-entorno)
7. [Scripts Globales](#scripts-globales)
8. [Testing Multistack](#testing-multistack)
9. [Despliegue Local con Docker](#despliegue-local-con-docker)
10. [Checklist y Buenas Prácticas](#checklist-y-buenas-prácticas)

---

## Visión General

La plataforma ofrece una experiencia omnicanal completa:
- **Catálogo y Búsqueda**: Indexación rápida y filtrado dinámico de productos.
- **Carrito y Órdenes**: Flujo transaccional con bloqueo de inventario y retry resiliente.
- **Pagos**: Integración segura sin almacenar datos sensibles de tarjetas.
- **Panel Administrativo**: Gestión de órdenes, inventario y métricas en tiempo real.

---

## Tech Stack Unificado

| Capa | Tecnologías (versiones fijadas en manifiestos y lockfile) |
|------|----------------------------------------------------------|
| **Backend** | NestJS (Fastify), PostgreSQL, Drizzle/Prisma, Redis, RabbitMQ |
| **Frontend** | React, Vite, Tailwind CSS, TanStack Query, Zustand |
| **Validación & API** | Schemas Zod 4 por módulo propietario + artefacto OpenAPI (`openapi diff` en CI) |
| **Infraestructura Local** | Docker/Podman Compose (imágenes fijadas en `compose.yaml`) |
| **Tooling** | pnpm workspaces (`packages: []` supply-chain hardening), Biome, Vitest, Playwright |
| **Fuente de Versiones** | [vigilio-docs/technology/versions.md](../.vigilio-docs/technology/versions.md) |

---

## Estructura del Workspace

```
.
├── apps/
│   ├── bus-impl/             # Backend API NestJS (schemas/DTOs dentro de cada módulo)
│   │   ├── src/modules/
│   │   └── Dockerfile
│   └── web-mfe/              # Frontend React Vite (Consumidor OpenAPI)
│       ├── src/features/
│       └── Containerfile.runtime
├── packages/
│   └── ui-kit/               # Componentes visuales transversales con consumidor real
├── docker/
│   ├── postgres/
│   └── docker-compose.yml    # Infraestructura de base de datos y colas
├── pnpm-workspace.yaml       # Configuración endurecida de workspace pnpm
└── README.md
```

---

## Flujo Canónico de Compatibilidad API (Cero Carpeta `contracts/`)

```
┌──────────────────────────────────────────┐
│ apps/bus-impl (NestJS Backend)           │
│ src/modules/<mod>/domain/schemas/*.ts    │
│ src/modules/<mod>/presentation/http/dto/ │
└────────────────────┬─────────────────────┘
                     │
                     │ pnpm openapi:export + openapi:diff (CI Gate)
                     ▼
┌──────────────────────────────────────────┐
│ Artefacto OpenAPI 3.1 Verificado         │
│ Sin carpetas globales contracts/         │
└────────────────────┬─────────────────────┘
                     │
                     │ pnpm openapi:codegen (tipos tree-shakeable)
                     ▼
┌──────────────────────────────────────────┐
│ apps/web-mfe (React Frontend)            │
│ Valida formularios por feature + tipado  │
└──────────────────────────────────────────┘
```

> **Regla Senior Mode**: No se crean carpetas `contracts/` ni `packages/contracts/` manuales. Cada módulo de negocio es propietario de sus schemas Zod 4 y DTOs HTTP, evitando acoplar el ciclo de release entre repositorios.

---

## Quick Start (<10 min)

### 1. Clonar e Instalar
```bash
git clone https://github.com/empresa/commerce-platform.git
cd commerce-platform
pnpm install --frozen-lockfile
```

### 2. Variables de Entorno
```bash
cp apps/bus-impl/.env.example apps/bus-impl/.env
cp apps/web-mfe/.env.example apps/web-mfe/.env
```

### 3. Levantar Infraestructura Local
```bash
docker compose -f docker/docker-compose.yml up -d
```

### 4. Ejecutar Migraciones y Generar Tipos OpenAPI
```bash
pnpm --filter @empresa/bus-impl db:migrate
pnpm --filter @empresa/web-mfe openapi:codegen
```

### 5. Iniciar Todo en Modo Desarrollo
```bash
pnpm dev
```
- Backend activo en `http://localhost:3000` (Swagger en `/docs`)
- Frontend activo en `http://localhost:5173`

---

## Variables de Entorno Clave

### Backend (`apps/bus-impl/.env`)
- `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/commerce_db`
- `REDIS_URL`: `redis://localhost:6379`
- `JWT_SECRET`: `supersecret_change_in_production`

### Frontend (`apps/web-mfe/.env`)
- `VITE_API_URL`: `http://localhost:3000`

---

## Scripts Globales

| Comando | Acción |
|---------|--------|
| `pnpm dev` | Levanta backend y frontend concurrentemente |
| `pnpm build` | Compila todos los paquetes y aplicaciones |
| `pnpm test` | Ejecuta suites de tests en todo el workspace |
| `pnpm lint` | Valida formato y linter con Biome |

---

## Despliegue Local con Docker

Para levantar la suite completa contenerizada:
```bash
docker compose up --build -d
```
Todos los servicios quedarán expuestos en sus puertos mapeados.
```
