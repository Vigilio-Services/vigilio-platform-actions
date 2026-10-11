# Contrato Reutilizable De Contenedores

## Propiedad y parámetros

| Capa | Debe poseer | Debe parametrizar |
|---|---|---|
| Aplicación | código, lockfile, tests, health contract | comandos, directorio, runtime |
| Repositorio Docker | Dockerfile, Bake/BuildKit, Compose de integración | contexto, ref, plataforma, target |
| Infraestructura | ECR, KMS, lifecycle, roles OIDC | nombres, cuenta, región, retención |
| Delivery | promoción del digest y política de admisión | workload, stage, values file |

No copies pipelines completos entre servicios. Usa un workflow reusable fijado a un commit SHA y un
caller delgado con inputs explícitos. Un backend EKS, una Lambda empaquetada y un frontend estático
comparten controles de supply chain, pero no deben fingir el mismo mecanismo de entrega.

## Dockerfile productivo

- Usa etapas separadas para dependencias, compilación y runtime.
- Fija bases por digest y conserva el tag legible junto al digest.
- Instala desde lockfile; desactiva scripts de lifecycle cuando no sean necesarios.
- Monta npmrc/tokens con secretos de BuildKit. No uses `ARG` o `ENV` para credenciales.
- Copia solo artefactos de runtime, usa `.dockerignore`, usuario no-root, filesystem de solo lectura
  cuando la aplicación lo permita y señal/entrypoint correctos.
- No instales shell, compiladores o package manager en la imagen final sin necesidad operativa.
- Declara health checks en la capa que los posea; Kubernetes usa probes, no un `HEALTHCHECK` duplicado
  sin propósito.
- Produce AMD64 para validación temprana y un manifest AMD64/ARM64 cuando la plataforma lo requiera.

## Pipeline seguro y rápido

1. Checkout de fuentes exactas; para repositorios hermanos privados usa GitHub App de solo lectura.
2. Configura dependencias con credencial distinta y alcance `read:packages`.
3. Restaura caché por SO, arquitectura, versión de herramienta y hash del lockfile.
4. Trata toda caché restaurada como no confiable. Nunca caches secretos y solo permite escritura desde
   triggers confiables; el job debe funcionar en cache miss.
5. Ejecuta lint de Dockerfile/Compose, build reproducible, smoke test y escaneo de vulnerabilidades.
6. En PR conserva SBOM, reporte y evidencia como artefactos; no hagas push desde forks.
7. En rama protegida asume un rol AWS mediante OIDC, inicia sesión en ECR y publica.
8. Genera SBOM y provenance durante el build. Firma de forma keyless y verifica identidad/issuer.
9. Promueve `repository@sha256:...`; nunca una etiqueta mutable.

Fija GitHub Actions de terceros por SHA. Los permisos se declaran por job: `contents: read` por defecto,
`id-token: write` solo donde se usa OIDC y permisos de attestations/packages solo donde se requieren.

## ECR y FinOps

- Repositorios con tag inmutable, cifrado KMS y scanning habilitado.
- Lifecycle: elimina imágenes sin tag después de una ventana corta y retiene un número acotado de
  releases `sha-*`; ajusta ambos valores según frecuencia de rollback.
- Evita duplicar builds por ambiente. Desarrollo, staging y producción consumen el mismo digest.
- Usa BuildKit/GHA cache con tamaño y claves estables; no archives `node_modules` como artefacto.
- Construye multi-arquitectura solo en releases o previews solicitados cuando el costo no justifique
  hacerlo en cada PR.

## Gates verificables

- Dockerfile/Compose/Bake validan y no contienen secretos.
- La imagen inicia como no-root, responde health y termina correctamente.
- El escáner no encuentra vulnerabilidades por encima de la política o existe excepción vigente.
- El SBOM corresponde al digest; provenance y firma se verifican.
- ECR rechaza sobrescritura de tags y aplica lifecycle.
- Helm/Kustomize referencia digest, no `latest`.

## Anti-patrones

- `docker login` con contraseña permanente, PAT amplio o access keys AWS.
- `COPY . .` sin contexto controlado, secretos en layers o logs, o `curl | sh` no verificado.
- Publicar antes de escanear, firmar una etiqueta, reconstruir por stage o aprobar solo por tiempo.
- Cachés globales sin lockfile/arquitectura, escritura de caché desde forks o confiar en el caché como
  evidencia de seguridad.
- Conservar todas las imágenes, SBOM y logs para siempre sin requerimiento de auditoría.

## Referencia vigente

- GitHub: [OIDC con workflows reutilizables](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-with-reusable-workflows)
- GitHub: [seguridad de dependency caching](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- AWS: [tag immutability de ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/image-tag-mutability.html)
- AWS: [lifecycle policies de ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/LifecyclePolicies.html)

Implementación de referencia Vigilio: `practicing/docker-v2`,
`platform-actions/.github/workflows/shared-container-build-push.yml` y
`practicing/infra-v2/modules/aws/ecr`.
