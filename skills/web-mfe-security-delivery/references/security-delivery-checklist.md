# Checklist De Seguridad Y Delivery

## Fuentes Canónicas

| Necesidad | Fuente canónica |
|---|---|
| Seguridad, sesión y privacidad | [vigilio-docs/9-seguridad-hardening-privacidad](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/9-seguridad-hardening-privacidad.md) |
| Tooling y supply chain | [vigilio-docs/11-tooling-pnpm-biome-supply-chain](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/11-tooling-pnpm-biome-supply-chain.md) |
| CI/CD y gobierno GitHub | [vigilio-docs/12-devsecops-cicd-github](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/12-devsecops-cicd-github.md) |
| AWS, CloudFront, CDK y FinOps | [vigilio-docs/13-aws-cloudfront-cdk-finops](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/13-aws-cloudfront-cdk-finops.md) |
| Gobierno, OpenSpec y releases | [vigilio-docs/14-gobierno-skills-openspec-release](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/14-gobierno-skills-openspec-release.md) |
| Criterios operativos | [vigilio-docs/15-evaluacion-roadmap-operacion](https://github.com/VigilioYonatan/vigilio-docs/blob/main/frontend-web-mfe/15-evaluacion-roadmap-operacion.md) |
| Evidencia ejecutable | workflows, CDK, policies y ambientes del consumidor |

Usar la documentación como baseline. Verificar siempre la configuración real de GitHub/AWS antes de afirmar que un control externo está activo.

## Browser y runtime config

- Solo claves publicas allowlisted.
- Rechazar nombres `SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE_KEY`, `ACCESS_KEY` y equivalentes.
- CSP sin `unsafe-eval`; `unsafe-inline` solo con nonce/hash y justificacion.
- `frame-ancestors`, `object-src`, `base-uri` y `form-action` restringidos.
- HSTS, nosniff, Referrer-Policy y Permissions-Policy definidos en CloudFront.
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

## AWS S3/CloudFront

- Bucket privado con Block Public Access.
- Origin Access Control entre CloudFront y S3.
- TLS moderno y dominio/certificado administrado.
- Access logs protegidos y lifecycle definido.
- Assets hasheados: cache largo e immutable.
- `index.html` y runtime config: cache corto/no-cache segun rollout.
- Custom error responses no convierten 403/404 sensibles en contenido incorrecto.
- WAF se justifica por amenaza/costo, no por checklist.

## Release y rollback

- Artefacto unico promovido por entornos.
- Version/revision visible en telemetria.
- Smoke test despues del deploy.
- Rollback a artefacto anterior documentado y probado.
- Invalidacion CloudFront acotada.
- Evidencia de deploy y cambio retenida sin secretos.
