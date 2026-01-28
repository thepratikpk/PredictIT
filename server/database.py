from pymongo import MongoClient
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
from datetime import datetime
import cloudinary
import cloudinary.uploader
from bson import ObjectId

load_dotenv()

# MongoDB Configuration
MONGODB_URL = os.getenv("MONGODB_URL")

# Make MongoDB optional for testing
if MONGODB_URL and MONGODB_URL != "mongodb://localhost:27017/ml_pipeline":
    try:
        # Database connection
        client = MongoClient(MONGODB_URL)
        db = client.ml_pipeline
        
        # Collections
        users_collection = db.users
        projects_collection = db.projects
        sessions_collection = db.sessions
        chat_history_collection = db.chat_history
        files_collection = db.files
        
        # Test connection
        client.admin.command('ping')
        print("✓ Connected to MongoDB successfully")
        MONGODB_AVAILABLE = True
    except Exception as e:
        print(f"⚠️  MongoDB connection failed: {e}")
        print("Running in local mode without database features")
        MONGODB_AVAILABLE = False
        client = None
        db = None
        users_collection = None
        projects_collection = None
        sessions_collection = None
        chat_history_collection = None
        files_collection = None
else:
    print("⚠️  MongoDB not configured, running in local mode")
    MONGODB_AVAILABLE = False
    client = None
    db = None
    users_collection = None
    projects_collection = None
    sessions_collection = None
    chat_history_collection = None
    files_collection = None

# Cloudinary Configuration
CLOUDINARY_AVAILABLE = False
try:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    
    if cloud_name and api_key and api_secret and cloud_name != "your-cloud-name":
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        CLOUDINARY_AVAILABLE = True
        print("✓ Cloudinary configured successfully")
    else:
        print("⚠️  Cloudinary not configured, file uploads will be local only")
except Exception as e:
    print(f"⚠️  Cloudinary configuration failed: {e}")

class DatabaseManager:
    @staticmethod
    def create_user(email: str, password_hash: str, name: str) -> str:
        """Create a new user and return user ID"""
        if not MONGODB_AVAILABLE:
            raise Exception("Database not available. Please configure MongoDB.")
            
        user_doc = {
            "email": email,
            "password_hash": password_hash,
            "name": name,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = users_collection.insert_one(user_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        if not MONGODB_AVAILABLE:
            return None
            
        user = users_collection.find_one({"email": email})
        if user:
            user["_id"] = str(user["_id"])
        return user
    
    @staticmethod
    def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        if not MONGODB_AVAILABLE:
            return None
            
        try:
            user = users_collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user["_id"] = str(user["_id"])
            return user
        except:
            return None
    
    @staticmethod
    def save_project(user_id: str, project_data: Dict[str, Any]) -> str:
        """Save a ML project for a user"""
        project_doc = {
            "user_id": user_id,
            "name": project_data.get("name", "Untitled Project"),
            "description": project_data.get("description", ""),
            "dataset_info": project_data.get("dataset_info"),
            "preprocessing_config": project_data.get("preprocessing_config"),
            "split_config": project_data.get("split_config"),
            "model_config": project_data.get("model_config"),
            "results": project_data.get("results"),
            "session_id": project_data.get("session_id"),
            "file_url": project_data.get("file_url"),  # Cloudinary URL
            "file_public_id": project_data.get("file_public_id"),  # Cloudinary public ID
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = projects_collection.insert_one(project_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_projects(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's projects"""
        projects = list(projects_collection.find(
            {"user_id": user_id}
        ).sort("updated_at", -1).limit(limit))
        
        for project in projects:
            project["_id"] = str(project["_id"])
        
        return projects
    
    @staticmethod
    def get_project_by_id(project_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """Get a specific project by ID (only if it belongs to the user)"""
        try:
            project = projects_collection.find_one({
                "_id": ObjectId(project_id),
                "user_id": user_id
            })
            if project:
                project["_id"] = str(project["_id"])
            return project
        except:
            return None
    
    @staticmethod
    def update_project(project_id: str, user_id: str, updates: Dict[str, Any]) -> bool:
        """Update a project"""
        try:
            updates["updated_at"] = datetime.utcnow()
            result = projects_collection.update_one(
                {"_id": ObjectId(project_id), "user_id": user_id},
                {"$set": updates}
            )
            return result.modified_count > 0
        except:
            return False
    
    @staticmethod
    def delete_project(project_id: str, user_id: str) -> bool:
        """Delete a project (Cloudinary cleanup handled in main.py)"""
        try:
            result = projects_collection.delete_one({
                "_id": ObjectId(project_id),
                "user_id": user_id
            })
            return result.deleted_count > 0
        except:
            return False

    # Chat History Management
    @staticmethod
    def save_chat_message(user_id: str, session_id: str, message: str, message_type: str = "user") -> str:
        """Save a chat message for a user session"""
        if not MONGODB_AVAILABLE:
            return ""
            
        chat_doc = {
            "user_id": user_id,
            "session_id": session_id,
            "message": message,
            "message_type": message_type,  # "user" or "assistant"
            "timestamp": datetime.utcnow()
        }
        result = chat_history_collection.insert_one(chat_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_chat_history(user_id: str, session_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get chat history for a user session"""
        if not MONGODB_AVAILABLE:
            return []
            
        messages = list(chat_history_collection.find({
            "user_id": user_id,
            "session_id": session_id
        }).sort("timestamp", 1).limit(limit))
        
        for message in messages:
            message["_id"] = str(message["_id"])
        
        return messages
    
    @staticmethod
    def get_user_chat_sessions(user_id: str) -> List[Dict[str, Any]]:
        """Get all chat sessions for a user"""
        if not MONGODB_AVAILABLE:
            return []
            
        pipeline = [
            {"$match": {"user_id": user_id}},
            {"$group": {
                "_id": "$session_id",
                "last_message": {"$last": "$message"},
                "last_timestamp": {"$last": "$timestamp"},
                "message_count": {"$sum": 1}
            }},
            {"$sort": {"last_timestamp": -1}}
        ]
        
        sessions = list(chat_history_collection.aggregate(pipeline))
        return sessions
    
    @staticmethod
    def delete_chat_session(user_id: str, session_id: str) -> bool:
        """Delete all messages in a chat session"""
        if not MONGODB_AVAILABLE:
            return False
            
        try:
            result = chat_history_collection.delete_many({
                "user_id": user_id,
                "session_id": session_id
            })
            return result.deleted_count > 0
        except:
            return False

    # File Management
    @staticmethod
    def save_file_metadata(user_id: str, file_data: Dict[str, Any]) -> str:
        """Save file metadata to database"""
        if not MONGODB_AVAILABLE:
            return ""
            
        file_doc = {
            "user_id": user_id,
            "filename": file_data.get("filename"),
            "original_filename": file_data.get("original_filename"),
            "file_url": file_data.get("file_url"),
            "public_id": file_data.get("public_id"),
            "file_size": file_data.get("file_size"),
            "file_type": file_data.get("file_type"),
            "session_id": file_data.get("session_id"),
            "uploaded_at": datetime.utcnow()
        }
        result = files_collection.insert_one(file_doc)
        return str(result.inserted_id)
    
    @staticmethod
    def get_user_files(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Get user's uploaded files"""
        if not MONGODB_AVAILABLE:
            return []
            
        files = list(files_collection.find({
            "user_id": user_id
        }).sort("uploaded_at", -1).limit(limit))
        
        for file in files:
            file["_id"] = str(file["_id"])
        
        return files
    
    @staticmethod
    def get_file_by_session(user_id: str, session_id: str) -> Optional[Dict[str, Any]]:
        """Get file by session ID"""
        if not MONGODB_AVAILABLE:
            return None
            
        file = files_collection.find_one({
            "user_id": user_id,
            "session_id": session_id
        })
        
        if file:
            file["_id"] = str(file["_id"])
        
        return file

class CloudinaryManager:
    @staticmethod
    def upload_file(file_path: str, folder: str = "ml_pipeline", public_id: str = None, resource_type: str = "auto") -> Dict[str, Any]:
        """Upload file to Cloudinary"""
        if not CLOUDINARY_AVAILABLE:
            raise Exception("Cloudinary not configured")
            
        try:
            upload_params = {
                "folder": folder,
                "resource_type": resource_type
            }
            
            if public_id:
                upload_params["public_id"] = public_id
            
            result = cloudinary.uploader.upload(file_path, **upload_params)
            
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format"),
                "size": result.get("bytes"),
                "width": result.get("width"),
                "height": result.get("height")
            }
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    @staticmethod
    def upload_raw_file(file_content: bytes, filename: str, folder: str = "ml_pipeline") -> Dict[str, Any]:
        """Upload raw file content to Cloudinary"""
        if not CLOUDINARY_AVAILABLE:
            raise Exception("Cloudinary not configured")
            
        try:
            result = cloudinary.uploader.upload(
                file_content,
                folder=folder,
                public_id=filename,
                resource_type="raw"
            )
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format"),
                "size": result.get("bytes")
            }
        except Exception as e:
            raise Exception(f"Failed to upload file: {str(e)}")
    
    @staticmethod
    def delete_file(public_id: str, resource_type: str = "auto") -> bool:
        """Delete file from Cloudinary"""
        if not CLOUDINARY_AVAILABLE:
            return False
            
        try:
            result = cloudinary.uploader.destroy(public_id, resource_type=resource_type)
            return result.get("result") == "ok"
        except:
            return False
    
    @staticmethod
    def get_file_info(public_id: str) -> Optional[Dict[str, Any]]:
        """Get file information from Cloudinary"""
        if not CLOUDINARY_AVAILABLE:
            return None
            
        try:
            result = cloudinary.api.resource(public_id)
            return {
                "url": result["secure_url"],
                "public_id": result["public_id"],
                "format": result.get("format"),
                "size": result.get("bytes"),
                "created_at": result.get("created_at")
            }
        except:
            return None