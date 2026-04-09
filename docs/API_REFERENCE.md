# Hemora API Reference

Base URL: `http://localhost:8000`

All protected endpoints require a JWT access token in the `Authorization` header.
Access tokens expire after **60 minutes**. Use the refresh endpoint to get a new one.

---

## Table of Contents

1. [Authentication](#authentication)
   - [Register](#1-register)
   - [Login](#2-login)
   - [Refresh Token](#3-refresh-token)
2. [User Management](#user-management)
   - [Get My Profile](#4-get-my-profile)
   - [Update My Profile](#5-update-my-profile)
   - [List All Users](#6-list-all-users)
   - [Get User by ID](#7-get-user-by-id)
   - [Create User](#8-create-user)
   - [Update User](#9-update-user)
   - [Delete User](#10-delete-user)
   - [Verify User](#11-verify-user)
   - [Unverify User](#12-unverify-user)
   - [Activate User](#13-activate-user)
   - [Deactivate User](#14-deactivate-user)
3. [Analysis / ML Models](#analysis--ml-models)
   - [Run Diagnosis](#15-run-diagnosis)
   - [List My Sessions](#16-list-my-sessions)
   - [Get Single Session](#17-get-single-session)
4. [Role Reference](#role-reference)
5. [Error Reference](#error-reference)

---

## Authentication

---

### 1. Register

Create a new user account. No token required.

```
POST http://localhost:8000/api/auth/register/
```

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Pass@1234",
  "password2": "Pass@1234",
  "first_name": "John",
  "last_name": "Doe",
  "role": "DOCTOR",
  "medical_license_number": "MED123456",
  "specialization": "Hematology",
  "hospital_affiliation": "City Hospital"
}
```

> Required fields vary by role — see [Role Reference](#role-reference).

**Response `201 Created`**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "role": "DOCTOR",
  "is_verified": false,
  "is_active": true
}
```

---

### 2. Login

Authenticate and receive JWT access + refresh tokens.

```
POST http://localhost:8000/api/auth/token/
```

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "username": "johndoe",
  "password": "Pass@1234"
}
```

**Response `200 OK`**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

> Save both tokens. Use `access` for all requests. Use `refresh` to renew when access expires.

---

### 3. Refresh Token

Get a new access token using your refresh token.

```
POST http://localhost:8000/api/auth/token/refresh/
```

**Headers**
```
Content-Type: application/json
```

**Body**
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response `200 OK`**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## User Management

---

### 4. Get My Profile

Returns the profile of the currently authenticated user.

```
GET http://localhost:8000/api/users/me/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "DOCTOR",
  "phone_number": "",
  "medical_license_number": "MED123456",
  "specialization": "Hematology",
  "hospital_affiliation": "City Hospital",
  "university_affiliation": "",
  "is_verified": false,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

---

### 5. Update My Profile

Update your own profile fields. Use `PATCH` for partial updates.

```
PATCH http://localhost:8000/api/users/me/
```

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**
```json
{
  "first_name": "Jonathan",
  "phone_number": "+94771234567",
  "specialization": "Oncology",
  "hospital_affiliation": "National Hospital"
}
```

**Response `200 OK`**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "Jonathan",
  "phone_number": "+94771234567",
  "specialization": "Oncology",
  "hospital_affiliation": "National Hospital"
}
```

---

### 6. List All Users

Returns a paginated list of all users. **Admin only.**

```
GET http://localhost:8000/api/users/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Query Parameters (optional)**
```
?page=1
?role=DOCTOR
?is_verified=true
?search=johndoe
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "count": 2,
  "next": "http://localhost:8000/api/users/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "full_name": "John Doe",
      "role": "DOCTOR",
      "is_verified": false,
      "is_active": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

---

### 7. Get User by ID

Returns full details of a specific user. **Admin only.**

```
GET http://localhost:8000/api/users/1/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "DOCTOR",
  "phone_number": "",
  "medical_license_number": "MED123456",
  "specialization": "Hematology",
  "hospital_affiliation": "City Hospital",
  "is_verified": false,
  "is_active": true,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### 8. Create User

Create a new user account as an admin. **Admin only.**

```
POST http://localhost:8000/api/users/
```

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**
```json
{
  "username": "labtech01",
  "email": "lab@example.com",
  "password": "Pass@1234",
  "password2": "Pass@1234",
  "first_name": "Lab",
  "last_name": "Tech",
  "role": "LAB_TECH",
  "hospital_affiliation": "City Hospital"
}
```

**Response `201 Created`**
```json
{
  "id": 2,
  "username": "labtech01",
  "email": "lab@example.com",
  "role": "LAB_TECH",
  "is_verified": false,
  "is_active": true
}
```

---

### 9. Update User

Update any field of a user account. **Admin only.** Use `PATCH` for partial updates.

```
PATCH http://localhost:8000/api/users/1/
```

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body**
```json
{
  "specialization": "Pathology",
  "hospital_affiliation": "General Hospital",
  "is_verified": true
}
```

**Response `200 OK`**
```json
{
  "id": 1,
  "username": "johndoe",
  "specialization": "Pathology",
  "hospital_affiliation": "General Hospital",
  "is_verified": true
}
```

---

### 10. Delete User

Permanently delete a user account. **Admin only.**

```
DELETE http://localhost:8000/api/users/1/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `204 No Content`**
```
(empty body)
```

---

### 11. Verify User

Mark a user's account as verified. **Admin only.**

```
POST http://localhost:8000/api/users/1/verify/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "message": "User verified successfully."
}
```

---

### 12. Unverify User

Remove the verified status from a user. **Admin only.**

```
POST http://localhost:8000/api/users/1/unverify/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "message": "User unverified successfully."
}
```

---

### 13. Activate User

Re-enable a deactivated user account. **Admin only.**

```
POST http://localhost:8000/api/users/1/activate/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "message": "User activated successfully."
}
```

---

### 14. Deactivate User

Disable a user account without deleting it. **Admin only.**

```
POST http://localhost:8000/api/users/1/deactivate/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "message": "User deactivated successfully."
}
```

---

## Analysis / ML Models

---

### 15. Run Diagnosis

Submit a blood smear image and CBC data for AI-powered disease detection.
Runs YOLO models for **Acute Lymphoblastic Leukemia (ALL)** and **Beta Thalassemia**.

> Body must be `multipart/form-data`, not JSON. In Postman, use the **form-data** tab.

```
POST http://localhost:8000/api/analysis/diagnose/
```

**Headers**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Body (form-data)**
```
image         = <select .jpg / .png / .tiff file>   [required]
wbc           = 4.5
rbc           = 4.8
hemoglobin    = 13.5
hematocrit    = 41.0
mcv           = 85.0
mch           = 28.0
mchc          = 33.0
rdw           = 14.0
platelet_count = 250.0
neutrophils   = 60.0
lymphocytes   = 30.0
monocytes     = 7.0
eosinophils   = 2.0
basophils     = 1.0
```

> All CBC fields are optional. Only `image` is required.

**Response `200 OK`**
```json
{
  "session_id": 1,
  "status": "COMPLETED",
  "diseases": {
    "ALL": {
      "prediction": "ALLNeg",
      "confidence": 0.94,
      "probabilities": {
        "ALLNeg": 0.94,
        "ALLPos": 0.06
      }
    },
    "Thalassemia": {
      "prediction": "Normal",
      "confidence": 0.88,
      "probabilities": {
        "Normal": 0.88,
        "Thalassemia": 0.12
      }
    }
  },
  "errors": {},
  "cbc_data": {
    "wbc": 4.5,
    "rbc": 4.8,
    "hemoglobin": 13.5,
    "hematocrit": 41.0,
    "mcv": 85.0,
    "mch": 28.0,
    "mchc": 33.0,
    "platelet_count": 250.0,
    "neutrophils": 60.0,
    "lymphocytes": 30.0,
    "monocytes": 7.0,
    "eosinophils": 2.0,
    "basophils": 1.0
  },
  "models_used": ["ALL", "Thalassemia"],
  "processing_time_ms": 312.4,
  "created_at": "2024-01-01T10:00:00Z"
}
```

**Response `500` (when model file is missing)**
```json
{
  "session_id": 2,
  "status": "COMPLETED",
  "diseases": {},
  "errors": {
    "ALL": "Model file not found",
    "Thalassemia": "Model file not found"
  },
  "models_used": [],
  "processing_time_ms": 5.1
}
```

---

### 16. List My Sessions

Returns a paginated list of all analysis sessions for the authenticated user.

```
GET http://localhost:8000/api/analysis/sessions/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Query Parameters (optional)**
```
?page=1
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": "johndoe",
      "status": "COMPLETED",
      "cbc_data": {
        "wbc": 4.5,
        "hemoglobin": 13.5
      },
      "results": {
        "ALL": {
          "prediction": "ALLNeg",
          "confidence": 0.94,
          "probabilities": { "ALLNeg": 0.94, "ALLPos": 0.06 }
        },
        "Thalassemia": {
          "prediction": "Normal",
          "confidence": 0.88,
          "probabilities": { "Normal": 0.88, "Thalassemia": 0.12 }
        }
      },
      "models_used": ["ALL", "Thalassemia"],
      "inference_errors": {},
      "processing_time_ms": 312.4,
      "error_message": "",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:01Z"
    }
  ]
}
```

---

### 17. Get Single Session

Returns the full details of one analysis session by ID.
Only returns sessions that belong to the authenticated user.

```
GET http://localhost:8000/api/analysis/sessions/1/
```

**Headers**
```
Authorization: Bearer <access_token>
```

**Body**
```
(none)
```

**Response `200 OK`**
```json
{
  "id": 1,
  "user": "johndoe",
  "status": "COMPLETED",
  "cbc_data": {
    "wbc": 4.5,
    "rbc": 4.8,
    "hemoglobin": 13.5,
    "hematocrit": 41.0,
    "mcv": 85.0,
    "mch": 28.0,
    "mchc": 33.0,
    "platelet_count": 250.0,
    "neutrophils": 60.0,
    "lymphocytes": 30.0,
    "monocytes": 7.0,
    "eosinophils": 2.0,
    "basophils": 1.0
  },
  "results": {
    "ALL": {
      "prediction": "ALLNeg",
      "confidence": 0.94,
      "probabilities": {
        "ALLNeg": 0.94,
        "ALLPos": 0.06
      }
    },
    "Thalassemia": {
      "prediction": "Normal",
      "confidence": 0.88,
      "probabilities": {
        "Normal": 0.88,
        "Thalassemia": 0.12
      }
    }
  },
  "models_used": ["ALL", "Thalassemia"],
  "inference_errors": {},
  "processing_time_ms": 312.4,
  "error_message": "",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:01Z"
}
```

**Response `404 Not Found`**
```json
{
  "detail": "No AnalysisSession matches the given query."
}
```

---

## Role Reference

Required fields differ based on the `role` value during registration or user creation.

| Role | Value | Required Fields |
|------|-------|----------------|
| Doctor | `DOCTOR` | `first_name`, `last_name`, `medical_license_number`, `specialization`, `hospital_affiliation` |
| Lab Technician | `LAB_TECH` | `first_name`, `last_name`, `hospital_affiliation` |
| Researcher | `RESEARCHER` | `first_name`, `last_name`, `university_affiliation` |
| Administrator | `ADMIN` | `first_name`, `last_name`, `hospital_affiliation` |

---

## Error Reference

| Status Code | Meaning |
|-------------|---------|
| `200` | Success |
| `201` | Resource created |
| `204` | Success, no content (DELETE) |
| `400` | Bad request — check your request body |
| `401` | Unauthorized — token missing or expired |
| `403` | Forbidden — you don't have permission |
| `404` | Resource not found |
| `500` | Server / inference error |

**401 example**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```

**400 example**
```json
{
  "username": ["This field is required."],
  "password": ["This password is too short. It must contain at least 8 characters."]
}
```

**403 example**
```json
{
  "detail": "You do not have permission to perform this action."
}
```

---

## Quick Start

```
1. POST /api/auth/register/     → create your account
2. POST /api/auth/token/        → get access + refresh tokens
3. Add header to all requests:
     Authorization: Bearer <access_token>
4. POST /api/analysis/diagnose/ → run a diagnosis
5. POST /api/auth/token/refresh/ → when access token expires (60 min)
```
