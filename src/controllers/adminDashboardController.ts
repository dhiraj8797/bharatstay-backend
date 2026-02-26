import { Request, Response } from 'express';
import User from '../models/User';
import Host from '../models/Host';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Booking from '../models/Booking';

// Get dashboard top stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Total Users
    const totalUsers = await User.countDocuments({ isActive: true });

    // Total Hosts
    const totalHosts = await Host.countDocuments({ isActive: true });

    // Active Properties
    const activeProperties = await HostDashBoardStay.countDocuments({ status: 'active' });

    // Total Bookings
    const totalBookingsToday = await Booking.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    const totalBookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Revenue calculations
    const bookingsThisMonth = await Booking.find({
      createdAt: { $gte: startOfMonth },
      paymentStatus: 'paid'
    });

    const revenueThisMonth = bookingsThisMonth.reduce((total, booking) => {
      return total + (booking.pricing?.totalAmount || 0);
    }, 0);

    // Commission Earned (assuming 10% commission for now - this should come from settings)
    const commissionRate = 0.1; // This should be from admin settings
    const commissionThisMonth = bookingsThisMonth.reduce((total, booking) => {
      return total + ((booking.pricing?.totalAmount || 0) * commissionRate);
    }, 0);

    // Pending Verifications (Host KYC)
    const pendingVerifications = await Host.countDocuments({
      kycStatus: 'pending'
    });

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        activeProperties,
        bookings: {
          today: totalBookingsToday,
          thisMonth: totalBookingsThisMonth
        },
        revenue: {
          thisMonth: revenueThisMonth
        },
        commission: {
          earnedThisMonth: commissionThisMonth
        },
        pendingVerifications
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get bookings per day chart data
export const getBookingsPerDayChart = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const bookingsPerDay = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res.json({
      success: true,
      data: bookingsPerDay
    });
  } catch (error) {
    console.error('Error fetching bookings per day:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching bookings per day data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get revenue chart data
export const getRevenueChart = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const revenuePerDay = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt"
            }
          },
          revenue: { $sum: "$pricing.totalAmount" },
          commission: { 
            $sum: { 
              $multiply: ["$pricing.totalAmount", 0.1] 
            } 
          }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return res.json({
      success: true,
      data: revenuePerDay
    });
  } catch (error) {
    console.error('Error fetching revenue chart:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue chart data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get city-wise bookings chart
export const getCityWiseBookings = async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days as string);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);

    const cityBookings = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $lookup: {
          from: 'hostdashboardstays',
          localField: 'stayId',
          foreignField: '_id',
          as: 'stay'
        }
      },
      {
        $unwind: '$stay'
      },
      {
        $group: {
          _id: '$stay.city',
          count: { $sum: 1 },
          revenue: { $sum: '$pricing.totalAmount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    return res.json({
      success: true,
      data: cityBookings
    });
  } catch (error) {
    console.error('Error fetching city-wise bookings:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching city-wise bookings',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get property type distribution
export const getPropertyTypeDistribution = async (req: Request, res: Response) => {
  try {
    const propertyTypes = await HostDashBoardStay.aggregate([
      {
        $group: {
          _id: '$stayType',
          count: { $sum: 1 },
          active: {
            $sum: {
              $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return res.json({
      success: true,
      data: propertyTypes
    });
  } catch (error) {
    console.error('Error fetching property type distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching property type distribution',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get recent activities
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const { limit = 10 } = req.query;
    const limitNum = parseInt(limit as string);

    // Get recent bookings
    const recentBookings = await Booking.find()
      .populate('userId', 'fullName email')
      .populate('stayId', 'stayName city')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    // Get new hosts
    const newHosts = await Host.find()
      .sort({ createdAt: -1 })
      .limit(limitNum);

    // Get new properties
    const newProperties = await HostDashBoardStay.find()
      .populate('hostId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(limitNum);

    return res.json({
      success: true,
      data: {
        recentBookings,
        newHosts,
        newProperties
      }
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
