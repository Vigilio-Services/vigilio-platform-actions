import type { FixtureTestCase } from '../../types.js';

export const dataReliabilityFixtureCases: readonly FixtureTestCase[] = [
  {
    id: 'FX-BKP-CORRECT-01',
    skill: 'platform-data-reliability',
    domain: 'backup-pitr',
    type: 'correct',
    description:
      'CloudNativePG Cluster con barmanObjectStore S3, KMS encryption, reclaimPolicy: Retain e IRSA',
    files: {
      'k8s/postgres-cluster.yaml': `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-prod
  namespace: production
spec:
  instances: 3
  storage:
    size: 100Gi
    storageClass: ebs-gp3-sc
  backup:
    barmanObjectStore:
      destinationPath: s3://vigilio-production-backups/postgres-wal/
      s3Credentials:
        inheritFromIAMRole: true
      serverName: postgres-prod
      wal:
        compression: gzip
        encryption: aws:kms
  serviceAccountTemplate:
    metadata:
      annotations:
        eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/cnpg-s3-backup-role
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: ebs-gp3-sc
provisioner: ebs.csi.aws.com
reclaimPolicy: Retain
allowVolumeExpansion: true
parameters:
  encrypted: "true"
`,
      'reports/pitr-drill-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          drillTimestamp: '2026-10-30T14:00:00Z',
          targetTime: '2026-10-30T13:30:00Z',
          restoredRows: 154200,
          measuredRTOSeconds: 480,
          measuredRPOSeconds: 45,
          integrityChecksumVerified: true,
        },
        null,
        2,
      ),
    },
    expectedVerdict: 'PASS',
    reason:
      'Manifiesto y drill válidos con retención de volumen, cifrado KMS, archivado WAL continuo y credenciales IRSA.',
  },
  {
    id: 'FX-BKP-INSECURE-01',
    skill: 'platform-data-reliability',
    domain: 'backup-pitr',
    type: 'insecure',
    description:
      'Manifiesto inseguro con reclaimPolicy: Delete, AWS secrets en texto plano y sin archivado continuo de WAL',
    files: {
      'k8s/postgres-insecure.yaml': `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-insecure
spec:
  instances: 1
  storage:
    size: 10Gi
    storageClass: standard
  env:
    - name: AWS_ACCESS_KEY_ID
      value: AKIAIOSFODNN7EXAMPLE
    - name: AWS_SECRET_ACCESS_KEY
      value: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
---
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: standard
reclaimPolicy: Delete
`,
      'reports/pitr-drill-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          drillTimestamp: '2026-10-30T14:00:00Z',
        },
        null,
        2,
      ),
    },
    expectedVerdict: 'FAIL',
    reason:
      'Violaciones críticas de seguridad detectadas: reclaimPolicy: Delete, AWS secrets en texto plano y ausencia de barmanObjectStore.',
  },
  {
    id: 'FX-BKP-NOTRUN-01',
    skill: 'platform-data-reliability',
    domain: 'backup-pitr',
    type: 'not_run',
    description:
      'Preflight fail-closed cuando el bucket S3 o las credenciales de backup no están disponibles',
    files: {
      'k8s/postgres-cluster.yaml': `apiVersion: postgresql.cnpg.io/v1
kind: Cluster
metadata:
  name: postgres-prod
spec:
  backup:
    barmanObjectStore:
      destinationPath: s3://vigilio-production-backups/postgres-wal/
`,
      'reports/preflight-checks.json': JSON.stringify(
        {
          s3Connectivity: 'UNREACHABLE',
          credentialsValid: false,
          error:
            'AccessDenied: Bucket s3://vigilio-production-backups cannot be accessed from local environment',
        },
        null,
        2,
      ),
    },
    expectedVerdict: 'NOT_RUN',
    reason:
      'Preflight bloqueante: destino de backup S3 inaccesible o credenciales no verificadas; fail-closed obligatorio.',
  },
];
