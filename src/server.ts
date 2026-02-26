import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import connectDB from "./config/database";

import hostRoutes from "./routes/hostRoutes";
import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
import stayRoutes from "./routes/stayRoutes";
import bookingRoutes from "./routes/bookingRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import payoutRoutes from "./routes/payoutRoutes";
import promotionRoutes from "./routes/promotionRoutes";
import placesRoutes from "./routes/placesRoutes";
import hostBankDetailsRoutes from "./routes/hostBankDetailsRoutes";
import hostDashboardStayRoutes from "./routes/hostDashboardStayRoutes";
import hostDetailsRoutes from "./routes/hostDetailsRoutes";
import contactRoutes from "./routes/contact";
import referralRoutes from "./routes/referralRoutes";
import upiRoutes from "./routes/upiRoutes";
import customerReferralRoutes from "./routes/customerReferralRoutes";
import adminConsoleRoutes from "./routes/adminConsoleRoutes";
import adminDashboardRoutes from "./routes/adminDashboardRoutes";
import adminHostManagementRoutes from "./routes/adminHostManagementRoutes";
import adminPropertyManagementRoutes from "./routes/adminPropertyManagementRoutes";
import adminBookingManagementRoutes from "./routes/adminBookingManagementRoutes";
import adminCommissionRoutes from "./routes/adminCommissionRoutes";
import adminPayoutRoutes from "./routes/adminPayoutRoutes";
import adminUserManagementRoutes from "./routes/adminUserManagementRoutes";
import adminDisputeRoutes from "./routes/adminDisputeRoutes";
import adminContentRoutes from "./routes/adminContentRoutes";
import adminSettingsRoutes from "./routes/adminSettingsRoutes";

dotenv.config();

const app: Express = express();

// Middleware
app.use(
  cors({
    origin: [
      "https://www.bharat-stay.com", 
      "https://bharat-stay.com",
      "https://bharatstay.netlify.app",
      "https://bharatstay.vercel.app",
      "http://localhost:8080", 
      "http://localhost:8081", 
      "http://localhost:8082", 
      "http://localhost:8084", 
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB().catch((err) => {
  console.error("DB Error:", err);
  console.log("Continuing without database connection...");
  // Don't exit process, continue running but with limited functionality
});

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// In development, serve frontend static files if they exist
if (process.env.NODE_ENV !== 'production') {
  const frontendDistPath = path.join(__dirname, '../../app/dist');
  app.use(express.static(frontendDistPath));
}

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({ ok: true, message: "BharatStay API running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/host", hostRoutes);
app.use("/api/user", userRoutes);
app.use("/api/stay", stayRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payout", payoutRoutes);
app.use("/api/promotion", promotionRoutes);
app.use("/api/places", placesRoutes);
app.use("/api/host-dashboard-stay", hostDashboardStayRoutes);
app.use("/api/host-bank-details", hostBankDetailsRoutes);
app.use("/api/host-details", hostDetailsRoutes);
app.use("/api/referral", referralRoutes);
app.use("/api/upi", upiRoutes);
app.use("/api/customer-referral", customerReferralRoutes);
app.use("/api/admin-console", adminConsoleRoutes);
app.use("/api/admin-dashboard", adminDashboardRoutes);
app.use("/api/admin-host-management", adminHostManagementRoutes);
app.use("/api/admin-property-management", adminPropertyManagementRoutes);
app.use("/api/admin-booking-management", adminBookingManagementRoutes);
app.use("/api/admin-commission", adminCommissionRoutes);
app.use("/api/admin-payout-management", adminPayoutRoutes);
app.use("/api/admin-user-management", adminUserManagementRoutes);
app.use("/api/admin-dispute-management", adminDisputeRoutes);
app.use("/api/admin-content-management", adminContentRoutes);
app.use("/api/admin-settings", adminSettingsRoutes);
app.use("/api", contactRoutes);

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "BharatStay Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Admin Console Routes - All 10 sections complete

// Test endpoint for debugging
app.get("/api/test-admin", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Admin routes test endpoint working",
    timestamp: new Date().toISOString(),
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start Server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌐 Frontend should be available at http://localhost:8080`);
});
