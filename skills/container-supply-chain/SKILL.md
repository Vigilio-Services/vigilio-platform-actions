---
name: container-supply-chain
description: "Diseña, implementa y revisa pipelines OCI reutilizables para Docker o Podman, BuildKit, ECR, multi-arquitectura, caché segura, SBOM, provenance, escaneo, firma y promoción por digest. Usar al cambiar Dockerfiles, builds, registros o seguridad de imágenes; no usar para IaC o despliegues Kubernetes sin cambios de imagen."
---

<skill-content>

# Supply Chain De Contenedores

## Lectura obligatoria de referencias

Lee completamente [references/container-delivery.md](references/container-delivery.md). Abre las fuentes
canónicas aplicables antes de afirmar cumplimiento.

## Resultado esperado

Construye una sola vez y promueve exactamente el mismo digest. Mantén la receta de imagen reusable,
pero deja el nombre, contexto, plataformas, repositorio, stage y límites como inputs validados.

## Flujo

1. Identifica quién posee código, receta, registro, permisos y manifiesto de despliegue.
2. Modela una imagen reproducible, mínima, no-root y fijada por digest.
3. Separa autenticación de código privado, paquetes y nube; usa secretos efímeros de BuildKit.
4. Ejecuta lint, build AMD64, pruebas de runtime y escaneo antes de publicar.
5. Publica multi-arquitectura en ECR con OIDC y permisos mínimos.
6. Genera SBOM y provenance, firma el digest y verifica la firma.
7. Entrega el digest al flujo GitOps; nunca recompiles durante promoción.
8. Aplica retención, limpieza y caché acotada; conserva evidencia verificable.

## Invariantes

- El registro productivo de referencia es ECR privado; Docker Hub no es dependencia de entrega.
- Ningún token, `.env`, archivo npmrc o credencial entra en una capa, artefacto o caché.
- Tags ayudan a humanos; solo el digest identifica el artefacto desplegable.
- PRs no confiables no publican, firman, asumen roles ni escriben cachés compartidas.
- Un hallazgo bloqueante no se omite sin excepción temporal, propietario y vencimiento.

## Respuesta

Primero indica artefacto, riesgo y promoción. Distingue evidencia observada de recomendación.
Incluye comandos o cambios concretos y la prueba que demuestra cada control.

</skill-content>
