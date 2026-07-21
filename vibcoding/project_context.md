# PredictIT: Project Context

## What is the Project About?
**PredictIT** is a powerful, user-friendly, No-Code Machine Learning Pipeline Builder. It empowers anyone to create, train, and use ML models without writing any code.

### Core Features:
- **No-Code Interface**: Intuitive step-by-step process for building ML pipelines.
- **Data Processing**: Automatic data type detection and preprocessing (cleaning, scaling).
- **Multiple ML Models**: Supports Logistic Regression, Decision Trees, Random Forest, and Support Vector Machines (SVM).
- **Project & User Management**: Secure JWT authentication, personal project management, and ability to save/load multiple ML pipelines.
- **Real-time Feedback**: Live progress updates and toast notifications during model training and user actions.
- **Interactive Results**: Visualizes model performance using charts and metrics.
- **Cloud Integration**: Uses Cloudinary for file storage and MongoDB Atlas for data persistence.

## Tech Stack Overview
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand (State Management), Axios, React Hot Toast, Lucide React (Icons).
- **Backend**: Python, FastAPI, scikit-learn (for ML), Uvicorn (ASGI server), MongoDB Atlas, Cloudinary.
- **Infrastructure**: Vercel (Frontend Hosting), Render (Backend Hosting).

## Frontend Design Style & Aesthetics
The frontend design relies heavily on **Google's Material Design 3 (MD3)** language, implemented through a highly customized Tailwind CSS configuration. It aims for a professional, clean, and dynamic feel that resembles native modern web applications.

### Key Design Elements:
- **Color Palette**: Uses the official Material Design 3 color system. The primary accent is a signature blue (`#1A73E8`). It defines specific colors for `surface`, `surface-container`, `error`, and `outline` to strictly follow Material guidelines.
- **Typography**: Employs `Google Sans` and `Roboto` as the primary fonts for a clean, legible interface.
- **Elevation and Shadows**: Replaces standard shadows with custom MD3 elevations (`md-1` through `md-4`) to create a realistic sense of depth and layout hierarchy.
- **Micro-Animations & Transitions**: Integrates sophisticated MD3 animations like `md-fade-in`, `md-slide-up`, and `md-scale-in`. It pairs these with custom timing functions (e.g., `md-emphasized`: `cubic-bezier(0.4, 0, 0.2, 1)`) for extremely smooth and responsive interactions.
- **Border Radius**: Uses generous rounded corners (up to `28px` / `3xl`) on components to align with modern web trends.
- **Responsiveness**: It's a mobile-first design, ensuring the app is fully responsive and touch-friendly on all devices.
