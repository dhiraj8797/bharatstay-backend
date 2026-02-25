import { Request, Response } from 'express';
import nodemailer from 'nodemailer';

// Contact form submission handler
export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, message, source, timestamp } = req.body;

    // Validate input
    if (!email || !message) {
      res.status(400).json({
        success: false,
        message: 'Email and message are required'
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
      return;
    }

    // Message length validation
    if (message.trim().length < 10) {
      res.status(400).json({
        success: false,
        message: 'Message must be at least 10 characters long'
      });
      return;
    }

    // Create nodemailer transporter (configure with your email service)
    const transporter = nodemailer.createTransport({
      service: 'gmail', // or your email service
      auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email
        pass: process.env.EMAIL_PASS || 'your-app-password', // Your email password or app password
      },
    });

    // Email to admin (you)
    const adminMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: 'support@bharat-stay.com', // Your email to receive notifications
      subject: `New Contact Form Submission from BharatStay`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0E3B3B; color: #F6F4EF; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">BharatStay Contact Form</h1>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #D95A2B; margin-bottom: 20px;">New Message Received</h2>
            <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
              <p><strong>From:</strong> ${email}</p>
              <p><strong>Source:</strong> ${source || 'Unknown'}</p>
              <p><strong>Date:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #333;">Message:</h3>
              <p style="white-space: pre-wrap; color: #555; line-height: 1.5;">${message}</p>
            </div>
          </div>
          <div style="background: #0E3B3B; color: #F6F4EF; padding: 15px; text-align: center; font-size: 12px;">
            <p>This message was sent from the BharatStay contact form</p>
          </div>
        </div>
      `,
    };

    // Email to user (auto-reply)
    const userMailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Thank you for contacting BharatStay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0E3B3B; color: #F6F4EF; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">BharatStay</h1>
            <p style="margin: 5px 0 0;">India's Premier Homestay Platform</p>
          </div>
          <div style="padding: 20px; background: #f9f9f9;">
            <h2 style="color: #D95A2B; margin-bottom: 20px;">Thank You for Your Message!</h2>
            <p style="color: #333; line-height: 1.5;">
              Dear Traveler,
            </p>
            <p style="color: #555; line-height: 1.5;">
              We have received your message and will get back to you within 24 hours. Our team is excited to help you plan your perfect Indian homestay experience!
            </p>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Your Message:</h3>
              <p style="white-space: pre-wrap; color: #555; line-height: 1.5;">${message}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://bharatstay.com" style="background: #D95A2B; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                Explore Homestays
              </a>
            </div>
          </div>
          <div style="background: #0E3B3B; color: #F6F4EF; padding: 15px; text-align: center; font-size: 12px;">
            <p>© ${new Date().getFullYear()} BharatStay. All rights reserved.</p>
            <p>Connect with us: Facebook | X | LinkedIn</p>
          </div>
        </div>
      `,
    };

    // Send emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    // Log the contact submission for records
    console.log('Contact form submission:', {
      email,
      message: message.substring(0, 100) + '...',
      source,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};
