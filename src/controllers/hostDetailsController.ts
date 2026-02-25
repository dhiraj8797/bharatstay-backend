import { Request, Response } from 'express';
import { HostDetails } from '../models/HostDetails';
import { getConnections } from '../models/HostSignUp';

// Get host details by host ID
export const getHostDetails = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
    }

    // Find host details
    const hostDetails = await HostDetails.findOne({ hostId });

    if (!hostDetails) {
      return res.status(404).json({
        success: false,
        message: 'Host details not found'
      });
    }

    return res.status(200).json({
      success: true,
      hostDetails
    });
  } catch (error) {
    console.error('Error fetching host details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Create or update host details
export const saveHostDetails = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    const detailsData = req.body;
    
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
    }

    // Find existing host details
    const existingDetails = await HostDetails.findOne({ hostId });

    let savedDetails;

    if (existingDetails) {
      // Update existing details
      savedDetails = await HostDetails.findOneAndUpdate(
        { hostId },
        { 
          ...detailsData,
          updatedAt: new Date()
        },
        { new: true, runValidators: true }
      );
    } else {
      // Create new details
      savedDetails = new HostDetails({
        hostId,
        ...detailsData
      });
      await savedDetails.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Host details saved successfully',
      hostDetails: savedDetails
    });
  } catch (error) {
    console.error('Error saving host details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete host details
export const deleteHostDetails = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
    }

    // Delete host details
    const deletedDetails = await HostDetails.findOneAndDelete({ hostId });

    if (!deletedDetails) {
      return res.status(404).json({
        success: false,
        message: 'Host details not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Host details deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting host details:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get host details for guest view (public data only)
export const getHostDetailsForGuest = async (req: Request, res: Response) => {
  try {
    const { hostId } = req.params;
    
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
    }

    // Find host details
    const hostDetails = await HostDetails.findOne({ hostId }, {
      // Only include public fields
      name: 1,
      profession: 1,
      nativeLanguage: 1,
      otherLanguages: 1,
      localAreaKnowledge: 1,
      currentCityDuration: 1,
      livesOnProperty: 1,
      hostingSince: 1,
      hobbies: 1,
      instagram: 1,
      facebook: 1,
      govIdVerified: 1,
      phoneVerified: 1,
      emailVerified: 1,
      profilePhoto: 1,
      description: 1
    });

    if (!hostDetails) {
      return res.status(404).json({
        success: false,
        message: 'Host details not found'
      });
    }

    return res.status(200).json({
      success: true,
      hostDetails
    });
  } catch (error) {
    console.error('Error fetching host details for guest:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
