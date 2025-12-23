#!/bin/bash

# Bondly Setup Script
# This script helps you set up your environment variables

echo "🚀 Bondly Setup Script"
echo "======================"
echo ""

# Check if .env.local already exists
if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    read -p "Do you want to overwrite it? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Create .env.local file
cat > .env.local << 'EOF'
# Supabase Configuration
# Get these from: https://app.supabase.com/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Site URL (for generating share links)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google AI API Key
# Get from: https://aistudio.google.com/apikey
GOOGLE_GENERATIVE_AI_API_KEY=your-google-ai-key-here
EOF

echo "✅ Created .env.local file"
echo ""
echo "📝 Next Steps:"
echo "1. Edit .env.local and add your actual API keys"
echo "2. Get Supabase keys from: https://app.supabase.com/project/_/settings/api"
echo "3. Get Google AI key from: https://aistudio.google.com/apikey"
echo "4. Run 'pnpm install' to install dependencies"
echo "5. Run 'pnpm dev' to start the development server"
echo ""
echo "📖 See SETUP.md for detailed instructions"

