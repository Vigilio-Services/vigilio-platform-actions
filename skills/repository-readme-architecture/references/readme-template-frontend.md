# Plantilla de README para Frontend (React / web-mfe / Vite / Next.js)

Esta plantilla está optimizada para aplicaciones y Micro Frontends (MFE). Adapta las secciones entre corchetes `[...]` al contexto de tu proyecto.

```markdown
# [Nombre del Frontend] (ej. Checkout Web MFE — web-mfe)

[![CI](https://github.com/empresa/web-mfe/actions/workflows/ci.yml/badge.svg)](https://github.com/empresa/web-mfe/actions)
[![Bundle Size](https://img.shields.io/badge/bundle-<150kb-blue.svg)](https://github.com/empresa/web-mfe)
[![React](https://img.shields.io/badge/React-18.x-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org)

> Micro Frontend web responsable del flujo de checkout, pagos, resumen de orden y confirmación de compra.

---

## Tabla de Contenidos

1. [Características](#características)
2. [Tech Stack](#tech-stack)
3. [Consumo de Contratos](#consumo-de-contratos)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Quick Start (<5 min)](#quick-start-5-min)
6. [Variables de Entorno](#variables-de-entorno)
7. [Testing](#testing)
8. [Build y Rendimiento](#build-y-rendimiento)
9. [Checklist del Desarrollador](#checklist-del-desarrollador)
10. [Troubleshooting](#troubleshooting)

---

## Características

- **Flujo de Pago Unificado**: Integración con tarjeta de crédito, débito y pasarelas digitales.
- **Validación en Tiempo Real**: Formularios reactivos con feedback instantáneo y accesibilidad WCAG 2.1 AA.
- **Modo Offline/Mock**: Desarrollo local sin dependencia obligatoria del backend en vivo vía MSW (Mock Service Worker).
- **Tipado Fuerte de Contratos**: Reutilización estricta de DTOs del backend para evitar divergencias de payloads.

---

## Tech Stack

- **Framework**: React / Vite (fijados en `package.json` y `pnpm-lock.yaml`)
- **Lenguaje**: TypeScript estricto
- **Estilos**: Tailwind CSS
- **State Management**: TanStack Query + Zustand / Signals
- **Formularios & Validación**: React Hook Form + Zod
- **Mocking**: Mock Service Worker (MSW)
- **Testing**: Vitest + React Testing Library + Playwright
- **Línea Canónica de Plataforma**: Verificada en [vigilio-docs/technology/versions.md](../.vigilio-docs/technology/versions.md)

---

## Consumo de API y Tipos por Feature (Cero Carpeta `contracts/` Global)

Este frontend **no depende de carpetas globales `contracts/` ni `packages/contracts/`**:
- Genera tipos/clientes con tree-shaking desde el artefacto OpenAPI verificado por `openapi diff` del backend (`pnpm openapi:codegen`), o
- Declara los schemas Zod 4 de validación de formularios y tipos de respuesta dentro de su propio módulo propietario (`src/features/<feature>/schemas/` y `src/features/<feature>/types/`).

```typescript
// ✅ Correcto: tipos generados desde OpenAPI + validación de formulario en la feature propietaria
import type { CreateOrderRequest, OrderResponse } from '@/shared/api/generated/orders.types';
import { createOrderFormSchema } from '@/features/orders/schemas/create-order.schema';
```

---

## Estructura del Proyecto

```
src/
├── features/
│   └── checkout/
│       ├── components/       # Componentes de presentación (Button, PaymentCard)
│       ├── hooks/            # Custom hooks de lógica (useCheckoutForm)
│       ├── services/         # Clientes HTTP y llamadas a API
│       ├── constants/        # Reglas de UI (TIMEOUT_MS, MAX_RETRY, FORMATOS)
│       └── types/            # Tipos locales (solo si backend no es NestJS)
├── shared/                   # Componentes atómicos de Design System (UI kit)
│   ├── buttons/
│   ├── inputs/
│   └── layout/
├── App.tsx                   # Routing y Providers de contexto
└── main.tsx                  # Punto de entrada Vite
```

---

## Quick Start (<5 min)

### Prerrequisitos
- **Node.js**: Definido en `package.json` (`"engines"`) o `.nvmrc` / `.node-version`.
- **Package Manager**: pnpm (definido en `package.json` (`"packageManager"`)).

### 1. Clonar e instalar
```bash
git clone https://github.com/empresa/checkout-web-mfe.git
cd checkout-web-mfe
pnpm install
```

### 2. Variables de entorno
```bash
cp .env.example .env
```

### 3. Ejecutar en modo desarrollo
```bash
# Modo con mocks (sin necesidad de backend activo)
pnpm dev:mock

# Modo conectado al backend local
pnpm dev
```
Abrir `http://localhost:5173` en el navegador.

---

## Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `VITE_API_BASE_URL` | Sí | `http://localhost:3000` | URL base de la API backend |
| `VITE_ENABLE_MOCKS` | No | `false` | Activa Mock Service Worker en desarrollo |
| `VITE_PAYMENT_GATEWAY_KEY`| Sí | `pk_test_...` | Clave pública de pasarela de pago |

---

## Testing

```bash
# Unitarios y componentes
pnpm test

# Modo watch
pnpm test:watch

# Tests End-to-End con Playwright
pnpm test:e2e
```

---

## Build y Rendimiento

```bash
# Compilación para producción
pnpm build

# Preview del build de producción
pnpm preview

# Análisis de tamaño de bundle
pnpm analyze
```

---

## Checklist del Desarrollador (Pre-PR)

- [ ] `pnpm typecheck` pasa sin ningún error TypeScript.
- [ ] `pnpm lint` sin warnings.
- [ ] `pnpm test` pasando con cobertura adecuada.
- [ ] Formularios probados con teclado y lector de pantalla (a11y).
- [ ] Cero `any` o interfaces duplicadas si existe paquete de contratos.
```
