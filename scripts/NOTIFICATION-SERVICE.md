# Notification Service Setup

This document explains how to set up and run the notification service for the Pension application.

## Local Development

For local development, you can run the notification service directly with npm:

```bash
npm run notifications
```

This will start a process that checks for pending notifications every minute and sends them.

## Production Setup

For production environments, you have two options:

### Option 1: Systemd Service (Linux Servers)

1. Make the install script executable:

   ```bash
   chmod +x scripts/install-service.sh
   ```

2. Run the install script as root:

   ```bash
   sudo scripts/install-service.sh
   ```

3. Check the service status:
   ```bash
   systemctl status pension-notifications.service
   ```

This will install the service to run automatically and restart if it fails.

### Option 2: PM2 Process Manager

If you're using PM2 on your server:

1. Install PM2 globally if you haven't already:

   ```bash
   npm install -g pm2
   ```

2. Start the notification service with PM2:

   ```bash
   pm2 start scripts/cron-setup.js --name pension-notifications
   ```

3. Save the PM2 configuration to restart on server reboot:

   ```bash
   pm2 save
   ```

4. Set up PM2 to start on system startup:
   ```bash
   pm2 startup
   ```

## Logs

To view the notification service logs:

- For systemd: `journalctl -u pension-notifications.service -f`
- For PM2: `pm2 logs pension-notifications`

## Troubleshooting

If notifications aren't being sent:

1. Check if the service is running
2. Verify there are pending notifications in the database
3. Check the service logs for errors
4. Ensure WhatsApp settings are configured in the database
