import type { FixtureTestCase } from '../../types.js';

export const AWS_FOUNDATION_FIXTURES: readonly FixtureTestCase[] = [
  {
    id: 'FX-AWS-CORRECT-01',
    skill: 'aws-platform-foundation',
    type: 'correct',
    expectedVerdict: 'PASS',
    reason:
      'Topología VPC multi-AZ (3 AZs), subredes aisladas para bases de datos, endpoints PrivateLink y roles federados por OIDC/IRSA sin credenciales estáticas.',
    files: {
      'infra/vpc.tf': `
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "vigilio-core-vpc"
  cidr = "10.0.0.0/16"

  azs              = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets   = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  database_subnets = ["10.0.201.0/24", "10.0.202.0/24", "10.0.203.0/24"]

  enable_nat_gateway     = true
  single_nat_gateway     = false
  one_nat_gateway_per_az = true
  enable_vpn_gateway     = false
}
`,
      'infra/endpoints.tf': `
resource "aws_vpc_endpoint" "s3" {
  vpc_id       = module.vpc.vpc_id
  service_name = "com.amazonaws.us-east-1.s3"
}
`,
      'reports/aws-foundation-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          vpcSubnetsMultiAz: true,
          azCount: 3,
          privateEndpointsConfigured: true,
          iamStaticKeysDetected: false,
          cloudTrailActive: true,
          databaseSubnetsIsolated: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-AWS-INSECURE-01',
    skill: 'aws-platform-foundation',
    type: 'insecure',
    expectedVerdict: 'FAIL',
    reason:
      'VPC mono-AZ sin alta disponibilidad, RDS PostgreSQL accesible públicamente en subred pública con 0.0.0.0/0 y usuario IAM con clave estática.',
    files: {
      'infra/vpc.tf': `
resource "aws_vpc" "single_az" {
  cidr_block = "10.0.0.0/16"
}

resource "aws_subnet" "public_only" {
  vpc_id            = aws_vpc.single_az.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
}
`,
      'infra/rds.tf': `
resource "aws_db_instance" "insecure_rds" {
  allocated_storage   = 20
  engine              = "postgres"
  instance_class      = "db.t3.micro"
  publicly_accessible = true
}

resource "aws_security_group_rule" "ingress_all" {
  type        = "ingress"
  from_port   = 5432
  to_port     = 5432
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]
}
`,
      'infra/iam.tf': `
resource "aws_iam_access_key" "static_admin" {
  user = "admin-static-user"
}
`,
      'reports/aws-foundation-evidence.json': JSON.stringify(
        {
          status: 'VERIFIED',
          vpcSubnetsMultiAz: false,
          azCount: 1,
          publiclyAccessibleDatabaseDetected: true,
          iamStaticKeysDetected: true,
          securityGroupOpenIngress: true,
        },
        null,
        2,
      ),
    },
  },
  {
    id: 'FX-AWS-NOTRUN-01',
    skill: 'aws-platform-foundation',
    type: 'not_run',
    expectedVerdict: 'NOT_RUN',
    reason:
      'Fail-closed: Credenciales de AWS no disponibles o sesión IAM expirada al auditar la topología de la cuenta.',
    files: {
      'infra/vpc.tf': `
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
}
`,
      'reports/aws-foundation-evidence.json': JSON.stringify(
        {
          status: 'FAILED',
          vpcSubnetsMultiAz: false,
          reason:
            'NoCredentialProviders: no valid AWS credentials found in environment or STS assume role failed',
        },
        null,
        2,
      ),
    },
  },
];
