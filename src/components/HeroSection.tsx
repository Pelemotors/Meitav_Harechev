import React from 'react';
import { Wrench, Shield, Car, Users, DollarSign } from 'lucide-react';

const HeroSection = () => {
  const services = [
    {
      icon: <Car className="w-8 h-8 text-slc-bronze" />,
      title: "רכבים חדשים",
      description: "מגוון רחב של רכבים חדשים ממיטב היצרנים"
    },
    {
      icon: <Shield className="w-8 h-8 text-slc-bronze" />,
      title: "רכבים בדוקים",
      description: "כל הרכבים עוברים בדיקה מקיפה לפני המכירה"
    },
    {
      icon: <DollarSign className="w-8 h-8 text-slc-bronze" />,
      title: "מימון נוח",
      description: "אפשרויות מימון גמישות ותנאים מיוחדים"
    },
    {
      icon: <Users className="w-8 h-8 text-slc-bronze" />,
      title: "שירות אישי",
      description: "ליווי מקצועי לאורך כל תהליך הרכישה"
    }
  ];

  return (
    <section className="hero-gradient pt-[120px] pb-[100px]">
      <div className="container mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Service Cards - Right Side */}
          <div className="grid grid-cols-2 gap-6">
            {services.map((service, index) => (
              <div key={index} className="service-card">
                <div className="mb-4">
                  {service.icon}
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{service.title}</h3>
                <p className="text-white/80 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
          
          {/* Main Content - Left Side */}
          <div className="text-right">
            <h1 className="text-5xl font-bold mb-6">
              <span className="text-slc-bronze"> Strong Luxury Cars </span>
              <br />
              <span className="text-white">רכבים יוקרתיים במחירים הוגנים</span>
            </h1>
            
            <p className="text-white/90 text-lg mb-8 leading-relaxed">
              מגוון רחב של רכבים חדשים ומשומשים, בדוקים ומאושרים. 
              מימון נוח ושירות אישי מקצועי.
            </p>
            
            <div className="flex gap-4 justify-end">
              <a href="#cars" className="btn-primary text-lg px-8 py-3">
                צפה ברכבים
              </a>
              <a href="#contact" className="btn-secondary text-lg px-8 py-3">
                צור קשר
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;