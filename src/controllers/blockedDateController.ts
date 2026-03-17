import { Request, Response } from 'express';
import BlockedDate from '../models/BlockedDate';
import HostDashBoardStay from '../models/HostDashBoardStay';

// Block dates for a stay
export const blockDates = async (req: Request, res: Response) => {
  try {
    const { stayId, dates, reason } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
      return;
    }

    if (!stayId || !dates || !Array.isArray(dates)) {
      res.status(400).json({
        success: false,
        message: 'Stay ID and dates array are required'
      });
      return;
    }

    // Verify the stay belongs to the host
    const stay = await HostDashBoardStay.findOne({ _id: stayId, hostId: userId });
    if (!stay) {
      res.status(403).json({
        success: false,
        message: 'You can only block dates for your own properties'
      });
      return;
    }

    // Create blocked date records
    const blockedDates = dates.map(date => ({
      stayId,
      hostId: userId,
      date: new Date(date),
      reason: reason || 'Host blocked'
    }));

    const savedDates = await BlockedDate.insertMany(blockedDates, { ordered: false });

    res.status(201).json({
      success: true,
      message: `${savedDates.length} dates blocked successfully`,
      blockedDates: savedDates
    });

  } catch (error: any) {
    console.error('Block dates error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Some dates are already blocked'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to block dates',
        error: error.message
      });
    }
  }
};

// Unblock dates for a stay
export const unblockDates = async (req: Request, res: Response) => {
  try {
    const { stayId, dates } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
      return;
    }

    if (!stayId || !dates || !Array.isArray(dates)) {
      res.status(400).json({
        success: false,
        message: 'Stay ID and dates array are required'
      });
      return;
    }

    // Verify the stay belongs to the host
    const stay = await HostDashBoardStay.findOne({ _id: stayId, hostId: userId });
    if (!stay) {
      res.status(403).json({
        success: false,
        message: 'You can only unblock dates for your own properties'
      });
      return;
    }

    // Delete blocked date records
    const dateObjects = dates.map(date => new Date(date));
    const result = await BlockedDate.deleteMany({
      stayId,
      hostId: userId,
      date: { $in: dateObjects }
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} dates unblocked successfully`,
      deletedCount: result.deletedCount
    });

  } catch (error: any) {
    console.error('Unblock dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock dates',
      error: error.message
    });
  }
};

// Get blocked dates for a stay
export const getBlockedDates = async (req: Request, res: Response) => {
  try {
    const { stayId, hostId } = req.params;
    const { month, end } = req.query;

    if (!stayId && !hostId) {
      res.status(400).json({
        success: false,
        message: 'Stay ID or Host ID is required'
      });
      return;
    }

    // Build query
    const query: any = {};
    if (stayId) query.stayId = stayId;
    if (hostId) query.hostId = hostId;

    // Add date range filter if provided
    if (month && end) {
      query.date = {
        $gte: new Date(month as string),
        $lte: new Date(end as string)
      };
    }

    const blockedDates = await BlockedDate.find(query)
      .sort({ date: 1 })
      .select('date reason');

    res.status(200).json({
      success: true,
      blockedDates: blockedDates.map(bd => ({
        date: bd.date,
        reason: bd.reason
      }))
    });

  } catch (error: any) {
    console.error('Get blocked dates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blocked dates',
      error: error.message
    });
  }
};
