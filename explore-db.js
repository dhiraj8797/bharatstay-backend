const { MongoClient } = require('mongodb');
require('dotenv').config();

async function exploreDB() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected\n');

    const db = client.db('Bharat-Stay');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections in Bharat-Stay (${collections.length} total):`);
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} docs`);
      
      // If collection has documents, show a sample
      if (count > 0) {
        const sample = await db.collection(coll.name).findOne({}, { 
          projection: { stayName: 1, title: 1, name: 1, email: 1, createdAt: 1 } 
        });
        if (sample) {
          const preview = sample.stayName || sample.title || sample.name || sample.email || 'doc';
          console.log(`     Sample: "${preview.substring(0, 40)}"`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

exploreDB().catch(console.error);
