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

// Find the current tenant
async function getCurrentTenant() {
  const { data: tenants, error } = await supabase
    .from('Tenant')
    .select('*')
    .limit(1);
  
  if (error || !tenants || tenants.length === 0) {
    throw new Error('No tenant found. Please create a tenant first.');
  }
  
  return tenants[0];
}

async function generateDemoData() {
  try {
    console.log('🎭 Starting demo data generation...\n');
    
    // Get current tenant
    const tenant = await getCurrentTenant();
    console.log(`📋 Found tenant: ${tenant.name} (${tenant.id})`);
    
    // Set tenant context
    await supabase.rpc("set_tenant", { _tenant_id: tenant.id });
    
    // 1. Create Rooms
    console.log('\n🏠 Creating rooms...');
    const roomsData = [
      { name: 'Small Suite A', displayName: 'Small Suite A', capacity: 5, maxCapacity: 8, tenantId: tenant.id },
      { name: 'Small Suite B', displayName: 'Small Suite B', capacity: 5, maxCapacity: 8, tenantId: tenant.id },
      { name: 'Medium Suite', displayName: 'Medium Suite', capacity: 10, maxCapacity: 15, tenantId: tenant.id },
      { name: 'Large Suite', displayName: 'Large Suite', capacity: 15, maxCapacity: 20, tenantId: tenant.id },
      { name: 'VIP Suite', displayName: 'VIP Suite', capacity: 8, maxCapacity: 10, tenantId: tenant.id },
      { name: 'Outdoor Play Area', displayName: 'Outdoor Play Area', capacity: 20, maxCapacity: 25, tenantId: tenant.id },
    ];
    
    const { data: rooms, error: roomsError } = await supabase
      .from('Room')
      .insert(roomsData)
      .select();
    
    if (roomsError) throw roomsError;
    console.log(`✅ Created ${rooms.length} rooms`);
    
    // 2. Create Owners
    console.log('\n👥 Creating owners...');
    const ownersData = [
      { name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '555-0101', address: '123 Oak Street, Tel Aviv', tenantId: tenant.id },
      { name: 'Michael Cohen', email: 'michael.cohen@email.com', phone: '555-0102', address: '456 Pine Avenue, Jerusalem', tenantId: tenant.id },
      { name: 'Rachel Levy', email: 'rachel.levy@email.com', phone: '555-0103', address: '789 Cedar Lane, Haifa', tenantId: tenant.id },
      { name: 'David Miller', email: 'david.miller@email.com', phone: '555-0104', address: '321 Maple Drive, Herzliya', tenantId: tenant.id },
      { name: 'Emma Wilson', email: 'emma.wilson@email.com', phone: '555-0105', address: '654 Birch Road, Ramat Gan', tenantId: tenant.id },
      { name: 'Daniel Garcia', email: 'daniel.garcia@email.com', phone: '555-0106', address: '987 Elm Street, Netanya', tenantId: tenant.id },
      { name: 'Sophie Anderson', email: 'sophie.anderson@email.com', phone: '555-0107', address: '147 Willow Way, Eilat', tenantId: tenant.id },
      { name: 'Yosef Katz', email: 'yosef.katz@email.com', phone: '555-0108', address: '258 Ash Boulevard, Beer Sheva', tenantId: tenant.id },
    ];
    
    const { data: owners, error: ownersError } = await supabase
      .from('Owner')
      .insert(ownersData)
      .select();
    
    if (ownersError) throw ownersError;
    console.log(`✅ Created ${owners.length} owners`);
    
    // 3. Create Dogs
    console.log('\n🐕 Creating dogs...');
    const dogBreeds = ['Golden Retriever', 'German Shepherd', 'Labrador', 'Poodle', 'Bulldog', 'Beagle', 'Rottweiler', 'Yorkshire Terrier', 'Dachshund', 'Chihuahua'];
    const dogNames = ['Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Lucy', 'Rocky', 'Daisy', 'Buddy', 'Molly', 'Bear', 'Sadie', 'Jack', 'Lola', 'Duke'];
    
    const dogsData = [];
    owners.forEach((owner, index) => {
      // Each owner gets 1-3 dogs
      const numDogs = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numDogs; i++) {
        dogsData.push({
          name: dogNames[Math.floor(Math.random() * dogNames.length)] + (i > 0 ? ` ${i + 1}` : ''),
          breed: dogBreeds[Math.floor(Math.random() * dogBreeds.length)],
          specialNeeds: Math.random() > 0.7 ? 'Requires medication twice daily' : null,
          ownerId: owner.id,
          tenantId: tenant.id,
        });
      }
    });
    
    const { data: dogs, error: dogsError } = await supabase
      .from('Dog')
      .insert(dogsData)
      .select();
    
    if (dogsError) throw dogsError;
    console.log(`✅ Created ${dogs.length} dogs`);
    
    // 4. Create Bookings (mix of past, current, and future)
    console.log('\n📅 Creating bookings...');
    const bookingsData = [];
    const statuses = ['PENDING', 'CONFIRMED', 'CANCELLED'];
    const priceTypes = ['DAILY', 'FIXED'];
    const paymentMethods = ['CASH', 'CREDIT_CARD', 'BANK_TRANSFER', 'BIT'];
    
    // Generate bookings for the past 3 months and next 3 months
    const today = new Date();
    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 3, 1);
    const threeMonthsFromNow = new Date(today.getFullYear(), today.getMonth() + 3, 28);
    
    // Create 50 bookings
    for (let i = 0; i < 50; i++) {
      const randomOwner = owners[Math.floor(Math.random() * owners.length)];
      const ownerDogs = dogs.filter(dog => dog.ownerId === randomOwner.id);
      if (ownerDogs.length === 0) continue;
      
      const randomDog = ownerDogs[Math.floor(Math.random() * ownerDogs.length)];
      const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
      
      // Random start date between 3 months ago and 3 months from now
      const startDate = new Date(
        threeMonthsAgo.getTime() + 
        Math.random() * (threeMonthsFromNow.getTime() - threeMonthsAgo.getTime())
      );
      
      // Random duration between 1-14 days
      const duration = Math.floor(Math.random() * 14) + 1;
      const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
      
      const priceType = priceTypes[Math.floor(Math.random() * priceTypes.length)];
      const pricePerDay = Math.floor(Math.random() * 100) + 80; // 80-180 per day
      const totalPrice = priceType === 'DAILY' ? duration * pricePerDay : pricePerDay;
      
      bookingsData.push({
        dogId: randomDog.id,
        roomId: randomRoom.id,
        ownerId: randomOwner.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        priceType: priceType,
        pricePerDay: pricePerDay,
        totalPrice: totalPrice,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        exemptLastDay: Math.random() > 0.8,
        tenantId: tenant.id,
      });
    }
    
    const { data: bookings, error: bookingsError } = await supabase
      .from('Booking')
      .insert(bookingsData)
      .select();
    
    if (bookingsError) throw bookingsError;
    console.log(`✅ Created ${bookings.length} bookings`);
    
    // 5. Create Payments
    console.log('\n💰 Creating payments...');
    const paymentsData = [];
    
    bookings.forEach((booking) => {
      // 80% of bookings have payments
      if (Math.random() > 0.2) {
        const startDate = new Date(booking.startDate);
        const endDate = new Date(booking.endDate);
        const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        const amount = booking.totalPrice || (days * 120); // Use booking total or fallback
        
        paymentsData.push({
          bookingId: booking.id,
          amount: amount,
          method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          tenantId: tenant.id,
        });
      }
    });
    
    const { data: payments, error: paymentsError } = await supabase
      .from('Payment')
      .insert(paymentsData)
      .select();
    
    if (paymentsError) throw paymentsError;
    console.log(`✅ Created ${payments.length} payments`);
    
    // 6. Create Notification Templates
    console.log('\n📨 Creating notification templates...');
    const templatesData = [
      {
        name: 'Booking Confirmation',
        trigger: 'BOOKING_CONFIRMATION',
        subject: 'Booking Confirmed - {{dogName}} at {{businessName}}',
        body: 'Hi {{ownerName}},\n\nYour booking for {{dogName}} has been confirmed!\n\nDates: {{startDate}} to {{endDate}}\nRoom: {{roomName}}\n\nThank you for choosing {{businessName}}!',
        active: true,
        delayHours: 0,
        description: 'Sent when a booking is confirmed',
        tenantId: tenant.id,
      },
      {
        name: 'Check-in Reminder',
        trigger: 'CHECK_IN_REMINDER',
        subject: 'Check-in Reminder - {{dogName}}',
        body: 'Hi {{ownerName}},\n\nThis is a reminder that {{dogName}}\'s check-in is tomorrow at {{businessName}}.\n\nPlease bring:\n- Vaccination records\n- Food and treats\n- Any medications\n\nSee you soon!',
        active: true,
        delayHours: 24,
        description: 'Sent 24 hours before check-in',
        tenantId: tenant.id,
      },
      {
        name: 'Payment Reminder',
        trigger: 'PAYMENT_REMINDER',
        subject: 'Payment Reminder - {{businessName}}',
        body: 'Hi {{ownerName}},\n\nWe hope {{dogName}} enjoyed their stay!\n\nYour payment of {{amount}} {{currency}} is now due.\n\nPlease contact us to arrange payment.\n\nThank you!',
        active: true,
        delayHours: 0,
        description: 'Sent when payment is overdue',
        tenantId: tenant.id,
      },
    ];
    
    const { data: templates, error: templatesError } = await supabase
      .from('NotificationTemplate')
      .insert(templatesData)
      .select();
    
    if (templatesError) throw templatesError;
    console.log(`✅ Created ${templates.length} notification templates`);
    
    console.log('\n🎉 Demo data generation completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${rooms.length} rooms`);
    console.log(`- ${owners.length} owners`);
    console.log(`- ${dogs.length} dogs`);
    console.log(`- ${bookings.length} bookings`);
    console.log(`- ${payments.length} payments`);
    console.log(`- ${templates.length} notification templates`);
    console.log('\n✨ Your kennel management system is now populated with realistic demo data!');
    
  } catch (error) {
    console.error('\n❌ Error generating demo data:', error);
    process.exit(1);
  }
}

generateDemoData(); 