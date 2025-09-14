import React from 'react';
import { Wrench, Shield, Car, Settings, Zap, CheckCircle, DollarSign, Users, TrendingUp } from 'lucide-react';

const useWhatsApp = () => {
  const sendWhatsAppMessage = (service: string, agentName: string) => {
    let phoneNumber = '';
    
    if (agentName === 'אסי') {
      phoneNumber = '972507422522'; // אסי
    } else if (agentName === 'אלון') {
      phoneNumber = '972535335540'; // אלון
    }
    
    const message = `שלום ${agentName}, אני מעוניין לקבל פרטים נוספים על ${service}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
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
                <div className="flex gap-2">
                  <button 
                    className="btn-primary flex-1 text-sm"
                    onClick={() => sendWhatsAppMessage(service.title, 'אסי')}
                  >
                    אסי
                  </button>
                  <button 
                    className="btn-primary flex-1 text-sm"
                    onClick={() => sendWhatsAppMessage(service.title, 'אלון')}
                  >
                    אלון
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;