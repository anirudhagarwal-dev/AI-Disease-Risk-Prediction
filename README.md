# AI-Powered Disease Risk Prediction System

**Theme:** Healthcare & Artificial Intelligence  
**Tagline:** "Predict Early. Prevent Better."

An AI-based predictive healthcare solution that identifies and forecasts the risk of chronic diseases (diabetes, heart failure, and cancer) using patient data. The system uses machine learning models to analyze health indicators and predict disease risks early — enabling preventive care instead of reactive treatment.

## Features

- ✅ **Disease Risk Prediction** - AI-powered risk assessment for diabetes, heart failure, and cancer
- ✅ **Patient Dashboard** - Personalized health insights and risk tracking over time
- ✅ **Clinician Alerts** - Real-time alerts for high-risk patients requiring immediate attention
- ✅ **Health Indicators Analysis** - Age, genetics, lifestyle, and clinical data integration
- ✅ **Preventive Action Plans** - Personalized recommendations and preventive care timelines
- ✅ **Risk Trend Visualization** - Track risk changes over time for each disease
- ✅ **Prediction History** - Complete history of all risk assessments
- ✅ **Multi-disease Support** - Comprehensive risk analysis across multiple chronic conditions

## Setup

### Backend Setup

1. Create `server/.env`:
```env
PORT=4000
DATABASE_URL=./data.db
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Twilio (for SMS & WhatsApp) - Optional
TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER=YOUR_TWILIO_PHONE_NUMBER
```

2. Install and run:
```bash
cd server
npm install
node server-simple.cjs
```

### Frontend Setup

1. Create `.env` in project root:
```env
VITE_API_BASE_URL=http://localhost:4000
VITE_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
VITE_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```

2. Install and run:
```bash
npm install
npm run dev
```

## API Endpoints

### Disease Prediction
- `POST /api/predictions/predict` - Generate disease risk prediction
- `GET /api/predictions/history/:userId` - Get prediction history for a user
- `GET /api/predictions/high-risk` - Get all high-risk patients (for clinicians)
- `GET /api/predictions/trends/:userId` - Get risk trends for a disease

### Legacy Endpoints
- `POST /api/chatlogs` - Store chat history
- `GET /api/places/nearby` - Find nearby doctors
- `POST /api/sms/subscribe` - Subscribe to SMS alerts
- `GET /api/whatsapp/qr` - Generate WhatsApp QR code
- `GET /api/health` - Health check

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **AI/ML**: Machine Learning models for disease risk prediction
- **Data Sources**: UCI, Kaggle, National Health Survey datasets (inspired)
- **Visualization**: Risk trend charts and interactive dashboards

## Problem Statement

Millions suffer due to delayed diagnosis of chronic diseases. Early detection can improve survival by over 30% but current systems are inefficient. Examples: Late detection of cardiac markers, late-stage cancer diagnoses, and unnoticed pre-diabetic symptoms.

## Proposed Solution

An AI-driven predictive platform that transforms raw patient data into risk profiles. Offers real-time alerts, personalized dashboards, and preventive recommendations using advanced ML models trained on large medical datasets.

## Impact

- **For Doctors**: Smart diagnostic support and prioritization of high-risk patients
- **For Patients**: Early warnings and personalized prevention plans
- **For Healthcare Systems**: Cost savings and reduced late-stage interventions

## Key Features

1. **Multi-Disease Prediction**: Diabetes, Heart Failure, and Cancer risk assessment
2. **Comprehensive Health Analysis**: Age, BMI, blood pressure, glucose, cholesterol, family history, lifestyle factors
3. **Personalized Recommendations**: Immediate actions, lifestyle changes, and medical checkups
4. **Risk Level Classification**: Low, Moderate, High, Critical risk levels with color-coded alerts
5. **Historical Tracking**: Monitor risk trends over time with visualization charts
6. **Clinician Dashboard**: Real-time alerts for healthcare providers to prioritize high-risk patients
