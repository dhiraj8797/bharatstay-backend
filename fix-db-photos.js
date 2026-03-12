const { MongoClient } = require('mongodb');
require('dotenv').config();

async function fixPhotoReferences() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('bharatstay');
    const stays = db.collection('hostdashboardstays');

    // Get all stays
    const allStays = await stays.find({}).toArray();
    console.log(`Found ${allStays.length} stays`);

    // Actual files on disk
    const actualFiles = [
      'stay-1771779262346-164554735.jpg',
      'stay-1771779262349-934533174.jpg',
      'stay-1771779262359-335209556.jpg',
      'stay-1771779262364-50148930.jpg',
      'stay-1771779262369-46527424.jpg'
    ];

    // Update each stay with correct photos
    for (let i = 0; i < allStays.length; i++) {
      const stay = allStays[i];
      const photos = actualFiles.slice(i * 2, (i * 2) + 3); // 3 photos per stay
      
      console.log(`Updating "${stay.stayName}" with photos:`, photos);
      
      await stays.updateOne(
        { _id: stay._id },
        { $set: { photos: photos } }
      );
    }

    console.log('✅ All photo references updated!');
    
    // Verify
    const verify = await stays.find({}).toArray();
    verify.forEach(s => console.log(`${s.stayName}: ${s.photos?.length || 0} photos`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixPhotoReferences();
