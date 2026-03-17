import { Request, Response } from 'express';

import Booking from '../models/Booking';

import HostDashBoardStay from '../models/HostDashBoardStay';

import HostSignUp from '../models/HostSignUp';

import Promotion from '../models/Promotion';



// Create new booking

export const createBooking = async (req: Request, res: Response): Promise<void> => {

  try {

    const { 
      stayId, 
      checkIn, 
      checkOut, 
      guests, 
      totalAmount, 
      totalPrice, 
      promoCode,
      travellers,
      contactInfo,
      hasPets,
      paymentMethod,
      paymentStatus
    } = req.body;

    const userId = (req as any).user?.id;



    if (!userId) {

      res.status(401).json({

        success: false,

        message: 'User authentication required'

      });

      return;

    }



    // Validate required fields
    const finalPrice = totalAmount || totalPrice;
    if (!stayId || !checkIn || !checkOut || !guests || !finalPrice) {
      res.status(400).json({
        success: false,
        message: 'All booking details are required'
      });
      return;
    }

    // Validate traveller data
    if (!travellers || !Array.isArray(travellers) || travellers.length === 0) {
      res.status(400).json({
        success: false,
        message: 'At least one traveller is required'
      });
      return;
    }

    // Validate contact info
    if (!contactInfo || !contactInfo.email || !contactInfo.phone) {
      res.status(400).json({
        success: false,
        message: 'Contact information is required'
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



    // Validate and apply promo code if provided
    let promoDiscount = 0;
    let appliedPromoCode = '';

    if (promoCode) {
      const promo = await Promotion.findOne({
        code: promoCode.toUpperCase(),
        active: true,
        validFrom: { $lte: new Date() },
        validTo: { $gte: new Date() },
      });

      if (promo) {
        // Check usage limit
        if (!promo.maxUsage || promo.usedCount < promo.maxUsage) {
          // Check minimum booking amount
          if (!promo.minBookingAmount || totalPrice >= promo.minBookingAmount) {
            // Calculate discount
            if (promo.discountType === 'percentage') {
              promoDiscount = (totalPrice * promo.discount) / 100;
            } else {
              promoDiscount = promo.discount;
            }
            // Ensure discount doesn't exceed total price
            promoDiscount = Math.min(promoDiscount, totalPrice);
            appliedPromoCode = promo.code;

            // Increment promo usage count
            await Promotion.findByIdAndUpdate(promo._id, {
              $inc: { usedCount: 1 },
            });
          }
        }
      }
    }

    // Calculate GST based on declared tariff (NOT discounted price) - Hotel Booking GST Rates 2025-2026
    const platformFee = 10; // Fixed platform fee
    const declaredTariffPerNight = stay.pricing?.basePrice || 0; // Original room price before discount
    const accommodationSubtotal = finalPrice - promoDiscount; // Base price + fees (after discount)
    
    let gstRate = 0;
    let gstAmount = 0;
    
    // GST Rates by Hotel Booking Range (Effective Sept 2025)
    // IMPORTANT: GST is based on declared tariff, NOT discounted price
    if (declaredTariffPerNight < 1000) {
      gstRate = 0; // Below ₹1,000: 0% GST (No GST)
      gstAmount = 0;
    } else if (declaredTariffPerNight >= 1001 && declaredTariffPerNight <= 7500) {
      gstRate = 0.05; // ₹1,001 – ₹7,500: 5% GST (No ITC)
      gstAmount = accommodationSubtotal * 0.05; // Apply 5% on actual payable amount
    } else {
      gstRate = 0.18; // Above ₹7,500: 18% GST (ITC allowed)
      gstAmount = accommodationSubtotal * 0.18; // Apply 18% on actual payable amount
    }
    
    const finalAmount = accommodationSubtotal + gstAmount + platformFee; // Add platform fee after GST

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
        baseAmount: stay.pricing?.basePrice || finalPrice,
        cleaningFee: stay.pricing?.cleaningFee || 0,
        extraGuestCharge: stay.pricing?.extraGuestCharge || 0,
        platformFee: platformFee,
        discount: promoDiscount,
        gstRate: gstRate,
        gstAmount: gstAmount,
        cgst: gstRate > 0 ? gstAmount / 2 : 0, // Split GST equally (2.5% each for 5% rate, 9% each for 18% rate)
        sgst: gstRate > 0 ? gstAmount / 2 : 0, // Split GST equally (2.5% each for 5% rate, 9% each for 18% rate)
        totalAmount: finalAmount
      },
      bookingStatus: 'upcoming',
      paymentStatus: paymentStatus || 'pending',
      travellers: travellers,
      contactInfo: contactInfo,
      hasPets: hasPets || false,

      specialRequests: '',

      promoCode: appliedPromoCode,

      promoDiscount: promoDiscount,
    });



    await booking.save();

    // Send confirmation emails
    try {
      // In production, integrate with email service like Nodemailer, SendGrid, etc.
      
      // 1. Send to guest
      console.log(`📧 Guest confirmation email would be sent to: ${contactInfo.email}`);
      console.log(`📧 Guest booking details:`, {
        bookingReference: booking.bookingReference,
        guestName: travellers[0]?.name,
        guestEmail: contactInfo.email,
        guestPhone: contactInfo.phone,
        stayId: stay._id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalAmount: finalAmount
      });

      // 2. Send to host
      // Get host details
      const hostDetails = await HostSignUp.findById(stay.hostId);
      
      if (hostDetails) {
        console.log(`📧 Host notification email would be sent to: ${hostDetails.email}`);
        console.log(`📧 Host booking details:`, {
          bookingReference: booking.bookingReference,
          hostName: hostDetails.fullName || 'Property Host',
          hostEmail: hostDetails.email,
          hostPhone: hostDetails.phoneNumber,
          guestName: travellers[0]?.name,
          guestEmail: contactInfo.email,
          guestPhone: contactInfo.phone,
          stayTitle: stay.stayName,
          stayId: stay._id,
          checkIn: booking.checkIn,
          checkOut: booking.checkOut,
          guests: guests,
          totalAmount: finalAmount,
          bookingStatus: booking.bookingStatus,
          paymentStatus: booking.paymentStatus
        });

        // 3. Send message alert to host (could be SMS, WhatsApp, or in-app notification)
        console.log(`📱 Host message alert would be sent to: ${hostDetails.phoneNumber || hostDetails.email}`);
        console.log(`📱 Alert message: "New booking! ${travellers[0]?.name} booked ${stay.stayName} from ${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}"`);
      } else {
        console.log('⚠️ Host details not found for notification');
      }

    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the booking if email fails
    }

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

        promoDiscount: promoDiscount,

        finalAmount: finalAmount,

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

        bookingDate: (booking as any).createdAt,

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

// Send booking confirmation email with PDF
export const sendConfirmationEmail = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { bookingId, email, bookingDetails } = req.body;

    // In production, you would:
    // 1. Generate a PDF from the booking details
    // 2. Use a service like SendGrid, AWS SES, or Nodemailer to send the email
    // 3. Attach the PDF to the email

    // For now, we'll simulate a successful email send
    console.log('Sending confirmation email to:', email);
    console.log('Booking ID:', bookingId);
    console.log('Booking Details:', bookingDetails);

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({
      success: true,
      message: 'Confirmation email sent successfully',
      data: {
        bookingId,
        email,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Send confirmation email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email',
      error: error.message,
    });
  }
};

