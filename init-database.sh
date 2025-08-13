#!/bin/bash

echo "🔧 Initializing ProductiveMiner Database"
echo "========================================"

# Database connection details
DB_HOST="productiveminer-pg.c0lmo082cafp.us-east-1.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="productiveminer"
DB_USER="productiveminer"
DB_PASSWORD="productiveminer123"

echo "📡 Connecting to database: $DB_HOST:$DB_PORT/$DB_NAME"

# Test connection and create schema
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
-- Test connection
SELECT 'Database connection successful' as status;

-- Create schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS public;

-- Create tables from schema.sql
$(cat database/schema.sql)
"

if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully!"
else
    echo "❌ Database initialization failed!"
    exit 1
fi

echo "🔍 Testing database tables..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
"

echo "🎉 Database setup complete!"
