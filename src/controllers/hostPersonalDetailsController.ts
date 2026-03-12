import { Request, Response } from 'express';
import HostPersonalDetails from '../models/HostPersonalDetails';

// Get host personal details
export const getHostPersonalDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;
    
    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
      return;
    }

    const details = await HostPersonalDetails.findOne({ hostId });
    
    if (!details) {
      res.status(404).json({
        success: false,
        message: 'Personal details not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: details
    });
  } catch (error: any) {
    console.error('Error fetching host personal details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal details',
      error: error.message
    });
  }
};

// Create or update host personal details
export const upsertHostPersonalDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;
    const {
      profilePhoto,
      fullName,
      profession,
      age,
      gender,
      nativeLanguage,
      otherLanguages,
      localAreaKnowledge,
      city,
      state,
      country,
      bio,
      phoneNumber,
      email
    } = req.body;

    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
      return;
    }

    // Validate required fields
    if (!fullName || !profession || !age || !gender || !nativeLanguage) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: fullName, profession, age, gender, nativeLanguage'
      });
      return;
    }

    // Find existing record or create new one
    const details = await HostPersonalDetails.findOneAndUpdate(
      { hostId },
      {
        hostId,
        profilePhoto,
        fullName,
        profession,
        age,
        gender,
        nativeLanguage,
        otherLanguages: otherLanguages || [],
        localAreaKnowledge,
        city,
        state,
        country: country || 'India',
        bio,
        phoneNumber,
        email
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true 
      }
    );

    res.status(200).json({
      success: true,
      message: 'Personal details saved successfully',
      data: details
    });
  } catch (error: any) {
    console.error('Error saving host personal details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save personal details',
      error: error.message
    });
  }
};

// Delete host personal details
export const deleteHostPersonalDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId } = req.params;
    
    if (!hostId) {
      res.status(400).json({
        success: false,
        message: 'Host ID is required'
      });
      return;
    }

    const result = await HostPersonalDetails.findOneAndDelete({ hostId });
    
    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Personal details not found'
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Personal details deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting host personal details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete personal details',
      error: error.message
    });
  }
};
