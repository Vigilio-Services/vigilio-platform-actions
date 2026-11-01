---
name: software-supply-chain-security
description: Garantiza seguridad SLSA Nivel 3 con firma Cosign, generación de SBOM Syft, escaneo Grype y triaje OpenVEX.
owner: governance-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "supply-chain, slsa, cosign, syft, sbom, grype, openvex, kyverno"
routing_files: "package.json"
routing_capabilities: "supply-chain-security, devsecops"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Seguridad De La Cadena De Suministro

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Genera imágenes OCI inmutables referenciadas por digest SHA-256 en entornos seguros de CI.
2. Produce inventarios SBOM en formato SPDX o CycloneDX con Syft.
3. Escanea dependencias y capas de imagen con Grype o Trivy.
4. Aplica triaje de falsos positivos no explotables mediante declaraciones OpenVEX formalizadas.
5. Firma la imagen criptográficamente con Cosign (Keyless) y valida firmas en admisión con Kyverno.

## Límites

- No admitir en producción imágenes no firmadas o construidas fuera del pipeline oficial.
- No ignorar vulnerabilidades críticas sin un documento de justificación OpenVEX auditable.
- No firmar imágenes con claves privadas compartidas o sin libro mayor de transparencia (Rekor).

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Implementar atestaciones de procedencia SLSA, firma Keyless con Cosign y admisión fail-closed con Kyverno.
- ❌ **Incorrecto:** Permitir el despliegue de imágenes arbitrarias descargadas de registros públicos sin validación criptográfica.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.