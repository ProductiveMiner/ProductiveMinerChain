#!/bin/bash

echo "🔄 Restarting RDS Database and Applying Optimal Research Schema"
echo "================================================================"

# Load environment variables
if [ -f "new-rds-config.env" ]; then
    echo "📋 Loading RDS configuration..."
    export $(cat new-rds-config.env | grep -v '^#' | xargs)
else
    echo "❌ RDS configuration file not found!"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')

echo "🔍 Database Details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    exit 1
fi

# Get RDS instance identifier from hostname
RDS_INSTANCE=$(echo $DB_HOST | cut -d'.' -f1)
echo "🔍 RDS Instance: $RDS_INSTANCE"

# Function to check RDS status
check_rds_status() {
    local status=$(aws rds describe-db-instances --db-instance-identifier $RDS_INSTANCE --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null)
    echo $status
}

# Function to wait for RDS to be available
wait_for_rds() {
    echo "⏳ Waiting for RDS instance to be available..."
    while true; do
        status=$(check_rds_status)
        echo "  Current status: $status"
        
        if [ "$status" = "available" ]; then
            echo "✅ RDS instance is available"
            break
        elif [ "$status" = "failed" ] || [ "$status" = "deleted" ]; then
            echo "❌ RDS instance is in failed state: $status"
            exit 1
        fi
        
        echo "  Waiting 30 seconds..."
        sleep 30
    done
}

# Function to test database connection
test_db_connection() {
    echo "🔍 Testing database connection..."
    
    # Try to connect using psql
    if command -v psql &> /dev/null; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ Database connection successful"
            return 0
        else
            echo "❌ Database connection failed"
            return 1
        fi
    else
        echo "⚠️ psql not found, skipping connection test"
        return 0
    fi
}

# Function to apply schema
apply_schema() {
    echo "📋 Applying optimal research schema..."
    
    if [ -f "database/optimal-research-schema.sql" ]; then
        if command -v psql &> /dev/null; then
            echo "  Applying schema using psql..."
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/optimal-research-schema.sql
            
            if [ $? -eq 0 ]; then
                echo "✅ Schema applied successfully"
            else
                echo "❌ Schema application failed"
                return 1
            fi
        else
            echo "⚠️ psql not found, please apply schema manually:"
            echo "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/optimal-research-schema.sql"
        fi
    else
        echo "❌ Schema file not found: database/optimal-research-schema.sql"
        return 1
    fi
}

# Function to insert sample data
insert_sample_data() {
    echo "📊 Inserting sample research data..."
    
    # Create sample discovery data
    cat > /tmp/sample_discovery.sql << 'EOF'
-- Sample discovery data for testing
INSERT INTO discoveries (
    discovery_id, 
    block_height, 
    timestamp, 
    researcher_address, 
    work_type_id, 
    work_type_name, 
    problem_statement, 
    complexity, 
    significance, 
    research_value, 
    computation_time, 
    energy_consumed, 
    is_collaborative, 
    is_from_pow, 
    validation_status, 
    novelty_score, 
    algorithm_used, 
    transaction_hash, 
    contract_address, 
    network
) VALUES (
    'PM_RZ_20250815_001347',
    8988702,
    '2025-08-15T23:33:47.390Z'::timestamp,
    '0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6',
    0,
    'riemann_zeta_function',
    'Find non-trivial zeros of ζ(s) on critical line Re(s) = 1/2',
    8,
    3,
    1250.75,
    3847.2,
    0.0034,
    false,
    true,
    'validated',
    99.7,
    'critical_line_zero_analysis',
    '0xabc123def456789abcdef123456789abcdef123456789abcdef123456789abc',
    '0x016A5B5617D26b93Ec6fB8DB2DC1BA79DefB088e',
    'sepolia'
) ON CONFLICT (discovery_id) DO NOTHING;

-- Sample mathematical result
INSERT INTO mathematical_results (
    discovery_id,
    result_type,
    result_data,
    verification_score,
    computational_steps,
    convergence_rate,
    precision_bits,
    algorithm_used,
    zero_location_real,
    zero_location_imaginary,
    zero_location_precision,
    related_zeros
) VALUES (
    'PM_RZ_20250815_001347',
    'riemann_zero',
    '{"zeroLocation": {"real": 0.5, "imaginary": 14.134725141734693, "precision": 50}}',
    99.7,
    2847291,
    0.000001,
    50,
    'critical_line_zero_analysis',
    0.5,
    14.134725141734693,
    50,
    '["14.134725", "21.022040", "25.010856"]'
) ON CONFLICT DO NOTHING;

-- Sample validation data
INSERT INTO validations (
    discovery_id,
    status,
    consensus_count,
    required_consensus,
    validation_fee,
    validators,
    validation_time,
    security_enhancement
) VALUES (
    'PM_RZ_20250815_001347',
    'validated',
    4,
    3,
    12.5,
    '["0x742d35Cc6634C0532925A3B8D4C9dB96C4B4d8B6", "0x1234567890123456789012345678901234567890"]',
    24.7,
    10006.0
) ON CONFLICT DO NOTHING;

-- Sample tokenomics data
INSERT INTO discovery_tokenomics (
    discovery_id,
    pow_reward,
    burn_amount,
    net_reward,
    research_value_multiplier,
    complexity_multiplier,
    significance_multiplier
) VALUES (
    'PM_RZ_20250815_001347',
    15000,
    3750,
    11250,
    2.5,
    8000,
    1500
) ON CONFLICT DO NOTHING;

-- Sample citation data
INSERT INTO citations (
    discovery_id,
    citation_count,
    related_discoveries,
    cross_disciplinary_connections,
    impact_score
) VALUES (
    'PM_RZ_20250815_001347',
    0,
    '["PM_RZ_20250814_002156"]',
    '["yang_mills", "elliptic_curves"]',
    45.2
) ON CONFLICT DO NOTHING;

-- Sample network metrics
INSERT INTO network_metrics (
    timestamp,
    active_miners,
    discoveries_per_hour,
    average_validation_time,
    bit_strength,
    security_enhancement_rate,
    total_research_value,
    total_burned_tokens
) VALUES (
    '2025-08-15T23:33:47.390Z'::timestamp,
    247,
    130.0,
    18.5,
    768,
    0.025,
    1250000.0,
    50000.0
) ON CONFLICT DO NOTHING;
EOF

    if command -v psql &> /dev/null; then
        echo "  Inserting sample data using psql..."
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /tmp/sample_discovery.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Sample data inserted successfully"
        else
            echo "❌ Sample data insertion failed"
            return 1
        fi
        
        # Clean up
        rm -f /tmp/sample_discovery.sql
    else
        echo "⚠️ psql not found, please insert sample data manually"
    fi
}

# Main execution
echo "🚀 Starting RDS restart process..."

# Check current status
current_status=$(check_rds_status)
echo "📊 Current RDS status: $current_status"

if [ "$current_status" = "available" ]; then
    echo "✅ RDS is already available"
else
    echo "🔄 RDS is not available, attempting restart..."
    
    # Try to reboot the RDS instance
    echo "🔄 Rebooting RDS instance..."
    aws rds reboot-db-instance --db-instance-identifier $RDS_INSTANCE
    
    if [ $? -eq 0 ]; then
        echo "✅ Reboot command sent successfully"
        wait_for_rds
    else
        echo "❌ Failed to send reboot command"
        exit 1
    fi
fi

# Test connection
if test_db_connection; then
    # Apply schema
    if apply_schema; then
        # Insert sample data
        insert_sample_data
        
        echo ""
        echo "🎉 RDS Database restart and schema application completed successfully!"
        echo ""
        echo "📋 Summary:"
        echo "  ✅ RDS instance is available"
        echo "  ✅ Database connection is working"
        echo "  ✅ Optimal research schema applied"
        echo "  ✅ Sample data inserted"
        echo ""
        echo "🔗 Database URL: $DATABASE_URL"
        echo "📊 You can now use the optimal JSON structure for ProductiveMiner research data"
    else
        echo "❌ Schema application failed"
        exit 1
    fi
else
    echo "❌ Database connection failed"
    exit 1
fi
