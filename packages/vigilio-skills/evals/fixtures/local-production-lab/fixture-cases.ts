import type { FixtureTestCase } from '../../types.js';

export const LOCAL_PRODUCTION_LAB_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-LAB-CORRECT-01',
    skill: 'platform-local-production-lab',
    domain: 'prod-local',
    type: 'correct',
    description:
      'Configuración de cluster Kind local con perfiles estándar, mocks de nube y preflight aprobado',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de laboratorio de producción local: cluster Kind configurado con apiVersion v1alpha4, Tiltfile con mocks de servicios locales, preflight aprobado y ausencia total de credenciales productivas.',
    files: {
      'kind-config.yaml': `kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  kubeadmConfigPatches:
  - |
    kind: InitConfiguration
    nodeRegistration:
      kubeletExtraArgs:
        node-labels: "ingress-ready=true"
  extraPortMappings:
  - containerPort: 80
    hostPort: 8080
    protocol: TCP
  - containerPort: 443
    hostPort: 8443
    protocol: TCP
`,
      Tiltfile: `# Local development Tiltfile with mocks
load('ext://restart_process', 'docker_build_with_restart')

# LocalStack and MinIO mocks for AWS cloud services
docker_compose('docker-compose.local.yaml')

# App deployment to local Kind cluster
k8s_yaml('k8s/local-deployment.yaml')
k8s_resource('order-service', port_forwards=['3000:3000'])
`,
      'docker-compose.local.yaml': `services:
  localstack:
    image: localstack/localstack:3.0.0
    ports:
      - "4566:4566"
    environment:
      - SERVICES=sqs,sns,s3
      - AWS_DEFAULT_REGION=us-east-1
  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.95.0
    ports:
      - "4317:4317"
      - "4318:4318"
`,
      'reports/local-lab-preflight.json': JSON.stringify(
        {
          preflight_passed: true,
          container_daemon_healthy: true,
          kind_available: true,
          offline_cache_ready: true,
          privileged_ebpf_isolated: true,
          prod_credentials_detected: false,
          mock_services_healthy: true,
          verification_status: 'READY',
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-LAB-INSECURE-01',
    skill: 'platform-local-production-lab',
    domain: 'prod-local',
    type: 'insecure',
    description:
      'Laboratorio local inseguro con credenciales productivas en texto plano y preflight fallido',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de prod-local: inyecta credenciales productivas en el archivo de entorno, omite preflight de contenedor y no aísla los puertos locales.',
    files: {
      'kind-config.yaml': `kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
nodes:
- role: control-plane
  extraPortMappings:
  - containerPort: 32000
    hostPort: 32000
`,
      'docker-compose.local.yaml': `services:
  unsafe-worker:
    image: alpine:latest
    environment:
      - AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE_PROD
      - AWS_SECRET_ACCESS_KEY=live-production-secret-token-unmasked
`,
      'reports/local-lab-preflight.json': JSON.stringify(
        {
          preflight_passed: false,
          container_daemon_healthy: true,
          kind_available: true,
          prod_credentials_detected: true,
          verification_status: 'UNVERIFIED',
          violations: [
            'Live production AWS credentials detected in local compose environment',
            'Preflight checks skipped or failed without mock boundary',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-LAB-NOTRUN-01',
    skill: 'platform-local-production-lab',
    domain: 'prod-local',
    type: 'not_run',
    description:
      'Entorno de desarrollo sin daemon de Docker o sin binario Kind; emite veredicto NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede aprovisionar ni validar el laboratorio de desarrollo local: Docker/container runtime no responde o Kind no está instalado en el sistema.',
    files: {
      'reports/local-lab-preflight.json': JSON.stringify(
        {
          preflight_passed: false,
          container_daemon_healthy: false,
          kind_available: false,
          verification_status: 'UNAVAILABLE',
          error: 'Container runtime daemon unavailable / Kind CLI binary not detected in PATH',
        },
        null,
        2,
      ),
    },
  },
];
