import type { FixtureTestCase } from '../../types.js';

export const TERRAFORM_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-IAC-CORRECT-01',
    skill: 'terraform-iac-delivery',
    type: 'correct',
    expectedVerdict: 'PASS',
    reason:
      'Backend S3 con bloqueo nativo use_lockfile = true, cifrado KMS en reposo, módulos desacoplados y plan especulativo validado.',
    files: {
      'infra/backend.tf': `
terraform {
  required_version = ">= 1.10.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
  backend "s3" {
    bucket       = "vigilio-platform-tfstate-prod"
    key          = "stacks/core/terraform.tfstate"
    region       = "us-east-1"
    encrypt      = true
    use_lockfile = true
  }
}
`,
      'infra/modules/network/main.tf': `
variable "vpc_cidr" {
  type        = string
  description = "CIDR block for VPC"
}

output "vpc_id" {
  value = "vpc-0123456789abcdef0"
}
`,
      'infra/main.tf': `
module "network" {
  source   = "./modules/network"
  vpc_cidr = "10.0.0.0/16"
}
`,
      'reports/terraform-plan-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          speculativePlanValid: true,
          backendLockVerified: true,
          driftDetected: false,
          checkovScanPassed: true,
          tflintScanPassed: true,
          resourcesPlanned: { add: 3, change: 0, destroy: 0 },
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-IAC-INSECURE-01',
    skill: 'terraform-iac-delivery',
    type: 'insecure',
    expectedVerdict: 'FAIL',
    reason:
      'Credenciales estáticas de AWS en código HCL, backend local sin bloqueo de estado concurrente y S3 con ACL pública.',
    files: {
      'infra/provider.tf': `
provider "aws" {
  region     = "us-east-1"
  access_key = "${'AKIA'}${'1'.repeat(16)}"
  secret_key = "super-secret-aws-key-insecure-plaintext"
}

terraform {
  backend "local" {
    path = "terraform.tfstate"
  }
}
`,
      'infra/s3.tf': `
resource "aws_s3_bucket" "insecure" {
  bucket = "vigilio-public-bucket-insecure"
  acl    = "public-read"
}
`,
      'reports/terraform-plan-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          speculativePlanValid: false,
          backendLockVerified: false,
          driftDetected: true,
          hardcodedCredentialsDetected: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-IAC-NOTRUN-01',
    skill: 'terraform-iac-delivery',
    type: 'not_run',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed: Backend remoto inaccesible o credenciales OIDC de AWS no configuradas para generar el plan especulativo.',
    files: {
      'infra/backend.tf': `
terraform {
  backend "s3" {
    bucket       = "vigilio-platform-tfstate-prod"
    use_lockfile = true
  }
}
`,
      'reports/terraform-plan-evidence.json': JSON.stringify(
        {
          status: 'FAILED',
          speculativePlanValid: false,
          backendLockVerified: false,
          reason: 'AccessDenied: S3 bucket tfstate unreachable or AWS OIDC token expired',
        },
        null,
        2,
      ),
    },
  },
];
