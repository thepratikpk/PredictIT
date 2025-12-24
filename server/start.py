#!/usr/bin/env python3
"""
Startup script for PredictIT API server on Render
"""

import sys
import os
import traceback

def check_dependencies():
    """Check if all required dependencies are available"""
    required_packages = [
        'fastapi',
        'uvicorn', 
        'pandas',
        'sklearn',
        'numpy',
        'pydantic'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✓ {package} - OK")
        except ImportError:
            missing_packages.append(package)
            print(f"✗ {package} - MISSING")
    
    return missing_packages

def start_server():
    """Start the FastAPI server"""
    try:
        print("🚀 Starting PredictIT API server on Render...")
        
        # Import and run the app
        from main import app
        import uvicorn
        
        port = int(os.getenv('PORT', 10000))  # Render uses port 10000 by default
        
        print(f"🌐 Server starting on port {port}")
        
        uvicorn.run(
            app, 
            host="0.0.0.0", 
            port=port,
            workers=1,
            log_level="info"
        )
        
    except Exception as e:
        print(f"❌ Failed to start server: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("🔧 PredictIT API Starting on Render")
    print("=" * 40)
    
    # Check dependencies
    print("📦 Checking dependencies...")
    missing = check_dependencies()
    
    if missing:
        print(f"❌ Missing packages: {missing}")
        sys.exit(1)
    
    print("✅ All dependencies available")
    
    # Start server
    start_server()