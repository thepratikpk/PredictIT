from fastapi import FastAPI, File, UploadFile, HTTPException
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
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

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

@app.get("/")
async def root():
    return {"message": "No-Code ML Pipeline API is running", "version": "1.0"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)