from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import requests
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, confusion_matrix
import os
import uuid
import json
import time
import threading
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import tempfile
import shutil
from datetime import timedelta

# Import our custom modules (make them optional)
try:
    from auth import (
        get_password_hash, verify_password, create_access_token, 
        get_current_user, get_current_user_optional
    )
    from database import DatabaseManager, CloudinaryManager, MONGODB_AVAILABLE
    AUTH_AVAILABLE = True
except ImportError as e:
    print(f"⚠️  Authentication modules not available: {e}")
    AUTH_AVAILABLE = False
    MONGODB_AVAILABLE = False

app = FastAPI(title="No-Code ML Pipeline API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Create temp directory
TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

# Cleanup functions
def cleanup_temp_files(session_id: str):
    """Clean up temporary files for a session"""
    temp_files = [
        os.path.join(TEMP_DIR, f"{session_id}.csv"),
        os.path.join(TEMP_DIR, f"{session_id}_processed.csv"),
        os.path.join(TEMP_DIR, f"{session_id}_preprocessing_info.pkl"),
        os.path.join(TEMP_DIR, f"{session_id}_scaler.pkl"),
        os.path.join(TEMP_DIR, f"{session_id}_model.pkl")
    ]
    
    for temp_file in temp_files:
        if os.path.exists(temp_file):
            try:
                os.remove(temp_file)
                print(f"🗑️  Cleaned up temp file: {os.path.basename(temp_file)}")
            except Exception as e:
                print(f"⚠️  Failed to delete temp file {temp_file}: {e}")

def cleanup_old_temp_files():
    """Clean up temporary files older than 24 hours"""
    try:
        current_time = time.time()
        cutoff_time = current_time - (24 * 60 * 60)  # 24 hours ago
        
        for filename in os.listdir(TEMP_DIR):
            file_path = os.path.join(TEMP_DIR, filename)
            if os.path.isfile(file_path):
                file_mtime = os.path.getmtime(file_path)
                if file_mtime < cutoff_time:
                    try:
                        os.remove(file_path)
                        print(f"🗑️  Cleaned up old temp file: {filename}")
                    except Exception as e:
                        print(f"⚠️  Failed to delete old temp file {filename}: {e}")
    except Exception as e:
        print(f"⚠️  Error during temp file cleanup: {e}")

# Run cleanup on startup
cleanup_old_temp_files()

# Schedule periodic cleanup (every 6 hours)
def periodic_cleanup():
    while True:
        time.sleep(6 * 60 * 60)  # 6 hours
        print("🧹 Running periodic cleanup...")
        cleanup_old_temp_files()

# Start cleanup thread
cleanup_thread = threading.Thread(target=periodic_cleanup, daemon=True)
cleanup_thread.start()
print("🧹 Periodic cleanup scheduler started")

# Pydantic models
class UploadResponse(BaseModel):
    session_id: str
    columns: List[str]
    row_count: int
    data_types: Dict[str, str]
    sample_data: List[Dict[str, Any]]
    numeric_columns: List[str]
    categorical_columns: List[str]
    potentially_numeric: List[str]
    cloudinary_url: Optional[str] = None
    filename: Optional[str] = None

class PreprocessRequest(BaseModel):
    session_id: str
    target_column: str
    operation_type: str  # "StandardScaler" or "MinMaxScaler"

class TrainRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    session_id: str
    model_type: str  # "LogisticRegression" or "DecisionTree"
    split_ratio: float
    target_column: str
    feature_columns: List[str]
    preprocessing_steps: Optional[List[str]] = []

class PredictRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    
    session_id: str
    feature_values: Dict[str, float]  # {"age": 25, "income": 50000}

class PredictResponse(BaseModel):
    prediction: Any  # The predicted value
    probability: Optional[List[float]] = None  # Prediction probabilities if available
    status: str
    message: str

class TrainResponse(BaseModel):
    accuracy: float
    confusion_matrix: List[List[int]]
    status: str
    message: str

# Authentication Models
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProjectSave(BaseModel):
    name: str
    description: Optional[str] = ""

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    updated_at: str
    dataset_info: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None

@app.get("/")
async def root():
    return {"message": "No-Code ML Pipeline API is running", "version": "2.0", "features": ["enhanced_error_handling", "fuel_type_support"]}

@app.get("/debug")
async def debug_info():
    from database import CLOUDINARY_AVAILABLE
    return {
        "status": "Server is running updated code",
        "supported_targets": ["yes/no", "true/false", "positive/negative", "fuel_types", "numeric"],
        "enhanced_features": ["better_error_messages", "categorical_conversion", "fuel_type_mapping"],
        "mongodb_available": MONGODB_AVAILABLE,
        "cloudinary_available": CLOUDINARY_AVAILABLE,
        "auth_available": AUTH_AVAILABLE
    }

# Authentication Endpoints (only if database is available)
if AUTH_AVAILABLE and MONGODB_AVAILABLE:
    @app.post("/auth/register", response_model=TokenResponse)
    async def register_user(user_data: UserRegister):
        """Register a new user"""
        try:
            # Check if user already exists
            existing_user = DatabaseManager.get_user_by_email(user_data.email)
            if existing_user:
                raise HTTPException(status_code=400, detail="Email already registered")
            
            # Hash password and create user
            password_hash = get_password_hash(user_data.password)
            user_id = DatabaseManager.create_user(
                email=user_data.email,
                password_hash=password_hash,
                name=user_data.name
            )
            
            # Create access token
            access_token = create_access_token(
                data={"sub": user_id, "email": user_data.email}
            )
            
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse(
                    id=user_id,
                    name=user_data.name,
                    email=user_data.email
                )
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

    @app.post("/auth/login", response_model=TokenResponse)
    async def login_user(user_data: UserLogin):
        """Login user"""
        try:
            # Get user by email
            user = DatabaseManager.get_user_by_email(user_data.email)
            if not user or not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Create access token
            access_token = create_access_token(
                data={"sub": user["_id"], "email": user["email"]}
            )
            
            return TokenResponse(
                access_token=access_token,
                token_type="bearer",
                user=UserResponse(
                    id=user["_id"],
                    name=user["name"],
                    email=user["email"]
                )
            )
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
else:
    @app.post("/auth/register")
    async def register_user_unavailable():
        raise HTTPException(status_code=503, detail="Authentication service unavailable. Please configure MongoDB.")
    
    @app.post("/auth/login")
    async def login_user_unavailable():
        raise HTTPException(status_code=503, detail="Authentication service unavailable. Please configure MongoDB.")

@app.get("/auth/status")
async def auth_status():
    """Get authentication service status"""
    return {
        "auth_available": AUTH_AVAILABLE and MONGODB_AVAILABLE,
        "mongodb_available": MONGODB_AVAILABLE,
        "message": "Authentication ready" if AUTH_AVAILABLE and MONGODB_AVAILABLE else "Running in guest mode"
    }

# Auth endpoints that require authentication
if AUTH_AVAILABLE and MONGODB_AVAILABLE:
    @app.get("/auth/me", response_model=UserResponse)
    async def get_current_user_info(current_user: dict = Depends(get_current_user)):
        """Get current user information"""
        user = DatabaseManager.get_user_by_id(current_user["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse(
            id=user["_id"],
            name=user["name"],
            email=user["email"]
        )

# Project Management Endpoints
class ProjectSaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    session_id: Optional[str] = None
    dataset_info: Optional[Dict[str, Any]] = None
    preprocessing_config: Optional[Dict[str, Any]] = None
    split_config: Optional[Dict[str, Any]] = None
    model_config: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None

@app.post("/projects/save")
async def save_project(
    project_data: ProjectSaveRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """Save current pipeline as a project"""
    if not (AUTH_AVAILABLE and MONGODB_AVAILABLE):
        raise HTTPException(status_code=503, detail="Project saving requires authentication service")
    
    try:
        file_url = None
        file_public_id = None
        
        # Upload file to Cloudinary if session_id is provided
        if project_data.session_id:
            local_file_path = os.path.join(TEMP_DIR, f"{project_data.session_id}.csv")
            
            if os.path.exists(local_file_path):
                try:
                    from database import CLOUDINARY_AVAILABLE
                    
                    if CLOUDINARY_AVAILABLE:
                        print(f"📤 Uploading file to Cloudinary for project: {project_data.name}")
                        
                        # Upload to Cloudinary in 'datasets' folder
                        cloudinary_result = CloudinaryManager.upload_file(
                            local_file_path, 
                            folder="datasets",
                            public_id=f"project_{project_data.session_id}_{current_user['user_id']}",
                            resource_type="raw"
                        )
                        file_url = cloudinary_result.get('url')
                        file_public_id = cloudinary_result.get('public_id')
                        
                        print(f"✅ File uploaded to Cloudinary: {file_url}")
                        
                        # Save file metadata to database
                        file_metadata = {
                            "filename": f"project_{project_data.session_id}",
                            "original_filename": project_data.dataset_info.get('filename', 'dataset.csv') if project_data.dataset_info else 'dataset.csv',
                            "file_url": file_url,
                            "public_id": file_public_id,
                            "file_size": os.path.getsize(local_file_path),
                            "file_type": "csv",
                            "session_id": project_data.session_id
                        }
                        DatabaseManager.save_file_metadata(current_user["user_id"], file_metadata)
                        
                    else:
                        print("⚠️  Cloudinary not available - saving project without cloud storage")
                        
                except Exception as e:
                    print(f"⚠️  Failed to upload file to Cloudinary: {e}")
                    # Continue saving project even if Cloudinary upload fails
            else:
                print(f"⚠️  Local file not found for session: {project_data.session_id}")
        
        project_info = {
            "name": project_data.name,
            "description": project_data.description,
            "dataset_info": project_data.dataset_info,
            "preprocessing_config": project_data.preprocessing_config,
            "split_config": project_data.split_config,
            "model_config": project_data.model_config,
            "results": project_data.results,
            "session_id": project_data.session_id,
            "file_url": file_url,
            "file_public_id": file_public_id
        }
        
        project_id = DatabaseManager.save_project(current_user["user_id"], project_info)
        
        # Clean up temporary files after successful save
        if project_data.session_id:
            cleanup_temp_files(project_data.session_id)
        
        return {
            "project_id": project_id, 
            "message": "Pipeline saved successfully",
            "file_uploaded": file_url is not None,
            "cloudinary_url": file_url
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save pipeline: {str(e)}")

@app.get("/projects", response_model=List[ProjectResponse])
async def get_user_projects(current_user: dict = Depends(get_current_user)):
    """Get user's saved projects"""
    try:
        projects = DatabaseManager.get_user_projects(current_user["user_id"])
        
        return [
            ProjectResponse(
                id=project["_id"],
                name=project["name"],
                description=project.get("description", ""),
                created_at=project["created_at"].isoformat(),
                updated_at=project["updated_at"].isoformat(),
                dataset_info=project.get("dataset_info"),
                results=project.get("results")
            )
            for project in projects
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get projects: {str(e)}")

@app.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific project and restore its file from Cloudinary if needed"""
    try:
        project = DatabaseManager.get_project_by_id(project_id, current_user["user_id"])
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # If project has a Cloudinary file URL, download it to temp for processing
        if project.get("file_url") and project.get("session_id"):
            try:
                import requests
                
                # Download file from Cloudinary
                response = requests.get(project["file_url"])
                if response.status_code == 200:
                    # Save to temp directory with original session ID
                    temp_file_path = os.path.join(TEMP_DIR, f"{project['session_id']}.csv")
                    with open(temp_file_path, 'wb') as f:
                        f.write(response.content)
                    
                    print(f"✅ Downloaded file from Cloudinary for project: {project['name']}")
                    
                    # Also create processed version if preprocessing was done
                    if project.get("preprocessing_config"):
                        processed_path = os.path.join(TEMP_DIR, f"{project['session_id']}_processed.csv")
                        # Copy the file as processed (since it was already processed when saved)
                        with open(processed_path, 'wb') as f:
                            f.write(response.content)
                        print(f"✅ Created processed file for session: {project['session_id']}")
                        
            except Exception as e:
                print(f"⚠️  Failed to download file from Cloudinary: {e}")
        
        return project
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get project: {str(e)}")

@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a project and its associated files"""
    try:
        # Get project details first to get file info
        project = DatabaseManager.get_project_by_id(project_id, current_user["user_id"])
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Delete file from Cloudinary if it exists
        if project.get("file_public_id"):
            try:
                from database import CLOUDINARY_AVAILABLE
                if CLOUDINARY_AVAILABLE:
                    success = CloudinaryManager.delete_file(project["file_public_id"], resource_type="raw")
                    if success:
                        print(f"✅ Deleted file from Cloudinary: {project['file_public_id']}")
                    else:
                        print(f"⚠️  Failed to delete file from Cloudinary: {project['file_public_id']}")
            except Exception as e:
                print(f"⚠️  Error deleting Cloudinary file: {e}")
        
        # Delete local temp file if it exists
        if project.get("session_id"):
            cleanup_temp_files(project["session_id"])
        
        # Delete project from database
        success = DatabaseManager.delete_project(project_id, current_user["user_id"])
        if not success:
            raise HTTPException(status_code=404, detail="Project not found")
        
        return {
            "message": "Project and associated files deleted successfully",
            "cloudinary_deleted": project.get("file_public_id") is not None,
            "temp_files_cleaned": project.get("session_id") is not None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# Upload endpoint
@app.post("/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user_optional)
):
    """Upload CSV/Excel file and return metadata"""
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Validate file type
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        # Read file based on extension
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
        
        # Save local copy for processing
        local_file_path = os.path.join(TEMP_DIR, f"{session_id}.csv")
        df.to_csv(local_file_path, index=False)
        
        # Don't upload to Cloudinary yet - only when saving pipeline
        cloudinary_url = None
        
        print(f"✓ File saved locally for session: {session_id}")
        
        # Get metadata
        columns = df.columns.tolist()
        row_count = len(df)
        data_types = {col: str(df[col].dtype) for col in df.columns}
        
        # Identify numeric vs categorical columns
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        # Try to identify columns that could be converted to numeric
        potentially_numeric = []
        for col in categorical_columns:
            try:
                # Check if values can be converted to numeric
                test_conversion = pd.to_numeric(df[col].dropna().head(10), errors='coerce')
                if not test_conversion.isnull().all():
                    potentially_numeric.append(col)
            except:
                pass
        
        sample_data = df.head(5).to_dict('records')
        
        return UploadResponse(
            session_id=session_id,
            columns=columns,
            row_count=row_count,
            data_types=data_types,
            sample_data=sample_data,
            numeric_columns=numeric_columns,
            categorical_columns=categorical_columns,
            potentially_numeric=potentially_numeric,
            cloudinary_url=cloudinary_url,
            filename=file.filename
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

# Preprocessing endpoint
@app.post("/preprocess", response_model=dict)
async def preprocess_data(request: PreprocessRequest):
    """Preprocess the uploaded data"""
    try:
        # Load the original data
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        
        df = pd.read_csv(file_path)
        
        # Apply preprocessing based on operation type
        if request.operation_type == "StandardScaler":
            scaler = StandardScaler()
        elif request.operation_type == "MinMaxScaler":
            scaler = MinMaxScaler()
        else:
            raise HTTPException(status_code=400, detail="Invalid operation type")
        
        # Get numeric columns (excluding target)
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        if request.target_column in numeric_columns:
            numeric_columns.remove(request.target_column)
        
        if not numeric_columns:
            raise HTTPException(status_code=400, detail="No numeric columns found for preprocessing")
        
        # Apply scaling to numeric columns
        df_processed = df.copy()
        df_processed[numeric_columns] = scaler.fit_transform(df[numeric_columns])
        
        # Save processed data
        processed_file_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        df_processed.to_csv(processed_file_path, index=False)
        
        # Save scaler for later use
        import pickle
        scaler_path = os.path.join(TEMP_DIR, f"{request.session_id}_scaler.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
        # Save preprocessing info
        preprocessing_info = {
            "operation_type": request.operation_type,
            "numeric_columns": numeric_columns,
            "target_column": request.target_column
        }
        
        preprocessing_info_path = os.path.join(TEMP_DIR, f"{request.session_id}_preprocessing_info.pkl")
        with open(preprocessing_info_path, 'wb') as f:
            pickle.dump(preprocessing_info, f)
        
        return {
            "status": "success",
            "message": f"Data preprocessed using {request.operation_type}",
            "processed_columns": numeric_columns,
            "sample_data": df_processed.head(5).to_dict('records')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {str(e)}")

# Training endpoint
@app.post("/train", response_model=TrainResponse)
async def train_model(request: TrainRequest):
    """Train a machine learning model"""
    try:
        # Load processed data (or original if no preprocessing)
        processed_file_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        original_file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        
        if os.path.exists(processed_file_path):
            df = pd.read_csv(processed_file_path)
        elif os.path.exists(original_file_path):
            df = pd.read_csv(original_file_path)
        else:
            raise HTTPException(status_code=404, detail="Session data not found")
        
        # Prepare features and target
        if request.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{request.target_column}' not found")
        
        # Use specified feature columns or all except target
        if request.feature_columns:
            feature_columns = request.feature_columns
        else:
            feature_columns = [col for col in df.columns if col != request.target_column]
        
        # Validate feature columns exist
        missing_features = [col for col in feature_columns if col not in df.columns]
        if missing_features:
            raise HTTPException(status_code=400, detail=f"Feature columns not found: {missing_features}")
        
        X = df[feature_columns]
        y = df[request.target_column]
        
        # Handle categorical target variables
        target_mapping = None
        if y.dtype == 'object' or y.dtype.name == 'category':
            # Create mapping for categorical targets
            unique_values = y.unique()
            target_mapping = {val: idx for idx, val in enumerate(unique_values)}
            y = y.map(target_mapping)
        
        # Handle categorical features
        categorical_features = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_features) > 0:
            # Simple encoding for categorical features
            X = pd.get_dummies(X, columns=categorical_features, drop_first=True)
        
        # Split the data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=(1 - request.split_ratio), random_state=42
        )
        
        # Initialize model
        if request.model_type == "LogisticRegression":
            model = LogisticRegression(random_state=42, max_iter=1000)
        elif request.model_type == "DecisionTree":
            model = DecisionTreeClassifier(random_state=42)
        else:
            raise HTTPException(status_code=400, detail="Invalid model type")
        
        # Train model
        model.fit(X_train, y_train)
        
        # Make predictions
        y_pred = model.predict(X_test)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred)
        
        # Save model
        import pickle
        model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
        model_info = {
            "model": model,
            "feature_columns": list(X.columns),
            "target_mapping": target_mapping,
            "model_type": request.model_type
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_info, f)
        
        return TrainResponse(
            accuracy=float(accuracy),
            confusion_matrix=cm.tolist(),
            status="success",
            message=f"Model trained successfully with {accuracy:.2%} accuracy"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

# Prediction endpoint
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Make predictions using trained model"""
    try:
        # Load model
        import pickle
        model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Trained model not found")
        
        with open(model_path, 'rb') as f:
            model_info = pickle.load(f)
        
        model = model_info["model"]
        feature_columns = model_info["feature_columns"]
        target_mapping = model_info.get("target_mapping")
        
        # Prepare input data
        input_df = pd.DataFrame([request.feature_values])
        
        # Handle categorical features (get dummies to match training)
        original_file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if os.path.exists(original_file_path):
            original_df = pd.read_csv(original_file_path)
            categorical_features = original_df.select_dtypes(include=['object', 'category']).columns
            
            if len(categorical_features) > 0:
                # Apply same encoding as training
                for col in categorical_features:
                    if col in input_df.columns:
                        input_df = pd.get_dummies(input_df, columns=[col], drop_first=True)
        
        # Ensure all feature columns are present
        for col in feature_columns:
            if col not in input_df.columns:
                input_df[col] = 0
        
        # Reorder columns to match training
        input_df = input_df[feature_columns]
        
        # Make prediction
        prediction = model.predict(input_df)[0]
        
        # Get prediction probabilities if available
        probabilities = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0].tolist()
        
        # Convert back to original labels if target was categorical
        if target_mapping:
            reverse_mapping = {v: k for k, v in target_mapping.items()}
            prediction = reverse_mapping.get(prediction, prediction)
        
        return PredictResponse(
            prediction=prediction,
            probability=probabilities,
            status="success",
            message="Prediction completed successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

# Reset pipeline endpoint
@app.post("/reset/{session_id}")
async def reset_pipeline(session_id: str):
    """Reset pipeline and clean up temporary files"""
    try:
        cleanup_temp_files(session_id)
        return {"status": "success", "message": "Pipeline reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")