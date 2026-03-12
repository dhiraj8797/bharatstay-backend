import { Request, Response } from 'express';
import StayPhoto from '../models/StayPhoto';
import HostDashBoardStay from '../models/HostDashBoardStay';
import path from 'path';
import fs from 'fs';

// Upload photos for a stay
export const uploadStayPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId, hostId, category = 'other' } = req.body;
    
    if (!stayId || !hostId) {
      res.status(400).json({ success: false, message: 'stayId and hostId are required' });
      return;
    }

    // Check if stay exists
    const stay = await HostDashBoardStay.findById(stayId);
    if (!stay) {
      res.status(404).json({ success: false, message: 'Stay not found' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No files uploaded' });
      return;
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadedPhotos = [];

    // Get current photo count for display order
    const existingPhotoCount = await StayPhoto.countDocuments({ stayId });

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const photo = new StayPhoto({
        stayId,
        hostId,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        category,
        isPrimary: existingPhotoCount === 0 && i === 0, // First photo is primary
        displayOrder: existingPhotoCount + i,
        url: `${baseUrl}/uploads/stay-photos/${file.filename}`,
      });

      await photo.save();
      uploadedPhotos.push(photo);
    }

    // Update stay's photos array with new filenames
    const newFilenames = files.map(f => f.filename);
    await HostDashBoardStay.findByIdAndUpdate(stayId, {
      $push: { photos: { $each: newFilenames } },
    });

    res.status(201).json({
      success: true,
      message: `${files.length} photos uploaded successfully`,
      photos: uploadedPhotos,
    });
  } catch (error) {
    console.error('Upload photos error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload photos', error: (error as Error).message });
  }
};

// Get all photos for a stay
export const getStayPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;

    const photos = await StayPhoto.find({ stayId })
      .sort({ displayOrder: 1 })
      .select('-__v');

    res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error('Get stay photos error:', error);
    res.status(500).json({ success: false, message: 'Failed to get photos' });
  }
};

// Get photos by category
export const getPhotosByCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId, category } = req.params;

    const photos = await StayPhoto.find({ stayId, category })
      .sort({ displayOrder: 1 });

    res.status(200).json({
      success: true,
      count: photos.length,
      photos,
    });
  } catch (error) {
    console.error('Get photos by category error:', error);
    res.status(500).json({ success: false, message: 'Failed to get photos' });
  }
};

// Update photo metadata
export const updatePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;
    const { caption, category, displayOrder, isPrimary } = req.body;

    const photo = await StayPhoto.findById(photoId);
    if (!photo) {
      res.status(404).json({ success: false, message: 'Photo not found' });
      return;
    }

    // Update fields
    if (caption !== undefined) photo.caption = caption;
    if (category !== undefined) photo.category = category;
    if (displayOrder !== undefined) photo.displayOrder = displayOrder;
    if (isPrimary !== undefined) {
      // If setting as primary, unset other primary photos for this stay
      if (isPrimary) {
        await StayPhoto.updateMany(
          { stayId: photo.stayId, _id: { $ne: photoId } },
          { isPrimary: false }
        );
      }
      photo.isPrimary = isPrimary;
    }

    await photo.save();

    res.status(200).json({
      success: true,
      message: 'Photo updated successfully',
      photo,
    });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to update photo' });
  }
};

// Delete a photo
export const deletePhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { photoId } = req.params;

    const photo = await StayPhoto.findById(photoId);
    if (!photo) {
      res.status(404).json({ success: false, message: 'Photo not found' });
      return;
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads/stay-photos/', photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove from stay's photos array
    await HostDashBoardStay.findByIdAndUpdate(photo.stayId, {
      $pull: { photos: photo.filename },
    });

    // Delete photo document
    await StayPhoto.findByIdAndDelete(photoId);

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete photo' });
  }
};

// Set primary photo
export const setPrimaryPhoto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId, photoId } = req.params;

    // Unset current primary
    await StayPhoto.updateMany(
      { stayId },
      { isPrimary: false }
    );

    // Set new primary
    const photo = await StayPhoto.findByIdAndUpdate(
      photoId,
      { isPrimary: true },
      { new: true }
    );

    if (!photo) {
      res.status(404).json({ success: false, message: 'Photo not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Primary photo set successfully',
      photo,
    });
  } catch (error) {
    console.error('Set primary photo error:', error);
    res.status(500).json({ success: false, message: 'Failed to set primary photo' });
  }
};

// Reorder photos
export const reorderPhotos = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stayId } = req.params;
    const { photoOrders } = req.body; // Array of { photoId, displayOrder }

    if (!Array.isArray(photoOrders)) {
      res.status(400).json({ success: false, message: 'photoOrders array required' });
      return;
    }

    // Update all photos in bulk
    const bulkOps = photoOrders.map(({ photoId, displayOrder }) => ({
      updateOne: {
        filter: { _id: photoId, stayId },
        update: { displayOrder },
      },
    }));

    await StayPhoto.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Photos reordered successfully',
    });
  } catch (error) {
    console.error('Reorder photos error:', error);
    res.status(500).json({ success: false, message: 'Failed to reorder photos' });
  }
};
