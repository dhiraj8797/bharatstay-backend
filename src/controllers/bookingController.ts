import { Request, Response } from 'express';

import Booking from '../models/Booking';

import HostDashBoardStay from '../models/HostDashBoardStay';

import HostSignUp from '../models/HostSignUp';



// Create new booking

export const createBooking = async (req: Request, res: Response): Promise<void> => {

  try {

    const { stayId, checkIn, checkOut, guests, totalPrice } = req.body;

    const userId = (req as any).user?.id;



    if (!userId) {

      res.status(401).json({

        success: false,

        message: 'User authentication required'

      });

      return;

    }



    // Validate required fields

    if (!stayId || !checkIn || !checkOut || !guests || !totalPrice) {

      res.status(400).json({

        success: false,

        message: 'All booking details are required'

      });

      return;

    }



    // Check if stay exists

    const stay = await HostDashBoardStay.findById(stayId);

    if (!stay) {

      res.status(404).json({

        success: false,

        message: 'Stay not found'

      });

      return;

    }



    // Check if stay is active

    if (stay.status !== 'active') {

      res.status(400).json({

        success: false,

        message: 'Stay is not available for booking'

      });

      return;

    }



    // Check if dates are available

    const checkInDate = new Date(checkIn);

    const checkOutDate = new Date(checkOut);

    

    // Generate date range

    const dateRange = [];

    const currentDate = new Date(checkInDate);

    while (currentDate < checkOutDate) {

      dateRange.push(currentDate.toISOString().split('T')[0]);

      currentDate.setDate(currentDate.getDate() + 1);

    }



    // Check for existing bookings

    const existingBookings = await Booking.find({

      stayId,

      bookingStatus: { $in: ['upcoming', 'ongoing'] },

      $or: [

        { 

          checkIn: { $lt: checkOutDate }, 

          checkOut: { $gt: checkInDate } 

        }

      ]

    });



    if (existingBookings.length > 0) {

      res.status(400).json({

        success: false,

        message: 'Selected dates are not available'

      });

      return;

    }



    // Create booking

    const booking = new Booking({

      stayId,

      hostId: stay.hostId,

      guestId: userId,

      checkIn: checkInDate,

      checkOut: checkOutDate,

      guests: guests,

      nights: Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)),

      pricing: {

        baseAmount: stay.pricing?.basePrice || totalPrice,

        cleaningFee: stay.pricing?.cleaningFee || 0,

        extraGuestCharge: stay.pricing?.extraGuestCharge || 0,

        discount: 0,

        totalAmount: totalPrice

      },

      bookingStatus: 'upcoming',

      paymentStatus: 'pending',

      specialRequests: '',

      guestDetails: {

        name: '', // TODO: Get from user profile

        email: '', // TODO: Get from user profile

        phone: '' // TODO: Get from user profile

      }

    });



    await booking.save();



    res.status(201).json({

      success: true,

      message: 'Booking created successfully',

      booking: {

        id: booking._id,

        stayId: booking.stayId,

        checkIn: booking.checkIn,

        checkOut: booking.checkOut,

        guests: booking.guests,

        totalPrice: booking.pricing.totalAmount,

        status: booking.bookingStatus

      }

    });



  } catch (error: any) {

    console.error('Create booking error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to create booking',

      error: error.message

    });

  }

};



// Get all bookings for a host

export const getHostBookings = async (req: Request, res: Response): Promise<void> => {

  try {

    const hostId = req.params.hostId;

    const { status } = req.query;



    const query: any = { hostId };

    if (status) {

      query.bookingStatus = status;

    }



    const bookings = await Booking.find(query)

      .populate('stayId', 'stayName stayType')

      .populate('guestId', 'fullName email phoneNumber')

      .sort({ createdAt: -1 });



    res.status(200).json({

      success: true,

      data: bookings,

    });

  } catch (error: any) {

    console.error('Get host bookings error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch bookings',

      error: error.message,

    });

  }

};



// Get booking details

export const getBookingDetails = async (req: Request, res: Response): Promise<void> => {

  try {

    const bookingId = req.params.bookingId;



    const booking = await Booking.findById(bookingId)

      .populate('stayId')

      .populate('guestId', 'fullName email phoneNumber')

      .populate('hostId', 'fullName email phoneNumber');



    if (!booking) {

      res.status(404).json({

        success: false,

        message: 'Booking not found',

      });

      return;

    }



    res.status(200).json({

      success: true,

      data: booking,

    });

  } catch (error: any) {

    console.error('Get booking details error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch booking details',

      error: error.message,

    });

  }

};



// Update booking status

export const updateBookingStatus = async (req: Request, res: Response): Promise<void> => {

  try {

    const bookingId = req.params.bookingId;

    const { bookingStatus } = req.body;



    const booking = await Booking.findByIdAndUpdate(

      bookingId,

      { bookingStatus },

      { new: true, runValidators: true }

    );



    if (!booking) {

      res.status(404).json({

        success: false,

        message: 'Booking not found',

      });

      return;

    }



    // Update stay bookings count

    if (bookingStatus === 'completed') {

      // TODO: Implement booking statistics for HostDashBoardStay

      // await HostDashBoardStay.findByIdAndUpdate(booking.stayId, {

      //   $inc: { bookings: 1 },

      // });

    }



    res.status(200).json({

      success: true,

      message: 'Booking status updated successfully',

      data: booking,

    });

  } catch (error: any) {

    console.error('Update booking status error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to update booking status',

      error: error.message,

    });

  }

};



// Cancel booking

export const cancelBooking = async (req: Request, res: Response): Promise<void> => {

  try {

    const bookingId = req.params.bookingId;

    const { cancellationReason } = req.body;



    const booking = await Booking.findById(bookingId);



    if (!booking) {

      res.status(404).json({

        success: false,

        message: 'Booking not found',

      });

      return;

    }



    if (booking.bookingStatus === 'completed' || booking.bookingStatus === 'cancelled') {

      res.status(400).json({

        success: false,

        message: 'Cannot cancel this booking',

      });

      return;

    }



    booking.bookingStatus = 'cancelled';

    booking.cancellationReason = cancellationReason;

    booking.cancellationDate = new Date();

    booking.paymentStatus = 'refunded';



    await booking.save();



    res.status(200).json({

      success: true,

      message: 'Booking cancelled successfully',

      data: booking,

    });

  } catch (error: any) {

    console.error('Cancel booking error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to cancel booking',

      error: error.message,

    });

  }

};



// Get bookings for a specific user

export const getUserBookings = async (req: Request, res: Response): Promise<void> => {

  try {

    const userId = req.params.userId;



    const bookings = await Booking.find({ guestId: new mongoose.Types.ObjectId(userId) })

      .populate('stayId', 'stayName address city state photos')

      .populate('hostId', 'fullName')

      .sort({ createdAt: -1 });



    res.status(200).json({

      success: true,

      bookings: bookings.map(booking => ({

        _id: booking._id,

        stayName: (booking.stayId as any)?.stayName || 'Unknown Stay',

        location: `${(booking.stayId as any)?.address || 'Unknown Location'}, ${(booking.stayId as any)?.city || ''}`,

        stayImage: (booking.stayId as any)?.photos?.[(booking.stayId as any)?.coverImageIndex || 0],

        checkIn: booking.checkIn,

        checkOut: booking.checkOut,

        guests: booking.guests || 1,

        totalAmount: booking.pricing?.totalAmount || 0,

        status: booking.bookingStatus,

        bookingDate: booking.createdAt,

        hostName: (booking.hostId as any)?.fullName || 'Unknown Host'

      }))

    });

  } catch (error: any) {

    console.error('Get user bookings error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch bookings',

      error: error.message,

    });

  }

};

export const getBookingStats = async (req: Request, res: Response): Promise<void> => {

  try {

    const hostId = req.params.hostId;



    const stats = await Booking.aggregate([

      { $match: { hostId: new mongoose.Types.ObjectId(hostId) } },

      {

        $group: {

          _id: '$bookingStatus',

          count: { $sum: 1 },

          totalRevenue: { $sum: '$pricing.totalAmount' },

        },

      },

    ]);



    const monthlyStats = await Booking.aggregate([

      {

        $match: {

          hostId: new mongoose.Types.ObjectId(hostId),

          createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },

        },

      },

      {

        $group: {

          _id: {

            year: { $year: '$createdAt' },

            month: { $month: '$createdAt' },

          },

          bookings: { $sum: 1 },

          revenue: { $sum: '$pricing.totalAmount' },

        },

      },

      { $sort: { '_id.year': 1, '_id.month': 1 } },

    ]);



    res.status(200).json({

      success: true,

      data: {

        stats,

        monthlyStats,

      },

    });

  } catch (error: any) {

    console.error('Get booking stats error:', error);

    res.status(500).json({

      success: false,

      message: 'Failed to fetch booking statistics',

      error: error.message,

    });

  }

};



import mongoose from 'mongoose';

