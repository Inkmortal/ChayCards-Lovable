#!/bin/bash
# ========================================
# PostgreSQL Multi-Database Initialization
# ========================================
# Creates multiple databases in a single Postgres container
# for dev, staging, and production environments.
#
# This script runs automatically when the container starts
# if the data directory is empty.

set -e
set -u

# Create databases
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Development database
    CREATE DATABASE chaycards_dev;
    GRANT ALL PRIVILEGES ON DATABASE chaycards_dev TO $POSTGRES_USER;

    -- Staging database
    CREATE DATABASE chaycards_staging;
    GRANT ALL PRIVILEGES ON DATABASE chaycards_staging TO $POSTGRES_USER;

    -- Production database
    CREATE DATABASE chaycards_prod;
    GRANT ALL PRIVILEGES ON DATABASE chaycards_prod TO $POSTGRES_USER;
EOSQL

echo "✓ Created databases: chaycards_dev, chaycards_staging, chaycards_prod"
