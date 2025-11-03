import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Heart, Cross, TrendingUp, TrendingDown, AlertCircle, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import { getPredictionHistory, getRiskTrends, type PredictionResponse, type DiseaseRisk } from '../services/diseasePrediction';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';

const PatientDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [history, setHistory] = useState<PredictionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<'diabetes' | 'heart_failure' | 'cancer' | null>(null);
  const [trendData, setTrendData] = useState<{ dates: string[]; scores: number[] }>({ dates: [], scores: [] });

  const loadHistory = async (isRefresh = false) => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      console.log('Loading prediction history for user:', user.id);
      const hist = await getPredictionHistory(user.id);
      console.log('Loaded history:', hist);
      setHistory(hist || []);
    } catch (error) {
      console.error('Failed to load history', error);
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Wait a bit for auth to initialize
    const timer = setTimeout(() => {
      if (user?.id) {
        loadHistory();
      } else if (!isAuthenticated) {
        // Not authenticated, stop loading
        setLoading(false);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user?.id, isAuthenticated]);

  // Refresh when navigating to dashboard
  useEffect(() => {
    if (location.pathname === '/patient-dashboard' && user?.id) {
      console.log('Navigated to dashboard, refreshing history...');
      loadHistory(true);
    }
  }, [location.pathname, user?.id]);

  // Refresh history when component becomes visible (e.g., navigating back to dashboard)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user?.id) {
        console.log('Dashboard visible, refreshing history...');
        loadHistory();
      }
    };

    const handleFocus = () => {
      if (user?.id) {
        console.log('Window focused, refreshing history...');
        loadHistory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user?.id]);

  useEffect(() => {
    if (user?.id && selectedDisease) {
      loadTrends(selectedDisease);
    }
  }, [user?.id, selectedDisease]);

  const loadTrends = async (disease: string) => {
    if (!user?.id) return;
    try {
      const trends = await getRiskTrends(user.id, disease);
      setTrendData(trends);
    } catch (error) {
      console.error('Failed to load trends', error);
    }
  };

  const latestPrediction = history[0];
  const previousPrediction = history[1];

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-green-600 bg-green-50';
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
      case 'diabetes': return 'Diabetes';
      case 'heart_failure': return 'Heart Failure';
      case 'cancer': return 'Cancer';
      default: return disease;
    }
  };

  const getRiskChange = (current: number, previous: number) => {
    const change = current - previous;
    return {
      value: Math.abs(change).toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-12 max-w-md">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to view your health dashboard.</p>
          <Link
            to="/disease-risk-prediction"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors mr-4"
          >
            Get Started
          </Link>
          <button
            onClick={() => {
              const modal = document.querySelector('[data-login-modal]') as HTMLElement;
              if (modal) {
                const button = document.querySelector('[data-login-button]') as HTMLElement;
                button?.click();
              }
            }}
            className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Health Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Track your disease risk predictions and monitor your health over time
          </p>
          <div className="flex gap-4">
            <Link
              to="/disease-risk-prediction"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Activity className="h-5 w-5 mr-2" />
              New Risk Assessment
            </Link>
            <button
              onClick={() => {
                console.log('Manual refresh triggered');
                loadHistory(true);
              }}
              disabled={refreshing}
              className="inline-flex items-center bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </motion.div>

        {latestPrediction ? (
          <>
            {/* Overall Risk Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Overall Risk Score</p>
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {latestPrediction.overallRiskScore.toFixed(1)}%
                </p>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(latestPrediction.alertLevel)}`}>
                    {latestPrediction.alertLevel.toUpperCase()}
                  </span>
                  {previousPrediction && (
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      {getRiskChange(latestPrediction.overallRiskScore, previousPrediction.overallRiskScore).direction === 'up' ? (
                        <TrendingUp className="h-4 w-4 text-red-600" />
                      ) : getRiskChange(latestPrediction.overallRiskScore, previousPrediction.overallRiskScore).direction === 'down' ? (
                        <TrendingDown className="h-4 w-4 text-green-600" />
                      ) : null}
                      {getRiskChange(latestPrediction.overallRiskScore, previousPrediction.overallRiskScore).direction !== 'stable' &&
                        `${getRiskChange(latestPrediction.overallRiskScore, previousPrediction.overallRiskScore).value}% from last assessment`
                      }
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Latest Assessment</p>
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-lg font-semibold text-gray-900 mb-2">
                  {new Date(latestPrediction.timestamp).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(latestPrediction.timestamp).toLocaleTimeString()}
                </p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">Total Assessments</p>
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-4xl font-bold text-gray-900 mb-2">{history.length}</p>
                <p className="text-sm text-gray-600">Predictions recorded</p>
              </div>
            </motion.div>

            {/* Disease Risk Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {latestPrediction.risks.map((risk, index) => {
                const prevRisk = previousPrediction?.risks.find(r => r.disease === risk.disease);
                const change = prevRisk ? getRiskChange(risk.riskScore, prevRisk.riskScore) : null;
                
                return (
                  <div
                    key={risk.disease}
                    onClick={() => setSelectedDisease(risk.disease as any)}
                    className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all border-2 ${
                      selectedDisease === risk.disease ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${getRiskColor(risk.riskLevel)}`}>
                          {getRiskIcon(risk.disease)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{getDiseaseName(risk.disease)}</p>
                          <p className="text-xs text-gray-600">{risk.riskLevel.toUpperCase()} RISK</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-3xl font-bold text-gray-900 mb-2">{risk.riskScore}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            risk.riskLevel === 'critical' ? 'bg-red-600' :
                            risk.riskLevel === 'high' ? 'bg-orange-600' :
                            risk.riskLevel === 'moderate' ? 'bg-yellow-600' : 'bg-green-600'
                          }`}
                          style={{ width: `${risk.riskScore}%` }}
                        />
                      </div>
                    </div>

                    {change && change.direction !== 'stable' && (
                      <div className="flex items-center gap-2 text-sm">
                        {change.direction === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-red-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-green-600" />
                        )}
                        <span className={change.direction === 'up' ? 'text-red-600' : 'text-green-600'}>
                          {change.value}% {change.direction === 'up' ? 'increase' : 'decrease'}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t">
                      <p className="text-xs font-semibold text-gray-700 mb-2">Top Risk Factors:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {risk.factors.slice(0, 2).map((factor, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-red-500">•</span>
                            <span>{factor}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </motion.div>

            {/* Risk Trend Visualization */}
            {selectedDisease && trendData.dates.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-6 mb-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Risk Trend: {getDiseaseName(selectedDisease)}
                </h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {trendData.scores.map((score, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className={`w-full rounded-t ${
                          score >= 70 ? 'bg-red-600' :
                          score >= 50 ? 'bg-orange-600' :
                          score >= 30 ? 'bg-yellow-600' : 'bg-green-600'
                        }`}
                        style={{ height: `${(score / 100) * 240}px` }}
                        title={`${score}%`}
                      />
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(trendData.dates[index]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Preventive Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 mb-8"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6">Your Preventive Action Plan</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPrediction.preventivePlan.immediateActions.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-semibold text-red-900 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Immediate Actions
                    </p>
                    <ul className="space-y-2 text-sm text-red-800">
                      {latestPrediction.preventivePlan.immediateActions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-red-500 mt-1">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Medical Checkups
                  </p>
                  <ul className="space-y-2 text-sm text-blue-800">
                    {latestPrediction.preventivePlan.medicalCheckups.map((checkup, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{checkup}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Lifestyle Changes
                  </p>
                  <ul className="space-y-2 text-sm text-green-800">
                    {latestPrediction.preventivePlan.lifestyleChanges.slice(0, 3).map((change, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                <p className="text-sm font-semibold text-blue-900">Timeline: {latestPrediction.preventivePlan.timeline}</p>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-12 text-center"
          >
            <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Predictions Yet</h2>
            <p className="text-gray-600 mb-6">
              Get started by completing your first disease risk assessment
            </p>
            <Link
              to="/disease-risk-prediction"
              className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Risk Assessment
            </Link>
          </motion.div>
        )}

        {/* Prediction History */}
        {history.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6">Prediction History</h3>
            <div className="space-y-4">
              {history.slice(0, 5).map((pred, index) => (
                <div key={pred.predictionId} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {new Date(pred.timestamp).toLocaleDateString()} {new Date(pred.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="text-sm text-gray-600">Overall Risk: {pred.overallRiskScore.toFixed(1)}%</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(pred.alertLevel)}`}>
                    {pred.alertLevel}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;

