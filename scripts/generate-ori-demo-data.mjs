#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Ori's specific tenant
const ORI_USER_ID = '1194ffe6-1f7a-444b-8294-709f3a277580';
const ORI_TENANT_ID = 'ef335dc4-ed46-4f39-8b44-95518b1c4b2a'; // Ori's Kennel

async function main() {
  try {
    console.log('🎭 Starting demo data generation for Ori\'s Kennel...');
    
    // Ensure User and UserTenant relationship exists
    console.log('\n👤 Setting up user relationship...');
    
    // Check/create User record
    const { data: existingUser } = await supabase
      .from('User')
      .select('*')
      .eq('supabaseUserId', ORI_USER_ID)
      .single();
    
    if (!existingUser) {
      // Check if user exists by email and update it
      const { data: userByEmail } = await supabase
        .from('User')
        .select('*')
        .eq('email', 'ori@walla.com')
        .single();
      
      if (userByEmail) {
        // Update existing user with new supabaseUserId
        const { error: updateError } = await supabase
          .from('User')
          .update({
            supabaseUserId: ORI_USER_ID,
            firstName: 'Ori',
            lastName: 'Levi'
          })
          .eq('email', 'ori@walla.com');
        if (updateError) throw updateError;
        console.log('✅ Updated User record with new supabaseUserId');
      } else {
        // Create new user
        const { error: userError } = await supabase
          .from('User')
          .insert({
            supabaseUserId: ORI_USER_ID,
            email: 'ori@walla.com',
            firstName: 'Ori',
            lastName: 'Levi'
          });
        if (userError) throw userError;
        console.log('✅ Created User record');
      }
    } else {
      console.log('✅ User record exists');
    }
    
    // Check/create UserTenant relationship
    const { data: existingUserTenant, error: checkError } = await supabase
      .from('UserTenant')
      .select('*')
      .eq('user_id', ORI_USER_ID)
      .eq('tenant_id', ORI_TENANT_ID)
      .single();
    
    if (!existingUserTenant && !checkError) {
      const { error: userTenantError } = await supabase
        .from('UserTenant')
        .insert({
          user_id: ORI_USER_ID,
          tenant_id: ORI_TENANT_ID,
          role: 'OWNER'
        });
      if (userTenantError) throw userTenantError;
      console.log('✅ Created UserTenant relationship');
    } else {
      console.log('✅ UserTenant relationship exists (skipping creation)');
    }
    
    // Clear existing demo data for this tenant
    console.log('\n🧹 Clearing existing demo data...');
    await supabase.from('Payment').delete().eq('tenantId', ORI_TENANT_ID);
    await supabase.from('Booking').delete().eq('tenantId', ORI_TENANT_ID);
    await supabase.from('Dog').delete().eq('tenantId', ORI_TENANT_ID);
    await supabase.from('Owner').delete().eq('tenantId', ORI_TENANT_ID);
    await supabase.from('Room').delete().eq('tenantId', ORI_TENANT_ID);
    await supabase.from('NotificationTemplate').delete().eq('tenantId', ORI_TENANT_ID);
    console.log('✅ Cleared existing data');

    // Check tenant still exists before creating rooms
    const { data: tenantCheck, error: tenantCheckError } = await supabase
      .from('Tenant')
      .select('*')
      .eq('id', ORI_TENANT_ID)
      .single();
    
    if (!tenantCheck) {
      const { error: createTenantError } = await supabase
        .from('Tenant')
        .insert({
          id: ORI_TENANT_ID,
          name: 'Ori\'s Kennel',
          subdomain: 'ori-kennel'
        });
      if (createTenantError) throw createTenantError;
    }

    // Create rooms
    console.log('\n🏠 Creating rooms...');
    const roomsData = [
      { name: 'small-suite-a', displayName: 'Small Suite A', capacity: 5, tenantId: ORI_TENANT_ID },
      { name: 'small-suite-b', displayName: 'Small Suite B', capacity: 5, tenantId: ORI_TENANT_ID },
      { name: 'medium', displayName: 'Medium Room', capacity: 10, tenantId: ORI_TENANT_ID },
      { name: 'large', displayName: 'Large Room', capacity: 15, tenantId: ORI_TENANT_ID },
      { name: 'vip', displayName: 'VIP Suite', capacity: 8, tenantId: ORI_TENANT_ID },
      { name: 'outdoor', displayName: 'Outdoor Play Area', capacity: 25, tenantId: ORI_TENANT_ID },
    ];
    
    const { data: rooms, error: roomsError } = await supabase
      .from('Room')
      .insert(roomsData)
      .select();
    if (roomsError) throw roomsError;
    console.log(`✅ Created ${rooms.length} rooms`);

    // Create owners
    console.log('\n👥 Creating owners...');
    const ownersData = [
      { name: 'David Cohen', email: 'david.cohen@email.com', phone: '052-1234567', address: 'Tel Aviv', tenantId: ORI_TENANT_ID },
      { name: 'Sarah Levy', email: 'sarah.levy@email.com', phone: '053-2345678', address: 'Jerusalem', tenantId: ORI_TENANT_ID },
      { name: 'Michael Brown', email: 'michael.brown@email.com', phone: '054-3456789', address: 'Haifa', tenantId: ORI_TENANT_ID },
      { name: 'Rachel Green', email: 'rachel.green@email.com', phone: '055-4567890', address: 'Herzliya', tenantId: ORI_TENANT_ID },
      { name: 'Daniel Kim', email: 'daniel.kim@email.com', phone: '056-5678901', address: 'Netanya', tenantId: ORI_TENANT_ID },
      { name: 'Emma Wilson', email: 'emma.wilson@email.com', phone: '057-6789012', address: 'Ramat Gan', tenantId: ORI_TENANT_ID },
      { name: 'Yoni Goldberg', email: 'yoni.goldberg@email.com', phone: '058-7890123', address: 'Petah Tikva', tenantId: ORI_TENANT_ID },
      { name: 'Lisa Anderson', email: 'lisa.anderson@email.com', phone: '059-8901234', address: 'Rishon LeZion', tenantId: ORI_TENANT_ID },
    ];
    
    const { data: owners, error: ownersError } = await supabase
      .from('Owner')
      .insert(ownersData)
      .select();
    if (ownersError) throw ownersError;
    console.log(`✅ Created ${owners.length} owners`);

    // Create dogs
    console.log('\n🐕 Creating dogs...');
    const dogBreeds = ['Golden Retriever', 'German Shepherd', 'Labrador', 'Border Collie', 'French Bulldog', 'Poodle', 'Husky', 'Beagle'];
    const dogNames = ['Buddy', 'Max', 'Luna', 'Charlie', 'Lucy', 'Cooper', 'Bella', 'Rocky', 'Molly', 'Jack', 'Sophie', 'Zeus', 'Coco', 'Oscar'];
    
    const dogsData = [];
    for (let i = 0; i < 14; i++) {
      const owner = owners[i % owners.length];
      dogsData.push({
        name: dogNames[i],
        breed: dogBreeds[i % dogBreeds.length],
        specialNeeds: Math.random() > 0.7 ? 'Requires medication twice daily' : null,
        ownerId: owner.id,
        tenantId: ORI_TENANT_ID,
      });
    }
    
    const { data: dogs, error: dogsError } = await supabase
      .from('Dog')
      .insert(dogsData)
      .select();
    if (dogsError) throw dogsError;
    console.log(`✅ Created ${dogs.length} dogs`);

    // Create bookings (3 months past to 3 months future)
    console.log('\n📅 Creating bookings...');
    const bookingsData = [];
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 28);
    
    for (let i = 0; i < 50; i++) {
      const dog = dogs[i % dogs.length];
      const room = rooms[i % rooms.length];
      
      // Random date between 3 months ago and 3 months from now
      const startDate = new Date(threeMonthsAgo.getTime() + Math.random() * (threeMonthsFromNow.getTime() - threeMonthsAgo.getTime()));
      const duration = Math.floor(Math.random() * 14) + 1; // 1-14 days
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
      
      const pricePerDay = 80 + Math.floor(Math.random() * 100); // 80-180 ILS
      const statuses = ['CONFIRMED', 'PENDING', 'CANCELLED'];
      const paymentMethods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'BIT'];
      
      bookingsData.push({
        dogId: dog.id,
        roomId: room.id,
        ownerId: dog.ownerId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priceType: 'DAILY',
        pricePerDay: pricePerDay,
        totalPrice: pricePerDay * duration,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        exemptLastDay: Math.random() > 0.8,
        tenantId: ORI_TENANT_ID,
      });
    }
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .insert(bookingsData)
      .select();
    if (bookingsError) throw bookingsError;
    console.log(`✅ Created ${bookings.length} bookings`);

    // Create payments for ~74% of bookings
    console.log('\n💰 Creating payments...');
    const paymentsData = [];
    const paymentMethods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'BIT'];
    
    for (let i = 0; i < Math.floor(bookings.length * 0.74); i++) {
      const booking = bookings[i];
      const paymentAmount = Math.random() > 0.3 ? booking.totalPrice : booking.totalPrice * (0.3 + Math.random() * 0.7);
      
      paymentsData.push({
        bookingId: booking.id,
        amount: Math.round(paymentAmount),
        method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        tenantId: ORI_TENANT_ID,
      });
    }
    
    const { data: payments, error: paymentsError } = await supabase
      .from('Payment')
      .insert(paymentsData)
      .select();
    if (paymentsError) throw paymentsError;
    console.log(`✅ Created ${payments.length} payments`);

    // Create notification templates
    console.log('\n📨 Creating notification templates...');
    const templatesData = [
      {
        name: 'Booking Confirmation',
        trigger: 'BOOKING_CONFIRMATION',
        subject: 'Booking Confirmed - {{dogName}} at {{businessName}}',
        body: 'Hi {{ownerName}},\\n\\nYour booking for {{dogName}} has been confirmed!\\n\\nDates: {{startDate}} to {{endDate}}\\nRoom: {{roomName}}\\n\\nThank you for choosing {{businessName}}!',
        active: true,
        delayHours: 0,
        description: 'Sent when a booking is confirmed',
        tenantId: ORI_TENANT_ID,
      },
      {
        name: 'Check-in Reminder',
        trigger: 'CHECK_IN_REMINDER', 
        subject: 'Check-in Reminder - {{dogName}}',
        body: 'Hi {{ownerName}},\\n\\nThis is a reminder that {{dogName}}\'s check-in is tomorrow at {{businessName}}.\\n\\nPlease bring:\\n- Vaccination records\\n- Food and treats\\n- Any medications\\n\\nSee you soon!',
        active: true,
        delayHours: 24,
        description: 'Sent 24 hours before check-in',
        tenantId: ORI_TENANT_ID,
      },
      {
        name: 'Payment Reminder',
        trigger: 'PAYMENT_REMINDER',
        subject: 'Payment Reminder - {{businessName}}',
        body: 'Hi {{ownerName}},\\n\\nWe hope {{dogName}} enjoyed their stay!\\n\\nYour payment of {{amount}} {{currency}} is now due.\\n\\nPlease contact us to arrange payment.\\n\\nThank you!',
        active: true,
        delayHours: 0,
        description: 'Sent when payment is overdue',
        tenantId: ORI_TENANT_ID,
      },
    ];
    
    const { data: templates, error: templatesError } = await supabase
      .from('NotificationTemplate')
      .insert(templatesData)
      .select();
    if (templatesError) throw templatesError;
    console.log(`✅ Created ${templates.length} notification templates`);
    
    console.log('\n🎉 Demo data generation completed successfully for Ori\'s Kennel!');
    console.log('\n📊 Summary:');
    console.log(`- ${rooms.length} rooms`);
    console.log(`- ${owners.length} owners`);
    console.log(`- ${dogs.length} dogs`);
    console.log(`- ${bookings.length} bookings`);
    console.log(`- ${payments.length} payments`);
    console.log(`- ${templates.length} notification templates`);
    console.log(`\n🏢 Tenant: Ori's Kennel (${ORI_TENANT_ID})`);
    console.log(`👤 User: ori@walla.com (${ORI_USER_ID})`);
    
  } catch (error) {
    console.error('\n❌ Error generating demo data:', error);
    process.exit(1);
  }
}

main(); 