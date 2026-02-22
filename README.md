# Backend Setup Instructions

## Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- npm or yarn

## Installation

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Configure Environment Variables**
Edit `.env` file:
```env
MONGODB_URI=mongodb://localhost:27017/bharatstay
PORT=5000
NODE_ENV=development
```

For MongoDB Atlas:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bharatstay
```

3. **Start MongoDB** (if local)
```bash
mongod
```

4. **Run Backend Server**
```bash
npm run dev
```

Server will start at `http://localhost:5000`

---

## AUTHENTICATION API ENDPOINTS (SIGN IN)

### 1. Sign In with Phone Number
**POST** `/api/auth/signin`
```json
{
  "phoneNumber": "9876543210"
}
```
Success Response:
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "userId": "...",
  "otp": "123456"
}
```
Error Response (Not Registered):
```json
{
  "success": false,
  "message": "Phone number not registered. Please sign up first.",
  "redirectTo": "signup"
}
```

### 2. Verify Sign In OTP
**POST** `/api/auth/verify-signin-otp`
```json
{
  "userId": "...",
  "otp": "123456"
}
```
Response:
```json
{
  "success": true,
  "message": "Sign in successful",
  "userId": "...",
  "user": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "9876543210"
  }
}
```

### 3. Resend Sign In OTP
**POST** `/api/auth/resend-signin-otp`
```json
{
  "userId": "..."
}
```
Response:
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "userId": "...",
  "otp": "123456"
}
```

---

## USER SIGN-UP API ENDPOINTS

### 1. Register User (Send OTP)
**POST** `/api/user/register`
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "9876543210"
}
```
Response:
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "userId": "...",
  "otp": "123456"
}
```

### 2. Verify OTP
**POST** `/api/user/verify-otp`
```json
{
  "userId": "...",
  "otp": "123456"
}
```

### 3. Complete Registration
**POST** `/api/user/complete-registration`
```json
{
  "userId": "...",
  "termsAccepted": true
}
```

### 4. Resend OTP
**POST** `/api/user/resend-otp`
```json
{
  "userId": "..."
}
```

### 5. Get User Details
**GET** `/api/user/:userId`

---

## HOST SIGN-UP API ENDPOINTS

### 1. Register Personal Details
**POST** `/api/host/register-personal`
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "9876543210",
  "dateOfBirth": "1990-01-15"
}
```
Response:
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "hostId": "...",
  "otp": "123456"
}
```

### 2. Verify OTP
**POST** `/api/host/verify-otp`
```json
{
  "hostId": "...",
  "otp": "123456"
}
```

### 3. Submit ID Proof
**POST** `/api/host/submit-id-proof`
- Form Data:
  - `hostId`: string
  - `idType`: 'aadhaar' | 'pan' | 'passport'
  - `idProof`: file (multipart/form-data)

### 4. Submit Location Details
**POST** `/api/host/submit-location`
```json
{
  "hostId": "...",
  "fullAddress": "123 Marine Drive",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postalCode": "400020",
  "latitude": 19.0176,
  "longitude": 72.8292,
  "landmarks": "Near beach"
}
```

### 5. Complete Registration
**POST** `/api/host/complete-registration`
```json
{
  "hostId": "...",
  "termsAccepted": true
}
```

### 6. Get Host Details
**GET** `/api/host/:hostId`

---

## Database Schemas

### UserSignUp Collection
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String (unique),
  phoneNumber: String (unique),
  otpVerified: Boolean,
  termsAccepted: Boolean,
  status: 'active' | 'inactive' | 'suspended',
  registrationCompleted: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### HostSignUp Collection
```javascript
{
  _id: ObjectId,
  
  // Personal Details
  fullName: String,
  email: String (unique),
  phoneNumber: String (unique),
  dateOfBirth: Date,
  
  // ID Proof
  idType: 'aadhaar' | 'pan' | 'passport',
  idProofPath: String,
  idFileName: String,
  
  // Location
  fullAddress: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  latitude: Number,
  longitude: Number,
  landmarks: String,
  
  // Verification Status
  otpVerified: Boolean,
  termsAccepted: Boolean,
  
  // Registration Status
  status: 'pending' | 'verified' | 'rejected' | 'approved',
  registrationCompleted: Boolean,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Development Notes
- OTP is logged to console (remove in production)
- File uploads stored in `uploads/id-proofs/`
- CORS enabled for localhost:8080 and localhost:5173
- All inputs validated with express-validator
