import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Heart, Cross, Bell, TrendingUp, User, Calendar } from 'lucide-react';
import { getHighRiskPatients, type PredictionResponse, type DiseaseRisk } from '../services/diseasePrediction';

const ClinicianAlerts = () => {
  const [highRiskPatients, setHighRiskPatients] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<PredictionResponse | null>(null);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');

  useEffect(() => {
    loadHighRiskPatients();
    const interval = setInterval(loadHighRiskPatients, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadHighRiskPatients = async () => {
    try {
      const patients = await getHighRiskPatients();
      setHighRiskPatients(patients);
    } catch (error) {
      console.error('Failed to load high-risk patients', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = highRiskPatients.filter(patient => {
    if (filter === 'all') return true;
    return patient.alertLevel === filter;
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (disease: string) => {
    switch (disease) {
      case 'diabetes': return <Activity className="h-5 w-5" />;
      case 'heart_failure': return <Heart className="h-5 w-5" />;
      case 'cancer': return <Cross className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getDiseaseName = (disease: string) => {
    switch (disease) {
      case 'diabetes': return 'Diabetes';
      case 'heart_failure': return 'Heart Failure';
      case 'cancer': return 'Cancer';
      default: return disease;
    }
  };

  const getCriticalRisks = (risks: DiseaseRisk[]) => {
    return risks.filter(r => r.riskLevel === 'critical' || r.riskLevel === 'high');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading high-risk patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                Clinician Alert Dashboard
              </h1>
              <p className="text-xl text-gray-600">
                Monitor high-risk patients requiring immediate attention
              </p>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg shadow-lg p-4">
              <Bell className="h-6 w-6 text-red-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{filteredPatients.length}</p>
                <p className="text-sm text-gray-600">Alert{filteredPatients.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </motion.div>

          {/* Filter Tabs */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Patients ({highRiskPatients.length})
            </button>
            <button
              onClick={() => setFilter('critical')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Critical ({highRiskPatients.filter(p => p.alertLevel === 'critical').length})
            </button>
            <button
              onClick={() => setFilter('high')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                filter === 'high'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              High ({highRiskPatients.filter(p => p.alertLevel === 'high').length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Patient List */}
          <div className="lg:col-span-2 space-y-4">
            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-600">No high-risk patients found</p>
                <p className="text-sm text-gray-500 mt-2">All patients have low to moderate risk levels</p>
              </div>
            ) : (
              filteredPatients.map((patient, index) => {
                const criticalRisks = getCriticalRisks(patient.risks);
                return (
                  <motion.div
                    key={patient.predictionId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => setSelectedPatient(patient)}
                    className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all border-2 ${
                      selectedPatient?.predictionId === patient.predictionId
                        ? 'border-blue-500'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-100 rounded-full p-3">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">Patient ID: {patient.userId}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(patient.timestamp).toLocaleDateString()} {new Date(patient.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskColor(patient.alertLevel)}`}>
                        {patient.alertLevel.toUpperCase()}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Overall Risk Score</p>
                        <p className="text-2xl font-bold text-gray-900">{patient.overallRiskScore.toFixed(1)}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            patient.alertLevel === 'critical'
                              ? 'bg-red-600'
                              : patient.alertLevel === 'high'
                              ? 'bg-orange-600'
                              : 'bg-yellow-600'
                          }`}
                          style={{ width: `${patient.overallRiskScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Critical Risk Factors:</p>
                      {criticalRisks.map((risk) => (
                        <div
                          key={risk.disease}
                          className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          {getRiskIcon(risk.disease)}
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-900">
                              {getDiseaseName(risk.disease)} - {risk.riskScore}%
                            </p>
                            <p className="text-xs text-red-700">{risk.riskLevel.toUpperCase()} RISK</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {patient.preventivePlan.immediateActions.length > 0 && (
                      <div className="mt-4 p-3 bg-red-100 rounded-lg border border-red-300">
                        <p className="text-xs font-semibold text-red-900 mb-1">Immediate Actions Required:</p>
                        <ul className="text-xs text-red-800 space-y-1">
                          {patient.preventivePlan.immediateActions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{action}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Patient Details Panel */}
          <div className="lg:col-span-1">
            {selectedPatient ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 sticky top-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6">Patient Details</h3>

                <div className="space-y-6">
                  {/* Patient Info */}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Patient ID</p>
                    <p className="font-semibold text-gray-900">{selectedPatient.userId}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Prediction Time</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedPatient.timestamp).toLocaleString()}
                    </p>
                  </div>

                  {/* All Risks */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Disease Risk Assessment</p>
                    <div className="space-y-3">
                      {selectedPatient.risks.map((risk) => (
                        <div
                          key={risk.disease}
                          className={`p-4 rounded-lg border-2 ${getRiskColor(risk.riskLevel)}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getRiskIcon(risk.disease)}
                              <p className="font-semibold">{getDiseaseName(risk.disease)}</p>
                            </div>
                            <p className="text-lg font-bold">{risk.riskScore}%</p>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">Level: {risk.riskLevel.toUpperCase()}</p>
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-700 mb-1">Key Factors:</p>
                            <ul className="text-xs text-gray-600 space-y-1">
                              {risk.factors.slice(0, 3).map((factor, idx) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-red-500">•</span>
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Preventive Plan */}
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">Preventive Action Plan</p>
                    <div className="space-y-3">
                      {selectedPatient.preventivePlan.immediateActions.length > 0 && (
                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-xs font-semibold text-red-900 mb-2">Immediate Actions</p>
                          <ul className="text-xs text-red-800 space-y-1">
                            {selectedPatient.preventivePlan.immediateActions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-900 mb-2">Medical Checkups</p>
                        <ul className="text-xs text-blue-800 space-y-1">
                          {selectedPatient.preventivePlan.medicalCheckups.map((checkup, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Activity className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{checkup}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <p className="text-xs font-semibold text-green-900 mb-2">Lifestyle Changes</p>
                        <ul className="text-xs text-green-800 space-y-1">
                          {selectedPatient.preventivePlan.lifestyleChanges.slice(0, 3).map((change, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <TrendingUp className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Timeline</p>
                    <p className="text-sm text-gray-900">{selectedPatient.preventivePlan.timeline}</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a patient to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicianAlerts;

