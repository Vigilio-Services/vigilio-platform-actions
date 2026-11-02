---
name: software-supply-chain-security
description: Implementa seguridad de cadena de suministro SLSA v1.2 con evidencia honesta: BuildKit rootless, Distroless glibc, Containerfile.runtime sin fuga de tokens, pnpm packages:[], Syft SBOM, Trivy, OpenVEX, firma Cosign OIDC y admisión Kyverno ImageValidatingPolicy CEL.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "supply-chain, slsa, cosign, syft, sbom, grype, openvex, cyclonedx, spdx, keyless, fulcio, rekor, provenance, attestation, kyverno, clusterpolicy"
routing_files: "cosign*.yaml, Dockerfile, .github/workflows/*.yml, policy*.yaml, syft*.yaml, openvex*.json"
routing_capabilities: "supply-chain-security, container-security, sbom-signing"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Seguridad De La Cadena De Suministro (SLSA v1.2 + Sigstore)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. **Endurecimiento de Dependencias y Build:** Bloquea scripts arbitrarios de instalación con `pnpm-workspace.yaml` (`packages: []`, `verifyStoreIntegrity: true`, `strictDepBuilds: true`, `dangerouslyAllowAllBuilds: false`, `minimumReleaseAge: 1440`, lista blanca `allowBuilds`) y fija GitHub Actions por commit SHA con `persist-credentials: false`.
2. **Empaquetado OCI Inmutable y Cero Secretos en Capas:** Compila en BuildKit rootless alineando `glibc` (Debian -> `gcr.io/distroless/nodejs24-debian13:nonroot` `65532:65532` para no corromper módulos nativos como `sharp`); para frontends usa `Containerfile.runtime` copiando únicamente `dist/` compilado afuera para impedir fugas de `NPM_TOKEN` en capas OCI.
3. **SBOM, Escaneo y OpenVEX:** Genera inventarios CycloneDX/SPDX con Syft, bloquea CVEs `HIGH` y `CRITICAL` con Trivy/Grype y gestiona excepciones no explotables exclusivamente mediante documentos `OpenVEX` firmados con TTL vigente (`<= 14` días en investigación).
4. **Firma Keyless OIDC y Admisión Fail-Closed:** Firma el digest `@sha256:...` y adjunta atestaciones en Rekor mediante Cosign keyless OIDC; verifica antes del `pull` en VPS Compose o mediante **`ImageValidatingPolicy` CEL de Kyverno (`validationActions: [Audit, Deny]`)** en Kubernetes (`preview` y `production`).
5. **Frontera Honesta de Evidencia SLSA v1.2:** Distingue entre un predicado generado dentro del job del proyecto (integridad/L1) y procedencia firmada por el plano de control del runner hospedado (candidato Build L2). Nunca declares L2/L3 "certificado" sin evidencia del runner remoto y prueba runtime de rechazo de firmas inválidas.

## Qué Hacer Y Qué NO Hacer (Límites Senior)

- ✅ **Hacer:** Promover exactamente el mismo digest `@sha256:...` entre ambientes y escribir políticas nuevas en CRDs CEL estables (`ImageValidatingPolicy` / `ValidatingPolicy`) en lugar del `ClusterPolicy` obsoleto.
- ❌ **No hacer:** Pasar tokens privados por `ARG`/`ENV` en la etapa final del `Dockerfile`, mezclar binarios Alpine/`musl` en runtime Debian Distroless o autocertificar SLSA Build L2/L3 con un JSON generado por `cat` en el propio script.
- ❌ **No hacer:** Admitir imágenes sin firma, usar claves privadas estáticas compartidas o aceptar excepciones CVE sin documento `OpenVEX` vigente.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Combinar lockfile endurecido (`packages: []`), imágenes Distroless non-root sin secretos, SBOM + OpenVEX, firma Cosign OIDC y verificación fail-closed previa al despliegue o en admisión CEL.
- ❌ **Incorrecto:** Permitir imágenes mutables o no firmadas, filtrar credenciales de paquetes en el historial OCI o declarar niveles SLSA superiores a los demostrados por el builder real.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.
