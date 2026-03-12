const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function checkAndSeedPhotos() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('Bharat-Stay');
    const staysCollection = db.collection('HostDashBoardStay');
    const photosCollection = db.collection('stayphotos');

    // Check current stays
    const stays = await staysCollection.find({}).toArray();
    console.log(`📋 Found ${stays.length} stays:\n`);
    
    for (const stay of stays) {
      console.log(`🏠 "${stay.stayName}"`);
      console.log(`   ID: ${stay._id}`);
      console.log(`   Host: ${stay.hostId}`);
      console.log(`   Photos in stay: ${stay.photos?.length || 0}`);
      if (stay.photos?.length > 0) {
        console.log(`   Photo samples: ${stay.photos.slice(0, 3).join(', ')}`);
      }
      console.log();
    }

    // Check existing StayPhoto documents
    const existingPhotos = await photosCollection.countDocuments();
    console.log(`📸 Photos in StayPhoto collection: ${existingPhotos}\n`);

    // Get actual files on disk
    const uploadsDir = path.join(__dirname, 'uploads', 'stay-photos');
    if (!fs.existsSync(uploadsDir)) {
      console.log('❌ Uploads directory not found');
      return;
    }

    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    console.log(`💾 Files on disk: ${files.length}`);
    files.forEach(f => console.log(`   - ${f}`));
    console.log();

    // If no stays have photos but files exist on disk, create entries
    if (stays.length > 0 && files.length > 0 && existingPhotos === 0) {
      console.log('🔄 Creating StayPhoto entries for existing files...\n');
      
      // Distribute files among stays
      for (let i = 0; i < stays.length; i++) {
        const stay = stays[i];
        const stayFiles = files.slice(i * 3, (i + 1) * 3); // 3 photos per stay
        
        if (stayFiles.length === 0) break;

        console.log(`🏠 "${stay.stayName}": Assigning ${stayFiles.length} photos`);

        for (let j = 0; j < stayFiles.length; j++) {
          const filename = stayFiles[j];
          const stats = fs.statSync(path.join(uploadsDir, filename));
          
          const photoDoc = {
            stayId: new ObjectId(stay._id),
            hostId: stay.hostId ? new ObjectId(stay.hostId) : null,
            filename: filename,
            originalName: filename,
            mimeType: 'image/jpeg',
            size: stats.size,
            category: j === 0 ? 'bedroom' : j === 1 ? 'hall' : 'exterior',
            caption: '',
            isPrimary: j === 0,
            displayOrder: j,
            url: `http://localhost:5000/uploads/stay-photos/${filename}`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await photosCollection.insertOne(photoDoc);
          console.log(`   ✅ ${filename} (${Math.round(stats.size/1024)}KB)`);
        }

        // Also update the stay's photos array with correct filenames
        await staysCollection.updateOne(
          { _id: stay._id },
          { $set: { photos: stayFiles } }
        );
      }

      // Verify
      const finalCount = await photosCollection.countDocuments();
      console.log(`\n🎉 Done! Created ${finalCount} StayPhoto documents`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected');
  }
}

checkAndSeedPhotos().catch(console.error);
