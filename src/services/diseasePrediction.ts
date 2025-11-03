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
    sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
    sleepHours?: number;
    stressLevel?: 'none' | 'low' | 'moderate' | 'high';
    dailySteps?: number;
    waterIntake?: number; // in liters
    workSchedule?: 'standard' | 'shift' | 'night' | 'irregular';
    screenTime?: number; // hours per day
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

// Client-side prediction logic (fallback when backend is unavailable)
function calculateDiabetesRisk(indicators: HealthIndicators): DiseaseRisk {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  if (indicators.age >= 65) {
    riskScore += 25;
    factors.push('Advanced age (65+)');
  } else if (indicators.age >= 45) {
    riskScore += 15;
    factors.push('Age (45-64)');
  }
  
  if (indicators.bmi >= 30) {
    riskScore += 20;
    factors.push('Obesity (BMI ≥30)');
    recommendations.push('Work with a nutritionist to develop a weight loss plan');
  } else if (indicators.bmi >= 25) {
    riskScore += 10;
    factors.push('Overweight (BMI 25-29.9)');
    recommendations.push('Consider moderate exercise and dietary improvements');
  }
  
  if (indicators.glucose >= 126) {
    riskScore += 30;
    factors.push('Elevated blood glucose (≥126 mg/dL)');
    recommendations.push('Immediate medical consultation required for glucose levels');
  } else if (indicators.glucose >= 100) {
    riskScore += 15;
    factors.push('Pre-diabetic glucose levels (100-125 mg/dL)');
    recommendations.push('Monitor glucose levels monthly');
  }
  
  if (indicators.familyHistory.diabetes) {
    riskScore += 15;
    factors.push('Family history of diabetes');
  }
  
  if (indicators.lifestyle.exercise === 'none') {
    riskScore += 10;
    factors.push('Sedentary lifestyle');
    recommendations.push('Start with 150 minutes of moderate exercise per week');
  }
  
  if (indicators.lifestyle.diet === 'poor') {
    riskScore += 10;
    factors.push('Poor diet quality');
    recommendations.push('Reduce processed foods and increase fiber intake');
  }
  
  if (indicators.lifestyle.sleepQuality && indicators.lifestyle.sleepQuality === 'poor') {
    riskScore += 8;
    factors.push('Poor sleep quality');
    recommendations.push('Improve sleep hygiene and aim for 7-9 hours per night');
  }
  
  if (indicators.lifestyle.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) {
    riskScore += 5;
    factors.push(`Inadequate sleep (${indicators.lifestyle.sleepHours} hours)`);
    recommendations.push('Maintain consistent 7-9 hours of sleep per night');
  }
  
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 8;
    factors.push('High stress levels');
    recommendations.push('Implement stress management techniques (meditation, yoga)');
  }
  
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 5;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Increase daily steps to at least 7,000-10,000 steps');
  }
  
  if (indicators.lifestyle.waterIntake && indicators.lifestyle.waterIntake < 1.5) {
    riskScore += 3;
    factors.push(`Inadequate hydration (${indicators.lifestyle.waterIntake}L)`);
    recommendations.push('Increase water intake to 2-3 liters daily');
  }
  
  if (indicators.lifestyle.workSchedule === 'night' || indicators.lifestyle.workSchedule === 'shift') {
    riskScore += 5;
    factors.push('Irregular work schedule');
    recommendations.push('Maintain regular meal times despite shift work');
  }
  
  if (indicators.insulin > 20) {
    riskScore += 10;
    factors.push('Elevated insulin levels');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  if (riskLevel !== 'low') {
    recommendations.push('Schedule annual diabetes screening');
    recommendations.push('Maintain healthy weight through diet and exercise');
  }
  
  return {
    disease: 'diabetes',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue regular checkups'],
  };
}

function calculateHeartFailureRisk(indicators: HealthIndicators): DiseaseRisk {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  const bpHigh = indicators.bloodPressureSystolic >= 140 || indicators.bloodPressureDiastolic >= 90;
  if (bpHigh) {
    riskScore += 25;
    factors.push('High blood pressure (≥140/90)');
    recommendations.push('Monitor blood pressure daily');
    recommendations.push('Consult cardiologist for hypertension management');
  } else if (indicators.bloodPressureSystolic >= 120 || indicators.bloodPressureDiastolic >= 80) {
    riskScore += 10;
    factors.push('Elevated blood pressure (pre-hypertension)');
  }
  
  if (indicators.cholesterol >= 240) {
    riskScore += 20;
    factors.push('High cholesterol (≥240 mg/dL)');
    recommendations.push('Implement heart-healthy diet (Mediterranean or DASH)');
  } else if (indicators.cholesterol >= 200) {
    riskScore += 10;
    factors.push('Borderline high cholesterol (200-239 mg/dL)');
  }
  
  if (indicators.age >= 65) {
    riskScore += 15;
    factors.push('Age-related cardiovascular risk');
  }
  
  if (indicators.familyHistory.heartDisease) {
    riskScore += 15;
    factors.push('Family history of heart disease');
  }
  
  if (indicators.lifestyle.smoking) {
    riskScore += 20;
    factors.push('Smoking');
    recommendations.push('Quit smoking immediately - seek support programs');
  }
  
  if (indicators.lifestyle.alcohol === 'heavy') {
    riskScore += 10;
    factors.push('Heavy alcohol consumption');
    recommendations.push('Reduce alcohol intake to moderate levels');
  }
  
  if (indicators.lifestyle.exercise === 'none') {
    riskScore += 10;
    factors.push('Lack of physical activity');
    recommendations.push('Start cardiovascular exercise program');
  }
  
  if (indicators.lifestyle.sleepQuality && indicators.lifestyle.sleepQuality === 'poor') {
    riskScore += 8;
    factors.push('Poor sleep quality');
    recommendations.push('Address sleep apnea if present, improve sleep hygiene');
  }
  
  if (indicators.lifestyle.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) {
    riskScore += 5;
    factors.push(`Inadequate sleep (${indicators.lifestyle.sleepHours} hours)`);
    recommendations.push('Aim for 7-9 hours of quality sleep nightly');
  }
  
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 10;
    factors.push('High chronic stress');
    recommendations.push('Manage stress through relaxation techniques and counseling');
  }
  
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 7;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Increase cardiovascular activity gradually');
  }
  
  if (indicators.bmi >= 30) {
    riskScore += 10;
    factors.push('Obesity increases cardiac workload');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  if (riskLevel !== 'low') {
    recommendations.push('Annual cardiovascular screening recommended');
    recommendations.push('ECG and stress test consultation');
  }
  
  return {
    disease: 'heart_failure',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain healthy lifestyle'],
  };
}

function calculateCancerRisk(indicators: HealthIndicators): DiseaseRisk {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  if (indicators.age >= 65) {
    riskScore += 20;
    factors.push('Age-related cancer risk (65+)');
  } else if (indicators.age >= 50) {
    riskScore += 10;
    factors.push('Age-related cancer risk (50-64)');
  }
  
  if (indicators.lifestyle.smoking) {
    riskScore += 25;
    factors.push('Smoking (lung, throat, and multiple cancers)');
    recommendations.push('Quit smoking - consult smoking cessation programs');
  }
  
  if (indicators.lifestyle.alcohol === 'heavy') {
    riskScore += 15;
    factors.push('Heavy alcohol use (increases various cancer risks)');
    recommendations.push('Limit alcohol to recommended levels');
  }
  
  if (indicators.familyHistory.cancer) {
    riskScore += 15;
    factors.push('Family history of cancer');
    recommendations.push('Consider genetic counseling and screening');
  }
  
  if (indicators.bmi >= 30) {
    riskScore += 15;
    factors.push('Obesity (linked to multiple cancer types)');
    recommendations.push('Weight management and healthy diet');
  }
  
  if (indicators.lifestyle.exercise === 'none') {
    riskScore += 10;
    factors.push('Sedentary lifestyle');
    recommendations.push('Regular physical activity reduces cancer risk');
  }
  
  if (indicators.lifestyle.diet === 'poor') {
    riskScore += 10;
    factors.push('Poor diet quality');
    recommendations.push('Increase fruits, vegetables, and whole grains');
  }
  
  if (indicators.lifestyle.sleepQuality && indicators.lifestyle.sleepQuality === 'poor') {
    riskScore += 6;
    factors.push('Poor sleep quality (affects immune system)');
    recommendations.push('Improve sleep to boost immune function');
  }
  
  if (indicators.lifestyle.sleepHours && (indicators.lifestyle.sleepHours < 6 || indicators.lifestyle.sleepHours > 9)) {
    riskScore += 4;
    factors.push(`Inadequate sleep (${indicators.lifestyle.sleepHours} hours)`);
    recommendations.push('Maintain 7-9 hours of sleep for optimal immune health');
  }
  
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 7;
    factors.push('Chronic high stress');
    recommendations.push('Stress reduction techniques to lower inflammation');
  }
  
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 5;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Regular moderate exercise reduces cancer risk');
  }
  
  if (indicators.lifestyle.workSchedule === 'night') {
    riskScore += 5;
    factors.push('Night shift work');
    recommendations.push('Maintain healthy circadian rhythm patterns');
  }
  
  if (indicators.genetics.hasGeneticTesting && indicators.genetics.geneticRiskFactors?.length) {
    riskScore += 20;
    factors.push(`Genetic risk factors identified: ${indicators.genetics.geneticRiskFactors.join(', ')}`);
    recommendations.push('Enhanced screening protocol recommended');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  if (riskLevel !== 'low') {
    recommendations.push('Schedule annual cancer screening appropriate for age and risk factors');
  } else {
    recommendations.push('Maintain regular age-appropriate screenings');
  }
  
  return {
    disease: 'cancer',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue preventive care'],
  };
}

function generatePreventivePlan(
  risks: DiseaseRisk[],
  alertLevel: string
): {
  immediateActions: string[];
  lifestyleChanges: string[];
  medicalCheckups: string[];
  timeline: string;
} {
  const immediateActions: string[] = [];
  const lifestyleChanges: string[] = [];
  const medicalCheckups: string[] = [];
  
  risks.forEach(risk => {
    if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
      immediateActions.push(`Urgent: Consult specialist for ${risk.disease} risk`);
      medicalCheckups.push(`${risk.disease} screening within 1 month`);
    } else if (risk.riskLevel === 'moderate') {
      medicalCheckups.push(`${risk.disease} screening within 3 months`);
    }
    
    risk.recommendations.forEach(rec => {
      if (rec.toLowerCase().includes('immediate') || rec.toLowerCase().includes('urgent')) {
        immediateActions.push(rec);
      } else if (rec.toLowerCase().includes('exercise') || rec.toLowerCase().includes('diet') || rec.toLowerCase().includes('lifestyle')) {
        lifestyleChanges.push(rec);
      } else if (rec.toLowerCase().includes('screen') || rec.toLowerCase().includes('consult') || rec.toLowerCase().includes('medical')) {
        medicalCheckups.push(rec);
      } else {
        lifestyleChanges.push(rec);
      }
    });
  });
  
  const unique = (arr: string[]) => Array.from(new Set(arr));
  
  let timeline = 'Ongoing preventive care';
  if (alertLevel === 'critical') timeline = 'Immediate action required - 1 week';
  else if (alertLevel === 'high') timeline = 'High priority - 1 month';
  else if (alertLevel === 'medium') timeline = 'Medium priority - 3 months';
  
  return {
    immediateActions: unique(immediateActions),
    lifestyleChanges: unique(lifestyleChanges),
    medicalCheckups: unique(medicalCheckups),
    timeline,
  };
}

// Client-side prediction function (fallback)
function clientSidePredict(indicators: HealthIndicators): {
  risks: DiseaseRisk[];
  overallRiskScore: number;
  alertLevel: 'none' | 'medium' | 'high' | 'critical';
} {
  const risks: DiseaseRisk[] = [];
  
  const diabetesRisk = calculateDiabetesRisk(indicators);
  risks.push(diabetesRisk);
  
  const heartRisk = calculateHeartFailureRisk(indicators);
  risks.push(heartRisk);
  
  const cancerRisk = calculateCancerRisk(indicators);
  risks.push(cancerRisk);
  
  const overallRiskScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length;
  
  let alertLevel: 'none' | 'medium' | 'high' | 'critical' = 'none';
  const maxRisk = Math.max(...risks.map(r => r.riskScore));
  if (maxRisk >= 80) alertLevel = 'critical';
  else if (maxRisk >= 60) alertLevel = 'high';
  else if (maxRisk >= 40) alertLevel = 'medium';
  
  return { risks, overallRiskScore, alertLevel };
}

export async function predictDiseaseRisk(
  userId: string,
  indicators: HealthIndicators
): Promise<PredictionResponse> {
  try {
    const url = `${API_BASE}/api/predictions/predict`;
    console.log('Fetching from:', url);
    console.log('Request payload:', { userId, indicators });
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, indicators }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('Response status:', response.status, response.statusText);

    if (!response.ok) {
      // If server error, try to get error message, otherwise use fallback
      try {
        const error = await response.json();
        const errorMessage = error?.error || `Prediction failed: ${response.status} ${response.statusText}`;
        console.error('API Error:', errorMessage, error);
        // For 5xx errors or connection issues, use fallback
        if (response.status >= 500 || response.status === 0) {
          throw new Error('Backend unavailable');
        }
        throw new Error(errorMessage);
      } catch (parseError) {
        // If we can't parse the error, use fallback
        console.warn('Failed to parse error response, using client-side prediction');
        throw new Error('Backend unavailable');
      }
    }

    const result = await response.json();
    console.log('Prediction success:', result);
    return result;
  } catch (error: any) {
    // Catch all network errors, timeouts, CORS errors, etc.
    const isNetworkError = 
      error instanceof TypeError || 
      error instanceof DOMException ||
      error?.name === 'AbortError' ||
      error?.message?.includes('fetch') ||
      error?.message?.includes('network') ||
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('Backend unavailable') ||
      error?.code === 'NETWORK_ERROR' ||
      error?.code === 'ECONNREFUSED';
    
    if (isNetworkError || error?.message?.includes('Cannot connect to backend')) {
      console.warn('Backend unavailable, using client-side prediction:', error);
      // Fallback to client-side prediction
      const { risks, overallRiskScore, alertLevel } = clientSidePredict(indicators);
      const preventivePlan = generatePreventivePlan(risks, alertLevel);
      
      return {
        userId,
        predictionId: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: new Date().toISOString(),
        risks,
        overallRiskScore,
        alertLevel,
        preventivePlan,
      };
    }
    console.error('Prediction error:', error);
    throw error;
  }
}

export async function getPredictionHistory(userId: string): Promise<PredictionResponse[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE}/api/predictions/history/${userId}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status >= 500 || response.status === 0) {
        console.warn('Backend unavailable for history, returning empty array');
        return [];
      }
      throw new Error(`Failed to fetch history: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    // Silently fail for network errors, return empty array
    if (error instanceof TypeError || error?.name === 'AbortError' || error?.message?.includes('fetch')) {
      console.warn('Backend unavailable for history, returning empty array');
      return [];
    }
    console.error('History fetch error:', error);
    return [];
  }
}

export async function getHighRiskPatients(): Promise<PredictionResponse[]> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE}/api/predictions/high-risk`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status >= 500 || response.status === 0) {
        console.warn('Backend unavailable for high-risk patients, returning empty array');
        return [];
      }
      throw new Error(`Failed to fetch high-risk patients: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    // Silently fail for network errors, return empty array
    if (error instanceof TypeError || error?.name === 'AbortError' || error?.message?.includes('fetch')) {
      console.warn('Backend unavailable for high-risk patients, returning empty array');
      return [];
    }
    console.error('High-risk fetch error:', error);
    return [];
  }
}

export async function getRiskTrends(userId: string, disease: string): Promise<{
  dates: string[];
  scores: number[];
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${API_BASE}/api/predictions/trends/${userId}?disease=${disease}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status >= 500 || response.status === 0) {
        console.warn('Backend unavailable for trends, returning empty data');
        return { dates: [], scores: [] };
      }
      throw new Error(`Failed to fetch trends: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    // Silently fail for network errors, return empty data
    if (error instanceof TypeError || error?.name === 'AbortError' || error?.message?.includes('fetch')) {
      console.warn('Backend unavailable for trends, returning empty data');
      return { dates: [], scores: [] };
    }
    console.error('Trends fetch error:', error);
    return { dates: [], scores: [] };
  }
}
