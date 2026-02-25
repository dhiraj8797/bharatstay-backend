import { Request, Response } from 'express';

// UPI verification controller
export const verifyUPI = async (req: Request, res: Response) => {
  try {
    const { upiId } = req.body;

    if (!upiId) {
      return res.status(400).json({
        success: false,
        message: 'UPI ID is required'
      });
    }

    // Basic UPI ID validation
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    if (!upiRegex.test(upiId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid UPI ID format. Please enter a valid UPI ID (e.g., username@paytm)'
      });
    }

    // Extract UPI provider from the UPI ID
    const upiProvider = upiId.split('@')[1].toLowerCase();
    
    // Check if it's a known UPI provider
    const knownProviders = [
      'paytm', 'phonepe', 'gpay', 'googlepay', 'tez', 'bhim', 'ybl', 
      'axisbank', 'hdfcbank', 'icici', 'sbi', 'kotak', 'pnb', 'bob',
      'upi', 'rbl', 'idfc', 'idfcbank', 'yesbank', 'citibank', 'hsbc'
    ];

    const isValidProvider = knownProviders.some(provider => 
      upiProvider.includes(provider)
    );

    if (!isValidProvider) {
      return res.status(400).json({
        success: false,
        message: 'Unknown UPI provider. Please use a supported UPI app'
      });
    }

    // Simulate UPI verification (in production, this would integrate with actual UPI APIs)
    // For now, we'll do basic validation and return success
    const verificationResult = await simulateUPIVerification(upiId);

    if (verificationResult.valid) {
      res.status(200).json({
        success: true,
        message: 'UPI ID verified successfully',
        data: {
          upiId: upiId,
          provider: verificationResult.provider,
          accountHolder: verificationResult.accountHolder,
          isValid: true,
          verifiedAt: new Date().toISOString()
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: verificationResult.message || 'UPI ID verification failed'
      });
    }

  } catch (error: any) {
    console.error('UPI verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify UPI ID',
      error: error.message
    });
  }
};

// Simulate UPI verification (mock implementation)
async function simulateUPIVerification(upiId: string) {
  // In production, this would call actual UPI provider APIs
  // For demo purposes, we'll simulate verification with some basic rules
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call delay

  const provider = upiId.split('@')[1].toLowerCase();
  const username = upiId.split('@')[0];

  // Mock validation rules
  if (username.length < 3) {
    return {
      valid: false,
      message: 'Username is too short'
    };
  }

  if (username.length > 30) {
    return {
      valid: false,
      message: 'Username is too long'
    };
  }

  // Simulate different provider behaviors
  const providerConfigs = {
    'paytm': { successRate: 0.95, accountHolder: 'Paytm User' },
    'phonepe': { successRate: 0.93, accountHolder: 'PhonePe User' },
    'gpay': { successRate: 0.94, accountHolder: 'Google Pay User' },
    'bhim': { successRate: 0.92, accountHolder: 'BHIM User' },
    'ybl': { successRate: 0.91, accountHolder: 'Yes Bank User' }
  };

  const config = Object.entries(providerConfigs).find(([key]) => 
    provider.includes(key)
  ) || ['unknown', { successRate: 0.8, accountHolder: 'UPI User' }];

  const [providerName, providerConfig] = config;
  const isSuccess = Math.random() < providerConfig.successRate;

  if (isSuccess) {
    return {
      valid: true,
      provider: providerName.charAt(0).toUpperCase() + providerName.slice(1),
      accountHolder: providerConfig.accountHolder
    };
  } else {
    return {
      valid: false,
      message: 'UPI ID not found or inactive. Please check your UPI ID and try again.'
    };
  }
}

// Get supported UPI providers
export const getSupportedProviders = async (req: Request, res: Response) => {
  try {
    const providers = [
      { name: 'Paytm', code: 'paytm', icon: '📱', description: 'Most popular UPI app' },
      { name: 'PhonePe', code: 'phonepe', icon: '💙', description: 'Fast and reliable' },
      { name: 'Google Pay', code: 'gpay', icon: '💚', description: 'Google\'s UPI app' },
      { name: 'BHIM', code: 'bhim', icon: '🇮🇳', description: 'Official government app' },
      { name: 'Yes Bank', code: 'ybl', icon: '🏦', description: 'Yes Bank UPI' },
      { name: 'Axis Bank', code: 'axisbank', icon: '🏦', description: 'Axis Bank UPI' },
      { name: 'HDFC Bank', code: 'hdfcbank', icon: '🏦', description: 'HDFC Bank UPI' },
      { name: 'ICICI Bank', code: 'icici', icon: '🏦', description: 'ICICI Bank UPI' },
      { name: 'SBI', code: 'sbi', icon: '🏦', description: 'State Bank UPI' },
      { name: 'Kotak', code: 'kotak', icon: '🏦', description: 'Kotak Bank UPI' }
    ];

    res.status(200).json({
      success: true,
      data: providers
    });

  } catch (error: any) {
    console.error('Get providers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get supported providers',
      error: error.message
    });
  }
};
