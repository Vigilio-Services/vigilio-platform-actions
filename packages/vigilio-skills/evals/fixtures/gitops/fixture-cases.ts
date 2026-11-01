import type { FixtureTestCase } from '../../types.js';

export const GITOPS_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-GTO-CORRECT-01',
    skill: 'kubernetes-gitops-delivery',
    type: 'correct',
    expectedVerdict: 'PASS',
    reason:
      'ArgoCD declarativo con self-heal y prune activados, Sync Waves ordenadas (1-4), Canary Rollout con análisis métrico, y preflight verificado.',
    files: {
      'gitops/applications/payment-app.yaml': `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payment-service-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/Vigilio-Services/platform-gitops.git'
    targetRevision: main
    path: environments/production/payment
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
      - ApplyOutOfSyncOnly=true
`,
      'gitops/canary/payment-rollout.yaml': `
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service-rollout
  namespace: production
spec:
  replicas: 10
  strategy:
    canary:
      analysis:
        templates:
          - templateName: success-rate-analysis
        args:
          - name: service-name
            value: payment-service
      steps:
        - setWeight: 10
        - pause: { duration: 60s }
        - setWeight: 25
        - pause: { duration: 120s }
        - setWeight: 50
        - pause: { duration: 180s }
        - setWeight: 100
`,
      'gitops/base/sync-waves.yaml': `
apiVersion: v1
kind: Secret
metadata:
  name: payment-sealed-secret
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "1"
---
apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: payment-db
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "2"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-api
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "3"
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: payment-ingress
  namespace: production
  annotations:
    argocd.argoproj.io/sync-wave: "4"
`,
      'reports/gitops-sync-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          argocdApiHealthy: true,
          targetClusterReachable: true,
          gitSourceSynced: true,
          driftDetected: false,
          activeSyncWaves: 4,
          controllerVersion: 'v2.10.4',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-GTO-INSECURE-01',
    skill: 'kubernetes-gitops-delivery',
    type: 'insecure',
    expectedVerdict: 'FAIL',
    reason:
      'ArgoCD con selfHeal: false y prune: false ignorando derivas, hotfix manual con kubectl fuera de Git, Rollout sin análisis de métricas.',
    files: {
      'gitops/applications/payment-app.yaml': `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payment-service-prod
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/Vigilio-Services/platform-gitops.git'
    targetRevision: main
    path: environments/production/payment
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: production
  syncPolicy:
    automated:
      prune: false
      selfHeal: false
`,
      'gitops/canary/payment-rollout.yaml': `
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: payment-service-rollout
  namespace: production
spec:
  replicas: 10
  strategy:
    canary:
      steps:
        - setWeight: 100
`,
      'gitops/base/manual-hotfix.sh': `
#!/bin/bash
# Insecure manual hotfix directly patching production cluster outside GitOps
kubectl edit deployment payment-api -n production
kubectl apply -f manual-patch.yaml --force
`,
      'reports/gitops-sync-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          argocdApiHealthy: true,
          targetClusterReachable: true,
          gitSourceSynced: false,
          driftDetected: true,
          manualInterventionDetected: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-GTO-NOTRUN-01',
    skill: 'kubernetes-gitops-delivery',
    type: 'not_run',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed: API de ArgoCD inaccesible o clúster destino no alcanzable, impidiendo verificar la sincronización declarativa.',
    files: {
      'gitops/applications/payment-app.yaml': `
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: payment-service-prod
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
`,
      'reports/gitops-sync-evidence.json': JSON.stringify(
        {
          status: 'FAILED',
          argocdApiHealthy: false,
          targetClusterReachable: false,
          gitSourceSynced: false,
          reason: 'ArgoCD controller timeout: unable to connect to kubernetes target cluster',
        },
        null,
        2,
      ),
    },
  },
];
