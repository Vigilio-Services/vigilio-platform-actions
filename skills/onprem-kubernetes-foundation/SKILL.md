---
name: onprem-kubernetes-foundation
description: Diseña y opera clústeres Kubernetes on-premise y edge con Cilium eBPF, MetalLB, CSI Longhorn y cert-manager.
owner: governance-platform
lifecycle: stable
introduced_in: 0.8.0
routing_ecosystems: "cross-stack"
routing_keywords: "kubernetes, onprem, baremetal, k3s, rke2, cilium, metallb, longhorn"
routing_files: "package.json"
routing_capabilities: "kubernetes-infrastructure, onprem-edge"
requires: []
optional: []
conflicts: []
supersedes: []
---

<skill-content>

# Fundación Kubernetes On-Premise Y Edge

## Lectura obligatoria de referencias

Lee completamente [references/canonical-contract.md](references/canonical-contract.md).

Abre cada fuente canónica aplicable.

No cierres gates cuando una fuente requerida resulte inaccesible.

## Flujo

1. Instala distribución Kubernetes para bare-metal (K3s o RKE2).
2. Configura Cilium en modo eBPF nativo reemplazando kube-proxy para alta escalabilidad.
3. Configura MetalLB en modo BGP o L2 para balanceo de carga L4.
4. Despliega driver CSI (Longhorn o Rook-Ceph) con replicación entre nodos físicos.
5. Automatiza gestión de certificados TLS internos mediante cert-manager.

## Límites

- No usar hostPath o almacenamiento efímero local para bases de datos on-premise.
- No mantener kube-proxy tradicional en clústeres con alto rendimiento de red.
- No exponer servicios de gestión (API Server, etcd) fuera de la red de administración.

## Respuesta

Resume primero salud, riesgo y acción.

Usa frases cortas.

Incluye evidencia, costos, pruebas y ejemplos aplicables.

## ✅ Correcto / ❌ Incorrecto: manejo de existente

- ✅ **Correcto:** Aprovechar Cilium con eBPF nativo, almacenamiento replicado en 3 nodos y VIPs gestionadas con MetalLB.
- ❌ **Incorrecto:** Depender de configuraciones mononodo sin replicación de almacenamiento para cargas críticas en centros locales.
- **Gate:** no reescribir masivamente código heredado; inspeccionar baseline, tests y locks reales; reportar `NOT_RUN` si falta evidencia. La guía de refactor se consulta en `vigilio-docs/standards/engineering/refactoring-existing-code.md` según la revisión de Docs aprobada (no asumir que el link remoto `main` ya esté publicado).

</skill-content>

## Guías de librerías por versión — lectura antes de usar sus APIs

Las versiones de esta skill no se copian aquí: comprobar lockfile y [versión canónica](../.vigilio-docs/technology/versions.md). Cuando la tarea utilice una de estas dependencias, **abrir el `.md` completo** y consultar su migración ✅/❌ antes de escribir código; el resto no es obligatorio para una tarea que no la utiliza.

✅ Correcto: versionar el consumidor y seguir los ejemplos de la API instalada; enlazar documento propietario.  ❌ Incorrecto: copiar APIs legacy, duplicar normas en la skill o instalar nuevas dependencias sin gate.