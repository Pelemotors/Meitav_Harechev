import React from 'react';
import { Wrench, Shield, Car, Settings, Zap, CheckCircle, DollarSign, Users, TrendingUp } from 'lucide-react';

const useWhatsApp = () => {
  const sendWhatsAppMessage = (service: string) => {
    const phoneNumber = '972505666620'; // מספר הטלפון עם קוד מדינה
    const message = `שלום, אני מעוניין לקבל פרטים נוספים על ${service}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // בדיקה אם זה מובייל
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.open(whatsappUrl, '_blank');
    } else {
      // במחשב נפתח את הטופס צור קשר
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return { sendWhatsAppMessage };
};

const ServicesSection = () => {
  const { sendWhatsAppMessage } = useWhatsApp();

  const services = [
    {
      icon: <Car className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "רכבים חדשים",
      features: [
        "מגוון רחב של יצרנים",
        "אחריות יצרן מלאה",
        "מימון נוח ותנאים מיוחדים",
        "שירות אישי מקצועי"
      ],
      price: "מגוון מחירים",
      buttonText: "צפה ברכבים"
    },
    {
      icon: <Shield className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "רכבים משומשים",
      features: [
        "רכבים בדוקים ומאושרים",
        "היסטוריה מלאה",
        "אחריות על כל רכב",
        "בדיקה מקיפה לפני מכירה"
      ],
      price: "מגוון מחירים",
      buttonText: "צפה ברכבים"
    },
    {
      icon: <DollarSign className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "מימון וליסינג",
      features: [
        "אפשרויות מימון גמישות",
        "תנאים מיוחדים",
        "אישור מהיר",
        "ליווי לאורך כל התהליך"
      ],
      price: "תנאים מיוחדים",
      buttonText: "חשב מימון"
    },
    {
      icon: <Users className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "שירות אישי",
      features: [
        "ייעוץ מקצועי",
        "התאמה אישית",
        "ליווי לאורך כל התהליך",
        "שירות לאחר המכירה"
      ],
      price: "ללא עלות",
      buttonText: "צור קשר"
    },
    {
      icon: <CheckCircle className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "החלפת רכב",
      features: [
        "הערכת רכב ישן",
        "החלפה נוחה",
        "תנאים מיוחדים",
        "הליך מהיר ופשוט"
      ],
      price: "הערכה חינם",
      buttonText: "הערך רכב"
    },
    {
      icon: <TrendingUp className="w-12 h-12 text-slc-bronze mb-4" />,
      title: "ביטוח רכב",
      features: [
        "השוואת מחירים",
        "כיסויים מקיפים",
        "תנאים מיטביים",
        "שירות אישי"
      ],
      price: "השוואה חינם",
      buttonText: "השווה מחירים"
    }
  ];

  return (
    <section id="services" className="section bg-white">
      <div className="container mx-auto px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-darkBlue mb-4">השירותים שלנו</h2>
          <p className="text-gray-600 text-lg">שירותי רכב מקצועיים ואמינים במקום אחד</p>
        </div>
        
        <div className="grid-3">
          {services.map((service, index) => (
            <div key={index} className="card hover:shadow-lg transition-shadow duration-300">
              <div className="text-center mb-6">
                {service.icon}
                <h3 className="text-xl font-bold text-darkBlue mb-4">{service.title}</h3>
              </div>
              
              <ul className="space-y-2 mb-6">
                {service.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-gray-700">
                    <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="text-center">
                <p className="text-primary font-bold text-lg mb-4">{service.price}</p>
                <button 
                  className="btn-primary w-full"
                  onClick={() => sendWhatsAppMessage(service.title)}
                >
                  פרטים נוספים
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;