import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Voice from './pages/Voice';
import Disease from './pages/Disease';
import Weather from './pages/Weather';
import Market from './pages/Market';
import Schemes from './pages/Schemes';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Notifications from './pages/Notifications';
import NaturalFarming from './pages/NaturalFarming';
import CropCalendar from './pages/CropCalendar';
import NoResults from './pages/NoResults';
import DiseaseDetail from './pages/DiseaseDetail';
import BottomNav from './components/BottomNav';

// App content wrapper that uses Router hooks
const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const isOnboarded = localStorage.getItem('kisanmitra_onboarded');
    // If not onboarded and not on onboarding screen, redirect to onboarding
    if (!isOnboarded && !location.pathname.startsWith('/onboarding')) {
      navigate('/onboarding');
    }
  }, [location.pathname, navigate]);

  return (
    <div className="w-full max-w-[480px] min-h-screen mx-auto bg-[#fbf9f3] flex flex-col relative shadow-[0_0_24px_rgba(0,0,0,0.06)] border-x border-[#eae8e2]">
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/voice" element={<Voice />} />
          <Route path="/disease" element={<Disease />} />
          <Route path="/disease-detail" element={<DiseaseDetail />} />
          <Route path="/disease/:id" element={<DiseaseDetail />} />
          <Route path="/weather" element={<Weather />} />
          <Route path="/market" element={<Market />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/natural-farming" element={<NaturalFarming />} />
          <Route path="/calendar" element={<CropCalendar />} />
          <Route path="/search-results" element={<NoResults />} />
          <Route path="*" element={<NoResults />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
