---
name: onprem-kubernetes-foundation
description: Diseña y opera clústeres Kubernetes autoalojados/on-premise (Nivel 2) con RKE2/K3s sin kube-proxy, Cilium eBPF + WireGuard, MetalLB, Gateway API, CSI replicado (Longhorn/Rook-Ceph) y cert-manager.
owner: governance-platform
lifecycle: experimental
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "onprem, baremetal, k3s, rke2, metallb, longhorn, onprem-kubernetes, edge-kubernetes"
routing_files: "Chart.yaml, values*.yaml, kustomization.yaml, metallb*.yaml, longhorn*.yaml"
routing_capabilities: "kubernetes-infrastructure, onprem-edge"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Fundación Kubernetes Autoalojado, On-Premise Y Edge (Nivel 2)

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Provisiona RKE2 (CIS Benchmark) o K3s multi-maestro (mínimo 3 planos de control con `etcd` cuórum impar) deshabilitando `kube-proxy` desde el bootstrap.
2. Despliega Cilium en modo eBPF nativo (`kubeProxyReplacement=true`) con cifrado nodo-a-nodo transparente WireGuard para cumplir soberanía y tránsito privado.
3. Expone L4 mediante MetalLB (BGP en datacenter o L2 determinista) y L7 mediante **Gateway API** (`GatewayClass` / `HTTPRoute` sobre Cilium Gateway o Traefik/Envoy), retirando el `ingress-nginx` comunitario archivado.
4. Opera almacenamiento de bloques distribuido CSI (`Longhorn` o `Rook-Ceph`) con replicación física entre nodos (`numberOfReplicas: 3`) y `reclaimPolicy: Retain` para cargas con estado; delega bases de datos productivas a `CloudNativePG` (PVC separado para WAL) con backup externo S3.
5. Automatiza PKI interna y pública con `cert-manager` (`DNS-01` para dominios privados/wildcards), Vault + External Secrets Operator y rotación sin downtime.

## Qué Hacer Y Qué NO Hacer (Senior Mode)

- ✅ **Hacer:** Exigir 3 nodos de plano de control para cuórum `etcd`, Cilium eBPF sin `kube-proxy`, Gateway API estándar y separación de fallo entre CSI local y object storage S3 externo para backups.
- ❌ **No hacer:** Desplegar nuevos clústeres sobre `ingress-nginx` comunitario retirado, usar `hostPath` / `reclaimPolicy: Delete` en bases de datos, exponer el API Server (`6443`) o `etcd` fuera de la red de gestión o forzar esta topología en proyectos de 1–3 VPS sin disparadores ADR (usar Nivel 1 `platform-compose-vps-delivery`).

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aprovechar Cilium con eBPF nativo y WireGuard, Gateway API, almacenamiento CSI replicado en 3 nodos con `Retain` y VIPs gestionadas con MetalLB.
- ❌ **Incorrecto:** Depender de configuraciones mononodo sin cuórum `etcd`, mantener `kube-proxy` iptables a escala o asumir que réplicas Longhorn sustituyen backups 3-2-1 fuera del clúster.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.