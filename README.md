# NeuroScan AI – Brain Tumor Detection

A full-stack AI-powered brain MRI classification application.

**Classifies 4 categories:** Glioma · Meningioma · Pituitary Tumor · No Tumor

**Powered by:** ResNet50 transfer learning | Grad-CAM visual explanations | 99.6% accuracy

---

## 🚀 Quick Start

### 1. Backend (FastAPI + TensorFlow)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`  
API docs at: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install   # first time only
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 📁 Project Structure

```
Brain_Tumor/
├── backend/                    # FastAPI REST API
│   ├── main.py                 # App factory + CORS + lifespan model loading
│   ├── requirements.txt
│   ├── model/
│   │   └── loader.py           # Singleton model loader + preprocessing
│   ├── routes/
│   │   ├── predict.py          # POST /api/predict
│   │   ├── stats.py            # GET /api/stats, GET /api/history
│   │   └── health.py           # GET /api/health
│   └── services/
│       └── prediction_service.py  # Grad-CAM + history
│
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx             # Router + layout
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Stats + recent scans
│   │   │   ├── Analyze.jsx     # Upload + Grad-CAM results
│   │   │   ├── History.jsx     # Searchable scan table
│   │   │   └── About.jsx       # Model info + tumor guide
│   │   ├── components/
│   │   │   ├── Sidebar.jsx     # Navigation + model status
│   │   │   ├── UI.jsx          # StatCard, ConfidenceBar, TumorBadge, etc.
│   │   │   └── UploadZone.jsx  # Drag-and-drop upload
│   │   └── services/api.js     # Axios API client
│   └── package.json
│
├── models/
│   └── model.h5            # Pre-trained model weights (Download below)
└── brain-tumor-mri-dataset/    # MRI images (Training + Testing)
    ├── Training/
    └── Testing/
```

### 🧠 Model Weights
Due to file size limits on GitHub, the trained model weights are hosted on Google Drive:
- [Download Pre-trained Model (.h5)](https://drive.google.com/file/d/1CLSdIAufb8gr-RwFp6wUwb_IIHUCYb2n/view?usp=sharing)
- Place the downloaded file inside the `models/` directory before running the backend.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔬 MRI Upload | Drag-and-drop or click-to-browse upload |
| 🧠 AI Classification | 4-class tumor detection at 99.4% accuracy |
| 🔥 Grad-CAM | Visual heatmap showing what the AI focused on |
| 📊 Dashboard | Real-time session stats and class distribution |
| 📋 History | Searchable, filterable scan history table |
| 🎨 Premium UI | Dark neural theme, glassmorphism, animations |

---

## 🔧 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/predict` | Upload MRI → prediction + Grad-CAM |
| `GET`  | `/api/stats` | Session statistics |
| `GET`  | `/api/history` | All predictions (last 100) |
| `GET`  | `/api/health` | Backend + model status |
| `GET`  | `/docs` | Interactive Swagger UI |

---

## ⚠️ Disclaimer

This tool is **for educational and research purposes only**.  
It is not a substitute for professional medical diagnosis.  
Always consult a qualified medical professional.
