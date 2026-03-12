const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function fixPhotoMigration() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('Bharat-Stay');
    const staysCollection = db.collection('HostDashBoardStay');
    const photosCollection = db.collection('stayphotos');

    // Clear existing StayPhoto documents (start fresh)
    await photosCollection.deleteMany({});
    console.log('🧹 Cleared existing StayPhoto documents\n');

    // Get actual files on disk
    const uploadsDir = path.join(__dirname, 'uploads', 'stay-photos');
    const files = fs.readdirSync(uploadsDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    
    console.log(`💾 Found ${files.length} files on disk:`);
    files.forEach(f => {
      const stats = fs.statSync(path.join(uploadsDir, f));
      console.log(`   - ${f} (${Math.round(stats.size/1024)}KB)`);
    });
    console.log();

    // Get all stays
    const stays = await staysCollection.find({}).toArray();
    console.log(`🏠 Found ${stays.length} stays\n`);

    // Distribute files among stays evenly
    let fileIndex = 0;
    
    for (const stay of stays) {
      console.log(`📸 Processing "${stay.stayName}" (${stay._id})`);
      
      // Assign 2-3 photos per stay
      const photosPerStay = Math.min(3, Math.ceil(files.length / stays.length));
      const stayFiles = [];
      
      for (let i = 0; i < photosPerStay && fileIndex < files.length; i++) {
        const filename = files[fileIndex++];
        const stats = fs.statSync(path.join(uploadsDir, filename));
        
        // Create StayPhoto document
        const photoDoc = {
          stayId: new ObjectId(stay._id),
          hostId: stay.hostId ? new ObjectId(stay.hostId) : null,
          filename: filename,
          originalName: filename,
          mimeType: 'image/jpeg',
          size: stats.size,
          category: i === 0 ? 'bedroom' : i === 1 ? 'hall' : 'exterior',
          caption: '',
          isPrimary: i === 0,
          displayOrder: i,
          url: `http://localhost:5000/uploads/stay-photos/${filename}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await photosCollection.insertOne(photoDoc);
        stayFiles.push(filename);
        console.log(`   ✅ Added ${filename}`);
      }

      // Update stay with correct photo filenames
      await staysCollection.updateOne(
        { _id: stay._id },
        { $set: { photos: stayFiles } }
      );
      
      console.log(`   📝 Updated stay with ${stayFiles.length} photos\n`);
    }

    // Verify
    const totalPhotos = await photosCollection.countDocuments();
    console.log('='.repeat(50));
    console.log('🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(`   Total StayPhoto documents: ${totalPhotos}`);
    console.log(`   Files processed: ${fileIndex}/${files.length}`);
    
    // Show summary
    const allPhotos = await photosCollection.find({}).toArray();
    const byStay = {};
    allPhotos.forEach(p => {
      const sid = p.stayId.toString();
      if (!byStay[sid]) byStay[sid] = [];
      byStay[sid].push(p.filename);
    });
    
    console.log('\n📊 Summary:');
    for (const [stayId, filenames] of Object.entries(byStay)) {
      const stay = stays.find(s => s._id.toString() === stayId);
      console.log(`   ${stay?.stayName || stayId}: ${filenames.length} photos`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('\n🔌 Disconnected');
  }
}

fixPhotoMigration().catch(console.error);
