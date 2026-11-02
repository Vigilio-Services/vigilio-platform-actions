import type { FixtureTestCase } from '../../types.js';

export const COMPOSE_VPS_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'VPS-FIX-01-CORRECT',
    skill: 'platform-compose-vps-delivery',
    domain: 'compose-vps',
    type: 'correct',
    description:
      'Compose único endurecido con digest inmutable, Caddy TLS, redes aisladas y pgBackRest PITR verificado',
    files: {
      'reports/compose-vps-preflight.json': JSON.stringify({
        status: 'VERIFIED',
        composeConfigValid: true,
        cosignSignatureVerified: true,
        pitrDrillVerified: true,
      }),
      'compose/compose.yaml': `x-backend: &backend
  image: ghcr.io/org/billing-impl@sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
  user: "65532:65532"
  read_only: true
  cap_drop:
    - ALL
  security_opt:
    - no-new-privileges:true
  tmpfs:
    - /tmp:size=64m,noexec,nosuid,nodev
  networks:
    - backend

services:
  caddy:
    image: docker.io/library/caddy@sha256:1b40d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00b11
    cap_drop: [ALL]
    cap_add: [NET_BIND_SERVICE]
    ports:
      - "80:80"
      - "443:443"
    networks: [edge, backend]
  api:
    <<: *backend
    command: ["node", "dist/main.js"]
  migration:
    <<: *backend
    profiles: ["tools"]
    command: ["node", "dist/migrate.js"]
  postgres:
    image: docker.io/library/postgres@sha256:2c50d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00c22
    networks: [backend]

networks:
  edge: {}
  backend:
    internal: true
  observability:
    internal: true
`,
      'caddy/Caddyfile': `app.example.com {\n  reverse_proxy api:3000\n}\n`,
    },
    expectedVerdict: 'PASS',
    reason:
      'Único compose.yaml endurecido non-root con digest sha256, redes internas sin puertos de datos expuestos y backup PITR verificado.',
  },
  {
    id: 'VPS-FIX-02-INSECURE',
    skill: 'platform-compose-vps-delivery',
    domain: 'compose-vps',
    type: 'insecure',
    description:
      'Tag mutable latest, puerto PostgreSQL expuesto en 0.0.0.0:5432, sin cap_drop ni read_only y carpeta contracts/ global prohibida',
    files: {
      'reports/compose-vps-preflight.json': JSON.stringify({
        status: 'VERIFIED',
        composeConfigValid: true,
        cosignSignatureVerified: true,
        pitrDrillVerified: true,
      }),
      'compose/compose.yaml': `services:
  api:
    image: ghcr.io/org/billing-impl:latest
    privileged: true
  postgres:
    image: postgres:16
    ports:
      - "0.0.0.0:5432:5432"
`,
      'packages/contracts/index.ts': 'export const legacySharedDto = {};\n',
    },
    expectedVerdict: 'FAIL',
    reason:
      'Se detectaron violaciones graves: imagen :latest mutable, puerto 5432 expuesto públicamente, contenedor privilegiado sin endurecimiento y carpeta global contracts/ prohibida.',
  },
  {
    id: 'VPS-FIX-03-NOT-RUN',
    skill: 'platform-compose-vps-delivery',
    domain: 'compose-vps',
    type: 'not_run',
    description: 'Falta evidencia de preflight de Compose, verificación Cosign o simulacro PITR',
    files: {
      'reports/compose-vps-preflight.json': JSON.stringify({
        status: 'UNVERIFIED',
        composeConfigValid: false,
        cosignSignatureVerified: false,
        pitrDrillVerified: false,
      }),
      'compose/compose.yaml': 'services:\n  api:\n    image: ghcr.io/org/api@sha256:abc\n',
    },
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed por falta de verificación de compose config, firma Cosign o restore drill.',
  },
];
