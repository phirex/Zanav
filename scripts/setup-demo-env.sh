#!/bin/bash

# Color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Zanav.io Demo Data Generator Setup${NC}"
echo "=================================="

# Check if .env.local file exists (Next.js prioritizes this)
if [ -f ".env.local" ]; then
  echo -e "${YELLOW}Existing .env.local file found.${NC}"
  
  # Check if it contains Supabase URL and key
  if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local && grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
    echo -e "${GREEN}Supabase credentials found in .env.local file.${NC}"
  else
    echo -e "${YELLOW}Supabase credentials not found or incomplete in .env.local file.${NC}"
    
    # Prompt for credentials
    echo "Please enter your Supabase URL (e.g., https://your-project.supabase.co):"
    read supabase_url
    
    echo "Please enter your Supabase service role key:"
    read supabase_key
    
    # Add or update credentials in .env.local file
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
      sed -i '' "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$supabase_url|" .env.local
    else
      echo "NEXT_PUBLIC_SUPABASE_URL=$supabase_url" >> .env.local
    fi
    
    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
      sed -i '' "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$supabase_key|" .env.local
    else
      echo "SUPABASE_SERVICE_ROLE_KEY=$supabase_key" >> .env.local
    fi
    
    echo -e "${GREEN}Credentials added to .env.local file.${NC}"
  fi
else
  echo -e "${YELLOW}.env.local file not found. Creating new file...${NC}"
  
  # Prompt for credentials
  echo "Please enter your Supabase URL (e.g., https://your-project.supabase.co):"
  read supabase_url
  
  echo "Please enter your Supabase service role key:"
  read supabase_key
  
  # Create .env.local file
  echo "NEXT_PUBLIC_SUPABASE_URL=$supabase_url" > .env.local
  echo "SUPABASE_SERVICE_ROLE_KEY=$supabase_key" >> .env.local
  
  echo -e "${GREEN}.env.local file created with credentials.${NC}"
fi

echo -e "${GREEN}Setup completed! You can now run:${NC}"
echo "npm run demo:generate"
echo "==================================" 