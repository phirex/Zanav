# Zanav.io Scripts

This directory contains various utility scripts for managing the Zanav.io application.

## Demo Data Generation

To generate realistic demo data for the Demo Pension tenant:

1. Run the setup script to configure your environment:

   ```bash
   npm run demo:setup
   ```

   This will guide you through creating or updating your `.env.local` file with the necessary Supabase credentials.

   > Note: Next.js projects use `.env.local` for local environment variables, which is why the setup creates this file instead of a regular `.env` file.

2. The script will verify the default Demo Pension tenant ID (`1fb2c6bd-2640-47ae-8d1d-c9b872d804e3`). If you need to use a different tenant ID, you can edit it in the `generate-demo-data.ts` file:

   ```typescript
   const DEMO_TENANT_ID = "1fb2c6bd-2640-47ae-8d1d-c9b872d804e3";
   ```

3. Run the data generation script:
   ```bash
   npm run demo:generate
   ```

The script will:

- Verify the Demo Pension tenant exists (and create it if needed)
- Create default rooms if none exist
- Generate 10 pet owners with contact information
- Create 1-3 dogs for each owner
- Create 1-3 bookings for each dog (mix of past, current, and future)
- Generate payments for most confirmed bookings

The generated data includes a realistic mix of:

- Past, current, and upcoming bookings
- Different pricing models (daily and fixed)
- Various payment methods
- Different booking statuses (confirmed, pending, cancelled)

## Troubleshooting

If you encounter errors:

1. Make sure your `.env.local` file contains the correct Supabase URL and service role key
2. Check that the Demo Pension tenant ID is correct
3. Ensure you have the necessary permissions in your Supabase instance
4. If you've manually created an `.env` file, consider moving the credentials to `.env.local` or run the setup script to create it automatically

## Other Scripts

- `npm run db:seed` - Initialize the database with essential data
- `npm run notifications` - Set up the notification cron jobs
- `npm run send-notifications` - Manually trigger sending of notifications
- `npm run whatsapp` - Send WhatsApp messages directly
- `npm run create-test` - Create a test notification
