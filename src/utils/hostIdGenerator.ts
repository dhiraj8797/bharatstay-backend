// Utility to generate unique 7-digit Host ID
// Format: StateCode(2) + CityCode(1) + Last4Mobile(4) = 7 characters
// Example: Maharashtra(MH) + Mumbai(M) + Mobile 9876543210(3210) = MHM3210

/**
 * State code mapping - First 2 characters of state name or predefined codes
 */
const stateCodes: { [key: string]: string } = {
  'andhra pradesh': 'AP',
  'arunachal pradesh': 'AR',
  'assam': 'AS',
  'bihar': 'BR',
  'chhattisgarh': 'CG',
  'goa': 'GA',
  'gujarat': 'GJ',
  'haryana': 'HR',
  'himachal pradesh': 'HP',
  'jharkhand': 'JH',
  'karnataka': 'KA',
  'kerala': 'KL',
  'madhya pradesh': 'MP',
  'maharashtra': 'MH',
  'manipur': 'MN',
  'meghalaya': 'ML',
  'mizoram': 'MZ',
  'nagaland': 'NL',
  'odisha': 'OD',
  'punjab': 'PB',
  'rajasthan': 'RJ',
  'sikkim': 'SK',
  'tamil nadu': 'TN',
  'telangana': 'TG',
  'tripura': 'TR',
  'uttar pradesh': 'UP',
  'uttarakhand': 'UK',
  'west bengal': 'WB',
  'andaman and nicobar': 'AN',
  'chandigarh': 'CH',
  'dadra and nagar haveli': 'DN',
  'daman and diu': 'DD',
  'delhi': 'DL',
  'jammu and kashmir': 'JK',
  'ladakh': 'LA',
  'lakshadweep': 'LD',
  'puducherry': 'PY'
};

/**
 * Generate state code from state name
 * Returns first 2 uppercase characters or mapped code
 */
export function getStateCode(state: string): string {
  const normalizedState = state.toLowerCase().trim();
  
  // Check if we have a predefined code
  if (stateCodes[normalizedState]) {
    return stateCodes[normalizedState];
  }
  
  // Fallback: First 2 characters uppercase
  return state.substring(0, 2).toUpperCase();
}

/**
 * Generate city code from city name
 * Returns first character uppercase
 */
export function getCityCode(city: string): string {
  // First character uppercase
  return city.charAt(0).toUpperCase();
}

/**
 * Get last 4 digits of phone number
 */
export function getLast4Mobile(phoneNumber: string): string {
  // Remove any non-digit characters and get last 4
  const cleaned = phoneNumber.replace(/\D/g, '');
  return cleaned.slice(-4);
}

/**
 * Generate unique 7-digit Host ID
 * Format: StateCode(2) + CityCode(1) + Last4Mobile(4)
 */
export function generateHostId(state: string, city: string, phoneNumber: string): string {
  const stateCode = getStateCode(state);
  const cityCode = getCityCode(city);
  const last4Mobile = getLast4Mobile(phoneNumber);
  
  return `${stateCode}${cityCode}${last4Mobile}`;
}

/**
 * Check if a Host ID already exists in the database
 */
export async function isHostIdUnique(HostModel: any, hostId: string): Promise<boolean> {
  const existingHost = await HostModel.findOne({ hostId });
  return !existingHost;
}

/**
 * Generate a unique Host ID with collision handling
 * In rare case of collision, appends a random digit
 */
export async function generateUniqueHostId(
  HostModel: any,
  state: string,
  city: string,
  phoneNumber: string
): Promise<string> {
  let hostId = generateHostId(state, city, phoneNumber);
  
  // Check uniqueness
  const isUnique = await isHostIdUnique(HostModel, hostId);
  
  if (isUnique) {
    return hostId;
  }
  
  // Handle collision by appending a random character (A-Z, 0-9)
  // This keeps it 7 characters but ensures uniqueness
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    const newHostId = hostId.substring(0, 6) + randomChar;
    
    const isNewUnique = await isHostIdUnique(HostModel, newHostId);
    if (isNewUnique) {
      return newHostId;
    }
    attempts++;
  }
  
  // Fallback: Use timestamp last digit + random
  const timestamp = Date.now().toString().slice(-1);
  return hostId.substring(0, 6) + timestamp;
}

export default {
  generateHostId,
  generateUniqueHostId,
  getStateCode,
  getCityCode,
  getLast4Mobile,
  isHostIdUnique
};
