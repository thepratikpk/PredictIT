# 🚀 Quick Deployment Fix Guide

## ❌ **Current Issue**
Vercel deployment failing because it can't find the `client` directory.

## ✅ **Solution**

### **Option 1: Fix Vercel Configuration (Recommended)**

1. **In Vercel Dashboard:**
   - Go to your project settings
   - Set **Root Directory** to `client`
   - Set **Build Command** to `npm run build`
   - Set **Output Directory** to `dist`
   - Set **Install Command** to `npm install`

2. **Add Environment Variables in Vercel:**
   ```
   NODE_ENV=production
   VITE_API_URL=https://your-railway-url.railway.app
   ```

### **Option 2: Deploy Client Separately**

1. **Create a new repository with just client files:**
   ```bash
   # Create new repo for frontend only
   mkdir predictit-frontend
   cd predictit-frontend
   
   # Copy client files
   cp -r ../ML_pipelineApp/client/* .
   
   # Initialize git
   git init
   git add .
   git commit -m "Frontend only"
   
   # Push to new GitHub repo
   git remote add origin https://github.com/YOUR_USERNAME/predictit-frontend.git
   git push -u origin main
   ```

2. **Deploy this new repo to Vercel** (no root directory needed)

### **Option 3: Use Vercel CLI**

```bash
# From your client directory
cd client
npx vercel --prod
```

## 🧹 **Backend Cleanup (Already Done)**

✅ Removed unnecessary files:
- `server/main_backup.py`
- `server/main_simple.py`
- Added `.dockerignore` for Railway
- Updated `.gitignore`

## 🔧 **Backend Deployment (Railway)**

Your backend is ready to deploy:

1. **Go to [Railway.app](https://railway.app)**
2. **New Project → Deploy from GitHub**
3. **Select your repository**
4. **Set Root Directory to `server`**
5. **Add Environment Variables:**
   ```
   MONGODB_URL=mongodb+srv://thepratikpk:T8GyqLATaDCyxkCa@clusterone.dubew.mongodb.net/ML_Pipeline
   JWT_SECRET_KEY=123467qwertysdfh
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=90
   CLOUDINARY_CLOUD_NAME=dpubhwtse
   CLOUDINARY_API_KEY=532269941745133
   CLOUDINARY_API_SECRET=qcVAwy0slBY9X-7mmKPtPdB4ZKE
   APP_NAME=PredictIT
   APP_VERSION=1.0.0
   ENVIRONMENT=production
   ```

## 📝 **Next Steps**

1. ✅ **Deploy Backend First** (Railway)
2. ✅ **Get Railway URL** (e.g., `https://predictit-backend-production.up.railway.app`)
3. ✅ **Update `client/src/config/api.ts`** with Railway URL
4. ✅ **Deploy Frontend** (Vercel with correct root directory)
5. ✅ **Test Everything**

## 🎯 **Quick Commands**

```bash
# Update API URL in client/src/config/api.ts
# Replace line 4 with your Railway URL

# Commit changes
git add .
git commit -m "Update production API URL"
git push

# Deploy will auto-trigger on Vercel
```

---

**Your app will be live at:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-app.railway.app`