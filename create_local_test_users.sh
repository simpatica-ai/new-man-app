#!/bin/bash

# ============================================================================
# CREATE LOCAL TEST USERS
# Uses Supabase's auth API to create users properly
# ============================================================================

echo "Creating test users for local Supabase..."

# Get the anon key from supabase status
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')
API_URL="http://localhost:54321"

echo "Using API URL: $API_URL"

# Create sponsor user
echo ""
echo "Creating sponsor@test.com..."
curl -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sponsor@test.com",
    "password": "testpassword123",
    "data": {
      "full_name": "Sarah Sponsor"
    }
  }'

echo ""
echo ""

# Create practitioner user
echo "Creating practitioner@test.com..."
curl -X POST "$API_URL/auth/v1/signup" \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "practitioner@test.com",
    "password": "testpassword123",
    "data": {
      "full_name": "John Practitioner"
    }
  }'

echo ""
echo ""
echo "✅ Test users created!"
echo ""
echo "Login credentials:"
echo "  Sponsor: sponsor@test.com / testpassword123"
echo "  Practitioner: practitioner@test.com / testpassword123"
echo ""
echo "Note: You may need to update the profiles table with roles manually"
