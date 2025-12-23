# 🤖 PredictIT - No-Code ML Pipeline Builder

A powerful, user-friendly machine learning pipeline builder that allows anyone to create, train, and deploy ML models without writing code.

![PredictIT Banner](https://via.placeholder.com/800x200/1e293b/ffffff?text=PredictIT+-+ML+Made+Simple)

## ✨ Features

- 🚀 **No-Code Interface** - Build ML pipelines with intuitive drag-and-drop
- 📊 **Smart Data Processing** - Automatic data type detection and preprocessing
- 🧠 **Multiple ML Models** - Support for various algorithms (Logistic Regression, Decision Trees, etc.)
- 💾 **Cloud Storage** - Seamless integration with Cloudinary for data persistence
- 👥 **User Management** - Secure authentication and project management
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- ⚡ **Real-time Training** - Watch your models train with live progress updates

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Framer Motion** for animations
- **Zustand** for state management

### Backend
- **FastAPI** for high-performance API
- **Python** with scikit-learn for ML
- **MongoDB** for data persistence
- **Cloudinary** for file storage
- **JWT** for authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account
- Cloudinary account

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/predictit-ml-pipeline.git
cd predictit-ml-pipeline
```

2. **Setup Backend**
```bash
cd server
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python main.py
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

## 📦 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete deployment instructions.

### Quick Deploy Links
- **Frontend**: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/predictit-ml-pipeline)
- **Backend**: [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

## 🎯 How It Works

1. **Upload Data** - Import your CSV or Excel files
2. **Preprocess** - Clean and prepare your data automatically
3. **Configure** - Set up training parameters with simple controls
4. **Train** - Watch your model train in real-time
5. **Predict** - Use your trained model to make predictions
6. **Save & Share** - Save your pipelines and share results

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