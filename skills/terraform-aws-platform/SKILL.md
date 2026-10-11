---
name: terraform-aws-platform
description: "Diseña, implementa y revisa infraestructura AWS reusable con Terraform: módulos, stacks, ambientes, estado remoto, OIDC, policy as code, pruebas, drift, seguridad, resiliencia, observabilidad e Infracost. Usar para IaC de plataforma; no usar para cambios exclusivos de Helm, aplicación o Dockerfile."
---

<skill-content>

# Plataforma AWS Con Terraform

## Lectura obligatoria de referencias

Lee completamente [references/terraform-platform.md](references/terraform-platform.md). Abre las
fuentes canónicas aplicables antes de aplicar o declarar un gate cerrado.

## Resultado esperado

Produce infraestructura componible y verificable: módulos sin conocimiento del proyecto, stacks que
definen ownership y ambientes delgados que suministran configuración. Separa plan de apply y conserva
un camino explícito de rollback o recuperación.

## Flujo

1. Clasifica el cambio: bootstrap, foundation, plataforma compartida o workload.
2. Reutiliza/completa módulos tipados; evita copiar recursos entre ambientes.
3. Aísla estados y blast radius; cifra, versiona y bloquea el backend remoto.
4. Valida formato, providers, módulos, tests, seguridad, policies y costo.
5. Genera un plan legible y JSON; revisa reemplazos, exposición, cifrado e IAM.
6. Aplica el mismo plan aprobado mediante OIDC y environment protegido.
7. Ejecuta smoke/health, exporta evidencia no sensible y comprueba observabilidad.
8. Detecta drift periódicamente y trata destroy, import y state moves como operaciones controladas.

## Invariantes

- No guardes state, planes sensibles, secretos ni tfvars reales en Git.
- No uses credenciales AWS permanentes ni IAM wildcard sin justificación acotada.
- Producción nunca ejecuta apply desde un PR no confiable ni con auto-approve sin protección externa.
- `-target`, `force-unlock`, import, moved state y destroy requieren motivo y evidencia.
- Los tests que crean recursos deben declarar costo, aislamiento y cleanup.

## Respuesta

Primero informa impacto, costo, blast radius y recuperación. Separa hallazgos verificables de supuestos.
Incluye comandos, plan esperado, gates y evidencia posterior al apply.

</skill-content>
