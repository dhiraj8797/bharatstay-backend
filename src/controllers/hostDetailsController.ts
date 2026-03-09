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
      return;
    }

    // Find host details
    const hostDetails = await HostDetails.findOne({ hostId });

    if (!hostDetails) {
      return res.status(404).json({
        success: false,
        message: 'Host details not found'
      });
      return;
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
    
    console.log('Saving host details for hostId:', hostId);
    console.log('Details data:', detailsData);
    
    if (!hostId) {
      return res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
      return;
    }

    // Handle hostingSince field - convert string to number if needed
    if (detailsData.hostingSince && typeof detailsData.hostingSince === 'string') {
      const parsedYear = parseInt(detailsData.hostingSince);
      if (!isNaN(parsedYear)) {
        detailsData.hostingSince = parsedYear;
      }
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
      console.log('Updated existing host details:', savedDetails);
    } else {
      // Create new details
      savedDetails = new HostDetails({
        hostId,
        ...detailsData
      });
      await savedDetails.save();
      console.log('Created new host details:', savedDetails);
    }

    return res.status(200).json({
      success: true,
      message: 'Host details saved successfully',
      hostDetails: savedDetails
    });
  } catch (error) {
    console.error('Error saving host details:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      message: 'Error saving host details',
      error: error instanceof Error ? error.message : 'Unknown error'
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
      return;
    }

    // Delete host details
    const deletedDetails = await HostDetails.findOneAndDelete({ hostId });

    if (!deletedDetails) {
      return res.status(404).json({
        success: false,
        message: 'Host details not found'
      });
      return;
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
      return;
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
      return;
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
