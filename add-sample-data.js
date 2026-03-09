const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bharatstay')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample stay data
const sampleStays = [
  {
    hostId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    stayName: 'Luxury Villa in Goa',
    stayType: 'Villa',
    propertyAge: 5,
    numberOfRooms: 3,
    address: '123 Beach Road',
    city: 'Goa',
    state: 'Goa',
    pincode: '403001',
    description: 'Beautiful beachfront villa with private pool and modern amenities',
    houseRules: 'No smoking, No parties',
    checkInTime: '12:00',
    checkOutTime: '11:00',
    photos: [
      'stay-1715254400-123456789.jpg',
      'stay-1715254400-234567890.jpg',
      'stay-1715254400-345678901.jpg'
    ],
    amenities: ['WiFi', 'Pool', 'Parking', 'TV', 'AC'],
    pricing: {
      basePrice: 5000,
      weekendPrice: 6000,
      festivalPrice: 7000,
      cleaningFee: 500,
      extraGuestCharge: 1000,
      securityDeposit: 5000,
      smartPricing: true
    },
    status: 'active',
    currentLocation: {
      latitude: 15.4909,
      longitude: 73.8278
    }
  },
  {
    hostId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    stayName: 'Cozy Apartment in Mumbai',
    stayType: 'Apartment',
    propertyAge: 2,
    numberOfRooms: 2,
    address: '456 City Center',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    description: 'Modern apartment with city views and easy access to business districts',
    houseRules: 'No pets after 6PM',
    checkInTime: '14:00',
    checkOutTime: '10:00',
    photos: [
      'stay-1715254400-456789012.jpg',
      'stay-1715254400-567890123.jpg'
    ],
    amenities: ['WiFi', 'Parking', 'TV', 'AC', 'Kitchen'],
    pricing: {
      basePrice: 3000,
      weekendPrice: 3500,
      festivalPrice: 4000,
      cleaningFee: 300,
      extraGuestCharge: 500,
      securityDeposit: 3000,
      smartPricing: true
    },
    status: 'active',
    currentLocation: {
      latitude: 19.0760,
      longitude: 72.8777
    }
  },
  {
    hostId: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
    stayName: 'Modern Homestay in Kerala',
    stayType: 'Homestay',
    propertyAge: 3,
    numberOfRooms: 4,
    address: '789 Backwaters Road',
    city: 'Alleppey',
    state: 'Kerala',
    pincode: '689101',
    description: 'Traditional Kerala homestay with modern amenities and authentic experience',
    houseRules: 'Check-in time strictly followed',
    checkInTime: '12:00',
    checkOutTime: '11:00',
    photos: [
      'stay-1715254400-789012345.jpg',
      'stay-1715254400-890123456.jpg',
      'stay-1715254400-901234567.jpg'
    ],
    amenities: ['WiFi', 'Parking', 'Kitchen', 'Garden', 'Power Backup'],
    pricing: {
      basePrice: 2000,
      weekendPrice: 2500,
      festivalPrice: 3000,
      cleaningFee: 200,
      extraGuestCharge: 300,
      securityDeposit: 2000,
      smartPricing: true
    },
    status: 'active',
    currentLocation: {
      latitude: 9.4980,
      longitude: 76.3388
    }
  }
];

async function addSampleData() {
  try {
    const HostDashBoardStay = require('./src/models/HostDashBoardStay').default;
    
    // Clear existing data
    await HostDashBoardStay.deleteMany({});
    console.log('Cleared existing stay data');
    
    // Add sample stays
    await HostDashBoardStay.insertMany(sampleStays);
    console.log('Added sample stays:', sampleStays.length);
    
    console.log('Sample data added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample data:', error);
    process.exit(1);
  }
}

addSampleData();
