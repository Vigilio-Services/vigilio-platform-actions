import type { FixtureTestCase } from '../../types.js';

export const ONPREM_FOUNDATION_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-ONP-CORRECT-01',
    skill: 'onprem-kubernetes-foundation',
    type: 'correct',
    expectedVerdict: 'PASS',
    reason:
      'Kubernetes on-premise con Cilium en modo eBPF nativo (kubeProxyReplacement), MetalLB con IPAddressPool y almacenamiento distribuido Longhorn con réplicas 3.',
    files: {
      'onprem/cilium-values.yaml': `
kubeProxyReplacement: true
bpf:
  masquerade: true
  hostRouting: true
k8sServiceHost: "192.168.10.100"
k8sServicePort: 6443
`,
      'onprem/metallb.yaml': `
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: production-pool
  namespace: metallb-system
spec:
  addresses:
    - 192.168.10.200-192.168.10.240
---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: l2-adv
  namespace: metallb-system
`,
      'onprem/longhorn-storageclass.yaml': `
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: longhorn-replicated
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "3"
  staleReplicaTimeout: "2880"
`,
      'reports/onprem-cluster-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          ciliumKubeProxyReplacementActive: true,
          metalLbPoolConfigured: true,
          csiReplicationFactor: 3,
          etcdMultiNodeQuorum: true,
          nodeCount: 3,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-ONP-INSECURE-01',
    skill: 'onprem-kubernetes-foundation',
    type: 'insecure',
    expectedVerdict: 'FAIL',
    reason:
      'Almacenamiento hostPath local en nodo para base de datos en producción, factor de replicación CSI 1 (sin tolerancia a fallos) y API server expuesto en 0.0.0.0/0.',
    files: {
      'onprem/database-volume.yaml': `
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-insecure-pv
spec:
  accessModes:
    - ReadWriteOnce
  capacity:
    storage: 50Gi
  hostPath:
    path: /var/lib/postgresql/data
`,
      'onprem/longhorn-storageclass.yaml': `
kind: StorageClass
apiVersion: storage.k8s.io/v1
metadata:
  name: longhorn-noreplica
provisioner: driver.longhorn.io
parameters:
  numberOfReplicas: "1"
`,
      'reports/onprem-cluster-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          hostPathDetected: true,
          csiReplicationFactor: 1,
          ciliumKubeProxyReplacementActive: false,
          singleNodeRisk: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-ONP-NOTRUN-01',
    skill: 'onprem-kubernetes-foundation',
    type: 'not_run',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed: Nodos bare-metal inaccesibles por red o falta de kubeconfig para comprobar los componentes del clúster.',
    files: {
      'onprem/cilium-values.yaml': `
kubeProxyReplacement: true
`,
      'reports/onprem-cluster-evidence.json': JSON.stringify(
        {
          status: 'FAILED',
          ciliumKubeProxyReplacementActive: false,
          reason: 'Node unreachable: Connection refused on port 6443 or SSH host key mismatch',
        },
        null,
        2,
      ),
    },
  },
];
