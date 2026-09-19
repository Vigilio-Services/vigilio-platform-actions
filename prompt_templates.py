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


PROMPT_BUILDER_VERSION = "0.6.1"


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
    return f"{CANONICAL_GUARDRAILS}\n{architecture}"


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
        "`openspec/changes/<change_id>/{proposal.md,design.md,tasks.md}`. NO ejecutes APPLY. "
        "La ausencia de módulo backend, migración, OpenAPI, paquete contractual, UI o tests "
        "es un GAP esperado de implementación: documéntalo como tarea/riesgo/gate y NO bloquees "
        "PROPOSE solo por esa ausencia. READY significa que la propuesta es coherente y puede "
        "ser revisada por un humano; no significa que APPLY ni sus gates ya estén completos. "
        "Bloquea únicamente si falta autoridad canónica, una decisión material necesaria para "
        "elegir el diseño, acceso read-only imprescindible o un scope seguro."
    ),
    "apply": (
        "Esta es fase APPLY. Ejecuta solamente el alcance autorizado por el prompt generado "
        "y el cambio aprobado. Si falta una precondición material, NO la inventes: BLOCKED."
    ),
    "review": (
        "Esta es fase REVIEW. Revisa críticamente implementación, contratos, gates y evidencia. "
        "Si encuentras una deficiencia material que requiere corrección, usa BLOCKED; no la "
        "conviertas en PASS por narrativa."
    ),
    "fix": (
        "Esta es fase FIX. Corrige únicamente hallazgos aprobados y determinados por la autoridad "
        "canónica, conserva el alcance permitido y vuelve a ejecutar los gates afectados. "
        "Una decisión humana o cambio de arquitectura no autorizado permanece BLOCKED."
    ),
}


def build_execution_envelope(
    item: PromptItemLike,
    raw_prompt: str,
    success_marker: str = SUCCESS_MARKER,
    blocked_marker: str = INCOMPLETE_MARKER,
    auto_apply_recommended: bool = False,
    openspec_context: str = "",
) -> str:
    phase_instruction = PHASE_INSTRUCTIONS[item.phase]

    extra_senior = ""
    if auto_apply_recommended:
        extra_senior = (
            f"MODO --auto-apply-recommended ACTIVADO para {item.display_seq} ({item.pack}.{item.phase})\n"
            "Este modo SOLO permite reparar automáticamente problemas BAJA/MEDIA cuya solución esté "
            "completamente determinada por la autoridad canónica y dentro de allowed_paths. "
            "ALTA/CRITICAL, decisiones Q-*, arquitectura, seguridad, tenant, dinero, contratos, "
            "migraciones irreversibles y producción permanecen BLOCKED hasta aprobación humana. "
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
- Declara severidad por blocker: `BAJA | MEDIA | ALTA | CRITICAL` y si requiere supervisión humana. `ALTA/CRITICAL` = decisión de negocio/arquitectura/security/tenant/money/contracts, migración irreversible, secreto o producción sin autoridad; permanece BLOCKED fail-closed. `MEDIA/BAJA` solo es auto-remediable cuando la solución está completamente determinada por la autoridad canónica, cae dentro de allowed_paths y sus gates se revalidan.
- Para cada blocker, añade 1-2 opciones recomendadas: opción A (preferida) con path concreto y gate de verificación, y opción B alternativa si aplica; indica si es auto-remediable en allowed_paths o requiere ADR/humano. No inventes tecnología/decisión fuera de source-of-truth.
- Con `--auto-apply-recommended`, intenta reparar solamente blockers BAJA/MEDIA determinados dentro de allowed_paths y revalida sus gates. En DETALLES explica qué cambió y qué ejecutaste. Nunca ocultes un blocker restante ni conviertas ALTA/CRITICAL en READY.
- El reporte final debe dejar resumen + opciones recomendadas por bloqueante, todo separado por gravedad (ALTA / MEDIA / BAJA), sin usar tabla compacta.
- El estado BLOCKED es válido y preferible a inventar una solución.

FASE:
{phase_instruction}
{runtime_openspec}

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


def build_propose_artifact_repair_prompt(
    item: PromptItemLike,
    openspec_path: str,
    problems: list[str],
    success_marker: str = SUCCESS_MARKER,
    blocked_marker: str = INCOMPLETE_MARKER,
) -> str:
    problem_lines = "\n".join(f"- {problem}" for problem in problems)
    return f"""# REPARACIÓN / RECLASIFICACIÓN AUTOMÁTICA DE PROPOSE

El paso `{item.display_seq}` `{item.pack}.propose` no dejó todavía un contrato físico y una
clasificación de estado compatibles con la semántica de PROPOSE.

Corrige AHORA, sin implementar código de aplicación, estos archivos en la raíz:
`{openspec_path}/proposal.md`, `{openspec_path}/design.md`, `{openspec_path}/tasks.md`.

Problemas detectados:
{problem_lines}

Reglas:
- elimina todos los marcadores `PROMPT_BUILDER_TODO` después de reemplazarlos por contenido real;
- usa `docs/rules/**` como autoridad y no inventes decisiones;
- convierte backend/schema/OpenAPI/UI/tests faltantes en tareas verificables, no en blocker de PROPOSE;
- incluye alcance/out-of-scope, CURRENT/TARGET/GAP, compatibilidad, migración/rollback, seguridad,
  observabilidad, gates y dependencias cuando apliquen;
- no ejecutes APPLY ni operaciones destructivas;
- PROPOSE evalúa si existe un diseño implementable y seguro; no exige que el módulo, DDL, OpenAPI,
  UI ni tests futuros ya existan;
- si el diseño no puede decidirse sin una decisión humana material, explica solo ese blocker real.

Si los tres archivos quedaron completos:
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
