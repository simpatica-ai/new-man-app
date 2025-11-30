#!/bin/bash

# ============================================================================
# Local Development Setup Script
# ============================================================================

echo "🚀 Setting up local Supabase development environment..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    echo "📥 Please install Docker Desktop:"
    echo "   macOS: brew install --cask docker"
    echo "   Or download from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running"
    echo "🔧 Please start Docker Desktop and try again"
    exit 1
fi

echo "✅ Docker is installed and running"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed"
    echo "📥 Installing Supabase CLI..."
    brew install supabase/tap/supabase
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Supabase CLI"
        echo "Please install manually: brew install supabase/tap/supabase"
        exit 1
    fi
fi

echo "✅ Supabase CLI is installed"
supabase --version

# Start Supabase
echo ""
echo "🔄 Starting local Supabase..."
echo "   (First time may take 2-5 minutes to download Docker images)"
echo ""

supabase start

if [ $? -ne 0 ]; then
    echo "❌ Failed to start Supabase"
    echo "Try: supabase stop && supabase start"
    exit 1
fi

echo ""
echo "✅ Supabase started successfully!"
echo ""

# Get connection details
echo "📋 Connection Details:"
echo "====================="
supabase status

echo ""
echo "📝 Next Steps:"
echo "=============="
echo "1. Copy the 'anon key' from above"
echo "2. Update .env.local with:"
echo "   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-above>"
echo ""
echo "3. Apply migrations:"
echo "   supabase db reset"
echo ""
echo "4. Start Next.js:"
echo "   npm run dev"
echo ""
echo "5. Access Supabase Studio:"
echo "   http://localhost:54323"
echo ""
echo "📖 Full guide: LOCAL_DEVELOPMENT_SETUP.md"
echo ""
echo "💰 Cost savings: ~$50/month by using local development!"
echo ""