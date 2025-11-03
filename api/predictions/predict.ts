import type { VercelRequest, VercelResponse } from '@vercel/node';

// Disease risk prediction logic (simplified version)
function calculateDiabetesRisk(indicators: any): any {
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
  
  if (indicators.familyHistory?.diabetes) {
    riskScore += 15;
    factors.push('Family history of diabetes');
  }
  
  if (indicators.lifestyle?.exercise === 'none') {
    riskScore += 10;
    factors.push('Sedentary lifestyle');
    recommendations.push('Start with 150 minutes of moderate exercise per week');
  }
  
  if (indicators.lifestyle?.diet === 'poor') {
    riskScore += 10;
    factors.push('Poor diet quality');
    recommendations.push('Reduce processed foods and increase fiber intake');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  return {
    disease: 'diabetes',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue regular checkups'],
  };
}

function calculateHeartFailureRisk(indicators: any): any {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  const bpHigh = indicators.bloodPressureSystolic >= 140 || indicators.bloodPressureDiastolic >= 90;
  if (bpHigh) {
    riskScore += 25;
    factors.push('High blood pressure (≥140/90)');
    recommendations.push('Monitor blood pressure daily');
  }
  
  if (indicators.cholesterol >= 240) {
    riskScore += 20;
    factors.push('High cholesterol (≥240 mg/dL)');
    recommendations.push('Implement heart-healthy diet');
  }
  
  if (indicators.lifestyle?.smoking) {
    riskScore += 20;
    factors.push('Smoking');
    recommendations.push('Quit smoking immediately');
  }
  
  if (indicators.familyHistory?.heartDisease) {
    riskScore += 15;
    factors.push('Family history of heart disease');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  return {
    disease: 'heart_failure',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain healthy lifestyle'],
  };
}

function calculateCancerRisk(indicators: any): any {
  let riskScore = 0;
  const factors: string[] = [];
  const recommendations: string[] = [];
  
  if (indicators.age >= 65) {
    riskScore += 20;
    factors.push('Age-related cancer risk (65+)');
  }
  
  if (indicators.lifestyle?.smoking) {
    riskScore += 25;
    factors.push('Smoking (lung, throat, and multiple cancers)');
    recommendations.push('Quit smoking');
  }
  
  if (indicators.familyHistory?.cancer) {
    riskScore += 15;
    factors.push('Family history of cancer');
  }
  
  if (indicators.bmi >= 30) {
    riskScore += 15;
    factors.push('Obesity (linked to multiple cancer types)');
    recommendations.push('Weight management and healthy diet');
  }
  
  let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'moderate';
  
  return {
    disease: 'cancer',
    riskScore: Math.min(100, Math.round(riskScore)),
    riskLevel,
    probability: riskScore / 100,
    factors,
    recommendations: recommendations.length > 0 ? recommendations : ['Continue preventive care'],
  };
}

function predictDiseaseRisk(indicators: any): { risks: any[]; overallRiskScore: number; alertLevel: string } {
  const risks: any[] = [];
  
  risks.push(calculateDiabetesRisk(indicators));
  risks.push(calculateHeartFailureRisk(indicators));
  risks.push(calculateCancerRisk(indicators));
  
  const overallRiskScore = risks.reduce((sum, risk) => sum + risk.riskScore, 0) / risks.length;
  
  let alertLevel: 'none' | 'medium' | 'high' | 'critical' = 'none';
  const maxRisk = Math.max(...risks.map(r => r.riskScore));
  if (maxRisk >= 80) alertLevel = 'critical';
  else if (maxRisk >= 60) alertLevel = 'high';
  else if (maxRisk >= 40) alertLevel = 'medium';
  
  return { risks, overallRiskScore, alertLevel };
}

function generatePreventivePlan(risks: any[], alertLevel: string): any {
  const immediateActions: string[] = [];
  const lifestyleChanges: string[] = [];
  const medicalCheckups: string[] = [];
  
  risks.forEach(risk => {
    if (risk.riskLevel === 'critical' || risk.riskLevel === 'high') {
      immediateActions.push(`Urgent: Consult specialist for ${risk.disease} risk`);
      medicalCheckups.push(`${risk.disease} screening within 1 month`);
    }
    risk.recommendations.forEach((rec: string) => lifestyleChanges.push(rec));
  });
  
  let timeline = 'Ongoing preventive care';
  if (alertLevel === 'critical') timeline = 'Immediate action required - 1 week';
  else if (alertLevel === 'high') timeline = 'High priority - 1 month';
  else if (alertLevel === 'medium') timeline = 'Medium priority - 3 months';
  
  return { immediateActions, lifestyleChanges, medicalCheckups, timeline };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, indicators } = req.body || {};
    
    if (!userId || !indicators) {
      return res.status(400).json({ error: 'userId and indicators are required' });
    }

    console.log('Processing prediction request for user:', userId);

    const { risks, overallRiskScore, alertLevel } = predictDiseaseRisk(indicators);
    const preventivePlan = generatePreventivePlan(risks, alertLevel);

    const predictionId = `pred_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const timestamp = new Date().toISOString();

    const predictionResponse = {
      userId,
      predictionId,
      timestamp,
      risks,
      overallRiskScore: Math.round(overallRiskScore * 10) / 10,
      alertLevel,
      preventivePlan,
    };

    // Note: In serverless functions, we can't use SQLite database
    // If you need persistence, consider using Vercel KV, Supabase, or MongoDB Atlas
    
    return res.status(200).json(predictionResponse);
  } catch (error: any) {
    console.error('Prediction error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to generate prediction' });
  }
}

