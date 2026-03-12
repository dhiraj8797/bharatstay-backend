const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkDatabase() {
  const uri = process.env.MONGO_URI;
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    // Get all databases
    const adminDb = client.db('admin');
    const dbs = await adminDb.command({ listDatabases: 1 });
    
    console.log('📚 Available databases:');
    for (const db of dbs.databases) {
      console.log(`   - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    }
    console.log();

    // Check specific database
    const dbName = 'bharatstay';
    const db = client.db(dbName);
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log(`📁 Collections in "${dbName}":`);
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`   - ${coll.name}: ${count} documents`);
    }
    console.log();

    // Check if hostdashboardstays exists with different casing
    const possibleNames = [
      'hostdashboardstays',
      'hostdashBoardstays', 
      'HostDashBoardStay',
      'hostdashboardstays',
      'stays',
      'stays'
    ];

    for (const name of possibleNames) {
      try {
        const count = await db.collection(name).countDocuments();
        if (count > 0) {
          console.log(`✅ Found stays in collection: "${name}" (${count} docs)`);
          const sample = await db.collection(name).findOne({}, { projection: { stayName: 1, photos: 1 } });
          console.log(`   Sample: ${JSON.stringify(sample, null, 2)}\n`);
        }
      } catch (e) {
        // Collection doesn't exist
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkDatabase().catch(console.error);
