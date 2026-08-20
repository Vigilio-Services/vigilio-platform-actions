# @vigilioyonatan/devsecops-evidence

CLI TypeScript compilado para generar metricas DORA, procedencia SLSA v1 y evidencia operacional
reutilizable entre backend, web, mobile y desktop.

```bash
vigilio-evidence collect-dora --environment production
vigilio-evidence generate-slsa --manifest reports/artifact-digests-production.txt
vigilio-evidence write-operational --policy-file .github/evidence-policy.json
```

El entorno DORA se configura con `--environment` o `DORA_ENVIRONMENT`; `production` permanece como
convencion segura cuando el consumidor no necesita otro nombre.

Las rutas, exclusiones, limite de archivos y evidencias esperadas pertenecen al repositorio
consumidor y se declaran en `.github/evidence-policy.json`.

El recolector no sigue enlaces simbolicos, elimina rutas duplicadas y calcula SHA-256 por bloques
para mantener un uso de memoria estable.
