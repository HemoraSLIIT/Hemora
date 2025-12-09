# **Hemora - Complete Setup Guide for Team Members**

## **📋 Overview**

This guide will help you set up the Hemora Blood Disease Detection System on your local machine from scratch. Follow each step carefully to get the project running exactly as it does on the development machine.

---

## **🎯 What You'll Set Up**

1. **Backend** - Django REST API with PostgreSQL database
2. **Frontend** - React application with Vite
3. **Development Tools** - Python virtual environment, Node.js, Git

---

## **⚙️ Prerequisites - Software to Install**

### **1. Python 3.13**

**Download & Install:**
- Go to: https://www.python.org/downloads/
- Download Python 3.13 (latest version)
- **IMPORTANT:** During installation, check "Add Python to PATH"
- Verify installation:
  ```powershell
  python --version
  # Should show: Python 3.13.x
  ```

---

### **2. PostgreSQL 15**

**Download & Install:**
- Go to: https://www.postgresql.org/download/windows/
- Download PostgreSQL 15 installer
- During installation:
  - Set password: `hemora25` (or remember your password)
  - Port: `5432` (default)
  - Install pgAdmin 4 (included)

**Verify Installation:**
```powershell
psql --version
# Should show: psql (PostgreSQL) 15.x
```

---

### **3. Node.js 18+ (LTS)**

**Download & Install:**
- Go to: https://nodejs.org/
- Download LTS version (18.x or 20.x)
- Run installer with default options

**Verify Installation:**
```powershell
node --version
# Should show: v18.x.x or v20.x.x

npm --version
# Should show: 9.x.x or 10.x.x
```

---

### **4. Git**

**Download & Install:**
- Go to: https://git-scm.com/downloads
- Download Windows installer
- Use default options during installation

**Verify Installation:**
```powershell
git --version
# Should show: git version 2.x.x
```

---

### **5. Code Editor - VS Code (Recommended)**

**Download & Install:**
- Go to: https://code.visualstudio.com/
- Download and install
- Recommended extensions:
  - Python
  - Pylance
  - ES7+ React/Redux/React-Native snippets
  - Tailwind CSS IntelliSense
  - GitLens

---

## **📂 Step 1: Clone the Repository**

Open PowerShell or Command Prompt:

```powershell
# Navigate to where you want the project
cd C:\Works\SLIIT-FOC\Research\Development

# Clone the repository
git clone https://github.com/Nizith/Hemora.git

# Navigate into project
cd Hemora

# Verify you're on the correct branch
git branch
# Should show: * main or * dev
```

---

## **🗄️ Step 2: Set Up PostgreSQL Database**

### **Option 1: Using pgAdmin (Recommended for Beginners)**

1. **Open pgAdmin 4**
   - Find it in Start Menu or Desktop

2. **Connect to PostgreSQL Server**
   - Enter password: `hemora25` (or your password)

3. **Create Database**
   - Right-click "Databases" → Create → Database
   - Database name: `hemoradb`
   - Owner: `postgres`
   - Click "Save"

4. **Verify Database Created**
   - You should see `hemoradb` in the database list

---

### **Option 2: Using Command Line (Faster)**

```powershell
# Open PowerShell as Administrator

# Connect to PostgreSQL
psql -U postgres

# Enter password when prompted: hemora25

# Create database
CREATE DATABASE hemoradb;

# Verify database exists
\l

# Exit psql
\q
```

---

## **🐍 Step 3: Set Up Python Backend**

### **3.1 Navigate to Project Directory**

```powershell
cd C:\Works\SLIIT-FOC\Research\Development\Hemora
```

### **3.2 Create Virtual Environment**

```powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\activate

# You should see (venv) at the start of your prompt
```

**Troubleshooting Activation:**
If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **3.3 Install Python Dependencies**

```powershell
# Make sure you're in project root and venv is activated
# You should see (venv) in your prompt

# Install all required packages
pip install -r requirements.txt

# This will take 5-10 minutes
# Wait for all packages to install
```

**Verify Installation:**
```powershell
pip list | findstr Django
# Should show: Django 5.2.7 (or similar)

pip list | findstr djangorestframework
# Should show: djangorestframework 3.16.1
```

### **3.4 Configure Environment Variables**

The `.env` file should already exist in the project root. If not, create it:

```powershell
# Check if .env exists
ls .env

# If it doesn't exist, create it with this content:
```

Create `.env` file with:
```env
# Django Settings
SECRET_KEY=c)h1lx26=eyv@$oa&jgff2lj&1i=4_o*0f!t(h*ckvd5fth6&r
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_ENGINE=django.db.backends.postgresql
DB_NAME=hemoradb
DB_USER=postgres
DB_PASSWORD=hemora25
DB_HOST=localhost
DB_PORT=5432
```

**IMPORTANT:** If you used a different PostgreSQL password, update `DB_PASSWORD` in `.env`

### **3.5 Run Database Migrations**

```powershell
# Navigate to backend folder
cd backend

# Run migrations to create database tables
python manage.py migrate

# You should see:
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying auth.0001_initial... OK
#   Applying accounts.0001_initial... OK
#   ... (more migrations)
```

**If you get an error:**
- Check PostgreSQL is running
- Verify database `hemoradb` exists
- Verify `.env` has correct password

### **3.6 Create Admin User**

```powershell
# Create superuser account
python manage.py createsuperuser

# Enter details when prompted:
# Username: admin
# Email: admin@hemora.lk
# Password: Admin123!
# Password (again): Admin123!
```

### **3.7 Test Backend Server**

```powershell
# Start Django development server
python manage.py runserver

# You should see:
# Starting development server at http://127.0.0.1:8000/
# Quit the server with CTRL-BREAK.
```

**Verify Backend is Running:**
- Open browser: http://127.0.0.1:8000/admin/
- Login with admin credentials
- You should see Django admin panel

**Stop the server:** Press `Ctrl + C` or `Ctrl + Break`

---

## **⚛️ Step 4: Set Up React Frontend**

### **4.1 Navigate to Frontend Directory**

```powershell
# Open a NEW PowerShell window (keep backend running in the other)
cd C:\Works\SLIIT-FOC\Research\Development\Hemora\frontend
```

### **4.2 Install Node Dependencies**

```powershell
# Install all npm packages
npm install

# This will take 2-5 minutes
# Wait for all packages to install
```

**Verify Installation:**
```powershell
npm list react
# Should show: react@19.2.0

npm list vite
# Should show: vite@7.2.4
```

### **4.3 Configure Environment Variables**

```powershell
# Check if .env exists
ls .env

# If not, create .env file
```

Create `frontend/.env` with:
```env
VITE_API_BASE_URL=http://localhost:8000/api
```

### **4.4 Start Frontend Development Server**

```powershell
# Start Vite dev server
npm run dev

# You should see:
#   VITE v7.2.4  ready in XXX ms
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
```

**Verify Frontend is Running:**
- Open browser: http://localhost:5173/
- You should see the Hemora registration page

---

## **✅ Step 5: Verify Complete Setup**

### **Test Full Stack Integration:**

1. **Backend Check:**
   - Backend terminal shows: `Starting development server at http://127.0.0.1:8000/`
   - Browser: http://127.0.0.1:8000/admin/ loads

2. **Frontend Check:**
   - Frontend terminal shows: `Local: http://localhost:5173/`
   - Browser: http://localhost:5173/ loads

3. **Database Check:**
   - pgAdmin shows `hemoradb` database
   - Tables exist in `hemoradb` (accounts_user, django_migrations, etc.)

4. **API Connection Check:**
   - Go to: http://localhost:5173/
   - Try to register a new user
   - If successful, you see dashboard → **EVERYTHING WORKS!** 🎉

---

## **🚀 Daily Development Workflow**

### **Every Time You Start Working:**

**Terminal 1 - Backend:**
```powershell
# Navigate to project
cd C:\Works\SLIIT-FOC\Research\Development\Hemora

# Activate virtual environment
.\venv\Scripts\activate

# Go to backend
cd backend

# Start Django server
python manage.py runserver
```

**Terminal 2 - Frontend:**
```powershell
# Navigate to frontend
cd C:\Works\SLIIT-FOC\Research\Development\Hemora\frontend

# Start Vite dev server
npm run dev
```

**Now you can develop! 🎨**
- Backend API: http://127.0.0.1:8000/
- Frontend App: http://localhost:5173/
- Admin Panel: http://127.0.0.1:8000/admin/

---

## **🔄 Pulling Latest Changes from Main Branch**

When other team members push changes:

```powershell
# Stop both servers (Ctrl+C in both terminals)

# Navigate to project root
cd C:\Works\SLIIT-FOC\Research\Development\Hemora

# Pull latest changes
git pull origin main

# OR if you're on dev branch
git pull origin dev
```

**After pulling changes:**

### **Backend Updates:**
```powershell
# Activate venv
.\venv\Scripts\activate

# Update dependencies (if requirements.txt changed)
pip install -r requirements.txt

# Run new migrations (if models changed)
cd backend
python manage.py migrate

# Restart server
python manage.py runserver
```

### **Frontend Updates:**
```powershell
# Navigate to frontend
cd frontend

# Update dependencies (if package.json changed)
npm install

# Restart server
npm run dev
```

---

## **📚 Testing the Application**

### **1. Test User Registration**

1. Open: http://localhost:5173/
2. Fill registration form:
   - Username: `test_user`
   - Email: `test@example.com`
   - First Name: `Test`
   - Last Name: `User`
   - Password: `Test123!`
   - Confirm Password: `Test123!`
3. Click "Register"
4. Should redirect to Dashboard
5. Should see user info displayed

### **2. Test Login**

1. Logout from dashboard
2. Go to: http://localhost:5173/login
3. Enter credentials:
   - Username: `test_user`
   - Password: `Test123!`
4. Click "Log In"
5. Should see dashboard with user info

### **3. Test API Endpoints (Optional)**

Use Insomnia or Postman:

**Login:**
```http
POST http://localhost:8000/api/auth/token/
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin123!"
}
```

**Get Current User:**
```http
GET http://localhost:8000/api/users/me/
Authorization: Bearer <your_access_token>
```

---

## **🐛 Common Issues & Solutions**

### **Issue 1: Python Command Not Found**

**Error:** `'python' is not recognized`

**Solution:**
```powershell
# Try python3 instead
python3 --version

# If that works, use python3 everywhere instead of python
```

**Or reinstall Python and check "Add to PATH"**

---

### **Issue 2: PostgreSQL Connection Error**

**Error:** `could not connect to server`

**Solution:**
1. Check PostgreSQL service is running:
   - Search "Services" in Windows
   - Find "postgresql-x64-15"
   - Status should be "Running"
   - If not, right-click → Start

2. Verify database exists:
   - Open pgAdmin
   - Check `hemoradb` is there

3. Check password in `.env` matches PostgreSQL password

---

### **Issue 3: Port Already in Use**

**Error:** `Error: That port is already in use`

**Solution:**
```powershell
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace <PID> with actual number)
taskkill /PID <PID> /F

# Or use different port
python manage.py runserver 8001
```

---

### **Issue 4: Module Not Found Errors**

**Error:** `ModuleNotFoundError: No module named 'django'`

**Solution:**
```powershell
# Make sure virtual environment is activated
# You should see (venv) in prompt

# If not activated:
.\venv\Scripts\activate

# Reinstall requirements
pip install -r requirements.txt
```

---

### **Issue 5: CORS Errors in Frontend**

**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:**
1. Check backend is running: http://127.0.0.1:8000/
2. Check `corsheaders` is installed:
   ```powershell
   pip show django-cors-headers
   ```
3. Restart backend server

---

### **Issue 6: npm Install Fails**

**Error:** `npm ERR!` during `npm install`

**Solution:**
```powershell
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -r node_modules
rm package-lock.json

# Try again
npm install
```

---

## **📦 Project Structure Reference**

```
Hemora/
├── backend/                    # Django REST API
│   ├── accounts/              # User authentication & management
│   │   ├── models.py          # User model with roles
│   │   ├── serializers.py     # API serializers
│   │   ├── views.py           # API endpoints
│   │   └── urls.py            # URL routing
│   ├── config/                # Django settings
│   │   ├── settings.py        # Main configuration
│   │   └── urls.py            # Main URL routing
│   └── manage.py              # Django management script
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Login.jsx      # Login page
│   │   │   ├── Register.jsx   # Registration page
│   │   │   └── Dashboard.jsx  # User dashboard
│   │   ├── services/
│   │   │   └── api.js         # API service with JWT
│   │   └── App.jsx            # Main app component
│   ├── package.json           # Node dependencies
│   └── vite.config.js         # Vite configuration
│
├── docs/                       # Documentation
│   ├── SETUP_GUIDE.md         # This file!
│   ├── USER_API_GUIDE.md      # API documentation
│   └── FRONTEND_JWT_INTEGRATION.md
│
├── requirements.txt            # Python dependencies
├── .env                       # Environment variables (backend)
└── README.md                  # Project overview
```

---

## **🔐 Important Credentials**

**PostgreSQL:**
- Username: `postgres`
- Password: `hemora25` (or your password)
- Database: `hemoradb`
- Port: `5432`

**Django Admin:**
- URL: http://127.0.0.1:8000/admin/
- Username: `admin`
- Password: `Admin123!`

**Test User (after registration):**
- Username: `test_user`
- Password: `Test123!`

---

## **📖 Useful Commands Cheat Sheet**

### **Python/Django:**
```powershell
# Activate virtual environment
.\venv\Scripts\activate

# Deactivate virtual environment
deactivate

# Start Django server
python manage.py runserver

# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Open Django shell
python manage.py shell

# Check installed packages
pip list
```

### **React/Frontend:**
```powershell
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check installed packages
npm list
```

### **Git:**
```powershell
# Check current branch
git branch

# Pull latest changes
git pull origin main

# Check status
git status

# View commit history
git log --oneline

# Switch branch
git checkout <branch-name>
```

### **PostgreSQL:**
```powershell
# Connect to PostgreSQL
psql -U postgres

# List databases
\l

# Connect to database
\c hemoradb

# List tables
\dt

# View table structure
\d accounts_user

# Exit psql
\q
```

---

## **📞 Getting Help**

### **If You're Stuck:**

1. **Check Console Errors**
   - Backend: Look at Django terminal output
   - Frontend: Check browser console (F12 → Console tab)

2. **Verify Services Running**
   - PostgreSQL service
   - Django server (port 8000)
   - Vite server (port 5173)

3. **Check Documentation**
   - `docs/USER_API_GUIDE.md` - API endpoints
   - `docs/FRONTEND_JWT_INTEGRATION.md` - Frontend guide

4. **Contact Team:**
   - Share error screenshots
   - Describe what you were doing
   - Mention which step you're on

---

## **🎓 Learning Resources**

### **Django:**
- Official Docs: https://docs.djangoproject.com/
- Django REST Framework: https://www.django-rest-framework.org/

### **React:**
- Official Docs: https://react.dev/
- Vite Guide: https://vitejs.dev/guide/

### **PostgreSQL:**
- Official Docs: https://www.postgresql.org/docs/

### **Git:**
- Git Handbook: https://guides.github.com/

---

## **✅ Final Checklist**

Before you start developing, verify:

- [ ] Python 3.13 installed and in PATH
- [ ] PostgreSQL 15 installed and running
- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Repository cloned from GitHub
- [ ] Database `hemoradb` created
- [ ] Virtual environment created and activated
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Database migrations applied (`python manage.py migrate`)
- [ ] Admin user created
- [ ] Backend server starts successfully
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend server starts successfully
- [ ] Can access frontend at http://localhost:5173/
- [ ] Can register and login successfully

---

## **🎉 You're All Set!**

You now have a fully functional development environment for Hemora! 

**Next Steps:**
1. Explore the admin panel
2. Try registering users with different roles
3. Test API endpoints
4. Start contributing to the project

**Happy Coding! 🚀**

---

*Last Updated: December 4, 2025*  
*Project: Hemora Blood Disease Detection System*  
*Team: SLIIT FOC Research Group*
