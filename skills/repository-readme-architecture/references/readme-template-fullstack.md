# Plantilla de README para Monorepo / Fullstack E-Commerce

Esta plantilla está optimizada para proyectos fullstack (Backend + Frontend + Packages/Contracts) en un monorepo administrado con pnpm workspaces o Turborepo.

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

| Capa | Tecnologías |
|------|-------------|
| **Backend** | NestJS 10, Fastify, PostgreSQL, Prisma, Redis, RabbitMQ |
| **Frontend** | React 18, Vite, Tailwind CSS, TanStack Query, Zustand |
| **Contratos** | Zod schemas exportados vía `packages/contracts` |
| **Infraestructura Local** | Docker Compose, PostgreSQL 16, Redis 7, RabbitMQ 3 |
| **Tooling** | pnpm workspaces, Biome, Vitest, Playwright |

---

## Estructura del Workspace

```
.
├── apps/
│   ├── bus-impl/             # Backend API NestJS (Single Source of Truth)
│   │   ├── src/
│   │   └── Dockerfile
│   └── web-mfe/              # Frontend React Vite (Consumidor)
│       ├── src/
│       └── Dockerfile
├── packages/
│   ├── contracts/            # Artefacto compilado con DTOs y schemas compartidos
│   └── ui-kit/               # Componentes visuales transversales
├── docker/
│   ├── postgres/
│   └── docker-compose.yml    # Infraestructura de base de datos y colas
├── pnpm-workspace.yaml       # Configuración de monorepo pnpm
└── README.md
```

---

## Flujo Canónico de Contratos

```
┌─────────────────────────┐
│ apps/bus-impl (NestJS)   │
│ src/**/dto/*.dto.ts     │
└────────────┬────────────┘
             │
             │ pnpm contracts:generate
             ▼
┌─────────────────────────┐
│ packages/contracts       │
│ Artefacto TypeScript    │
└────────────┬────────────┘
             │
             │ workspace:*
             ▼
┌─────────────────────────┐
│ apps/web-mfe (React)    │
│ Importa DTOs sin duplicar│
└─────────────────────────┘
```

> **Nota Senior Mode**: Si el backend fuera reemplazado por un stack no TypeScript (ej. Laravel o Go), `packages/contracts` se retira y `apps/web-mfe` declara sus propios types/interfaces o consume la especificación OpenAPI generada.

---

## Quick Start (<10 min)

### 1. Clonar e Instalar
```bash
git clone https://github.com/empresa/commerce-platform.git
cd commerce-platform
pnpm install
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

### 4. Compilar Contratos y Ejecutar Migraciones
```bash
pnpm --filter @empresa/bus-impl db:migrate
pnpm contracts:build
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
