import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import { Dispute } from '../models/Dispute';
import Booking from '../models/Booking';
import User from '../models/User';
import Host from '../models/Host';

// Get all disputes with comprehensive filters
export const getAllDisputes = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      priority,
      assignedTo,
      startDate,
      endDate,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { bookingReference: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const disputes = await Dispute.find(filter)
      .populate('complainantId', 'fullName email')
      .populate('respondentId', 'fullName email')
      .populate('bookingId', 'bookingReference checkIn checkOut')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Dispute.countDocuments(filter);

    return res.json({
      success: true,
      disputes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching disputes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get dispute by ID with full details
export const getDisputeById = async (req: Request, res: Response) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId)
      .populate('complainantId', 'fullName email phoneNumber')
      .populate('respondentId', 'fullName email phoneNumber')
      .populate('bookingId', 'bookingReference checkIn checkOut pricing')
      .sort({ 'evidence.messages.timestamp': -1 });
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    return res.json({
      success: true,
      dispute
    });
  } catch (error) {
    console.error('Error fetching dispute details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dispute details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new dispute
export const createDispute = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      type,
      complainantId,
      complainantType,
      respondentId,
      respondentType,
      bookingId,
      title,
      description,
      category,
      priority,
      evidence
    } = req.body;

    const dispute = new Dispute({
      type,
      complainantId,
      complainantType,
      respondentId,
      respondentType,
      bookingId,
      title,
      description,
      category,
      priority: priority || 'medium',
      evidence: evidence || { screenshots: [], documents: [], messages: [] },
      timeline: [{
        status: 'open',
        description: 'Dispute created',
        updatedBy: 'system'
      }]
    });

    await dispute.save();

    return res.status(201).json({
      success: true,
      message: 'Dispute created successfully',
      dispute
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating dispute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update dispute status
export const updateDisputeStatus = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { disputeId } = req.params;
    const { status, notes, assignedTo, estimatedResolutionDate } = req.body;

    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    const previousStatus = dispute.status;
    dispute.status = status;

    if (assignedTo) {
      dispute.assignedTo = assignedTo;
      dispute.assignedAt = new Date();
    }

    if (estimatedResolutionDate) {
      dispute.estimatedResolutionDate = new Date(estimatedResolutionDate);
    }

    // Add to timeline
    dispute.timeline.push({
      status,
      description: notes || `Status changed from ${previousStatus} to ${status}`,
      timestamp: new Date(),
      updatedBy: 'admin_current_user' // TODO: Replace with actual admin ID
    });

    await dispute.save();

    return res.json({
      success: true,
      message: 'Dispute status updated successfully',
      dispute: {
        id: dispute._id,
        status: dispute.status,
        assignedTo: dispute.assignedTo,
        assignedAt: dispute.assignedAt,
        estimatedResolutionDate: dispute.estimatedResolutionDate
      }
    });
  } catch (error) {
    console.error('Error updating dispute status:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating dispute status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Add message to dispute
export const addDisputeMessage = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { disputeId } = req.params;
    const { senderId, senderType, message } = req.body;

    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.evidence.messages.push({
      senderId,
      senderType,
      message,
      timestamp: new Date()
    });

    await dispute.save();

    return res.json({
      success: true,
      message: 'Message added successfully',
      data: {
        senderId,
        senderType,
        message,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Error adding dispute message:', error);
    return res.status(500).json({
      success: false,
      message: 'Error adding dispute message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Resolve dispute
export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { disputeId } = req.params;
    const { action, compensation, refundAmount, notes } = req.body;

    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.status = 'resolved';
    dispute.resolution = {
      action,
      compensation: compensation || 0,
      refundAmount: refundAmount || 0,
      notes,
      resolvedBy: 'admin_current_user', // TODO: Replace with actual admin ID
      resolvedAt: new Date()
    };

    // Add to timeline
    dispute.timeline.push({
      status: 'resolved',
      description: `Dispute resolved: ${action}`,
      timestamp: new Date(),
      updatedBy: 'admin_current_user'
    });

    await dispute.save();

    return res.json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute: {
        id: dispute._id,
        status: dispute.status,
        resolution: dispute.resolution
      }
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resolving dispute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Escalate dispute
export const escalateDispute = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { disputeId } = req.params;
    const { escalationReason, assignedTo } = req.body;

    const dispute = await Dispute.findById(disputeId);
    
    if (!dispute) {
      return res.status(404).json({
        success: false,
        message: 'Dispute not found'
      });
    }

    dispute.status = 'escalated';
    dispute.escalation = {
      escalatedAt: new Date(),
      escalatedBy: 'admin_current_user', // TODO: Replace with actual admin ID
      escalationReason,
      assignedTo
    };

    dispute.assignedTo = assignedTo;
    dispute.assignedAt = new Date();

    // Add to timeline
    dispute.timeline.push({
      status: 'escalated',
      description: `Dispute escalated: ${escalationReason}`,
      timestamp: new Date(),
      updatedBy: 'admin_current_user'
    });

    await dispute.save();

    return res.json({
      success: true,
      message: 'Dispute escalated successfully',
      dispute: {
        id: dispute._id,
        status: dispute.status,
        escalation: dispute.escalation,
        assignedTo: dispute.assignedTo
      }
    });
  } catch (error) {
    console.error('Error escalating dispute:', error);
    return res.status(500).json({
      success: false,
      message: 'Error escalating dispute',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get dispute statistics
export const getDisputeStatistics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }

    const stats = await Dispute.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalDisputes: { $sum: 1 },
          openDisputes: {
            $sum: { $cond: [{ $eq: ['$status', 'open'] }, 1, 0] }
          },
          underReviewDisputes: {
            $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
          },
          investigatingDisputes: {
            $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] }
          },
          resolvedDisputes: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          escalatedDisputes: {
            $sum: { $cond: [{ $eq: ['$status', 'escalated'] }, 1, 0] }
          },
          totalCompensation: { $sum: '$resolution.compensation' },
          totalRefunds: { $sum: '$resolution.refundAmount' }
        }
      }
    ]);

    const statusBreakdown = await Dispute.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeBreakdown = await Dispute.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const priorityBreakdown = await Dispute.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      statistics: stats[0] || {
        totalDisputes: 0,
        openDisputes: 0,
        underReviewDisputes: 0,
        investigatingDisputes: 0,
        resolvedDisputes: 0,
        escalatedDisputes: 0,
        totalCompensation: 0,
        totalRefunds: 0
      },
      breakdowns: {
        status: statusBreakdown,
        type: typeBreakdown,
        priority: priorityBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching dispute statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching dispute statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Export dispute report
export const exportDisputeReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status, type } = req.query;
    
    const matchFilter: any = {};
    if (startDate || endDate) {
      matchFilter.createdAt = {};
      if (startDate) matchFilter.createdAt.$gte = new Date(startDate as string);
      if (endDate) matchFilter.createdAt.$lte = new Date(endDate as string);
    }
    
    if (status) {
      matchFilter.status = status;
    }
    
    if (type) {
      matchFilter.type = type;
    }

    const disputes = await Dispute.find(matchFilter)
      .populate('complainantId', 'fullName email')
      .populate('respondentId', 'fullName email')
      .populate('bookingId', 'bookingReference')
      .sort({ createdAt: -1 });

    const report = {
      period: {
        startDate,
        endDate
      },
      summary: {
        totalDisputes: disputes.length,
        resolvedDisputes: disputes.filter(d => d.status === 'resolved').length,
        escalatedDisputes: disputes.filter(d => d.status === 'escalated').length,
        totalCompensation: disputes.reduce((sum, d) => sum + (d.resolution?.compensation || 0), 0),
        totalRefunds: disputes.reduce((sum, d) => sum + (d.resolution?.refundAmount || 0), 0)
      },
      disputes: disputes.map(d => ({
        id: d._id,
        type: d.type,
        title: d.title,
        category: d.category,
        priority: d.priority,
        status: d.status,
        complainant: d.complainantId,
        respondent: d.respondentId,
        bookingReference: (d.bookingId as any)?.bookingReference,
        createdAt: d.createdAt,
        resolvedAt: d.resolution?.resolvedAt,
        resolution: d.resolution
      }))
    };

    return res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error exporting dispute report:', error);
    return res.status(500).json({
      success: false,
      message: 'Error exporting dispute report',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
