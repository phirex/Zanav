#!/usr/bin/env node

/**
 * Script to generate cron job configurations for notification processing
 *
 * Usage:
 * 1. Run with Node.js: node setup-cron.js
 * 2. Copy the generated crontab configuration to your server
 */

// Generate a random API key if one isn't already set
const crypto = require("crypto");
const apiKey = crypto.randomBytes(32).toString("hex");

console.log(`
===============================================
Notification System Cron Job Setup
===============================================

1. Add this environment variable to your .env file:

CRON_API_KEY=${apiKey}

2. Set up the following cron job on your server:

# Run every 5 minutes to process pending notifications
*/5 * * * * curl -X GET "https://YOUR_DOMAIN_HERE/api/cron/notifications" -H "Authorization: Bearer ${apiKey}"

3. Manually run the cron job for testing:

curl -X GET "http://localhost:3000/api/cron/notifications" -H "Authorization: Bearer ${apiKey}"

===============================================
`);

// Additional instructions for common cron setup methods
console.log(`
Common Cron Setup Methods:

1. Using crontab:
   Run 'crontab -e' and add the line above

2. Using systemd timer:
   Create service and timer files in /etc/systemd/system/

3. Using PM2:
   pm2 start notification-worker.js --cron "*/5 * * * *"

For Windows:
Use Task Scheduler and create a task that runs the curl command

For more information:
https://crontab.guru/ - Cron schedule expression editor
`);
