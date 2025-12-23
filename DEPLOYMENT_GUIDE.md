# 🚀 PredictIT Deployment Guide

Complete guide to deploy your PredictIT ML Pipeline application to production.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Railway)](#backend-deployment-railway)
5. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
6. [Cloudinary Setup](#cloudinary-setup)
7. [Environment Variables](#environment-variables)
8. [Final Steps](#final-steps)

---

## 🔧 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account
- ✅ Vercel account (for frontend)
- ✅ Railway account (for backend)
- ✅ MongoDB Atlas account (for database)
- ✅ Cloudinary account (for file storage)

---

## 🌍 Environment Setup

### 1. Prepare Your Repository

```bash
# 1. Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: PredictIT ML Pipeline"

# 2. Create GitHub repository
# Go to GitHub.com → New Repository → "predictit-ml-pipeline"

# 3. Push to GitHub
git remote add origin https://github.com/YOUR_USERNAME/predictit-ml-pipeline.git
git branch -M main
git push -u origin main
```
## 🎨 
Frontend Deployment (Vercel)

### Step 1: Create API Configuration

Create `client/src/config/api.ts`:
```typescript
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.railway.app'  // Replace with your backend URL
  : 'http://localhost:8000';
```

### Step 2: Update API Calls

Update all fetch calls to use the config:
```typescript
// Example: Update in client/src/store/authStore.ts
import { API_BASE_URL } from '../config/api';

// Replace 'http://localhost:8000' with API_BASE_URL
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  // ... rest of the code
});
```

### Step 3: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure build settings:**
   - Framework Preset: `Vite`
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   VITE_API_URL=https://your-backend-domain.railway.app
   ```

6. **Deploy!** 🚀## ⚡
 Backend Deployment (Railway)

### Step 1: Prepare Backend Files

1. **Create `server/Procfile`:**
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. **Update CORS in `server/main.py`:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173",
        "https://your-frontend-domain.vercel.app",  # Add your Vercel domain
        "https://*.vercel.app",  # Allow all Vercel domains
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Click "New Project" → "Deploy from GitHub repo"**
3. **Select your repository**
4. **Configure deployment:**
   - Root Directory: `server`
   - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

5. **Add Environment Variables** (see next section)
6. **Deploy!** 🚀## 🗄️ 
Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. **Go to [MongoDB Atlas](https://www.mongodb.com/atlas)**
2. **Create account/Sign in**
3. **Create New Cluster:**
   - Choose FREE tier (M0)
   - Select region closest to your users
   - Cluster Name: `predictit-cluster`

### Step 2: Configure Database

1. **Database Access:**
   - Create database user
   - Username: `predictit-user`
   - Password: Generate strong password
   - Database User Privileges: `Read and write to any database`

2. **Network Access:**
   - Add IP Address: `0.0.0.0/0` (Allow access from anywhere)

3. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password

---

## ☁️ Cloudinary Setup

### Step 1: Create Cloudinary Account

1. **Go to [Cloudinary.com](https://cloudinary.com)**
2. **Sign up for free account**
3. **Go to Dashboard**

### Step 2: Get API Credentials

1. **Copy from Dashboard:**
   - Cloud Name
   - API Key
   - API Secret## 🔐 
Environment Variables

### Backend Environment Variables (Railway)

Add these in Railway dashboard → Variables:

```env
# Database
MONGODB_URI=mongodb+srv://predictit-user:<password>@predictit-cluster.xxxxx.mongodb.net/predictit?retryWrites=true&w=majority

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Environment
ENVIRONMENT=production
```

### Frontend Environment Variables (Vercel)

Add these in Vercel dashboard → Settings → Environment Variables:

```env
NODE_ENV=production
VITE_API_URL=https://your-backend-domain.railway.app
```

---

## 🚀 Final Steps

### 1. Update Frontend API URL

After deploying backend, update your frontend:
1. Copy your Railway backend URL
2. Update Vercel environment variable `VITE_API_URL`
3. Redeploy frontend

### 2. Update Backend CORS

Add your Vercel frontend URL to CORS origins in `main.py`

### 3. Test Everything

- ✅ User registration
- ✅ User login  
- ✅ File upload
- ✅ Pipeline creation
- ✅ Model training
- ✅ Project saving/loading

---

## 🔧 Quick Troubleshooting

### CORS Errors
Make sure your frontend domain is in backend CORS origins

### Database Connection Issues  
- Check MongoDB Atlas IP whitelist
- Verify connection string format

### File Upload Issues
- Verify Cloudinary credentials
- Check file size limits

---

## 🎉 Congratulations!

Your PredictIT application is now live! 

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend API: `https://your-api.railway.app`
- API Docs: `https://your-api.railway.app/docs`

---

*Made with ❤️ by Pratik Kochare*