from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score, confusion_matrix
import os
import uuid
import pickle
import requests
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

# Import database and cloudinary modules
try:
    from database import DatabaseManager, CloudinaryManager, MONGODB_AVAILABLE
    from auth import get_current_user_optional, get_current_user
    AUTH_AVAILABLE = True
    print("✓ Database and Cloudinary modules loaded")
except ImportError as e:
    print(f"⚠️  Database modules not available: {e}")
    AUTH_AVAILABLE = False
    MONGODB_AVAILABLE = False

app = FastAPI(
    title="PredictIT API", 
    version="1.0.0",
    description="machine learning pipeline builder",
    docs_url="/docs" if os.getenv("ENVIRONMENT") != "production" else None,
    redoc_url="/redoc" if os.getenv("ENVIRONMENT") != "production" else None
)

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

# Simple in-memory storage for projects
projects_storage = {}
project_counter = 0

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

class PreprocessRequest(BaseModel):
    session_id: str
    target_column: str
    operation_type: str

class TrainRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    session_id: str
    model_type: str
    split_ratio: float
    target_column: str
    feature_columns: List[str]

class PredictRequest(BaseModel):
    model_config = {"protected_namespaces": ()}
    session_id: str
    feature_values: Dict[str, float]

class PredictResponse(BaseModel):
    prediction: Any
    probability: Optional[List[float]] = None
    status: str
    message: str

class TrainResponse(BaseModel):
    accuracy: float
    confusion_matrix: List[List[int]]
    status: str
    message: str

class ProjectSaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    session_id: Optional[str] = None
    dataset_info: Optional[Dict[str, Any]] = None
    preprocessing_config: Optional[Dict[str, Any]] = None
    split_config: Optional[Dict[str, Any]] = None
    model_config: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str
    created_at: str
    updated_at: str
    dataset_info: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserRegister(BaseModel):
    name: str
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

# Root endpoint
@app.get("/")
async def root():
    return {"message": "PredictIT API is running", "version": "1.0"}

# Upload endpoint
@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    """Upload CSV/Excel file and return metadata"""
    try:
        session_id = str(uuid.uuid4())
        
        if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
            raise HTTPException(status_code=400, detail="Only CSV and Excel files are supported")
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file.file)
        else:
            df = pd.read_excel(file.file)
        
        local_file_path = os.path.join(TEMP_DIR, f"{session_id}.csv")
        df.to_csv(local_file_path, index=False)
        
        columns = df.columns.tolist()
        row_count = len(df)
        data_types = {col: str(df[col].dtype) for col in df.columns}
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_columns = df.select_dtypes(include=['object', 'category']).columns.tolist()
        
        potentially_numeric = []
        for col in categorical_columns:
            try:
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
            potentially_numeric=potentially_numeric
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

# Preprocessing endpoint
@app.post("/preprocess")
async def preprocess_data(request: PreprocessRequest):
    """Preprocess the uploaded data"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        
        df = pd.read_csv(file_path)
        
        if request.operation_type == "StandardScaler":
            scaler = StandardScaler()
        elif request.operation_type == "MinMaxScaler":
            scaler = MinMaxScaler()
        else:
            raise HTTPException(status_code=400, detail="Invalid operation type")
        
        numeric_columns = df.select_dtypes(include=[np.number]).columns.tolist()
        if request.target_column in numeric_columns:
            numeric_columns.remove(request.target_column)
        
        if not numeric_columns:
            raise HTTPException(status_code=400, detail="No numeric columns found for preprocessing")
        
        df_processed = df.copy()
        df_processed[numeric_columns] = scaler.fit_transform(df[numeric_columns])
        
        processed_file_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        df_processed.to_csv(processed_file_path, index=False)
        
        scaler_path = os.path.join(TEMP_DIR, f"{request.session_id}_scaler.pkl")
        with open(scaler_path, 'wb') as f:
            pickle.dump(scaler, f)
        
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
        processed_file_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        original_file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        
        if os.path.exists(processed_file_path):
            df = pd.read_csv(processed_file_path)
        elif os.path.exists(original_file_path):
            df = pd.read_csv(original_file_path)
        else:
            raise HTTPException(status_code=404, detail="Session data not found")
        
        if request.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{request.target_column}' not found")
        
        if request.feature_columns:
            feature_columns = request.feature_columns
        else:
            feature_columns = [col for col in df.columns if col != request.target_column]
        
        missing_features = [col for col in feature_columns if col not in df.columns]
        if missing_features:
            raise HTTPException(status_code=400, detail=f"Feature columns not found: {missing_features}")
        
        X = df[feature_columns]
        y = df[request.target_column]
        
        target_mapping = None
        if y.dtype == 'object' or y.dtype.name == 'category':
            unique_values = y.unique()
            target_mapping = {val: idx for idx, val in enumerate(unique_values)}
            y = y.map(target_mapping)
        
        categorical_features = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_features) > 0:
            X = pd.get_dummies(X, columns=categorical_features, drop_first=True)
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=(1 - request.split_ratio), random_state=42
        )
        
        if request.model_type == "LogisticRegression":
            model = LogisticRegression(random_state=42, max_iter=1000)
        elif request.model_type == "DecisionTree":
            model = DecisionTreeClassifier(random_state=42)
        else:
            raise HTTPException(status_code=400, detail="Invalid model type")
        
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        
        accuracy = accuracy_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred)
        
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
        model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
        
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="Trained model not found")
        
        with open(model_path, 'rb') as f:
            model_info = pickle.load(f)
        
        model = model_info["model"]
        feature_columns = model_info["feature_columns"]
        target_mapping = model_info.get("target_mapping")
        
        input_df = pd.DataFrame([request.feature_values])
        
        original_file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if os.path.exists(original_file_path):
            original_df = pd.read_csv(original_file_path)
            categorical_features = original_df.select_dtypes(include=['object', 'category']).columns
            
            if len(categorical_features) > 0:
                for col in categorical_features:
                    if col in input_df.columns:
                        input_df = pd.get_dummies(input_df, columns=[col], drop_first=True)
        
        for col in feature_columns:
            if col not in input_df.columns:
                input_df[col] = 0
        
        input_df = input_df[feature_columns]
        
        prediction = model.predict(input_df)[0]
        
        probabilities = None
        if hasattr(model, "predict_proba"):
            probabilities = model.predict_proba(input_df)[0].tolist()
        
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
        temp_files = [
            os.path.join(TEMP_DIR, f"{session_id}.csv"),
            os.path.join(TEMP_DIR, f"{session_id}_processed.csv"),
            os.path.join(TEMP_DIR, f"{session_id}_preprocessing_info.pkl"),
            os.path.join(TEMP_DIR, f"{session_id}_scaler.pkl"),
            os.path.join(TEMP_DIR, f"{session_id}_model.pkl")
        ]
        
        for temp_file in temp_files:
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        return {"status": "success", "message": "Pipeline reset successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

# Project Management endpoints
@app.post("/projects/save")
async def save_project(
    project_data: ProjectSaveRequest,
    current_user: dict = Depends(get_current_user_optional)
):
    """Save current pipeline as a project with Cloudinary integration"""
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
                        user_id = current_user.get("user_id", "guest") if current_user else "guest"
                        print(f"📤 Uploading file to Cloudinary for project: {project_data.name}")
                        
                        # Upload to Cloudinary in 'datasets' folder with user-specific naming
                        cloudinary_result = CloudinaryManager.upload_file(
                            local_file_path, 
                            folder="datasets",
                            public_id=f"project_{project_data.session_id}_{user_id}_{int(datetime.now().timestamp())}",
                            resource_type="raw"
                        )
                        file_url = cloudinary_result.get('url')
                        file_public_id = cloudinary_result.get('public_id')
                        
                        print(f"✅ File uploaded to Cloudinary: {file_url}")
                        
                    else:
                        print("⚠️  Cloudinary not available - saving project without cloud storage")
                        
                except Exception as e:
                    print(f"⚠️  Failed to upload file to Cloudinary: {e}")
                    # Continue saving project even if Cloudinary upload fails
            else:
                print(f"⚠️  Local file not found for session: {project_data.session_id}")
        
        # Save to database if available, otherwise use in-memory storage
        if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user:
            user_id = current_user["user_id"]
            
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
            
            project_id = DatabaseManager.save_project(user_id, project_info)
            
            # Save file metadata to database
            if file_url:
                file_metadata = {
                    "filename": f"project_{project_data.session_id}",
                    "original_filename": project_data.dataset_info.get('filename', 'dataset.csv') if project_data.dataset_info else 'dataset.csv',
                    "file_url": file_url,
                    "public_id": file_public_id,
                    "file_size": os.path.getsize(os.path.join(TEMP_DIR, f"{project_data.session_id}.csv")) if os.path.exists(os.path.join(TEMP_DIR, f"{project_data.session_id}.csv")) else 0,
                    "file_type": "csv",
                    "session_id": project_data.session_id
                }
                DatabaseManager.save_file_metadata(user_id, file_metadata)
        else:
            # Fallback to in-memory storage for guest mode
            global project_counter
            project_counter += 1
            project_id = str(project_counter)
            
            user_id = current_user.get("user_id", "guest") if current_user else "guest"
            
            project = {
                "id": project_id,
                "name": project_data.name,
                "description": project_data.description or "",
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "dataset_info": project_data.dataset_info,
                "preprocessing_config": project_data.preprocessing_config,
                "split_config": project_data.split_config,
                "model_config": project_data.model_config,
                "results": project_data.results,
                "session_id": project_data.session_id,
                "file_url": file_url,
                "file_public_id": file_public_id,
                "user_id": user_id
            }
            
            # Store by user_id to separate projects
            if user_id not in projects_storage:
                projects_storage[user_id] = {}
            projects_storage[user_id][project_id] = project
        
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

@app.get("/projects")
async def get_user_projects(current_user: dict = Depends(get_current_user_optional)):
    """Get user's saved projects"""
    try:
        user_id = current_user.get("user_id", "guest") if current_user else "guest"
        
        if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user and user_id != "guest":
            # Get from database
            projects = DatabaseManager.get_user_projects(user_id)
            
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
        else:
            # Get from in-memory storage
            user_projects = projects_storage.get(user_id, {})
            projects = []
            for project in user_projects.values():
                projects.append(ProjectResponse(
                    id=project["id"],
                    name=project["name"],
                    description=project["description"],
                    created_at=project["created_at"],
                    updated_at=project["updated_at"],
                    dataset_info=project.get("dataset_info"),
                    results=project.get("results")
                ))
            return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get projects: {str(e)}")

@app.get("/projects/{project_id}")
async def get_project(
    project_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Get a specific project and restore its file from Cloudinary"""
    try:
        user_id = current_user.get("user_id", "guest") if current_user else "guest"
        
        if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user and user_id != "guest":
            # Get from database
            project = DatabaseManager.get_project_by_id(project_id, user_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
        else:
            # Get from in-memory storage
            user_projects = projects_storage.get(user_id, {})
            if project_id not in user_projects:
                raise HTTPException(status_code=404, detail="Project not found")
            project = user_projects[project_id]
        
        # If project has a Cloudinary file URL, download it to temp for processing
        if project.get("file_url") and project.get("session_id"):
            try:
                print(f"📥 Downloading file from Cloudinary for project: {project['name']}")
                
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
                        
                else:
                    print(f"⚠️  Failed to download file from Cloudinary: HTTP {response.status_code}")
                    
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
    current_user: dict = Depends(get_current_user_optional)
):
    """Delete a project and its associated Cloudinary files"""
    try:
        user_id = current_user.get("user_id", "guest") if current_user else "guest"
        
        # Get project details first to get file info
        if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user and user_id != "guest":
            project = DatabaseManager.get_project_by_id(project_id, user_id)
            if not project:
                raise HTTPException(status_code=404, detail="Project not found")
        else:
            user_projects = projects_storage.get(user_id, {})
            if project_id not in user_projects:
                raise HTTPException(status_code=404, detail="Project not found")
            project = user_projects[project_id]
        
        # Delete file from Cloudinary if it exists
        cloudinary_deleted = False
        if project.get("file_public_id"):
            try:
                from database import CLOUDINARY_AVAILABLE
                if CLOUDINARY_AVAILABLE:
                    success = CloudinaryManager.delete_file(project["file_public_id"], resource_type="raw")
                    if success:
                        print(f"✅ Deleted file from Cloudinary: {project['file_public_id']}")
                        cloudinary_deleted = True
                    else:
                        print(f"⚠️  Failed to delete file from Cloudinary: {project['file_public_id']}")
            except Exception as e:
                print(f"⚠️  Error deleting Cloudinary file: {e}")
        
        # Delete local temp files if they exist
        temp_files_cleaned = False
        if project.get("session_id"):
            cleanup_temp_files(project["session_id"])
            temp_files_cleaned = True
        
        # Delete project from database or memory
        if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user and user_id != "guest":
            success = DatabaseManager.delete_project(project_id, user_id)
            if not success:
                raise HTTPException(status_code=404, detail="Project not found")
        else:
            del projects_storage[user_id][project_id]
        
        return {
            "message": "Project and associated files deleted successfully",
            "cloudinary_deleted": cloudinary_deleted,
            "temp_files_cleaned": temp_files_cleaned
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

# Helper function for cleanup
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

# Authentication endpoints (with proper auth integration)
@app.post("/auth/login")
async def login_user(user_data: UserLogin):
    """Login endpoint"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        try:
            from auth import verify_password, create_access_token
            
            # Get user by email
            user = DatabaseManager.get_user_by_email(user_data.email)
            if not user or not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Invalid email or password")
            
            # Create access token
            access_token = create_access_token(
                data={"sub": user["_id"], "email": user["email"]}
            )
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user["_id"],
                    "name": user["name"],
                    "email": user["email"]
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")
    else:
        # Guest mode fallback
        return {
            "access_token": "guest_token",
            "token_type": "bearer",
            "user": {
                "id": "guest",
                "name": "Guest User",
                "email": user_data.email
            }
        }

@app.post("/auth/register")
async def register_user(user_data: UserRegister):
    """Register endpoint"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        try:
            from auth import get_password_hash, create_access_token
            
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
            
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "name": user_data.name,
                    "email": user_data.email
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")
    else:
        # Guest mode fallback
        return {
            "access_token": "guest_token", 
            "token_type": "bearer",
            "user": {
                "id": "guest",
                "name": user_data.name,
                "email": user_data.email
            }
        }

@app.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user_optional)):
    """Get current user info"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE and current_user and current_user.get("user_id") != "guest":
        user = DatabaseManager.get_user_by_id(current_user["user_id"])
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user["_id"],
            "name": user["name"],
            "email": user["email"]
        }
    else:
        return {
            "id": "guest",
            "name": "Guest User", 
            "email": "guest@example.com"
        }

@app.get("/auth/status")
async def auth_status():
    """Get authentication service status"""
    return {
        "auth_available": AUTH_AVAILABLE and MONGODB_AVAILABLE,
        "mongodb_available": MONGODB_AVAILABLE,
        "message": "Authentication ready" if AUTH_AVAILABLE and MONGODB_AVAILABLE else "Running in guest mode"
    }

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)