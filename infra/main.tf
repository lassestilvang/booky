terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# VPC
resource "aws_vpc" "booky_vpc" {
  cidr_block = "10.0.0.0/16"
  tags = {
    Name = "booky-vpc"
  }
}

# Subnets
resource "aws_subnet" "public_subnet_1" {
  vpc_id            = aws_vpc.booky_vpc.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "booky-public-subnet-1"
  }
}

resource "aws_subnet" "public_subnet_2" {
  vpc_id            = aws_vpc.booky_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "booky-public-subnet-2"
  }
}

resource "aws_subnet" "private_subnet_1" {
  vpc_id            = aws_vpc.booky_vpc.id
  cidr_block        = "10.0.3.0/24"
  availability_zone = "us-east-1a"
  tags = {
    Name = "booky-private-subnet-1"
  }
}

resource "aws_subnet" "private_subnet_2" {
  vpc_id            = aws_vpc.booky_vpc.id
  cidr_block        = "10.0.4.0/24"
  availability_zone = "us-east-1b"
  tags = {
    Name = "booky-private-subnet-2"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "booky_igw" {
  vpc_id = aws_vpc.booky_vpc.id
  tags = {
    Name = "booky-igw"
  }
}

# Route Table
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.booky_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.booky_igw.id
  }

  tags = {
    Name = "booky-public-rt"
  }
}

resource "aws_route_table_association" "public_rta_1" {
  subnet_id      = aws_subnet.public_subnet_1.id
  route_table_id = aws_route_table.public_rt.id
}

resource "aws_route_table_association" "public_rta_2" {
  subnet_id      = aws_subnet.public_subnet_2.id
  route_table_id = aws_route_table.public_rt.id
}

# Security Groups
resource "aws_security_group" "rds_sg" {
  name   = "booky-rds-sg"
  vpc_id = aws_vpc.booky_vpc.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "booky-rds-sg"
  }
}

resource "aws_security_group" "redis_sg" {
  name   = "booky-redis-sg"
  vpc_id = aws_vpc.booky_vpc.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "booky-redis-sg"
  }
}

resource "aws_security_group" "ecs_sg" {
  name   = "booky-ecs-sg"
  vpc_id = aws_vpc.booky_vpc.id

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "booky-ecs-sg"
  }
}

# RDS PostgreSQL
resource "aws_db_subnet_group" "booky_db_subnet_group" {
  name       = "booky-db-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]

  tags = {
    Name = "booky-db-subnet-group"
  }
}

resource "aws_db_instance" "booky_db" {
  identifier             = "booky-db"
  engine                 = "postgres"
  engine_version         = "15.0"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = "booky"
  username               = "booky_user"
  password               = "booky_password"  # Use AWS Secrets Manager in production
  db_subnet_group_name   = aws_db_subnet_group.booky_db_subnet_group.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true

  tags = {
    Name = "booky-db"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "booky_redis_subnet_group" {
  name       = "booky-redis-subnet-group"
  subnet_ids = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

resource "aws_elasticache_cluster" "booky_redis" {
  cluster_id           = "booky-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.booky_redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  tags = {
    Name = "booky-redis"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "booky_cluster" {
  name = "booky-cluster"
}

# IAM Role for ECS Task Execution
resource "aws_iam_role" "ecs_task_execution_role" {
  name = "booky-ecs-task-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_role_policy" {
  role       = aws_iam_role.ecs_task_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# ECS Task Definition
resource "aws_ecs_task_definition" "booky_task" {
  family                   = "booky-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution_role.arn

  container_definitions = jsonencode([
    {
      name  = "booky-backend"
      image = "your-ecr-repo/booky-backend:latest"  # Replace with actual ECR repo
      portMappings = [
        {
          containerPort = 3000
          hostPort      = 3000
        }
      ]
      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgresql://${aws_db_instance.booky_db.username}:${aws_db_instance.booky_db.password}@${aws_db_instance.booky_db.endpoint}/${aws_db_instance.booky_db.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_cluster.booky_redis.cache_nodes[0].address}:${aws_elasticache_cluster.booky_redis.cache_nodes[0].port}"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/booky-backend"
          "awslogs-region"        = "us-east-1"
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "booky_log_group" {
  name              = "/ecs/booky-backend"
  retention_in_days = 30
}

# ECS Service
resource "aws_ecs_service" "booky_service" {
  name            = "booky-service"
  cluster         = aws_ecs_cluster.booky_cluster.id
  task_definition = aws_ecs_task_definition.booky_task.arn
  desired_count   = 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = [aws_subnet.public_subnet_1.id, aws_subnet.public_subnet_2.id]
    security_groups  = [aws_security_group.ecs_sg.id]
    assign_public_ip = true
  }

  depends_on = [aws_iam_role_policy_attachment.ecs_task_execution_role_policy]
}

# Outputs for testing
output "vpc_id" {
  value = aws_vpc.booky_vpc.id
}

output "public_subnet_1_id" {
  value = aws_subnet.public_subnet_1.id
}

output "private_subnet_ids" {
  value = [aws_subnet.private_subnet_1.id, aws_subnet.private_subnet_2.id]
}

output "db_endpoint" {
  value = aws_db_instance.booky_db.endpoint
}

output "db_id" {
  value = aws_db_instance.booky_db.id
}

output "redis_endpoint" {
  value = aws_elasticache_cluster.booky_redis.cache_nodes[0].address
}

output "redis_id" {
  value = aws_elasticache_cluster.booky_redis.id
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.booky_cluster.name
}

output "public_route_table_id" {
  value = aws_route_table.public_rt.id
}

output "rds_sg_id" {
  value = aws_security_group.rds_sg.id
}

output "ecs_sg_id" {
  value = aws_security_group.ecs_sg.id
}

output "log_group_name" {
  value = aws_cloudwatch_log_group.booky_log_group.name
}
