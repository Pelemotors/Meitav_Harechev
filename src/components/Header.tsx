import React from 'react';
import { Phone, MapPin } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-slc-dark text-slc-white fixed top-0 left-0 right-0 z-50 h-[70px] border-b-2 border-slc-bronze">
      {/* Admin Login Link */}
      <div className="text-xs text-right px-8 py-1 bg-slc-dark-alt/80">
        <a href="/admin" className="text-slc-white/80 hover:text-slc-white transition-colors">
          כניסה למנהלים
        </a>
      </div>
      
      <div className="flex justify-between items-center px-8 h-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/SLC LOGO.jpg" 
            alt="Strong Luxury Cars" 
            className="w-12 h-12 object-contain"
          />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slc-bronze hebrew"> Strong Luxury Cars </span>
            <span className="text-xs text-slc-white/80 english">Strong Luxury Cars</span>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>09-123-4567</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>נתניה, ישראל</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <a href="#home" className="hover:text-slc-bronze transition-colors duration-300">בית</a>
          <a href="#cars" className="hover:text-slc-bronze transition-colors duration-300">רכבים למכירה</a>
          <a href="#services" className="hover:text-slc-bronze transition-colors duration-300">שירותים</a>
          <a href="#about" className="hover:text-slc-bronze transition-colors duration-300">אודות</a>
          <a href="#contact" className="hover:text-slc-bronze transition-colors duration-300">צור קשר</a>
        </nav>
        
        {/* CTA Button */}
        <a href="#cars" className="btn-primary">
          צפה ברכבים
        </a>
      </div>
    </header>
  );
};

export default Header;