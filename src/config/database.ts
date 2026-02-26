import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("❌ MONGO_URI missing in .env");
  }

  try {
    // Enhanced SSL and connection options for better DNS handling
    const options = {
      ssl: true,
      sslValidate: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000, // Increased timeout
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      // Add DNS timeout options
      family: 4, // Force IPv4
      // Additional retry options
      retryWrites: true,
      w: 'majority' as const,
      // Handle connection failures gracefully
      autoIndex: false, // Disable auto-indexing in production
    };

    // First attempt with original URI
    await mongoose.connect(uri, options);
    console.log("✅ MongoDB Connected");
  } catch (error: any) {
    console.log("❌ MongoDB Connection Failed:", error.message);
    
    // Handle specific DNS errors
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.log("🔧 DNS Resolution Issue Detected");
      console.log("💡 Possible Solutions:");
      console.log("   1. Check your internet connection");
      console.log("   2. Try using direct MongoDB connection string");
      console.log("   3. Check if MongoDB Atlas is accessible");
      console.log("   4. Verify your MongoDB Atlas cluster is running");
    }
    
    console.log("🔄 Continuing in mock mode for development...");
    
    // Set a flag to indicate mock mode
    process.env.MOCK_MODE = "true";
    
    // Don't throw error, allow app to continue in mock mode
    return;
  }
}
