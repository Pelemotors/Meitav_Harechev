import React from 'react';
import { Phone, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-neutral-900 text-white border-t-2 border-primary-500">
      <div className="container mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="text-right">
            <div className="flex items-center justify-end gap-3 mb-4">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-primary-400 hebrew">מיטב הרכב</span>
                <span className="text-xs text-white/80 english">Meitav HaRechev</span>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed hebrew">
              סוכנות רכב משפחתית בחדרה. 
              רכבים לכל כיס עם מחיר התחלתי של 5,000 ₪ ועד רכבים חדשים ומפוארים.
            </p>
          </div>
          
          {/* Services Links */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">שירותים</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#services" className="hover:text-primary-400 transition-colors duration-300">רכבי יוקרה למכירה</a></li>
              <li><a href="#services" className="hover:text-primary-400 transition-colors duration-300">שירותי מימון</a></li>
              <li><a href="#cars" className="hover:text-primary-400 transition-colors duration-300">נסיעות מבחן</a></li>
              <li><a href="#services" className="hover:text-primary-400 transition-colors duration-300">טרייד-אין</a></li>
              <li><a href="#services" className="hover:text-primary-400 transition-colors duration-300">שירותי יוקרה</a></li>
            </ul>
          </div>
          
          {/* Quick Links */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">קישורים מהירים</h4>
            <ul className="space-y-2 text-white/80">
              <li><a href="#home" className="hover:text-primary-400 transition-colors duration-300">בית</a></li>
              <li><a href="#about" className="hover:text-primary-400 transition-colors duration-300">אודות</a></li>
              <li><a href="#cars" className="hover:text-primary-400 transition-colors duration-300">רכבים למכירה</a></li>
              <li><a href="#contact" className="hover:text-primary-400 transition-colors duration-300">צור קשר</a></li>
              <li><a href="#contact" className="hover:text-primary-400 transition-colors duration-300">תנאי שימוש</a></li>
            </ul>
          </div>
          
          {/* Contact Info */}
          <div className="text-right">
            <h4 className="font-bold text-lg mb-4">יצירת קשר</h4>
            <div className="space-y-3 text-white/80">
              <div className="flex items-center justify-end gap-2">
                <span>חדרה</span>
                <MapPin className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <span>אסי: 050-7422522 | אלון: 053-5335540</span>
                <Phone className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-primary-500/20 mt-8 pt-8 text-center">
          <p className="text-white/60 hebrew">
            © 2024 מיטב הרכב - כל הזכויות שמורות
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;