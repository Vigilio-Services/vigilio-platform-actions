# Checklist De Seguridad Y Delivery

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Seguridad, sesión y privacidad | [vigilio-docs/9-seguridad-hardening-privacidad](../../.vigilio-docs/stacks/frontend/web-mfe/security/9-seguridad-hardening-privacidad.md) |
| Tooling y supply chain | [vigilio-docs/11-tooling-pnpm-biome-supply-chain](../../.vigilio-docs/stacks/frontend/web-mfe/quality/11-tooling-pnpm-biome-supply-chain.md) |
| CI/CD y gobierno GitHub | [vigilio-docs/12-devsecops-cicd-github](../../.vigilio-docs/stacks/frontend/web-mfe/delivery/12-devsecops-cicd-github.md) |
| Delivery AWS/CDN y FinOps | [vigilio-docs/13-aws-cloudfront-cdk-finops](../../.vigilio-docs/stacks/frontend/web-mfe/delivery/13-aws-cloudfront-cdk-finops.md) |
| APIs y delivery por perfil | [vigilio-docs/18-frontend-technologies-skill-2026](../../.vigilio-docs/stacks/frontend/web-mfe/technology/18-frontend-technologies-skill-2026.md) |
| Gobierno, OpenSpec y releases | [vigilio-docs/14-gobierno-skills-openspec-release](../../.vigilio-docs/stacks/frontend/web-mfe/governance/14-gobierno-skills-openspec-release.md) |
| Criterios operativos | [vigilio-docs/15-evaluacion-roadmap-operacion](../../.vigilio-docs/stacks/frontend/web-mfe/governance/15-evaluacion-roadmap-operacion.md) |
| Evidencia ejecutable | workflows, imagen/manifests/IaC, policies y ambientes del consumidor |

Usar la documentación como baseline. Verificar siempre la configuración real de GitHub/AWS antes de afirmar que un control externo está activo.

## Browser y runtime config

- Solo claves publicas allowlisted.
- Rechazar nombres `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE_KEY`, `ACCESS_KEY` y equivalentes.
- CSP sin `unsafe-eval`; `unsafe-inline` solo con nonce/hash y justificacion.
- `frame-ancestors`, `object-src`, `base-uri` y `form-action` restringidos.
- HSTS, nosniff, Referrer-Policy y Permissions-Policy definidos en el edge/CDN/proxy/ingress owner del perfil.
- Source maps privados o deshabilitados en publicacion publica.

## GitHub Actions

- `permissions: contents: read` por defecto y elevation por job.
- Actions de terceros fijadas a SHA completo.
- OIDC + role por entorno para AWS.
- Environments protegidos para staging/production.
- Concurrency evita deploys solapados.
- Inputs de PR no se ejecutan con secretos privilegiados.
- Artefactos tienen retention y no contienen `.env`, tokens o source maps sensibles.

## Supply chain

- Lockfile frozen en CI.
- Node/pnpm fijados.
- Dependency review y auditoria con politica de excepciones expirable.
- Secret scan y SAST.
- SBOM por release y provenance/attestation cuando la plataforma lo soporte.
- Ningun lifecycle script nuevo sin revision.

## Perfil y superficie de delivery

| Perfil | Artefacto/runtime | Superficies owner |
|---|---|---|
| `current-web` | Preservar el mecanismo comprobado en su repositorio | Usar S3/CloudFront/CDK solo con evidencia ejecutable |
| `k8s-v2` | Imagen OCI inmutable promovida por digest | `/docker`: build/runtime; `/deploy`: Helm/Argo/GitOps; `/infra`: Terraform/OpenTofu, EKS/ECR/IAM |

No crear infraestructura paralela del otro perfil.

## AWS S3/CloudFront cuando el perfil lo confirme

- Bucket privado con Block Public Access.
- Origin Access Control entre CloudFront y S3.
- TLS moderno y dominio/certificado administrado.
- Access logs protegidos y lifecycle definido.
- Assets hasheados: cache largo e immutable.
- `index.html` y runtime config: cache corto/no-cache segun rollout.
- Custom error responses no convierten 403/404 sensibles en contenido incorrecto.
- WAF se justifica por amenaza/costo, no por checklist.

## OCI/Kubernetes para `k8s-v2`

- Multi-stage build reproducible; runtime no-root, filesystem read-only cuando sea viable y sin toolchain de build.
- Escanear imagen/SBOM y promover exactamente el mismo digest entre ambientes.
- ECR con lifecycle, escaneo y permisos minimos por workload/deployer.
- Helm con schema/values por ambiente, probes, requests/limits y `securityContext`; no secretos en values versionados.
- HPA/PDB/NetworkPolicy y topology/rollout solo cuando el runtime y SLO los justifican.
- Argo Rollouts/Argo CD con health checks, estrategia de rollback y revision auditable.
- Terraform/OpenTofu administra foundations compartidas; no duplicarlas desde charts o workflows de la app.

## Release y rollback

- Artefacto unico promovido por entornos.
- Version/revision visible en telemetria.
- Smoke test despues del deploy.
- Rollback a artefacto anterior documentado y probado.
- Invalidacion de cache acotada cuando exista CDN; en Kubernetes, rollback al digest/revision anterior sin recompilar.
- Evidencia de deploy y cambio retenida sin secretos.

> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

