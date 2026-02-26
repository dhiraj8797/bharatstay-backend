import { Request, Response } from 'express';
import User from '../models/User';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Booking from '../models/Booking';

// Get admin dashboard stats
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const [
      totalUsers,
      totalHosts,
      totalStays,
      totalBookings,
      pendingApprovals,
      activeStays,
      inactiveStays
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'host' }),
      HostDashBoardStay.countDocuments(),
      Booking.countDocuments(),
      HostDashBoardStay.countDocuments({ status: 'pending' }),
      HostDashBoardStay.countDocuments({ status: 'approved' }),
      HostDashBoardStay.countDocuments({ status: 'suspended' })
    ]);

    // Calculate total revenue from confirmed bookings
    const bookings = await Booking.find({ status: 'confirmed' });
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.get('totalAmount') || 0), 0);
    
    // Calculate commission earned at 6%
    const commissionEarned = totalRevenue * 0.06;

    return res.json({
      success: true,
      stats: {
        totalUsers,
        totalHosts,
        totalStays,
        totalBookings,
        totalRevenue,
        commissionEarned,
        pendingApprovals,
        activeStays,
        inactiveStays
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ success: false, message: 'Error fetching stats' });
  }
};

// Get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: 'Error fetching users' });
  }
};

// Get all stays
export const getAllStays = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const stays = await HostDashBoardStay.find()
      .populate('hostId', 'name email')
      .sort({ createdAt: -1 });

    // Transform stays to include host name and booking count
    const transformedStays = await Promise.all(stays.map(async (stay) => {
      const bookingCount = await Booking.countDocuments({ stayId: stay._id });
      const host = stay.hostId as any;
      return {
        ...stay.toObject(),
        hostName: host?.name || 'Unknown',
        bookings: bookingCount
      };
    }));

    return res.json({
      success: true,
      stays: transformedStays
    });
  } catch (error) {
    console.error('Error fetching stays:', error);
    return res.status(500).json({ success: false, message: 'Error fetching stays' });
  }
};

// Get all bookings
export const getAllBookings = async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const bookings = await Booking.find()
      .populate('stayId', 'stayName')
      .populate('guestId', 'name email')
      .sort({ createdAt: -1 });

    // Transform bookings to include stay and guest names
    const transformedBookings = bookings.map(booking => {
      const stay = booking.stayId as any;
      const guest = booking.guestId as any;
      return {
        ...booking.toObject(),
        stayName: stay?.stayName || 'Unknown',
        guestName: guest?.name || 'Unknown'
      };
    });

    return res.json({
      success: true,
      bookings: transformedBookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ success: false, message: 'Error fetching bookings' });
  }
};

// User actions
export const verifyUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User verified successfully' });
  } catch (error) {
    console.error('Error verifying user:', error);
    return res.status(500).json({ success: false, message: 'Error verifying user' });
  }
};

export const suspendUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const user = await User.findByIdAndUpdate(
      userId,
      { isSuspended: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User suspended successfully' });
  } catch (error) {
    console.error('Error suspending user:', error);
    return res.status(500).json({ success: false, message: 'Error suspending user' });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { userId } = req.params;
    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ success: false, message: 'Error deleting user' });
  }
};

// Stay actions
export const approveStay = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { stayId } = req.params;
    const stay = await HostDashBoardStay.findByIdAndUpdate(
      stayId,
      { status: 'approved' },
      { new: true }
    );

    if (!stay) {
      return res.status(404).json({ success: false, message: 'Stay not found' });
    }

    return res.json({ success: true, message: 'Stay approved successfully' });
  } catch (error) {
    console.error('Error approving stay:', error);
    return res.status(500).json({ success: false, message: 'Error approving stay' });
  }
};

export const rejectStay = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { stayId } = req.params;
    const stay = await HostDashBoardStay.findByIdAndUpdate(
      stayId,
      { status: 'rejected' },
      { new: true }
    );

    if (!stay) {
      return res.status(404).json({ success: false, message: 'Stay not found' });
    }

    return res.json({ success: true, message: 'Stay rejected successfully' });
  } catch (error) {
    console.error('Error rejecting stay:', error);
    return res.status(500).json({ success: false, message: 'Error rejecting stay' });
  }
};

export const suspendStay = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { stayId } = req.params;
    const stay = await HostDashBoardStay.findByIdAndUpdate(
      stayId,
      { status: 'suspended' },
      { new: true }
    );

    if (!stay) {
      return res.status(404).json({ success: false, message: 'Stay not found' });
    }

    return res.json({ success: true, message: 'Stay suspended successfully' });
  } catch (error) {
    console.error('Error suspending stay:', error);
    return res.status(500).json({ success: false, message: 'Error suspending stay' });
  }
};
