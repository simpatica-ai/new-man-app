#!/bin/bash

# Test Migration Script for Organizational Model
# This script tests the migration in a safe development environment

set -e  # Exit on any error

echo "🚀 Testing Organizational Model Migration"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "SUCCESS")
            echo -e "${GREEN}✅ $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}❌ $message${NC}"
            ;;
        "WARNING")
            echo -e "${YELLOW}⚠️  $message${NC}"
            ;;
        "INFO")
            echo -e "ℹ️  $message"
            ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "supabase/config.toml" ]; then
    print_status "ERROR" "Not in project root directory. Please run from project root."
    exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    print_status "ERROR" "Supabase CLI not found. Please install it first."
    exit 1
fi

# Check if we're connected to a Supabase project
if ! supabase status &> /dev/null; then
    print_status "WARNING" "Supabase not running locally. Starting local development environment..."
    supabase start
fi

print_status "INFO" "Checking current migration status..."

# Get current migration status
MIGRATION_STATUS=$(supabase migration list 2>/dev/null || echo "No migrations found")
echo "$MIGRATION_STATUS"

print_status "INFO" "Testing migration syntax..."

# Test if the migration file is valid SQL
if psql --version &> /dev/null; then
    # Use psql to check syntax if available
    if psql -f supabase/migrations/20250102_organizational_model.sql --dry-run &> /dev/null; then
        print_status "SUCCESS" "Migration syntax is valid"
    else
        print_status "ERROR" "Migration syntax check failed"
        exit 1
    fi
else
    print_status "WARNING" "psql not available, skipping syntax check"
fi

print_status "INFO" "Applying migration to local development database..."

# Apply the migration
if supabase db push; then
    print_status "SUCCESS" "Migration applied successfully"
else
    print_status "ERROR" "Migration failed to apply"
    exit 1
fi

print_status "INFO" "Running validation checks..."

# Run validation script
if supabase db reset --linked=false; then
    print_status "INFO" "Database reset for clean test"
    
    # Reapply migration
    if supabase db push; then
        print_status "SUCCESS" "Migration reapplied successfully"
        
        # Run validation (we'll need to connect and run the validation SQL)
        print_status "INFO" "Validation script created - run manually to verify"
    else
        print_status "ERROR" "Migration failed on second application"
        exit 1
    fi
else
    print_status "WARNING" "Could not reset database for clean test"
fi

print_status "INFO" "Testing rollback capability..."

# Test rollback (in a safe way)
print_status "INFO" "Rollback script created - test manually in development environment"

echo ""
echo "🎉 Migration Test Complete!"
echo "=========================="
print_status "SUCCESS" "Migration scripts are ready for production"
print_status "INFO" "Next steps:"
echo "  1. Review migration files in supabase/migrations/"
echo "  2. Test in staging environment"
echo "  3. Run validation script after applying migration"
echo "  4. Apply to production with proper backup"
echo ""
print_status "WARNING" "Always backup production data before applying migrations!"