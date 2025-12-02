# **Hemora User Management: Behavior Change Documentation**

## **📋 Overview**

This document describes the transformation from command-line/admin-panel user management to a REST API-based approach.

---

## **🔴 OLD BEHAVIOR (Before)**

### **User Creation Methods:**

#### **Method 1: Django Command**
```powershell
python manage.py createsuperuser
# Interactive prompts:
Username: admin
Email: admin@example.com
Password: ********
```

**Limitations:**
- ❌ Only creates superusers (admin accounts)
- ❌ Cannot specify role (DOCTOR, LAB_TECH, etc.)
- ❌ Cannot set professional fields (license, specialization)
- ❌ Must be run from terminal with server access
- ❌ No way to automate or integrate with frontend
- ❌ No way to test with Postman/Insomnia

#### **Method 2: Django Admin Panel**
```
1. Open http://localhost:8000/admin/
2. Login with admin credentials
3. Navigate to Users section
4. Click "Add User" button
5. Fill form manually
6. Click "Save"
```

**Limitations:**
- ❌ Manual, tedious process
- ❌ Requires browser access
- ❌ No programmatic access
- ❌ Cannot integrate with React frontend
- ❌ Cannot automate user provisioning
- ❌ No API for mobile apps or external systems

### **Data Flow (Old):**
```
Terminal Command → Django ORM → PostgreSQL
        OR
Browser Form → Django Admin → Django ORM → PostgreSQL
```

### **User Listing (Old):**
- Only available through Django admin panel
- No filtering via API
- No programmatic access to user list

### **User Updates (Old):**
- Manual editing in Django admin panel
- No API endpoint for updates
- Cannot integrate with frontend forms

### **User Deletion (Old):**
- Manual deletion in Django admin panel
- No soft delete option
- No API for deactivating users

---

## **🟢 NEW BEHAVIOR (After API Implementation)**

### **User Creation:**

#### **REST API Endpoint**
```http
POST http://localhost:8000/api/users/
Content-Type: application/json

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
  "hospital_affiliation": "National Hospital"
}
```

**Advantages:**
- ✅ Can specify role (ADMIN, DOCTOR, LAB_TECH, RESEARCHER)
- ✅ Can set all professional fields
- ✅ Can be called from Postman/Insomnia
- ✅ Can be integrated with React frontend
- ✅ Can be automated via scripts
- ✅ Supports mobile app integration
- ✅ Password validation enforced
- ✅ Returns JSON response with created user data

### **Data Flow (New):**
```
Postman/Insomnia/React → REST API Endpoint → Serializer (Validation)
                                                    ↓
                                              Django ORM
                                                    ↓
                                              PostgreSQL
                                                    ↓
                                           JSON Response
```

### **Complete CRUD Operations:**

#### **1. CREATE (POST /api/users/)**
```http
POST /api/users/
{
  "username": "new_user",
  "email": "user@example.com",
  "password": "Pass123!",
  "password_confirm": "Pass123!",
  "role": "DOCTOR",
  ...
}
```

#### **2. READ (GET /api/users/)**
```http
# List all users
GET /api/users/

# Get specific user
GET /api/users/2/

# Get current user
GET /api/users/me/

# Filter by role
GET /api/users/?role=DOCTOR

# Search
GET /api/users/?search=silva

# Filter by verification
GET /api/users/?is_verified=true
```

#### **3. UPDATE (PUT/PATCH /api/users/<id>/)**
```http
# Full update
PUT /api/users/2/
{
  "email": "new@example.com",
  "first_name": "Updated",
  ...
}

# Partial update
PATCH /api/users/2/
{
  "is_verified": true
}
```

#### **4. DELETE (DELETE /api/users/<id>/)**
```http
DELETE /api/users/2/
```

### **Additional Actions:**

#### **Verify User:**
```http
POST /api/users/2/verify/
```

#### **Deactivate User:**
```http
POST /api/users/2/deactivate/
```

#### **Activate User:**
```http
POST /api/users/2/activate/
```

---

## **🔄 Comparison Table**

| Feature | Old Behavior | New Behavior |
|---------|-------------|--------------|
| **User Creation** | Terminal command or admin panel | REST API (POST /api/users/) |
| **Set Role** | Manual after creation | During creation via API |
| **Set Professional Fields** | Manual in admin panel | During creation via API |
| **Password Validation** | Django default only | Enforced via serializer |
| **Password Confirmation** | Not required | Required (password_confirm field) |
| **List Users** | Admin panel only | REST API with filters |
| **Filter Users** | Admin panel sidebar | Query parameters (?role=DOCTOR) |
| **Search Users** | Admin panel search box | Query parameter (?search=name) |
| **Update User** | Admin panel form | REST API (PUT/PATCH) |
| **Partial Update** | Not available | PATCH endpoint |
| **Delete User** | Hard delete in admin | DELETE endpoint + soft delete options |
| **Verify Credentials** | Manual checkbox | POST /api/users/<id>/verify/ |
| **Deactivate User** | Manual checkbox | POST /api/users/<id>/deactivate/ |
| **Get Current User** | Django request.user | GET /api/users/me/ |
| **Frontend Integration** | ❌ Not possible | ✅ Fully integrated |
| **Mobile App Support** | ❌ Not possible | ✅ Fully supported |
| **Automated Testing** | ❌ Difficult | ✅ Easy with Postman/pytest |
| **Batch Operations** | ❌ Manual one-by-one | ✅ Can script with API |
| **External Integration** | ❌ Not possible | ✅ Any HTTP client can use |

---

## **📊 Architecture Changes**

### **Old Architecture:**
```
┌─────────────────────────────────────────┐
│         Django Admin Panel              │
│     http://localhost:8000/admin/        │
└────────────────┬────────────────────────┘
                 │ (Manual Form Submission)
                 ↓
┌─────────────────────────────────────────┐
│      Django Admin Views                 │
│  (Built-in, no customization)           │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      User Model (accounts/models.py)    │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
└─────────────────────────────────────────┘
```

### **New Architecture:**
```
┌──────────────────────────────────────────────────────────┐
│  Clients (Postman, React, Mobile, External Services)    │
└────────────────┬─────────────────────────────────────────┘
                 │ (HTTP Requests)
                 ↓
┌─────────────────────────────────────────┐
│      REST API Endpoints                 │
│  POST   /api/users/                     │
│  GET    /api/users/                     │
│  GET    /api/users/<id>/                │
│  PUT    /api/users/<id>/                │
│  PATCH  /api/users/<id>/                │
│  DELETE /api/users/<id>/                │
│  + Custom actions (verify, activate)    │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      ViewSet (accounts/views.py)        │
│  - UserViewSet                          │
│  - Permission checks                    │
│  - Business logic                       │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│   Serializers (accounts/serializers.py) │
│  - UserCreateSerializer (validation)    │
│  - UserUpdateSerializer                 │
│  - UserListSerializer                   │
│  - UserSerializer (full data)           │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      User Model (accounts/models.py)    │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      PostgreSQL Database                │
│      Table: accounts_user               │
└─────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│      JSON Response                      │
│  {                                      │
│    "id": 2,                             │
│    "username": "dr_silva",              │
│    "role": "DOCTOR",                    │
│    ...                                  │
│  }                                      │
└─────────────────────────────────────────┘
```

---

## **🔐 Security Enhancements**

### **Old Behavior:**
- Admin panel accessible only to staff/superusers
- No fine-grained permissions
- No API authentication

### **New Behavior:**
- **Authentication Required:** All endpoints require login
- **Role-Based Permissions:**
  - Admins: Full CRUD access
  - Authenticated users: Read-only access
- **Password Validation:** Django's password validators enforced
- **Password Confirmation:** Required to prevent typos
- **CSRF Protection:** Built into Django REST Framework
- **Permission Classes:**
  ```python
  IsAdminUser  # For create, update, delete
  IsAuthenticated  # For read operations
  ```

---

## **🎯 Use Cases Enabled by New Behavior**

### **1. React Frontend Integration**
```javascript
// Create user from React form
const createUser = async (userData) => {
  const response = await fetch('http://localhost:8000/api/users/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + authToken
    },
    body: JSON.stringify(userData)
  });
  return response.json();
};
```

### **2. Mobile App Integration**
```dart
// Flutter example
Future<User> createUser(Map<String, dynamic> userData) async {
  final response = await http.post(
    Uri.parse('http://api.hemora.com/api/users/'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode(userData),
  );
  return User.fromJson(jsonDecode(response.body));
}
```

### **3. Automated Testing**
```python
# pytest example
def test_create_doctor():
    response = client.post('/api/users/', {
        'username': 'test_doctor',
        'email': 'test@example.com',
        'password': 'Pass123!',
        'password_confirm': 'Pass123!',
        'role': 'DOCTOR'
    })
    assert response.status_code == 201
    assert response.json()['role'] == 'DOCTOR'
```

### **4. Bulk User Import**
```python
# Script to import users from CSV
import requests

def import_users_from_csv(filepath):
    with open(filepath) as f:
        for line in f:
            username, email, role = line.strip().split(',')
            requests.post('http://localhost:8000/api/users/', json={
                'username': username,
                'email': email,
                'password': 'TempPass123!',
                'password_confirm': 'TempPass123!',
                'role': role
            })
```

---

## **📈 Benefits Summary**

### **For Developers:**
- ✅ Standard REST API following industry best practices
- ✅ Easy to test with Postman/Insomnia
- ✅ Can write automated tests
- ✅ Clean separation of concerns (Model → Serializer → View → URL)
- ✅ Reusable API for multiple frontends

### **For Frontend Developers:**
- ✅ Clear API documentation
- ✅ JSON responses easy to consume
- ✅ Consistent error handling
- ✅ Filtering and pagination built-in

### **For Users:**
- ✅ Faster user provisioning
- ✅ Self-service capabilities (view profile)
- ✅ Better user experience in frontend

### **For System Admins:**
- ✅ Automated user management possible
- ✅ Bulk operations via scripts
- ✅ Integration with external systems
- ✅ Better audit trails (API logs)

---

## **🔄 Migration Path**

### **Phase 1: Coexistence** (Current)
- ✅ Old method (admin panel) still works
- ✅ New API available for testing
- Both methods write to same database

### **Phase 2: Frontend Integration** (Next)
- Frontend uses API exclusively
- Admin panel used for emergency access only

### **Phase 3: Full Migration** (Future)
- All user management via API
- Admin panel for monitoring only

---

## **📝 Testing Checklist**

Verify old behavior still works:
- [ ] Can create superuser via command: `python manage.py createsuperuser`
- [ ] Can access admin panel: `http://localhost:8000/admin/`
- [ ] Can create users in admin panel
- [ ] Can edit users in admin panel
- [ ] Can delete users in admin panel

Verify new behavior works:
- [ ] Can create user via API: `POST /api/users/`
- [ ] Can list users via API: `GET /api/users/`
- [ ] Can filter users: `GET /api/users/?role=DOCTOR`
- [ ] Can get specific user: `GET /api/users/2/`
- [ ] Can update user: `PATCH /api/users/2/`
- [ ] Can delete user: `DELETE /api/users/2/`
- [ ] Can verify user: `POST /api/users/2/verify/`
- [ ] Can deactivate user: `POST /api/users/2/deactivate/`
- [ ] Can get own profile: `GET /api/users/me/`

---

## **🚀 Next Steps**

1. ✅ Test all endpoints in Postman/Insomnia
2. ✅ Create Postman collection for team
3. ✅ Integrate with React frontend
4. ⏳ Build Patient API (Phase 2.2)
5. ⏳ Build Blood Smear Image API (Phase 2.3)
6. ⏳ Build Analysis Results API (Phase 2.4)

---

**Summary:** We've transformed Hemora from a command-line/admin-only system to a modern REST API-based architecture, enabling frontend integration, mobile apps, and automated workflows! 🎉
