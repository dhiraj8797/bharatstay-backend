import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("❌ MONGO_URI missing in .env");
  }

  try {
    // SSL options for Render environment
    const options = {
      ssl: true,
      sslValidate: true,
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    await mongoose.connect(uri, options);
    console.log("✅ MongoDB Connected");
  } catch (error: any) {
    console.log("❌ MongoDB Connection Failed:", error.message);
    console.log("🔄 Continuing in mock mode for development...");
    
    // Set a flag to indicate mock mode
    process.env.MOCK_MODE = "true";
  }
}
