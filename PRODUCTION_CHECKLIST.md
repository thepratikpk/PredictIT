# 🚀 PredictIT Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### **Frontend (Client)**
- [ ] Build completes without errors (`npm run build`)
- [ ] Environment variables configured
- [ ] API URL points to production backend
- [ ] No console errors in production build
- [ ] All TypeScript errors resolved

### **Backend (Server)**
- [ ] All dependencies in requirements.txt
- [ ] Environment variables configured
- [ ] Database connection working
- [ ] Cloudinary integration working
- [ ] CORS origins include frontend domain

### **Database & Services**
- [ ] MongoDB Atlas cluster running
- [ ] Database user has correct permissions
- [ ] Network access configured (0.0.0.0/0)
- [ ] Cloudinary account configured
- [ ] All API keys valid

## 🚀 Deployment Steps

### **Step 1: Deploy Backend (Railway)**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy Backend**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Set **Root Directory**: `server`
   - Railway will auto-detect Python and use Procfile

3. **Configure Environment Variables**
 

4. **Get Railway URL**
   - Copy the generated URL (e.g., `https://predictit-backend-production.up.railway.app`)

### **Step 2: Update Frontend API URL**

1. **Update Production Config**
   ```typescript
   // In client/src/config/api.ts - Line 4
   return 'https://YOUR-RAILWAY-URL.railway.app';
   ```

2. **Update Environment File**
   ```env
   # In client/.env.production
   VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app
   ```

### **Step 3: Deploy Frontend (Vercel)**

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Deploy Frontend**
   - Click "New Project"
   - Import your GitHub repository
   - **Framework Preset**: Vite
   - **Root Directory**: `client` ⚠️ **IMPORTANT**
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Configure Environment Variables**
   ```env
   NODE_ENV=production
   VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### **Step 4: Update Backend CORS**

1. **Add Frontend Domain to CORS**
   ```python
   # In server/main.py
   allow_origins=[
       "http://localhost:5173",
       "https://your-app.vercel.app",  # Add your Vercel domain
       "https://*.vercel.app"  # Allow all Vercel domains
   ]
   ```

2. **Redeploy Backend**
   - Push changes to GitHub
   - Railway will auto-redeploy

## 🧪 Testing Checklist

### **Backend Testing**
- [ ] API docs accessible: `https://your-backend.railway.app/docs`
- [ ] Health check: `https://your-backend.railway.app/`
- [ ] Authentication endpoints working
- [ ] File upload working
- [ ] Database operations working

### **Frontend Testing**
- [ ] App loads without errors
- [ ] User registration works
- [ ] User login works
- [ ] File upload works
- [ ] Pipeline creation works
- [ ] Model training works
- [ ] Project saving works
- [ ] Project loading works

### **Integration Testing**
- [ ] Frontend → Backend communication
- [ ] Authentication flow
- [ ] File upload → Cloudinary
- [ ] Data persistence → MongoDB
- [ ] Error handling

## 🎯 Post-Deployment

### **Monitoring**
- [ ] Set up error monitoring (optional)
- [ ] Monitor Railway logs
- [ ] Monitor Vercel deployment logs
- [ ] Check database usage

### **Performance**
- [ ] Frontend loads quickly
- [ ] API responses are fast
- [ ] File uploads work smoothly
- [ ] No memory leaks

### **Security**
- [ ] HTTPS enabled (automatic)
- [ ] Environment variables secure
- [ ] No sensitive data in logs
- [ ] CORS properly configured

## 🔗 Your Live URLs

After deployment, your app will be available at:

- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.railway.app`
- **API Documentation**: `https://your-backend.railway.app/docs`

## 🆘 Troubleshooting

### **Common Issues**

1. **Build Fails**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check environment variables

2. **CORS Errors**
   - Add frontend domain to backend CORS
   - Check protocol (http vs https)

3. **Database Connection**
   - Verify MongoDB Atlas IP whitelist
   - Check connection string format
   - Verify user permissions

4. **File Upload Issues**
   - Check Cloudinary credentials
   - Verify file size limits
   - Check network connectivity

### **Useful Commands**

```bash
# Test frontend build locally
cd client && npm run build && npm run preview

# Check backend locally
cd server && python main.py

# View Railway logs
railway logs

# View Vercel logs (in dashboard)
```

## 🎉 Success!

Once all items are checked, your PredictIT app is live and ready for users!

**Share your app:**
- Frontend: `https://your-app.vercel.app`
- Show off your ML pipeline builder to the world! 🌟