import type { FixtureTestCase } from '../../types.js';

export const runtimeSecurityFixtures: readonly FixtureTestCase[] = [
  {
    id: 'FX-SEC-CORRECT-01',
    skill: 'kubernetes-policy-runtime-security',
    domain: 'runtime-security',
    type: 'correct',
    description:
      'Políticas de runtime completas: Tetragon TracingPolicy acotada por workload, Cilium default-deny con egress explícito, Kyverno Enforce con PSS restricted y Break-Glass auditado con TTL',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de runtime security: TracingPolicy delimitada por pod/namespace, Cilium egress explícito por FQDN, Kyverno failurePolicy Fail, PSS restricted, break-glass temporal con TTL y auditoría, y preflight eBPF/BTF verificado.',
    files: {
      'k8s/tetragon-tracing-policy.yaml': `apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: monitor-execve-payment
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: payment-service
  trace:
    - hook: sys_enter
      syscall: execve
      args:
        - index: 0
          type: string
      action: Sigkill
      rateLimit: 100/second
`,
      'k8s/cilium-network-policy.yaml': `apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: payment-strict-egress
  namespace: production
spec:
  endpointSelector:
    matchLabels:
      app: payment-service
  ingress:
    - fromEndpoints:
        - matchLabels:
            app: api-gateway
  egress:
    - toFQDNs:
        - matchName: api.internal.vigilio.com
      toPorts:
        - ports:
            - port: "443"
              protocol: TCP
`,
      'k8s/kyverno-restricted-policy.yaml': `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: enforce-pod-security-restricted
spec:
  validationFailureAction: Enforce
  failurePolicy: Fail
  rules:
    - name: require-non-privileged
      match:
        any:
          - resources:
              kinds:
                - Pod
      validate:
        pattern:
          spec:
            containers:
              - securityContext:
                  allowPrivilegeEscalation: false
                  privileged: false
                  readOnlyRootFilesystem: true
                  runAsNonRoot: true
                  capabilities:
                    drop:
                      - ALL
`,
      'reports/break-glass-evidence.json': JSON.stringify(
        {
          timestamp: '2026-11-01T04:00:00Z',
          breakGlassActive: false,
          procedure: {
            ticketId: 'SEC-EMERGENCY-20261101-09',
            owner: 'sre-oncall@vigilio.com',
            reason: 'Mantenimiento crítico de emergencia en kernel de nodo worker',
            ttlMinutes: 120,
            expiryTimestamp: '2026-11-01T15:15:00Z',
            auditLogSink: 'arn:aws:s3:::vigilio-audit-logs/security/break-glass',
            autoRevokeConfigured: true,
          },
          preflightChecks: {
            kernelVersion: '6.8.0-45-generic',
            btfEnabled: true,
            ebpfSupported: true,
            tetragonVersion: '1.2.0',
            ciliumVersion: '1.16.2',
            kyvernoAdmissionWebhookHealthy: true,
            enforcementDemonstrated: true,
            falsePositiveRate: 0.0,
          },
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-SEC-INSECURE-01',
    skill: 'kubernetes-policy-runtime-security',
    domain: 'runtime-security',
    type: 'insecure',
    description:
      'Inseguro: TracingPolicy con SIGKILL global sin selector de namespace, Pods privilegiados con CAP_SYS_ADMIN, Kyverno con failurePolicy Ignore, egress 0.0.0.0/0 no restringido y Break-Glass permanente sin expiración',
    expectedVerdict: 'FAIL',
    reason:
      'Violaciones críticas de seguridad: SIGKILL global sin selector de namespace, pod con privileged: true y CAP_SYS_ADMIN, Kyverno con failurePolicy: Ignore, egress 0.0.0.0/0 sin puertos y break-glass sin TTL o propietario.',
    files: {
      'k8s/tetragon-insecure-global.yaml': `apiVersion: cilium.io/v1alpha1
kind: TracingPolicy
metadata:
  name: global-sigkill-all
spec:
  trace:
    - hook: sys_enter
      syscall: execve
      action: Sigkill
`,
      'k8s/insecure-workload.yaml': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: privileged-api
spec:
  template:
    spec:
      hostNetwork: true
      containers:
        - name: app
          image: myrepo/app:1.0.0
          securityContext:
            privileged: true
            allowPrivilegeEscalation: true
            capabilities:
              add:
                - CAP_SYS_ADMIN
`,
      'k8s/kyverno-insecure.yaml': `apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: loose-kyverno-policy
spec:
  validationFailureAction: Audit
  failurePolicy: Ignore
  rules:
    - name: ignore-all
      match:
        any:
          - resources:
              kinds:
                - Pod
`,
      'k8s/cilium-open-egress.yaml': `apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: wide-open-egress
spec:
  endpointSelector:
    matchLabels:
      app: backend
  egress:
    - toCIDR:
        - 0.0.0.0/0
`,
      'reports/break-glass-evidence.json': JSON.stringify(
        {
          breakGlassActive: true,
          procedure: {
            ticketId: '',
            owner: '',
            reason: 'excepcion permanente sin revision',
            ttlMinutes: null,
            expiryTimestamp: null,
            autoRevokeConfigured: false,
          },
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-SEC-NOTRUN-01',
    skill: 'kubernetes-policy-runtime-security',
    domain: 'runtime-security',
    type: 'not_run',
    description:
      'Fail-closed preflight: Kernel sin soporte BTF/eBPF, versiones de Tetragon/Cilium ausentes o webhook de admisión Kyverno no disponible',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed por falta de soporte eBPF/BTF en kernel, webhook de Kyverno inaccesible o falta de demostración de enforcement en runtime.',
    files: {
      'reports/break-glass-evidence.json': JSON.stringify(
        {
          timestamp: '2026-11-01T04:00:00Z',
          breakGlassActive: false,
          preflightChecks: {
            kernelVersion: '4.18.0-legacy',
            btfEnabled: false,
            ebpfSupported: false,
            tetragonVersion: null,
            ciliumVersion: null,
            kyvernoAdmissionWebhookHealthy: false,
            enforcementDemonstrated: false,
            falsePositiveRate: 0.15,
          },
        },
        null,
        2,
      ),
    },
  },
];
