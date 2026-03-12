const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

async function checkStayPhotos() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db('Bharat-Stay');
    const photosCollection = db.collection('stayphotos');
    const staysCollection = db.collection('HostDashBoardStay');

    // Check all stays
    const stays = await staysCollection.find({}).toArray();
    console.log(`📋 Found ${stays.length} stays:\n`);

    for (const stay of stays) {
      console.log(`🏠 "${stay.stayName}" (${stay._id})`);
      
      // Check photos for this stay
      const photos = await photosCollection.find({ 
        stayId: new ObjectId(stay._id.toString()) 
      }).toArray();
      
      console.log(`   📸 ${photos.length} photos in StayPhoto collection`);
      
      if (photos.length > 0) {
        photos.forEach((p, i) => {
          console.log(`   ${i+1}. ${p.filename} | cat: ${p.category} | url: ${p.url}`);
        });
      }
      console.log();
    }

    // Show all photos in collection
    const allPhotos = await photosCollection.find({}).toArray();
    console.log(`\n📊 Total photos in stayphotos collection: ${allPhotos.length}`);
    
    if (allPhotos.length > 0) {
      console.log('\nAll photos:');
      allPhotos.forEach(p => {
        console.log(`  - ${p.filename} | stay: ${p.stayId} | cat: ${p.category}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkStayPhotos().catch(console.error);
