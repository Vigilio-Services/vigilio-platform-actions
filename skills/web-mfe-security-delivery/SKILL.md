---
name: web-mfe-security-delivery
description: Endurece seguridad browser, configuracion, supply chain, CI/CD y delivery por perfil de web-mfe/web-mfe-v2. Usar al cambiar autenticacion, tokens, runtime env, uploads, CSP/headers, dependencias, GitHub Actions, previews, SBOM, provenance, OCI, ECR, Kubernetes, Helm, GitOps, Terraform, CDK/CDN cuando exista, dominios o release/rollback.
owner: frontend-platform
lifecycle: stable
introduced_in: 0.7.0
routing_ecosystems: "web, frontend, react, preact, typescript"
routing_keywords: "csp, jwt, security, cloudfront"
routing_files: "package.json, vite.config.ts"
routing_capabilities: "security, delivery"
requires: [web-mfe-technologies]
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Seguridad Y Delivery Web MFE

## Lectura obligatoria de referencias

Antes de actuar, leer de principio a fin cada archivo `references/*` enlazado por esta skill. Dentro
de cada referencia aplicable, abrir y leer completas todas las fuentes canónicas enlazadas; no basta
con leer títulos, tablas o resúmenes. Si una fuente requerida no es accesible, identificarla y no
afirmar cumplimiento ni cerrar el gate que dependa de ella.

Todo codigo enviado al navegador es publico. Ninguna variable, bundle, source map o runtime config puede contener secretos.

## Flujo obligatorio

1. Resolver el perfil antes de editar: `current-web` preserva su delivery ejecutable; `k8s-v2` usa `/docker`, `/deploy` e `/infra` con OCI/ECR/Helm/Argo/EKS/Terraform.
2. Clasificar datos y superficie: publica, autenticada, privilegiada o regulada.
3. Modelar amenazas para auth, uploads, XSS, supply chain y cache cuando cambie el riesgo.
4. Validar configuracion publica con Zod y allowlist; rechazar nombres sensibles.
5. Mantener CSP y headers en el edge, CDN, reverse proxy o ingress owner del perfil, con excepciones minimas y documentadas.
6. Ejecutar CI con permisos minimos, acciones fijadas por SHA y OIDC para AWS; no usar access keys persistentes.
7. Generar/validar SBOM, escaneo de dependencias, secretos, imagen/manifests/IaC segun perfil y artefactos.
8. Promover el mismo artefacto inmutable por digest/revision y conservar rollback probado; el deploy no recompila.
9. Usar OpenSpec para cambios cross-repo, arquitectura, auth, infraestructura o contratos breaking.

## Seguridad frontend

- No guardar tokens sensibles en `localStorage` si existe alternativa basada en cookies seguras/BFF.
- No insertar HTML no confiable; sanitizar solo en el boundary que realmente lo requiere.
- Validacion frontend mejora UX, pero autorizacion y reglas de negocio viven en backend.
- No exponer stack traces, Zod issues internos, IDs sensibles ni detalles de AWS al usuario.
- Presigned uploads requieren limites de MIME/tamano/purpose tambien en backend.

## CI/CD

- Gates minimos: lint, typecheck, tests, contratos, build, bundle budget, SAST, dependency/secret scan y validacion de IaC/manifests/imagen segun el perfil.
- Preview environments no usan datos productivos ni secretos de produccion.
- Produccion requiere artefacto promovido, approval protegido y smoke/rollback.
- El deploy no recompila con inputs diferentes al artefacto validado.

Leer [references/security-delivery-checklist.md](references/security-delivery-checklist.md) para controles concretos de GitHub, AWS y Kubernetes por perfil.


> Fuente única para **Correcto / Incorrecto: manejo de existente**: [abrir documento canónico](../.vigilio-docs/standards/engineering/refactoring-existing-code.md).

## ✅ Correcto / ❌ Incorrecto — tarea `web-mfe-security-delivery`

✅ **Correcto:** en esta tarea, verificar autorización por recurso y aislar secretos de los logs; remitir la norma compartida al documento propietario.

❌ **Incorrecto:** en esta tarea, confiar en la UI o en el tenant_id enviado por el cliente; inventar pruebas o pegar el mismo procedimiento transversal en varias skills.

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.
- [vite](../.vigilio-docs/technology/libraries/vite.md)
- [tailwind-css](../.vigilio-docs/technology/libraries/tailwind-css.md)
- [github-actions](../.vigilio-docs/technology/libraries/github-actions.md)

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.

