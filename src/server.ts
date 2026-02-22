import express, { Express, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";

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
  process.exit(1);
});

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

app.use("/uploads", express.static("uploads"));

// Health Check
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "BharatStay Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
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

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
});
