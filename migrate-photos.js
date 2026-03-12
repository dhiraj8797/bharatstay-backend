const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function migratePhotos() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('bharatstay');
    const staysCollection = db.collection('hostdashboardstays');
    const photosCollection = db.collection('stayphotos');

    // Get all stays with photos in old format (array of strings)
    const stays = await staysCollection.find({
      photos: { $exists: true, $type: 'array', $ne: [] }
    }).toArray();

    console.log(`📸 Found ${stays.length} stays with photos to migrate`);

    let totalMigrated = 0;
    let totalPhotos = 0;

    for (const stay of stays) {
      const stayId = stay._id.toString();
      const hostId = stay.hostId?.toString();
      
      console.log(`\n🏠 Processing: "${stay.stayName}" (${stayId})`);
      console.log(`   Current photos: ${stay.photos.length}`);

      // Check if photos already migrated (Skip if StayPhoto documents exist)
      const existingPhotos = await photosCollection.countDocuments({ stayId: new ObjectId(stayId) });
      if (existingPhotos > 0) {
        console.log(`   ⚠️  Already migrated (${existingPhotos} photos in StayPhoto collection)`);
        continue;
      }

      // Categorize photos based on position in array
      const categories = ['bedroom', 'kitchen', 'hall', 'bathroom', 'exterior', 'amenities', 'other'];
      const photosPerCategory = Math.ceil(stay.photos.length / categories.length);

      for (let i = 0; i < stay.photos.length; i++) {
        const filename = stay.photos[i];
        
        // Skip if already a StayPhoto reference
        if (typeof filename !== 'string') {
          console.log(`   ⚠️  Skipping non-string photo at index ${i}`);
          continue;
        }

        // Determine category based on position
        const categoryIndex = Math.floor(i / photosPerCategory);
        const category = categories[Math.min(categoryIndex, categories.length - 1)];

        // Create StayPhoto document
        const photoDoc = {
          stayId: new ObjectId(stayId),
          hostId: hostId ? new ObjectId(hostId) : null,
          filename: filename,
          originalName: filename,
          mimeType: 'image/jpeg', // Default assumption
          size: 0, // Unknown for existing photos
          category: category,
          caption: '',
          isPrimary: i === 0, // First photo is primary
          displayOrder: i,
          url: `/uploads/stay-photos/${filename}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        try {
          await photosCollection.insertOne(photoDoc);
          totalPhotos++;
        } catch (err) {
          console.log(`   ❌ Failed to insert photo ${filename}:`, err.message);
        }
      }

      totalMigrated++;
      console.log(`   ✅ Migrated ${stay.photos.length} photos`);
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`   Stays processed: ${totalMigrated}`);
    console.log(`   Photos migrated: ${totalPhotos}`);

    // Verify migration
    const totalInNewCollection = await photosCollection.countDocuments();
    console.log(`\n📊 Total photos in StayPhoto collection: ${totalInNewCollection}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration
migratePhotos().catch(console.error);
