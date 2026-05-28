# 🧠 NeuroTracker AI

### AI-Based Headache Pattern Analysis & Migraine Type Prediction System

NeuroTracker AI is an intelligent healthcare decision-support platform that analyzes headache symptoms and predicts the most probable headache type using Machine Learning.

The system combines **Artificial Intelligence, Explainable AI (XAI), Data Analytics, and Full-Stack Web Development** to help users monitor headache patterns, identify triggers, and generate medical insights in real time.

---

## 🚀 Features

### 🧠 AI-Based Headache Prediction

* Predicts:

  * Migraine Without Aura
  * Migraine With Aura
  * Tension-Type Headache
  * Cluster Headache
* Uses Support Vector Machine (SVM) with RBF Kernel
* Achieved **88.5% accuracy**

---

### 📊 Interactive Analytics Dashboard

* Severity vs Stress Analysis
* Trigger Correlation Charts
* Diagnosis Distribution Graphs
* Time-based Headache Analytics
* Smart Health Insights

---

### 🧬 Explainable AI (XAI)

The system explains:

* Why a prediction was made
* Which symptoms influenced the prediction most
* Trigger contribution percentages

Example:

* High Stress → 45% impact
* Low Sleep → 30% impact

---

### 📝 Headache Tracker

Users can:

* Log symptoms
* Track pain intensity
* Record aura, nausea, sleep, stress, hydration, etc.
* Monitor long-term headache patterns

---

### 📄 Automated Medical Report Generation

* Generates professional PDF reports
* Includes:

  * Prediction history
  * Severity trends
  * Trigger analysis
  * AI diagnostic insights

---

### 🏥 Clinical Decision Toolkit

Includes:

* AI-based triage system
* Emergency headache warnings
* Specialist recommendations
* Nearby hospital & pharmacy finder

---

### 🔐 Secure Authentication

* Supabase Authentication
* Protected user data
* Row Level Security (RLS)

---

## 🛠️ Tech Stack

### Frontend

* React.js
* TypeScript
* Vite
* Tailwind CSS
* Recharts

### Backend

* Supabase
* Edge Functions (Deno)

### Machine Learning

* Scikit-Learn
* Support Vector Machine (SVM)
* Random Forest
* Logistic Regression
* KNN

### PDF & Utilities

* jsPDF
* AutoTable

---

## 🧠 Machine Learning Workflow

1. User logs headache symptoms
2. Data preprocessing & feature engineering
3. Feature scaling
4. SVM model prediction
5. Confidence score calculation
6. XAI factor generation
7. Result visualization

---

## 📈 Model Performance

| Model               | Accuracy | F1-Score |
| ------------------- | -------- | -------- |
| SVM (RBF Kernel)    | 88.5%    | 87.2%    |
| Random Forest       | 85.3%    | 84.1%    |
| Logistic Regression | 79.8%    | 78.4%    |
| KNN                 | 76.2%    | 74.8%    |

✅ Final Selected Model: **Support Vector Machine (SVM)**

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/MAHADHARSHINI29/NeuroTracker-AI.git
```

### Navigate to Project

```bash
cd NeuroTracker-AI
```

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

---

## 🗄️ Database Setup

This project uses **Supabase**.

Configure:

* Supabase URL
* Supabase Anon Key
* Authentication
* Database Tables
* Edge Functions

Create `.env` file:

```env
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

---

## 📂 Project Structure

```bash
NeuroTracker-AI/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── analytics/
│   ├── report/
│   ├── clinical-tools/
│   └── health-guide/
│
├── supabase/
│   ├── functions/
│   └── migrations/
│
├── public/
├── package.json
└── README.md
```

---

## 📌 Key Modules

### 🔹 Dashboard

Displays user insights and recent headache history.

### 🔹 Tracker

Captures symptom logs and lifestyle triggers.

### 🔹 Analytics

Visualizes health trends and trigger patterns.

### 🔹 Report Module

Generates downloadable clinical PDF reports.

### 🔹 Clinical Toolkit

Provides emergency guidance and specialist suggestions.

### 🔹 Health Guide

Educational module for headache awareness and prevention.

---

## 🔬 Feature Engineering

### Severity Score Formula

```math
Severity Score = (Pain Intensity × 0.5) + (Nausea × 2.0)
```

### SVM RBF Kernel

```math
K(x,x') = exp(-γ ||x-x'||²)
```

---

## 🔒 Security Features

* Row Level Security (RLS)
* Secure Supabase Authentication
* Protected medical records
* User-isolated database access

---

## 📸 Screenshots

### Dashboard

* Interactive health monitoring interface

### Headache Tracker

* Symptom logging system

### Analytics

* Graph-based trend visualization

### Clinical Toolkit

* Smart triage and emergency guidance

### Health Guide

* AI-assisted educational healthcare module

---

## 🌍 Future Scope

* Integration with real clinical datasets
* Wearable device connectivity
* Mobile application
* AI Chatbot integration
* Personalized prevention recommendations
* Real-time healthcare monitoring

---

## 👩‍💻 Authors

### MAHADHARSHINI P
### DHARANI A D
B.Tech Information Technology
Government College of Engineering, Erode


---

## 📚 References

* Scikit-Learn Documentation
* Supabase Documentation
* React Documentation
* ICHD-3 Headache Classification Guidelines

---

**🌐 Deployment**
Live Application

https://neuro-tracker-mpft.vercel.app/

---

## ⭐ Conclusion

NeuroTracker AI demonstrates how Artificial Intelligence and Full-Stack Development can be integrated to build intelligent healthcare support systems capable of improving headache monitoring, awareness, and early clinical guidance.

---

# 💡 “AI for Smarter Healthcare”
