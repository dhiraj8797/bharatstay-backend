# AdminConsole API Setup Guide

## 🎉 AdminConsole Collection Setup Complete!

Your AdminConsole collection has been successfully created with a complete backend API system.

## 📁 Files Created:

### **1. Model** (`backend/src/models/AdminConsole.ts`)
- Complete MongoDB schema with validation
- Role-based permission system
- Proper indexing for performance

### **2. Controller** (`backend/src/controllers/adminConsoleController.ts`)
- Full CRUD operations
- Statistics endpoint
- Error handling and validation

### **3. Routes** (`backend/src/routes/adminConsoleRoutes.ts`)
- RESTful API endpoints
- Input validation middleware
- Proper HTTP methods

### **4. Integration** (`backend/src/server.ts`)
- Routes registered at `/api/admin-console`
- Proper middleware integration

### **5. Seed Script** (`backend/scripts/seedAdminConsole.ts`)
- Sample admin accounts
- Easy database initialization
- Three different admin roles

### **6. Documentation** (`backend/docs/AdminConsole-API.md`)
- Complete API documentation
- Usage examples
- Security considerations

## 🚀 Quick Start:

### **1. Seed the Database:**
```bash
cd backend
npm run seed:admin
```

This will create three sample admin accounts:
- **Super Admin** (admin001) - Full system access
- **Content Admin** (admin002) - Content management
- **Support Admin** (admin003) - Support operations

### **2. Start the Backend Server:**
```bash
npm run dev
```

### **3. Test the API Endpoints:**

#### **Get Admin Statistics:**
```bash
curl -X GET http://localhost:8080/api/admin-console/stats
```

#### **Get All Admins:**
```bash
curl -X GET http://localhost:8080/api/admin-console
```

#### **Create New Admin:**
```bash
curl -X POST http://localhost:8080/api/admin-console \
  -H "Content-Type: application/json" \
  -d '{
    "adminId": "admin004",
    "name": "New Admin",
    "email": "newadmin@bharatstay.com",
    "role": "admin",
    "permissions": ["manage_stays", "view_analytics"]
  }'
```

## 📊 Available Features:

### **✅ Admin Management:**
- Create, Read, Update, Delete admins
- Role-based permissions
- Active/Inactive status management
- Last login tracking

### **✅ Role System:**
- `super_admin` - Full access
- `admin` - Limited administrative access
- `moderator` - Content moderation access

### **✅ Permission System:**
- 11 different permissions available
- Granular access control
- Flexible role assignment

### **✅ API Features:**
- Pagination support
- Filtering by role and status
- Comprehensive error handling
- Input validation
- Statistics endpoint

## 🔐 Security Features:

- Input validation with express-validator
- Email uniqueness checks
- Admin ID uniqueness
- Proper error handling
- MongoDB indexing for performance

## 📈 API Endpoints Summary:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin-console` | Create new admin |
| GET | `/api/admin-console` | Get all admins (paginated) |
| GET | `/api/admin-console/stats` | Get admin statistics |
| GET | `/api/admin-console/:adminId` | Get admin by ID |
| PUT | `/api/admin-console/:adminId` | Update admin |
| DELETE | `/api/admin-console/:adminId` | Delete admin |
| PATCH | `/api/admin-console/:adminId/login` | Update last login |

## 🎯 Next Steps:

1. **Run the seed script** to populate initial data
2. **Test the endpoints** using the examples above
3. **Implement authentication middleware** for security
4. **Create frontend admin dashboard** to manage admins
5. **Add audit logging** for admin actions

## 🔧 Build Status:
- ✅ TypeScript compilation successful
- ✅ All routes registered
- ✅ Database schema ready
- ✅ API endpoints functional

**Your AdminConsole system is now ready to use!** 🎉
