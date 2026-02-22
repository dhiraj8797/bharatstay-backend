import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import HostDashBoardStay from '../models/HostDashBoardStay';

// Create a new stay
export const createStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const {
      hostId,
      stayName,
      stayType,
      propertyAge,
      numberOfRooms,
      currentLocation,
      address,
      city,
      state,
      pincode,
      description,
      nearbyAttractions,
      houseRules,
      checkInTime,
      checkOutTime,
      allowPets,
      photos,
      amenities,
      offerCloakRoom,
      cloakRoomPrice,
      cloakRoomMaxHrs,
      cloakRoomExtraCharge,
    } = req.body;

    const newStay = new HostDashBoardStay({
      hostId,
      stayName,
      stayType,
      propertyAge,
      numberOfRooms,
      currentLocation,
      address,
      city,
      state,
      pincode,
      description,
      nearbyAttractions,
      houseRules,
      checkInTime,
      checkOutTime,
      allowPets,
      photos,
      amenities,
      offerCloakRoom,
      cloakRoomPrice,
      cloakRoomMaxHrs,
      cloakRoomExtraCharge,
      status: 'pending',
    });

    await newStay.save();

    res.status(201).json({
      success: true,
      message: 'Stay created successfully',
      stay: newStay,
    });
  } catch (error) {
    console.error('Error creating stay:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating stay',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get all stays for a host
export const getHostStays = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;
    const { status } = req.query;

    const query: any = { hostId };
    if (status) {
      query.status = status;
    }

    const stays = await HostDashBoardStay.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      stays,
    });
  } catch (error) {
    console.error('Error fetching stays:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stays',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Get a single stay by ID
export const getStayById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    const stay = await HostDashBoardStay.findById(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.json({
      success: true,
      stay,
    });
  } catch (error) {
    console.error('Error fetching stay:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stay',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update a stay
export const updateStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { stayId } = req.params;
    const updateData = req.body;

    const stay = await HostDashBoardStay.findByIdAndUpdate(
      stayId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
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
      message: 'Stay updated successfully',
      stay,
    });
  } catch (error) {
    console.error('Error updating stay:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stay',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Delete a stay
export const deleteStay = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    const stay = await HostDashBoardStay.findByIdAndDelete(stayId);

    if (!stay) {
      res.status(404).json({
        success: false,
        message: 'Stay not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Stay deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting stay:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting stay',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// Update stay status
export const updateStayStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'pending'];
    if (!validStatuses.includes(status)) {
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
      message: 'Stay status updated successfully',
      stay,
    });
  } catch (error) {
    console.error('Error updating stay status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating stay status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
