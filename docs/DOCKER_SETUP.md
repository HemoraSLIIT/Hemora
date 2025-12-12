# Docker Setup Guide for Hemora (Beginner-Friendly)

**What is Docker?** Think of it as a way to run our entire application (backend, frontend, database) in isolated containers, like separate boxes that work together. This means everyone on the team gets the exact same setup without installing PostgreSQL, Python, Node.js individually.

**Why use Docker?** 
- ✅ No more "it works on my machine" problems
- ✅ One command to start everything
- ✅ Easy to share with teammates
- ✅ Clean separation between projects

---

## 📋 What You Need to Install

### Step 1: Install Docker Desktop

1. **Download Docker Desktop**
   - Go to: https://www.docker.com/products/docker-desktop
   - Click "Download for Windows"
   - Run the installer (it's like installing any other software)

2. **After Installation**
   - Open Docker Desktop (you'll see a whale icon in your taskbar)
   - Wait for it to say "Docker Desktop is running"
   - That's it! You don't need to understand how it works

### Step 2: Install Git (if you don't have it)

- Download from: https://git-scm.com/downloads
- Just click "Next" through the installer (defaults are fine)

---

## 🚀 Getting Started (Follow These Steps Exactly)

## 🚀 Getting Started (Follow These Steps Exactly)

### Step 1: Open PowerShell

- Press `Windows Key + X`
- Click "Windows PowerShell" (or "Terminal")
- You'll see a blue window with text - this is where you type commands

### Step 2: Get the Project Code

```powershell
# Go to your work folder (change this to wherever you want to keep the project)
cd C:\Works

# Download the project
git clone https://github.com/Nizith/Hemora.git

# Go into the project folder
cd Hemora

# Switch to the development branch
git checkout dev
```

**What just happened?** You copied the project code from GitHub to your computer.

### Step 3: Create Configuration File

We need to tell the application some settings. Don't worry, just copy-paste this:

```powershell
# Copy the example file
Copy-Item backend\.env.example .env

# Open it in Notepad
notepad .env
```

**In Notepad, you'll see something like this:**

```env
SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

DB_NAME=hemoradb
DB_USER=postgres
DB_PASSWORD=hemora25
DB_HOST=postgres
DB_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://frontend:5173

MAX_UPLOAD_SIZE=10485760
ALLOWED_IMAGE_EXTENSIONS=jpg,jpeg,png,tiff

MODEL_PATH=/app/data/models/
DEFAULT_MODEL=blood_disease_classifier.pth
CONFIDENCE_THRESHOLD=0.8
```

**What to change:**
- Line 1: Change `your-super-secret-key-here-change-this` to any random text (make it long and random)
- Everything else: **LEAVE IT AS IS** (seriously, just leave it)

Save the file (Ctrl+S) and close Notepad.

### Step 4: Start Everything

Back in PowerShell, type these commands:

```powershell
# Build the application (this takes 5-10 minutes the first time)
docker compose build

# Start everything
docker compose up -d
```

**What's happening?** Docker is:
1. Creating a database (PostgreSQL)
2. Setting up the backend (Django)
3. Setting up the frontend (React)

The `-d` means "run in background" so you can keep using your computer.

### Step 5: Set Up the Database

```powershell
# Create database tables
docker compose exec backend python manage.py migrate

# Create an admin account
docker compose exec backend python manage.py createsuperuser
```

**For the superuser, you'll be asked:**
- Username: (type anything, like `admin`)
- Email: (type your email or just press Enter to skip)
- Password: (type a password - you won't see it while typing, that's normal)
- Password again: (type the same password)

### Step 6: Open the Application

Open your web browser and go to:

- **Frontend (main app)**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin panel**: http://localhost:8000/admin/

**If you see websites, congratulations! It's working! 🎉**

---

## 🛑 How to Stop Everything

```powershell
# Stop the application (keeps your data)
docker compose stop

# Start it again later
docker compose start
```

**When to use this:** End of the day, shutting down your computer, taking a break.

---

## 🔄 Daily Workflow (What You'll Actually Do)

### Starting Work

```powershell
# 1. Open PowerShell
# 2. Go to project folder
cd C:\Works\Hemora

# 3. Start Docker
docker compose start

# 4. Open http://localhost:5173 in your browser
```

### While Working

- **Edit Backend Code**: Just edit files in `backend/` folder, changes appear automatically
- **Edit Frontend Code**: Just edit files in `frontend/src/` folder, browser refreshes automatically
- **No need to restart anything** - Docker handles it!

### After Making Changes

```powershell
# If you changed requirements.txt (Python packages)
docker compose build backend
docker compose restart backend

# If you changed package.json (Node packages)
docker compose build frontend
docker compose restart frontend

# If you changed database models
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

### Ending Work

```powershell
# Stop everything (keeps your data safe)
docker compose stop
```

---

## 😱 Something Went Wrong? (Common Problems)

### Problem 1: "Port is already in use"

**What this means:** Another program is using the same port.

**Fix:**
```powershell
# Find what's using port 8000
netstat -ano | Select-String ":8000"

# You'll see a number (PID) at the end, like 12345
# Kill that process (replace 12345 with your number)
Stop-Process -Id 12345 -Force

# Try starting again
docker compose up -d
```

### Problem 2: "Cannot connect to database"

**What this means:** Database isn't ready yet.

**Fix:**
```powershell
# Restart the database
docker compose restart postgres

# Wait 10 seconds, then restart backend
Start-Sleep -Seconds 10
docker compose restart backend
```

### Problem 3: "Docker is not running"

**What this means:** Docker Desktop isn't open.

**Fix:**
- Open Docker Desktop (search for it in Start menu)
- Wait for the whale icon to stop moving
- Try your command again

### Problem 4: "Frontend shows blank page"

**Fix:**
```powershell
# Rebuild frontend
docker compose build frontend
docker compose restart frontend

# Wait 30 seconds, then refresh browser (Ctrl+Shift+R)
```

### Problem 5: "I broke everything!"

**Nuclear option - start fresh (WARNING: Deletes your database):**
```powershell
# Stop and delete everything
docker compose down -v

# Start over from Step 4 above
docker compose build
docker compose up -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

---

## 📝 Useful Commands (Cheat Sheet)

### Viewing Logs (See What's Happening)

```powershell
# See all logs
docker compose logs

# See backend logs only
docker compose logs backend

# See frontend logs only
docker compose logs frontend

# Follow logs in real-time (like watching it live)
docker compose logs -f
```

### Checking Status

```powershell
# See what's running
docker compose ps

# Should show:
# hemora_postgres    Up
# hemora_backend     Up
# hemora_frontend    Up
```

### Database Stuff

```powershell
# Access database directly (for advanced users)
docker compose exec postgres psql -U postgres -d hemoradb

# Create a new admin user
docker compose exec backend python manage.py createsuperuser

# Reset a user's password
docker compose exec backend python manage.py changepassword username
```

### Cleaning Up

```powershell
# Remove old/unused Docker stuff (frees up space)
docker system prune

# Check how much space Docker is using
docker system df
```

---

## 👥 For Your Teammates

### How to Share This Setup

1. **Push your code to GitHub**
   ```powershell
   git add .
   git commit -m "Added Docker setup"
   git push
   ```

2. **Tell your teammates to:**
   - Install Docker Desktop (Step 1 above)
   - Clone the repository (Step 2 above)
   - Follow Steps 3-6 above

3. **That's it!** Everyone will have the exact same setup.

### What to Share, What NOT to Share

**✅ Share these files:**
- All code files (`.py`, `.jsx`, `.js`)
- `docker-compose.yml`
- `Dockerfile`
- `.dockerignore`
- `backend/.env.example`

**❌ NEVER share these:**
- `.env` (has your passwords!)
- `__pycache__/`
- `node_modules/`
- `.vscode/`

*These are already in `.gitignore` so Git won't upload them.*

---

## 🤔 FAQ (Questions You Might Have)

**Q: Do I need to understand Docker to use this?**  
A: Nope! Just follow the commands. Docker is like a black box that works.

**Q: Why is the first build so slow?**  
A: Docker is downloading Python, Node.js, PostgreSQL, and all packages. Next time it's much faster (30 seconds).

**Q: Can I use PyCharm/VS Code normally?**  
A: Yes! Edit files normally. Docker watches for changes.

**Q: What if I want to run backend without Docker?**  
A: You can, but then you need to install Python, PostgreSQL, etc. manually. Docker is easier.

**Q: Do I need to run `docker compose up` every time?**  
A: Only first time. After that, use `docker compose start` (faster).

**Q: Where is the database stored?**  
A: Inside a Docker volume. Your data is safe even if you restart.

**Q: How do I see the database?**  
A: Go to http://localhost:8000/admin/ (use the superuser account you created).

**Q: What if I accidentally deleted something?**  
A: Your code is safe (it's in your folder). Database can be recreated with migrations. That's why we use Git!

---

## 🆘 Still Stuck?

### Try These First:

1. **Restart Docker Desktop**
   - Right-click Docker whale icon → Quit Docker Desktop
   - Start it again
   - Wait for "Docker Desktop is running"

2. **Restart Everything**
   ```powershell
   docker compose restart
   ```

3. **Check Logs**
   ```powershell
   docker compose logs -f
   ```
   Look for RED text - that's usually the error.

### Ask for Help:

- **GitHub Issues**: https://github.com/Nizith/Hemora/issues
- **Show your teammate this message:**
  ```
  Run: docker compose logs
  Copy the RED error text
  Send it to the team
  ```

---

## 📖 Want to Learn More?

**After you're comfortable with the basics:**

- [What is Docker? (5 min video)](https://www.youtube.com/watch?v=Gjnup-PuquQ)
- [Docker Compose explained (10 min)](https://docs.docker.com/compose/)
- [Django with Docker tutorial](https://docs.docker.com/samples/django/)

**But honestly, you don't need to learn Docker to use this. Just follow the steps! 👍**

---

**Last Updated**: December 7, 2025  
**Written for**: Beginners who just want to run the app  
**Version**: 1.0.0 (Simple)
