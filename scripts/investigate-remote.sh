#!/bin/bash

# Source the environment file
source .env.local

# Export the variables for the Node.js process
export SUPABASE_REMOTE_SERVICE_ROLE_KEY

# Run the investigation script
node scripts/investigate-remote.mjs
