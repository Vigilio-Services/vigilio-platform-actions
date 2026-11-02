---
name: repository-readme-architecture
description: Autoría y validación de README.md profesionales de producción con quickstart <10 min, arquitectura limpia, contratos, testing, env vars y runbooks para backend, frontend y monorepos.
owner: governance-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "readme, documentation, onboarding, project-overview, quick-start, architecture-overview, setup-guide, developer-checklist"
routing_files: "README.md, CONTRIBUTING.md"
routing_capabilities: "documentation, architecture-governance, onboarding"
requires: []
optional: []
conflicts: []
supersedes: []
---

# repository-readme-architecture — Ejecución Senior/Staff

> Lectura Canónica: [Estándar de README y Onboarding](../.vigilio-docs/standards/engineering/readme-standard.md).

## Principios Auto-Senior del README

1. **Regla de los 10 Minutos**: Cualquier desarrollador nuevo o agente de IA debe clonar, configurar variables de entorno, instalar dependencias y levantar el proyecto en menos de 10 minutos sin hacer preguntas.
2. **Cero Secretos Hardcodeados**: Ningún secreto, API key o contraseña en el README ni en git. Todo se documenta en `.env.example` con descripciones de formato.
3. **Flujo de API y Contratos sin Carpeta `contracts/` Global**:
   - Si el backend es **NestJS / TypeScript**: Documentar que cada módulo de dominio posee sus propios schemas Zod 4 (`domain/schemas/`) y DTOs HTTP (`presentation/http/dto/`), publicando la especificación OpenAPI verificada con `openapi diff` en CI (sin carpetas globales `contracts/` ni `packages/contracts/`).
   - Si el backend es **Laravel, Python, Go o API externa**: Documentar que el consumidor gestiona sus propias `interfaces/`, `types/` por feature o genera clientes tipados desde OpenAPI/Scalar.
4. **Testing Obligatorio antes de Deploy**: Comandos claros para unitarios, e2e y linting en local y en CI.
5. **Estructura de Carpetas Explicada**: No solo listar el árbol, sino explicar la responsabilidad arquitectónica de cada directorio.

## Estructura Anatómica Obligatoria (12 a 15 Secciones)

| # | Sección | Propósito Senior |
|---|---------|------------------|
| 1 | **Header & Badges** | Nombre del proyecto, tagline de una línea, badges de CI, cobertura, versión. |
| 2 | **Table of Contents** | Enlaces directos a cada sección para navegación rápida. |
| 3 | **Overview & Features** | Problema de negocio que resuelve y lista de capacidades clave. |
| 4 | **Tech Stack** | Runtime, lenguaje, framework, base de datos, colas, caching, testing. |
| 5 | **Architecture Overview** | Diagrama de flujo de datos (Mermaid o ASCII) y boundaries. |
| 6 | **Repository Structure** | Árbol de carpetas anotado con el ownership arquitectónico. |
| 7 | **Quick Start (<10 min)** | Prerrequisitos, clonado, `.env` setup, instalación y dev server. |
| 8 | **Environment Variables** | Tabla completa con nombre, requerida (Sí/No), default y descripción. |
| 9 | **API & Contracts** | Endpoints clave, DTOs compartidos o interfaces locales según stack. |
| 10 | **Testing Strategy** | Comandos para unitarios, integración, e2e y cobertura mínima. |
| 11 | **CI/CD Pipeline** | Flujo de GitHub Actions/GitLab CI y gates de calidad. |
| 12 | **Deployment & Docker** | Instrucciones de Docker Compose, staging y producción. |
| 13 | **Developer Checklist** | Lista de chequeo previa a abrir un Pull Request. |
| 14 | **Troubleshooting & Common Pitfalls** | Errores típicos y sus soluciones inmediatas. |
| 15 | **Contributing & License** | Reglas de branching, commits semánticos y licencia. |

## Lectura obligatoria de referencias

Read each linked reference completely before the work that depends on it:

- Read [readme-template-backend.md](references/readme-template-backend.md) para microservicios backend (NestJS / bus-impl / Laravel).
- Read [readme-template-frontend.md](references/readme-template-frontend.md) para aplicaciones y micro frontends (React / web-mfe / Vite).
- Read [readme-template-fullstack.md](references/readme-template-fullstack.md) para monorepos e-commerce fullstack con pnpm workspaces.
- Read [readme-checklist.md](references/readme-checklist.md) para el checklist de calidad pre-merge y prevención de pitfalls.

## Reglas Correcto / Incorrecto

✅ Instrucciones paso a paso reproducibles en terminal virgen.
✅ Explicar cómo cada módulo posee sus schemas/DTOs y cómo se valida compatibilidad OpenAPI (`openapi diff`) sin crear carpetas globales `contracts/`.
✅ Explicar cómo levantar dependencias auxiliares con `docker compose up -d`.
✅ Incluir tabla exhaustiva de variables de entorno con valores dummy seguros.

❌ Escribir "Configurar el .env con las credenciales que te pase el líder por Slack".
❌ READMEs desactualizados donde `npm run dev` falla por falta de migraciones previas no documentadas.
❌ Árboles de carpetas gigantes sin explicar la responsabilidad de cada módulo.
❌ Decir "TODO: completar después" en secciones de testing o despliegue.
