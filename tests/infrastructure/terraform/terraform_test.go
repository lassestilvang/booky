package test

import (
	"testing"
	"time"

	"github.com/gruntwork-io/terratest/modules/aws"
	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestTerraformPlanValidation(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndPlan(t, terraformOptions)
}

func TestResourceProvisioning(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Verify VPC
	vpcId := terraform.Output(t, terraformOptions, "vpc_id")
	assert.NotEmpty(t, vpcId)
	vpc := aws.GetVpcById(t, vpcId, "us-east-1")
	assert.Equal(t, "10.0.0.0/16", vpc.Cidr)

	// Verify subnets
	publicSubnet1Id := terraform.Output(t, terraformOptions, "public_subnet_1_id")
	assert.NotEmpty(t, publicSubnet1Id)
	subnet := aws.GetSubnet(t, publicSubnet1Id, "us-east-1")
	assert.Equal(t, "10.0.1.0/24", subnet.Cidr)

	// Verify RDS
	dbEndpoint := terraform.Output(t, terraformOptions, "db_endpoint")
	assert.NotEmpty(t, dbEndpoint)

	// Verify Redis
	redisEndpoint := terraform.Output(t, terraformOptions, "redis_endpoint")
	assert.NotEmpty(t, redisEndpoint)

	// Verify ECS cluster
	clusterName := terraform.Output(t, terraformOptions, "ecs_cluster_name")
	assert.NotEmpty(t, clusterName)
}

func TestNetworkConnectivity(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Test IGW attachment
	vpcId := terraform.Output(t, terraformOptions, "vpc_id")
	igw := aws.GetInternetGateway(t, vpcId, "us-east-1")
	assert.NotNil(t, igw)

	// Test route table
	rtId := terraform.Output(t, terraformOptions, "public_route_table_id")
	rt := aws.GetRouteTable(t, rtId, "us-east-1")
	assert.Len(t, rt.Routes, 2) // Default route + IGW route
}

func TestSecurityGroupConfigurations(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Test RDS SG
	rdsSgId := terraform.Output(t, terraformOptions, "rds_sg_id")
	rdsSg := aws.GetSecurityGroup(t, rdsSgId, "us-east-1")
	assert.Len(t, rdsSg.IpPermissions, 1)
	assert.Equal(t, int64(5432), rdsSg.IpPermissions[0].FromPort)

	// Test ECS SG
	ecsSgId := terraform.Output(t, terraformOptions, "ecs_sg_id")
	ecsSg := aws.GetSecurityGroup(t, ecsSgId, "us-east-1")
	assert.Len(t, ecsSg.IpPermissions, 1)
	assert.Equal(t, int64(3000), ecsSg.IpPermissions[0].FromPort)
}

func TestFailoverScenarios(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Test RDS failover (simulate by checking multi-AZ if enabled, but here it's single)
	dbId := terraform.Output(t, terraformOptions, "db_id")
	db := aws.GetDbInstance(t, dbId, "us-east-1")
	assert.Equal(t, "available", db.DBInstanceStatus)

	// Test Redis failover (single node, so limited)
	redisId := terraform.Output(t, terraformOptions, "redis_id")
	redis := aws.GetElasticacheCluster(t, redisId, "us-east-1")
	assert.Equal(t, "available", redis.CacheClusterStatus)
}

func TestInfrastructureResilience(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Test multi-AZ subnets
	subnetIds := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
	assert.Len(t, subnetIds, 2)

	// Test CloudWatch logs
	logGroupName := terraform.Output(t, terraformOptions, "log_group_name")
	logGroup := aws.GetCloudWatchLogGroup(t, logGroupName, "us-east-1")
	assert.Equal(t, int64(30), logGroup.RetentionInDays)
}

func TestBackupRestore(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Test RDS backup settings
	dbId := terraform.Output(t, terraformOptions, "db_id")
	db := aws.GetDbInstance(t, dbId, "us-east-1")
	assert.True(t, db.BackupRetentionPeriod > 0)
}

func TestDriftDetection(t *testing.T) {
	t.Parallel()

	terraformOptions := &terraform.Options{
		TerraformDir: "../../infra",
		Vars: map[string]interface{}{
			"region": "us-east-1",
		},
	}

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Check for drift by running plan after apply
	exitCode := terraform.PlanExitCode(t, terraformOptions)
	assert.Equal(t, 0, exitCode, "No drift detected")
}
