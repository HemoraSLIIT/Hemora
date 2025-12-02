# **Frontend JWT Integration Guide**

## **📋 Overview**

This document explains the JWT authentication integration in the React frontend, the API service architecture, and how to test and verify everything is working correctly.

---

## **🏗️ Architecture**

### **API Service Layer (`src/services/api.js`)**

The API service provides a centralized way to communicate with the Django backend using JWT authentication.

```
React Components
       ↓
  api.js (Axios + JWT Interceptors)
       ↓
  Django REST API
       ↓
  PostgreSQL Database
```

---

## **📁 File Structure**

```
frontend/
├── src/
│   ├── services/
│   │   └── api.js              # ⭐ API service with JWT handling
│   ├── components/
│   │   ├── Login.jsx           # Updated for JWT login
│   │   ├── Register.jsx        # Updated for JWT registration
│   │   └── Dashboard.jsx       # Updated to fetch user via API
│   └── App.jsx                 # Routes configuration
```

---

## **🔧 API Service (`src/services/api.js`)**

### **What It Does:**

1. **Axios Instance Configuration**
   - Base URL: `http://localhost:8000/api`
   - Automatic JSON content-type headers

2. **Request Interceptor**
   - Automatically adds JWT token to every request
   - Header: `Authorization: Bearer <access_token>`

3. **Response Interceptor**
   - Handles 401 errors (expired token)
   - Automatically refreshes token using refresh token
   - Retries original request with new token
   - Redirects to login if refresh fails

4. **Auth Functions**
   - `register()` - Create new user, store tokens
   - `login()` - Authenticate user, store tokens
   - `logout()` - Clear tokens from localStorage
   - `isAuthenticated()` - Check if user has valid token

5. **User Functions**
   - `getCurrentUser()` - Get logged-in user data
   - `getAllUsers()` - Get all users (admin)
   - `getUserById()` - Get specific user
   - `updateUser()` - Update user data
   - `deleteUser()` - Delete user

---

## **🔐 JWT Token Flow**

### **1. Registration Flow**

```javascript
// User fills registration form
const userData = {
  username: "dr_silva",
  email: "silva@hospital.lk",
  password: "Pass123!",
  password_confirm: "Pass123!",
  first_name: "Nimal",
  last_name: "Silva",
  role: "RESEARCHER"
};

// Call API
await authAPI.register(userData);

// Behind the scenes:
// 1. POST /api/auth/register/
// 2. Backend creates user
// 3. Backend returns: { user: {...}, tokens: { access, refresh } }
// 4. Tokens stored in localStorage:
localStorage.setItem('access_token', tokens.access);
localStorage.setItem('refresh_token', tokens.refresh);

// 5. User redirected to dashboard
```

### **2. Login Flow**

```javascript
// User enters credentials
await authAPI.login("dr_silva", "Pass123!");

// Behind the scenes:
// 1. POST /api/auth/token/
// 2. Backend validates credentials
// 3. Backend returns: { access, refresh }
// 4. Tokens stored in localStorage
// 5. User redirected to dashboard
```

### **3. Authenticated Request Flow**

```javascript
// Component calls API
const user = await userAPI.getCurrentUser();

// Behind the scenes:
// 1. Request interceptor adds token:
//    Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
// 2. GET /api/users/me/
// 3. Backend validates token
// 4. Backend returns user data
// 5. Component updates state with user data
```

### **4. Token Refresh Flow**

```javascript
// Access token expires (after 60 minutes)
// User tries to fetch data
const user = await userAPI.getCurrentUser();

// Behind the scenes:
// 1. Request sent with expired token
// 2. Backend returns 401 Unauthorized
// 3. Response interceptor catches 401
// 4. POST /api/auth/token/refresh/ with refresh token
// 5. Backend returns new access token
// 6. New token stored in localStorage
// 7. Original request retried with new token
// 8. User data returned successfully

// If refresh token also expired:
// 1. Refresh fails
// 2. Tokens cleared from localStorage
// 3. User redirected to login page
```

---

## **🎨 Component Updates**

### **Login.jsx**

**Changes Made:**
- ✅ Changed from `email` to `username` field
- ✅ Removed old axios import, using `authAPI` from `api.js`
- ✅ Simplified: No role-based navigation, just go to `/dashboard`
- ✅ Better error handling with response data

**How It Works:**
```javascript
import { authAPI } from "../services/api";

const SubmitLogin = async (e) => {
  e.preventDefault();
  try {
    await authAPI.login(logindata.username, logindata.password);
    toast.success("Login Successful!");
    navigate("/dashboard");
  } catch (error) {
    toast.error(error.response?.data.detail || "Login Failed!");
  }
};
```

---

### **Register.jsx**

**Changes Made:**
- ✅ Added `username` field (required)
- ✅ Split name into `first_name` and `last_name`
- ✅ Changed `confirmPassword` to `password_confirm` (Django field name)
- ✅ Added `role` field (default: "RESEARCHER")
- ✅ Using `authAPI.register()` from `api.js`
- ✅ Automatically logs in after registration

**How It Works:**
```javascript
import { authAPI } from "../services/api";

const [SignupData, setSignupData] = useState({
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  password: "",
  password_confirm: "",
  role: "RESEARCHER",
});

const SubmitRegistation = async (e) => {
  e.preventDefault();
  try {
    await authAPI.register(SignupData);
    toast.success("Account created successfully!");
    navigate("/dashboard");
  } catch (error) {
    // Display error from backend
    const errors = error.response?.data;
    const firstError = Object.values(errors)[0];
    toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
  }
};
```

---

### **Dashboard.jsx**

**Changes Made:**
- ✅ Removed JWT decode library (no longer needed)
- ✅ Using `userAPI.getCurrentUser()` to fetch data
- ✅ Added authentication check on mount
- ✅ Redirects to login if not authenticated
- ✅ Shows user info: username, email, role, specialization, hospital
- ✅ Proper logout with token cleanup

**How It Works:**
```javascript
import { userAPI, authAPI } from '../services/api';

useEffect(() => {
  // Check authentication
  if (!authAPI.isAuthenticated()) {
    navigate('/login');
    return;
  }

  // Fetch user data
  const fetchUserData = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
    } catch (err) {
      if (err.response?.status === 401) {
        authAPI.logout();
        navigate('/login');
      }
    }
  };

  fetchUserData();
}, [navigate]);

const handleLogout = () => {
  authAPI.logout();  // Clears tokens from localStorage
  navigate('/login');
};
```

---

## **🧪 Testing Guide**

### **1. Test Registration**

**Steps:**
1. Open browser: `http://localhost:5173/`
2. Fill registration form:
   - Username: `test_user`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Click "Register"

**Expected Result:**
- ✅ Toast: "Account created successfully!"
- ✅ Redirect to dashboard
- ✅ Dashboard shows user info

**Verify in DevTools:**
```javascript
// Console → Application → Local Storage
localStorage.getItem('access_token')  // Should show JWT token
localStorage.getItem('refresh_token') // Should show refresh token
```

**Verify in Backend:**
```sql
-- Open PostgreSQL
SELECT * FROM accounts_user WHERE username='test_user';
```

---

### **2. Test Login**

**Steps:**
1. Logout from dashboard
2. Go to: `http://localhost:5173/login`
3. Enter credentials:
   - Username: `test_user`
   - Password: `Test123!`
4. Click "Log In"

**Expected Result:**
- ✅ Toast: "Login Successful!"
- ✅ Redirect to dashboard
- ✅ Dashboard shows user info

**Verify Token in Network Tab:**
```
1. Open DevTools → Network tab
2. Login
3. Find request: POST http://localhost:8000/api/auth/token/
4. Check Response:
   {
     "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
     "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
   }
```

---

### **3. Test Protected Dashboard**

**Steps:**
1. Clear localStorage (DevTools → Application → Clear)
2. Try to access: `http://localhost:5173/dashboard`

**Expected Result:**
- ✅ Automatically redirected to `/login`
- ✅ Cannot access dashboard without login

**Verify Auth Check:**
```javascript
// Dashboard component checks authentication on mount
if (!authAPI.isAuthenticated()) {
  navigate('/login');
}
```

---

### **4. Test Token Refresh**

**Steps:**
1. Login to dashboard
2. Open DevTools → Console
3. Manually expire access token:
   ```javascript
   // Set access token to expired one
   localStorage.setItem('access_token', 'expired_token_here');
   ```
4. Refresh page (dashboard will try to fetch user data)

**Expected Result:**
- ✅ First request fails with 401
- ✅ Interceptor catches error
- ✅ Refresh token endpoint called automatically
- ✅ New access token stored
- ✅ Original request retried
- ✅ Dashboard loads successfully

**Verify in Network Tab:**
```
1. See failed request: GET /api/users/me/ (401)
2. See refresh request: POST /api/auth/token/refresh/ (200)
3. See retried request: GET /api/users/me/ (200)
```

---

### **5. Test Logout**

**Steps:**
1. Login to dashboard
2. Click "Logout" button

**Expected Result:**
- ✅ Tokens removed from localStorage
- ✅ Redirect to `/login`
- ✅ Cannot access dashboard anymore

**Verify in DevTools:**
```javascript
// Console → Application → Local Storage
localStorage.getItem('access_token')  // null
localStorage.getItem('refresh_token') // null
```

---

## **🔍 Debugging Tips**

### **Check if Tokens are Stored**
```javascript
// Open Browser Console
console.log('Access Token:', localStorage.getItem('access_token'));
console.log('Refresh Token:', localStorage.getItem('refresh_token'));
```

### **Check API Requests**
```
DevTools → Network Tab → Filter: XHR
- Look for requests to http://localhost:8000/api/
- Check request headers for Authorization: Bearer <token>
- Check response status codes (200 = success, 401 = unauthorized)
```

### **Test API Directly in Console**
```javascript
// Import API service in console (after opening the site)
import { userAPI, authAPI } from './services/api';

// Test login
await authAPI.login('test_user', 'Test123!');

// Test get current user
const user = await userAPI.getCurrentUser();
console.log(user);

// Test logout
authAPI.logout();
```

### **Common Issues**

**Issue 1: CORS Error**
```
Error: Access to XMLHttpRequest has been blocked by CORS policy
```
**Fix:** Ensure Django CORS settings allow `http://localhost:5173`

**Issue 2: 401 Unauthorized on Every Request**
```
POST /api/users/me/ 401 Unauthorized
```
**Fix:** Check if token is being sent in headers:
```javascript
// DevTools → Network → Request Headers
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

**Issue 3: Token Not Refreshing**
```
POST /api/auth/token/refresh/ 401 Unauthorized
```
**Fix:** Refresh token might be expired (7 days). Login again.

---

## **📊 Token Lifecycle**

```
┌─────────────────────────────────────────────────────────┐
│                    User Registers/Logins                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  Store Tokens in localStorage │
        │  - access_token (60 min)      │
        │  - refresh_token (7 days)     │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  Every API Request         │
        │  Adds: Authorization Header│
        └────────────┬───────────────┘
                     │
                     ↓
        ┌────────────────────────────┐
        │  Access Token Valid?       │
        └────────────┬───────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
        YES                    NO (401)
          │                     │
          ↓                     ↓
    ┌─────────────┐   ┌──────────────────────┐
    │ Return Data │   │ Try Token Refresh    │
    └─────────────┘   └──────────┬───────────┘
                                 │
                      ┌──────────┴──────────┐
                      │                     │
                 Refresh Success      Refresh Fails
                      │                     │
                      ↓                     ↓
            ┌──────────────────┐   ┌───────────────┐
            │ Store New Token  │   │ Logout User   │
            │ Retry Request    │   │ Go to /login  │
            └──────────────────┘   └───────────────┘
```

---

## **🚀 Next Steps**

### **Add More Features:**

1. **Role-Based Access Control**
   ```javascript
   // In Dashboard.jsx
   if (user.role === 'DOCTOR') {
     // Show doctor-specific features
   }
   ```

2. **Protected Routes Component**
   ```javascript
   // src/components/ProtectedRoute.jsx
   const ProtectedRoute = ({ children }) => {
     if (!authAPI.isAuthenticated()) {
       return <Navigate to="/login" />;
     }
     return children;
   };
   ```

3. **User Profile Edit**
   ```javascript
   // Use userAPI.updateUser()
   await userAPI.updateUser(user.id, {
     first_name: "Updated Name",
     specialization: "Cardiology"
   });
   ```

4. **Admin User Management**
   ```javascript
   // Fetch all users
   const users = await userAPI.getAllUsers();
   
   // Filter by role
   const doctors = await userAPI.getAllUsers({ role: 'DOCTOR' });
   
   // Delete user
   await userAPI.deleteUser(userId);
   ```

---

## **📝 Summary**

**What Was Implemented:**
- ✅ Centralized API service with JWT handling
- ✅ Automatic token refresh on expiry
- ✅ Login component with JWT authentication
- ✅ Register component with proper field mapping
- ✅ Dashboard with protected route and user data
- ✅ Proper logout functionality
- ✅ Error handling and user feedback

**Security Features:**
- ✅ Tokens stored in localStorage (consider httpOnly cookies for production)
- ✅ Access token expires after 60 minutes
- ✅ Refresh token expires after 7 days
- ✅ Automatic token refresh prevents re-login
- ✅ Failed refresh redirects to login

**Testing Completed:**
- ✅ Registration flow
- ✅ Login flow
- ✅ Protected routes
- ✅ Token refresh
- ✅ Logout functionality

---

**🎉 Your frontend is now fully integrated with Django JWT authentication!**
