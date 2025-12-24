# 🚀 PredictIT Deployment Guide

Complete guide to deploy your PredictIT ML Pipeline application to production.

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Frontend Deployment (Vercel)](#frontend-deployment-vercel)
4. [Backend Deployment (Render)](#backend-deployment-render)
5. [Database Setup (MongoDB Atlas)](#database-setup-mongodb-atlas)
6. [Cloudinary Setup](#cloudinary-setup)
7. [Environment Variables](#environment-variables)
8. [Final Steps](#final-steps)

---

## 🔧 Prerequisites

Before deploying, ensure you have:
- ✅ GitHub account
- ✅ Vercel account (for frontend)
- ✅ Render account (for backend)
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

## 🎨 Frontend Deployment (Vercel)

### Step 1: Automatic Environment Detection

The app automatically detects the environment:
- **Development**: Uses `http://localhost:8000`
- **Production**: Uses `https://predictit-api.onrender.com` (your Render backend)

### Step 2: Deploy to Vercel

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
   ```

6. **Deploy!** 🚀

## ⚡ Backend Deployment (Render)

### Step 1: Backend Files Already Configured

Your backend is already configured for Render with:
- ✅ `server/render.yaml` - Render service configuration
- ✅ `server/start.py` - Startup script
- ✅ `server/runtime.txt` - Python version (3.10.9)
- ✅ CORS configured for your Vercel domain

### Step 2: Deploy to Render

1. **Go to [Render.com](https://render.com)**
2. **Click "New" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure deployment:**
   - Name: `predictit-api`
   - Environment: `Python 3`
   - Build Command: `cd server && pip install -r requirements.txt`
   - Start Command: `cd server && python start.py`
   - Plan: `Free`

5. **Add Environment Variables** (see next section)
6. **Deploy!** 🚀

Your backend will be available at: `https://predictit-api.onrender.com`

## 🗄️ Database Setup (MongoDB Atlas)

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
   - API Secret

## 🔐 Environment Variables

### Backend Environment Variables (Render)

Add these in Render dashboard → Environment:

```env
PYTHON_VERSION=3.10.9
ENVIRONMENT=production
MONGODB_URL=mongodb+srv://predictit-user:<password>@predictit-cluster.xxxxx.mongodb.net/predictit?retryWrites=true&w=majority
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
SECRET_KEY=your-super-secret-key-here
```

### Frontend Environment Variables (Vercel)

Add these in Vercel dashboard → Settings → Environment Variables:

```env
NODE_ENV=production
```

---

## 🚀 Final Steps

### 1. Update Service Name (if needed)

If you used a different service name than `predictit-api`, update the frontend API URL in `client/src/config/api.ts`:

```typescript
return 'https://YOUR-SERVICE-NAME.onrender.com';
```

### 2. Test Everything

- ✅ User registration
- ✅ User login  
- ✅ File upload
- ✅ Pipeline creation
- ✅ Model training
- ✅ Project saving/loading

---

## 🔧 Quick Troubleshooting

### CORS Errors
- Your Vercel domain is already configured in CORS
- Make sure your Render service is running

### Database Connection Issues  
- Check MongoDB Atlas IP whitelist (should be 0.0.0.0/0)
- Verify connection string format
- Check environment variables in Render

### File Upload Issues
- Verify Cloudinary credentials in Render environment
- Check file size limits

### Render Service Issues
- Check logs in Render dashboard
- Verify Python version is 3.10.9
- Ensure all dependencies are in requirements.txt

---

## 🎉 Congratulations!

Your PredictIT application is now live! 

**Your URLs:**
- Frontend: `https://predict-i2j2pnxrs-pratik-pralhad-kochares-projects.vercel.app`
- Backend API: `https://predictit-api.onrender.com`
- API Docs: `https://predictit-api.onrender.com/docs` (in development only)

---

*Made with ❤️ by Pratik Kochare*