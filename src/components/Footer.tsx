import React from 'react';
import { Phone, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slc-dark text-slc-white border-t-2 border-slc-bronze">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-3 mb-4">
              <img 
                src="/SLC LOGO.jpg" 
                alt="Strong Luxury Cars" 
                className="w-10 h-10 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-slc-bronze hebrew"> Strong Luxury Cars </span>
                <span className="text-xs text-slc-white/80 english">Strong Luxury Cars</span>
              </div>
            </div>
            <p className="text-slc-white/80 leading-relaxed hebrew">
              מרכז רכבי יוקרה מקצועי בנתניה. 
              מומחים ברכבי יוקרה עם 15 שנות ניסיון בתחום.
            </p>
          </div>
          
          {/* Services Links */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">שירותים</h4>
            <ul className="space-y-2 text-slc-white/80">
              <li><a href="#services" className="hover:text-slc-bronze transition-colors duration-300">רכבי יוקרה למכירה</a></li>
              <li><a href="#services" className="hover:text-slc-bronze transition-colors duration-300">שירותי מימון</a></li>
              <li><a href="#cars" className="hover:text-slc-bronze transition-colors duration-300">נסיעות מבחן</a></li>
              <li><a href="#services" className="hover:text-slc-bronze transition-colors duration-300">טרייד-אין</a></li>
              <li><a href="#services" className="hover:text-slc-bronze transition-colors duration-300">שירותי יוקרה</a></li>
            </ul>
          </div>
          
          {/* Quick Links */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-slc-white/80">
              <li><a href="#home" className="hover:text-slc-bronze transition-colors duration-300">בית</a></li>
              <li><a href="#about" className="hover:text-slc-bronze transition-colors duration-300">אודות</a></li>
              <li><a href="#cars" className="hover:text-slc-bronze transition-colors duration-300">רכבים למכירה</a></li>
              <li><a href="#contact" className="hover:text-slc-bronze transition-colors duration-300">צור קשר</a></li>
              <li><a href="#contact" className="hover:text-slc-bronze transition-colors duration-300">תנאי שימוש</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">יצירת קשר</h4>
            <div className="space-y-3 text-slc-white/80">
              <div className="flex items-center justify-end gap-2">
                <span>רחוב ברוך 123, נתניה</span>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span>09-123-4567</span>
                <Phone className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span>info@autotest.co.il</span>
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-slc-bronze/20 mt-8 pt-8 text-center">
          <p className="text-slc-white/60 hebrew">
            © 2024 Strong Luxury Cars - כל הזכויות שמורות
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;