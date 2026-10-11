# Contrato Terraform AWS Reutilizable

## Arquitectura de composición

```text
bootstrap/          estado remoto y prerequisitos; ciclo de vida independiente
modules/aws/        capacidades pequeñas, tipadas, probadas y sin nombres de una app
stacks/aws/         composición por dominio/blast radius: network, platform, finops
environments/aws/   roots delgados por stage; backend, providers y inputs
config/aws/         backend.hcl y tfvars.example sin secretos
policies/           controles Conftest/OPA y excepciones temporales
```

Un módulo contiene una capacidad reusable. Un stack decide cómo combinarlas. El ambiente decide región,
stage, tamaños y catálogo de workloads. Usa objetos/mapas tipados para catálogos repetibles, pero no
conviertas cada literal en variable: parametriza diferencias reales y conserva invariantes de seguridad.

## Estado y ownership

- Separa foundation de red, plataforma/workloads y FinOps cuando tengan diferente ciclo, permisos o
  blast radius. Comparte contratos mínimos mediante outputs publicados o data sources, no leyendo todo
  el state de otro dominio.
- Backend remoto cifrado, con versionado, control de acceso, bloqueo y recuperación probada.
- Una clave de state por cuenta/región/stage/stack. La concurrencia del workflow refleja esa clave.
- Commita `.terraform.lock.hcl`; fija Terraform y providers. Actualiza con PR automatizado y pruebas.
- Usa `moved` blocks para refactors y un runbook para import/cutover; no edites state a mano.

## Diseño del módulo

- Variables con tipo, descripción, validation y defaults solo cuando sean seguros.
- Outputs mínimos, descritos y `sensitive` si aplica. No devuelvas credenciales.
- Naming, tags, cifrado, logging y retención mediante contratos comunes.
- Preconditions/checks para invariantes; lifecycle solo cuando expresa una decisión operativa.
- IAM construido desde acciones/recursos concretos. Roles separados para GitHub, operadores y pods.
- EKS usa Pod Identity/IRSA; RDS administra contraseña en Secrets Manager; secretos no se materializan
  en variables o state salvo que sea inevitable y esté documentado.

## Pipeline PR y apply

### PR

1. `terraform fmt -check -recursive` y `terraform validate`.
2. TFLint y escaneo IaC; policy as code para cifrado, exposición, tags y cambios destructivos.
3. `terraform test` de módulos con mocks/plan cuando sea suficiente.
4. `terraform plan -out=tfplan`, JSON y resumen legible usando rol OIDC de solo lectura/plan.
5. Infracost delta y umbral de revisión. Publica resumen; evita exponer valores sensibles.
6. Conserva el plan por retención corta y enlázalo al SHA, stage y run.

### Apply

1. Solo rama protegida y GitHub Environment del stage, con reviewer para producción.
2. Usa rol OIDC de apply diferente y trust restringido a repositorio, workflow/environment y audience.
3. Descarga y verifica el plan aprobado; no replantees silenciosamente con otros inputs.
4. Serializa por state, aplica, valida health y emite evidencia no sensible.
5. Si la infraestructura ya está declarada, el despliegue de aplicación no ejecuta Terraform.

Drift corre en horario y bajo demanda con `plan -detailed-exitcode`; notifica cambio accionable sin
aplicarlo automáticamente. Una limitación de credenciales debe reportarse como gate no ejecutado, no
como éxito.

## Seguridad, resiliencia y observabilidad

- Redes privadas, ingress/egress mínimos, endpoints privados donde reduzcan NAT/costo y acceso público
  deshabilitado por defecto.
- KMS, TLS y logs de auditoría acordes a clasificación. CloudTrail/Config/GuardDuty/WAF se habilitan por
  perfil de riesgo, no como decoración.
- RDS backups/PITR, Multi-AZ en producción y restore probado. Define RPO/RTO antes de vender DR.
- CloudWatch/Prometheus/OpenTelemetry cubren disponibilidad, saturación, errores y dependencias; cada
  alerta tiene owner y runbook.
- Protege destrucciones críticas y prueba recuperación del backend/state y datos.

## FinOps

- Tags obligatorios: producto, servicio, stage, owner, cost center y managed-by.
- Presupuesto y alertas por cuenta/stage; Infracost en PR; reportes reales cuando Billing lo permita.
- Derechos de tamaño distintos por ambiente, autoscaling con límites, retención acotada y previews con
  TTL. Usa Spot solo para carga tolerante a interrupción.
- Revisa NAT, logs, snapshots, métricas de alta cardinalidad, transferencia y recursos huérfanos.
- Costo estimado no equivale a factura. Registra supuestos y contrasta con Cost Explorer/CUR.

## Gates y anti-patrones

Debe existir evidencia de fmt/validate/test, plan, policy, costo, approval, apply, health y drift. Evita:

- módulos "universales" con decenas de flags, recursos copiados por stage o nombres de una app dentro
  de un módulo compartido;
- `terraform apply -auto-approve` desde laptop, access keys, secretos en tfvars/outputs o state en Git;
- `-target` como operación cotidiana, `ignore_changes` para esconder drift o destroy/recreate no revisado;
- afirmar alta disponibilidad, backup o FinOps sin probar failover/restore ni observar costo real.

## Referencia vigente

- HashiCorp: [guía de estilo y estructura](https://developer.hashicorp.com/terraform/language/style)
- HashiCorp: [estado remoto](https://developer.hashicorp.com/terraform/language/state)
- HashiCorp: [state locking](https://developer.hashicorp.com/terraform/language/state/locking)
- HashiCorp: [terraform test](https://developer.hashicorp.com/terraform/cli/commands/test)
- GitHub: [OIDC con workflows reutilizables](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-with-reusable-workflows)

Implementación de referencia Vigilio: `practicing/infra-v2` y los workflows
`shared-terraform-plan.yml`, `shared-terraform-apply.yml` y `shared-terraform-drift.yml`.
