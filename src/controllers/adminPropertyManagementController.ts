import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import HostDashBoardStay from '../models/HostDashBoardStay';
import Host from '../models/Host';
import Booking from '../models/Booking';

// Get all properties with filters
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      city, 
      stayType,
      featured,
      hostVerification,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (city) {
      filter.city = { $regex: city, $options: 'i' };
    }
    
    if (stayType) {
      filter.stayType = stayType;
    }
    
    if (featured !== undefined) {
      filter.isFeatured = featured === 'true';
    }
    
    if (search) {
      filter.$or = [
        { stayName: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    // If filtering by host verification status
    if (hostVerification === 'verified') {
      const verifiedHosts = await Host.find({ isVerified: true }).select('_id');
      filter.hostId = { $in: verifiedHosts.map(h => h._id) };
    } else if (hostVerification === 'unverified') {
      const unverifiedHosts = await Host.find({ isVerified: false }).select('_id');
      filter.hostId = { $in: unverifiedHosts.map(h => h._id) };
    }

    const properties = await HostDashBoardStay.find(filter)
      .populate('hostId', 'fullName email isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Add additional stats for each property
    const propertiesWithStats = await Promise.all(
      properties.map(async (property) => {
        const bookingCount = await Booking.countDocuments({ 
          stayId: property._id 
        });
        
        const totalRevenue = await Booking.aggregate([
          { $match: { stayId: property._id, paymentStatus: 'paid' } },
          { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
        ]);
        
        const averageRating = await Booking.aggregate([
          { $match: { stayId: property._id, bookingStatus: 'completed' } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        return {
          ...property.toObject(),
          stats: {
            bookingCount,
            totalRevenue: totalRevenue[0]?.total || 0,
            averageRating: averageRating[0]?.avgRating || 0,
            photoCount: property.photos?.length || 0
          }
        };
      })
    );

    const total = await HostDashBoardStay.countDocuments(filter);

    return res.json({
      success: true,
      properties: propertiesWithStats,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get property by ID with detailed information
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    const property = await HostDashBoardStay.findById(propertyId)
      .populate('hostId', 'fullName email phoneNumber isVerified');
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    // Get recent bookings
    const recentBookings = await Booking.find({ stayId: property._id })
      .populate('guestId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get booking statistics
    const bookingStats = await Booking.aggregate([
      { $match: { stayId: property._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$pricing.totalAmount' },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Check if property has minimum 5 photos
    const hasMinimumPhotos = (property.photos?.length || 0) >= 5;

    return res.json({
      success: true,
      property: {
        ...property.toObject(),
        recentBookings,
        stats: bookingStats[0] || {
          totalBookings: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          totalRevenue: 0,
          averageRating: 0
        },
        compliance: {
          hasMinimumPhotos,
          photoCount: property.photos?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching property details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching property details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Approve/Reject Property Listing
export const updatePropertyStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { propertyId } = req.params;
    const { action, reason } = req.body; // action: 'approve' | 'reject' | 'disable'

    const property = await HostDashBoardStay.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    if (action === 'approve') {
      property.status = 'active';
      property.approvedAt = new Date();
      property.approvedBy = 'admin_current_user'; // TODO: Replace with actual admin ID
    } else if (action === 'reject') {
      property.status = 'inactive';
      property.rejectedAt = new Date();
      property.rejectedBy = 'admin_current_user';
      property.rejectionReason = reason;
    } else if (action === 'disable') {
      property.status = 'inactive';
      property.disabledAt = new Date();
      property.disabledBy = 'admin_current_user';
      property.disableReason = reason;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be approve, reject, or disable'
      });
    }

    await property.save();

    return res.json({
      success: true,
      message: `Property ${action}d successfully`,
      property: {
        id: property._id,
        stayName: property.stayName,
        status: property.status
      }
    });
  } catch (error) {
    console.error('Error updating property status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating property status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Set/Unset Property as Featured
export const updatePropertyFeatured = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { propertyId } = req.params;
    const { isFeatured, featuredReason } = req.body;

    const property = await HostDashBoardStay.findById(propertyId);
    
    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    property.isFeatured = isFeatured;
    
    if (isFeatured) {
      property.featuredAt = new Date();
      property.featuredBy = 'admin_current_user';
      property.featuredReason = featuredReason || 'Admin selection';
    } else {
      property.unfeaturedAt = new Date();
      property.unfeaturedBy = 'admin_current_user';
    }

    await property.save();

    return res.json({
      success: true,
      message: `Property ${isFeatured ? 'set as' : 'removed from'} featured successfully`,
      property: {
        id: property._id,
        stayName: property.stayName,
        isFeatured: property.isFeatured
      }
    });
  } catch (error) {
    console.error('Error updating featured status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating featured status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get properties with compliance issues
export const getPropertiesWithComplianceIssues = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Find properties with less than 5 photos
    const propertiesWithFewPhotos = await HostDashBoardStay.find({
      $expr: { $lt: [{ $size: { $ifNull: ['$photos', []] } }, 5] }
    })
    .populate('hostId', 'fullName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    // Find properties from unverified hosts
    const unverifiedHosts = await Host.find({ isVerified: false }).select('_id');
    const propertiesFromUnverifiedHosts = await HostDashBoardStay.find({
      hostId: { $in: unverifiedHosts.map(h => h._id) }
    })
    .populate('hostId', 'fullName email isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    // Find inactive properties
    const inactiveProperties = await HostDashBoardStay.find({ status: 'inactive' })
    .populate('hostId', 'fullName email isVerified')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

    return res.json({
      success: true,
      complianceIssues: {
        insufficientPhotos: propertiesWithFewPhotos.map(p => ({
          ...p.toObject(),
          issue: 'Insufficient photos',
          photoCount: p.photos?.length || 0
        })),
        unverifiedHosts: propertiesFromUnverifiedHosts.map(p => ({
          ...p.toObject(),
          issue: 'Host not verified'
        })),
        inactiveListings: inactiveProperties.map(p => ({
          ...p.toObject(),
          issue: 'Property inactive'
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching compliance issues:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching compliance issues',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get property availability calendar
export const getPropertyAvailability = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { month, year } = req.query;

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 0);

    const bookings = await Booking.find({
      stayId: propertyId,
      $or: [
        { checkIn: { $lte: endDate }, checkOut: { $gte: startDate } }
      ]
    }).select('checkIn checkOut bookingStatus');

    const availability = bookings.map(booking => ({
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      status: booking.bookingStatus
    }));

    return res.json({
      success: true,
      availability,
      month: Number(month),
      year: Number(year)
    });
  } catch (error) {
    console.error('Error fetching property availability:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching property availability',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
