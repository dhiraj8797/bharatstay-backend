import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Booking from '../models/Booking';
import HostSignUp from '../models/HostSignUp';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Admin login
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    // Find admin by email
    const admin = await Admin.findOne({ email, isActive: true });

    if (!admin) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
    return;
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get counts
    const totalStays = await HostDashBoardStay.countDocuments();
    const activeStays = await HostDashBoardStay.countDocuments({ status: 'active' });
    const pendingStays = await HostDashBoardStay.countDocuments({ status: 'pending' });
    const totalHosts = await HostSignUp.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Get recent bookings
    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get recent stays
    const recentStays = await HostDashBoardStay.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      stats: {
        totalStays,
        activeStays,
        pendingStays,
        totalHosts,
        totalBookings,
        pendingBookings,
        recentBookings,
        recentStays,
      },
    });
    return;
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get all stays (admin view)
export const getAllStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const stays = await HostDashBoardStay.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await HostDashBoardStay.countDocuments(query);

    res.json({
      success: true,
      stays,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all stays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stays',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Update stay status
export const updateStayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;
    const { status } = req.body;

    if (!['active', 'pending', 'rejected', 'inactive'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
      return;
    }

    const stay = await HostDashBoardStay.findByIdAndUpdate(
      stayId,
      { status, updatedAt: new Date() },
      { new: true }
    );

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Stay status updated',
      stay,
    });
    return;
  } catch (error) {
    console.error('Update stay status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stay status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get all bookings
export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get all hosts
export const getAllHosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const hosts = await HostSignUp.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await HostSignUp.countDocuments();

    res.json({
      success: true,
      hosts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all hosts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hosts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Create initial admin (for setup)
export const createInitialAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    // Check if any admin exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      res.status(400).json({
        success: false,
        message: 'Initial admin already exists. Use admin panel to create more.',
      });
      return;
    }

    const admin = new Admin({
      email,
      password,
      fullName,
      role: 'superadmin',
    });

    await admin.save();

    res.json({
      success: true,
      message: 'Initial admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });
    return;
  } catch (error) {
    console.error('Create initial admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
