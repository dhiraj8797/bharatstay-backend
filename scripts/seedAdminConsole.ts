import mongoose from 'mongoose';
import { AdminConsole } from '../src/models/AdminConsole';
import dotenv from 'dotenv';

dotenv.config();

const seedAdminConsole = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatstay');
    console.log('Connected to MongoDB');

    // Clear existing admin console data (optional)
    await AdminConsole.deleteMany({});
    console.log('Cleared existing AdminConsole data');

    // Create sample admins
    const sampleAdmins = [
      {
        adminId: 'admin001',
        name: 'Super Admin',
        email: 'superadmin@bharatstay.com',
        role: 'super_admin' as const,
        permissions: [
          'manage_users',
          'manage_hosts',
          'manage_stays',
          'manage_bookings',
          'manage_reviews',
          'manage_payments',
          'view_analytics',
          'manage_settings',
          'manage_promotions',
          'manage_referrals',
          'view_reports'
        ],
        isActive: true
      },
      {
        adminId: 'admin002',
        name: 'Content Admin',
        email: 'content@bharatstay.com',
        role: 'admin' as const,
        permissions: [
          'manage_stays',
          'manage_reviews',
          'manage_promotions',
          'view_analytics'
        ],
        isActive: true
      },
      {
        adminId: 'admin003',
        name: 'Support Admin',
        email: 'support@bharatstay.com',
        role: 'moderator' as const,
        permissions: [
          'manage_bookings',
          'manage_reviews',
          'view_reports'
        ],
        isActive: true
      }
    ];

    // Insert sample admins
    const insertedAdmins = await AdminConsole.insertMany(sampleAdmins);
    console.log(`Created ${insertedAdmins.length} admin accounts:`);
    
    insertedAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.role}) - ${admin.email}`);
    });

    console.log('\nAdminConsole seeded successfully!');
    
    // Display statistics
    const totalAdmins = await AdminConsole.countDocuments();
    const activeAdmins = await AdminConsole.countDocuments({ isActive: true });
    
    console.log(`\nTotal Admins: ${totalAdmins}`);
    console.log(`Active Admins: ${activeAdmins}`);

  } catch (error) {
    console.error('Error seeding AdminConsole:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the seed function
seedAdminConsole();
