import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Stay from '../models/Stay';
import HostDashBoardStay from '../models/HostDashBoardStay';
import HostSignUp from '../models/HostSignUp';
import Booking from '../models/Booking';
import Review from '../models/Review';
import Payout from '../models/Payout';

// Sync host stays to public Stay collection
export const syncHostStaysToPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;

    // Get all active stays from HostDashBoardStay
    const hostStays = await HostDashBoardStay.find({ 
      hostId, 
      status: 'active' 
    });

    for (const hostStay of hostStays) {
      // Check if stay already exists in public collection
      const existingStay = await Stay.findOne({ 
        hostId, 
        stayName: hostStay.stayName 
      });

      if (!existingStay) {
        // Create new public stay entry
        const publicStay = new Stay({
          hostId: hostStay.hostId,
          stayName: hostStay.stayName,
          stayType: hostStay.stayType as any,
          propertyAge: hostStay.propertyAge,
          address: hostStay.address,
          city: hostStay.city,
          state: hostStay.state,
          pincode: hostStay.pincode,
          location: hostStay.currentLocation ? {
            latitude: 0, // Default - should be updated with actual coordinates
            longitude: 0
          } : {
            latitude: 0,
            longitude: 0
          },
          description: hostStay.description || '',
          houseRules: hostStay.houseRules || '',
          checkInTime: hostStay.checkInTime || '12:00',
          checkOutTime: hostStay.checkOutTime || '11:00',
          photos: hostStay.photos || [],
          coverImageIndex: 0,
          amenities: hostStay.amenities || [],
          pricing: hostStay.pricing || {
            basePrice: 1000,
            weekendPrice: 1200,
            festivalPrice: 1500,
            cleaningFee: 100,
            extraGuestCharge: 200,
            securityDeposit: 1000,
            smartPricing: true
          },
          capacity: {
            maxGuests: hostStay.numberOfRooms * 2 || 2,
            bedrooms: hostStay.numberOfRooms || 1,
            bathrooms: Math.ceil(hostStay.numberOfRooms / 2) || 1,
            beds: hostStay.numberOfRooms || 1
          },
          status: 'active',
          views: 0,
          bookings: 0,
          averageRating: 0,
          totalReviews: 0
        });

        await publicStay.save();
      }
    }

    res.status(200).json({
      success: true,
      message: `Synced ${hostStays.length} stays to public collection`
    });
  } catch (error: any) {
    console.error('Sync stays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync stays',
      error: error.message
    });
  }
};

// Get all stays for user search
export const getAllStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { city, state, stayType, minPrice, maxPrice, checkIn, checkOut, guests } = req.query;

    // Build filter criteria
    const filter: any = { status: 'active' };

    if (city) filter.city = new RegExp(city as string, 'i');
    if (state) filter.state = new RegExp(state as string, 'i');
    if (stayType) filter.stayType = stayType;
    
    if (minPrice || maxPrice) {
      filter['pricing.basePrice'] = {};
      if (minPrice) filter['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) filter['pricing.basePrice'].$lte = Number(maxPrice);
    }

    if (guests) {
      filter['capacity.maxGuests'] = { $gte: Number(guests) };
    }

    // Find stays with filters
    const stays = await Stay.find(filter)
      .select('-__v')
      .sort({ averageRating: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      stays,
      count: stays.length
    });
  } catch (error: any) {
    console.error('Get all stays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stays',
      error: error.message
    });
  }
};

// Search stays with filters
export const searchStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      query, 
      checkIn, 
      checkOut, 
      guests, 
      page = 1, 
      limit = 20,
      minPrice,
      maxPrice,
      stayType,
      amenities
    } = req.query;

    // Build search criteria
    const searchCriteria: any = { status: 'active' };

    // Use text search for location (much faster than regex)
    if (query && typeof query === 'string') {
      searchCriteria.$text = { $search: query };
    }

    // Stay type filter
    if (stayType && typeof stayType === 'string') {
      const stayTypes = stayType.split(',').filter(Boolean);
      if (stayTypes.length > 0) {
        searchCriteria.stayType = { $in: stayTypes };
      }
    }

    // Price range filter
    if (minPrice || maxPrice) {
      searchCriteria['pricing.basePrice'] = {};
      if (minPrice) searchCriteria['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) searchCriteria['pricing.basePrice'].$lte = Number(maxPrice);
    }

    // Amenities filter
    if (amenities && typeof amenities === 'string') {
      const amenityList = amenities.split(',').filter(Boolean);
      if (amenityList.length > 0) {
        searchCriteria.amenities = { $in: amenityList };
      }
    }

    // Guest capacity
    if (guests && typeof guests === 'string') {
      const guestCount = parseInt(guests);
      if (!isNaN(guestCount)) {
        // Calculate max guests based on rooms (2 guests per room)
        searchCriteria.$expr = {
          $gte: [{ $multiply: ['$numberOfRooms', 2] }, guestCount]
        };
      }
    }

    // Pagination
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Execute search with aggregation to get host info in one query
    const stays = await HostDashBoardStay.aggregate([
      { $match: searchCriteria },
      {
        $lookup: {
          from: 'hostsignups',
          localField: 'hostId',
          foreignField: '_id',
          as: 'host',
          pipeline: [
            { $project: { fullName: 1, email: 1 } }
          ]
        }
      },
      { $unwind: { path: '$host', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    // Get total count for pagination
    const total = await HostDashBoardStay.countDocuments(searchCriteria);

    // Transform results to match frontend interface
    const transformedStays = stays.map(stay => {
      const photos = stay.photos || [];
      
      return {
        _id: stay._id,
        title: stay.stayName,
        description: stay.description || `Beautiful ${stay.stayType} in ${stay.city}`,
        location: {
          city: stay.city,
          state: stay.state,
          country: 'India',
          coordinates: { 
            lat: 0, // TODO: Add geocoding
            lng: 0
          }
        },
        price: stay.pricing?.basePrice || 1000,
        bedrooms: stay.numberOfRooms || 1,
        bathrooms: Math.ceil(stay.numberOfRooms / 2) || 1,
        maxGuests: stay.numberOfRooms * 2,
        photos: {
          bedroom: photos.slice(0, Math.min(5, photos.length)),
          kitchen: photos.slice(5, Math.min(10, photos.length)),
          hall: photos.slice(10, Math.min(15, photos.length)),
          bathroom: photos.slice(15, Math.min(20, photos.length)),
          extra: photos.slice(20)
        },
        amenities: stay.amenities || [],
        host: {
          name: stay.host?.fullName || 'Property Host',
          email: stay.host?.email || '',
          phone: '',
          responseRate: 95,
          responseTime: '1 hour'
        },
        stayType: stay.stayType,
        rating: 4.5,
        reviews: {
          rating: 4.5,
          count: Math.floor(Math.random() * 100) + 10
        },
        availability: {
          dates: [],
          priceVariations: []
        }
      };
    });

    res.json({
      success: true,
      stays: transformedStays,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error searching stays:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching stays',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get stay details from HostDashBoardStay for public viewing
export const getStayDetailsFromHost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    if (!stayId) {
      res.status(400).json({
        success: false,
        message: 'Stay ID is required'
      });
      return;
    }

    // Find stay in HostDashBoardStay collection
    const stay = await HostDashBoardStay.findById(stayId)
      .lean();

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found'
      });
      return;
    }

    // Check if stay is active
    if (stay.status !== 'active') {
      res.status(404).json({
        success: false,
        message: 'Stay is not available for booking'
      });
      return;
    }

    // Get host information
    const host = await HostSignUp.findById(stay.hostId)
      .select('fullName email phoneNumber')
      .lean();

    if (!host) {
      res.status(404).json({
        success: false,
        message: 'Host information not found'
      });
      return;
    }

    // Get booking statistics
    const totalBookings = await Booking.countDocuments({ stayId });
    const totalReviews = 0; // TODO: Implement review system

    // Calculate max guests based on rooms (2 guests per room as standard)
    const maxGuests = stay.numberOfRooms * 2;

    // Transform photos into categories
    const photos = stay.photos || [];
    const categorizedPhotos = {
      bedroom: photos.slice(0, Math.min(5, photos.length)),
      kitchen: photos.slice(5, Math.min(10, photos.length)),
      hall: photos.slice(10, Math.min(15, photos.length)),
      bathroom: photos.slice(15, Math.min(20, photos.length)),
      extra: photos.slice(20)
    };

    // Transform the data to match the frontend interface
    const transformedStay = {
      _id: stay._id,
      title: stay.stayName,
      description: stay.description || `Beautiful ${stay.stayType} in ${stay.city}`,
      location: {
        city: stay.city,
        state: stay.state,
        country: 'India',
        coordinates: { 
          lat: 0, // TODO: Add geocoding to get coordinates from address
          lng: 0
        }
      },
      price: stay.pricing?.basePrice || 1000,
      bedrooms: stay.numberOfRooms || 1,
      bathrooms: Math.ceil(stay.numberOfRooms / 2) || 1,
      maxGuests: maxGuests,
      photos: categorizedPhotos,
      amenities: stay.amenities || [],
      host: {
        name: host.fullName,
        email: host.email,
        profilePicture: undefined // TODO: Add profile picture to HostSignUp model
      },
      availability: {
        dates: [], // TODO: Implement availability management
        priceVariations: []
      },
      reviews: {
        rating: 0, // TODO: Calculate from review system
        count: totalReviews,
        comments: [] // TODO: Fetch from review system
      },
      additionalInfo: {
        stayType: stay.stayType,
        propertyAge: stay.propertyAge,
        address: stay.address,
        pincode: stay.pincode,
        nearbyAttractions: stay.nearbyAttractions,
        houseRules: stay.houseRules,
        checkInTime: stay.checkInTime || '14:00',
        checkOutTime: stay.checkOutTime || '11:00',
        allowPets: stay.allowPets,
        offerCloakRoom: stay.offerCloakRoom,
        cloakRoomPrice: stay.cloakRoomPrice,
        totalBookings: totalBookings
      }
    };

    res.status(200).json({
      success: true,
      stay: transformedStay
    });

  } catch (error: any) {
    console.error('Get stay details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stay details',
      error: error.message
    });
  }
};

// Get stay by ID for details page
export const getStayById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    const stay = await Stay.findById(stayId)
      .populate('hostId', 'fullName email phoneNumber profilePicture')
      .select('-__v');

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found'
      });
      return;
    }

    // Increment view count
    stay.views = (stay.views || 0) + 1;
    await stay.save();

    // Transform the data to match the frontend interface
    const transformedStay = {
      _id: stay._id,
      title: stay.stayName,
      description: stay.description || '',
      location: {
        city: stay.city,
        state: stay.state,
        country: 'India', // Default country
        coordinates: { 
          lat: stay.location?.latitude || 0, 
          lng: stay.location?.longitude || 0 
        }
      },
      price: stay.pricing?.basePrice || 1000,
      bedrooms: stay.capacity?.bedrooms || 1,
      bathrooms: stay.capacity?.bathrooms || 1,
      maxGuests: stay.capacity?.maxGuests || 2,
      photos: {
        bedroom: stay.photos?.slice(0, 5) || [],
        kitchen: stay.photos?.slice(5, 10) || [],
        hall: stay.photos?.slice(10, 15) || [],
        bathroom: stay.photos?.slice(15, 20) || [],
        extra: stay.photos?.slice(20) || []
      },
      amenities: stay.amenities || [],
      host: {
        name: (stay as any).hostId?.fullName || 'Host',
        email: (stay as any).hostId?.email || '',
        profilePicture: (stay as any).hostId?.profilePicture
      },
      availability: {
        dates: [], // Will be populated from booking system
        priceVariations: []
      },
      reviews: {
        rating: stay.averageRating || 0,
        count: stay.totalReviews || 0,
        comments: [] // Will be populated from review system
      }
    };

    res.status(200).json({
      success: true,
      stay: transformedStay
    });
  } catch (error: any) {
    console.error('Get stay by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stay details',
      error: error.message
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;

    // Get all stays for this host
    const stays = await Stay.find({ hostId });
    const stayIds = stays.map(stay => stay._id);

    // Get bookings
    const bookings = await Booking.find({ hostId });
    const upcomingBookings = await Booking.countDocuments({
      hostId,
      bookingStatus: 'upcoming',
    });

    // Calculate earnings
    const paidBookings = await Booking.find({
      hostId,
      paymentStatus: 'paid',
    });

    const totalEarnings = paidBookings.reduce(
      (sum, booking) => sum + booking.pricing.totalAmount,
      0
    );

    const platformCommission = totalEarnings * 0.1; // 10% commission
    const netEarnings = totalEarnings - platformCommission;

    // Get processing amount (from processing payouts)
    const processingPayouts = await Payout.find({
      hostId,
      status: 'processing',
    });
    const processingAmount = processingPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    // Get withdrawn amount (completed payouts)
    const completedPayouts = await Payout.find({
      hostId,
      status: 'completed',
    });
    const withdrawnAmount = completedPayouts.reduce(
      (sum, payout) => sum + payout.netAmount,
      0
    );

    const availableBalance = netEarnings - withdrawnAmount - processingAmount;

    // Get average rating
    const totalRating = stays.reduce((sum, stay) => sum + stay.averageRating, 0);
    const averageRating = stays.length > 0 ? totalRating / stays.length : 0;

    // Get active promotions
    const activePromotions = await  mongoose.model('Promotion').countDocuments({
      hostId,
      active: true,
      validTo: { $gte: new Date() },
    });

    // Get monthly earnings (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyEarnings = await Booking.aggregate([
      {
        $match: {
          hostId: new mongoose.Types.ObjectId(hostId),
          paymentStatus: 'paid',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          amount: { $sum: '$pricing.totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalEarnings,
        platformCommission,
        availableBalance,
        processingAmount,
        totalBookings: bookings.length,
        upcomingBookings,
        averageRating: Math.round(averageRating * 10) / 10,
        activePromotions,
        monthlyEarnings,
        totalStays: stays.length,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// Create new stay
export const createStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        errors: errors.array(),
      });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const photos = files.map(file => file.path);

    const stayData = {
      ...req.body,
      photos,
      amenities: JSON.parse(req.body.amenities || '[]'),
      pricing: JSON.parse(req.body.pricing || '{}'),
      capacity: JSON.parse(req.body.capacity || '{}'),
      location: {
        latitude: parseFloat(req.body.latitude),
        longitude: parseFloat(req.body.longitude),
      },
    };

    const stay = new Stay(stayData);
    await stay.save();

    res.status(201).json({
      success: true,
      message: 'Stay created successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Create stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stay',
      error: error.message,
    });
  }
};

// Get all stays for a host
export const getHostStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const hostId = req.params.hostId;
    const stays = await Stay.find({ hostId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: stays,
    });
  } catch (error: any) {
    console.error('Get host stays error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stays',
      error: error.message,
    });
  }
};

// Update stay
export const updateStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;
    const updateData = { ...req.body };

    // Handle file uploads if present
    if (req.files && (req.files as Express.Multer.File[]).length > 0) {
      const files = req.files as Express.Multer.File[];
      updateData.photos = files.map(file => file.path);
    }

    // Parse JSON fields
    if (updateData.amenities) {
      updateData.amenities = JSON.parse(updateData.amenities);
    }
    if (updateData.pricing) {
      updateData.pricing = JSON.parse(updateData.pricing);
    }

    // Find and update the stay in HostDashBoardStay
    const stay = await HostDashBoardStay.findByIdAndUpdate(stayId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Stay updated successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Update stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stay',
      error: error.message,
    });
  }
};

// Delete stay
export const deleteStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;

    // Check if there are any upcoming bookings
    const upcomingBookings = await Booking.countDocuments({
      stayId,
      bookingStatus: { $in: ['upcoming', 'ongoing'] },
    });

    if (upcomingBookings > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete stay with active or upcoming bookings',
      });
      return;
    }

    const stay = await Stay.findByIdAndDelete(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Stay deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete stay error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stay',
      error: error.message,
    });
  }
};

// Update stay pricing
export const updateStayPricing = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;
    const { pricing } = req.body;

    const stay = await Stay.findByIdAndUpdate(
      stayId,
      { pricing },
      { new: true, runValidators: true }
    );

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Pricing updated successfully',
      data: stay,
    });
  } catch (error: any) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update pricing',
      error: error.message,
    });
  }
};

// Get stay for editing (returns all fields including sensitive ones for host)
export const getStayForEdit = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    if (!stayId) {
      res.status(400).json({
        success: false,
        message: 'Stay ID is required'
      });
      return;
    }

    // Find stay in HostDashBoardStay collection
    const stay = await HostDashBoardStay.findById(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found'
      });
      return;
    }

    // Return complete stay data for editing
    res.status(200).json({
      success: true,
      stay: stay
    });

  } catch (error: any) {
    console.error('Get stay for edit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stay for editing',
      error: error.message
    });
  }
};

// Toggle stay status (Go Live / Go Offline)
export const toggleStayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const stayId = req.params.stayId;

    const stay = await HostDashBoardStay.findById(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    // Toggle between active and inactive
    const previousStatus = stay.status;
    stay.status = stay.status === 'active' ? 'inactive' : 'active';
    await stay.save();

    const statusMessage = stay.status === 'active' 
      ? 'Property is now LIVE and available for booking!' 
      : 'Property is now OFFLINE and not available for booking';

    res.status(200).json({
      success: true,
      message: statusMessage,
      data: {
        stayId: stay._id,
        status: stay.status,
        previousStatus,
        title: stay.stayName,
        city: stay.city
      },
    });
  } catch (error: any) {
    console.error('Toggle stay status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle stay status',
      error: error.message,
    });
  }
};

import mongoose from 'mongoose';
