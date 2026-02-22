const mongoose = require('mongoose');
require('dotenv').config();

async function cleanupFirebaseData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Clean up Details_Host collection
    const hostCollection = db.collection('Details_Host');
    const hostResult = await hostCollection.updateMany(
      { firebaseUid: null },
      { $unset: { firebaseUid: "" } }
    );
    console.log(`✅ Updated ${hostResult.modifiedCount} host documents`);

    // Clean up Details_User collection  
    const userCollection = db.collection('Details_User');
    const userResult = await userCollection.updateMany(
      { firebaseUid: null },
      { $unset: { firebaseUid: "" } }
    );
    console.log(`✅ Updated ${userResult.modifiedCount} user documents`);

    console.log('🎉 Firebase data cleanup completed successfully');

  } catch (error) {
    console.error('❌ Error cleaning up data:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

cleanupFirebaseData();
