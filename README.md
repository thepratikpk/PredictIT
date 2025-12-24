# 🤖 PredictIT - No-Code ML Pipeline Builder

A powerful, user-friendly machine learning pipeline builder that allows anyone to create, train, and use ML models without writing code.

![PredictIT](https://img.shields.io/badge/PredictIT-ML%20Pipeline%20Builder-blue?style=for-the-badge&logo=react)
![Status](https://img.shields.io/badge/Status-Production%20Ready-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

## 🌟 **Live Demo**
- **Frontend**: [https://predict-it-zeta.vercel.app](https://predict-it-zeta.vercel.app)
- **API**: [https://predictit-api.onrender.com](https://predictit-api.onrender.com)

## ✨ Features

- 🚀 **No-Code Interface** - Build ML pipelines with intuitive step-by-step process
- 📊 **Smart Data Processing** - Automatic data type detection and preprocessing
- 🧠 **Multiple ML Models** - Support for Logistic Regression, Decision Trees, Random Forest, and SVM
- 💾 **Cloud Storage** - Seamless integration with Cloudinary for data persistence
- 👥 **User Management** - Secure authentication and personal project management
- 📱 **Mobile Responsive** - Optimized for all devices with touch-friendly interface
- ⚡ **Real-time Training** - Watch your models train with live progress updates
- 🔄 **Project Management** - Save, load, and manage multiple ML pipelines
- 🎯 **Interactive Results** - Visualize model performance with charts and metrics
- 🔔 **Smart Notifications** - Toast notifications for all user actions

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Hot Toast** for notifications
- **Zustand** for state management
- **Axios** for API communication
- **Lucide React** for icons

### Backend
- **FastAPI** for high-performance API
- **Python** with scikit-learn for ML
- **MongoDB Atlas** for data persistence
- **Cloudinary** for file storage
- **JWT** for secure authentication
- **Uvicorn** for ASGI server

### Infrastructure
- **Vercel** for frontend hosting
- **Render** for backend hosting
- **MongoDB Atlas** for database
- **Cloudinary** for file storage

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10.9+
- MongoDB Atlas account
- Cloudinary account

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/pratikkochare/predictit-ml-pipeline.git
cd predictit-ml-pipeline
```

2. **Setup Backend**
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python start.py
```

3. **Setup Frontend**
```bash
cd client
npm install
npm run dev
```

4. **Open your browser**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📦 Setup

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for complete setup instructions.

### Quick Setup Links
- **Frontend**: [![Setup with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/pratikkochare/predictit-ml-pipeline)
- **Backend**: [![Setup on Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

## 🎮 Try It Now

🚀 **[Launch PredictIT](https://predict-it-zeta.vercel.app)** - No installation required!

1. Visit the live demo
2. Sign up for a free account (optional)
3. Upload a CSV file with your data
4. Follow the 5-step pipeline process
5. Get your trained ML model results!

## 🎯 How It Works

1. **Upload Data** - Import your CSV or Excel files with drag & drop
2. **Preprocess** - Clean and prepare your data with automated scaling
3. **Configure** - Set up train-test split and model parameters
4. **Train** - Watch your model train with real-time progress
5. **Results** - View performance metrics and make predictions

## 🆕 Recent Updates

- ✅ **Mobile-First Design** - Fully responsive interface optimized for all devices
- ✅ **Smart Notifications** - Toast notifications for all user actions and feedback
- ✅ **Enhanced UX** - Simplified landing page with cleaner interface
- ✅ **Project Management** - Save and load multiple ML pipelines with authentication
- ✅ **Real-time Progress** - Live updates during model training with progress bars
- ✅ **Cloud Integration** - Seamless file storage and retrieval with Cloudinary
- ✅ **Production Ready** - Hosted on Vercel (frontend) and Render (backend)

## 📸 Screenshots

### Landing Page
![Landing Page](https://via.placeholder.com/600x400/f1f5f9/1e293b?text=Landing+Page)

### Pipeline Builder
![Pipeline Builder](https://via.placeholder.com/600x400/f1f5f9/1e293b?text=Pipeline+Builder)

### Model Training
![Model Training](https://via.placeholder.com/600x400/f1f5f9/1e293b?text=Model+Training)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Pratik Kochare**
- Portfolio: [https://portfolio-pratik-kochare.vercel.app/](https://portfolio-pratik-kochare.vercel.app/)
- GitHub: [@pratikkochare](https://github.com/pratikkochare)
- LinkedIn: [Pratik Kochare](https://linkedin.com/in/pratikkochare)

## 🙏 Acknowledgments

- Built with ❤️ using modern web technologies
- Inspired by the need to democratize machine learning
- Thanks to the open-source community for amazing tools

---

⭐ **Star this repo if you find it helpful!**