import React from 'react';
import { Wrench, Shield, Car, Users, DollarSign } from 'lucide-react';
import { useCheapestCarPrice } from '../utils/carPricing';

const HeroSection = () => {
  const { cheapestPrice, loading } = useCheapestCarPrice();
  
  const services = [
    {
      icon: <Car className="w-8 h-8 text-white" />,
      title: "רכבים לכל כיס",
      description: loading ? "טוען מחירים..." : cheapestPrice ? `החל מ-₪${cheapestPrice.toLocaleString()} ועד רכבים חדשים ומפוארים` : "החל מ-5,000 ₪ ועד רכבים חדשים ומפוארים"
    },
    {
      icon: <Shield className="w-8 h-8 text-white" />,
      title: "סוכנות משפחתית",
      description: "אמינה וחמה בחדרה עם שירות אישי"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-white" />,
      title: "מימון מותאם",
      description: "עבודה מול כל חברות המימון הגדולות"
    },
    {
      icon: <Users className="w-8 h-8 text-white" />,
      title: "ליווי מלא",
      description: "עד שתצאו לדרך עם הרכב המתאים לכם"
    }
  ];

  return (
    <section className="hero-gradient pt-[120px] pb-[100px] relative">
      <div className="container mx-auto px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Service Cards - Right Side */}
          <div className="grid grid-cols-2 gap-6 animate-slide-in-right">
            {services.map((service, index) => (
              <div key={index} className={`modern-card p-6 hover-lift animate-fade-in-up`} style={{ animationDelay: `${index * 0.2}s` }}>
                <div className="mb-4 animate-float" style={{ animationDelay: `${index * 0.5}s` }}>
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                    {service.icon}
                  </div>
                </div>
                <h3 className="text-neutral-800 font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
          
          {/* Main Content - Left Side */}
          <div className="text-right animate-slide-in-left">
            <div className="modern-card p-8 mb-8">
              <h1 className="text-6xl font-bold mb-6 animate-fade-in-up">
                <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent animate-pulse-slow">מיטב הרכב</span>
                <br />
                <span className="text-neutral-800 drop-shadow-lg">סוכנות הרכב של חדרה</span>
                <span className="text-4xl ml-2">🚗</span>
              </h1>
              
              <p className="text-neutral-700 text-xl mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                ברוכים הבאים למיטב הרכב!<br />
                אצלנו תמצאו מגוון רחב של רכבים – החל מ־5,000 ₪ ועד רכבים חדשים ומפוארים.<br />
                <span className="font-semibold text-primary-600">סוכנות משפחתית, אמינה וחמה בחדרה</span>, עם התחייבות לשירות אישי וליווי מלא עד שתצאו לדרך עם הרכב המתאים לכם ביותר.
              </p>
              
              <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
                <h3 className="text-neutral-800 text-2xl font-bold mb-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white">
                    📞
                  </div>
                  התקשרו עכשיו:
                </h3>
                <div className="flex gap-8 justify-end text-neutral-700">
                  <div className="hover-scale bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-neutral-200">
                    <span className="font-bold text-primary-600">אסי:</span> 
                    <span className="font-mono text-lg text-neutral-800">050-7422522</span>
                  </div>
                  <div className="hover-scale bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-neutral-200">
                    <span className="font-bold text-primary-600">אלון:</span> 
                    <span className="font-mono text-lg text-neutral-800">053-5335540</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 justify-end animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                <a href="#cars" className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                  צפה ברכבים
                </a>
                <a href="#contact" className="bg-white/90 backdrop-blur-sm text-neutral-800 font-bold text-lg px-8 py-4 rounded-xl border-2 border-neutral-300 hover:border-primary-500 hover:bg-white transition-all duration-300 shadow-lg">
                  צור קשר
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;