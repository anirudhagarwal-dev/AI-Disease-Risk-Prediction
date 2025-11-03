import { API_BASE } from './config';

export interface HealthIndicators {
  age: number;
  gender: 'male' | 'female' | 'other';
  bmi: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  glucose: number;
  insulin: number;
  cholesterol: number;
  triglycerides: number;
  familyHistory: {
    diabetes: boolean;
    heartDisease: boolean;
    cancer: boolean;
  };
  lifestyle: {
    smoking: boolean;
    alcohol: 'none' | 'moderate' | 'heavy';
    exercise: 'none' | 'light' | 'moderate' | 'heavy';
    diet: 'poor' | 'moderate' | 'good';
    sleepQuality: 'poor' | 'fair' | 'good' | 'excellent';
    sleepHours: number;
    stressLevel: 'none' | 'low' | 'moderate' | 'high';
    dailySteps: number;
    waterIntake: number; // in liters
    workSchedule: 'standard' | 'shift' | 'night' | 'irregular';
    screenTime: number; // hours per day
  };
  genetics: {
    hasGeneticTesting: boolean;
    geneticRiskFactors?: string[];
  };
  clinicalData: {
    previousConditions?: string[];
    medications?: string[];
    allergies?: string[];
  };
}

export interface DiseaseRisk {
  disease: 'diabetes' | 'heart_failure' | 'cancer';
  riskScore: number; // 0-100
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  probability: number; // 0-1
  factors: string[];
  recommendations: string[];
  nextCheckup?: string;
}

export interface PredictionResponse {
  userId: string;
  predictionId: string;
  timestamp: string;
  risks: DiseaseRisk[];
  overallRiskScore: number;
  alertLevel: 'none' | 'medium' | 'high' | 'critical';
  preventivePlan: {
    immediateActions: string[];
    lifestyleChanges: string[];
    medicalCheckups: string[];
    timeline: string;
  };
}

export async function predictDiseaseRisk(
  userId: string,
  indicators: HealthIndicators
): Promise<PredictionResponse> {
  try {
    const url = `${API_BASE}/api/predictions/predict`;
    console.log('Fetching from:', url);
    console.log('Request payload:', { userId, indicators });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, indicators }),
    });

    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const errorMessage = error?.error || `Prediction failed: ${response.status} ${response.statusText}`;
      console.error('API Error:', errorMessage, error);
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('Prediction success:', result);
    return result;
  } catch (error: any) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('Network error - Backend server may not be running:', error);
      throw new Error('Cannot connect to backend server. Please ensure the server is running on port 4000.');
    }
    console.error('Prediction error:', error);
    throw error;
  }
}

export async function getPredictionHistory(userId: string): Promise<PredictionResponse[]> {
  try {
    const response = await fetch(`${API_BASE}/api/predictions/history/${userId}`);
    if (!response.ok) throw new Error(`Failed to fetch history: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    console.error('History fetch error:', error);
    return [];
  }
}

export async function getHighRiskPatients(): Promise<PredictionResponse[]> {
  try {
    const response = await fetch(`${API_BASE}/api/predictions/high-risk`);
    if (!response.ok) throw new Error(`Failed to fetch high-risk patients: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    console.error('High-risk fetch error:', error);
    return [];
  }
}

export async function getRiskTrends(userId: string, disease: string): Promise<{
  dates: string[];
  scores: number[];
}> {
  try {
    const response = await fetch(`${API_BASE}/api/predictions/trends/${userId}?disease=${disease}`);
    if (!response.ok) throw new Error(`Failed to fetch trends: ${response.status}`);
    return await response.json();
  } catch (error: any) {
    console.error('Trends fetch error:', error);
    return { dates: [], scores: [] };
  }
}

