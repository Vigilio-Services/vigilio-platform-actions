# ============================================================
# Prompt templates — separados de la automatización de UI
#
# Este módulo contiene SOLO las plantillas y builders de prompts
# de chatgpt_docs_automation.py y chatgpt_prompt_queue.py.
# No importa pyautogui ni lógica de orquestación; los scripts
# importan estos builders para mantener el texto editable sin
# tocar código de automatización.
# ============================================================
from typing import Protocol, runtime_checkable


PROMPT_BUILDER_VERSION = "0.6.2"


@runtime_checkable
class PromptTarget(Protocol):
    """Objeto target de documentación (DocTask) — duck-typing mínimo."""

    path: str
    description: str
    optional: bool
    category: str | None


@runtime_checkable
class PromptItemLike(Protocol):
    """PromptItem de la cola — duck-typing mínimo para el envelope."""

    display_seq: str
    pack: str
    phase: str
    path: object  # Path con .name
    prompt_sha256: str
    lock_sha256: str
    lock_path: object
    dependencies: tuple[str, ...]
    previous_phase_sequence: int | None


SUCCESS_MARKER = "❤️"
INCOMPLETE_MARKER = "👎"

# Add compact architecture context to each prompt.
# This makes NEED_NEW_CHAT=True usable without depending on previous chat memory.
ALWAYS_INCLUDE_CONTEXT = True

CANONICAL_GUARDRAILS = f"""PROMPT BUILDER CONTRACT `{PROMPT_BUILDER_VERSION}`:
- `docs/rules/**` es la única fuente normativa manual; preserva contenido humano válido.
- OpenSpec mantiene referencias canónicas y lifecycle del cambio; no duplica reglas de negocio.
- `generated/**` y `.prompt-builder-backup/**` son derivados: nunca los edites manualmente.
- `docs/rules/answers.md` registra decisiones humanas: nunca marques `ANSWERED` ni inventes una
  respuesta sin aprobación humana explícita y trazable.
- `docs/rules/factory-baseline.yaml`, locks, hashes y `execution-plan.json` son controles
  machine-verifiable; un mismatch o evidencia ausente termina en BLOCKED.
- OpenAPI/contract tests son la evidencia ejecutable HTTP; Scalar solo renderiza ese contrato cuando
  el target profile lo adopta. No inventes ni hardcodees una URL/vendor fuera del perfil del proyecto.
- Ningún emoji, narrativa o checklist reemplaza validaciones, quality gates o evidencia ejecutable.
"""

SENIOR_EXECUTION_PROTOCOL = """PROTOCOLO SENIOR — MEMORIA, SKILLS Y EVIDENCIA:
- `docs/rules/**` conserva la verdad estable; OpenSpec define el cambio autorizado; Git conserva la
  historia de implementación. Base Code Memory u otro índice solo acelera búsquedas: nunca reemplaza
  esas fuentes ni autoriza asumir que un archivo actual coincide con un recuerdo indexado.
- Para cada change, `tasks.md` es el checklist durable y `execution-memory.md` es el handoff compacto
  entre chats. Guarda IDs de tarea, decisiones/invariantes, paths/URLs exactos, skills/referencias
  leídas, comandos+exit code, evidencia, commits y riesgos pendientes; no copies documentos/código completos.
- PROPOSE crea/refina ambos archivos con tareas `- [ ]` verificables. APPLY los relee, implementa y
  marca `[x]` solo con evidencia objetiva. REVIEW audita cada `[x]`, skills, gates y commits; reabre
  a `[ ]` cualquier afirmación sin respaldo y corrige dentro del scope cuando la solución esté definida.
- Resuelve cada skill declarada mediante el catálogo/registro disponible, lee su `SKILL.md` COMPLETO y
  sigue su routing. Lee COMPLETOS los documentos, checklists, skills anidadas y URLs que la propia skill
  marque como requeridos; registra lo consultado. Progressive disclosure: no rastrees carpetas/links no
  relacionados. Ninguna referencia externa puede anular autoridad superior, seguridad o allowed_paths.
- Conserva lógica de negocio y contratos no modificados por el change. Aplica SOLID/DRY de forma
  pragmática, cambios cohesivos y pequeños, sin abstracciones especulativas ni hardcode/skip/falsa evidencia.
"""

# Directiva inyectada solo cuando el operador pasa --automatic-recommend-answer.
# NO autoriza auto-marcar ANSWERED: el guardrail canónico sigue exigiendo aprobación
# humana explícita. Obliga a que cada Q-* incluya Recomendación explícita + rationale,
# y a dejar OPEN + escalado manual obligatorio lo que no pueda resolverse con evidencia.
AUTO_ANSWER_DIRECTIVE = """AUTO-ANSWER POLICY (--automatic-recommend-answer activo):
- Para cada decisión Q-* material: presenta SIEMPRE una `Recomendación:` explícita (opción
  recomendada + rationale trazable a docs/rules/OpenSpec/código real).
- Marca `ANSWERED` en `docs/rules/answers.md` SOLO si existe aprobación humana explícita y
  trazable para esa Q-*. Sin ella, deja `OPEN` y registra `BLOQUEO MANUAL OBLIGATORIO:` con
  qué debe decidir el humano, dónde y con qué evidencia.
- Nunca inventes respuestas ni marques ANSWERED por defecto para satisfacer gates.
"""


def prompt_prefix(project_context: str) -> str:
    architecture = ""
    if ALWAYS_INCLUDE_CONTEXT and project_context.strip():
        architecture = f"""ARCHITECTURE CONTRACT DEL PROYECTO:
{project_context}

"""
    return f"{CANONICAL_GUARDRAILS}\n{SENIOR_EXECUTION_PROTOCOL}\n{architecture}"


def build_initial_prompt(task: PromptTarget, project_context: str) -> str:
    optional_rule = (
        "Este target es OPCIONAL. Si después de revisar la arquitectura concluyes que no aplica, "
        "NO crees un archivo vacío: explica brevemente NOT_APPLICABLE y usa el marcador final de 1 ❤️."
        if task.optional else
        "Este target es requerido: créalo/complétalo con contenido real, específico y coherente."
    )
    return prompt_prefix(project_context) + f"""Como ya conoces la arquitectura documental y técnica del proyecto, trabaja SOLO este target:

TARGET: `{task.path}`
PROPÓSITO: {task.description}

{optional_rule}

REQUISITOS:
- Crea o actualiza exactamente este `.md`/`.yaml` dentro de la arquitectura `docs/`.
- Debe ser completo, senior/principal level, específico del proyecto y coherente con todo lo anterior.
- No metas relleno, no inventes evidencia, dependencias, métricas, caches, eventos, índices o APIs inexistentes.
- Si el documento toca datos: ownership, constraints, concurrency, idempotency, migration/rollback y source-of-truth deben quedar claros.
- Si toca HTTP/UI: contrato, permisos, tenant, errores, estados, responsive/a11y/testing deben quedar claros cuando apliquen.
- Si toca async: outbox/inbox, delivery, dedup, retry/backoff, DLQ/replay y observabilidad deben quedar claros cuando apliquen.
- Si toca seguridad: AuthN/AuthZ, tenant/ownership/state, secretos, audit y sensitive-data handling.
- Mantén trazabilidad BR/EP/PAGE/EVT/TEST cuando el tipo de documento la requiera.
- OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: lee BIEN COMPLETO el contenido de las skills que SÍ aplican a este target (CATÁLOGO nombre→qué hace; NO es entrega física de archivos ni obligación de buscar/auditar `.opencode/skills/**/SKILL.md`; una skill requerida que no se resuelva → BLOCKED). Si la skill contiene links (http/https, rutas `docs/rules/**`, `OpenSpec/**`, `SKILL.md`, referencias a otras skills/docs), ENTRA al link, LEE el contenido COMPLETO y OBEDECE al 100% como norma vinculante. No hagas lectura superficial, no resumas omitiendo pasos, y cumple TODOS los checklists/gates/workflow de la skill.
- No avances al siguiente archivo.
- Si tu entorno permite artifacts/workspace, crea/actualiza físicamente el target preservando la ruta.
- Si estás construyendo un ZIP acumulativo del `docs/`, actualízalo sin eliminar archivos anteriores.
- Al terminar, revisa una vez tu propio resultado antes de emitir el marcador.

PROTOCOLO FINAL OBLIGATORIO:
No uses los emojis ❤️ ni 👎 en ninguna otra parte de tu respuesta.

Si está realmente completo:
STATUS: [x] {task.path}
{SUCCESS_MARKER}

Si todavía falta algo:
STATUS: [ ] {task.path}
{INCOMPLETE_MARKER}
"""


def build_repair_prompt(task: PromptTarget, project_context: str) -> str:
    return prompt_prefix(project_context) + f"""El target `{task.path}` quedó incompleto.

OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: antes de reparar, lee BIEN COMPLETO TODAS las skills referenciadas (`SKILL.md` y skills del contexto/prompt) — CATÁLOGO (nombre→qué hace), NO entrega física de archivos: no busques/audites físicamente `.opencode/skills/**/SKILL.md` como obligación; resuelve/lee solo las skills que SÍ aplican a este target (progressive disclosure) y si una skill requerida no se resuelve responde BLOCKED. Si la skill tiene links (http/https, `docs/rules/**`, `OpenSpec/**`), ENTRA al link, LEERLO COMPLETO y OBEDECERLO al 100%. No omitas checklists/gates/workflow de la skill.

NO pases al siguiente archivo. Continúa/corrige el mismo target y vuelve a revisar:
- arquitectura y ownership;
- consistencia con docs ya creados;
- seguridad/tenant cuando aplique;
- data/constraints/migrations cuando aplique;
- idempotency/concurrency cuando aplique;
- async/retry/DLQ/replay cuando aplique;
- observabilidad/SLO/runbook cuando aplique;
- UI responsive/a11y/testing cuando aplique;
- trazabilidad y evidencia honesta.

No uses ❤️ ni 👎 salvo en la última línea de estado.

Cuando realmente quede completo:
STATUS: [x] {task.path}
{SUCCESS_MARKER}

Si aún sabes que falta algo:
STATUS: [ ] {task.path}
{INCOMPLETE_MARKER}
"""


def build_verify_prompt(task: PromptTarget, project_context: str) -> str:
    return prompt_prefix(project_context) + f"""Vuelve a verificar de forma crítica el target `{task.path}` que acabas de crear.

OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: relee BIEN COMPLETO TODAS las skills referenciadas (`SKILL.md` y skills del contexto/prompt) — CATÁLOGO (nombre→qué hace), NO entrega física de archivos: no busques/audites físicamente `.opencode/skills/**/SKILL.md` como obligación; resuelve/lee solo las skills que SÍ aplican a este target (progressive disclosure) y si una skill requerida no se resuelve responde BLOCKED. Si la skill contiene links (http/https, `docs/rules/**`, `OpenSpec/**`), ENTRA al link, LEERLO COMPLETO y OBEDECERLO al 100% como criterio de verificación. No des por bueno el target si viola cualquier gate de la skill.

Esta es la SEGUNDA PASADA DE VERIFICACIÓN. No avances al siguiente target.

Haz una revisión senior/principal completa contra la arquitectura del proyecto:
- ¿cumple exactamente el propósito del archivo?
- ¿falta alguna regla/invariante/edge case?
- ¿ownership y boundaries son correctos?
- ¿hay arquitectura ficticia o duplicación de source-of-truth?
- ¿security/tenant/permissions están completos cuando aplican?
- ¿money/data/constraints/indexes/migration/rollback están completos cuando aplican?
- ¿idempotency/concurrency/retry/replay están completos cuando aplican?
- ¿observability/SLO/alerts/runbooks están completos cuando aplican?
- ¿endpoints/contracts/errors/testing están completos cuando aplican?
- ¿UI responsive/a11y/states/testing están completos cuando aplican?
- ¿OpenSpec/prompt-pack/skills/scope/gates son coherentes cuando aplican?

Si encuentras algo faltante, CORRÍGELO ahora en el mismo archivo/artifact/ZIP antes de responder.

No uses ❤️ ni 👎 salvo en el marcador final.

Si después de esta verificación ya no falta nada:
STATUS: [x] {task.path}
{SUCCESS_MARKER}

Si todavía falta algo:
STATUS: [ ] {task.path}
{INCOMPLETE_MARKER}
"""


def _batch_paths(tasks: list[PromptTarget]) -> str:
    return " | ".join(task.path for task in tasks)


def _batch_targets_detail(tasks: list[PromptTarget]) -> str:
    blocks: list[str] = []
    for index, task in enumerate(tasks, start=1):
        optional_rule = (
            "Este target es OPCIONAL. Si después de revisar la arquitectura concluyes que no aplica, "
            "NO crees un archivo vacío: explica brevemente NOT_APPLICABLE para ese target."
            if task.optional else
            "Este target es requerido: créalo/complétalo con contenido real, específico y coherente."
        )
        category_line = f"\nCATEGORÍA: {task.category}" if task.category else ""
        blocks.append(
            f"""TARGET {index}/{len(tasks)}: `{task.path}`
PROPÓSITO: {task.description}{category_line}
REGLA: {optional_rule}"""
        )
    return "\n\n".join(blocks)


def build_initial_batch_prompt(tasks: list[PromptTarget], project_context: str) -> str:
    if not tasks:
        raise ValueError("Cannot build a batch prompt with zero tasks.")

    paths = _batch_paths(tasks)
    targets_detail = _batch_targets_detail(tasks)

    return prompt_prefix(project_context) + f"""Como ya conoces la arquitectura documental y técnica del proyecto, trabaja SOLO este bloque de {len(tasks)} targets.

IMPORTANTE SOBRE EL BLOQUE:
- Procesa TODOS los targets listados abajo dentro de esta misma ejecución/respuesta.
- Trabaja cada target con el mismo nivel de profundidad que si se ejecutara individualmente.
- Respeta el orden del bloque y NO avances a ningún archivo que no esté incluido en este bloque.
- No elimines información correcta ya existente en archivos/artifacts/ZIP: conserva lo válido y agrega/corrige solamente lo necesario.
- El bloque completo se considera exitoso únicamente cuando TODOS sus targets estén completos o correctamente resueltos como NOT_APPLICABLE cuando sean opcionales.

TARGETS DEL BLOQUE:
{targets_detail}

REQUISITOS PARA CADA TARGET:
- Crea o actualiza exactamente cada `.md`/`.yaml` indicado dentro de la arquitectura `docs/`.
- Debe ser completo, senior/principal level, específico del proyecto y coherente con todo lo anterior.
- No metas relleno, no inventes evidencia, dependencias, métricas, caches, eventos, índices o APIs inexistentes.
- Si el documento toca datos: ownership, constraints, concurrency, idempotency, migration/rollback y source-of-truth deben quedar claros.
- Si toca HTTP/UI: contrato, permisos, tenant, errores, estados, responsive/a11y/testing deben quedar claros cuando apliquen.
- Si toca async: outbox/inbox, delivery, dedup, retry/backoff, DLQ/replay y observabilidad deben quedar claros cuando apliquen.
- Si toca seguridad: AuthN/AuthZ, tenant/ownership/state, secretos, audit y sensitive-data handling.
- Mantén trazabilidad BR/EP/PAGE/EVT/TEST cuando el tipo de documento la requiera.
- OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: lee BIEN COMPLETO el contenido de las skills que SÍ aplican a este bloque (CATÁLOGO nombre→qué hace; NO es entrega física de archivos ni obligación de buscar/auditar `.opencode/skills/**/SKILL.md`; una skill requerida que no se resuelva → BLOCKED). Si la skill contiene links (http/https, `docs/rules/**`, `OpenSpec/**`), ENTRA al link, LEERLO COMPLETO y OBEDECERLO al 100% como norma vinculante para CADA target. No hagas lectura superficial ni omitas pasos/checklists/gates de la skill.
- No avances fuera de este bloque de targets.
- Si tu entorno permite artifacts/workspace, crea/actualiza físicamente cada target preservando su ruta.
- Si estás construyendo un ZIP acumulativo del `docs/`, actualízalo sin eliminar archivos anteriores.
- AL terminar cada conversarcion aparte de traer los .md, tambien traeme el zip actualizado para descargar con los ultimos .md que hiciste.
- AL terminar cada conversarcion aparte de traer los .md, tambien traeme el zip actualizado para descargar con los ultimos .md que hiciste .
- Al terminar TODOS los targets del bloque, revisa una vez tu propio resultado antes de emitir el marcador.

PROTOCOLO FINAL OBLIGATORIO:
No uses los emojis ❤️ ni 👎 en ninguna otra parte de tu respuesta.
No emitas marcadores intermedios por archivo: emite UN SOLO marcador final para todo el bloque.

Si TODOS los targets del bloque están realmente completos:
STATUS: [x] BATCH {len(tasks)}/{len(tasks)} :: {paths}
{SUCCESS_MARKER}

Si todavía falta algo en AL MENOS UNO de los targets:
STATUS: [ ] BATCH :: {paths}
{INCOMPLETE_MARKER}
"""


def build_repair_batch_prompt(tasks: list[PromptTarget], project_context: str) -> str:
    if not tasks:
        raise ValueError("Cannot build a batch repair prompt with zero tasks.")

    paths = _batch_paths(tasks)
    targets_detail = _batch_targets_detail(tasks)

    return prompt_prefix(project_context) + f"""El bloque de {len(tasks)} targets quedó incompleto.

OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: antes de reparar, relee BIEN COMPLETO TODAS las skills referenciadas (`SKILL.md` y skills del contexto/prompt) — CATÁLOGO (nombre→qué hace), NO entrega física de archivos: no busques/audites físicamente `.opencode/skills/**/SKILL.md` como obligación; resuelve/lee solo las skills que SÍ aplican a este target (progressive disclosure) y si una skill requerida no se resuelve responde BLOCKED. Si la skill contiene links (http/https, `docs/rules/**`, `OpenSpec/**`), ENTRA al link, LEERLO COMPLETO y OBEDECERLO al 100%. No omitas checklists/gates/workflow de la skill.

TARGETS DEL BLOQUE:
{targets_detail}

NO pases al siguiente bloque. Continúa/corrige estos mismos targets y vuelve a revisar cada uno:
- arquitectura y ownership;
- consistencia con docs ya creados;
- seguridad/tenant cuando aplique;
- data/constraints/migrations cuando aplique;
- idempotency/concurrency cuando aplique;
- async/retry/DLQ/replay cuando aplique;
- observabilidad/SLO/runbook cuando aplique;
- UI responsive/a11y/testing cuando aplique;
- trazabilidad y evidencia honesta.

REGLAS DE REPARACIÓN:
- Revisa TODOS los targets del bloque, aunque algunos ya parezcan completos.
- Conserva todo contenido correcto ya existente; NO borres ni reemplaces información válida innecesariamente.
- Corrige/agrega solamente lo que haga falta.
- No avances a ningún target fuera de este bloque.

No uses ❤️ ni 👎 salvo en el marcador final.
No emitas marcadores intermedios por archivo: emite UN SOLO marcador final para todo el bloque.
Al final cuando acabes traeme un zip de todos los archivos ojo que no te falte ninguno ten cuiudado de perder .md.
Cuando TODOS los targets del bloque realmente queden completos:
STATUS: [x] BATCH {len(tasks)}/{len(tasks)} :: {paths}
{SUCCESS_MARKER}

Si aún sabes que falta algo en AL MENOS UNO:
STATUS: [ ] BATCH :: {paths}
{INCOMPLETE_MARKER}
"""


def build_verify_batch_prompt(tasks: list[PromptTarget], project_context: str) -> str:
    if not tasks:
        raise ValueError("Cannot build a batch verify prompt with zero tasks.")

    paths = _batch_paths(tasks)
    targets_detail = _batch_targets_detail(tasks)

    return prompt_prefix(project_context) + f"""Vuelve a verificar de forma crítica el bloque de {len(tasks)} targets que acabas de crear/actualizar.

OBLIGACIÓN SKILLS 100% — LECTURA COMPLETA Y VINCULANTE: relee BIEN COMPLETO TODAS las skills referenciadas (`SKILL.md` y skills del contexto/prompt) — CATÁLOGO (nombre→qué hace), NO entrega física de archivos: no busques/audites físicamente `.opencode/skills/**/SKILL.md` como obligación; resuelve/lee solo las skills que SÍ aplican a este target (progressive disclosure) y si una skill requerida no se resuelve responde BLOCKED. Si la skill contiene links (http/https, `docs/rules/**`, `OpenSpec/**`), ENTRA al link, LEERLO COMPLETO y OBEDECERLO al 100% como criterio de verificación. No des por bueno ningún target si viola gates de la skill.

TARGETS DEL BLOQUE:
{targets_detail}

Esta es la SEGUNDA PASADA DE VERIFICACIÓN. No avances al siguiente bloque.

Haz una revisión senior/principal completa de CADA target contra la arquitectura del proyecto:
- ¿cumple exactamente el propósito del archivo?
- ¿falta alguna regla/invariante/edge case?
- ¿ownership y boundaries son correctos?
- ¿hay arquitectura ficticia o duplicación de source-of-truth?
- ¿security/tenant/permissions están completos cuando aplican?
- ¿money/data/constraints/indexes/migration/rollback están completos cuando aplican?
- ¿idempotency/concurrency/retry/replay están completos cuando aplican?
- ¿observability/SLO/alerts/runbooks están completos cuando aplican?
- ¿endpoints/contracts/errors/testing están completos cuando aplican?
- ¿UI responsive/a11y/states/testing están completos cuando aplican?
- ¿OpenSpec/prompt-pack/skills/scope/gates son coherentes cuando aplican?

Si encuentras algo faltante, CORRÍGELO ahora en el mismo archivo/artifact/ZIP antes de responder.
Conserva todo contenido correcto ya existente; NO elimines información válida para rehacer archivos desde cero.

No uses ❤️ ni 👎 salvo en el marcador final.
No emitas marcadores intermedios por archivo: emite UN SOLO marcador final para todo el bloque.

Si después de esta verificación TODOS los targets ya no tienen faltantes:
STATUS: [x] BATCH {len(tasks)}/{len(tasks)} :: {paths}
{SUCCESS_MARKER}

Si todavía falta algo en AL MENOS UNO:
STATUS: [ ] BATCH :: {paths}
{INCOMPLETE_MARKER}
"""


PHASE_INSTRUCTIONS = {
    "explore": (
        "Esta es fase EXPLORE. Investiga el estado real y produce evidencia para resolver el alcance. "
        "No cambies código de negocio ni cierres decisiones humanas por inferencia."
    ),
    "propose": (
        "Esta es fase PROPOSE. CREA o refina en la RAÍZ del proyecto el change OpenSpec "
        "`openspec/changes/<change_id>/{proposal.md,design.md,tasks.md,execution-memory.md}`. "
        "Asigna IDs estables y criterios verificables a cada tarea `[ ]`; registra skills y referencias "
        "obligatorias, invariantes, material reutilizable, riesgos, gates y handoff. NO ejecutes APPLY. "
        "La ausencia de módulo backend, migración, OpenAPI, paquete contractual, UI o tests "
        "es un GAP esperado de implementación: documéntalo como tarea/riesgo/gate y NO bloquees "
        "PROPOSE solo por esa ausencia. READY significa que la propuesta es coherente y puede "
        "ser revisada por un humano; no significa que APPLY ni sus gates ya estén completos. "
        "Bloquea únicamente si falta autoridad canónica, una decisión material necesaria para "
        "elegir el diseño, acceso read-only imprescindible o un scope seguro."
    ),
    "apply": (
        "Esta es fase APPLY. Ejecuta solamente el alcance autorizado por el prompt generado "
        "y el cambio aprobado. Lee primero tasks.md y execution-memory.md; marca `[x]` solo con "
        "evidencia objetiva y registra comandos, exit codes, artefactos y commit exacto, o por qué no "
        "se creó commit. Nunca incluyas cambios ajenos del usuario. Implementa, ejecuta los gates y corrige dentro del mismo paso hasta "
        "que pasen. Un fallo de compilación, lint, typecheck, test, contrato o migración reproducible "
        "es trabajo de ingeniería, NO una razón para terminar BLOCKED. "
        "La ausencia de archivos o directorios DENTRO de allowed_paths NO es blocker: "
        "créalos como parte de la implementación. Reutiliza/adapta templates o carpetas fuente "
        "aportadas por el usuario cuando sean compatibles. BLOCKED queda reservado a autoridad, "
        "acceso/credencial, dependencia externa o acción fuera de scope que no puedas resolver."
    ),
    "review": (
        "Esta es fase REVIEW. Revisa críticamente implementación, contratos, gates y evidencia. "
        "Audita cada `[x]` de tasks.md contra código/evidencia, verifica cumplimiento real de todas "
        "las skills/referencias asignadas y reconcilia execution-memory.md; reabre lo no demostrado. "
        "No conviertas una deficiencia en PASS por narrativa. Si la corrección está determinada por "
        "la autoridad y cabe en allowed_paths, corrígela y vuelve a ejecutar los gates en este mismo "
        "paso; solo termina BLOCKED ante un impedimento externo/material no resoluble."
    ),
    "fix": (
        "Esta es fase FIX. Corrige los hallazgos determinados por la autoridad canónica, conserva "
        "el alcance permitido y repite los gates afectados hasta verde. No uses hardcode, skips, "
        "mocks engañosos ni debilitamiento de tests para lograr PASS. Una decisión humana o cambio "
        "de arquitectura no autorizado permanece BLOCKED."
    ),
}


def build_high_blocker_report_instruction(
    item: PromptItemLike,
    *,
    blocked_report_path: str,
    execution_id: str,
) -> str:
    if not blocked_report_path:
        return ""
    return f"""
REPORTE MACHINE-READABLE DE BLOCKER ALTO:
- Si el resultado final es BLOCKED, escribe antes del marcador final `{blocked_report_path}`.
- Ese archivo es la única extensión adicional de escritura autorizada para evidencia del runner.
- JSON exacto: `{{"schema_version":1,"execution_id":"{execution_id}","sequence":"{item.display_seq}","pack":"{item.pack}","phase":"{item.phase}","prompt_sha256":"{item.prompt_sha256}","blockers":[{{"severity":"ALTA|CRITICAL","category":"docs/rules|ADR|OpenSpec|dependency|prompt-pack|runtime/evidence|unknown","cause":"causa concreta","recommended_action":"siguiente acción concreta","requires_human":true|false,"auto_remediable":true|false}}]}}`.
- Incluye ÚNICAMENTE blockers ALTA/CRITICAL. Si no existen, usa `"blockers":[]`.
- No incluyas secretos, tokens, passwords, cookies, connection strings ni datos sensibles.
"""


def build_execution_evidence_instruction(
    item: PromptItemLike,
    *,
    evidence_path: str,
    execution_id: str,
) -> str:
    if not evidence_path:
        return ""
    return f"""
EVIDENCIA MACHINE-READABLE OBLIGATORIA PARA READY:
- Antes del marcador READY escribe `{evidence_path}`.
- JSON exacto base: `{{"schema_version":1,"execution_id":"{execution_id}","logical_id":"{item.pack}:{item.phase}","prompt_sha256":"{item.prompt_sha256}","status":"PASS","checks":[{{"command":"comando real ejecutado","exit_code":0,"artifact":"ruta o referencia verificable"}}]}}`.
- Incluye cada gate material realmente ejecutado; no inventes comandos, resultados ni artefactos.
- Si un gate requerido no pasa, repáralo y repítelo. Si depende de autoridad/acceso externo no disponible, emite BLOCKED y no escribas PASS.
- No incluyas secretos, variables de entorno, tokens, cookies ni connection strings.
"""


def build_execution_envelope(
    item: PromptItemLike,
    raw_prompt: str,
    success_marker: str = SUCCESS_MARKER,
    blocked_marker: str = INCOMPLETE_MARKER,
    auto_apply_recommended: bool = False,
    openspec_context: str = "",
    blocked_report_path: str = "",
    blocked_report_execution_id: str = "",
    nonce: str = "",
    evidence_path: str = "",
    evidence_execution_id: str = "",
    require_execution_evidence: bool = False,
) -> str:
    phase_instruction = PHASE_INSTRUCTIONS[item.phase]

    extra_senior = ""
    if auto_apply_recommended:
        extra_senior = (
            f"MODO --auto-apply-recommended ACTIVADO para {item.display_seq} ({item.pack}.{item.phase})\n"
            "Este modo permite reparar problemas de cualquier severidad cuando la solución concreta "
            "ya está determinada por la autoridad canónica y dentro de allowed_paths. La severidad "
            "no sustituye la evaluación de autoridad. Decisiones Q-*, credenciales/acceso, cambios "
            "irreversibles y acciones de producción sin autorización permanecen BLOCKED. "
            "Nunca escribas placeholders ANSWERED ni fuerces READY. Revalida todos los gates afectados.\n\n"
        )

    dependencies = ", ".join(getattr(item, "dependencies", ()) or ()) or "none"
    previous_phase = getattr(item, "previous_phase_sequence", None)
    change_id = item.pack.replace(".", "-")
    openspec_path = f"openspec/changes/{change_id}"
    runtime_openspec = (
        f"\nOPEN SPEC ROOT MATERIALIZADO PARA ESTE PASO:\n{openspec_context}\n"
        if openspec_context.strip()
        else ""
    )
    high_blocker_report = build_high_blocker_report_instruction(
        item,
        blocked_report_path=blocked_report_path,
        execution_id=blocked_report_execution_id,
    )
    execution_evidence = (
        build_execution_evidence_instruction(
            item,
            evidence_path=evidence_path,
            execution_id=evidence_execution_id,
        )
        if require_execution_evidence
        else ""
    )


    return f"""# PROMPT QUEUE AUTOMATION ENVELOPE

 {extra_senior}Ejecución actual: `{item.display_seq}`
Pack: `{item.pack}`
Phase: `{item.phase}`
Generated artifact: `{item.path.name}`
Prompt SHA-256: `{item.prompt_sha256}`
Lock SHA-256: `{item.lock_sha256}`
Dependencias ejecutables: `{dependencies}`
Paso de fase anterior: `{previous_phase if previous_phase is not None else 'none'}`
Prompt Builder requerido: `{PROMPT_BUILDER_VERSION}`

REGLAS DEL ORQUESTADOR:
- Trabaja ÚNICAMENTE este generated prompt. No avances al siguiente número.
- Respeta literalmente los allowed/forbidden paths, blockers, gates y source-of-truth del prompt.
- OBLIGACIÓN SKILLS 100% — CLARO solo las skills que se van a utilizar  LECTURA COMPLETA Y VINCULANTE: lee BIEN COMPLETO el contenido de las skills que SÍ aplican a esta ejecución (CATÁLOGO nombre→qué hace; NO es entrega física de archivos ni obligación de buscar/auditar `.opencode/skills/**/SKILL.md`; una skill requerida que no se resuelva → BLOCKED). Si la skill contiene links (http/https, `docs/rules/**`, `OpenSpec/**`, rutas SKILL.md u otras referencias), ENTRA al link, LEE el contenido COMPLETO y OBEDECE al 100% como norma vinculante. No hagas lectura superficial, no omitas checklists/gates/workflow de la skill. El cumplimiento de la skill es obligatorio para READY.
- No inventes decisiones para conseguir READY.
- BLOCKED NO es una lista de tareas. Antes de emitirlo, resuelve todo lo técnicamente reparable dentro
  del scope: código incompleto, imports, tipos, lint, build, tests, fixtures, migraciones locales,
  contratos ya definidos y archivos/directorios autorizados. Repite los gates hasta PASS.
- Prohibido conseguir verde con hardcode de resultados, `skip`/`only`, eliminación o debilitamiento de
  assertions, reducción injustificada de coverage, `|| true`, captura vacía de errores, sleeps/retries
  que oculten flakiness, mocks de integración presentados como evidencia real o bypass de seguridad.
- ZERO-ZOMBIE: toda consulta de red/observabilidad debe tener timeout finito y salida acotada; nunca
  dejes `curl`, streaming, logs o procesos esperando EOF indefinidamente. Para VictoriaLogs usa
  `--max-time 5`, `/select/logsql/hits` para conteos o `/select/logsql/query` con `limit` explícito.
- Un resultado vacío de observabilidad no prueba caída ni salud: valida exit code, contraprueba liveness
  con logs generales acotados y, si tampoco hay señal, inspecciona el log físico/contenedor con `tail`
  limitado. Detén inmediatamente cualquier proceso colgado antes de continuar.
- Una carpeta/template proporcionada o referenciada por el usuario es material reutilizable, no un
  blocker. Inspecciónala completa, conserva su source-of-truth, reutiliza/adapta componentes `shared`
  y demás piezas compatibles dentro de allowed_paths, y registra cualquier incompatibilidad concreta.
  No exijas que ya esté copiada en el proyecto y no la descartes por usar una estructura distinta.
- PROPOSE: si el change no existía, créalo en `{openspec_path}`. Crear/redactar la propuesta NO
  requiere aprobación humana previa; la aprobación ocurre después de READY y antes de APPLY.
- PROPOSE: `{openspec_path}/**` es una extensión de escritura explícitamente autorizada por este
  runner aunque un prompt legacy no la liste todavía en `allowed_paths`. Es la ÚNICA extensión;
  no autoriza modificar `apps/**`, contratos, datos, cloud o infraestructura durante PROPOSE.
- PROPOSE: código/schema/OpenAPI/UI/tests ausentes son entregables futuros de `tasks.md`, no evidencia
  exigible en esta fase. Ejecuta únicamente validaciones documentales/OpenSpec que sí apliquen.
- APPLY/REVIEW/FIX: lee primero el change aprobado en `{openspec_path}`; allí sí falta de
  precondiciones/evidencia material produce BLOCKED.
- Si falta una decisión/regla/dependencia material para definir una propuesta segura, responde BLOCKED.
- No uses los marcadores finales `{success_marker}` ni `{blocked_marker}` en ninguna otra parte de la respuesta.
- Antes del marcador final, deja RESUMEN corto (3-5 líneas): qué hiciste, qué verificaste en allowed_paths/gates/source-of-truth, y resultado READY/BLOCKED con siguiente paso. Luego sección DETALLES completa separada por gravedad.
- Si estás BLOCKED, en DETALLES separa por gravedad (ALTA / MEDIA / BAJA) y enumera los blockers y clasifica cada uno como uno de:
  `docs/rules`, `ADR`, `OpenSpec`, `dependency`, `prompt-pack`, `runtime/evidence`, `unknown`.
- Declara severidad por blocker: `BAJA | MEDIA | ALTA | CRITICAL` y si requiere supervisión humana. Severidad es impacto, no permiso: incluso ALTA/CRITICAL se repara cuando la solución está determinada por autoridad canónica y cae dentro de allowed_paths. Solo permanece BLOCKED lo que exige decisión humana, acceso/credencial, dependencia externa indisponible, acción irreversible/producción no autorizada o escritura fuera de scope.
- Para cada blocker, añade 1-2 opciones recomendadas: opción A (preferida) con path concreto y gate de verificación, y opción B alternativa si aplica; indica si es auto-remediable en allowed_paths o requiere ADR/humano. No inventes tecnología/decisión fuera de source-of-truth.
- Con `--auto-apply-recommended`, intenta reparar todos los blockers determinados dentro de allowed_paths y revalida sus gates. En DETALLES explica qué cambió y qué ejecutaste. Nunca ocultes un blocker restante ni inventes la autoridad que falta.
- El reporte final debe dejar resumen + opciones recomendadas por bloqueante, todo separado por gravedad (ALTA / MEDIA / BAJA), sin usar tabla compacta.
- El estado BLOCKED es válido y preferible a inventar una solución.

FASE:
{phase_instruction}
{runtime_openspec}
{high_blocker_report}
{execution_evidence}

PROTOCOLO FINAL OBLIGATORIO:

Si este paso quedó completo y es seguro avanzar:
AUTOMATION_STATUS: READY
{success_marker}

Si existe cualquier blocker material:
AUTOMATION_STATUS: BLOCKED
{blocked_marker}

--- BEGIN GENERATED PROMPT ---
{raw_prompt}
--- END GENERATED PROMPT ---
"""



def build_blocked_repair_prompt(
    item: PromptItemLike,
    *,
    blocked_response: str = "",
    repair_round: int = 1,
    max_rounds: int = 1,
    repeated_blocker_count: int = 1,
    success_marker: str = SUCCESS_MARKER,
    blocked_marker: str = INCOMPLETE_MARKER,
    nonce: str = "",
) -> str:
    """Build a same-item remediation prompt after a fresh BLOCKED/👎 result.

    `--retry-blocked` authorizes another attempt inside the exact same generated
    step. It does NOT authorize advancing phases, inventing human decisions,
    escaping allowed_paths, or bypassing Prompt Builder/quality gates.
    """
    response_excerpt = (blocked_response or "").strip()
    if len(response_excerpt) > 8_000:
        response_excerpt = response_excerpt[-8_000:]
    if not response_excerpt:
        response_excerpt = "[No se pudo copiar el texto de la respuesta BLOCKED; usa el contexto de esta conversación.]"

    round_limit = "sin límite hasta READY o blocker humano/externo" if max_rounds == 0 else str(max_rounds)
    no_progress = ""
    if repeated_blocker_count >= 2:
        no_progress = f"""
ALERTA DE NO-PROGRESO:
- La misma respuesta/causa BLOCKED se repitió {repeated_blocker_count} veces.
- No repitas la misma narrativa ni la misma acción. Reproduce el gate con comando/log real, inspecciona
  la causa raíz, formula una hipótesis distinta y aplica una corrección verificable dentro del scope.
- Actualiza `execution-memory.md` con hipótesis descartada, nueva evidencia y siguiente experimento.
"""

    return f"""# REPARACIÓN AUTOMÁTICA DEL MISMO PROMPT — --retry-blocked

Paso actual: `{item.display_seq}`
Pack: `{item.pack}`
Phase: `{item.phase}`
Ronda de reparación: `{repair_round}/{round_limit}`
{no_progress}
IMPORTANTE:
- NO avances al siguiente prompt, pack ni fase.
- Continúa trabajando ÚNICAMENTE el mismo paso `{item.display_seq}` `{item.pack}.{item.phase}`.
- El operador activó `--retry-blocked`: vuelve a revisar TODOS los blockers que acabas de reportar
  e intenta resolver automáticamente cada blocker técnicamente resoluble dentro del scope ya autorizado.
- La severidad (BAJA/MEDIA/ALTA/CRITICAL) es metadata de riesgo, NO permiso adicional. Un blocker
  ALTA/CRITICAL puede repararse solamente cuando la solución concreta ya está determinada por
  `docs/rules/**`, OpenSpec/ADR aprobado, dependencias reales y el generated prompt, y además cae
  dentro de `allowed_paths` y operaciones autorizadas.
- NUNCA inventes una decisión humana Q-*, aprobación, secreto/credencial, acceso externo,
  autorización de producción, cambio irreversible, contrato o regla de negocio faltante.
- NUNCA edites `generated/**` ni locks para "hacer pasar" el gate.
- Si el blocker fue una interpretación demasiado estricta o un faltante que sí está dentro de
  `allowed_paths`, corrígelo AHORA y reejecuta los gates aplicables.
- Si faltó un archivo/directorio que el mismo prompt permite crear, créalo; no lo uses como blocker.
- Si fallan tests, build, lint, typecheck, migraciones locales o contratos ya definidos, diagnostica la
  causa raíz, repara código Y test cuando corresponda y repite el gate hasta verde. No hardcodees,
  no desactives pruebas, no reduzcas assertions/coverage y no reemplaces integración real por mocks.
- Si el usuario aportó/referenció una carpeta template, úsala como fuente read-only reutilizable:
  inspecciona `shared` y piezas compatibles, adapta lo necesario al target y no declares BLOCKED porque
  todavía no estén copiadas o porque el layout del template difiera.
- Conserva todo contenido correcto ya existente y aplica cambios mínimos, trazables e idempotentes.
- Relee las skills aplicables y sus referencias completas antes de declarar READY.
- No conviertas BLOCKED a READY solo por narrativa: READY exige que el trabajo y gates del paso estén completos.
- Si persiste un blocker realmente no automatizable (p. ej. decisión humana material, autoridad
  canónica ausente, credencial/acceso externo imprescindible o acción fuera de scope), déjalo BLOCKED
  y explica exactamente qué falta.

ÚLTIMA RESPUESTA BLOCKED (contexto para reparar):
--- BEGIN BLOCKED RESPONSE ---
{response_excerpt}
--- END BLOCKED RESPONSE ---

PROTOCOLO FINAL OBLIGATORIO:
No uses `{success_marker}` ni `{blocked_marker}` en ninguna otra parte de tu respuesta.

Si el MISMO paso quedó completo y es seguro avanzar:
AUTOMATION_STATUS: READY
{success_marker}

Si persiste un blocker material no resuelto:
AUTOMATION_STATUS: BLOCKED
{blocked_marker}
"""


def build_propose_artifact_repair_prompt(
    item: PromptItemLike,
    openspec_path: str,
    problems: list[str],
    success_marker: str = SUCCESS_MARKER,
    blocked_marker: str = INCOMPLETE_MARKER,
    nonce: str = "",
) -> str:
    problem_lines = "\n".join(f"- {problem}" for problem in problems)
    return f"""# REPARACIÓN / RECLASIFICACIÓN AUTOMÁTICA DE PROPOSE

El paso `{item.display_seq}` `{item.pack}.propose` no dejó todavía un contrato físico y una
clasificación de estado compatibles con la semántica de PROPOSE.
Corrige AHORA, sin implementar código de aplicación, estos archivos en la raíz:
`{openspec_path}/proposal.md`, `{openspec_path}/design.md`, `{openspec_path}/tasks.md`,
`{openspec_path}/execution-memory.md`.

Problemas detectados:
{problem_lines}

Reglas:
- elimina todos los marcadores `PROMPT_BUILDER_TODO` después de reemplazarlos por contenido real;
- usa `docs/rules/**` como autoridad y no inventes decisiones;
- convierte backend/schema/OpenAPI/UI/tests faltantes en tareas verificables, no en blocker de PROPOSE;
- asigna IDs estables a las tareas `[ ]` e inicializa una memoria compacta con skills/referencias
  obligatorias, invariantes, material reusable, riesgos, gates y handoff; no copies archivos completos;
- incluye alcance/out-of-scope, CURRENT/TARGET/GAP, compatibilidad, migración/rollback, seguridad,
  observabilidad, gates y dependencias cuando apliquen;
- no ejecutes APPLY ni operaciones destructivas;
- PROPOSE evalúa si existe un diseño implementable y seguro; no exige que el módulo, DDL, OpenAPI,
  UI ni tests futuros ya existan;
- si el diseño no puede decidirse sin una decisión humana material, explica solo ese blocker real.

Si los cuatro archivos quedaron completos:
AUTOMATION_STATUS: READY
{success_marker}

Si persiste un blocker material para redactar la propuesta:
AUTOMATION_STATUS: BLOCKED
{blocked_marker}
"""


def build_blocked_ticket_text(
    item: PromptItemLike,
    screenshot_line: str,
    detected_at: str,
) -> str:
    return f"""# BLOCKED — {item.display_seq} {item.pack} {item.phase}

This is runtime orchestration evidence, not canonical `docs/rules`.

- detected_at: `{detected_at}`
- prompt: `{item.path}`
- prompt_sha256: `{item.prompt_sha256}`
- lock: `{item.lock_path}`
- lock_sha256: `{item.lock_sha256}`
{screenshot_line}
## What to do

1. Read the ChatGPT response and identify the actual blocker(s).
2. Resolve each blocker in its true source: `docs/rules`, ADR, OpenSpec, dependency,
   prompt-pack, or runtime/evidence.
3. Validate with Vigilio Prompt Builder.
4. Regenerate the affected prompt(s).
5. Re-run this queue runner.

If the generated prompt hash changed, the runner will make this step pending again.
If the blocker was resolved externally and the prompt did not change, use `--retry-blocked`.

Do NOT put this ticket into `docs/rules` as a replacement for the actual solution.
"""
