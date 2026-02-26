import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AdminConsole } from '../models/AdminConsole';

// Create a new admin
export const createAdmin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { adminId, name, email, role, permissions } = req.body;

    // Check if admin already exists
    const existingAdmin = await AdminConsole.findOne({
      $or: [{ adminId }, { email }]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin with this ID or email already exists'
      });
    }

    // Create new admin
    const admin = new AdminConsole({
      adminId,
      name,
      email,
      role: role || 'admin',
      permissions: permissions || ['view_analytics']
    });

    await admin.save();

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        adminId: admin.adminId,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions,
        isActive: admin.isActive,
        createdAt: admin.createdAt
      }
    });
  } catch (error) {
    console.error('Error creating admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get all admins
export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, role, isActive } = req.query;
    
    // Build filter
    const filter: any = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const admins = await AdminConsole.find(filter)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await AdminConsole.countDocuments(filter);

    return res.json({
      success: true,
      admins,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admins',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get admin by ID
export const getAdminById = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminConsole.findOne({ adminId });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('Error fetching admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update admin
export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { adminId } = req.params;
    const { name, email, role, permissions, isActive } = req.body;

    const admin = await AdminConsole.findOne({ adminId });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== admin.email) {
      const existingAdmin = await AdminConsole.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Update admin
    const updatedAdmin = await AdminConsole.findOneAndUpdate(
      { adminId },
      {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(permissions && { permissions }),
        ...(isActive !== undefined && { isActive })
      },
      { new: true, runValidators: true }
    );

    return res.json({
      success: true,
      message: 'Admin updated successfully',
      admin: updatedAdmin
    });
  } catch (error) {
    console.error('Error updating admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete admin
export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminConsole.findOne({ adminId });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    await AdminConsole.deleteOne({ adminId });

    return res.json({
      success: true,
      message: 'Admin deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting admin',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update admin last login
export const updateLastLogin = async (req: Request, res: Response) => {
  try {
    const { adminId } = req.params;

    const admin = await AdminConsole.findOneAndUpdate(
      { adminId },
      { lastLogin: new Date() },
      { new: true }
    );

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found'
      });
    }

    return res.json({
      success: true,
      message: 'Last login updated successfully',
      lastLogin: admin.lastLogin
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating last login',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get admin statistics
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const totalAdmins = await AdminConsole.countDocuments();
    const activeAdmins = await AdminConsole.countDocuments({ isActive: true });
    const inactiveAdmins = await AdminConsole.countDocuments({ isActive: false });

    const roleStats = await AdminConsole.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    return res.json({
      success: true,
      stats: {
        totalAdmins,
        activeAdmins,
        inactiveAdmins,
        roleBreakdown: roleStats.reduce((acc: any, stat: any) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
