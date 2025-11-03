import Database from 'better-sqlite3';

// Types matching frontend
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
    waterIntake?: number;
    workSchedule?: 'standard' | 'shift' | 'night' | 'irregular';
    screenTime?: number;
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
  riskScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  probability: number;
  factors: string[];
  recommendations: string[];
  nextCheckup?: string;
}

export interface PredictionRecord {
  id: string;
  user_id: string;
  indicators: string; // JSON string
  predictions: string; // JSON string
  overall_risk_score: number;
  alert_level: string;
  created_at: string;
}

// ML Prediction Logic (can be replaced with actual ML model)
export function predictDiseaseRisk(indicators: HealthIndicators): {
  risks: DiseaseRisk[];
  overallRiskScore: number;
  alertLevel: 'none' | 'medium' | 'high' | 'critical';
} {
  const risks: DiseaseRisk[] = [];
  
  // Diabetes Risk Prediction
  const diabetesRisk = calculateDiabetesRisk(indicators);
  risks.push(diabetesRisk);
  
  // Heart Failure Risk Prediction
  const heartRisk = calculateHeartFailureRisk(indicators);
  risks.push(heartRisk);
  
  // Cancer Risk Prediction
  const cancerRisk = calculateCancerRisk(indicators);
  risks.push(cancerRisk);
  
  // Calculate overall risk score (average of all risks)
  const overallRiskScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length;
  
  // Determine alert level
  let alertLevel: 'none' | 'medium' | 'high' | 'critical' = 'none';
  const maxRisk = Math.max(...risks.map(r => r.riskScore));
  if (maxRisk >= 80) alertLevel = 'critical';
  else if (maxRisk >= 60) alertLevel = 'high';
  else if (maxRisk >= 40) alertLevel = 'medium';
  
  return { risks, overallRiskScore, alertLevel };
}

function calculateDiabetesRisk(indicators: HealthIndicators): DiseaseRisk {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  // Age factor (risk increases with age, especially after 45)
  if (indicators.age >= 65) {
    riskScore += 25;
    factors.push('Advanced age (65+)');
  } else if (indicators.age >= 45) {
    riskScore += 15;
    factors.push('Age (45-64)');
  }
  
  // BMI factor
  if (indicators.bmi >= 30) {
    riskScore += 20;
    factors.push('Obesity (BMI ≥30)');
    recommendations.push('Work with a nutritionist to develop a weight loss plan');
  } else if (indicators.bmi >= 25) {
    riskScore += 10;
    factors.push('Overweight (BMI 25-29.9)');
    recommendations.push('Consider moderate exercise and dietary improvements');
  }
  
  // Blood glucose
  if (indicators.glucose >= 126) {
    riskScore += 30;
    factors.push('Elevated blood glucose (≥126 mg/dL)');
    recommendations.push('Immediate medical consultation required for glucose levels');
  } else if (indicators.glucose >= 100) {
    riskScore += 15;
    factors.push('Pre-diabetic glucose levels (100-125 mg/dL)');
    recommendations.push('Monitor glucose levels monthly');
  }
  
  // Family history
  if (indicators.familyHistory.diabetes) {
    riskScore += 15;
    factors.push('Family history of diabetes');
  }
  
  // Lifestyle factors
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
  
  // Sleep factors
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
  
  // Stress factor
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 8;
    factors.push('High stress levels');
    recommendations.push('Implement stress management techniques (meditation, yoga)');
  }
  
  // Physical activity
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 5;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Increase daily steps to at least 7,000-10,000 steps');
  }
  
  // Water intake
  if (indicators.lifestyle.waterIntake && indicators.lifestyle.waterIntake < 1.5) {
    riskScore += 3;
    factors.push(`Inadequate hydration (${indicators.lifestyle.waterIntake}L)`);
    recommendations.push('Increase water intake to 2-3 liters daily');
  }
  
  // Work schedule (shift work affects metabolism)
  if (indicators.lifestyle.workSchedule === 'night' || indicators.lifestyle.workSchedule === 'shift') {
    riskScore += 5;
    factors.push('Irregular work schedule');
    recommendations.push('Maintain regular meal times despite shift work');
  }
  
  // Insulin resistance indicator
  if (indicators.insulin > 20) {
    riskScore += 10;
    factors.push('Elevated insulin levels');
  }
  
  // Determine risk level
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  // Default recommendations
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
  
  // Blood pressure
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
  
  // Cholesterol
  if (indicators.cholesterol >= 240) {
    riskScore += 20;
    factors.push('High cholesterol (≥240 mg/dL)');
    recommendations.push('Implement heart-healthy diet (Mediterranean or DASH)');
  } else if (indicators.cholesterol >= 200) {
    riskScore += 10;
    factors.push('Borderline high cholesterol (200-239 mg/dL)');
  }
  
  // Age
  if (indicators.age >= 65) {
    riskScore += 15;
    factors.push('Age-related cardiovascular risk');
  }
  
  // Family history
  if (indicators.familyHistory.heartDisease) {
    riskScore += 15;
    factors.push('Family history of heart disease');
  }
  
  // Lifestyle
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
  
  // Sleep factors (heart health)
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
  
  // Stress factor (chronically elevates blood pressure)
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 10;
    factors.push('High chronic stress');
    recommendations.push('Manage stress through relaxation techniques and counseling');
  }
  
  // Physical activity
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 7;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Increase cardiovascular activity gradually');
  }
  
  // BMI
  if (indicators.bmi >= 30) {
    riskScore += 10;
    factors.push('Obesity increases cardiac workload');
  }
  
  // Determine risk level
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
  
  // Age (cancer risk increases significantly with age)
  if (indicators.age >= 65) {
    riskScore += 20;
    factors.push('Age-related cancer risk (65+)');
  } else if (indicators.age >= 50) {
    riskScore += 10;
    factors.push('Age-related cancer risk (50-64)');
  }
  
  // Lifestyle - smoking (major cancer risk)
  if (indicators.lifestyle.smoking) {
    riskScore += 25;
    factors.push('Smoking (lung, throat, and multiple cancers)');
    recommendations.push('Quit smoking - consult smoking cessation programs');
  }
  
  // Lifestyle - alcohol
  if (indicators.lifestyle.alcohol === 'heavy') {
    riskScore += 15;
    factors.push('Heavy alcohol use (increases various cancer risks)');
    recommendations.push('Limit alcohol to recommended levels');
  }
  
  // Family history
  if (indicators.familyHistory.cancer) {
    riskScore += 15;
    factors.push('Family history of cancer');
    recommendations.push('Consider genetic counseling and screening');
  }
  
  // Obesity (linked to multiple cancers)
  if (indicators.bmi >= 30) {
    riskScore += 15;
    factors.push('Obesity (linked to multiple cancer types)');
    recommendations.push('Weight management and healthy diet');
  }
  
  // Exercise
  if (indicators.lifestyle.exercise === 'none') {
    riskScore += 10;
    factors.push('Sedentary lifestyle');
    recommendations.push('Regular physical activity reduces cancer risk');
  }
  
  // Diet
  if (indicators.lifestyle.diet === 'poor') {
    riskScore += 10;
    factors.push('Poor diet quality');
    recommendations.push('Increase fruits, vegetables, and whole grains');
  }
  
  // Sleep and immune function
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
  
  // Stress and inflammation
  if (indicators.lifestyle.stressLevel === 'high') {
    riskScore += 7;
    factors.push('Chronic high stress');
    recommendations.push('Stress reduction techniques to lower inflammation');
  }
  
  // Physical activity
  if (indicators.lifestyle.dailySteps && indicators.lifestyle.dailySteps < 5000) {
    riskScore += 5;
    factors.push(`Low daily activity (${indicators.lifestyle.dailySteps} steps)`);
    recommendations.push('Regular moderate exercise reduces cancer risk');
  }
  
  // Work schedule
  if (indicators.lifestyle.workSchedule === 'night') {
    riskScore += 5;
    factors.push('Night shift work');
    recommendations.push('Maintain healthy circadian rhythm patterns');
  }
  
  // Genetics
  if (indicators.genetics.hasGeneticTesting && indicators.genetics.geneticRiskFactors?.length) {
    riskScore += 20;
    factors.push(`Genetic risk factors identified: ${indicators.genetics.geneticRiskFactors.join(', ')}`);
    recommendations.push('Enhanced screening protocol recommended');
  }
  
  // Determine risk level
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

export function generatePreventivePlan(
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
  
  // Remove duplicates
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

