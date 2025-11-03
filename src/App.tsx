import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Chatbots from './pages/Chatbots';
import GeneralHealthBot from './pages/GeneralHealthBot';
import MentalHealthBot from './pages/MentalHealthBot';
import ImageVoiceBot from './pages/ImageVoiceBot';
import Vaccination from './pages/Vaccination';
import WhatsAppSMS from './pages/WhatsAppSMS';
import About from './pages/About';
import Contact from './pages/Contact';
import FindDoctors from './pages/FindDoctors';
import DiseaseRiskPrediction from './pages/DiseaseRiskPrediction';
import PatientDashboard from './pages/PatientDashboard';
import ClinicianAlerts from './pages/ClinicianAlerts';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chatbots" element={<Chatbots />} />
              <Route path="/general-health-bot" element={<GeneralHealthBot />} />
              <Route path="/mental-health-bot" element={<MentalHealthBot />} />
              <Route path="/image-voice-bot" element={<ImageVoiceBot />} />
              <Route path="/find-doctors" element={<FindDoctors />} />
              <Route path="/vaccination" element={<Vaccination />} />
              <Route path="/whatsapp-sms" element={<WhatsAppSMS />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/disease-risk-prediction" element={<DiseaseRiskPrediction />} />
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/clinician-alerts" element={<ClinicianAlerts />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;