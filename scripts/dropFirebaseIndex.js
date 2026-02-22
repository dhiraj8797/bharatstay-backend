const mongoose = require('mongoose');
require('dotenv').config();

async function dropFirebaseIndex() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('Details_User');

    // Drop the firebaseUid index
    await collection.dropIndex('firebaseUid_1');
    console.log('✅ Successfully dropped firebaseUid_1 index from Details_User collection');

    // Also drop from Details_Host if it exists
    try {
      const hostCollection = db.collection('Details_Host');
      await hostCollection.dropIndex('firebaseUid_1');
      console.log('✅ Successfully dropped firebaseUid_1 index from Details_Host collection');
    } catch (error) {
      console.log('⚠️  firebaseUid_1 index not found in Details_Host or already dropped');
    }

  } catch (error) {
    console.error('❌ Error dropping index:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

dropFirebaseIndex();
