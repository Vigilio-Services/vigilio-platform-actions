---
name: improve-codebase-architecture
description: Escanea deuda arquitectónica con foco en módulos shallow, locality, acoplamiento y seams de prueba. Usar al revisar estructura, modularidad, boundaries, duplicacion o complejidad accidental en proyectos Vigilio.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "cross-stack"
routing_keywords: "engineering, standards, governance, improve-codebase-architecture"
routing_files: "package.json"
routing_capabilities: "engineering-standards, governance"
requires: []
optional: []
conflicts: []
supersedes: []
---

# Improve Codebase Architecture — Vigilio senior mode

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Escanea el codebase buscando oportunidades de profundización (shallow → deep modules), presenta un HTML report visual con diagramas before/after, luego hace `/grilling` para refinar la elegida.

## Vocabulario arquitectónico

Usar exactamente estos términos — no derivar a "componente", "servicio", "API", "boundary":

- **Module** — unidad de organización (no "componente", no "servicio")
- **Interface** — superficie pública del módulo (no "API", no "signature")
- **Implementation** — lo que hay detrás de la interface
- **Depth / deep / shallow** — qué tan cerca está la interface de la implementación
- **Seam** — punto de prueba/extensión (no "boundary")
- **Adapter** — implementación intercambiable detrás de un seam
- **Leverage** — proporción entre call sites y modules
- **Locality** — cuánto del cambio necesario está en un solo módulo

## Stack Vigilio

Los proyectos Vigilio comparten:

- **Stack**: NestJS 11, Zod (3.23.8+ baseline / 4.x candidate), Drizzle/PostgreSQL, Biome, Vitest, Cucumber, Playwright
- **Infra**: AWS CDK v2, stages dev/staging/prod, Lambda via `.artifacts/lambda/`
- **Testing**: unit (Vitest), integration (Drizzle), BDD (Cucumber), E2E (Playwright)
- **Documentación**: vigilio-docs + OpenSpec senior mode (`openspec/`)

## Proceso

### 1. Explorar

Leer `openspec/config.yaml` para entender bounded contexts y dominio. Luego usar `explore` agent para caminar el codebase orgánicamente.

Buscar:

- ¿Dónde entender un concepto requiere brincar entre muchos módulos pequeños?
- ¿Qué módulos son **shallow** — interface casi tan compleja como la implementación?
- ¿Dónde se extrajeron pure functions solo para testabilidad, pero los bugs reales se esconden en cómo se llaman (sin **locality**)?
- ¿Qué partes están acopladas y sus seams dejan filtrar dependencias?
- ¿Qué partes no tienen test, o son difíciles de testear a través de su interface actual?

Aplicar el **deletion test**: si borrara este módulo, ¿la complejidad se concentraría en otro lado o se movería? "Se concentra" es la señal que buscas.

Patrones comunes a vigilar en proyectos Vigilio:
- Zod schemas duplicados entre bounded contexts
- Lógica de negocio en controllers de NestJS (debería estar en services/domain)
- Queries Drizzle inline en handlers (vs. repository pattern)
- Falta de transactions entre operaciones que deberían ser atómicas

### 2. Presentar candidatos como HTML report

Escribir HTML self-contained en el temp directory del OS. Usar `$TMPDIR`, fallback a `/tmp` o `%TEMP%` en Windows. Nombre: `<tmpdir>/vigilio-architecture-<timestamp>.html`. Abrir y mostrar la ruta absoluta.

Layout del report:
- Tailwind via CDN
- Mermaid via CDN (para diagramas graph-shaped)
- SVG/divs custom (para diagramas editoriales: mass diagrams, cross-sections, collapse animations)

Cada candidato es un `<article>` con:

- **Title** — nombre corto del deepening
- **Badge** — `Strong` / `Worth exploring` / `Speculative`
- **Files** — lista monospace
- **Before / After diagram** — side by side
- **Problem** — una oración
- **Solution** — una oración
- **Wins** — bullets ≤6 palabras (usar vocabulario: "locality", "leverage", "interface shrinks")
- **ADR callout** (si aplica) — si contradice un ADR existente, marcarlo

Terminar con **Top recommendation**.

### 3. Grilling loop

Una vez que el usuario elige un candidato, ejecutar `/grilling` (skill `grill-me`) para caminar el árbol de diseño juntos.

Side effects durante la conversación:
- **Si se nombra un concepto nuevo** → proponer agregarlo al glosario del proyecto
- **Si se rechaza un candidato con razón fundada** → ofrecer ADR para que futuras reviews no lo re-sugieran
- **Si se quiere explorar interfaces alternativas** → ejecutar diseño paralelo

## Ver también

- `references/HTML-REPORT.md` — scaffold y patrones de diagramas
- Skill `grill-me` — para la fase de grilling
- `openspec/config.yaml` — bounded contexts y reglas de dominio

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `improve-codebase-architecture`

✅ **Correcto:** en esta tarea, aplicar criterios verificables específicos de esta guía y consultar su owner canónico; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, copiar reglas de otro stack o declarar evidencia sin haberla ejecutado; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

