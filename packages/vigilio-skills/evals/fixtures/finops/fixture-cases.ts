import type { FixtureTestCase } from '../../types.js';

export const FINOPS_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-FIN-CORRECT-01',
    skill: 'platform-finops',
    domain: 'finops',
    type: 'correct',
    description:
      'Gobernanza FinOps con etiquetas obligatorias de atribución, Karpenter NodePool ARM64 Graviton con consolidación y OpenCost',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato FinOps: etiquetas de imputación (Owner, Environment, CostCenter, Project), nodos Karpenter ARM64/Spot con consolidación continua, y auditoría OpenCost validada.',
    files: {
      'k8s/karpenter-nodepool.yaml': `apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: general-compute-arm64
spec:
  template:
    metadata:
      labels:
        CostCenter: CC-ENG-104
        Owner: platform-team
        Environment: production
        Project: payment-core
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
        - key: karpenter.k8s.aws/instance-family
          operator: In
          values: ["c7g", "m7g", "r7g"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["spot", "on-demand"]
      nodeClassRef:
        name: default-ec2nodeclass
  disruption:
    consolidationPolicy: WhenUnderutilized
    consolidateAfter: 30s
`,
      'infra/cost-allocation-tags.tf': `resource "aws_resourcegroups_group" "payment" {
  name = "payment-production-group"
  tags = {
    Owner       = "platform-team"
    Environment = "production"
    CostCenter  = "CC-ENG-104"
    Project     = "payment-core"
  }
}
`,
      'reports/finops-audit-evidence.json': JSON.stringify(
        {
          cost_allocation_tags_verified: true,
          arm64_ratio_percentage: 85,
          spot_coverage_percentage: 60,
          opencost_active: true,
          consolidation_enabled: true,
          preflight_passed: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-FIN-INSECURE-01',
    skill: 'platform-finops',
    domain: 'finops',
    type: 'insecure',
    description:
      'Violación FinOps con omisión de etiquetas contables, cómputo x86 On-Demand costoso y consolidación de nodos desactivada',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato FinOps: recursos sin etiquetas de atribución obligatorias (CostCenter, Owner), ausencia de instancias ARM64/Spot para workers asíncronos y consolidación desactivada en Karpenter.',
    files: {
      'k8s/karpenter-nodepool.yaml': `apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: legacy-compute
spec:
  template:
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["amd64"]
        - key: karpenter.sh/capacity-type
          operator: In
          values: ["on-demand"]
  disruption:
    consolidationPolicy: Never
`,
      'reports/finops-audit-evidence.json': JSON.stringify(
        {
          cost_allocation_tags_verified: false,
          arm64_ratio_percentage: 0,
          spot_coverage_percentage: 0,
          opencost_active: false,
          consolidation_enabled: false,
          preflight_passed: true,
          violations: [
            'Missing required tags: CostCenter, Owner, Project',
            'ConsolidationPolicy set to Never causing idle EC2 waste',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-FIN-NOTRUN-01',
    skill: 'platform-finops',
    domain: 'finops',
    type: 'not_run',
    description:
      'Entorno sin acceso a telemetría de costos OpenCost ni credenciales de AWS Cost Explorer; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede auditar la gobernanza FinOps: el exportador de métricas de OpenCost no responde y el preflight de costos falló.',
    files: {
      'k8s/karpenter-nodepool.yaml': `apiVersion: karpenter.sh/v1beta1
kind: NodePool
metadata:
  name: general-compute-arm64
spec:
  template:
    spec:
      requirements:
        - key: kubernetes.io/arch
          operator: In
          values: ["arm64"]
`,
      'reports/finops-audit-evidence.json': JSON.stringify(
        {
          cost_allocation_tags_verified: false,
          arm64_ratio_percentage: 0,
          spot_coverage_percentage: 0,
          opencost_active: false,
          preflight_passed: false,
          error: 'OpenCost metrics endpoint unreachable (503 Service Unavailable)',
        },
        null,
        2,
      ),
    },
  },
];
