# Modelo Operativo DevSecOps Y GitOps

## Qué reutilizar y qué cambia

Entre servicios suele reutilizarse 70–85% del flujo. La plataforma central posee workflows, acciones,
schemas, policy as code y generación de evidencia. Cada repositorio consume una versión fijada por SHA.

| Reusable | Específico del proyecto |
|---|---|
| gobierno, checkout, setup y caché | runtime y package manager |
| SAST, SCA, secret scan, SBOM, provenance | comandos lint/test/build y thresholds |
| OIDC, attestations, firma, ECR login | Dockerfile/contexto o paquete Lambda |
| Terraform plan/apply/drift | stack, cuenta, región y tfvars |
| Helm/Kustomize/policies/GitOps PR | chart, values, recursos, probes y SLO |
| evidence, DORA, preview lifecycle | rutas, dominios y dependencias del servicio |

No fuerces un pipeline idéntico: Lambda, EKS y frontend estático comparten controles, pero tienen
adaptadores de build/deploy distintos. Prefiere inputs tipados, defaults seguros y capabilities
explícitas (`has-postgres`, `run-bdd`, `delivery-kind`) sobre forks copiados del workflow.

## Flujo de extremo a extremo

```mermaid
flowchart LR
  PR[PR de aplicación] --> CI[CI reusable: calidad, tests y seguridad]
  CI --> OCI[Build único + SBOM + provenance]
  OCI --> ECR[ECR: digest inmutable y firma]
  ECR --> GP[PR GitOps cambia solo digest]
  GP --> Review[CODEOWNERS + environment approval]
  Review --> Argo[Argo CD reconcilia]
  Argo --> Rollout[Canary/blue-green + análisis SLO]
  Rollout --> Verify[Smoke + evidencia + DORA]
  Verify -->|fallo| Rollback[Rollback de manifest; datos con plan propio]
```

Terraform crea la plataforma y sus contratos; no participa en cada release de aplicación. GitHub
Actions valida y propone; Git es la fuente deseada; Argo reconcilia; observabilidad decide promoción.

## Gates por fase

### Pull request

- Gobierno: rama/título/commits, CODEOWNERS, PR template y change scope.
- Calidad: lint, typecheck, unit, coverage, integración, contratos, BDD/E2E según riesgo.
- Seguridad: gitleaks, SAST, SCA/license, IaC/manifests, imagen, excepciones con expiry.
- Delivery: render Helm/Kustomize, schema, kubeconform y policy as code.
- Infra: fmt/validate/test/plan, destructive-change guard y costo diferencial.

Ordena jobs baratos y deterministas primero; paraleliza ramas independientes. Cancela CI obsoleta de PR,
pero no canceles promoción productiva iniciada. Usa paths solo cuando no permitan saltar un gate requerido.

### Desarrollo y staging

- Publica digest solo desde fuente confiable y promueve mediante GitOps.
- Desarrollo optimiza costo y feedback; staging conserva contratos productivos y ejecuta integración,
  smoke, migración, seguridad dinámica y pruebas de rollback/failover seleccionadas.
- Bases y cachés se aíslan por stage. No clones datos productivos sin anonimización y autorización.

### Producción

- Disparo desde rama protegida, environment con reviewers y `cancel-in-progress: false`.
- Mismo digest de staging, PR mínimo, CODEOWNERS y ventana/criterio de cambio cuando aplique.
- Migración expand/contract antes del rollout; rollback de aplicación no promete rollback de datos.
- Canary/blue-green usa error rate, latency, saturation y señales de negocio; no solo una espera.
- Smoke posterior y evidencia enlazada al SHA, digest, PR, actor, aprobación y versión deseada.

## GitOps, Helm y configuración

- Chart reusable expresa capacidades; values por app/stage expresan configuración. Un schema rechaza
  placeholders, digest cero, ARNs inválidos y combinaciones peligrosas.
- Kustomize compone entornos/plataforma sin duplicar manifests. Genera ApplicationSets desde un catálogo
  declarativo cuando varios workloads siguen el mismo contrato.
- URLs de repositorio, organización, workload, chart, value file, dominios y release names deben venir de
  inputs/catálogos validados. No conviertas toda cadena interna en variable si es una invariante local.
- Secretos viven en AWS Secrets Manager/SSM y llegan con External Secrets o identidad de pod. Git solo
  guarda referencias; Sealed Secrets requiere gestión explícita de claves.
- Kyverno/admission exige security context, recursos, red, digest y firma antes de admitir.
- La corrección ocurre en Git. Los cambios manuales de emergencia se documentan, se reconcilian de vuelta
  y se auditan; no se normaliza drift.

## Previews efímeros

- Se crean por label/botón explícito tras CI; actualizar PR actualiza preview; quitar label/cerrar destruye.
- Solo PR interno, namespace por PR, hostname estable, quota/LimitRange/NetworkPolicy y RBAC acotado.
- Digest inmutable, secretos no productivos, base aislada o esquema con lifecycle seguro y sin datos reales.
- TTL corto configurable, janitor independiente e idempotente, límite de previews/tareas y costo máximo.
- Previews validan aplicación; no necesitan duplicar RDS, EKS o observabilidad completa por PR.

## Seguridad de plataforma

- `permissions: {}` o lectura mínima por defecto; escritura se delega al job exacto.
- Acciones y reusable workflows externos fijados a SHA. Renovate propone upgrades revisables.
- GitHub App por frontera: source read, packages read, broker y GitOps write no comparten poder.
- AWS OIDC sin access keys; trust por organización/repositorio/ref/environment y roles separados para
  build, plan, apply y runtime.
- Nunca interpolar contenido no confiable directamente en shell. Pasa valores por `env`, valida formato y
  usa quoting estricto.
- Artifacts y logs no contienen secretos/PII; retención corresponde a auditoría y costo.

## Caché y optimización sin perder calidad

- pnpm por hash de lockfile y versión; Terraform providers por lockfile; BuildKit por contexto/arquitectura;
  scanners por versión de base de datos.
- No caches `.env`, npmrc, tokens, state, planes sensibles ni resultados usados como aprobación.
- Separa restore/save. PRs no confiables leen como máximo caché segura y no escriben caché compartida.
- Matrices solo para combinaciones soportadas; smoke crítico en PR y suites profundas en main/nightly
  siempre que el riesgo residual quede visible.
- Reusa artefactos entre jobs con checksums; no reinstales/recompiles si cambia la identidad del artefacto.

### Contrato de rendimiento

- Mide antes y después: tiempo hasta el primer fallo útil, duración p50/p95, ruta crítica, minutos de runner,
  tamaño y hit ratio de caché. No declares una optimización solo porque "parece más rápida".
- Conserva resultados cold-cache y warm-cache. Todo job debe funcionar correctamente sin caché.
- Aísla BuildKit por imagen, Dockerfile, contexto y plataformas; scopes globales hacen competir capas de
  workloads distintos. Separa caché de release y preview cuando sus trust boundaries sean diferentes.
- Divide gates rápidos de suites costosas. Tras el preflight, paraleliza unit, integración, contratos y
  seguridad cuando sean independientes; no serialices por comodidad.
- Usa change detection solo con un grafo de dependencias verificable y siempre ejecuta una suite completa
  en `main`/merge queue o schedule. Paths ignorados no pueden omitir controles transversales.
- Sharding se justifica cuando reduce p95 más que su overhead. Cada shard debe ser determinista y el gate
  final debe detectar shards fallidos, cancelados u omitidos.
- Reduce costo antes que cobertura: evita reinstalaciones, builds duplicados y descargas repetidas; no
  elimines tests, escaneos, firma, approvals o evidencia para ganar minutos.

## Escalamiento, observabilidad y operación

- API: HPA por CPU/memoria y, cuando exista, señal de tráfico. Worker: KEDA por backlog/edad. PDB,
  topology spread, requests/limits y graceful shutdown son parte del chart.
- Logs, métricas y trazas OpenTelemetry correlacionadas; labels de baja cardinalidad, redacción de PII,
  sampling y retención por stage.
- SLIs/SLO y burn-rate alerts gobiernan promoción. Cada alerta tiene severidad, owner, canal, deduplicación,
  inhibición y runbook probado. Dashboard sin acción no sustituye alerta.
- Registra deployment frequency, lead time, change failure rate y restore time; no optimices métricas a costa
  de calidad.
- Chaos, load, restore y DR se ejecutan en entornos controlados, con stop condition y costo acotado.

## FinOps y evidencia

- Presupuesto/alertas, tags, Infracost y OpenCost cubren nube, infraestructura y Kubernetes.
- Resource requests se basan en medición; VPA recomienda antes de automatizar cambios productivos.
- Retención de logs, métricas, traces, artefactos, cachés, previews e imágenes tiene propietario y límite.
- Una evidencia mínima incluye commit, workflow SHA, digest, SBOM/provenance/firma, resultados, plan/costo,
  approval, estado Argo/Rollout, smoke y rollback probado.

## Anti-patrones

- Copiar YAML entre proyectos, usar `secrets: inherit` sin revisar frontera o referenciar reusable workflow
  por `main`.
- Mezclar build, Terraform apply y `kubectl apply` en un job privilegiado.
- Desplegar `latest`, recompilar para producción, usar access keys o promover sin staging/evidencia.
- Ocultar gates omitidos, tolerar fallos con `continue-on-error`, aprobar por tiempo o ignorar drift.
- Previews permanentes, ambientes sin cuotas, alertas sin runbook y observabilidad con cardinalidad ilimitada.

## Implementación de referencia

- Reusables: `platform-actions/.github/workflows`.
- Callers: `practicing/apps/*/.github/workflows`.
- Contenedores: `practicing/docker-v2`.
- Terraform: `practicing/infra-v2`.
- Helm, GitOps, policies, observabilidad y runbooks: `practicing/deploy-v2`.

Fuentes vigentes: [GitHub reusable workflows](https://docs.github.com/en/actions/how-tos/reuse-automations/reuse-workflows),
[GitHub OIDC](https://docs.github.com/en/actions/reference/security/oidc),
[GitHub cache security](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching) y
[Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/).
