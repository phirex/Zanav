# Prisma to Supabase Migration Plan

## Current Status

The codebase is using Prisma ORM to interact with the database, but we are migrating to using Supabase directly. There are multiple files that import and use Prisma, particularly in API routes and services.

## Completed Steps

1. ✅ Created type definitions for all database tables in `src/lib/supabase/types.ts`
2. ✅ Updated the Supabase server client to use our typed database interface
3. ✅ Created helper functions for common database operations in `src/lib/supabase/helpers.ts`
4. ✅ Migrated the WhatsApp service from Prisma to Supabase

## Models to Migrate

From the Prisma schema, these are the main models we need to migrate:

1. Room
2. Dog
3. Owner
4. Booking
5. Payment
6. Setting
7. NotificationTemplate
8. ScheduledNotification
9. GlobalAdmin (already partially migrated)
10. User (already partially migrated)
11. UserTenant (already partially migrated)
12. Tenant (already partially migrated)

## Migration Steps

### 1. Database Schema

- [x] Ensure all models from Prisma schema exist in Supabase
- [x] Create type definitions for each model
- [ ] Verify relationships and constraints are properly set up
- [ ] Create necessary indexes

### 2. Create Supabase Utility Functions

- [x] Create a server-side Supabase client (already done in `src/lib/supabase/server.ts`)
- [x] Create typed table interfaces for each model
- [x] Create helper functions for common operations

### 3. Replace Prisma Usage

Replace Prisma usage in these files:

#### API Routes

- [ ] src/app/api/payments/route.ts
- [ ] src/app/api/bookings/route.ts
- [ ] src/app/api/bookings/[id]/exempt-day/route.ts
- [ ] src/app/api/bookings/[id]/notifications/route.ts
- [ ] src/app/api/notifications/process/route.ts
- [ ] src/app/api/notifications/send/route.ts
- [ ] src/app/api/notifications/process-public/route.ts
- [ ] src/app/api/notifications/[id]/send/route.ts
- [ ] src/app/api/test-whatsapp/route.ts
- [ ] src/app/api/fix-migration/route.ts (can be removed after migration)

#### Services

- [x] src/lib/services/whatsapp.ts

#### Scripts

- [ ] scripts/create-template.ts
- [ ] scripts/send-notifications.js

#### Client Components

- [ ] src/app/components/PaymentHistory.tsx (migrate enum imports)
- [ ] Other client components importing Prisma types

### 4. Update Type Imports

- [x] Created common type definitions in `src/lib/supabase/types.ts`
- [ ] Replace all `@prisma/client` imports with imports from `@/lib/supabase/types`

### 5. Update Build Process

- [ ] Remove Prisma generation from the build script
- [ ] Update database scripts

### 6. Testing

- [ ] Test all migrated endpoints
- [ ] Verify data queries work correctly
- [ ] Ensure relationships are maintained

### 7. Cleanup

- [ ] Remove Prisma dependencies from package.json
- [ ] Remove prisma directory and schema
- [ ] Remove src/lib/prisma.ts

## Next Files to Migrate

Based on complexity and dependency order, we should migrate these files next:

1. **First priority**:
   - src/app/api/bookings/[id]/exempt-day/route.ts (simpler API route)
   - src/app/api/test-whatsapp/route.ts (simple test endpoint)
   - Update client components to use our new types instead of Prisma types

2. **Second priority**:
   - src/app/api/bookings/route.ts
   - src/app/api/payments/route.ts
   - src/app/api/bookings/[id]/notifications/route.ts

3. **Third priority** (most complex):
   - Notification-related endpoints

## Migration Strategy

We'll continue with our incremental approach:

1. Migrate each API endpoint one at a time
2. Test thoroughly after each migration
3. Once all endpoints are migrated, remove Prisma dependencies

## Estimated Timeline

1. ✅ Create database table types and helper functions
2. Migrate API endpoints (5-7 days)
   - Simple endpoints (2 days)
   - Complex endpoints (3-5 days)
3. Update client code (2-3 days)
4. Testing and fixing issues (3-4 days)
5. Cleanup (1 day)

Total remaining time: 1-2 weeks
