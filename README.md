# 🏠 House Price Predictor

A full-stack machine learning web application that predicts house prices using the **Ames Housing Dataset**.

Built with **React** (frontend) + **Flask** (backend) + **XGBoost** (ML model).

---

## 📊 Model Performance

| Model | RMSE | R² Score |
|---|---|---|
| Linear Regression | $50,190 | 0.67 |
| Random Forest | $29,380 | 0.88 |
| **XGBoost** ✅ | **$26,126** | **0.91** |

> XGBoost was selected as the final model with **91% accuracy**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js |
| Backend | Python, Flask |
| ML Model | XGBoost |
| Data Processing | Pandas, Scikit-learn, NumPy |
| Dataset | Ames Housing Dataset (Kaggle) |

---

## 📁 Project Structure

```
house-price-prediction/
├── backend/
│   ├── app.py           → Flask API
│   └── preprocess.py    → Data preprocessing pipeline
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx      → Main React component
        ├── App.css      → Styling
        └── index.js     → Entry point
```

---

## ⚙️ How to Run Locally

### Prerequisites
- Python (Anaconda recommended)
- Node.js v16+
- Git

### Step 1 — Clone the repo
```bash
git clone https://github.com/frontstyle-with-ritika/house-price-prediction.git
cd house-price-prediction
```

### Step 2 — Add the model files
Place these files inside the `backend/` folder:
- `house_price_xgb_model.pkl`
- `scaler.pkl`
- `feature_columns.pkl`
- `float_cols.pkl`

### Step 3 — Start the Flask backend
```bash
cd backend
pip install flask flask-cors
python app.py
```
Backend runs at → `http://localhost:5000`

### Step 4 — Start the React frontend
Open a new terminal:
```bash
cd frontend
npm install
npm start
```
Frontend runs at → `http://localhost:3000`

---

## 🎯 Features

- 7-step form covering all house attributes
- Real-time price prediction using XGBoost
- Responsive design for desktop and mobile
- REST API backend with Flask

---

## 📈 ML Pipeline

1. Data loading & EDA
2. Missing value imputation
3. Ordinal & One-Hot Encoding (215 features)
4. Feature scaling (StandardScaler)
5. Model training & comparison
6. XGBoost selected as best model
7. Model saved with joblib

---

## 👩‍💻 Author

**Ritika Rastogi**
GitHub: [@frontstyle-with-ritika](https://github.com/frontstyle-with-ritika)
