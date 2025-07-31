#!/bin/bash

# Script to manage Supabase remote database connection
# Usage: ./scripts/connect-remote-db.sh [command]

PROJECT_REF="nlpsmauwwlnblgwtawbs"

case "$1" in
  "link")
    echo "🔗 Linking to remote Supabase project..."
    npx supabase link --project-ref $PROJECT_REF
    ;;
  "pull")
    echo "📥 Pulling schema from remote database..."
    npx supabase db pull
    ;;
  "push")
    echo "📤 Pushing migrations to remote database..."
    npx supabase db push
    ;;
  "status")
    echo "📊 Checking remote project status..."
    npx supabase status
    ;;
  "logs")
    echo "📋 Getting remote logs..."
    npx supabase logs --project-ref $PROJECT_REF
    ;;
  "studio")
    echo "🎨 Opening remote Supabase Studio..."
    npx supabase studio --project-ref $PROJECT_REF
    ;;
  *)
    echo "Usage: $0 [link|pull|push|status|logs|studio]"
    echo ""
    echo "Commands:"
    echo "  link   - Link local project to remote Supabase"
    echo "  pull   - Pull schema from remote database"
    echo "  push   - Push migrations to remote database"
    echo "  status - Check remote project status"
    echo "  logs   - Get remote logs"
    echo "  studio - Open remote Supabase Studio"
    echo ""
    echo "Project Reference: $PROJECT_REF"
    ;;
esac 