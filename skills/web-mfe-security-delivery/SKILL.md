---
name: web-mfe-security-delivery
description: Endurece seguridad, configuracion, supply chain, CI/CD y despliegue AWS de web-mfe sobre S3/CloudFront. Usar al cambiar autenticacion, tokens, runtime env, uploads, CSP/headers, dependencias, GitHub Actions, previews, SBOM, provenance, CDK, buckets, distribuciones, dominios o estrategia de release/rollback.
---

<skill-content>

# Seguridad Y Delivery Web MFE

Todo codigo enviado al navegador es publico. Ninguna variable, bundle, source map o runtime config puede contener secretos.

## Flujo obligatorio

1. Clasificar datos y superficie: publica, autenticada, privilegiada o regulada.
2. Modelar amenazas para auth, uploads, XSS, supply chain y cache cuando cambie el riesgo.
3. Validar configuracion publica con Zod y allowlist; rechazar nombres sensibles.
4. Mantener CSP y headers en infraestructura/CDN, con excepciones minimas y documentadas.
5. Ejecutar CI con permisos minimos, acciones fijadas por SHA y OIDC para AWS; no usar access keys persistentes.
6. Generar/validar SBOM, escaneo de dependencias, secrets y artefactos.
7. Desplegar artefacto inmutable, invalidar solo lo necesario y conservar rollback probado.
8. Usar OpenSpec para cambios cross-repo, arquitectura, auth, infraestructura o contratos breaking.

## Seguridad frontend

- No guardar tokens sensibles en `localStorage` si existe alternativa basada en cookies seguras/BFF.
- No insertar HTML no confiable; sanitizar solo en el boundary que realmente lo requiere.
- Validacion frontend mejora UX, pero autorizacion y reglas de negocio viven en backend.
- No exponer stack traces, Zod issues internos, IDs sensibles ni detalles de AWS al usuario.
- Presigned uploads requieren limites de MIME/tamano/purpose tambien en backend.

## CI/CD

- Gates minimos: lint, typecheck, tests, contratos, build, bundle budget, SAST, dependency/secret scan y IaC synth.
- Preview environments no usan datos productivos ni secretos de produccion.
- Produccion requiere artefacto promovido, approval protegido y smoke/rollback.
- El deploy no recompila con inputs diferentes al artefacto validado.

Leer [references/security-delivery-checklist.md](references/security-delivery-checklist.md) para controles concretos de GitHub y AWS.

</skill-content>
