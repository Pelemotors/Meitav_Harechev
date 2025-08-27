import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import CarsSection from './components/CarsSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import CarDetailPage from './components/CarDetailPage';
import AdminApp from './components/admin/AdminApp';

function App() {
  const HomePage = () => (
    <div className="min-h-screen" dir="rtl" id="home">
      <Header />
      <HeroSection />
      <ServicesSection />
      <CarsSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </div>
  );

  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/car/:id" element={<CarDetailPage />} />
        <Route path="/admin" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;