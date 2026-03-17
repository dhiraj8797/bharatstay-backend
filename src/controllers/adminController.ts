import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Booking from '../models/Booking';
import HostSignUp from '../models/HostSignUp';
import Payment from '../models/Payment';
import GuestSignUp from '../models/UserSignUp';
import Review from '../models/Review';
import ActivityLog from '../models/ActivityLog';
import Promotion from '../models/Promotion';
import EmailTemplate from '../models/EmailTemplate';

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

    // Populate host data manually since HostDashBoardStay doesn't have a ref
    const populatedStays = await Promise.all(
      stays.map(async (stay) => {
        const host = await HostSignUp.findById(stay.hostId).select('fullName email phone createdAt').lean();
        return {
          ...stay,
          host: host || null,
        };
      })
    );

    const total = await HostDashBoardStay.countDocuments(query);

    res.json({
      success: true,
      stays: populatedStays,
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

// Search bookings by ID, guest email, or guest name
export const searchBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
    }

    const searchRegex = new RegExp(q, 'i');
    const isObjectId = /^[a-f\d]{24}$/i.test(q);

    const query: any = {
      $or: [
        { 'guestId.email': searchRegex },
        { 'guestId.fullName': searchRegex },
        { 'stayId.stayName': searchRegex },
      ],
    };

    // If query looks like an ObjectId, also search by _id
    if (isObjectId) {
      query.$or.push({ _id: q });
    }

    const bookings = await Booking.find(query)
      .populate('stayId', 'stayName city state')
      .populate('hostId', 'fullName email phone')
      .populate('guestId', 'fullName email phone')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({
      success: true,
      bookings,
      count: bookings.length,
    });
    return;
  } catch (error) {
    console.error('Search bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search bookings',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
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

// Get all guests
export const getAllGuests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query: any = {};
    if (search) {
      const searchRegex = new RegExp(search as string, 'i');
      query.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    const guests = await GuestSignUp.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    // Get booking count for each guest
    const guestsWithStats = await Promise.all(
      guests.map(async (guest) => {
        const bookingCount = await Booking.countDocuments({ guestId: guest._id });
        const totalSpent = await Booking.aggregate([
          { $match: { guestId: guest._id, status: { $nin: ['cancelled'] } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]);
        return {
          ...guest,
          bookingCount,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    const total = await GuestSignUp.countDocuments(query);

    res.json({
      success: true,
      guests: guestsWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all guests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch guests',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
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

// Get all payments
export const getAllPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }

    const payments = await Payment.find(query)
      .populate('bookingId', 'checkInDate checkOutDate')
      .populate('stayId', 'stayName city')
      .populate('hostId', 'fullName email')
      .populate('guestId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Payment.countDocuments(query);

    // Calculate totals
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const totalRefunds = await Payment.aggregate([
      { $match: { status: { $in: ['refunded', 'partially_refunded'] } } },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]);

    res.json({
      success: true,
      payments,
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        totalRefunds: totalRefunds[0]?.total || 0,
        netRevenue: (totalRevenue[0]?.total || 0) - (totalRefunds[0]?.total || 0),
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get all refunds
export const getAllRefunds = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, refundStatus } = req.query;

    const query: any = {
      status: { $in: ['refunded', 'partially_refunded'] },
    };
    if (refundStatus) {
      query.refundStatus = refundStatus;
    }

    const refunds = await Payment.find(query)
      .populate('bookingId', 'checkInDate checkOutDate')
      .populate('stayId', 'stayName city')
      .populate('hostId', 'fullName email')
      .populate('guestId', 'fullName email')
      .sort({ refundedAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Payment.countDocuments(query);

    // Calculate refund stats
    const refundStats = await Payment.aggregate([
      { $match: { status: { $in: ['refunded', 'partially_refunded'] } } },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      refunds,
      summary: {
        totalRefunded: refundStats[0]?.totalRefunded || 0,
        totalCount: refundStats[0]?.count || 0,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all refunds error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refunds',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Process refund
export const processRefund = async (req: Request, res: Response): Promise<void> => {
  try {
    const { paymentId } = req.params;
    const { refundAmount, refundReason } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
      return;
    }

    if (payment.status === 'refunded') {
      res.status(400).json({
        success: false,
        message: 'Payment already fully refunded',
      });
      return;
    }

    // Validate refund amount
    const maxRefundAmount = payment.amount - (payment.refundAmount || 0);
    if (refundAmount > maxRefundAmount) {
      res.status(400).json({
        success: false,
        message: `Refund amount cannot exceed ₹${maxRefundAmount}`,
      });
      return;
    }

    // Update payment
    payment.refundAmount = (payment.refundAmount || 0) + refundAmount;
    payment.refundReason = refundReason;
    payment.refundStatus = 'processed';
    payment.refundedAt = new Date();

    // Update status
    if ((payment.refundAmount || 0) >= payment.amount) {
      payment.status = 'refunded';
    } else {
      payment.status = 'partially_refunded';
    }

    await payment.save();

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.bookingId, {
      paymentStatus: payment.status,
      refundAmount: payment.refundAmount,
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      payment,
    });
    return;
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get payment statistics
export const getPaymentStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Daily revenue for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          paidAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Payment methods breakdown
    const paymentMethods = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
        },
      },
    ]);

    // Overall stats
    const overallStats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
          totalRefunded: { $sum: '$refundAmount' },
          pendingPayments: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          failedPayments: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        dailyRevenue,
        paymentMethods,
        overall: overallStats[0] || {},
      },
    });
    return;
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
// Get all reviews
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, reported } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (reported === 'true') query.reported = true;

    const reviews = await Review.find(query)
      .populate('stayId', 'stayName city state')
      .populate('hostId', 'fullName email')
      .populate('guestId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Update review status
export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewId } = req.params;
    const { status } = req.body;

    if (!['active', 'hidden', 'removed'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { status },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Review not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Review status updated successfully',
      review,
    });
    return;
  } catch (error) {
    console.error('Update review status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get revenue statistics
export const getRevenueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { period = 'monthly' } = req.query;

    let groupBy: any;
    let format: string;

    switch (period) {
      case 'daily':
        groupBy = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
        format = '%Y-%m-%d';
        break;
      case 'weekly':
        groupBy = { $week: '$createdAt' };
        format = 'week';
        break;
      case 'monthly':
      default:
        groupBy = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
        format = '%Y-%m';
        break;
    }

    // Revenue by period
    const revenueByPeriod = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Revenue by stay
    const revenueByStay = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
        },
      },
      {
        $group: {
          _id: '$stayId',
          revenue: { $sum: '$amount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Populate stay details
    const revenueByStayWithDetails = await Promise.all(
      revenueByStay.map(async (item) => {
        const stay = await HostDashBoardStay.findById(item._id).select('stayName city').lean();
        return {
          ...item,
          stayName: stay?.stayName || 'Unknown Stay',
          city: stay?.city || '',
        };
      })
    );

    res.json({
      success: true,
      stats: {
        revenueByPeriod,
        revenueByStay: revenueByStayWithDetails,
      },
    });
    return;
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue stats',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get activity logs
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, adminId, action } = req.query;

    const query: any = {};
    if (adminId) query.adminId = adminId;
    if (action) query.action = action;

    const logs = await ActivityLog.find(query)
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await ActivityLog.countDocuments(query);

    res.json({
      success: true,
      logs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Create activity log
export const createActivityLog = async (adminId: string, action: string, details: any): Promise<void> => {
  try {
    await ActivityLog.create({
      adminId,
      action,
      details,
      ipAddress: '',
    });
  } catch (error) {
    console.error('Create activity log error:', error);
  }
};

// Get all promo codes
export const getAllPromoCodes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, active } = req.query;

    const query: any = {};
    if (active === 'true') {
      query.validFrom = { $lte: new Date() };
      query.validUntil = { $gte: new Date() };
    }

    const promos = await Promotion.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .lean();

    const total = await Promotion.countDocuments(query);

    res.json({
      success: true,
      promos,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
    return;
  } catch (error) {
    console.error('Get all promo codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promo codes',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Create promo code
export const createPromoCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, title, description, discountType, discount, validFrom, validTo, maxUsage, minBookingAmount } = req.body;
    
    console.log('Create promo request body:', req.body);

    // Check if code already exists
    const existingPromo = await Promotion.findOne({ code: code.toUpperCase() });
    if (existingPromo) {
      res.status(400).json({
        success: false,
        message: 'Promo code already exists',
      });
      return;
    }

    const promoData = {
      code: code.toUpperCase(),
      title: title || code,
      description,
      discountType,
      discount,
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      maxUsage: maxUsage || null,
      minBookingAmount: minBookingAmount || 0,
      usedCount: 0,
      active: true,
    };
    
    console.log('Creating promo with data:', promoData);

    const promo = await Promotion.create(promoData);

    res.json({
      success: true,
      message: 'Promo code created successfully',
      promo,
    });
    return;
  } catch (error) {
    console.error('Create promo code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create promo code',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Update promo code status
export const updatePromoCodeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { promoId } = req.params;
    const { active } = req.body;

    const promo = await Promotion.findByIdAndUpdate(
      promoId,
      { active },
      { new: true }
    );

    if (!promo) {
      res.status(404).json({
        success: false,
        message: 'Promo code not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Promo code status updated successfully',
      promo,
    });
    return;
  } catch (error) {
    console.error('Update promo code status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update promo code status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Get all email templates
export const getAllEmailTemplates = async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = await EmailTemplate.find()
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      templates,
    });
    return;
  } catch (error) {
    console.error('Get all email templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email templates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};

// Update email template
export const updateEmailTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { templateId } = req.params;
    const { subject, body, isActive } = req.body;

    const template = await EmailTemplate.findByIdAndUpdate(
      templateId,
      { subject, body, isActive, updatedAt: new Date() },
      { new: true }
    );

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Email template not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Email template updated successfully',
      template,
    });
    return;
  } catch (error) {
    console.error('Update email template error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return;
  }
};
