# **Hemora User API Documentation**

Complete guide for testing User CRUD operations with Postman/Insomnia.

---

## **📋 API Endpoints Overview**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users/` | Create new user | Admin only |
| GET | `/api/users/` | List all users | Authenticated |
| GET | `/api/users/<id>/` | Get user details | Authenticated |
| PUT | `/api/users/<id>/` | Update user (full) | Admin only |
| PATCH | `/api/users/<id>/` | Update user (partial) | Admin only |
| DELETE | `/api/users/<id>/` | Delete user | Admin only |
| GET | `/api/users/me/` | Get current user profile | Authenticated |
| POST | `/api/users/<id>/verify/` | Verify user credentials | Admin only |
| POST | `/api/users/<id>/unverify/` | Unverify user | Admin only |
| POST | `/api/users/<id>/activate/` | Activate user account | Admin only |
| POST | `/api/users/<id>/deactivate/` | Deactivate user account | Admin only |

---

## **🔧 Setup Instructions**

### **1. Start Django Server**

```powershell
cd backend
python manage.py runserver
```

Server runs at: `http://localhost:8000`

### **2. Get Your Admin Credentials**

Your existing admin user:
- Username: `admin`
- Password: (the password you set when creating superuser)

---

## **📝 Testing with Postman/Insomnia**

### **Authentication**

All endpoints require authentication. Use **Session Authentication** for testing in Postman/Insomnia.

#### **Option 1: Login via Browsable API (Easiest)**

1. Open browser: `http://localhost:8000/api-auth/login/`
2. Login with admin credentials
3. Django creates a session cookie
4. Now Postman/Insomnia will use this session

#### **Option 2: Basic Auth in Postman**

1. In Postman, go to **Authorization** tab
2. Select **Basic Auth**
3. Username: `admin`
4. Password: (your password)

---

## **1️⃣ CREATE User (POST)**

### **Endpoint:**
```
POST http://localhost:8000/api/users/
```

### **Headers:**
```
Content-Type: application/json
```

### **Request Body:**

#### **Example 1: Create a Doctor**
```json
{
  "username": "dr_silva",
  "email": "silva@hospital.lk",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Nimal",
  "last_name": "Silva",
  "role": "DOCTOR",
  "phone_number": "+94771234567",
  "medical_license_number": "SL-MD-12345",
  "specialization": "Hematology",
  "hospital_affiliation": "National Hospital of Sri Lanka"
}
```

#### **Example 2: Create a Lab Technician**
```json
{
  "username": "lab_perera",
  "email": "perera@lab.lk",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Kamala",
  "last_name": "Perera",
  "role": "LAB_TECH",
  "phone_number": "+94777654321",
  "hospital_affiliation": "Colombo General Hospital"
}
```

#### **Example 3: Create a Researcher**
```json
{
  "username": "researcher_fernando",
  "email": "fernando@research.lk",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "Sandun",
  "last_name": "Fernando",
  "role": "RESEARCHER",
  "phone_number": "+94712345678",
  "hospital_affiliation": "Medical Research Institute"
}
```

### **Success Response (201 Created):**
```json
{
  "id": 2,
  "username": "dr_silva",
  "email": "silva@hospital.lk",
  "first_name": "Nimal",
  "last_name": "Silva",
  "full_name": "Nimal Silva",
  "role": "DOCTOR",
  "phone_number": "+94771234567",
  "medical_license_number": "SL-MD-12345",
  "specialization": "Hematology",
  "hospital_affiliation": "National Hospital of Sri Lanka",
  "is_verified": false,
  "is_active": true,
  "is_staff": false,
  "created_at": "2025-12-01T10:30:00Z",
  "updated_at": "2025-12-01T10:30:00Z"
}
```

### **Error Responses:**

#### **Password Mismatch (400 Bad Request):**
```json
{
  "password": [
    "Password fields didn't match."
  ]
}
```

#### **Username Already Exists (400 Bad Request):**
```json
{
  "username": [
    "A user with that username already exists."
  ]
}
```

#### **Weak Password (400 Bad Request):**
```json
{
  "password": [
    "This password is too short. It must contain at least 8 characters.",
    "This password is too common."
  ]
}
```

---

## **2️⃣ LIST Users (GET)**

### **Endpoint:**
```
GET http://localhost:8000/api/users/
```

### **Query Parameters (Optional):**

| Parameter | Example | Description |
|-----------|---------|-------------|
| `role` | `?role=DOCTOR` | Filter by role (ADMIN, DOCTOR, LAB_TECH, RESEARCHER) |
| `is_verified` | `?is_verified=true` | Filter by verification status |
| `is_active` | `?is_active=true` | Filter by active status |
| `search` | `?search=silva` | Search in username, email, names |
| `page` | `?page=2` | Pagination (10 users per page) |

### **Examples:**

#### **Get All Users:**
```
GET http://localhost:8000/api/users/
```

#### **Get Only Doctors:**
```
GET http://localhost:8000/api/users/?role=DOCTOR
```

#### **Get Verified Users:**
```
GET http://localhost:8000/api/users/?is_verified=true
```

#### **Search for "Silva":**
```
GET http://localhost:8000/api/users/?search=silva
```

#### **Combine Filters:**
```
GET http://localhost:8000/api/users/?role=DOCTOR&is_verified=true&is_active=true
```

### **Success Response (200 OK):**
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 2,
      "username": "dr_silva",
      "email": "silva@hospital.lk",
      "full_name": "Nimal Silva",
      "role": "DOCTOR",
      "role_display": "Doctor",
      "is_verified": false,
      "is_active": true,
      "created_at": "2025-12-01T10:30:00Z"
    },
    {
      "id": 1,
      "username": "admin",
      "email": "nisithalakshan94@gmail.com",
      "full_name": "admin",
      "role": "LAB_TECH",
      "role_display": "Lab Technician",
      "is_verified": false,
      "is_active": true,
      "created_at": "2025-10-29T20:46:00Z"
    }
  ]
}
```

---

## **3️⃣ GET Single User (GET)**

### **Endpoint:**
```
GET http://localhost:8000/api/users/<id>/
```

### **Example:**
```
GET http://localhost:8000/api/users/2/
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "username": "dr_silva",
  "email": "silva@hospital.lk",
  "first_name": "Nimal",
  "last_name": "Silva",
  "full_name": "Nimal Silva",
  "role": "DOCTOR",
  "phone_number": "+94771234567",
  "medical_license_number": "SL-MD-12345",
  "specialization": "Hematology",
  "hospital_affiliation": "National Hospital of Sri Lanka",
  "is_verified": false,
  "is_active": true,
  "is_staff": false,
  "created_at": "2025-12-01T10:30:00Z",
  "updated_at": "2025-12-01T10:30:00Z"
}
```

### **Error Response (404 Not Found):**
```json
{
  "detail": "Not found."
}
```

---

## **4️⃣ UPDATE User - Full (PUT)**

Updates ALL fields (all fields must be provided).

### **Endpoint:**
```
PUT http://localhost:8000/api/users/<id>/
```

### **Example:**
```
PUT http://localhost:8000/api/users/2/
```

### **Request Body:**
```json
{
  "email": "nimal.silva@hospital.lk",
  "first_name": "Dr. Nimal",
  "last_name": "Silva",
  "role": "DOCTOR",
  "phone_number": "+94771234567",
  "medical_license_number": "SL-MD-12345-UPDATED",
  "specialization": "Hematology & Oncology",
  "hospital_affiliation": "National Hospital of Sri Lanka",
  "is_verified": true,
  "is_active": true
}
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "username": "dr_silva",
  "email": "nimal.silva@hospital.lk",
  "first_name": "Dr. Nimal",
  "last_name": "Silva",
  "full_name": "Dr. Nimal Silva",
  "role": "DOCTOR",
  "phone_number": "+94771234567",
  "medical_license_number": "SL-MD-12345-UPDATED",
  "specialization": "Hematology & Oncology",
  "hospital_affiliation": "National Hospital of Sri Lanka",
  "is_verified": true,
  "is_active": true,
  "is_staff": false,
  "created_at": "2025-12-01T10:30:00Z",
  "updated_at": "2025-12-01T11:45:00Z"
}
```

---

## **5️⃣ UPDATE User - Partial (PATCH)**

Updates ONLY provided fields (other fields remain unchanged).

### **Endpoint:**
```
PATCH http://localhost:8000/api/users/<id>/
```

### **Example:**
```
PATCH http://localhost:8000/api/users/2/
```

### **Request Body Examples:**

#### **Update Only Verification Status:**
```json
{
  "is_verified": true
}
```

#### **Update Phone and Hospital:**
```json
{
  "phone_number": "+94771111111",
  "hospital_affiliation": "Colombo South Teaching Hospital"
}
```

#### **Update Password:**
```json
{
  "password": "NewSecurePassword123!"
}
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "username": "dr_silva",
  "email": "nimal.silva@hospital.lk",
  "first_name": "Dr. Nimal",
  "last_name": "Silva",
  "full_name": "Dr. Nimal Silva",
  "role": "DOCTOR",
  "phone_number": "+94771111111",
  "medical_license_number": "SL-MD-12345-UPDATED",
  "specialization": "Hematology & Oncology",
  "hospital_affiliation": "Colombo South Teaching Hospital",
  "is_verified": true,
  "is_active": true,
  "is_staff": false,
  "created_at": "2025-12-01T10:30:00Z",
  "updated_at": "2025-12-01T12:00:00Z"
}
```

---

## **6️⃣ DELETE User (DELETE)**

### **Endpoint:**
```
DELETE http://localhost:8000/api/users/<id>/
```

### **Example:**
```
DELETE http://localhost:8000/api/users/2/
```

### **Success Response (204 No Content):**
```
(Empty response body)
```

### **Error Response - Cannot Delete Self (400 Bad Request):**
```json
{
  "detail": "You cannot delete your own account."
}
```

---

## **7️⃣ Get Current User Profile (GET)**

Get the profile of the currently logged-in user.

### **Endpoint:**
```
GET http://localhost:8000/api/users/me/
```

### **Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "email": "nisithalakshan94@gmail.com",
  "first_name": "",
  "last_name": "",
  "full_name": "admin",
  "role": "LAB_TECH",
  "phone_number": null,
  "medical_license_number": null,
  "specialization": null,
  "hospital_affiliation": null,
  "is_verified": false,
  "is_active": true,
  "is_staff": true,
  "created_at": "2025-10-29T20:46:00Z",
  "updated_at": "2025-10-29T20:46:00Z"
}
```

---

## **8️⃣ Verify User (POST)**

Mark a user's credentials as verified.

### **Endpoint:**
```
POST http://localhost:8000/api/users/<id>/verify/
```

### **Example:**
```
POST http://localhost:8000/api/users/2/verify/
```

### **Request Body:**
```json
{}
```
(Empty body - action is in the endpoint)

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "username": "dr_silva",
  "email": "silva@hospital.lk",
  "first_name": "Nimal",
  "last_name": "Silva",
  "full_name": "Nimal Silva",
  "role": "DOCTOR",
  "is_verified": true,
  ...
}
```

---

## **9️⃣ Unverify User (POST)**

Remove verification status.

### **Endpoint:**
```
POST http://localhost:8000/api/users/<id>/unverify/
```

### **Example:**
```
POST http://localhost:8000/api/users/2/unverify/
```

### **Request Body:**
```json
{}
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "is_verified": false,
  ...
}
```

---

## **🔟 Activate User (POST)**

Activate a deactivated user account.

### **Endpoint:**
```
POST http://localhost:8000/api/users/<id>/activate/
```

### **Example:**
```
POST http://localhost:8000/api/users/2/activate/
```

### **Request Body:**
```json
{}
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "is_active": true,
  ...
}
```

---

## **1️⃣1️⃣ Deactivate User (POST)**

Deactivate a user account (soft delete).

### **Endpoint:**
```
POST http://localhost:8000/api/users/<id>/deactivate/
```

### **Example:**
```
POST http://localhost:8000/api/users/2/deactivate/
```

### **Request Body:**
```json
{}
```

### **Success Response (200 OK):**
```json
{
  "id": 2,
  "is_active": false,
  ...
}
```

### **Error Response - Cannot Deactivate Self (400 Bad Request):**
```json
{
  "detail": "You cannot deactivate your own account."
}
```

---

## **🔒 Permissions Summary**

| Action | Admin | Authenticated User |
|--------|-------|-------------------|
| Create User | ✅ | ❌ |
| List Users | ✅ | ✅ (read-only) |
| View User Detail | ✅ | ✅ (read-only) |
| Update User | ✅ | ❌ |
| Delete User | ✅ | ❌ |
| Verify/Unverify | ✅ | ❌ |
| Activate/Deactivate | ✅ | ❌ |
| View Own Profile (`/me/`) | ✅ | ✅ |

---

## **🧪 Testing Workflow**

### **Complete Test Sequence:**

1. **Login as Admin**
   - Use Django admin panel or `/api-auth/login/`

2. **Create 3 Users:**
   ```
   POST /api/users/  (Doctor)
   POST /api/users/  (Lab Technician)
   POST /api/users/  (Researcher)
   ```

3. **List All Users:**
   ```
   GET /api/users/
   ```

4. **Filter by Role:**
   ```
   GET /api/users/?role=DOCTOR
   ```

5. **Get Specific User:**
   ```
   GET /api/users/2/
   ```

6. **Update User:**
   ```
   PATCH /api/users/2/  (Mark as verified)
   ```

7. **Verify User:**
   ```
   POST /api/users/2/verify/
   ```

8. **Get Current User:**
   ```
   GET /api/users/me/
   ```

9. **Deactivate User:**
   ```
   POST /api/users/3/deactivate/
   ```

10. **Delete User:**
    ```
    DELETE /api/users/3/
    ```

---

## **💡 Tips for Postman/Insomnia**

### **Postman Collection:**

1. Create a new collection: "Hemora User API"
2. Add all endpoints above
3. Set base URL as variable: `{{base_url}} = http://localhost:8000`
4. Configure authentication once at collection level

### **Environment Variables:**
```
base_url = http://localhost:8000
admin_username = admin
admin_password = your_password
```

### **Tests Tab (Postman):**
```javascript
// Auto-extract user ID from create response
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
    var jsonData = pm.response.json();
    pm.environment.set("user_id", jsonData.id);
});
```

---

## **🐛 Common Errors**

### **403 Forbidden:**
```json
{
  "detail": "Authentication credentials were not provided."
}
```
**Solution:** Login first or provide Basic Auth credentials.

### **401 Unauthorized:**
```json
{
  "detail": "You do not have permission to perform this action."
}
```
**Solution:** Use admin account for create/update/delete operations.

### **400 Bad Request:**
Check response body for field-specific errors:
```json
{
  "username": ["This field is required."],
  "email": ["Enter a valid email address."]
}
```

---

## **📊 Database Verification**

After creating users, verify in PostgreSQL:

```sql
-- Connect to database
psql -U postgres -d hemoradb

-- Check users table
SELECT id, username, email, role, is_verified, is_active FROM accounts_user;

-- Count users by role
SELECT role, COUNT(*) FROM accounts_user GROUP BY role;

-- Exit
\q
```

---

## **🎯 Next Steps**

After testing User CRUD operations:

1. ✅ Phase 2.2: Patient Model API
2. ✅ Phase 2.3: Blood Smear Image Upload API
3. ✅ Phase 2.4: Analysis Results API
4. ✅ Phase 3: Frontend Integration

---

**Happy Testing!** 🚀

For issues or questions, check Django logs:
```powershell
# Server terminal shows all API requests and errors
python manage.py runserver
```
