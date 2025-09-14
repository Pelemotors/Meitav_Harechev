import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-neutral-900 text-white fixed top-0 left-0 right-0 z-50 h-[70px] border-b-2 border-primary-500">
      {/* Admin Login Link */}
      <div className="text-xs text-right px-8 py-1 bg-neutral-800/80">
        <a href="/admin" className="text-white/80 hover:text-white transition-colors">
          כניסה למנהלים
        </a>
      </div>
      
      <div className="flex justify-between items-center px-8 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-primary-400 hebrew">מיטב הרכב</span>
            <span className="text-xs text-white/80 english">Meitav HaRechev</span>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>050-7422522 / 053-5335540</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>חדרה, ישראל</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <a href="#home" className="hover:text-primary-400 transition-colors duration-300">בית</a>
          <a href="#cars" className="hover:text-primary-400 transition-colors duration-300">רכבים למכירה</a>
          <a href="/search" className="hover:text-primary-400 transition-colors duration-300">חיפוש מתקדם</a>
          <a href="#services" className="hover:text-primary-400 transition-colors duration-300">שירותים</a>
          <a href="#about" className="hover:text-primary-400 transition-colors duration-300">אודות</a>
          <a href="#contact" className="hover:text-primary-400 transition-colors duration-300">צור קשר</a>
        </nav>
        
      </div>
    </header>
  );
};

export default Header;