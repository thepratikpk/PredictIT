# 🚀 Render Deployment Checklist

## Current Issue: 404 Not Found

The error `GET https://predictit-api.onrender.com/health net::ERR_FAILED 404 (Not Found)` means:

**❌ The Render service is not deployed yet or has a different name**

## ✅ Step-by-Step Deployment

### 1. Check Your Render Dashboard
1. Go to [render.com](https://render.com) and sign in
2. Look for a service named `predictit-api`
3. Check the status:
   - **🟢 Live** = Service is running
   - **🟡 Building** = Service is deploying
   - **🔴 Failed** = Deployment failed
   - **⚪ Not Found** = Service doesn't exist yet

### 2. If Service Doesn't Exist - Deploy Now

1. **Click "New" → "Web Service"**
2. **Connect GitHub Repository**
   - Select your repository
   - Branch: `main` (or your default branch)

3. **Configure Service**
   ```
   Name: predictit-api
   Environment: Python 3
   Build Command: cd server && pip install -r requirements.txt
   Start Command: cd server && python start.py
   ```

4. **Add Environment Variables**
   ```
   PYTHON_VERSION=3.10.9
   ENVIRONMENT=production
   ```

5. **Click "Create Web Service"**

### 3. If Service Exists But Failed

1. **Check the Logs**
   - Click on your service
   - Go to "Logs" tab
   - Look for error messages

2. **Common Issues & Fixes**
   
   **Build Errors:**
   ```bash
   # If requirements.txt not found
   Make sure: cd server && pip install -r requirements.txt
   
   # If Python version issues
   Check runtime.txt has: python-3.10.9
   ```
   
   **Startup Errors:**
   ```bash
   # If start.py not found
   Make sure: cd server && python start.py
   
   # If port binding issues
   Check start.py uses: port = int(os.getenv('PORT', 10000))
   ```

### 4. If Service Has Different Name

If you named your service something other than `predictit-api`:

1. **Note the actual service name**
2. **Update frontend configuration**:
   
   Edit `client/src/config/api.ts`:
   ```typescript
   return 'https://YOUR-ACTUAL-SERVICE-NAME.onrender.com';
   ```

3. **Redeploy frontend** on Vercel

### 5. Test After Deployment

Once deployed, test these URLs in your browser:

1. **Basic API**: `https://predictit-api.onrender.com`
   - Should return: `{"message": "PredictIT API is running", ...}`

2. **Health Check**: `https://predictit-api.onrender.com/health`
   - Should return: `{"status": "healthy", ...}`

3. **CORS Test**: `https://predictit-api.onrender.com/cors-test`
   - Should return: `{"message": "CORS is working", ...}`

## 🔧 Quick Fixes

### If Build Keeps Failing
```yaml
# Check your render.yaml is correct:
services:
  - type: web
    name: predictit-api
    env: python
    buildCommand: "cd server && pip install -r requirements.txt"
    startCommand: "cd server && python start.py"
```

### If Service Won't Start
```python
# Check server/start.py has correct port binding:
port = int(os.getenv('PORT', 10000))  # Render uses PORT env var
```

### If CORS Still Fails After Deployment
```python
# Check server/main.py has your domain:
allow_origins=[
    "https://predict-it-zeta.vercel.app",  # Your domain
    # ... other domains
]
```

## 🎯 Expected Timeline

- **New Deployment**: 5-10 minutes
- **Redeploy**: 2-5 minutes
- **Free Tier**: May take longer, services sleep after inactivity

## 🆘 Still Having Issues?

1. **Use the Connection Test** in your frontend
2. **Try different service names** with the custom URL tester
3. **Check Render service logs** for specific error messages
4. **Verify all files are committed** to your GitHub repository

Once the service is deployed and running, the CORS error will be resolved!