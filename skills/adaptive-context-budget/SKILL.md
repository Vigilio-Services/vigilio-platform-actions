---
name: adaptive-context-budget
description: Orquesta un presupuesto de contexto por evidencias y carga selectiva sin comprimir contratos ni omitir skills seleccionadas.
owner: governance-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "any"
routing_keywords: "tokens,contexto,context budget,ahorrar tokens,skills,orquestacion,leer skills"
routing_files: "package.json"
routing_capabilities: "architecture"
requires: []
optional: []
conflicts: []
supersedes: []
---

# adaptive-context-budget — ejecución Senior/Staff


## Contrato único

**Usar para tareas complejas, multistack, repositorios grandes o presupuesto bajo.** Complementa `codebase-context-efficiency` (búsqueda) y `token-context-compression` (ruido de logs). No reemplaza esas skills. Leer por completo [política canónica](../.vigilio-docs/standards/ai/adaptive-context-budget-and-evidence.md), [orquestación](../.vigilio-docs/standards/ai/skill-orchestration-policy.md) y [protocolo de lectura](../.vigilio-docs/standards/ai/precision-skill-reading-and-conflict-resolution.md).

## Procedimiento (sin afirmar lecturas automáticas)

1. Abrir alcance de tarea, `AGENTS.md`, árbol/manifests/diff. No buscar el contenido de todas las skills del catálogo.
2. Ejecutar o reproducir `route-skills.mjs --root <repo> --task <petición>`; **solo propuesta**.
3. Seleccionar por owner y pruebas/contratos; utilizar `plan-skill-context.mjs --routing <json>` como ayuda de tamaño. Su plan NO lee las skills por el modelo.
4. Leer `SKILL.md` **íntegra** para cada skill que realmente se ejecutará; recorrer las referencias marcadas obligatorias y documentos canónicos pertinentes. `read-skill.mjs` produce contenido+SHA; consumirlo realmente antes de registrar lectura.
5. Investigar código con búsquedas focalizadas; ampliar al detectar imports, rutas, tests o referencias truncadas. Nunca recortar un error singular o política de seguridad.
6. Ejecutar tareas y gates sin omitir calidad por presupuesto; reportar `PASS/FAIL/BLOCKED/NOT_RUN` con evidencia y review independiente.

## Ejemplo correcto y contraejemplo

**Login NestJS:** después del router leer auth, security, UX y tests pertinentes, inspeccionar DTO y consumidores; no cargar Rust, Qt, Godot. **Incorrecto:** imprimir solo metadata del registry y decir «leí todo el catálogo»; truncar una `SKILL.md` y llamarla leída; comprimir logs antes de revisar error único.

## Evaluación

Caso C puro, monorepo con `--scope`, proyecto sin repo, Godot audio y juego 3D; comprobar selección focalizada, fallback de lectura si fuente ausente, huella SHA y no falso PASS.

## ✅ Correcto / ❌ Incorrecto

- ✅ **Correcto:** Leer solo skills relevantes completas y conservar fuente sin comprimir.
- ❌ **Incorrecto:** Usar presupuesto como excusa para ignorar una SKILL.md seleccionada.

