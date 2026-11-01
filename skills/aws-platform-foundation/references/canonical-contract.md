# Contrato Canónico De Fundación De Plataforma Cloud En AWS

## Fuentes Canónicas

| Necesidad | Fuente |
|---|---|
| Reglas operativas compartidas | [contrato común](../../.vigilio-docs/standards/platform/common-operational-contract.md) |
| Contrato canónico | [vigilio-docs/aws-foundation](../../.vigilio-docs/platform/aws/platform-foundation.md) |
| Evidencia operacional | [vigilio-docs/evidence](../../.vigilio-docs/platform/sre/operational-evidence.md) |

Lee completamente cada fuente aplicable.

## Evidencia Específica

- Plan IaC por cuenta y entorno con red y límites de confianza visibles.
- Roles OIDC, políticas IAM mínimas y análisis de acceso.
- Recursos de datos privados, cifrado y pruebas de conectividad autorizada/no autorizada.
- Presupuesto, tags y propietarios verificables.

## Excepciones Específicas

La exposición pública requiere threat model, WAF o control equivalente, propietario y fecha de revisión. Credenciales estáticas no son una excepción aceptable para pipelines.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Utilizar VPCs privadas multi-AZ, endpoints de VPC privados y roles IAM efímeros federados por OIDC.
- ❌ **Incorrecto:** Desplegar clústeres o bases de datos en subredes públicas o compartir credenciales de superadministrador.
