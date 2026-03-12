const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function fixPhotoReferences() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all files in uploads folder
    const uploadsDir = path.join(__dirname, 'uploads', 'stay-photos');
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log('Found files:', files);

    // Get HostDashBoardStay model
    const HostDashBoardStay = require('./src/models/HostDashBoardStay').default;

    // Get all stays
    const stays = await HostDashBoardStay.find({});
    console.log(`Found ${stays.length} stays`);

    // Update each stay with actual photo files
    for (let i = 0; i < stays.length && i < files.length; i++) {
      const stay = stays[i];
      const photoFiles = files.slice(i * 5, (i + 1) * 5); // Assign 5 photos per stay
      
      console.log(`Updating stay ${stay.stayName} with photos:`, photoFiles);
      
      await HostDashBoardStay.findByIdAndUpdate(stay._id, {
        photos: photoFiles
      });
    }

    console.log('Photo references updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixPhotoReferences();
