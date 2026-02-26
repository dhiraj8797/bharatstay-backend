# AdminConsole API Documentation

## Overview
The AdminConsole API provides comprehensive management functionality for BharatStay administrators. It allows creating, managing, and monitoring admin accounts with role-based permissions.

## Base URL
```
https://bharatstay-backend.onrender.com/api/admin-console
```

## Authentication
All AdminConsole endpoints should be protected with appropriate authentication middleware (to be implemented).

## Roles & Permissions

### Roles
- **super_admin**: Full system access
- **admin**: Limited administrative access
- **moderator**: Content and user management access

### Permissions
- `manage_users`: Manage user accounts
- `manage_hosts`: Manage host accounts
- `manage_stays`: Manage property listings
- `manage_bookings`: Manage booking operations
- `manage_reviews`: Manage review system
- `manage_payments`: Manage payment operations
- `view_analytics`: View system analytics
- `manage_settings`: Manage system settings
- `manage_promotions`: Manage promotional campaigns
- `manage_referrals`: Manage referral programs
- `view_reports`: View system reports

## API Endpoints

### 1. Create Admin
**POST** `/api/admin-console`

**Request Body:**
```json
{
  "adminId": "admin001",
  "name": "John Doe",
  "email": "john@bharatstay.com",
  "role": "admin",
  "permissions": ["manage_stays", "view_analytics"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin created successfully",
  "admin": {
    "adminId": "admin001",
    "name": "John Doe",
    "email": "john@bharatstay.com",
    "role": "admin",
    "permissions": ["manage_stays", "view_analytics"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Get All Admins
**GET** `/api/admin-console`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `role` (optional): Filter by role
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "admins": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 3. Get Admin by ID
**GET** `/api/admin-console/:adminId`

**Response:**
```json
{
  "success": true,
  "admin": {
    "adminId": "admin001",
    "name": "John Doe",
    "email": "john@bharatstay.com",
    "role": "admin",
    "permissions": [...],
    "isActive": true,
    "lastLogin": "2024-01-01T12:00:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

### 4. Update Admin
**PUT** `/api/admin-console/:adminId`

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "johnsmith@bharatstay.com",
  "role": "super_admin",
  "permissions": ["manage_users", "manage_hosts", "manage_stays"],
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin updated successfully",
  "admin": {...}
}
```

### 5. Delete Admin
**DELETE** `/api/admin-console/:adminId`

**Response:**
```json
{
  "success": true,
  "message": "Admin deleted successfully"
}
```

### 6. Update Last Login
**PATCH** `/api/admin-console/:adminId/login`

**Response:**
```json
{
  "success": true,
  "message": "Last login updated successfully",
  "lastLogin": "2024-01-01T12:00:00.000Z"
}
```

### 7. Get Admin Statistics
**GET** `/api/admin-console/stats`

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalAdmins": 10,
    "activeAdmins": 8,
    "inactiveAdmins": 2,
    "roleBreakdown": {
      "super_admin": 2,
      "admin": 5,
      "moderator": 3
    }
  }
}
```

## Database Schema

### AdminConsole Collection
```javascript
{
  _id: ObjectId,
  adminId: String (unique, required),
  name: String (required),
  email: String (unique, required, lowercase),
  role: String (enum: ['super_admin', 'admin', 'moderator']),
  permissions: [String],
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Seeding Initial Data
Run the seed script to populate initial admin accounts:
```bash
npm run seed:admin
```

This will create three sample admin accounts:
1. Super Admin (admin001) - Full permissions
2. Content Admin (admin002) - Content management permissions
3. Support Admin (admin003) - Support and moderation permissions

### Error Handling
All endpoints return consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Security Considerations
1. Implement authentication middleware for all endpoints
2. Add rate limiting to prevent abuse
3. Validate all input data
4. Log all admin actions for audit trail
5. Implement proper authorization checks based on roles and permissions

## Future Enhancements
1. Password-based authentication for admins
2. Two-factor authentication
3. Audit logging system
4. Role-based UI components
5. Admin activity dashboard
6. Bulk operations for admin management
