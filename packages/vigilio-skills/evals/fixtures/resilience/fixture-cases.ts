import type { FixtureTestCase } from '../../types.js';

export const RESILIENCE_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-RES-CORRECT-01',
    skill: 'platform-resilience-disaster-recovery',
    domain: 'resilience',
    type: 'correct',
    description:
      'Plan integral de contingencia y DR con Velero Schedule diario, snapshots CSI, inyección Chaos Mesh y GameDay verificado',
    expectedVerdict: 'PASS',
    reason:
      'Cumple el contrato de resiliencia y DR: backup automático diario con Velero (manifiestos + volúmenes CSI), RPO < 15 min y RTO < 1h verificados en GameDay, y preflight aprobado.',
    files: {
      'k8s/velero-schedule.yaml': `apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-production-dr-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
  template:
    includedNamespaces:
      - production
      - payment
    snapshotVolumes: true
    storageLocation: s3-cross-region-dr-backup
    volumeSnapshotLocations:
      - ebs-cross-region-snapshot
    ttl: 720h0m0s
`,
      'k8s/chaos-network.yaml': `apiVersion: chaos-mesh.org/v1alpha1
kind: NetworkChaos
metadata:
  name: payment-network-delay
  namespace: chaos-testing
spec:
  action: delay
  mode: all
  selector:
    namespaces:
      - staging
    labelSelectors:
      app.kubernetes.io/name: payment-processor
  delay:
    latency: "100ms"
    jitter: "20ms"
  duration: "5m"
`,
      'reports/dr-gameday-evidence.json': JSON.stringify(
        {
          rpo_minutes: 12,
          rto_minutes: 42,
          rpo_target_minutes: 15,
          rto_target_minutes: 60,
          gameday_test_passed: true,
          restore_verification_status: 'VERIFIED',
          backup_storage_isolated: true,
          preflight_passed: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-RES-INSECURE-01',
    skill: 'platform-resilience-disaster-recovery',
    domain: 'resilience',
    type: 'insecure',
    description:
      'Violación de DR con respaldos locales no replicados, omisión de snapshots de volúmenes y restauración jamás probada',
    expectedVerdict: 'FAIL',
    reason:
      'Viola el contrato de DR: almacenamiento de backup no aislado en región secundaria, snapshotVolumes desactivado omitiendo datos transaccionales y restauración no verificada que excede el SLA de RTO.',
    files: {
      'k8s/velero-schedule.yaml': `apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: unsafe-backup
  namespace: velero
spec:
  schedule: "0 0 * * *"
  template:
    includedNamespaces:
      - default
    snapshotVolumes: false
    storageLocation: default
`,
      'reports/dr-gameday-evidence.json': JSON.stringify(
        {
          rpo_minutes: 360,
          rto_minutes: 240,
          rpo_target_minutes: 15,
          rto_target_minutes: 60,
          gameday_test_passed: false,
          restore_verification_status: 'UNTESTED',
          backup_storage_isolated: false,
          preflight_passed: true,
          violations: [
            'Backup storage points to primary region without replication',
            'Volume snapshots disabled: stateful data lost on disaster',
            'Restore procedure untested; RTO of 4h violates 1h SLA',
          ],
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-RES-NOTRUN-01',
    skill: 'platform-resilience-disaster-recovery',
    domain: 'resilience',
    type: 'not_run',
    description:
      'Entorno sin acceso a backend de backup Velero ni evidencia de simulación GameDay; emite NOT_RUN fail-closed',
    expectedVerdict: 'NOT_RUN',
    reason:
      'No se puede certificar la resiliencia ante desastres: el operador Velero o el almacenamiento de contingencia son inaccesibles y la evidencia de preflight reporta fallo.',
    files: {
      'k8s/velero-schedule.yaml': `apiVersion: velero.io/v1
kind: Schedule
metadata:
  name: daily-dr-backup
  namespace: velero
spec:
  schedule: "0 2 * * *"
`,
      'reports/dr-gameday-evidence.json': JSON.stringify(
        {
          preflight_passed: false,
          restore_verification_status: 'UNKNOWN',
          error: 'Velero server pods not running / S3 backup location unavailable',
        },
        null,
        2,
      ),
    },
  },
];
