import type { FixtureTestCase } from '../../types.js';

export const SCALABILITY_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-SCL-CORRECT-01',
    skill: 'platform-scalability-capacity',
    domain: 'scalability',
    type: 'correct',
    description:
      'Escalabilidad elástica con requests/limits calibrados, KEDA ScaledObject sobre colas SQS, PDB y TopologySpread multizona',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de capacidad: requests/limits garantizados, KEDA para I/O asíncrono, TopologySpreadConstraints multizona, PDB activo y preflight verificado.',
    files: {
      'k8s/payment-deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
  namespace: payment
  labels:
    app.kubernetes.io/name: payment-processor
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: payment-processor
  template:
    metadata:
      labels:
        app.kubernetes.io/name: payment-processor
    spec:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app.kubernetes.io/name: payment-processor
      containers:
        - name: worker
          image: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/payment:1.4.2
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: 500m
              memory: 512Mi
`,
      'k8s/payment-keda.yaml': `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: payment-sqs-scaler
  namespace: payment
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-processor
  minReplicaCount: 2
  maxReplicaCount: 20
  cooldownPeriod: 300
  triggers:
    - type: aws-sqs-queue
      metadata:
        queueURL: https://sqs.eu-central-1.amazonaws.com/123456789012/payment-jobs
        queueLength: "30"
        awsRegion: eu-central-1
        identityOwner: operator
`,
      'k8s/payment-pdb.yaml': `apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: payment-pdb
  namespace: payment
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: payment-processor
`,
      'reports/capacity-preflight-evidence.json': JSON.stringify(
        {
          cluster_ready: true,
          keda_installed: true,
          karpenter_active: true,
          hpa_metrics_ready: true,
          topology_spread_enforced: true,
          preflight_passed: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-SCL-INSECURE-01',
    skill: 'platform-scalability-capacity',
    domain: 'scalability',
    type: 'insecure',
    description:
      'Configuración insegura con omisión de requests/limits, escalado tardío por CPU en colas y sin PDB de disponibilidad',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de capacidad: carece de requests/limits provocando disputa de CPU, escala workers asíncronos por CPU en vez de profundidad de cola y no define PodDisruptionBudget.',
    files: {
      'k8s/payment-deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
  namespace: payment
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: payment-processor
  template:
    metadata:
      labels:
        app.kubernetes.io/name: payment-processor
    spec:
      containers:
        - name: worker
          image: 123456789012.dkr.ecr.eu-central-1.amazonaws.com/payment:latest
`,
      'k8s/payment-hpa.yaml': `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: payment-hpa
  namespace: payment
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: payment-processor
  minReplicas: 1
  maxReplicas: 100
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 90
`,
      'reports/capacity-preflight-evidence.json': JSON.stringify(
        {
          cluster_ready: true,
          keda_installed: false,
          karpenter_active: false,
          hpa_metrics_ready: true,
          topology_spread_enforced: false,
          preflight_passed: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-SCL-NOTRUN-01',
    skill: 'platform-scalability-capacity',
    domain: 'scalability',
    type: 'not_run',
    description: 'Entorno con servidor de métricas o KEDA inaccesible; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede certificar el escalado elástico: el cluster o el operador KEDA no están accesibles y la evidencia de preflight reporta preflight_passed: false.',
    files: {
      'k8s/payment-deployment.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-processor
  namespace: payment
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: worker
          image: payment:1.0.0
`,
      'reports/capacity-preflight-evidence.json': JSON.stringify(
        {
          cluster_ready: false,
          keda_installed: false,
          karpenter_active: false,
          hpa_metrics_ready: false,
          preflight_passed: false,
          error: 'Connection timeout to Kubernetes API server / KEDA CRDs missing',
        },
        null,
        2,
      ),
    },
  },
];
