# Human decision gate

Use this reference when creating or changing `docs/rules/answers.md`.

## Ask only unresolved material questions

Inspect available evidence first. Consolidate remaining questions by product, architecture, data,
identity, ownership/tenancy, external services, security/compliance, environments, testing, delivery,
observability, and irreversible business behavior.

Each material question uses the parser-compatible shape:

```markdown
## Q-001 — Decision title

- Estado: OPEN | ANSWERED
- Por qué requiere decisión humana:
  Concise impact.
- Opciones:
  - A — First viable option.
  - B — Second viable option.
- Recomendación:
  Recommended choice and trade-off.
- Decisión:
  Approved choice or PENDING.
- Bloquea:
  - pack.id or "*"
- Owners/documentos a sincronizar después de responder:
  - docs/rules/path
- Respondida por: person or explicit recommendation policy
- Fecha de respuesta: YYYY-MM-DD
```

Do not mark ANSWERED without direct human approval or explicit authorization to apply reversible,
low-risk recommendations. Never auto-decide money semantics, legal/compliance, destructive retention,
material auth/tenancy, billing/refunds, data residency, privileged approvals, or central business
rules.

Never request passwords, private keys, tokens, recovery codes, database passwords, or production
credentials. Record only readiness, owner, permissions, environment, and the logical secret reference.

Before APPLY/REVIEW/FIX publication, every relevant material question must be ANSWERED and synchronized
into its canonical owner. Preserve answered questions as provenance.
