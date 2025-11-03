import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Activity, Heart, Cross, Loader } from 'lucide-react';
import { predictDiseaseRisk, getPredictionHistory, getRiskTrends, type HealthIndicators, type DiseaseRisk, type PredictionResponse } from '../services/diseasePrediction';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTranslation } from '../utils/translations';

const DiseaseRiskPrediction = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [formData, setFormData] = useState<HealthIndicators>({
    age: 35,
    gender: 'male',
    bmi: 25,
    bloodPressureSystolic: 120,
    bloodPressureDiastolic: 80,
    glucose: 95,
    insulin: 8,
    cholesterol: 180,
    triglycerides: 150,
    familyHistory: {
      diabetes: false,
      heartDisease: false,
      cancer: false,
    },
    lifestyle: {
      smoking: false,
      alcohol: 'moderate',
      exercise: 'moderate',
      diet: 'good',
      sleepQuality: 'good',
      sleepHours: 7,
      stressLevel: 'low',
      dailySteps: 5000,
      waterIntake: 2,
      workSchedule: 'standard',
      screenTime: 6,
    },
    genetics: {
      hasGeneticTesting: false,
      geneticRiskFactors: [],
    },
    clinicalData: {
      previousConditions: [],
      medications: [],
      allergies: [],
    },
  });

  const handlePredict = async () => {
    if (!user?.id) {
      alert('Please log in to use disease risk prediction');
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting prediction request...', { userId: user.id, formData });
      const result = await predictDiseaseRisk(user.id, formData);
      console.log('Prediction result:', result);
      setPrediction(result);
      loadHistory();
    } catch (error: any) {
      console.error('Prediction error details:', error);
      // Only show alert for non-network errors (the fallback should handle network errors)
      const errorMessage = error?.message || 'Failed to generate prediction';
      // Don't show alert for network errors as fallback should handle them
      if (!errorMessage.includes('fetch') && !errorMessage.includes('network') && !errorMessage.includes('Backend unavailable')) {
        alert(`Error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user?.id) return;
    try {
      const hist = await getPredictionHistory(user.id);
      setHistory(hist);
    } catch (error) {
      console.error('Failed to load history', error);
    }
  };

  React.useEffect(() => {
    if (user?.id && showHistory) {
      loadHistory();
    }
  }, [user?.id, showHistory]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getRiskIcon = (disease: string) => {
    switch (disease) {
      case 'diabetes': return <Activity className="h-6 w-6" />;
      case 'heart_failure': return <Heart className="h-6 w-6" />;
      case 'cancer': return <Cross className="h-6 w-6" />;
      default: return <Activity className="h-6 w-6" />;
    }
  };

  const getDiseaseName = (disease: string) => {
    switch (disease) {
      case 'diabetes': return getTranslation(language, 'prediction.disease.diabetes');
      case 'heart_failure': return getTranslation(language, 'prediction.disease.heartFailure');
      case 'cancer': return getTranslation(language, 'prediction.disease.cancer');
      default: return disease;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            {getTranslation(language, 'prediction.title')}
          </motion.h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {getTranslation(language, 'prediction.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-8"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">{getTranslation(language, 'prediction.healthIndicators')}</h2>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* BMI */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">BMI (Body Mass Index)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.bmi}
                    onChange={(e) => setFormData({ ...formData, bmi: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Underweight: &lt;18.5 | Normal: 18.5-24.9 | Overweight: 25-29.9 | Obese: ≥30</p>
                </div>

                {/* Blood Pressure */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Systolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={formData.bloodPressureSystolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureSystolic: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diastolic BP (mmHg)</label>
                    <input
                      type="number"
                      value={formData.bloodPressureDiastolic}
                      onChange={(e) => setFormData({ ...formData, bloodPressureDiastolic: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Blood Tests */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Glucose (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.glucose}
                      onChange={(e) => setFormData({ ...formData, glucose: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Insulin (μU/mL)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.insulin}
                      onChange={(e) => setFormData({ ...formData, insulin: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cholesterol (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.cholesterol}
                      onChange={(e) => setFormData({ ...formData, cholesterol: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Triglycerides (mg/dL)</label>
                    <input
                      type="number"
                      value={formData.triglycerides}
                      onChange={(e) => setFormData({ ...formData, triglycerides: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Family History */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Family History</h3>
                  <div className="space-y-2">
                    {['diabetes', 'heartDisease', 'cancer'].map((condition) => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.familyHistory[condition as keyof typeof formData.familyHistory] as boolean}
                          onChange={(e) => setFormData({
                            ...formData,
                            familyHistory: {
                              ...formData.familyHistory,
                              [condition]: e.target.checked,
                            },
                          })}
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700 capitalize">{condition.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Lifestyle */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Lifestyle</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Smoking</label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.lifestyle.smoking}
                          onChange={(e) => setFormData({
                            ...formData,
                            lifestyle: { ...formData.lifestyle, smoking: e.target.checked },
                          })}
                          className="mr-2 h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Currently smoking</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Alcohol Consumption</label>
                      <select
                        value={formData.lifestyle.alcohol}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, alcohol: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="moderate">Moderate</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Level</label>
                      <select
                        value={formData.lifestyle.exercise}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, exercise: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="light">Light</option>
                        <option value="moderate">Moderate</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Diet Quality</label>
                      <select
                        value={formData.lifestyle.diet}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, diet: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="poor">Poor</option>
                        <option value="moderate">Moderate</option>
                        <option value="good">Good</option>
                      </select>
                    </div>
                    
                    {/* Sleep Quality */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sleep Quality</label>
                      <select
                        value={formData.lifestyle.sleepQuality}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, sleepQuality: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="poor">Poor</option>
                        <option value="fair">Fair</option>
                        <option value="good">Good</option>
                        <option value="excellent">Excellent</option>
                      </select>
                    </div>
                    
                    {/* Sleep Hours */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Average Sleep Hours per Night</label>
                      <input
                        type="number"
                        min="0"
                        max="12"
                        step="0.5"
                        value={formData.lifestyle.sleepHours}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, sleepHours: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 7-9 hours</p>
                    </div>
                    
                    {/* Stress Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level</label>
                      <select
                        value={formData.lifestyle.stressLevel}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, stressLevel: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="none">None</option>
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    
                    {/* Daily Steps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Average Daily Steps</label>
                      <input
                        type="number"
                        min="0"
                        max="50000"
                        value={formData.lifestyle.dailySteps}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, dailySteps: parseInt(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 7,000-10,000 steps</p>
                    </div>
                    
                    {/* Water Intake */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Daily Water Intake (Liters)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        value={formData.lifestyle.waterIntake}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, waterIntake: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recommended: 2-3 liters</p>
                    </div>
                    
                    {/* Work Schedule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Work Schedule</label>
                      <select
                        value={formData.lifestyle.workSchedule}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, workSchedule: e.target.value as any },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="standard">Standard (9-5)</option>
                        <option value="shift">Shift Work</option>
                        <option value="night">Night Shift</option>
                        <option value="irregular">Irregular</option>
                      </select>
                    </div>
                    
                    {/* Screen Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Daily Screen Time (Hours)</label>
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.5"
                        value={formData.lifestyle.screenTime}
                        onChange={(e) => setFormData({
                          ...formData,
                          lifestyle: { ...formData.lifestyle, screenTime: parseFloat(e.target.value) || 0 },
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Includes phone, computer, TV</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <Loader className="animate-spin h-5 w-5 mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Predict Disease Risk'
                  )}
                </button>
              </div>
            </motion.div>

            {/* Prediction Results */}
            {prediction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Risk Assessment Results</h2>
                  <span className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold ${getRiskColor(prediction.alertLevel)}`}>
                    {prediction.alertLevel.toUpperCase()} RISK
                  </span>
                </div>

                {/* Overall Risk Score */}
                <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Overall Risk Score</p>
                      <p className="text-4xl font-bold text-gray-900">{prediction.overallRiskScore.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-12 w-12 text-blue-600" />
                  </div>
                </div>

                {/* Disease Risks */}
                <div className="space-y-4 mb-8">
                  {prediction.risks.map((risk: DiseaseRisk, index: number) => (
                    <div
                      key={risk.disease}
                      className={`border-2 rounded-xl p-4 sm:p-6 ${getRiskColor(risk.riskLevel)}`}
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-4 gap-3">
                        <div className="flex items-center gap-3">
                          {getRiskIcon(risk.disease)}
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold">{getDiseaseName(risk.disease)}</h3>
                            <p className="text-xs sm:text-sm text-gray-600">Risk Level: {risk.riskLevel.toUpperCase()}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-2xl sm:text-3xl font-bold">{risk.riskScore}%</p>
                          <p className="text-xs text-gray-600">Probability: {(risk.probability * 100).toFixed(1)}%</p>
                        </div>
                      </div>

                      {/* Risk Factors */}
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Key Risk Factors:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                          {risk.factors.map((factor, idx) => (
                            <li key={idx}>{factor}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Recommendations */}
                      <div>
                        <p className="text-sm font-semibold text-gray-700 mb-2">Recommendations:</p>
                        <ul className="space-y-2">
                          {risk.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preventive Plan */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preventive Action Plan</h3>
                  <div className="space-y-4">
                    {prediction.preventivePlan.immediateActions.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-red-700 mb-2">Immediate Actions:</p>
                        <ul className="space-y-1">
                          {prediction.preventivePlan.immediateActions.map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Lifestyle Changes:</p>
                      <ul className="space-y-1">
                        {prediction.preventivePlan.lifestyleChanges.map((change, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{change}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2">Medical Checkups:</p>
                      <ul className="space-y-1">
                        {prediction.preventivePlan.medicalCheckups.map((checkup, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <span>{checkup}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900">Timeline: {prediction.preventivePlan.timeline}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6"
            >
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors mb-4"
              >
                {showHistory ? 'Hide' : 'Show'} Prediction History
              </button>
            </motion.div>

            {/* History */}
            {showHistory && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl shadow-lg p-4 sm:p-6"
              >
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Previous Predictions</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">No previous predictions</p>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map((pred) => (
                      <div key={pred.predictionId} className="border border-gray-200 rounded-lg p-4">
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(pred.timestamp).toLocaleDateString()}
                        </p>
                        <p className="text-sm font-semibold text-gray-900">
                          Overall Risk: {pred.overallRiskScore.toFixed(1)}%
                        </p>
                        <span className={`text-xs px-2 py-1 rounded ${getRiskColor(pred.alertLevel)}`}>
                          {pred.alertLevel}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiseaseRiskPrediction;

