// Migration script to update existing stays with host names
const mongoose = require('mongoose');

async function migrateStays() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bharatstay');
  
  const Stay = mongoose.model('Stay', new mongoose.Schema({
    hostId: mongoose.Schema.Types.ObjectId,
    hostName: String,
    stayName: String
  }, { strict: false }));
  
  const HostSignUp = mongoose.model('HostSignUp', new mongoose.Schema({
    fullName: String
  }, { strict: false }));
  
  // Get all stays without hostName
  const stays = await Stay.find({ $or: [{ hostName: { $exists: false } }, { hostName: null }, { hostName: 'Property Host' }] });
  
  console.log(`Found ${stays.length} stays to update`);
  
  for (const stay of stays) {
    if (stay.hostId) {
      const host = await HostSignUp.findById(stay.hostId);
      if (host && host.fullName) {
        stay.hostName = host.fullName;
        await stay.save();
        console.log(`Updated: ${stay.stayName} -> Host: ${host.fullName}`);
      }
    }
  }
  
  console.log('Migration complete!');
  process.exit(0);
}

migrateStays().catch(err => {
  console.error(err);
  process.exit(1);
});
