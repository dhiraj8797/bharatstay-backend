import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { Content } from '../models/Content';

// Get all content with filters
export const getAllContent = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      type, 
      category,
      isActive,
      search 
    } = req.query;
    
    const skip = (Number(page) - 1) * Number(limit);
    
    // Build filter
    const filter: any = {};
    
    if (type) {
      filter.type = type;
    }
    
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [search] } }
      ];
    }

    const content = await Content.find(filter)
      .sort({ type: 1, order: 1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Content.countDocuments(filter);

    return res.json({
      success: true,
      content,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get content by ID
export const getContentById = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    return res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching content details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching content details',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new content
export const createContent = async (req: Request, res: Response) => {
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
      title,
      content,
      description,
      imageUrl,
      linkUrl,
      category,
      author,
      tags,
      metadata,
      isActive = true,
      order = 0
    } = req.body;

    // Get the highest order for the type to auto-increment
    const lastContent = await Content.findOne({ type }).sort({ order: -1 });
    const newOrder = lastContent ? lastContent.order + 1 : 1;

    const newContent = new Content({
      type,
      title,
      content,
      description,
      imageUrl,
      linkUrl,
      category,
      author,
      tags,
      metadata,
      isActive,
      order: order || newOrder,
      publishedAt: type === 'blog_post' ? new Date() : undefined
    });

    await newContent.save();

    return res.status(201).json({
      success: true,
      message: 'Content created successfully',
      content: newContent
    });
  } catch (error) {
    console.error('Error creating content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update content
export const updateContent = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { contentId } = req.params;
    const updateData = req.body;

    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Update fields
    if (updateData.type !== undefined) content.type = updateData.type;
    if (updateData.title !== undefined) content.title = updateData.title;
    if (updateData.content !== undefined) content.content = updateData.content;
    if (updateData.description !== undefined) content.description = updateData.description;
    if (updateData.imageUrl !== undefined) content.imageUrl = updateData.imageUrl;
    if (updateData.linkUrl !== undefined) content.linkUrl = updateData.linkUrl;
    if (updateData.category !== undefined) content.category = updateData.category;
    if (updateData.author !== undefined) content.author = updateData.author;
    if (updateData.tags !== undefined) content.tags = updateData.tags;
    if (updateData.metadata !== undefined) content.metadata = updateData.metadata;
    if (updateData.isActive !== undefined) content.isActive = updateData.isActive;
    if (updateData.order !== undefined) content.order = updateData.order;
    if (updateData.expiresAt !== undefined) content.expiresAt = new Date(updateData.expiresAt);

    // Set published date for blog posts when they become active
    if (updateData.type === 'blog_post' && updateData.isActive && !content.publishedAt) {
      content.publishedAt = new Date();
    }

    await content.save();

    return res.json({
      success: true,
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Error updating content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete content
export const deleteContent = async (req: Request, res: Response) => {
  try {
    const { contentId } = req.params;

    const content = await Content.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    await Content.findByIdAndDelete(contentId);

    return res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get content by type
export const getContentByType = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { isActive = 'true' } = req.query;

    const filter: any = { type };
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const content = await Content.find(filter)
      .sort({ order: 1, createdAt: -1 });

    return res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching content by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching content by type',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Reorder content
export const reorderContent = async (req: Request, res: Response) => {
  try {
    const { contentOrders } = req.body; // Array of { id: string, order: number }

    if (!Array.isArray(contentOrders)) {
      return res.status(400).json({
        success: false,
        message: 'Content orders must be an array'
      });
    }

    const updatePromises = contentOrders.map(({ id, order }) => 
      Content.findByIdAndUpdate(id, { order })
    );

    await Promise.all(updatePromises);

    return res.json({
      success: true,
      message: 'Content reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering content:', error);
    return res.status(500).json({
      success: false,
      message: 'Error reordering content',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get featured cities
export const getFeaturedCities = async (req: Request, res: Response) => {
  try {
    const cities = await Content.find({ 
      type: 'featured_city', 
      isActive: true 
    })
      .sort({ order: 1, title: 1 })
      .select('title description imageUrl linkUrl order');

    return res.json({
      success: true,
      cities
    });
  } catch (error) {
    console.error('Error fetching featured cities:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching featured cities',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get active banners
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const banners = await Content.find({ 
      type: 'banner', 
      isActive: true 
    })
      .sort({ order: 1, createdAt: -1 })
      .select('title description imageUrl linkUrl order');

    return res.json({
      success: true,
      banners
    });
  } catch (error) {
    console.error('Error fetching active banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching active banners',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get FAQ items
export const getFAQItems = async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    
    const filter: any = { 
      type: 'faq', 
      isActive: true 
    };
    
    if (category) {
      filter.category = category;
    }

    const faqs = await Content.find(filter)
      .sort({ order: 1, title: 1 })
      .select('title content category order');

    return res.json({
      success: true,
      faqs
    });
  } catch (error) {
    console.error('Error fetching FAQ items:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching FAQ items',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get blog posts
export const getBlogPosts = async (req: Request, res: Response) => {
  try {
    const { category, limit = 10 } = req.query;
    
    const filter: any = { 
      type: 'blog_post', 
      isActive: true 
    };
    
    if (category) {
      filter.category = category;
    }

    const posts = await Content.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .select('title description author publishedAt tags imageUrl order')
      .limit(Number(limit));

    return res.json({
      success: true,
      posts
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching blog posts',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get terms and policies
export const getTermsAndPolicies = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    const content = await Content.find({ 
      type: { $in: ['term', 'policy'] },
      isActive: true 
    })
      .sort({ type: 1, order: 1, title: 1 })
      .select('title type content order');

    return res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error fetching terms and policies:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching terms and policies',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
