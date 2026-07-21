from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV, RandomizedSearchCV
from sklearn.preprocessing import StandardScaler, MinMaxScaler, OneHotEncoder, LabelEncoder
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, GradientBoostingRegressor
from sklearn.neighbors import KNeighborsClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.svm import SVC
from sklearn.cluster import KMeans
from sklearn.metrics import (
    accuracy_score, confusion_matrix, precision_score, recall_score, f1_score,
    classification_report, mean_squared_error, mean_absolute_error, r2_score,
    silhouette_score
)
import os
import uuid
import pickle
import joblib
import requests
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime

# Import database and cloudinary modules
try:
    from database import DatabaseManager, CloudinaryManager, MONGODB_AVAILABLE
    from auth import get_current_user_optional, get_current_user
    AUTH_AVAILABLE = True
    print("[OK] Database and Cloudinary modules loaded")
except ImportError as e:
    print(f"[WARN] Database modules not available: {e}")
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
    allow_origins=[
         "https://predict-it-zeta.vercel.app",
         "http://localhost:5173"  # Your current Vercel domain
    ],
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
    precision: float
    recall: float
    f1_score: float
    class_labels: List[str]
    train_size: int
    test_size: int
    model_type: str
    feature_count: int
    status: str
    message: str
    task_type: Optional[str] = "classification"
    rmse: Optional[float] = None
    mae: Optional[float] = None
    r2: Optional[float] = None
    silhouette: Optional[float] = None
    cluster_labels: Optional[List[int]] = None
    n_clusters: Optional[int] = None


class CleanDataRequest(BaseModel):
    session_id: str
    strategy: str = "mean"  # drop_na, mean, median, most_frequent
    drop_duplicates: bool = True


class EncodeRequest(BaseModel):
    session_id: str
    method: str = "onehot"  # onehot, label
    columns: Optional[List[str]] = None  # None = auto-detect categorical


class EDARequest(BaseModel):
    session_id: str


class BalanceRequest(BaseModel):
    session_id: str
    target_column: str
    method: str = "smote"


class CrossValRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    session_id: str
    model_type: str
    target_column: str
    feature_columns: List[str]
    cv_folds: int = 5


class TuneRequest(BaseModel):
    model_config = ConfigDict(protected_namespaces=())
    session_id: str
    model_type: str
    target_column: str
    feature_columns: List[str]
    search_type: str = "random"  # grid, random


class ExportRequest(BaseModel):
    session_id: str

class ProjectSaveRequest(BaseModel):
    name: str
    description: Optional[str] = ""
    session_id: Optional[str] = None
    dataset_info: Optional[Dict[str, Any]] = None
    preprocessing_config: Optional[Dict[str, Any]] = None
    split_config: Optional[Dict[str, Any]] = None
    model_config: Optional[Dict[str, Any]] = None
    results: Optional[Dict[str, Any]] = None
    nodes: Optional[List[Dict[str, Any]]] = []
    edges: Optional[List[Dict[str, Any]]] = []

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
    return {
        "message": "PredictIT API is running", 
        "version": "1.0",
        "status": "healthy",
        "cors_enabled": True,
        "environment": os.getenv("ENVIRONMENT", "development")
    }

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "PredictIT API"}

# CORS test endpoint
@app.get("/cors-test")
async def cors_test():
    return {"message": "CORS is working", "timestamp": datetime.now().isoformat()}

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
        
        # Determine task type
        is_regression = request.model_type in ["LinearRegression", "GradientBoostingRegressor"]
        is_clustering = request.model_type == "KMeans"

        if request.model_type == "LogisticRegression":
            model = LogisticRegression(random_state=42, max_iter=1000)
        elif request.model_type == "DecisionTree":
            model = DecisionTreeClassifier(random_state=42)
        elif request.model_type == "RandomForest":
            model = RandomForestClassifier(random_state=42, n_estimators=100)
        elif request.model_type == "SVM":
            model = SVC(random_state=42, probability=True)
        elif request.model_type == "LinearRegression":
            model = LinearRegression()
        elif request.model_type == "KNeighborsClassifier":
            model = KNeighborsClassifier(n_neighbors=5)
        elif request.model_type == "GaussianNB":
            model = GaussianNB()
        elif request.model_type == "GradientBoosting":
            model = GradientBoostingClassifier(random_state=42, n_estimators=100)
        elif request.model_type == "GradientBoostingRegressor":
            model = GradientBoostingRegressor(random_state=42, n_estimators=100)
        elif request.model_type == "KMeans":
            n_clusters = 3  # default
            model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        else:
            raise HTTPException(status_code=400, detail=f"Invalid model type: {request.model_type}")
        
        # === Clustering (KMeans) — no split, no target ===
        if is_clustering:
            model.fit(X)
            labels = model.labels_.tolist()
            sil_score = float(silhouette_score(X, model.labels_)) if len(set(model.labels_)) > 1 else 0.0

            model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
            model_info = {"model": model, "feature_columns": list(X.columns), "target_mapping": None, "model_type": request.model_type}
            with open(model_path, 'wb') as f:
                pickle.dump(model_info, f)

            return TrainResponse(
                accuracy=sil_score,
                confusion_matrix=[],
                precision=0, recall=0, f1_score=0,
                class_labels=[],
                train_size=len(X), test_size=0,
                model_type=request.model_type,
                feature_count=len(feature_columns),
                status="success",
                message=f"Clustering complete — silhouette score: {sil_score:.3f}",
                task_type="clustering",
                silhouette=sil_score,
                cluster_labels=labels,
                n_clusters=model.n_clusters
            )

        # === Supervised: split ===
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        # === Regression metrics ===
        if is_regression:
            rmse_val = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            mae_val = float(mean_absolute_error(y_test, y_pred))
            r2_val = float(r2_score(y_test, y_pred))

            model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
            model_info = {"model": model, "feature_columns": list(X.columns), "target_mapping": target_mapping, "model_type": request.model_type}
            with open(model_path, 'wb') as f:
                pickle.dump(model_info, f)

            return TrainResponse(
                accuracy=r2_val,
                confusion_matrix=[],
                precision=0, recall=0, f1_score=0,
                class_labels=[],
                train_size=len(X_train), test_size=len(X_test),
                model_type=request.model_type,
                feature_count=len(feature_columns),
                status="success",
                message=f"Regression complete — R²: {r2_val:.3f}, RMSE: {rmse_val:.3f}",
                task_type="regression",
                rmse=rmse_val, mae=mae_val, r2=r2_val
            )

        # === Classification metrics ===
        accuracy = accuracy_score(y_test, y_pred)
        cm = confusion_matrix(y_test, y_pred)
        
        # Handle binary vs multiclass
        avg_method = 'binary' if len(np.unique(y)) == 2 else 'weighted'
        prec = precision_score(y_test, y_pred, average=avg_method, zero_division=0)
        rec = recall_score(y_test, y_pred, average=avg_method, zero_division=0)
        f1 = f1_score(y_test, y_pred, average=avg_method, zero_division=0)
        
        # Get class labels
        if target_mapping:
            class_labels = list(target_mapping.keys())
        else:
            class_labels = [str(c) for c in sorted(y.unique())]
        
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
            precision=float(prec),
            recall=float(rec),
            f1_score=float(f1),
            class_labels=class_labels,
            train_size=len(X_train),
            test_size=len(X_test),
            model_type=request.model_type,
            feature_count=len(feature_columns),
            status="success",
            message=f"Model trained successfully with {accuracy:.2%} accuracy",
            task_type="classification"
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
                        print(f"[UPLOAD] Uploading file to Cloudinary for project: {project_data.name}")
                        
                        # Upload to Cloudinary in 'datasets' folder with user-specific naming
                        cloudinary_result = CloudinaryManager.upload_file(
                            local_file_path, 
                            folder="datasets",
                            public_id=f"project_{project_data.session_id}_{user_id}_{int(datetime.now().timestamp())}",
                            resource_type="raw"
                        )
                        file_url = cloudinary_result.get('url')
                        file_public_id = cloudinary_result.get('public_id')
                        
                        print(f"[OK] File uploaded to Cloudinary: {file_url}")
                        
                    else:
                        print("[WARN] Cloudinary not available - saving project without cloud storage")
                        
                except Exception as e:
                    print(f"[WARN] Failed to upload file to Cloudinary: {e}")
                    # Continue saving project even if Cloudinary upload fails
            else:
                print(f"[WARN] Local file not found for session: {project_data.session_id}")
        
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
                print(f"[DOWNLOAD] Downloading file from Cloudinary for project: {project['name']}")
                
                # Download file from Cloudinary
                response = requests.get(project["file_url"])
                if response.status_code == 200:
                    # Save to temp directory with original session ID
                    temp_file_path = os.path.join(TEMP_DIR, f"{project['session_id']}.csv")
                    with open(temp_file_path, 'wb') as f:
                        f.write(response.content)
                    
                    print(f"[OK] Downloaded file from Cloudinary for project: {project['name']}")
                    
                    # Also create processed version if preprocessing was done
                    if project.get("preprocessing_config"):
                        processed_path = os.path.join(TEMP_DIR, f"{project['session_id']}_processed.csv")
                        # Copy the file as processed (since it was already processed when saved)
                        with open(processed_path, 'wb') as f:
                            f.write(response.content)
                        print(f"[OK] Created processed file for session: {project['session_id']}")
                        
                else:
                    print(f"[WARN] Failed to download file from Cloudinary: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"[WARN] Failed to download file from Cloudinary: {e}")
        
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
                        print(f"[OK] Deleted file from Cloudinary: {project['file_public_id']}")
                        cloudinary_deleted = True
                    else:
                        print(f"[WARN] Failed to delete file from Cloudinary: {project['file_public_id']}")
            except Exception as e:
                print(f"[WARN] Error deleting Cloudinary file: {e}")
        
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
                print(f"[DEL] Cleaned up temp file: {os.path.basename(temp_file)}")
            except Exception as e:
                print(f"[WARN] Failed to delete temp file {temp_file}: {e}")

# Authentication endpoints (with proper auth integration)
@app.post("/auth/login")
async def login_user(user_data: UserLogin):
    """Login endpoint with comprehensive error handling"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        try:
            from auth import verify_password, create_access_token
            
            # Validate input
            if not user_data.email or not user_data.password:
                raise HTTPException(status_code=400, detail="Email and password are required")
            
            # Check email format
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, user_data.email):
                raise HTTPException(status_code=400, detail="Invalid email format")
            
            # Get user by email
            user = DatabaseManager.get_user_by_email(user_data.email)
            if not user:
                raise HTTPException(status_code=404, detail="Account not found. Please check your email or sign up for a new account.")
            
            # Verify password
            if not verify_password(user_data.password, user["password_hash"]):
                raise HTTPException(status_code=401, detail="Incorrect password. Please try again or reset your password.")
            
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
            print(f"Login error: {str(e)}")
            raise HTTPException(status_code=500, detail="Login service temporarily unavailable. Please try again later.")
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
    """Register endpoint with comprehensive validation"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        try:
            from auth import get_password_hash, create_access_token
            
            # Validate input
            if not user_data.email or not user_data.password or not user_data.name:
                raise HTTPException(status_code=400, detail="Name, email, and password are required")
            
            # Validate name
            if len(user_data.name.strip()) < 2:
                raise HTTPException(status_code=400, detail="Name must be at least 2 characters long")
            
            # Check email format
            import re
            email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(email_pattern, user_data.email):
                raise HTTPException(status_code=400, detail="Invalid email format. Please enter a valid email address.")
            
            # Validate password strength
            if len(user_data.password) < 6:
                raise HTTPException(status_code=400, detail="Password must be at least 6 characters long")
            
            # Check if user already exists
            existing_user = DatabaseManager.get_user_by_email(user_data.email)
            if existing_user:
                raise HTTPException(status_code=409, detail="An account with this email already exists. Please sign in instead.")
            
            # Hash password and create user
            password_hash = get_password_hash(user_data.password)
            user_id = DatabaseManager.create_user(
                email=user_data.email,
                password_hash=password_hash,
                name=user_data.name.strip()
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
                    "name": user_data.name.strip(),
                    "email": user_data.email
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            print(f"Registration error: {str(e)}")
            raise HTTPException(status_code=500, detail="Registration service temporarily unavailable. Please try again later.")
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

# ============================================================
# New Block Endpoints
# ============================================================

@app.post("/clean")
async def clean_data(request: CleanDataRequest):
    """Clean Data block — fill/drop missing values, remove duplicates"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(file_path)
        original_shape = df.shape

        if request.drop_duplicates:
            df = df.drop_duplicates()

        if request.strategy == "drop_na":
            df = df.dropna()
        elif request.strategy in ["mean", "median", "most_frequent"]:
            numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
            categorical_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
            if numeric_cols:
                num_strategy = request.strategy if request.strategy != "most_frequent" else "mean"
                imputer = SimpleImputer(strategy=num_strategy)
                df[numeric_cols] = imputer.fit_transform(df[numeric_cols])
            if categorical_cols:
                cat_imputer = SimpleImputer(strategy="most_frequent")
                df[categorical_cols] = cat_imputer.fit_transform(df[categorical_cols])

        df.to_csv(file_path, index=False)
        return {
            "status": "success",
            "message": f"Cleaned data: {original_shape[0]}→{df.shape[0]} rows",
            "original_rows": original_shape[0],
            "cleaned_rows": df.shape[0],
            "duplicates_removed": original_shape[0] - df.shape[0] if request.drop_duplicates else 0,
            "sample_data": df.head(5).to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")


@app.post("/encode")
async def encode_categories(request: EncodeRequest):
    """Encode Categories block — convert text columns to numeric"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(file_path)

        columns = request.columns or df.select_dtypes(include=['object', 'category']).columns.tolist()
        if not columns:
            return {"status": "success", "message": "No categorical columns to encode", "encoded_columns": []}

        if request.method == "onehot":
            df = pd.get_dummies(df, columns=columns, drop_first=True)
        elif request.method == "label":
            le = LabelEncoder()
            for col in columns:
                if col in df.columns:
                    df[col] = le.fit_transform(df[col].astype(str))

        df.to_csv(file_path, index=False)
        return {
            "status": "success",
            "message": f"Encoded {len(columns)} columns using {request.method}",
            "encoded_columns": columns,
            "new_columns": df.columns.tolist(),
            "sample_data": df.head(5).to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encoding failed: {str(e)}")


@app.post("/eda")
async def explore_data(request: EDARequest):
    """EDA block — return stats, correlations, class distribution"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(file_path)

        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        describe = df[numeric_cols].describe().to_dict() if numeric_cols else {}
        correlation = df[numeric_cols].corr().fillna(0).to_dict() if len(numeric_cols) > 1 else {}
        missing = df.isnull().sum().to_dict()

        # Class distribution for potential target columns
        class_distributions = {}
        for col in df.columns:
            nunique = df[col].nunique()
            if 2 <= nunique <= 20:
                class_distributions[col] = df[col].value_counts().to_dict()

        return {
            "status": "success",
            "row_count": len(df),
            "column_count": len(df.columns),
            "numeric_columns": numeric_cols,
            "categorical_columns": df.select_dtypes(include=['object', 'category']).columns.tolist(),
            "describe": describe,
            "correlation": correlation,
            "missing_values": missing,
            "class_distributions": class_distributions,
            "sample_data": df.head(5).to_dict('records')
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"EDA failed: {str(e)}")


@app.post("/balance")
async def balance_classes(request: BalanceRequest):
    """Balance Classes block — SMOTE oversampling"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(file_path)

        if request.target_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Target column '{request.target_column}' not found")

        X = df.drop(columns=[request.target_column])
        y = df[request.target_column]

        # Only numeric columns for SMOTE
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        if not numeric_cols:
            raise HTTPException(status_code=400, detail="SMOTE requires numeric features. Encode categories first.")

        X_numeric = X[numeric_cols]
        original_distribution = y.value_counts().to_dict()

        from imblearn.over_sampling import SMOTE
        smote = SMOTE(random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X_numeric, y)

        df_balanced = pd.DataFrame(X_resampled, columns=numeric_cols)
        df_balanced[request.target_column] = y_resampled
        df_balanced.to_csv(file_path, index=False)

        return {
            "status": "success",
            "message": f"Balanced classes using SMOTE: {len(df)}→{len(df_balanced)} rows",
            "original_distribution": {str(k): int(v) for k, v in original_distribution.items()},
            "balanced_distribution": {str(k): int(v) for k, v in y_resampled.value_counts().to_dict().items()},
            "original_rows": len(df),
            "balanced_rows": len(df_balanced)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Balancing failed: {str(e)}")


@app.post("/cross-validate")
async def cross_validate(request: CrossValRequest):
    """Cross-Validation block"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        processed_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        use_path = processed_path if os.path.exists(processed_path) else file_path
        if not os.path.exists(use_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(use_path)

        X = df[request.feature_columns]
        y = df[request.target_column]

        if y.dtype == 'object' or y.dtype.name == 'category':
            target_mapping = {val: idx for idx, val in enumerate(y.unique())}
            y = y.map(target_mapping)

        categorical_features = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_features) > 0:
            X = pd.get_dummies(X, columns=categorical_features, drop_first=True)

        model_map = {
            "LogisticRegression": LogisticRegression(random_state=42, max_iter=1000),
            "DecisionTree": DecisionTreeClassifier(random_state=42),
            "RandomForest": RandomForestClassifier(random_state=42, n_estimators=100),
            "SVM": SVC(random_state=42),
            "KNeighborsClassifier": KNeighborsClassifier(n_neighbors=5),
            "GaussianNB": GaussianNB(),
            "GradientBoosting": GradientBoostingClassifier(random_state=42, n_estimators=100),
        }
        model = model_map.get(request.model_type)
        if not model:
            raise HTTPException(status_code=400, detail=f"Invalid model type for CV: {request.model_type}")

        scores = cross_val_score(model, X, y, cv=request.cv_folds, scoring='accuracy')

        return {
            "status": "success",
            "message": f"{request.cv_folds}-fold CV — Mean: {scores.mean():.3f}, Std: {scores.std():.3f}",
            "cv_folds": request.cv_folds,
            "scores": scores.tolist(),
            "mean_score": float(scores.mean()),
            "std_score": float(scores.std())
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cross-validation failed: {str(e)}")


@app.post("/tune")
async def tune_model(request: TuneRequest):
    """Tune Model block — GridSearchCV / RandomizedSearchCV"""
    try:
        file_path = os.path.join(TEMP_DIR, f"{request.session_id}.csv")
        processed_path = os.path.join(TEMP_DIR, f"{request.session_id}_processed.csv")
        use_path = processed_path if os.path.exists(processed_path) else file_path
        if not os.path.exists(use_path):
            raise HTTPException(status_code=404, detail="Session data not found")
        df = pd.read_csv(use_path)

        X = df[request.feature_columns]
        y = df[request.target_column]

        if y.dtype == 'object' or y.dtype.name == 'category':
            target_mapping = {val: idx for idx, val in enumerate(y.unique())}
            y = y.map(target_mapping)

        categorical_features = X.select_dtypes(include=['object', 'category']).columns
        if len(categorical_features) > 0:
            X = pd.get_dummies(X, columns=categorical_features, drop_first=True)

        # Predefined param grids per model type
        param_grids = {
            "LogisticRegression": {"C": [0.01, 0.1, 1, 10], "max_iter": [500, 1000]},
            "DecisionTree": {"max_depth": [3, 5, 10, None], "min_samples_split": [2, 5, 10]},
            "RandomForest": {"n_estimators": [50, 100, 200], "max_depth": [5, 10, None]},
            "KNeighborsClassifier": {"n_neighbors": [3, 5, 7, 11], "weights": ["uniform", "distance"]},
            "GradientBoosting": {"n_estimators": [50, 100, 200], "learning_rate": [0.01, 0.1, 0.2], "max_depth": [3, 5]},
        }

        model_map = {
            "LogisticRegression": LogisticRegression(random_state=42),
            "DecisionTree": DecisionTreeClassifier(random_state=42),
            "RandomForest": RandomForestClassifier(random_state=42),
            "KNeighborsClassifier": KNeighborsClassifier(),
            "GradientBoosting": GradientBoostingClassifier(random_state=42),
        }

        base_model = model_map.get(request.model_type)
        param_grid = param_grids.get(request.model_type)
        if not base_model or not param_grid:
            raise HTTPException(status_code=400, detail=f"Tuning not supported for: {request.model_type}")

        if request.search_type == "grid":
            search = GridSearchCV(base_model, param_grid, cv=3, scoring='accuracy', n_jobs=-1)
        else:
            search = RandomizedSearchCV(base_model, param_grid, cv=3, scoring='accuracy', n_iter=10, random_state=42, n_jobs=-1)

        search.fit(X, y)

        # Save best model
        model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
        model_info = {"model": search.best_estimator_, "feature_columns": list(X.columns), "target_mapping": None, "model_type": request.model_type}
        with open(model_path, 'wb') as f:
            pickle.dump(model_info, f)

        return {
            "status": "success",
            "message": f"Best score: {search.best_score_:.3f}",
            "best_params": {k: (str(v) if v is None else v) for k, v in search.best_params_.items()},
            "best_score": float(search.best_score_),
            "search_type": request.search_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Tuning failed: {str(e)}")


@app.post("/export-model")
async def export_model(request: ExportRequest):
    """Export Model block — download trained model as .joblib"""
    try:
        model_path = os.path.join(TEMP_DIR, f"{request.session_id}_model.pkl")
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="No trained model found")

        with open(model_path, 'rb') as f:
            model_info = pickle.load(f)

        # Save as joblib
        export_path = os.path.join(TEMP_DIR, f"{request.session_id}_export.joblib")
        joblib.dump(model_info, export_path)

        return FileResponse(
            path=export_path,
            filename=f"predictit_model_{request.session_id[:8]}.joblib",
            media_type="application/octet-stream"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@app.post("/predict-new")
async def predict_new_data(session_id: str, file: UploadFile = File(...)):
    """Predict New Data block — upload CSV, get predictions"""
    try:
        model_path = os.path.join(TEMP_DIR, f"{session_id}_model.pkl")
        if not os.path.exists(model_path):
            raise HTTPException(status_code=404, detail="No trained model found")

        with open(model_path, 'rb') as f:
            model_info = pickle.load(f)

        model = model_info["model"]
        feature_columns = model_info["feature_columns"]
        target_mapping = model_info.get("target_mapping")

        if file.filename.endswith('.csv'):
            new_df = pd.read_csv(file.file)
        else:
            new_df = pd.read_excel(file.file)

        # Align columns
        categorical_features = new_df.select_dtypes(include=['object', 'category']).columns
        if len(categorical_features) > 0:
            new_df = pd.get_dummies(new_df, columns=categorical_features, drop_first=True)
        for col in feature_columns:
            if col not in new_df.columns:
                new_df[col] = 0
        new_df = new_df[feature_columns]

        predictions = model.predict(new_df)

        if target_mapping:
            reverse_mapping = {v: k for k, v in target_mapping.items()}
            predictions = [reverse_mapping.get(p, p) for p in predictions]

        result_df = new_df.copy()
        result_df["prediction"] = predictions

        output_path = os.path.join(TEMP_DIR, f"{session_id}_predictions.csv")
        result_df.to_csv(output_path, index=False)

        return {
            "status": "success",
            "message": f"Generated {len(predictions)} predictions",
            "predictions": [str(p) for p in predictions[:20]],
            "total_predictions": len(predictions),
            "sample_results": result_df.head(10).to_dict('records')
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


# ============================================================
# Templates API
# ============================================================

@app.get("/api/templates")
async def list_templates(
    category: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None)
):
    """List pipeline templates with optional filtering"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        templates = DatabaseManager.get_templates(category, difficulty)
        return templates
    return []


@app.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a single template by ID"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        template = DatabaseManager.get_template_by_id(template_id)
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        return template
    raise HTTPException(status_code=404, detail="Templates not available")

@app.post("/pipelines/from-template/{template_id}")
async def create_pipeline_from_template(
    template_id: str,
    current_user: dict = Depends(get_current_user_optional)
):
    """Create a new pipeline project instantiated from a template"""
    if not (AUTH_AVAILABLE and MONGODB_AVAILABLE):
        raise HTTPException(status_code=503, detail="Database not available")
        
    template = DatabaseManager.get_template_by_id(template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    # Generate new session ID
    session_id = str(uuid.uuid4())
    
    project_data = {
        "name": f"{template.get('name', 'New')} Pipeline",
        "description": f"Created from template: {template.get('name', '')}",
        "session_id": session_id,
        "nodes": [],  
        "edges": []
    }
    
    user_id = current_user.get("user_id", "guest") if current_user else "guest"
    
    project_id = DatabaseManager.save_project(user_id, project_data)
    
    if not project_id:
        raise HTTPException(status_code=500, detail="Failed to create pipeline")
        
    # Retrieve the saved project to return it
    new_project = DatabaseManager.get_project_by_id(project_id, user_id)
    if new_project and "_id" in new_project:
        new_project["id"] = str(new_project.pop("_id"))
        
    # Inject template blocks and edges into the response so the frontend can build the initial layout
    new_project["template_blocks"] = template.get("blocks", [])
    new_project["template_edges"] = template.get("edges", [])
        
    return new_project



# ============================================================
# Docs API
# ============================================================

@app.get("/api/docs")
async def list_docs(section: Optional[str] = Query(None)):
    """List documentation entries with optional section filter"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        docs = DatabaseManager.get_docs(section)
        return docs
    return []


@app.get("/api/docs/{slug}")
async def get_doc(slug: str):
    """Get a single doc entry by slug"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        doc = DatabaseManager.get_doc_by_slug(slug)
        if not doc:
            raise HTTPException(status_code=404, detail="Doc not found")
        return doc
    raise HTTPException(status_code=404, detail="Docs not available")


# ============================================================
# Startup: Seed Data
# ============================================================

@app.on_event("startup")
async def startup_seed():
    """Seed templates and docs on startup if collections are empty"""
    if AUTH_AVAILABLE and MONGODB_AVAILABLE:
        try:
            DatabaseManager.seed_templates_if_empty()
            DatabaseManager.seed_docs_if_empty()
            print("[OK] Startup seed check complete")
        except Exception as e:
            print(f"[WARN] Startup seed failed: {e}")


# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)